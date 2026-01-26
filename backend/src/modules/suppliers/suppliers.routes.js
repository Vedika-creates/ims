import express from 'express';
import {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier
} from './suppliers.controller.js';

import { protect } from '../../middlewares/authMiddleware.js';
import { allowRoles } from '../../middlewares/roleMiddleware.js';

const router = express.Router();

router.use(protect);

// GET /api/suppliers - Get all suppliers
router.get('/', getAllSuppliers);

// GET /api/suppliers/:id - Get supplier by ID
router.get('/:id', getSupplierById);

// POST /api/suppliers - Create new supplier
router.post('/', allowRoles('Inventory Manager', 'Admin'), createSupplier);

// PUT /api/suppliers/:id - Update supplier
router.put('/:id', allowRoles('Inventory Manager', 'Admin'), updateSupplier);

// DELETE /api/suppliers/:id - Delete supplier
router.delete('/:id', allowRoles('Inventory Manager', 'Admin'), deleteSupplier);

export default router;
