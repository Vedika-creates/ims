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

// Temporarily remove authentication for testing
// router.use(protect);

// GET /api/categories - Get all categories
router.get("/", getAllCategories);

// GET /api/categories/:id - Get specific category
router.get("/:id", getCategoryById);

// POST /api/categories - Create new category
router.post("/", createCategory);

// PUT /api/categories/:id - Update category
router.put("/:id", updateCategory);

// DELETE /api/categories/:id - Delete category
router.delete("/:id", deleteCategory);

export default router;
