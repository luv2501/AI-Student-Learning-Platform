import express from 'express';
import protect from '../middleware/protect.js';
import { recordSession, getTimerStats } from '../controllers/timerController.js';

const router = express.Router();

router.use(protect);

router.post('/session', recordSession);
router.get('/stats', getTimerStats);

export default router;
