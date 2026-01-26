import { Router } from 'express';
import { 
  getAllGRNs, 
  createGRN, 
  updateGRN 
} from './grn.controller.js';

import { protect } from '../../middlewares/authMiddleware.js';
import { allowRoles } from '../../middlewares/roleMiddleware.js';

const router = Router();

router.use(protect);

// Get all GRNs
router.get('/', getAllGRNs);

// Create new GRN
router.post('/', allowRoles('Warehouse Staff', 'Inventory Manager', 'Admin'), createGRN);

// Update GRN status
router.put('/:id', allowRoles('Inventory Manager', 'Admin'), updateGRN);

export default router;
