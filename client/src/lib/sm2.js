/**
 * Frontend SM-2 Spaced Repetition Helpers.
 * Mirrors server/src/utils/sm2.js for instant zero-latency UI preview rendering.
 */

export const MIN_EASE_FACTOR = 1.3;
export const DEFAULT_EASE_FACTOR = 2.5;

export function formatInterval(days) {
  const d = Math.max(1, Math.round(days));
  if (d < 30) return `${d}d`;
  const months = Math.round(d / 30);
  if (months < 12) return `${months}mo`;
  const years = (d / 365).toFixed(1).replace(/\.0$/, '');
  return `${years}y`;
}

export function calculateNextReview(current = {}, rating, now = new Date()) {
  const prevRepetition = Number(current?.repetition || 0);
  const prevInterval = Number(current?.interval || 0);
  const prevEaseFactor = Number(current?.easeFactor || DEFAULT_EASE_FACTOR);

  const numRating = Number(rating);
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

export const RATING_LABELS = {
  1: 'Again',
  2: 'Hard',
  3: 'Good',
  4: 'Easy',
};

export function getCardId(card) {
  if (card?.cardId) return card.cardId;
  const str = String(card?.question || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

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

