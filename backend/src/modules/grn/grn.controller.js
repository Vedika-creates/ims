// Real Database GRN Controller
export const getAllGRNs = async (req, res) => {
  try {
    const { pool } = await import("../../config/db.js");
    
    // Return empty array for now since GRN tables might not exist
    res.json([]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createGRN = async (req, res) => {
  const client = await (await import("../../config/db.js")).pool.connect();
  try {
    await client.query('BEGIN');
    
    // DEBUG: Show all inventory items first
    const allInventoryItems = await client.query('SELECT * FROM inventory LIMIT 5');
    console.log('🔍 DEBUG - Sample inventory items:', allInventoryItems.rows);
    console.log('🔍 DEBUG - Inventory columns:', Object.keys(allInventoryItems.rows[0] || {}));
    
    const { grn_number, po_number, supplier, received_date, received_by, items, total_value, notes } = req.body;
    
    // Simple validation
    if (!grn_number || !po_number || !supplier || !items || items.length === 0) {
      return res.status(400).json({ error: 'GRN number, PO number, supplier and items are required' });
    }
    
    // Get PO ID
    const poResult = await client.query(
      'SELECT id FROM purchase_orders WHERE po_number = $1',
      [po_number]
    );
    
    if (poResult.rows.length === 0) {
      return res.status(400).json({ error: 'Purchase order not found' });
    }
    
    const poId = poResult.rows[0].id;
    
    // Create GRN
    const grnResult = await client.query(
      `INSERT INTO goods_receipts (grn_number, po_id, received_by, status)
       VALUES ($1, $2, (SELECT id FROM users WHERE role IN ('Admin', 'ADMIN') LIMIT 1), 'DRAFT')
       RETURNING *`,
      [grn_number, poId]
    );
    
    const grn = grnResult.rows[0];
    
    // Insert GRN items
    for (const item of items) {
      // Get the actual item UUID from the inventory table using SKU
      let actualItemId = item.item_id;
      console.log('🔍 Processing item:', item.item_id, 'Type:', typeof item.item_id);
      
      // Always try to resolve if it looks like a SKU (starts with 'sku-' or not a UUID)
      if (item.item_id && (!item.item_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i) || item.item_id.startsWith('sku-'))) {
        console.log('🔍 Looking up item in inventory:', item.item_id);
        
        // Try SKU lookup first
        let itemResult = await client.query(
          'SELECT id, sku, name FROM inventory WHERE sku = $1 LIMIT 1',
          [item.item_id]
        );
        console.log('🔍 SKU lookup result:', itemResult.rows);
        
        if (itemResult.rows.length === 0) {
          // Try name lookup as fallback
          console.log('🔍 SKU not found, trying name lookup for:', item.item_id);
          itemResult = await client.query(
            'SELECT id, sku, name FROM inventory WHERE name = $1 LIMIT 1',
            [item.item_id]
          );
          console.log('🔍 Name lookup result:', itemResult.rows);
        }
        
        if (itemResult.rows.length === 0) {
          // Show all available items for debugging
          const allItems = await client.query('SELECT sku, name, id FROM inventory ORDER BY sku');
          console.log('🔍 ALL available items in inventory:', allItems.rows);
          
          // Try to find the item by removing 'sku-' prefix if it exists
          let searchValue = item.item_id;
          if (item.item_id.startsWith('sku-')) {
            searchValue = item.item_id.replace('sku-', '');
            console.log('🔍 Trying without sku- prefix:', searchValue);
          }
          
          // Try exact SKU match with cleaned value
          const cleanResult = await client.query(
            'SELECT id, sku, name FROM inventory WHERE sku = $1 LIMIT 1',
            [searchValue]
          );
          console.log('🔍 Clean SKU lookup result:', cleanResult.rows);
          
          if (cleanResult.rows.length > 0) {
            actualItemId = cleanResult.rows[0].id;
            console.log('🎯 Found item with cleaned SKU:', actualItemId, 'for item:', cleanResult.rows[0]);
          } else {
            // Try partial match (contains)
            const partialResult = await client.query(
              'SELECT id, sku, name FROM inventory WHERE sku ILIKE $1 OR name ILIKE $1 LIMIT 1',
              [`%${searchValue}%`]
            );
            console.log('🔍 Partial match result:', partialResult.rows);
            
            if (partialResult.rows.length > 0) {
              actualItemId = partialResult.rows[0].id;
              console.log('🎯 Found item with partial match:', actualItemId, 'for item:', partialResult.rows[0]);
            } else {
              throw new Error(`Item not found: "${item.item_id}". Available SKUs: ${allItems.rows.map(r => r.sku).filter(s => s).join(', ')}`);
            }
          }
        } else {
          actualItemId = itemResult.rows[0].id;
          console.log('🎯 Resolved item ID:', actualItemId, 'for item:', itemResult.rows[0]);
        }
      }
      
      // Validate that we have a valid UUID before insertion (only after lookup attempts)
      if (!actualItemId) {
        throw new Error(`No item ID resolved for: ${item.item_id}`);
      }
      
      if (!actualItemId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
        throw new Error(`Invalid item ID resolved: ${actualItemId}. Expected a valid UUID but got: ${actualItemId}`);
      }
      
      console.log('✅ Inserting GRN item with UUID:', actualItemId);
      
      await client.query(
        `INSERT INTO goods_receipt_items (grn_id, item_id, po_item_id, accepted_qty, rejected_qty, batch_no, expiry_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [grn.id, actualItemId, item.po_item_id || null, item.accepted_qty || 0, item.rejected_qty || 0, item.batch_no || '', item.expiry_date || null]
      );
    }
    
    await client.query('COMMIT');
    
    res.status(201).json({
      id: grn.id,
      grn_number: grn.grn_number,
      po_number,
      supplier,
      received_date: received_date || grn.received_at,
      received_by: received_by || 'Current User',
      status: grn.status,
      total_items: items.length,
      total_quantity: items.reduce((sum, item) => sum + (item.accepted_quantity || item.received_quantity || 0), 0),
      total_value: total_value || 0,
      currency: 'INR',
      notes: notes || '',
      items: items || [],
      created_at: grn.created_at
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

export const updateGRN = async (req, res) => {
  const client = await (await import("../../config/db.js")).pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { status, notes } = req.body;
    
    // Find and update GRN
    const result = await client.query(
      'UPDATE goods_receipts SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "GRN not found" });
    }
    
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};
