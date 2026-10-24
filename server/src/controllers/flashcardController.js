import mongoose from 'mongoose';
import Document from '../models/Document.js';
import CardReview from '../models/CardReview.js';
import apiError from '../utils/apiError.js';
import { computeCardId } from '../utils/cardId.js';
import {
  calculateNextReview,
  previewRatings,
  getCardState,
  DEFAULT_EASE_FACTOR,
} from '../utils/sm2.js';
import { recordUserActivity } from '../utils/streak.js';

/**
 * POST /api/flashcards/review
 * Submits an SM-2 rating (1: Again, 2: Hard, 3: Good, 4: Easy) for a flashcard.
 */
export async function submitReview(req, res) {
  const { documentId, cardId, rating } = req.body || {};

  if (!documentId || !mongoose.isValidObjectId(documentId)) {
    throw apiError(400, 'A valid documentId is required');
  }

  const cleanCardId = String(cardId || '').trim();
  if (!cleanCardId) {
    throw apiError(400, 'A cardId is required');
  }

  const numRating = Number(rating);
  if (![1, 2, 3, 4].includes(numRating)) {
    throw apiError(400, 'Rating must be an integer between 1 (Again) and 4 (Easy)');
  }

  // Ensure document exists and belongs to the authenticated user
  const doc = await Document.findOne({ _id: documentId, user: req.user._id });
  if (!doc) {
    throw apiError(404, 'Document not found');
  }

  // Fetch current review state if exists
  const existingReview = await CardReview.findOne({
    userId: req.user._id,
    documentId: doc._id,
    cardId: cleanCardId,
  });

  const now = new Date();
  const next = calculateNextReview(existingReview, numRating, now);

  const review = await CardReview.findOneAndUpdate(
    {
      userId: req.user._id,
      documentId: doc._id,
      cardId: cleanCardId,
    },
    {
      $set: {
        repetition: next.repetition,
        interval: next.interval,
        easeFactor: next.easeFactor,
        dueDate: next.dueDate,
        lastReviewed: next.lastReviewed,
      },
      $push: {
        history: {
          rating: numRating,
          reviewedAt: next.lastReviewed,
          interval: next.interval,
          easeFactor: next.easeFactor,
        },
      },
    },
    {
      upsert: true,
      returnDocument: 'after',
      setDefaultsOnInsert: true,
    }
  );

  const tz = req.headers['x-user-timezone'] || req.headers['x-timezone'] || 'UTC';
  await recordUserActivity(req.user, tz).catch(() => {});

  res.json({
    review,
    previews: previewRatings(review, now),
    state: getCardState(review, now),
  });
}

/**
 * Collects all cards due across all user documents (reviewed with dueDate <= now OR never reviewed).
 */
async function getDueCardsForUser(userId) {
  const now = new Date();

  // Find all user documents containing flashcards
  const docs = await Document.find({
    user: userId,
    'flashcards.0': { $exists: true },
  })
    .select('title originalName flashcards createdAt')
    .lean();

  if (!docs.length) {
    return [];
  }

  // Load all review records for this user
  const docIds = docs.map((d) => d._id);
  const reviews = await CardReview.find({
    userId,
    documentId: { $in: docIds },
  }).lean();

  const reviewMap = new Map();
  for (const r of reviews) {
    reviewMap.set(`${r.documentId}_${r.cardId}`, r);
  }

  const dueCards = [];

  for (const doc of docs) {
    const docTitle = doc.title || doc.originalName;
    const cards = Array.isArray(doc.flashcards) ? doc.flashcards : [];

    for (const card of cards) {
      const cid = card.cardId || computeCardId(card.question);
      const review = reviewMap.get(`${doc._id}_${cid}`);

      let isDue = false;
      let dueDate = null;

      if (review) {
        dueDate = new Date(review.dueDate);
        isDue = dueDate.getTime() <= now.getTime();
      } else {
        // Never reviewed before: card is new and due immediately
        isDue = true;
        dueDate = new Date(doc.createdAt || now);
      }

      if (isDue) {
        dueCards.push({
          documentId: doc._id,
          documentTitle: docTitle,
          cardId: cid,
          question: card.question,
          answer: card.answer,
          review: review || null,
          dueDate,
          repetition: review?.repetition ?? 0,
          interval: review?.interval ?? 0,
          easeFactor: review?.easeFactor ?? DEFAULT_EASE_FACTOR,
          isNew: !review,
        });
      }
    }
  }

  // Sort: overdue first (earliest due date first)
  dueCards.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return dueCards;
}

/**
 * GET /api/flashcards/due
 * Returns all cards due for spaced repetition across all documents for a unified session.
 */
export async function getDueCards(req, res) {
  const dueCards = await getDueCardsForUser(req.user._id);
  res.json({ dueCards, count: dueCards.length });
}

/**
 * GET /api/flashcards/due-count
 * Lightweight endpoint returning only the count of cards due today.
 */
export async function getDueCount(req, res) {
  const dueCards = await getDueCardsForUser(req.user._id);
  res.json({ dueCount: dueCards.length });
}

/**
 * GET /api/documents/:id/flashcards/reviews
 * Returns review states for all flashcards in a specific document.
 */
export async function getDocumentCardReviews(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw apiError(400, 'Invalid document ID');
  }

  const doc = await Document.findOne({ _id: req.params.id, user: req.user._id });
  if (!doc) {
    throw apiError(404, 'Document not found');
  }

  const reviews = await CardReview.find({
    userId: req.user._id,
    documentId: doc._id,
  }).lean();

  const reviewsByCardId = {};
  for (const r of reviews) {
    reviewsByCardId[r.cardId] = r;
  }

  res.json({
    reviews,
    reviewsByCardId,
  });
}
