import { Router } from 'express';
import { 
  getAllGRNs, 
  createGRN, 
  updateGRN 
} from './grn.controller.js';

const router = Router();

// Get all GRNs
router.get('/', getAllGRNs);

// Create new GRN
router.post('/', createGRN);

// Update GRN status
router.put('/:id', updateGRN);

export default router;
