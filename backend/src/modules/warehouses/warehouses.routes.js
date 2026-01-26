import express from 'express';
import {
  getAllWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse
} from './warehouses.controller.js';

import { protect } from '../../middlewares/authMiddleware.js';
import { allowRoles } from '../../middlewares/roleMiddleware.js';

const router = express.Router();

router.use(protect);

// GET /api/warehouses - Get all warehouses
router.get('/', getAllWarehouses);

// GET /api/warehouses/:id - Get warehouse by ID
router.get('/:id', getWarehouseById);

// POST /api/warehouses - Create new warehouse
router.post('/', allowRoles('Inventory Manager', 'Admin'), createWarehouse);

// PUT /api/warehouses/:id - Update warehouse
router.put('/:id', allowRoles('Inventory Manager', 'Admin'), updateWarehouse);

// DELETE /api/warehouses/:id - Delete warehouse
router.delete('/:id', allowRoles('Inventory Manager', 'Admin'), deleteWarehouse);

export default router;
