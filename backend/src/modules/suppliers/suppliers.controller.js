import { pool } from "../../config/db.js";

let cachedSupplierColumns = null;
let cachedSupplierColumnsAt = 0;
const SUPPLIER_COLUMNS_CACHE_TTL_MS = 5 * 60 * 1000;

const getSupplierColumns = async () => {
  const now = Date.now();
  if (cachedSupplierColumns && now - cachedSupplierColumnsAt < SUPPLIER_COLUMNS_CACHE_TTL_MS) {
    return cachedSupplierColumns;
  }

  const result = await pool.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'suppliers'
  `);

  cachedSupplierColumns = new Set(result.rows.map((r) => r.column_name));
  cachedSupplierColumnsAt = now;
  return cachedSupplierColumns;
};

/* 1️⃣ GET ALL SUPPLIERS */
export const getAllSuppliers = async (req, res) => {
  try {
    const cols = await getSupplierColumns();

    const selectParts = [
      's.id',
      's.name'
    ];
    const groupByParts = [
      's.id',
      's.name'
    ];

    if (cols.has('contact_person')) {
      selectParts.push('s.contact_person');
      groupByParts.push('s.contact_person');
    } else {
      selectParts.push('NULL as contact_person');
    }

    if (cols.has('email')) {
      selectParts.push('s.email');
      groupByParts.push('s.email');
    } else {
      selectParts.push('NULL as email');
    }

    if (cols.has('phone')) {
      selectParts.push('s.phone');
      groupByParts.push('s.phone');
    } else {
      selectParts.push('NULL as phone');
    }

    if (cols.has('lead_time_days')) {
      selectParts.push('s.lead_time_days');
      groupByParts.push('s.lead_time_days');
    } else {
      selectParts.push('0 as lead_time_days');
    }

    if (cols.has('rating')) {
      selectParts.push('s.rating');
      groupByParts.push('s.rating');
    } else {
      selectParts.push('0 as rating');
    }

    if (cols.has('is_active')) {
      selectParts.push('s.is_active');
      groupByParts.push('s.is_active');
    } else {
      selectParts.push('true as is_active');
    }

    if (cols.has('created_at')) {
      selectParts.push('s.created_at');
      groupByParts.push('s.created_at');
    }

    if (cols.has('updated_at')) {
      selectParts.push('s.updated_at');
      groupByParts.push('s.updated_at');
    }

    const whereClause = cols.has('is_active') ? 'WHERE s.is_active = true' : '';

    const result = await pool.query(`
      SELECT
        ${selectParts.join(', ')},
        COUNT(po.id) as order_count
      FROM suppliers s
      LEFT JOIN purchase_orders po ON s.id = po.supplier_id
      ${whereClause}
      GROUP BY ${groupByParts.join(', ')}
      ORDER BY s.name
    `);

    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/* 2️⃣ GET SUPPLIER BY ID */
export const getSupplierById = async (req, res) => {
  const { id } = req.params;
  try {
    const cols = await getSupplierColumns();
    const whereActive = cols.has('is_active') ? ' AND is_active = true' : '';
    const result = await pool.query(
      `SELECT * FROM suppliers WHERE id = $1${whereActive}`,
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
  const lead_time_days = req.body.lead_time_days ?? req.body.leadTimeDays ?? 0;
  const rating = req.body.rating ?? 0;

  try {
    const cols = await getSupplierColumns();
    const insertCols = ['name'];
    const insertVals = [name];

    if (cols.has('contact_person')) {
      insertCols.push('contact_person');
      insertVals.push(contact_person);
    }

    if (cols.has('email')) {
      insertCols.push('email');
      insertVals.push(email);
    }

    if (cols.has('phone')) {
      insertCols.push('phone');
      insertVals.push(phone);
    }

    if (cols.has('lead_time_days')) {
      insertCols.push('lead_time_days');
      insertVals.push(lead_time_days);
    }

    if (cols.has('rating')) {
      insertCols.push('rating');
      insertVals.push(rating);
    }

    if (cols.has('is_active')) {
      insertCols.push('is_active');
      insertVals.push(true);
    }

    const placeholders = insertVals.map((_, i) => `$${i + 1}`).join(', ');
    const result = await pool.query(
      `INSERT INTO suppliers (${insertCols.join(', ')}) VALUES (${placeholders}) RETURNING *`,
      insertVals
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
  const lead_time_days = req.body.lead_time_days ?? req.body.leadTimeDays;
  const rating = req.body.rating;

  try {
    const cols = await getSupplierColumns();
    const updates = [];
    const values = [id];

    const pushUpdate = (sql, val) => {
      values.push(val);
      updates.push(`${sql} = $${values.length}`);
    };

    if (cols.has('name') && typeof name !== 'undefined') pushUpdate('name', name);
    if (cols.has('contact_person') && typeof contact_person !== 'undefined') {
      pushUpdate('contact_person', contact_person);
    }
    if (cols.has('email') && typeof email !== 'undefined') pushUpdate('email', email);
    if (cols.has('phone') && typeof phone !== 'undefined') pushUpdate('phone', phone);
    if (cols.has('lead_time_days') && typeof lead_time_days !== 'undefined') {
      pushUpdate('lead_time_days', lead_time_days);
    }
    if (cols.has('rating') && typeof rating !== 'undefined') {
      pushUpdate('rating', rating);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    const whereActive = cols.has('is_active') ? ' AND is_active = true' : '';
    const result = await pool.query(
      `UPDATE suppliers SET ${updates.join(', ')} WHERE id = $1${whereActive} RETURNING *`,
      values
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
    const cols = await getSupplierColumns();
    let result;
    if (cols.has('is_active')) {
      result = await pool.query(
        "UPDATE suppliers SET is_active = false WHERE id = $1 AND is_active = true RETURNING *",
        [id]
      );
    } else {
      result = await pool.query(
        "DELETE FROM suppliers WHERE id = $1 RETURNING *",
        [id]
      );
    }
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Supplier not found" });
    }
    
    res.json({ message: "Supplier deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
