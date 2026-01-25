import { Router } from 'express';
import { 
  getAllRequisitions, 
  createRequisition, 
  updateRequisition,
  deleteRequisition,
  generateRequisitionsFromStockLevels,
  runAutoPOSuggestions
} from './requisition.controller.js';
import { protect } from '../../middlewares/authMiddleware.js';
import { allowRoles } from '../../middlewares/roleMiddleware.js';

const router = Router();

router.use(protect);

// Get all purchase requisitions
router.get('/', getAllRequisitions);

// Create new purchase requisition
router.post('/', allowRoles('Warehouse Staff', 'Inventory Manager', 'Admin'), createRequisition);

// Update purchase requisition status
router.put('/:id', allowRoles('Inventory Manager', 'Admin'), updateRequisition);

// Approve purchase requisition
router.put('/:id/approve', allowRoles('Inventory Manager', 'Admin'), updateRequisition);

// Reject purchase requisition
router.put('/:id/reject', allowRoles('Inventory Manager', 'Admin'), updateRequisition);

// Delete purchase requisition
router.delete('/:id', allowRoles('Inventory Manager', 'Admin'), deleteRequisition);

// Auto-generate requisitions from stock levels
router.post('/generate-from-stock', allowRoles('Inventory Manager', 'Admin'), generateRequisitionsFromStockLevels);

// Auto-PO suggestions
router.post('/run-auto-suggestions', allowRoles('Inventory Manager', 'Admin'), runAutoPOSuggestions);

export default router;