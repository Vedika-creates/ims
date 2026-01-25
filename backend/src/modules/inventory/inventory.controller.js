import { pool } from "../../config/db.js";

/* 1️⃣ GET ALL INVENTORY ITEMS */
// Helper to generate alerts for low/critical stock
const generateStockAlerts = async (pool, item, newStock) => {
  const alerts = [];

  if (newStock <= 0) {
    alerts.push({
      alert_type: 'CRITICAL_STOCK',
      severity: 'CRITICAL',
      title: `Out of Stock: ${item.name}`,
      message: `Item ${item.name} (${item.sku}) is out of stock.`,
      item_id: item.id,
      metadata: {
        current_stock: newStock,
        reorder_point: item.reorder_point,
        safety_stock: item.safety_stock,
        location: null
      }
    });
  } else if (newStock <= (item.safety_stock || 0)) {
    alerts.push({
      alert_type: 'CRITICAL_STOCK',
      severity: 'HIGH',
      title: `Critical Stock: ${item.name}`,
      message: `Current stock (${newStock}) has fallen below safety stock level (${item.safety_stock}).`,
      item_id: item.id,
      metadata: {
        current_stock: newStock,
        reorder_point: item.reorder_point,
        safety_stock: item.safety_stock,
        location: null
      }
    });
  } else if (newStock <= (item.reorder_point || 0)) {
    alerts.push({
      alert_type: 'LOW_STOCK',
      severity: 'MEDIUM',
      title: `Low Stock: ${item.name}`,
      message: `Current stock (${newStock}) has fallen below reorder point (${item.reorder_point}).`,
      item_id: item.id,
      metadata: {
        current_stock: newStock,
        reorder_point: item.reorder_point,
        safety_stock: item.safety_stock,
        location: null
      }
    });
  }

  // Insert alerts
  for (const alert of alerts) {
    await pool.query(
      `INSERT INTO inventory_alerts (alert_type, severity, status, title, message, metadata, item_id)
       VALUES ($1, $2, 'ACTIVE', $3, $4, $5, $6)`,
      [alert.alert_type, alert.severity, alert.title, alert.message, JSON.stringify(alert.metadata), alert.item_id]
    );
  }
};

export const getAllInventory = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        i.id,
        i.name,
        i.sku,
        i.description,
        i.category_id,
        i.current_stock,
        i.opening_stock,
        i.reorder_point,
        i.safety_stock,
        i.is_active,
        i.unit_cost as cost,
        i.unit_price as selling_price,
        i.supplier_id,
        i.warehouse_id,
        c.name as category_name,
        s.name as supplier_name,
        w.name as warehouse_name,
        CASE 
          WHEN i.current_stock IS NULL OR i.current_stock = 0 THEN 'out_of_stock'
          WHEN i.current_stock <= COALESCE(i.reorder_point, 0) THEN 'low'
          ELSE 'normal'
        END as stock_status
      FROM inventory i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      LEFT JOIN warehouses w ON i.warehouse_id = w.id
      WHERE i.is_active = true
      ORDER BY i.name
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* 2️⃣ GET INVENTORY BY ID */
export const getInventoryById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT i.*, 
       c.name as category_name, 
       s.name as supplier_name,
       w.name as warehouse_name,
       CASE 
         WHEN i.current_stock IS NULL OR i.current_stock = 0 THEN 'out_of_stock'
         WHEN i.current_stock <= COALESCE(i.reorder_point, 0) THEN 'low'
         ELSE 'normal'
       END as stock_status,
       (i.current_stock * i.unit_cost) as total_value
       FROM inventory i
       LEFT JOIN categories c ON i.category_id = c.id
       LEFT JOIN suppliers s ON i.supplier_id = s.id
       LEFT JOIN warehouses w ON i.warehouse_id = w.id
       WHERE i.id = $1 AND i.is_active = true`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* 3️⃣ CREATE NEW INVENTORY ITEM */
export const createInventory = async (req, res) => {
  const {
    name,
    sku,
    description,
    category_id,
    lead_time_days,
    safety_stock,
    reorder_point,
    is_batch_tracked,
    is_expiry_tracked,
    serialTracking,
    cost,
    selling_price,
    sellingPrice,
    supplier_id,
    warehouse_id,
    opening_stock
  } = req.body;

  const effectiveSellingPrice = selling_price ?? sellingPrice ?? 0;
  const effectiveOpeningStock = opening_stock ?? 0;

  console.log('📦 Creating inventory item:', { 
    name, 
    sku, 
    category_id, 
    cost, 
    sellingPrice: effectiveSellingPrice,
    opening_stock: effectiveOpeningStock,
    safety_stock,
    reorder_point 
  });

  try {
    const result = await pool.query(
      `INSERT INTO inventory 
       (name, sku, description, category_id,
        lead_time_days, safety_stock, reorder_point,
        requires_batch_tracking, requires_serial_tracking, has_expiry, is_active, unit_cost, unit_price, supplier_id, warehouse_id, current_stock, opening_stock)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING *`,
      [
        name,
        sku,
        description,
        category_id || null,
        lead_time_days || 0,
        safety_stock || 0,
        reorder_point || 0,
        is_batch_tracked || false,
        serialTracking || false,
        is_expiry_tracked || false,
        true,
        cost || 0,
        effectiveSellingPrice,
        supplier_id || null,
        warehouse_id || null,
        effectiveOpeningStock,
        effectiveOpeningStock
      ]
    );
    
    console.log('✅ Inventory item created successfully:', result.rows[0]);

    // Generate alerts if stock is low/critical
    const newItem = result.rows[0];
    await generateStockAlerts(pool, newItem, newItem.current_stock || 0);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error creating inventory item:', err.message);
    res.status(500).json({ error: err.message });
  }
};

/* 4️⃣ UPDATE INVENTORY ITEM */
export const updateInventory = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    sku,
    description,
    category_id,
    lead_time_days,
    safety_stock,
    reorder_point,
    is_batch_tracked,
    is_expiry_tracked,
    serialTracking,
    cost,
    selling_price,
    sellingPrice,
    supplier_id,
    warehouse_id,
    opening_stock
  } = req.body;

  const effectiveSellingPrice = selling_price ?? sellingPrice ?? 0;
  const effectiveOpeningStock = opening_stock ?? null;

  console.log('📝 Updating inventory item:', { 
    id, 
    name, 
    supplier_id: supplier_id || 'MISSING',
    warehouse_id: warehouse_id || 'MISSING'
  });

  try {
    const result = await pool.query(
      `UPDATE inventory 
       SET name = $2, sku = $3, description = $4, category_id = $5,
           lead_time_days = $6, safety_stock = $7, reorder_point = $8,
           requires_batch_tracking = $9, requires_serial_tracking = $10, has_expiry = $11,
           unit_cost = $12, unit_price = $13, supplier_id = $14, warehouse_id = $15,
           opening_stock = CASE WHEN $16 IS NULL THEN opening_stock ELSE $16 END,
           current_stock = CASE WHEN $16 IS NULL THEN current_stock ELSE $16 END
       WHERE id = $1 AND is_active = true
       RETURNING *`,
      [
        id,
        name,
        sku,
        description,
        category_id || null,
        lead_time_days || 0,
        safety_stock || 0,
        reorder_point || 0,
        is_batch_tracked || false,
        serialTracking || false,
        is_expiry_tracked || false,
        cost || 0,
        effectiveSellingPrice,
        supplier_id || null,
        warehouse_id || null,
        effectiveOpeningStock
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }
    
    console.log('✅ Inventory item updated successfully:', result.rows[0]);

    // Generate alerts if stock is low/critical after update
    const updatedItem = result.rows[0];
    await generateStockAlerts(pool, updatedItem, updatedItem.current_stock || 0);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error updating inventory item:', err.message);
    res.status(500).json({ error: err.message });
  }
};

/* 5️⃣ DELETE INVENTORY ITEM (SOFT DELETE) */
export const deleteInventory = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      `UPDATE inventory SET is_active = false WHERE id = $1 AND is_active = true RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }
    
    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* 6️⃣ GET INVENTORY SUMMARY FOR DASHBOARD */
export const getInventorySummary = async (req, res) => {
  try {
    // Get inventory stats
    const inventoryResult = await pool.query(`
      SELECT 
        COUNT(*) as total_items,
        COUNT(CASE WHEN i.current_stock = 0 THEN 1 END) as out_of_stock,
        COUNT(CASE WHEN i.current_stock <= COALESCE(i.reorder_point, 0) AND i.current_stock > 0 THEN 1 END) as low_stock,
        COUNT(CASE WHEN i.current_stock > COALESCE(i.reorder_point, 0) THEN 1 END) as normal_stock,
        SUM(i.current_stock * i.unit_cost) as total_value
      FROM inventory i
      WHERE i.is_active = true
    `);
    
    // Get supplier count
    const supplierResult = await pool.query(`
      SELECT COUNT(*) as total_suppliers
      FROM suppliers
      WHERE is_active = true
    `);
    
    const summary = {
      ...inventoryResult.rows[0],
      total_suppliers: parseInt(supplierResult.rows[0].total_suppliers)
    };
    
    console.log('📊 Dashboard stats:', summary);
    res.json(summary);
  } catch (err) {
    console.error('❌ Error getting inventory summary:', err.message);
    res.status(500).json({ error: err.message });
  }
};

/* 7️⃣ STOCK ADJUSTMENT */
export const adjustStock = async (req, res) => {
  const { item_id, location_id, quantity, type, notes } = req.body;

  if (!["in", "out", "adjustment"].includes(type)) {
    return res.status(400).json({ message: "Invalid adjustment type" });
  }

  try {
    await pool.query("BEGIN");

    // Get current stock from inventory
    const currentStockResult = await pool.query(
      "SELECT current_stock FROM inventory WHERE id = $1",
      [item_id]
    );
    
    if (currentStockResult.rows.length === 0) {
      await pool.query("ROLLBACK");
      return res.status(404).json({ error: "Item not found" });
    }

    const currentStock = currentStockResult.rows[0].current_stock;
    const adjustmentQuantity = type === 'out' ? -Math.abs(quantity) : Math.abs(quantity);
    const newStock = currentStock + adjustmentQuantity;

    if (newStock < 0) {
      await pool.query("ROLLBACK");
      return res.status(400).json({ error: "Insufficient stock" });
    }

    // Update inventory stock
    await pool.query(
      "UPDATE inventory SET current_stock = $1 WHERE id = $2",
      [newStock, item_id]
    );

    // Record stock movement transaction
    await pool.query(
      `INSERT INTO inventory_transactions 
       (item_id, warehouse_id, location_id, transaction_type, quantity, performed_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [item_id, null, location_id || null, type === 'out' ? 'OUT' : 'IN', Math.abs(adjustmentQuantity), req.user?.id]
    );

    // Generate alerts if stock is low/critical after adjustment
    const itemResult = await pool.query("SELECT * FROM inventory WHERE id = $1", [item_id]);
    if (itemResult.rows.length > 0) {
      await generateStockAlerts(pool, itemResult.rows[0], newStock);
    }

    await pool.query("COMMIT");
    res.json({ message: "Stock adjusted successfully", newStock });
  } catch (err) {
    await pool.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  }
};