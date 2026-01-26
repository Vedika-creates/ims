import { Router } from "express";
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "./categories.controller.js";

import { protect } from "../../middlewares/authMiddleware.js";
import { allowRoles } from "../../middlewares/roleMiddleware.js";

const router = Router();

router.use(protect);

// GET /api/categories - Get all categories
router.get("/", getAllCategories);

// GET /api/categories/:id - Get specific category
router.get("/:id", getCategoryById);

// POST /api/categories - Create new category
router.post("/", allowRoles("Inventory Manager", "Admin"), createCategory);

// PUT /api/categories/:id - Update category
router.put("/:id", allowRoles("Inventory Manager", "Admin"), updateCategory);

// DELETE /api/categories/:id - Delete category
router.delete("/:id", allowRoles("Inventory Manager", "Admin"), deleteCategory);

export default router;
