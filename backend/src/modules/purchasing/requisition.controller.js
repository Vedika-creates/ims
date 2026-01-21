// Purchase Requisition Controller
// Auto-generate purchase requisitions based on stock levels
export const generateRequisitionsFromStockLevels = async (req, res) => {
  const client = await (await import("../../config/db.js")).pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log('🔍 Auto-generating requisitions from stock levels at:', new Date().toISOString());
    
    // Get a real user ID for requested_by ONCE (not inside loops)
    const userResult = await client.query(
      'SELECT id FROM users WHERE is_active = true LIMIT 1'
    );
    
    if (userResult.rows.length === 0) {
      throw new Error('No active users found in the system');
    }
    
    const requestedBy = userResult.rows[0].id;
    
    // Get items that need replenishment
    const result = await client.query(`
      SELECT 
        i.id,
        i.sku,
        i.name,
        i.reorder_point,
        i.safety_stock,
        i.lead_time_days,
        COALESCE(cs.current_stock, 0) as current_stock,
        CASE 
          WHEN COALESCE(cs.current_stock, 0) = 0 THEN 'out_of_stock'
          WHEN COALESCE(cs.current_stock, 0) <= i.reorder_point THEN 'low_stock'
          ELSE 'normal'
        END as stock_status,
        -- Calculate suggested reorder quantity
        CASE 
          WHEN COALESCE(cs.current_stock, 0) = 0 THEN 
            GREATEST(i.reorder_point + i.safety_stock, 1)
          WHEN COALESCE(cs.current_stock, 0) <= i.reorder_point THEN 
            GREATEST((i.reorder_point + i.safety_stock) - COALESCE(cs.current_stock, 0), 1)
          ELSE GREATEST(1, 1)
        END as suggested_quantity
      FROM inventory i
      LEFT JOIN vw_current_stock cs ON i.id = cs.item_id
      WHERE i.is_active = true 
        AND (
          COALESCE(cs.current_stock, 0) = 0 
          OR COALESCE(cs.current_stock, 0) <= i.reorder_point
        )
      ORDER BY 
        CASE 
          WHEN COALESCE(cs.current_stock, 0) = 0 THEN 1
          WHEN COALESCE(cs.current_stock, 0) <= i.reorder_point THEN 2
          ELSE 3
        END,
        i.name
    `);
    
    console.log(`✅ Found ${result.rows.length} items needing replenishment`);
    
    // Group items by stock status for separate processing
    const outOfStockItems = result.rows.filter(item => item.stock_status === 'out_of_stock');
    const lowStockItems = result.rows.filter(item => item.stock_status === 'low_stock');
    
    const generatedRequisitions = [];
    
    // Process out of stock items (urgent)
    for (const item of outOfStockItems) {
      // Use the already fetched requestedBy (no duplicate query)
      const prNumber = `PR-URGENT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const prResult = await client.query(
        `INSERT INTO purchase_requisitions (pr_number, requested_by, status)
         VALUES ($1, $2, 'PENDING')
         RETURNING *`,
        [prNumber, requestedBy]
      );
      
      const pr = prResult.rows[0];
      
      // Add item to requisition with proper quantity validation
      const reorderQuantity = Math.max(1, item.suggested_quantity || 1);
      if (reorderQuantity > 0) {
        await client.query(
          'INSERT INTO purchase_requisition_items (pr_id, item_id, quantity) VALUES ($1, $2, $3)',
          [pr.id, item.id, reorderQuantity]
        );
      }
      
      generatedRequisitions.push({
        id: pr.id,
        pr_number: pr.pr_number,
        status: pr.status,
        item_name: item.name,
        item_sku: item.sku,
        current_stock: item.current_stock,
        min_level: item.reorder_point,
        suggested_quantity: item.suggested_quantity,
        actual_quantity: reorderQuantity,
        stock_status: item.stock_status,
        urgency: 'Critical',
        auto_generated: true
      });
    }
    
    // Process low stock items (normal priority)
    for (const item of lowStockItems) {
      // Use the already fetched requestedBy (no duplicate query)
      const prNumber = `PR-REORDER-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const prResult = await client.query(
        `INSERT INTO purchase_requisitions (pr_number, requested_by, status)
         VALUES ($1, $2, 'PENDING')
         RETURNING *`,
        [prNumber, requestedBy]
      );
      
      const pr = prResult.rows[0];
      
      // Add item to requisition with proper quantity validation
      const reorderQuantity = Math.max(1, item.suggested_quantity || 1);
      if (reorderQuantity > 0) {
        await client.query(
          'INSERT INTO purchase_requisition_items (pr_id, item_id, quantity) VALUES ($1, $2, $3)',
          [pr.id, item.id, reorderQuantity]
        );
      }
      
      generatedRequisitions.push({
        id: pr.id,
        pr_number: pr.pr_number,
        status: pr.status,
        item_name: item.name,
        item_sku: item.sku,
        current_stock: item.current_stock,
        min_level: item.reorder_point,
        suggested_quantity: item.suggested_quantity,
        actual_quantity: reorderQuantity,
        stock_status: item.stock_status,
        urgency: 'Normal',
        auto_generated: true
      });
    }
    
    console.log(`✅ Generated ${generatedRequisitions.length} automatic requisitions`);
    
    await client.query('COMMIT');
    
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      success: true,
      message: `Generated ${generatedRequisitions.length} purchase requisitions from stock levels`,
      generated_requisitions: generatedRequisitions
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error generating requisitions from stock levels:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

export const getAllRequisitions = async (req, res) => {
  try {
    console.log('🔍 getAllRequisitions called at:', new Date().toISOString());
    const { pool } = await import("../../config/db.js");
      const result = await pool.query(`
      SELECT 
        pr.id,
        pr.pr_number,
        pr.status,
        pr.approved_by,
        pr.approved_at,
        pr.created_at
      FROM purchase_requisitions pr
      ORDER BY pr.created_at DESC
    `);
    
    console.log('✅ Query successful, rows:', result.rows.length);
    
    // Get items for each requisition
    const requisitionsWithItems = await Promise.all(
      result.rows.map(async (pr) => {
        try {
          const itemsResult = await pool.query(`
            SELECT 
              pri.id,
              pri.quantity,
              i.name as item_name,
              i.sku as item_sku,
              i.description as item_description,
              u.name as unit_of_measure
            FROM purchase_requisition_items pri
            LEFT JOIN inventory i ON i.id = pri.item_id
            LEFT JOIN units_of_measure u ON i.unit_of_measure_id = u.id
            WHERE pri.pr_id = $1
          `, [pr.id]);
          
          return {
            ...pr,
            requestedBy: 'Current User', // Simplified for now
            items: itemsResult.rows.map(item => ({
              id: item.id,
              sku: item.item_sku,
              name: item.item_name,
              quantity: item.quantity,
              unitPrice: 0, // Default price - should come from pricing table
              total: item.quantity * 0
            }))
          };
        } catch (error) {
          console.error('❌ Error fetching items for PR:', pr.id, error);
          return {
            ...pr,
            requestedBy: 'Current User',
            items: []
          };
        }
      })
    );
    
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(requisitionsWithItems);
  } catch (error) {
    console.error('❌ Error in getAllRequisitions at:', new Date().toISOString());
    console.error('❌ Error details:', error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createRequisition = async (req, res) => {
  const client = await (await import("../../config/db.js")).pool.connect();
  try {
    await client.query('BEGIN');
    
    const { requestedBy: requestedByFromRequest, items } = req.body;
    
    console.log('🛒 Creating requisition with data:', { requestedBy: requestedByFromRequest, items });
    
    // Simple validation
    if (!requestedByFromRequest || !items || items.length === 0) {
      return res.status(400).json({ error: 'Requested by and items are required' });
    }
    
    // Get a real user ID for requested_by
    const userResult = await client.query(
      'SELECT id FROM users WHERE is_active = true LIMIT 1'
    );
    
    if (userResult.rows.length === 0) {
      throw new Error('No active users found in the system');
    }
    
    const requestedBy = userResult.rows[0].id;
    
    // Create requisition with a real user
    const prResult = await client.query(
      `INSERT INTO purchase_requisitions (pr_number, requested_by, status)
       VALUES ($1, $2, 'PENDING')
       RETURNING *`,
      [`PR-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`, requestedBy]
    );
    
    const pr = prResult.rows[0];
    
    // Insert requisition items
    for (const item of items) {
      await client.query(
        'INSERT INTO purchase_requisition_items (pr_id, item_id, quantity) VALUES ($1, $2, $3)',
        [pr.id, item.id, item.quantity || 1]
      );
    }
    
    await client.query('COMMIT');
    
    console.log('✅ Requisition created successfully:', pr);
    
    res.status(201).json({
      id: pr.id,
      prNumber: pr.pr_number,
      requestedBy: 'Current User',
      status: pr.status,
      created_at: pr.created_at,
      items: items.map(item => ({
        ...item,
        total: item.quantity * (item.unitPrice || 0)
      })),
      justification: '',
      urgency: 'Normal'
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating requisition:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};
// Add this function before the exports section
export const deleteRequisition = async (req, res) => {
  const client = await (await import("../../config/db.js")).pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    
    // First delete the related items
    await client.query(
      'DELETE FROM purchase_requisition_items WHERE pr_id = $1',
      [id]
    );
    
    // Then delete the requisition
    const result = await client.query(
      'DELETE FROM purchase_requisitions WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Requisition not found' });
    }
    
    await client.query('COMMIT');
    res.json({ message: 'Requisition deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting requisition:', error);
    res.status(500).json({ 
      message: 'Error deleting requisition', 
      error: error.message 
    });
  } finally {
    client.release();
  }
};

export const updateRequisition = async (req, res) => {
  const client = await (await import("../../config/db.js")).pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    const reqPath = req.route.path;
    
    console.log('🔄 Updating requisition:', id, 'path:', reqPath);
    
    // Determine the status based on the endpoint
    let dbStatus;
    if (reqPath.includes('/approve')) {
      dbStatus = 'APPROVED';
    } else if (reqPath.includes('/reject')) {
      dbStatus = 'REJECTED';
    } else if (status) {
      dbStatus = status.toUpperCase();
    } else {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    let updateQuery, updateParams;
    
    if (dbStatus === 'APPROVED') {
      // For approval, we need to set both approved_at and approved_by
      // Get a real user ID for approved_by
      const userResult = await client.query(
        'SELECT id FROM users WHERE is_active = true LIMIT 1'
      );
      
      if (userResult.rows.length === 0) {
        throw new Error('No active users found in the system');
      }
      
      const approvedBy = userResult.rows[0].id;
      
      // Update requisition status first
      updateQuery = `
        UPDATE purchase_requisitions 
        SET status = $1, 
            approved_at = NOW(),
            approved_by = $2
        WHERE id = $3 
        RETURNING *
      `;
      updateParams = [dbStatus, approvedBy, id];
      
      // Execute requisition update
      const requisitionResult = await client.query(updateQuery, updateParams);
      const updatedRequisition = requisitionResult.rows[0];
      
      // Auto-create Purchase Order from approved requisition
      console.log('🚀 Auto-creating Purchase Order from requisition:', updatedRequisition.pr_number);
      
      // Check if PO already exists for this requisition
      const existingPO = await client.query(
        'SELECT po_number FROM purchase_orders WHERE po_number LIKE $1',
        [`%${updatedRequisition.pr_number}%`]
      );
      
      if (existingPO.rows.length > 0) {
        console.log('ℹ️ PO already exists for this requisition:', existingPO.rows[0].po_number);
        return res.status(200).json(updatedRequisition);
      }
      
      // Get requisition items with supplier info
      const itemsResult = await client.query(`
        SELECT pri.item_id, pri.quantity, i.supplier_id, s.name as supplier_name
        FROM purchase_requisition_items pri
        LEFT JOIN inventory i ON i.id = pri.item_id
        LEFT JOIN suppliers s ON s.id = i.supplier_id
        WHERE pri.pr_id = $1
      `, [id]);
      
      if (itemsResult.rows.length > 0) {
        // Group items by supplier
        const itemsBySupplier = {};
        const defaultSupplierId = '9e44dbf1-9b5d-4f51-b717-58eeb0a38e1c';
        const defaultSupplierName = 'Furniture Plus';
        
        itemsResult.rows.forEach(item => {
          const supplierId = item.supplier_id || defaultSupplierId;
          const supplierName = item.supplier_name || defaultSupplierName;
          
          if (!itemsBySupplier[supplierId]) {
            itemsBySupplier[supplierId] = {
              supplierId,
              supplierName,
              items: []
            };
          }
          
          itemsBySupplier[supplierId].items.push({
            item_id: item.item_id,
            quantity: item.quantity
          });
        });
        
        // Create separate PO for each supplier
        for (const [supplierId, supplierData] of Object.entries(itemsBySupplier)) {
          // Generate PO number
          const poNumber = `PO-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`;
          
          // Create Purchase Order
          const poResult = await client.query(`
            INSERT INTO purchase_orders (po_number, supplier_id, status, created_by, approved_by, approved_at, expected_delivery_date)
            VALUES ($1, $2, 'APPROVED', $3, $4, NOW(), $5)
            RETURNING *
          `, [
            poNumber,
            supplierId,
            approvedBy,
            approvedBy,
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
          ]);
          
          const newPO = poResult.rows[0];
          console.log(`✅ Purchase Order created: ${newPO.po_number} for ${supplierData.supplierName}`);
          
          // Add items to Purchase Order
          for (const item of supplierData.items) {
            await client.query(`
              INSERT INTO purchase_order_items (po_id, item_id, quantity, unit_price)
              VALUES ($1, $2, $3, 100)
            `, [newPO.id, item.item_id, item.quantity]);
          }
          
          console.log(`✅ Items added to Purchase Order: ${supplierData.items.length} items`);
        }
      }
    } else if (dbStatus === 'REJECTED') {
      // For rejection, we need to set rejection reason
      // Get a real user ID for approved_by
      const userResult = await client.query(
        'SELECT id FROM users WHERE is_active = true LIMIT 1'
      );
      
      if (userResult.rows.length === 0) {
        throw new Error('No active users found in the system');
      }
      
      const approvedBy = userResult.rows[0].id;
      updateQuery = `
        UPDATE purchase_requisitions 
        SET status = $1, 
            approved_at = NOW(),
            approved_by = $2
        WHERE id = $3 
        RETURNING *
      `;
      updateParams = [dbStatus, approvedBy, id];
    } else {
      // For other status updates
      updateQuery = `
        UPDATE purchase_requisitions 
        SET status = $1
        WHERE id = $2 
        RETURNING *
      `;
      updateParams = [dbStatus, id];
    }
    
    const result = await client.query(updateQuery, updateParams);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Purchase requisition not found" });
    }
    
    console.log('✅ Purchase requisition updated successfully:', result.rows[0]);
    
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error updating requisition:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};
