import Task from '../models/Task.js';
import apiError from '../utils/apiError.js';

/** Incomplete first, then earliest due date (undated last), then newest. */
function byUrgency(a, b) {
  if (a.completed !== b.completed) return a.completed ? 1 : -1;
  if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
  if (a.dueDate) return -1;
  if (b.dueDate) return 1;
  return new Date(b.createdAt) - new Date(a.createdAt);
}

function setCompleted(task, completed) {
  task.completed = Boolean(completed);
  task.completedAt = task.completed ? new Date() : null;
}

/** GET /api/tasks?status=pending|completed&subject=Maths */
export async function listTasks(req, res) {
  const filter = { user: req.user._id };

  if (req.query.status === 'pending') filter.completed = false;
  if (req.query.status === 'completed') filter.completed = true;
  if (req.query.subject) filter.subject = req.query.subject;

  const tasks = await Task.find(filter).lean();
  res.json({ tasks: tasks.sort(byUrgency) });
}

/** GET /api/tasks/stats */
export async function taskStats(req, res) {
  const tasks = await Task.find({ user: req.user._id }).select('completed dueDate').lean();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setHours(23, 59, 59, 999);

  const isOpenWithDate = (t) => !t.completed && t.dueDate;
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;

  res.json({
    stats: {
      total,
      completed,
      pending: total - completed,
      dueToday: tasks.filter(
        (t) => isOpenWithDate(t) && t.dueDate >= startOfToday && t.dueDate <= endOfToday
      ).length,
      overdue: tasks.filter((t) => isOpenWithDate(t) && t.dueDate < startOfToday).length,
      completionRate: total ? Math.round((completed / total) * 100) : 0,
    },
  });
}

/** POST /api/tasks */
export async function createTask(req, res) {
  const { title, description, subject, priority, dueDate } = req.body;

  if (!title || !String(title).trim()) throw apiError(400, 'Title is required');

  const task = await Task.create({
    user: req.user._id,
    title,
    description: description || '',
    subject: String(subject || '').trim() || 'General',
    ...(priority ? { priority } : {}),
    dueDate: dueDate || null,
  });

  res.status(201).json({ task });
}

/** PUT /api/tasks/:id */
export async function updateTask(req, res) {
  const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
  if (!task) throw apiError(404, 'Task not found');

  const { title, description, subject, priority, dueDate, completed } = req.body;

  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (subject !== undefined) task.subject = String(subject).trim() || 'General';
  if (priority !== undefined) task.priority = priority;
  if (dueDate !== undefined) task.dueDate = dueDate || null;
  if (completed !== undefined) setCompleted(task, completed);

  await task.save();
  res.json({ task });
}

/** PATCH /api/tasks/:id/toggle */
export async function toggleTask(req, res) {
  const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
  if (!task) throw apiError(404, 'Task not found');

  setCompleted(task, !task.completed);
  await task.save();

  res.json({ task });
}

/** DELETE /api/tasks/:id */
export async function deleteTask(req, res) {
  const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!task) throw apiError(404, 'Task not found');

  res.json({ message: 'Task deleted', id: task._id });
}
