import { Router } from 'express';
import protect from '../middleware/protect.js';
import {
  listTasks,
  taskStats,
  createTask,
  updateTask,
  toggleTask,
  deleteTask,
} from '../controllers/taskController.js';

const router = Router();

// Every task route requires a logged in user, and each handler
// filters by req.user._id so users only ever see their own data.
router.use(protect);

router.get('/stats', taskStats);
router.route('/').get(listTasks).post(createTask);
router.patch('/:id/toggle', toggleTask);
router.route('/:id').put(updateTask).delete(deleteTask);

export default router;
