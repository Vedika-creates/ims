// Real Database Purchase Order Controller
export const getAllPurchaseOrders = async (req, res) => {
  try {
    console.log('🔍 getAllPurchaseOrders called at:', new Date().toISOString());
    const { pool } = await import("../../config/db.js");
    
    const result = await pool.query(`
      SELECT 
        po.id,
        po.po_number,
        po.status,
        po.created_at,
        po.approved_at,
        po.expected_delivery_date,
        s.name as supplier_name,
        po.supplier_id,
        COALESCE(SUM(poi.quantity), 0)::int as total_quantity,
        COALESCE(SUM(poi.quantity * 100), 0)::int as total_amount,
        'INR' as currency
      FROM purchase_orders po
      LEFT JOIN suppliers s ON s.id = po.supplier_id
      LEFT JOIN purchase_order_items poi ON poi.po_id = po.id
      GROUP BY po.id, po.po_number, po.status, po.created_at, po.approved_at, po.expected_delivery_date, s.name, po.supplier_id
      ORDER BY po.created_at DESC
    `);
    
    console.log('✅ Query successful, rows:', result.rows.length);
    console.log('📊 Sample row:', result.rows[0]);
    
    // Explicitly set headers and return
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('❌ Error in getAllPurchaseOrders at:', new Date().toISOString());
    console.error('❌ Error details:', error);
    console.error('❌ Error stack:', error.stack);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createPurchaseOrder = async (req, res) => {
  const client = await (await import("../../config/db.js")).pool.connect();
  try {
    await client.query('BEGIN');
    
    const { supplier_id, supplier_name, items, total_amount } = req.body;
    
    console.log('🛒 Creating PO with data:', { supplier_id, supplier_name, items, total_amount });
    
    // Simple validation
    if ((!supplier_id && !supplier_name) || !items || items.length === 0) {
      return res.status(400).json({ error: 'Supplier ID/name and items are required' });
    }
    
    let supplierId;
    
    // Handle both supplier_id (from dropdown) and supplier_name (fallback)
    if (supplier_id) {
      // Validate supplier_id exists and is active
      const supplierResult = await client.query(
        'SELECT id FROM suppliers WHERE id = $1 AND is_active = true',
        [supplier_id]
      );
      
      if (supplierResult.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid supplier ID' });
      }
      
      supplierId = supplier_id;
    } else if (supplier_name) {
      // Fallback to supplier_name lookup
      const supplierResult = await client.query(
        'SELECT id FROM suppliers WHERE name = $1 AND is_active = true',
        [supplier_name]
      );
      
      if (supplierResult.rows.length === 0) {
        return res.status(400).json({ error: 'Supplier not found' });
      }
      
      supplierId = supplierResult.rows[0].id;
    }
    
    // Get real user ID for created_by
    const userResult = await client.query(
      'SELECT id FROM users WHERE is_active = true LIMIT 1'
    );
    
    if (userResult.rows.length === 0) {
      throw new Error('No active users found in the system');
    }
    
    const createdById = userResult.rows[0].id;
    const poResult = await client.query(
      `INSERT INTO purchase_orders (po_number, supplier_id, status, created_by)
       VALUES ($1, $2, 'DRAFT', $3)
       RETURNING *`,
      [`PO-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`, supplierId, createdById]
    );
    
    const po = poResult.rows[0];
    
    // Insert PO items with proper validation
    for (const item of items) {
      // Validate each item has required fields
      if (!item.id || !item.quantity || item.quantity <= 0) {
        throw new Error(`Invalid item data: id and positive quantity required`);
      }
      
      // Verify item exists in inventory
      const itemResult = await client.query(
        'SELECT id, name FROM inventory WHERE id = $1 AND is_active = true',
        [item.id]
      );
      
      if (itemResult.rows.length === 0) {
        throw new Error(`Item with ID ${item.id} not found in inventory`);
      }
      
      await client.query(
        'INSERT INTO purchase_order_items (po_id, item_id, quantity, unit_price) VALUES ($1, $2, $3, $4)',
        [po.id, item.id, item.quantity, item.unit_price || 0]
      );
    }
    
    await client.query('COMMIT');
    
    console.log('✅ PO created successfully:', po);
    
    res.status(201).json({
      id: po.id,
      po_number: po.po_number,
      supplier_name,
      status: po.status,
      created_at: po.created_at,
      approved_at: po.approved_at,
      supplier_id: supplierId,
      total_quantity: items.reduce((sum, item) => sum + (item.quantity || 0), 0),
      total_amount: total_amount || items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unit_price || 0)), 0),
      currency: 'INR'
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating purchase order:', error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  } finally {
    client.release();
  }
};

export const getPurchaseOrderItems = async (req, res) => {
  try {
    const { id } = req.params;
    const { pool } = await import("../../config/db.js");
    
    const result = await pool.query(`
      SELECT 
        poi.id,
        poi.po_id,
        poi.item_id,
        poi.quantity,
        i.name as item_name,
        i.sku as item_sku,
        i.description as item_description
      FROM purchase_order_items poi
      LEFT JOIN inventory i ON i.id = poi.item_id
      WHERE poi.po_id = $1
      ORDER BY i.name
    `, [id]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching purchase order items:', error);
    res.status(500).json({ error: error.message });
  }
};

export const deletePurchaseOrder = async (req, res) => {
  const client = await (await import("../../config/db.js")).pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    
    console.log('🗑️ Deleting purchase order:', id);
    
    // Check if PO exists and can be deleted (only DRAFT or CANCELLED status)
    const poCheck = await client.query(
      'SELECT id, status FROM purchase_orders WHERE id = $1',
      [id]
    );
    
    if (poCheck.rows.length === 0) {
      return res.status(404).json({ error: "Purchase order not found" });
    }
    
    const po = poCheck.rows[0];
    
    // Only allow deletion of DRAFT or CANCELLED POs
    if (po.status !== 'DRAFT' && po.status !== 'CANCELLED') {
      return res.status(400).json({ 
        error: "Cannot delete purchase order. Only DRAFT or CANCELLED orders can be deleted." 
      });
    }
    
    // Delete PO items first (due to foreign key constraint)
    await client.query('DELETE FROM purchase_order_items WHERE po_id = $1', [id]);
    
    // Delete the PO
    const result = await client.query('DELETE FROM purchase_orders WHERE id = $1 RETURNING *', [id]);
    
    console.log('✅ Purchase order deleted successfully:', result.rows[0]);
    
    await client.query('COMMIT');
    res.json({ message: "Purchase order deleted successfully", deletedPO: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error deleting purchase order:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

export const updatePurchaseOrder = async (req, res) => {
  const client = await (await import("../../config/db.js")).pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { status } = req.body;
    
    console.log('🔄 Updating purchase order:', id, 'to status:', status);
    
    // Validate status against constraint
    const validStatuses = ['DRAFT', 'APPROVED', 'CANCELLED'];
    const dbStatus = status ? status.toUpperCase() : null;
    
    if (!dbStatus || !validStatuses.includes(dbStatus)) {
      return res.status(400).json({ 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }
    
    let updateQuery, updateParams;
    
    if (dbStatus === 'APPROVED') {
      // For approval, set approved_by to NULL to avoid foreign key constraint
      updateQuery = `
        UPDATE purchase_orders 
        SET status = $1, 
            approved_at = NOW(),
            approved_by = NULL
        WHERE id = $2 
        RETURNING *
      `;
      updateParams = [dbStatus, id];
    } else {
      // For other status updates
      updateQuery = `
        UPDATE purchase_orders 
        SET status = $1
        WHERE id = $2 
        RETURNING *
      `;
      updateParams = [dbStatus, id];
    }
    
    const result = await client.query(updateQuery, updateParams);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Purchase order not found" });
    }
    
    console.log('✅ Purchase order updated successfully:', result.rows[0]);
    
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error updating purchase order:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};
