import { Router } from "express";
import authRoutes from "./modules/auth/auth.routes.js";
import inventoryRoutes from "./modules/inventory/inventory.routes.js";
import purchaseRoutes from "./modules/purchasing/purchase.routes.js";
import requisitionRoutes from "./modules/purchasing/requisition.routes.js";
import prRulesRoutes from "./modules/purchasing/pr-rules.routes.js";
import alertRoutes from "./modules/alerts/alerts.routes.js";
import grnRoutes from "./modules/grn/grn.routes.js";
import categoriesRoutes from "./modules/categories/categories.routes.js";
import transferRoutes from "./modules/transfers/transfer.routes.js";
import warehousesRoutes from "./modules/warehouses/warehouses.routes.js";
import suppliersRoutes from "./modules/suppliers/suppliers.routes.js";

const router = Router();

// ✅ SUPER SIMPLE TEST - Put at the very top
router.get("/test", (req, res) => {
  console.log("=== TEST ROUTE CALLED ===");
  res.json({ message: "Routes are working!", timestamp: new Date().toISOString() });
});

router.use("/auth", authRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/purchase-orders", purchaseRoutes);
router.use("/purchase-requisitions", requisitionRoutes);
router.use("/pr-rules", prRulesRoutes);
router.use("/alerts", alertRoutes);
router.use("/grn", grnRoutes);
router.use("/categories", categoriesRoutes);
router.use("/suppliers", suppliersRoutes);
router.use("/transfer-orders", transferRoutes);
router.use("/warehouses", warehousesRoutes);

// ✅ HEALTH CHECK ROUTE
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

export default router;
