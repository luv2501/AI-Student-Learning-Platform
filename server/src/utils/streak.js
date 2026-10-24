import User from '../models/User.js';

/**
 * Formats a Date object into 'YYYY-MM-DD' within the specified timezone.
 * Falls back to 'UTC' if the specified timezone is invalid or unresolvable.
 */
export function getDateString(date = new Date(), timezone = 'UTC') {
  const d = date instanceof Date ? date : new Date(date);
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone || 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(d);
  } catch {
    const fallbackFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return fallbackFormatter.format(d);
  }
}

/**
 * Returns the calendar date string (YYYY-MM-DD) for 1 day before the given date string.
 * Uses UTC date arithmetic to ensure daylight saving safety.
 */
export function getYesterdayString(dateString) {
  return getDaysAgoString(dateString, 1);
}

/**
 * Returns the calendar date string (YYYY-MM-DD) for N days before the given date string.
 */
export function getDaysAgoString(dateString, daysAgo = 1) {
  const [year, month, day] = dateString.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

/**
 * Pure calculation for timezone-aware streak state.
 *
 * Rules:
 * - If lastActiveDate === todayString, maintain current streak.
 * - If lastActiveDate === yesterdayString (1 calendar day difference), increment streakCount += 1.
 * - If gap > 1 day or no prior lastActiveDate, reset streakCount = 1.
 * - longestStreak = max(longestStreak, streakCount).
 *
 * @param {Object} user - User document or object with streakCount, longestStreak, lastActiveDate
 * @param {string} timezone - Target IANA timezone (default 'UTC')
 * @param {string|null} todayStringOverride - Optional explicit YYYY-MM-DD for deterministic testing
 * @returns {{ streakCount: number, longestStreak: number, lastActiveDate: string }}
 */
export function calculateStreak(user, timezone = 'UTC', todayStringOverride = null) {
  const today = todayStringOverride || getDateString(new Date(), timezone);
  const yesterday = getYesterdayString(today);

  let streakCount = Number(user?.streakCount) || 0;
  let longestStreak = Number(user?.longestStreak) || 0;
  const lastActiveDate = user?.lastActiveDate || null;

  if (lastActiveDate === today) {
    // Already active today: maintain current streak (guarantee >= 1)
    streakCount = Math.max(streakCount, 1);
  } else if (lastActiveDate === yesterday) {
    // Consecutive calendar day
    streakCount += 1;
  } else {
    // Gap > 1 day or no prior lastActiveDate
    streakCount = 1;
  }

  longestStreak = Math.max(longestStreak, streakCount);

  return {
    streakCount,
    longestStreak,
    lastActiveDate: today,
  };
}

/**
 * Evaluates the user's active streak without recording a new activity.
 * If the user's last activity was today or yesterday, the streak is alive.
 * If the last activity was older than yesterday (or none), the streak has lapsed to 0.
 */
export function getActiveStreak(user, timezone = 'UTC', todayStringOverride = null) {
  const today = todayStringOverride || getDateString(new Date(), timezone);
  const yesterday = getYesterdayString(today);
  const lastActiveDate = user?.lastActiveDate || null;

  if (!lastActiveDate) return 0;
  if (lastActiveDate === today || lastActiveDate === yesterday) {
    return Number(user?.streakCount) || 0;
  }
  return 0;
}

/**
 * Builds a 7-day array ending on todayString:
 * `[{ date: 'YYYY-MM-DD', dayName: 'Mon', minutes: 0 }, ...]`
 */
export function getWeeklyBreakdownDays(todayString) {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days = [];

  for (let i = 6; i >= 0; i--) {
    const dateStr = getDaysAgoString(todayString, i);
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(Date.UTC(year, month - 1, day));
    const dayName = dayNames[d.getUTCDay()];
    days.push({
      date: dateStr,
      dayName,
      minutes: 0,
    });
  }

  return days;
}

/**
 * Convenience helper to record activity on a user document in MongoDB.
 */
export async function recordUserActivity(userOrId, timezone = 'UTC', todayStringOverride = null) {
  let user = userOrId;
  if (typeof userOrId === 'string' || userOrId?._bsontype === 'ObjectID' || userOrId?.constructor?.name === 'ObjectId') {
    user = await User.findById(userOrId);
  }
  if (!user) return null;

  const nextStreak = calculateStreak(user, timezone, todayStringOverride);
  user.streakCount = nextStreak.streakCount;
  user.longestStreak = nextStreak.longestStreak;
  user.lastActiveDate = nextStreak.lastActiveDate;

  if (typeof user.save === 'function') {
    await user.save();
  } else {
    await User.findByIdAndUpdate(user._id || user.id, {
      $set: {
        streakCount: nextStreak.streakCount,
        longestStreak: nextStreak.longestStreak,
        lastActiveDate: nextStreak.lastActiveDate,
      },
    });
  }

  return nextStreak;
}
