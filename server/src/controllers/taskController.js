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

/**
 * Calculates startOfToday (00:00:00.000) and endOfToday (23:59:59.999) in UTC
 * relative to the user's local timezone or offset.
 * Supports req.query.timezone, req.headers['x-timezone'], req.query.tzOffset, or req.headers['x-timezone-offset'].
 */
export function getUserTodayRange(req) {
  const timezone = req.query?.timezone || req.headers?.['x-timezone'];
  const offsetHeader = req.query?.tzOffset ?? req.headers?.['x-timezone-offset'];
  const offsetMinutes =
    offsetHeader !== undefined && offsetHeader !== null && offsetHeader !== ''
      ? Number(offsetHeader)
      : NaN;
  const now = new Date();

  if (timezone) {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
      }).formatToParts(now);

      const obj = {};
      for (const p of parts) obj[p.type] = p.value;

      const hour = obj.hour === '24' ? 0 : Number(obj.hour);
      const localNow = new Date(
        Date.UTC(
          Number(obj.year),
          Number(obj.month) - 1,
          Number(obj.day),
          hour,
          Number(obj.minute),
          Number(obj.second)
        )
      );
      const diffMs = localNow.getTime() - now.getTime();
      const startOfTodayLocal = new Date(
        Date.UTC(Number(obj.year), Number(obj.month) - 1, Number(obj.day), 0, 0, 0, 0)
      );
      const startOfTodayUTC = new Date(startOfTodayLocal.getTime() - diffMs);
      const endOfTodayUTC = new Date(startOfTodayUTC.getTime() + 24 * 60 * 60 * 1000 - 1);
      return { startOfToday: startOfTodayUTC, endOfToday: endOfTodayUTC };
    } catch {
      /* fallback on invalid timezone string */
    }
  }

  if (Number.isFinite(offsetMinutes)) {
    // client Date.prototype.getTimezoneOffset() returns minutes difference: UTC - local
    const localTimeMs = now.getTime() - offsetMinutes * 60000;
    const localDate = new Date(localTimeMs);
    const startOfTodayLocal = new Date(
      Date.UTC(localDate.getUTCFullYear(), localDate.getUTCMonth(), localDate.getUTCDate(), 0, 0, 0, 0)
    );
    const startOfTodayUTC = new Date(startOfTodayLocal.getTime() + offsetMinutes * 60000);
    const endOfTodayUTC = new Date(startOfTodayUTC.getTime() + 24 * 60 * 60 * 1000 - 1);
    return { startOfToday: startOfTodayUTC, endOfToday: endOfTodayUTC };
  }

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { startOfToday: start, endOfToday: end };
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
