import { Router } from 'express';
import protect from '../middleware/protect.js';
import { uploadPdf } from '../config/upload.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import {
  uploadDocument,
  listDocuments,
  getDocument,
  deleteDocument,
  createNotes,
  createFlashcards,
  createQuiz,
  askDocument,
  getAskHistory,
  clearAskHistory,
} from '../controllers/documentController.js';
import { getDocumentCardReviews } from '../controllers/flashcardController.js';

const router = Router();

// Every document route is private and ownership is checked in each handler.
router.use(protect);

router.route('/').get(listDocuments).post(uploadPdf, uploadDocument);
router.route('/:id').get(getDocument).delete(deleteDocument);

router.post('/:id/notes', aiLimiter, createNotes);
router.post('/:id/flashcards', aiLimiter, createFlashcards);
router.get('/:id/flashcards/reviews', getDocumentCardReviews);
router.post('/:id/quiz', aiLimiter, createQuiz);
router.post('/:id/ask', aiLimiter, askDocument);
router.get('/:id/ask/history', getAskHistory);
router.delete('/:id/ask/history', clearAskHistory);

export default router;
