import express from 'express';
import {
  getAllWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse
} from './warehouses.controller.js';

const router = express.Router();

// GET /api/warehouses - Get all warehouses
router.get('/', getAllWarehouses);

// GET /api/warehouses/:id - Get warehouse by ID
router.get('/:id', getWarehouseById);

// POST /api/warehouses - Create new warehouse
router.post('/', createWarehouse);

// PUT /api/warehouses/:id - Update warehouse
router.put('/:id', updateWarehouse);

// DELETE /api/warehouses/:id - Delete warehouse
router.delete('/:id', deleteWarehouse);

export default router;
