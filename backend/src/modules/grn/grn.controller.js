// Real Database GRN Controller
export const getAllGRNs = async (req, res) => {
  try {
    const { pool } = await import("../../config/db.js");
    
    const result = await pool.query(`
      SELECT 
        gr.id,
        gr.grn_number,
        gr.status,
        gr.received_at,
        gr.created_at,
        po.po_number,
        s.name as supplier,
        u.name as received_by,
        COALESCE(SUM(gri.accepted_qty), 0) as total_quantity,
        COALESCE(SUM(gri.accepted_qty * 100), 0) as total_value,
        COUNT(gri.id) as total_items,
        'INR' as currency
      FROM goods_receipts gr
      LEFT JOIN purchase_orders po ON gr.po_id = po.id
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      LEFT JOIN users u ON gr.received_by = u.id
      LEFT JOIN goods_receipt_items gri ON gr.id = gri.grn_id
      WHERE gr.status IN ('DRAFT', 'VERIFIED', 'POSTED')
      GROUP BY gr.id, gr.grn_number, gr.status, gr.received_at, gr.created_at, po.po_number, s.name, u.name
      ORDER BY gr.created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createGRN = async (req, res) => {
  const client = await (await import("../../config/db.js")).pool.connect();
  try {
    await client.query('BEGIN');
    
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
       VALUES ($1, $2, (SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1), 'DRAFT')
       RETURNING *`,
      [grn_number, poId]
    );
    
    const grn = grnResult.rows[0];
    
    // Insert GRN items
    for (const item of items) {
      // Get the actual item UUID from the items table using SKU
      let actualItemId = item.item_id;
      if (item.item_id && !item.item_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
        // If it's not a UUID, assume it's a SKU and look up the UUID
        const itemResult = await client.query(
          'SELECT id FROM items WHERE sku = $1 OR id = $2 LIMIT 1',
          [item.item_id, item.item_id]
        );
        actualItemId = itemResult.rows[0]?.id;
        if (!actualItemId) {
          throw new Error(`Item not found: ${item.item_id}`);
        }
      }
      
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
