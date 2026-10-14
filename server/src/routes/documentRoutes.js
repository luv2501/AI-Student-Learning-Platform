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
} from '../controllers/documentController.js';

const router = Router();

// Every document route is private and ownership is checked in each handler.
router.use(protect);

router.route('/').get(listDocuments).post(uploadPdf, uploadDocument);
router.route('/:id').get(getDocument).delete(deleteDocument);

router.post('/:id/notes', aiLimiter, createNotes);
router.post('/:id/flashcards', aiLimiter, createFlashcards);
router.post('/:id/quiz', aiLimiter, createQuiz);
router.post('/:id/ask', aiLimiter, askDocument);

export default router;
