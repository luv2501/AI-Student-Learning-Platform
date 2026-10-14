import { Router } from 'express';
import { register, login, getMe, updateMe } from '../controllers/authController.js';
import protect from '../middleware/protect.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);

export default router;
