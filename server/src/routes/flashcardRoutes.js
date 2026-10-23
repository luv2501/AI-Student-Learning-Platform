import { Router } from 'express';
import protect from '../middleware/protect.js';
import {
  submitReview,
  getDueCards,
  getDueCount,
} from '../controllers/flashcardController.js';

const router = Router();

// All flashcard spaced repetition routes require authentication
router.use(protect);

router.post('/review', submitReview);
router.get('/due', getDueCards);
router.get('/due-count', getDueCount);

export default router;
