import { pool } from "../../config/db.js";

/* 1️⃣ GET ALL CATEGORIES */
export const getAllCategories = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM categories ORDER BY name"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* 2️⃣ GET CATEGORY BY ID */
export const getCategoryById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM categories WHERE id = $1",
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* 3️⃣ CREATE NEW CATEGORY */
export const createCategory = async (req, res) => {
  const { name, description } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *",
      [name, description]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* 4️⃣ UPDATE CATEGORY */
export const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  
  try {
    const result = await pool.query(
      "UPDATE categories SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *",
      [name, description, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* 5️⃣ DELETE CATEGORY */
export const deleteCategory = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      "DELETE FROM categories WHERE id = $1 RETURNING *",
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }
    
    res.json({ message: "Category deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
