import mongoose from 'mongoose';
import StudySession from '../models/StudySession.js';
import Document from '../models/Document.js';
import apiError from '../utils/apiError.js';
import {
  getDateString,
  calculateStreak,
  getActiveStreak,
  getWeeklyBreakdownDays,
} from '../utils/streak.js';

const VALID_TYPES = ['pomodoro', 'short_break', 'long_break', 'free_focus'];
const FOCUS_TYPES = ['pomodoro', 'free_focus'];

function getClientTimezone(req) {
  return (
    req.headers['x-user-timezone'] ||
    req.headers['x-timezone'] ||
    req.query?.timezone ||
    'UTC'
  );
}

/**
 * POST /api/timer/session
 * Records a study session and advances/maintains the user's study streak.
 */
export async function recordSession(req, res) {
  const { durationMinutes, type = 'pomodoro', documentId } = req.body || {};

  const numMinutes = Number(durationMinutes);
  if (!numMinutes || isNaN(numMinutes) || numMinutes < 1) {
    throw apiError(400, 'Duration in minutes must be a positive number');
  }

  if (type && !VALID_TYPES.includes(type)) {
    throw apiError(400, `Invalid session type. Must be one of: ${VALID_TYPES.join(', ')}`);
  }

  let validDocId = null;
  if (documentId) {
    if (!mongoose.isValidObjectId(documentId)) {
      throw apiError(400, 'Invalid documentId provided');
    }
    const doc = await Document.findOne({ _id: documentId, user: req.user._id });
    if (!doc) {
      throw apiError(404, 'Associated document not found');
    }
    validDocId = doc._id;
  }

  const timezone = getClientTimezone(req);

  const session = await StudySession.create({
    userId: req.user._id,
    documentId: validDocId,
    durationMinutes: Math.round(numMinutes),
    type: type || 'pomodoro',
    completedAt: new Date(),
  });

  // Calculate and persist updated streak
  const streakResult = calculateStreak(req.user, timezone);
  req.user.streakCount = streakResult.streakCount;
  req.user.longestStreak = streakResult.longestStreak;
  req.user.lastActiveDate = streakResult.lastActiveDate;
  await req.user.save();

  res.status(201).json({
    session,
    streak: {
      streakCount: req.user.streakCount,
      longestStreak: req.user.longestStreak,
      lastActiveDate: req.user.lastActiveDate,
      current: req.user.streakCount,
      longest: req.user.longestStreak,
    },
  });
}

/**
 * GET /api/timer/stats
 * Returns streak status, today's focus minutes, total focus minutes,
 * and a 7-day calendar breakdown in the client's timezone.
 */
export async function getTimerStats(req, res) {
  const timezone = getClientTimezone(req);
  const todayString = getDateString(new Date(), timezone);

  // Initialize last 7 days breakdown ending today
  const weeklyBreakdown = getWeeklyBreakdownDays(todayString);
  const dateMap = new Map();
  weeklyBreakdown.forEach((item) => dateMap.set(item.date, item));

  // Retrieve user's sessions
  const sessions = await StudySession.find({ userId: req.user._id })
    .sort({ completedAt: -1 })
    .lean();

  let todayMinutes = 0;
  let totalMinutes = 0;

  for (const session of sessions) {
    if (FOCUS_TYPES.includes(session.type)) {
      totalMinutes += session.durationMinutes;

      const sessionDateStr = getDateString(session.completedAt, timezone);
      if (sessionDateStr === todayString) {
        todayMinutes += session.durationMinutes;
      }

      if (dateMap.has(sessionDateStr)) {
        dateMap.get(sessionDateStr).minutes += session.durationMinutes;
      }
    }
  }

  const currentStreak = getActiveStreak(req.user, timezone);

  res.json({
    streak: {
      current: currentStreak,
      longest: req.user.longestStreak || 0,
      lastActiveDate: req.user.lastActiveDate || null,
      streakCount: req.user.streakCount || 0,
    },
    todayMinutes,
    totalMinutes,
    weeklyBreakdown,
  });
}
