import { pool } from "../../config/db.js";

/* 1️⃣ GET ALL WAREHOUSES */
export const getAllWarehouses = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        location_code,
        address,
        manager_name,
        contact_phone,
        is_active,
        created_at,
        updated_at
      FROM warehouses
      WHERE is_active = true
      ORDER BY name
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
    const result = await pool.query(
      "SELECT * FROM warehouses WHERE id = $1 AND is_active = true",
      [id]
    );
    
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
