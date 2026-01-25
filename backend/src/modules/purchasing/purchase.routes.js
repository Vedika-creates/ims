import { Router } from 'express';
import { 
  getAllPurchaseOrders, 
  createPurchaseOrder, 
  updatePurchaseOrder,
  deletePurchaseOrder,
  getPurchaseOrderItems
} from './purchase.controller.js';
import { protect } from '../../middlewares/authMiddleware.js';
import { allowRoles } from '../../middlewares/roleMiddleware.js';

const router = Router();

router.use(protect);

// Get all purchase orders
router.get('/', allowRoles('Inventory Manager', 'Admin'), getAllPurchaseOrders);

// Create new purchase order
router.post('/', allowRoles('Inventory Manager', 'Admin'), createPurchaseOrder);

// Get purchase order items
router.get('/:id/items', allowRoles('Inventory Manager', 'Admin'), getPurchaseOrderItems);

// Update purchase order status
router.put('/:id', allowRoles('Inventory Manager', 'Admin'), updatePurchaseOrder);

// Delete purchase order
router.delete('/:id', allowRoles('Inventory Manager', 'Admin'), deletePurchaseOrder);

export default router;
