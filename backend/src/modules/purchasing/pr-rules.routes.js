import { Router } from 'express';
import { 
  getAllPRRules,
  getActivePRRules,
  getPRRuleById,
  createPRRule,
  updatePRRule,
  deletePRRule,
  executePRRules
} from './pr-rules.controller.js';

const router = Router();

// Get all PR rules
router.get('/', getAllPRRules);

// Get active PR rules
router.get('/active', getActivePRRules);

// Get single PR rule by ID
router.get('/:id', getPRRuleById);

// Create new PR rule
router.post('/', createPRRule);

// Update PR rule
router.put('/:id', updatePRRule);

// Delete PR rule
router.delete('/:id', deletePRRule);

// Execute rules and generate PRs
router.post('/execute', executePRRules);

export default router;
