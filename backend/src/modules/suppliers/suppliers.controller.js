import { pool } from "../../config/db.js";

/* 1️⃣ GET ALL SUPPLIERS */
export const getAllSuppliers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        contact_person,
        email,
        phone,
        address,
        is_active,
        created_at,
        updated_at
      FROM suppliers
      WHERE is_active = true
      ORDER BY name
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* 2️⃣ GET SUPPLIER BY ID */
export const getSupplierById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM suppliers WHERE id = $1 AND is_active = true",
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Supplier not found" });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* 3️⃣ CREATE NEW SUPPLIER */
export const createSupplier = async (req, res) => {
  const {
    name,
    contact_person,
    email,
    phone,
    address
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO suppliers (name, contact_person, email, phone, address, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING *`,
      [name, contact_person, email, phone, address]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* 4️⃣ UPDATE SUPPLIER */
export const updateSupplier = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    contact_person,
    email,
    phone,
    address
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE suppliers 
       SET name = $2, contact_person = $3, email = $4, phone = $5, address = $6
       WHERE id = $1 AND is_active = true
       RETURNING *`,
      [id, name, contact_person, email, phone, address]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Supplier not found" });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* 5️⃣ DELETE SUPPLIER (SOFT DELETE) */
export const deleteSupplier = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      "UPDATE suppliers SET is_active = false WHERE id = $1 AND is_active = true RETURNING *",
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Supplier not found" });
    }
    
    res.json({ message: "Supplier deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
