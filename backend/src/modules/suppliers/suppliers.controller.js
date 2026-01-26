import { pool } from "../../config/db.js";

/* 1️⃣ GET ALL SUPPLIERS */
export const getAllSuppliers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.id,
        s.name,
        s.contact_person,
        s.email,
        s.phone,
        s.address,
        s.lead_time_days,
        s.rating,
        s.is_active,
        s.created_at,
        s.updated_at,
        COUNT(po.id) as order_count
      FROM suppliers s
      LEFT JOIN purchase_orders po ON s.id = po.supplier_id
      WHERE s.is_active = true
      GROUP BY s.id, s.name, s.contact_person, s.email, s.phone, s.address, s.lead_time_days, s.rating, s.is_active, s.created_at, s.updated_at
      ORDER BY s.name
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
  const name = req.body.name;
  const contact_person = req.body.contact_person ?? req.body.contactPerson;
  const email = req.body.email;
  const phone = req.body.phone;
  const address = req.body.address;
  const lead_time_days = req.body.lead_time_days ?? req.body.leadTimeDays ?? 0;
  const rating = req.body.rating ?? 0;

  try {
    const result = await pool.query(
      `INSERT INTO suppliers (name, contact_person, email, phone, address, lead_time_days, rating, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       RETURNING *`,
      [name, contact_person, email, phone, address, lead_time_days, rating]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* 4️⃣ UPDATE SUPPLIER */
export const updateSupplier = async (req, res) => {
  const { id } = req.params;
  const name = req.body.name;
  const contact_person = req.body.contact_person ?? req.body.contactPerson;
  const email = req.body.email;
  const phone = req.body.phone;
  const address = req.body.address;
  const lead_time_days = req.body.lead_time_days ?? req.body.leadTimeDays;
  const rating = req.body.rating;

  try {
    const result = await pool.query(
      `UPDATE suppliers 
       SET name = $2, contact_person = $3, email = $4, phone = $5, address = $6,
           lead_time_days = COALESCE($7, lead_time_days), rating = COALESCE($8, rating)
       WHERE id = $1 AND is_active = true
       RETURNING *`,
      [id, name, contact_person, email, phone, address, lead_time_days, rating]
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
