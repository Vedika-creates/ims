import express from 'express';
import {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier
} from './suppliers.controller.js';

const router = express.Router();

// GET /api/suppliers - Get all suppliers
router.get('/', getAllSuppliers);

// GET /api/suppliers/:id - Get supplier by ID
router.get('/:id', getSupplierById);

// POST /api/suppliers - Create new supplier
router.post('/', createSupplier);

// PUT /api/suppliers/:id - Update supplier
router.put('/:id', updateSupplier);

// DELETE /api/suppliers/:id - Delete supplier
router.delete('/:id', deleteSupplier);

export default router;
