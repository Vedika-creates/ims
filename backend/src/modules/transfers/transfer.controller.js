import { pool } from "../../config/db.js";

/* 1️⃣ GET ALL TRANSFER ORDERS */
export const getAllTransferOrders = async (req, res) => {
  try {
    const { status, from_warehouse, to_warehouse, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = "WHERE 1=1";
    const queryParams = [];
    let paramIndex = 1;
    
    if (status) {
      whereClause += ` AND t.status = $${paramIndex++}`;
      queryParams.push(status);
    }
    
    if (from_warehouse) {
      whereClause += ` AND t.from_warehouse_id = $${paramIndex++}`;
      queryParams.push(from_warehouse);
    }
    
    if (to_warehouse) {
      whereClause += ` AND t.to_warehouse_id = $${paramIndex++}`;
      queryParams.push(to_warehouse);
    }
    
    const result = await pool.query(`
      SELECT 
        t.*,
        fw.name as from_warehouse_name,
        tw.name as to_warehouse_name,
        app_user.name as approved_by_name,
        CASE 
          WHEN t.status = 'PENDING' THEN 'Waiting for approval'
          WHEN t.status = 'APPROVED' THEN 'Approved - Ready for transfer'
          WHEN t.status = 'REJECTED' THEN 'Rejected'
          WHEN t.status = 'IN_TRANSIT' THEN 'In transit'
          WHEN t.status = 'COMPLETED' THEN 'Completed'
          WHEN t.status = 'CANCELLED' THEN 'Cancelled'
        END as status_display,
        CASE 
          WHEN t.expected_transfer_date < CURRENT_DATE AND t.status IN ('PENDING', 'APPROVED') THEN true
          ELSE false
        END as is_overdue
      FROM transfer_orders t
      LEFT JOIN warehouses fw ON t.from_warehouse_id = fw.id
      LEFT JOIN warehouses tw ON t.to_warehouse_id = tw.id
      LEFT JOIN users app_user ON t.approved_by = app_user.id
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `, [...queryParams, limit, offset]);
    
    const countResult = await pool.query(`
      SELECT COUNT(*) as total
      FROM transfer_orders t
      ${whereClause}
    `, queryParams);
    
    res.json({
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        totalPages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* 2️⃣ GET TRANSFER ORDER BY ID */
export const getTransferOrderById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT 
        t.*,
        fw.name as from_warehouse_name,
        tw.name as to_warehouse_name,
        app_user.name as approved_by_name,
        COALESCE(
          json_agg(
            json_build_object(
              'id', toi.id,
              'item_id', toi.inventory_id,
              'item_name', i.name,
              'item_sku', i.sku,
              'quantity_requested', toi.quantity_requested,
              'quantity_approved', toi.quantity_approved,
              'quantity_transferred', toi.quantity_transferred,
              'unit_cost', toi.unit_cost,
              'total_cost', toi.quantity_requested * toi.unit_cost,
              'batch_number', toi.batch_number,
              'expiry_date', toi.expiry_date,
              'notes', toi.notes
            )
          ) FILTER (WHERE toi.id IS NOT NULL),
          '[]'::json
        ) as items
      FROM transfer_orders t
      LEFT JOIN warehouses fw ON t.from_warehouse_id = fw.id
      LEFT JOIN warehouses tw ON t.to_warehouse_id = tw.id
      LEFT JOIN users app_user ON t.approved_by = app_user.id
      LEFT JOIN transfer_order_items toi ON t.id = toi.transfer_order_id
      LEFT JOIN inventory i ON toi.inventory_id = i.id
      WHERE t.id = $1
      GROUP BY t.id, fw.name, tw.name, app_user.name
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Transfer order not found" });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* 3️⃣ CREATE TRANSFER ORDER */
export const createTransferOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const {
      from_warehouse_id,
      to_warehouse_id,
      priority = 'NORMAL',
      expected_transfer_date,
      notes,
      items
    } = req.body;
    
    // Validate warehouses are different
    if (from_warehouse_id === to_warehouse_id) {
      throw new Error('Source and destination warehouses must be different');
    }
    
    // Validate items
    if (!items || items.length === 0) {
      throw new Error('At least one item is required');
    }
    
    // Generate order number manually as fallback
    const month_part = new Date().toISOString().slice(5, 7);
    const year_part = new Date().toISOString().slice(2, 4);
    
    const seqResult = await client.query(`
      SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM '[0-9]+$') AS integer)), 0) + 1 as seq_num
      FROM transfer_orders
      WHERE order_number LIKE 'TO-' || $1 || $2 || '-%'
    `, [year_part, month_part]);
    
    const seq_num = seqResult.rows[0].seq_num;
    const order_number = `TO-${year_part}${month_part}-${seq_num.toString().padStart(4, '0')}`;
    
    // Create transfer order
    const orderResult = await client.query(`
      INSERT INTO transfer_orders (
        order_number, from_warehouse_id, to_warehouse_id, priority, 
        expected_transfer_date, notes
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      order_number, from_warehouse_id, to_warehouse_id, priority,
      expected_transfer_date, notes
    ]);
    
    const transferOrder = orderResult.rows[0];
    
    // Create transfer order items
    for (const item of items) {
      await client.query(`
        INSERT INTO transfer_order_items (
          transfer_order_id, inventory_id, quantity_requested, 
          unit_cost, batch_number, expiry_date, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        transferOrder.id,
        item.inventory_id,
        item.quantity_requested,
        item.unit_cost || 0,
        item.batch_number || null,
        item.expiry_date || null,
        item.notes || null
      ]);
    }
    
    await client.query('COMMIT');
    
    // Get the complete transfer order with items
    const fullResult = await pool.query(`
      SELECT 
        t.*,
        fw.name as from_warehouse_name,
        tw.name as to_warehouse_name,
        COALESCE(
          json_agg(
            json_build_object(
              'id', toi.id,
              'item_id', toi.inventory_id,
              'item_name', i.name,
              'item_sku', i.sku,
              'quantity_requested', toi.quantity_requested,
              'unit_cost', toi.unit_cost,
              'total_cost', toi.quantity_requested * toi.unit_cost,
              'batch_number', toi.batch_number,
              'expiry_date', toi.expiry_date
            )
          ) FILTER (WHERE toi.id IS NOT NULL),
          '[]'::json
        ) as items
      FROM transfer_orders t
      LEFT JOIN warehouses fw ON t.from_warehouse_id = fw.id
      LEFT JOIN warehouses tw ON t.to_warehouse_id = tw.id
      LEFT JOIN transfer_order_items toi ON t.id = toi.transfer_order_id
      LEFT JOIN inventory i ON toi.inventory_id = i.id
      WHERE t.id = $1
      GROUP BY t.id, fw.name, tw.name
    `, [transferOrder.id]);
    
    res.status(201).json(fullResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

/* 4️⃣ APPROVE TRANSFER ORDER */
export const approveTransferOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { items_approval, comments } = req.body;
    const approved_by = req.user.userId;
    
    // Check if transfer order exists and is in PENDING status
    const orderResult = await client.query(
      "SELECT * FROM transfer_orders WHERE id = $1 AND status = 'PENDING'",
      [id]
    );
    
    if (orderResult.rows.length === 0) {
      throw new Error('Transfer order not found or not in pending status');
    }
    
    // Update transfer order status
    await client.query(`
      UPDATE transfer_orders 
      SET status = 'APPROVED', approved_by = $1, approved_at = NOW(), updated_at = NOW()
      WHERE id = $2
    `, [approved_by, id]);
    
    // Update item approvals if provided
    if (items_approval && items_approval.length > 0) {
      for (const approval of items_approval) {
        await client.query(`
          UPDATE transfer_order_items 
          SET quantity_approved = $1, updated_at = NOW()
          WHERE transfer_order_id = $2 AND inventory_id = $3
        `, [approval.quantity_approved, id, approval.inventory_id]);
      }
    } else {
      // Auto-approve all requested quantities
      await client.query(`
        UPDATE transfer_order_items 
        SET quantity_approved = quantity_requested, updated_at = NOW()
        WHERE transfer_order_id = $1
      `, [id]);
    }
    
    // Create approval record
    await client.query(`
      INSERT INTO transfer_order_approvals (
        transfer_order_id, approver_id, status, comments, approved_at
      ) VALUES ($1, $2, 'APPROVED', $3, NOW())
    `, [id, approved_by, comments || null]);
    
    await client.query('COMMIT');
    
    res.json({ message: 'Transfer order approved successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

/* 5️⃣ REJECT TRANSFER ORDER */
export const rejectTransferOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { rejection_reason } = req.body;
    const approved_by = req.user.userId;
    
    if (!rejection_reason) {
      throw new Error('Rejection reason is required');
    }
    
    // Check if transfer order exists and is in PENDING status
    const orderResult = await client.query(
      "SELECT * FROM transfer_orders WHERE id = $1 AND status = 'PENDING'",
      [id]
    );
    
    if (orderResult.rows.length === 0) {
      throw new Error('Transfer order not found or not in pending status');
    }
    
    // Update transfer order status
    await client.query(`
      UPDATE transfer_orders 
      SET status = 'REJECTED', approved_by = $1, approved_at = NOW(), 
          rejection_reason = $2, updated_at = NOW()
      WHERE id = $3
    `, [approved_by, rejection_reason, id]);
    
    // Create rejection record
    await client.query(`
      INSERT INTO transfer_order_approvals (
        transfer_order_id, approver_id, status, comments, approved_at
      ) VALUES ($1, $2, 'REJECTED', $3, NOW())
    `, [id, approved_by, rejection_reason]);
    
    await client.query('COMMIT');
    
    res.json({ message: 'Transfer order rejected successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

/* 6️⃣ START TRANSFER */
export const startTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      UPDATE transfer_orders 
      SET status = 'IN_TRANSIT', actual_transfer_date = NOW(), updated_at = NOW()
      WHERE id = $1 AND status = 'APPROVED'
      RETURNING *
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transfer order not found or not approved' });
    }
    
    res.json({ message: 'Transfer started successfully', transfer_order: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* 7️⃣ COMPLETE TRANSFER */
export const completeTransfer = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { items_completed } = req.body;
    
    // Check if transfer order exists and is in IN_TRANSIT status
    const orderResult = await client.query(
      "SELECT * FROM transfer_orders WHERE id = $1 AND status = 'IN_TRANSIT'",
      [id]
    );
    
    if (orderResult.rows.length === 0) {
      throw new Error('Transfer order not found or not in transit');
    }
    
    const transferOrder = orderResult.rows[0];
    
    // Update transferred quantities
    if (items_completed && items_completed.length > 0) {
      for (const item of items_completed) {
        await client.query(`
          UPDATE transfer_order_items 
          SET quantity_transferred = $1, updated_at = NOW()
          WHERE transfer_order_id = $2 AND inventory_id = $3
        `, [item.quantity_transferred, id, item.inventory_id]);
        
        // Create stock movement records (this would integrate with your stock management system)
        await client.query(`
          INSERT INTO transfer_stock_movements (
            transfer_order_id, transfer_order_item_id, from_warehouse_id, to_warehouse_id,
            inventory_id, quantity, movement_type, created_by
          ) VALUES (
            $1, 
            (SELECT id FROM transfer_order_items WHERE transfer_order_id = $1 AND inventory_id = $3),
            $2, $3, $4, $5, 'TRANSFER_OUT', $6
          )
        `, [id, transferOrder.from_warehouse_id, transferOrder.to_warehouse_id, item.inventory_id, item.quantity_transferred, req.user.userId]);
        
        await client.query(`
          INSERT INTO transfer_stock_movements (
            transfer_order_id, transfer_order_item_id, from_warehouse_id, to_warehouse_id,
            inventory_id, quantity, movement_type, created_by
          ) VALUES (
            $1, 
            (SELECT id FROM transfer_order_items WHERE transfer_order_id = $1 AND inventory_id = $3),
            $2, $3, $4, $5, 'TRANSFER_IN', $6
          )
        `, [id, transferOrder.from_warehouse_id, transferOrder.to_warehouse_id, item.inventory_id, item.quantity_transferred, req.user.userId]);
      }
    }
    
    // Update transfer order status
    await client.query(`
      UPDATE transfer_orders 
      SET status = 'COMPLETED', completed_at = NOW(), updated_at = NOW()
      WHERE id = $1
    `, [id]);
    
    await client.query('COMMIT');
    
    res.json({ message: 'Transfer completed successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

/* 8️⃣ CANCEL TRANSFER ORDER */
export const cancelTransferOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellation_reason } = req.body;
    
    if (!cancellation_reason) {
      return res.status(400).json({ error: 'Cancellation reason is required' });
    }
    
    const result = await pool.query(`
      UPDATE transfer_orders 
      SET status = 'CANCELLED', notes = COALESCE(notes, '') || ' | Cancelled: ' || $2, updated_at = NOW()
      WHERE id = $1 AND status IN ('PENDING', 'APPROVED')
      RETURNING *
    `, [id, cancellation_reason]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transfer order not found or cannot be cancelled' });
    }
    
    res.json({ message: 'Transfer order cancelled successfully', transfer_order: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* 9️⃣ GET TRANSFER ORDER STATISTICS */
export const getTransferStatistics = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_transfers,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'IN_TRANSIT' THEN 1 END) in_transit,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) as rejected,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled,
        COALESCE(SUM(total_value), 0) as total_value,
        COALESCE(SUM(total_items), 0) as total_items
      FROM transfer_orders
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    `);
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
