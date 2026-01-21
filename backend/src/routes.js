import { Router } from "express";
import authRoutes from "./modules/auth/auth.routes.js";
import inventoryRoutes from "./modules/inventory/inventory.routes.js";
import purchaseRoutes from "./modules/purchasing/purchase.routes.js";
import requisitionRoutes from "./modules/purchasing/requisition.routes.js";
import prRulesRoutes from "./modules/purchasing/pr-rules.routes.js";
import grnRoutes from "./modules/grn/grn.routes.js";
import categoriesRoutes from "./modules/categories/categories.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/purchase-orders", purchaseRoutes);
router.use("/purchase-requisitions", requisitionRoutes);
router.use("/pr-rules", prRulesRoutes);
router.use("/grn", grnRoutes);
router.use("/categories", categoriesRoutes);

// ✅ HEALTH CHECK ROUTE (ADD THIS)
router.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

// ✅ TEST INVENTORY ROUTE (NO AUTH)
router.get("/test-inventory", async (req, res) => {
  try {
    const { pool } = await import("./config/db.js");
    const result = await pool.query(`
      SELECT i.*, c.name as category_name, u.name as unit_of_measure,
       i.current_stock,
       CASE 
         WHEN i.current_stock = 0 THEN 'out_of_stock'
         WHEN i.current_stock <= i.reorder_point THEN 'low'
         ELSE 'normal'
       END as stock_status
       FROM inventory i
       LEFT JOIN categories c ON i.category_id = c.id
       LEFT JOIN units_of_measure u ON i.unit_of_measure_id = u.id
       WHERE i.is_active = true
       ORDER BY i.name
       LIMIT 5
    `);
    res.json({ success: true, data: result.rows, count: result.rows.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ GET CATEGORIES
router.get("/categories", async (req, res) => {
  try {
    const { pool } = await import("./config/db.js");
    const result = await pool.query("SELECT * FROM categories ORDER BY name");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ GET UNITS OF MEASURE
router.get("/units", async (req, res) => {
  try {
    const { pool } = await import("./config/db.js");
    const result = await pool.query("SELECT * FROM units_of_measure ORDER BY name");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ GET WAREHOUSES
router.get("/warehouses", async (req, res) => {
  try {
    const { pool } = await import("./config/db.js");
    const result = await pool.query(`
      SELECT w.*, 
             (SELECT COUNT(*) FROM locations l WHERE l.warehouse_id = w.id AND l.is_active = true) as location_count,
             (SELECT COUNT(*) FROM inventory i WHERE i.is_active = true) as item_count
      FROM warehouses w 
      WHERE w.is_active = true
      ORDER BY w.name
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ CREATE WAREHOUSE
router.post("/warehouses", async (req, res) => {
  try {
    const { pool } = await import("./config/db.js");
    const { name } = req.body;
    
    const result = await pool.query(
      "INSERT INTO warehouses (name) VALUES ($1) RETURNING *",
      [name]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ UPDATE WAREHOUSE
router.put("/warehouses/:id", async (req, res) => {
  try {
    const { pool } = await import("./config/db.js");
    const { id } = req.params;
    const { name } = req.body;
    
    const result = await pool.query(
      "UPDATE warehouses SET name = $1 WHERE id = $2 RETURNING *",
      [name, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Warehouse not found" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ DELETE WAREHOUSE
router.delete("/warehouses/:id", async (req, res) => {
  try {
    const { pool } = await import("./config/db.js");
    const { id } = req.params;
    
    const result = await pool.query(
      "DELETE FROM warehouses WHERE id = $1 RETURNING *",
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Warehouse not found" });
    }
    
    res.json({ message: "Warehouse deleted successfully", warehouse: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ GET SUPPLIERS
router.get("/suppliers", async (req, res) => {
  try {
    const { pool } = await import("./config/db.js");
    const result = await pool.query(`
      SELECT s.*, 
             COUNT(po.id) as order_count
      FROM suppliers s 
      LEFT JOIN purchase_orders po ON s.id = po.supplier_id
      WHERE s.is_active = true 
      GROUP BY s.id, s.name, s.contact_person, s.email, s.phone, s.lead_time_days, s.is_active, s.created_at
      ORDER BY s.name
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ CREATE SUPPLIER
router.post("/suppliers", async (req, res) => {
  try {
    const { pool } = await import("./config/db.js");
    const { name, contactPerson, email, phone, leadTimeDays } = req.body;
    
    const result = await pool.query(
      `INSERT INTO suppliers (name, contact_person, email, phone, lead_time_days, is_active) 
       VALUES ($1, $2, $3, $4, $5, true) 
       RETURNING *`,
      [name, contactPerson, email, phone, leadTimeDays || 0]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ UPDATE SUPPLIER
router.put("/suppliers/:id", async (req, res) => {
  try {
    const { pool } = await import("./config/db.js");
    const { id } = req.params;
    const { name, contactPerson, email, phone, leadTimeDays } = req.body;
    
    const result = await pool.query(
      `UPDATE suppliers 
       SET name = $1, contact_person = $2, email = $3, phone = $4, lead_time_days = $5
       WHERE id = $6 AND is_active = true
       RETURNING *`,
      [name, contactPerson, email, phone, leadTimeDays || 0, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Supplier not found" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ DELETE SUPPLIER
router.delete("/suppliers/:id", async (req, res) => {
  try {
    const { pool } = await import("./config/db.js");
    const { id } = req.params;
    
    const result = await pool.query(
      `UPDATE suppliers 
       SET is_active = false
       WHERE id = $1 AND is_active = true
       RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Supplier not found" });
    }
    
    res.json({ message: "Supplier deleted successfully", supplier: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
