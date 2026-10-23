import express from 'express';
import protect from '../middleware/protect.js';
import {
  submitQuizAttempt,
  getUserWeakSpots,
  createWeakSpotsQuiz,
  getQuizHistorySummary,
} from '../controllers/quizController.js';

const router = express.Router();

router.use(protect);

router.post('/attempts', submitQuizAttempt);
router.get('/weak-spots', getUserWeakSpots);
router.post('/weak-spots', createWeakSpotsQuiz);
router.get('/history/summary', getQuizHistorySummary);

export default router;
