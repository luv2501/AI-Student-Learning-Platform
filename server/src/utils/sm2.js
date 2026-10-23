/**
 * SuperMemo SM-2 Spaced Repetition Algorithm Implementation.
 *
 * Ratings:
 * 1: Again - complete blackout, reset repetitions to 0, 1-day interval
 * 2: Hard - successful recall but with significant difficulty
 * 3: Good - standard correct response with nominal retention
 * 4: Easy - rapid, effortless recall with increased ease bonus
 */

export const MIN_EASE_FACTOR = 1.3;
export const DEFAULT_EASE_FACTOR = 2.5;

/** Formats an interval in days into a concise Geist Mono label (e.g. 1d, 6d, 14d). */
export function formatInterval(days) {
  const d = Math.max(1, Math.round(days));
  if (d < 30) return `${d}d`;
  const months = Math.round(d / 30);
  if (months < 12) return `${months}mo`;
  const years = (d / 365).toFixed(1).replace(/\.0$/, '');
  return `${years}y`;
}

/**
 * Calculates updated SM-2 review parameters for a flashcard based on rating (1..4).
 *
 * @param {Object} current - Current review state (or empty object for new cards)
 * @param {number} rating - User rating (1 = Again, 2 = Hard, 3 = Good, 4 = Easy)
 * @param {Date} [now] - Current timestamp (defaults to new Date())
 * @returns {Object} { repetition, interval, easeFactor, dueDate, lastReviewed }
 */
export function calculateNextReview(current = {}, rating, now = new Date()) {
  const prevRepetition = Number(current?.repetition || 0);
  const prevInterval = Number(current?.interval || 0);
  const prevEaseFactor = Number(current?.easeFactor || DEFAULT_EASE_FACTOR);

  const numRating = Number(rating);
  if (![1, 2, 3, 4].includes(numRating)) {
    throw new Error('Rating must be an integer between 1 (Again) and 4 (Easy)');
  }

  let repetition = prevRepetition;
  let interval = prevInterval;
  let easeFactor = prevEaseFactor;

  switch (numRating) {
    case 1: // Again
      repetition = 0;
      interval = 1;
      easeFactor = Math.max(MIN_EASE_FACTOR, Number((prevEaseFactor - 0.2).toFixed(2)));
      break;

    case 2: // Hard
      repetition = prevRepetition + 1;
      interval = Math.max(1, Math.round((prevInterval || 1) * 1.2));
      easeFactor = Math.max(MIN_EASE_FACTOR, Number((prevEaseFactor - 0.15).toFixed(2)));
      break;

    case 3: // Good
      repetition = prevRepetition + 1;
      if (repetition === 1) {
        interval = 1;
      } else if (repetition === 2) {
        interval = 6;
      } else {
        interval = Math.max(1, Math.round((prevInterval || 1) * prevEaseFactor));
      }
      easeFactor = prevEaseFactor;
      break;

    case 4: // Easy
      repetition = prevRepetition + 1;
      if (prevInterval <= 0) {
        interval = 4;
      } else {
        interval = Math.max(1, Math.round(prevInterval * prevEaseFactor * 1.3));
      }
      easeFactor = Number((prevEaseFactor + 0.15).toFixed(2));
      break;
  }

  // Ensure ease factor never drops below minimum
  easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor);

  const dueDate = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

  return {
    repetition,
    interval,
    easeFactor,
    dueDate,
    lastReviewed: now,
  };
}

/**
 * Previews the next intervals for each rating (1..4) without modifying state.
 * Used by UI buttons to show interval estimates (e.g., "1d", "6d", "14d").
 */
export function previewRatings(current = {}, now = new Date()) {
  const previews = {};
  for (const rating of [1, 2, 3, 4]) {
    const next = calculateNextReview(current, rating, now);
    previews[rating] = {
      interval: next.interval,
      text: formatInterval(next.interval),
      dueDate: next.dueDate,
    };
  }
  return previews;
}

/**
 * Derives a human-readable review state for badges:
 * - 'Due': overdue or never reviewed
 * - 'Learning': repetition < 2
 * - 'Review': repetition >= 2
 */
export function getCardState(review, now = new Date()) {
  if (!review || !review.lastReviewed) {
    return { status: 'New', tone: 'indigo' };
  }
  const isDue = new Date(review.dueDate).getTime() <= now.getTime();
  if (isDue) {
    return { status: 'Due', tone: 'rose' };
  }
  if (review.repetition < 2) {
    return { status: 'Learning', tone: 'amber' };
  }
  return { status: 'Review', tone: 'emerald' };
}

