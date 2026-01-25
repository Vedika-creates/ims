import { pool } from "../../config/db.js";

/* 1️⃣ GET ALL WAREHOUSES */
export const getAllWarehouses = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        w.id,
        w.name,
        w.location,
        w.is_active,
        w.created_at,
        -- Real-time inventory statistics
        COALESCE(item_stats.total_items, 0) as total_items,
        COALESCE(item_stats.total_stock, 0) as total_stock,
        COALESCE(item_stats.out_of_stock, 0) as out_of_stock,
        COALESCE(item_stats.low_stock, 0) as low_stock,
        COALESCE(item_stats.normal_stock, 0) as normal_stock,
        COALESCE(item_stats.total_value, 0) as total_value,
        COALESCE(location_stats.total_locations, 0) as total_locations,
        -- Recent activity count (last 7 days)
        COALESCE(activity_stats.recent_activity, 0) as recent_activity
      FROM warehouses w
      LEFT JOIN (
        SELECT 
          i.warehouse_id,
          COUNT(*) as total_items,
          COALESCE(SUM(i.current_stock), 0) as total_stock,
          COUNT(CASE WHEN i.current_stock = 0 OR i.current_stock IS NULL THEN 1 END) as out_of_stock,
          COUNT(CASE WHEN i.current_stock > 0 AND i.current_stock <= COALESCE(i.reorder_point, 0) THEN 1 END) as low_stock,
          COUNT(CASE WHEN i.current_stock > COALESCE(i.reorder_point, 0) THEN 1 END) as normal_stock,
          COALESCE(SUM(i.current_stock * i.unit_cost), 0) as total_value
        FROM inventory i
        WHERE i.is_active = true
        GROUP BY i.warehouse_id
      ) item_stats ON w.id = item_stats.warehouse_id
      LEFT JOIN (
        SELECT 
          warehouse_id,
          COUNT(*) as total_locations
        FROM locations
        WHERE is_active = true
        GROUP BY warehouse_id
      ) location_stats ON w.id = location_stats.warehouse_id
      LEFT JOIN (
        SELECT 
          i.warehouse_id,
          COUNT(*) as recent_activity
        FROM inventory_transactions i
        WHERE i.created_at >= NOW() - INTERVAL '7 days'
        GROUP BY i.warehouse_id
      ) activity_stats ON w.id = activity_stats.warehouse_id
      WHERE w.is_active = true
      ORDER BY w.name
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* 2️⃣ GET WAREHOUSE BY ID */
export const getWarehouseById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT 
        w.*,
        -- Real-time inventory statistics
        COALESCE(item_stats.total_items, 0) as total_items,
        COALESCE(item_stats.total_stock, 0) as total_stock,
        COALESCE(item_stats.out_of_stock, 0) as out_of_stock,
        COALESCE(item_stats.low_stock, 0) as low_stock,
        COALESCE(item_stats.normal_stock, 0) as normal_stock,
        COALESCE(item_stats.total_value, 0) as total_value,
        COALESCE(location_stats.total_locations, 0) as total_locations,
        -- Recent activity count (last 7 days)
        COALESCE(activity_stats.recent_activity, 0) as recent_activity
      FROM warehouses w
      LEFT JOIN (
        SELECT 
          i.warehouse_id,
          COUNT(*) as total_items,
          COALESCE(SUM(i.current_stock), 0) as total_stock,
          COUNT(CASE WHEN i.current_stock = 0 OR i.current_stock IS NULL THEN 1 END) as out_of_stock,
          COUNT(CASE WHEN i.current_stock > 0 AND i.current_stock <= COALESCE(i.reorder_point, 0) THEN 1 END) as low_stock,
          COUNT(CASE WHEN i.current_stock > COALESCE(i.reorder_point, 0) THEN 1 END) as normal_stock,
          COALESCE(SUM(i.current_stock * i.unit_cost), 0) as total_value
        FROM inventory i
        WHERE i.is_active = true
        GROUP BY i.warehouse_id
      ) item_stats ON w.id = item_stats.warehouse_id
      LEFT JOIN (
        SELECT 
          warehouse_id,
          COUNT(*) as total_locations
        FROM locations
        WHERE is_active = true
        GROUP BY warehouse_id
      ) location_stats ON w.id = location_stats.warehouse_id
      LEFT JOIN (
        SELECT 
          i.warehouse_id,
          COUNT(*) as recent_activity
        FROM inventory_transactions i
        WHERE i.created_at >= NOW() - INTERVAL '7 days'
        GROUP BY i.warehouse_id
      ) activity_stats ON w.id = activity_stats.warehouse_id
      WHERE w.id = $1 AND w.is_active = true
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Warehouse not found" });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* 3️⃣ CREATE NEW WAREHOUSE */
export const createWarehouse = async (req, res) => {
  const {
    name,
    location_code,
    address,
    manager_name,
    contact_phone
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO warehouses (name, location_code, address, manager_name, contact_phone, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING *`,
      [name, location_code, address, manager_name, contact_phone]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* 4️⃣ UPDATE WAREHOUSE */
export const updateWarehouse = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    location_code,
    address,
    manager_name,
    contact_phone
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE warehouses 
       SET name = $2, location_code = $3, address = $4, manager_name = $5, contact_phone = $6
       WHERE id = $1 AND is_active = true
       RETURNING *`,
      [id, name, location_code, address, manager_name, contact_phone]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Warehouse not found" });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* 5️⃣ DELETE WAREHOUSE (SOFT DELETE) */
export const deleteWarehouse = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      "UPDATE warehouses SET is_active = false WHERE id = $1 AND is_active = true RETURNING *",
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Warehouse not found" });
    }
    
    res.json({ message: "Warehouse deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
