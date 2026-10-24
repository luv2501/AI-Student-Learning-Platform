import Task from '../models/Task.js';
import apiError from '../utils/apiError.js';
import { recordUserActivity } from '../utils/streak.js';

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

/**
 * Calculates startOfToday (00:00:00.000) and endOfToday (23:59:59.999) in UTC
 * relative to the user's local timezone from req.headers['x-timezone'].
 * Validates timezone and falls back to 'UTC' if absent or invalid.
 */
export function getUserTodayRange(req, now = new Date()) {
  let timeZone = 'UTC';
  const rawTz = req.headers?.['x-timezone'] || req.query?.timezone;
  if (rawTz && typeof rawTz === 'string') {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: rawTz.trim() });
      timeZone = rawTz.trim();
    } catch {
      timeZone = 'UTC';
    }
  }

  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(now);

    const getPart = (type) => parts.find((p) => p.type === type)?.value;
    const year = Number(getPart('year'));
    const month = Number(getPart('month'));
    const day = Number(getPart('day'));
    const rawHour = getPart('hour');
    const hour = rawHour === '24' ? 0 : Number(rawHour);
    const minute = Number(getPart('minute'));
    const second = Number(getPart('second'));

    const localWallUtcMs = Date.UTC(year, month - 1, day, hour, minute, second);
    const nowNoMs = Math.floor(now.getTime() / 1000) * 1000;
    const offsetMs = localWallUtcMs - nowNoMs;

    const startOfTodayMs = Date.UTC(year, month - 1, day, 0, 0, 0, 0) - offsetMs;
    const startOfToday = new Date(startOfTodayMs);
    const endOfToday = new Date(startOfTodayMs + 24 * 60 * 60 * 1000 - 1);

    return { timeZone, startOfToday, endOfToday };
  } catch {
    const start = new Date(now);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
    return { timeZone: 'UTC', startOfToday: start, endOfToday: end };
  }
}

/** GET /api/tasks?status=pending|completed&subject=Maths&due=today|overdue */
export async function listTasks(req, res) {
  const filter = { user: req.user._id };
  const { startOfToday, endOfToday } = getUserTodayRange(req);

  if (req.query.status === 'pending') filter.completed = false;
  if (req.query.status === 'completed') filter.completed = true;
  if (req.query.subject) filter.subject = req.query.subject;
  if (req.query.due === 'today') {
    filter.completed = false;
    filter.dueDate = { $gte: startOfToday, $lte: endOfToday };
  } else if (req.query.due === 'overdue') {
    filter.completed = false;
    filter.dueDate = { $lt: startOfToday, $ne: null };
  }

  const tasks = await Task.find(filter).lean();
  res.json({ tasks: tasks.sort(byUrgency) });
}

/** GET /api/tasks/stats */
export async function taskStats(req, res) {
  const tasks = await Task.find({ user: req.user._id }).select('completed dueDate').lean();
  const { startOfToday, endOfToday } = getUserTodayRange(req);

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
  if (task.completed) {
    const tz = req.headers['x-user-timezone'] || req.headers['x-timezone'] || 'UTC';
    await recordUserActivity(req.user, tz).catch(() => {});
  }
  res.json({ task });
}

/** PATCH /api/tasks/:id/toggle */
export async function toggleTask(req, res) {
  const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
  if (!task) throw apiError(404, 'Task not found');

  setCompleted(task, !task.completed);
  await task.save();

  if (task.completed) {
    const tz = req.headers['x-user-timezone'] || req.headers['x-timezone'] || 'UTC';
    await recordUserActivity(req.user, tz).catch(() => {});
  }

  res.json({ task });
}

/** DELETE /api/tasks/:id */
export async function deleteTask(req, res) {
  const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!task) throw apiError(404, 'Task not found');

  res.json({ message: 'Task deleted', id: task._id });
}
