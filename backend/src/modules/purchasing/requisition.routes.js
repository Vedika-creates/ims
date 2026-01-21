import { Router } from 'express';
import { 
  getAllRequisitions, 
  createRequisition, 
  updateRequisition,
  deleteRequisition,
  generateRequisitionsFromStockLevels
} from './requisition.controller.js';

const router = Router();

// Get all purchase requisitions
router.get('/', getAllRequisitions);

// Create new purchase requisition
router.post('/', createRequisition);

// Update purchase requisition status
router.put('/:id', updateRequisition);

// Approve purchase requisition
router.put('/:id/approve', updateRequisition);

// Reject purchase requisition
router.put('/:id/reject', updateRequisition);

// Delete purchase requisition
router.delete('/:id', deleteRequisition);

// Auto-generate requisitions from stock levels
router.post('/generate-from-stock', generateRequisitionsFromStockLevels);

export default router;