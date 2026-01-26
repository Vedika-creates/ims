import { Router } from "express";
import {
  getAllInventory,
  getInventoryById,
  createInventory,
  updateInventory,
  deleteInventory,
  getInventorySummary,
  adjustStock,
} from "./inventory.controller.js";

import { protect } from "../../middlewares/authMiddleware.js";
import { allowRoles } from "../../middlewares/roleMiddleware.js";

const router = Router();

router.use(protect);

// GET /api/inventory - Get all inventory items
router.get("/", getAllInventory);

// GET /api/inventory/summary - Get inventory summary for dashboard
router.get("/summary", getInventorySummary);

// GET /api/inventory/:id - Get specific inventory item
router.get("/:id", getInventoryById);

// POST /api/inventory - Create new inventory item
router.post("/", allowRoles("Inventory Manager", "Admin"), createInventory);

// PUT /api/inventory/:id - Update inventory item
router.put("/:id", allowRoles("Inventory Manager", "Admin"), updateInventory);

// DELETE /api/inventory/:id - Delete inventory item (soft delete)
router.delete("/:id", allowRoles("Inventory Manager", "Admin"), deleteInventory);

// POST /api/inventory/adjust - Adjust stock levels
router.post("/adjust", allowRoles("Inventory Manager", "Admin"), adjustStock);

export default router;
