import { Router } from 'express';
import { 
  getAllPurchaseOrders, 
  createPurchaseOrder, 
  updatePurchaseOrder,
  deletePurchaseOrder,
  getPurchaseOrderItems
} from './purchase.controller.js';

const router = Router();

// Get all purchase orders
router.get('/', getAllPurchaseOrders);

// Create new purchase order
router.post('/', createPurchaseOrder);

// Get purchase order items
router.get('/:id/items', getPurchaseOrderItems);

// Update purchase order status
router.put('/:id', updatePurchaseOrder);

// Delete purchase order
router.delete('/:id', deletePurchaseOrder);

export default router;
