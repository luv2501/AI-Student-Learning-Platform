import { Router } from 'express';
import protect from '../middleware/protect.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import {
  askDocument,
  getAskHistory,
  clearAskHistory,
} from '../controllers/documentController.js';

const router = Router();

// All AI ask history routes require authentication
router.use(protect);

router.post('/ask/:id', aiLimiter, askDocument);
router.get('/ask/:id/history', getAskHistory);
router.delete('/ask/:id/history', clearAskHistory);

export default router;
