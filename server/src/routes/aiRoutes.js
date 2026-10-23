import { Router } from 'express';
import protect from '../middleware/protect.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import {
  askDocument,
  getAskHistory,
  clearAskHistory,
} from '../controllers/documentController.js';
import { createWeakSpotsQuiz } from '../controllers/quizController.js';

const router = Router();

// All AI ask history and quiz generation routes require authentication
router.use(protect);

router.post('/ask/:id', aiLimiter, askDocument);
router.get('/ask/:id/history', getAskHistory);
router.delete('/ask/:id/history', clearAskHistory);
router.post('/quiz/weak-spots', aiLimiter, createWeakSpotsQuiz);

export default router;
