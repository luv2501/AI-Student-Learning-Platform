/**
 * Spaced Repetition (SM-2) Verification Suite (Task 5.2).
 * Tests deterministic cardId, SM-2 mathematical model, review submission,
 * due cards aggregation, user isolation, and cascade cleanup.
 *
 * Run via: node server/scripts/test-spaced-repetition.js
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

const PORT = 5099;
const BASE = `http://127.0.0.1:${PORT}/api`;

let passed = 0;
let failed = 0;

function check(name, ok, extra = '') {
  if (ok) {
    passed++;
    console.log(`  ok    ${name}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name} ${extra}`);
  }
}

async function call(method, apiPath, { body, token } = {}) {
  const res = await fetch(BASE + apiPath, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

// Start in-memory MongoDB
const mongo = await MongoMemoryServer.create();
process.env.MONGO_URI = mongo.getUri('filesense_sm2_test');
process.env.JWT_SECRET = 'test_secret_for_sm2_suite';

const { default: app } = await import('../src/app.js');
const { default: connectDB } = await import('../src/config/db.js');
const { default: DocumentModel } = await import('../src/models/Document.js');
const { default: CardReviewModel } = await import('../src/models/CardReview.js');
const { computeCardId } = await import('../src/utils/cardId.js');
const {
  calculateNextReview,
  previewRatings,
  getCardState,
  MIN_EASE_FACTOR,
  DEFAULT_EASE_FACTOR,
} = await import('../src/utils/sm2.js');

await connectDB();
const server = app.listen(PORT);

console.log('\n--- 1. Deterministic Card Identifier ---');
{
  const id1 = computeCardId('What is mitochondria?');
  const id2 = computeCardId('  what is mitochondria?  ');
  const id3 = computeCardId('WHAT IS MITOCHONDRIA?');
  const diffId = computeCardId('What is a ribosome?');

  check('cardId is deterministic across casing and extra whitespace', id1 === id2 && id2 === id3);
  check('cardId has 16 characters hex string', /^[a-f0-9]{16}$/.test(id1));
  check('distinct questions produce distinct card IDs', id1 !== diffId);
}

console.log('\n--- 2. SM-2 Algorithm Mathematical Correctness ---');
{
  const baseTime = new Date('2026-10-23T12:00:00Z');

  // New card initial state
  const initial = { repetition: 0, interval: 0, easeFactor: DEFAULT_EASE_FACTOR };

  // Rating 1: Again
  const rAgain = calculateNextReview(initial, 1, baseTime);
  check('Again resets repetition to 0', rAgain.repetition === 0);
  check('Again sets interval to 1 day', rAgain.interval === 1);
  check('Again reduces easeFactor by 0.2', rAgain.easeFactor === 2.3);
  check('Again dueDate is 1 day in future', rAgain.dueDate.getTime() === baseTime.getTime() + 86400000);

  // Rating 2: Hard
  const rHard = calculateNextReview(initial, 2, baseTime);
  check('Hard increments repetition to 1', rHard.repetition === 1);
  check('Hard sets interval >= 1', rHard.interval >= 1);
  check('Hard reduces easeFactor by 0.15', rHard.easeFactor === 2.35);

  // Rating 3: Good progression (standard SM-2: 1d -> 6d -> round(prev * EF))
  const step1 = calculateNextReview(initial, 3, baseTime);
  check('Good rep 1 sets interval to 1d', step1.repetition === 1 && step1.interval === 1);
  check('Good keeps easeFactor unchanged', step1.easeFactor === DEFAULT_EASE_FACTOR);

  const step2 = calculateNextReview(step1, 3, baseTime);
  check('Good rep 2 sets interval to 6d', step2.repetition === 2 && step2.interval === 6);

  const step3 = calculateNextReview(step2, 3, baseTime);
  check('Good rep 3 scales interval (6 * 2.5 = 15d)', step3.repetition === 3 && step3.interval === 15);

  // Rating 4: Easy progression
  const rEasy = calculateNextReview(initial, 4, baseTime);
  check('Easy rep 1 gives bonus interval >= 3d', rEasy.repetition === 1 && rEasy.interval >= 3);
  check('Easy increases easeFactor by 0.15', rEasy.easeFactor === 2.65);

  // Minimum ease factor floor (1.3)
  let lowEF = { repetition: 2, interval: 6, easeFactor: 1.35 };
  const floored = calculateNextReview(lowEF, 1, baseTime);
  check('easeFactor is clamped to minimum 1.3 floor', floored.easeFactor === MIN_EASE_FACTOR);

  // Preview helper
  const previews = previewRatings({ repetition: 2, interval: 6, easeFactor: 2.5 }, baseTime);
  check('previewRatings provides formatted interval for rating 1', previews[1].text === '1d');
  check('previewRatings provides formatted interval for rating 3', previews[3].text === '15d');

  // State classifier
  const stateNew = getCardState(null, baseTime);
  check('classifier reports New for unreviewed card', stateNew.status === 'New');

  const stateDue = getCardState({ repetition: 3, interval: 10, dueDate: new Date('2026-10-22T00:00:00Z'), lastReviewed: baseTime }, baseTime);
  check('classifier reports Due when dueDate <= now', stateDue.status === 'Due');

  const stateLearning = getCardState({ repetition: 1, interval: 6, dueDate: new Date('2026-10-30T00:00:00Z'), lastReviewed: baseTime }, baseTime);
  check('classifier reports Learning when repetition < 2', stateLearning.status === 'Learning');

  const stateReview = getCardState({ repetition: 3, interval: 15, dueDate: new Date('2026-10-30T00:00:00Z'), lastReviewed: baseTime }, baseTime);
  check('classifier reports Review when repetition >= 2 and not due', stateReview.status === 'Review');
}

console.log('\n--- 3. Endpoints & Review Lifecycle ---');
{
  const { data: authA } = await call('POST', '/auth/register', {
    body: { name: 'Student SM2', email: 'sm2@example.com', password: 'password123' },
  });
  const tokenA = authA.token;
  const userAId = authA.user.id;

  const q1 = 'What organelle produces ATP?';
  const q2 = 'What organelle synthesizes proteins?';
  const q3 = 'What organelle contains genetic DNA?';
  const cid1 = computeCardId(q1);
  const cid2 = computeCardId(q2);
  const cid3 = computeCardId(q3);

  const doc = await DocumentModel.create({
    user: userAId,
    originalName: 'cells.pdf',
    fileName: 'cells.pdf',
    filePath: 'cells.pdf',
    size: 2048,
    pageCount: 1,
    extractedText: 'Cells contain mitochondria, ribosomes, and a nucleus.',
    flashcards: [
      { cardId: cid1, question: q1, answer: 'Mitochondria' },
      { cardId: cid2, question: q2, answer: 'Ribosomes' },
      { cardId: cid3, question: q3, answer: 'Nucleus' },
    ],
    textLength: 50,
  });

  // Verify initial reviews endpoint for document
  const initialReviews = await call('GET', `/documents/${doc._id}/flashcards/reviews`, { token: tokenA });
  check('GET /documents/:id/flashcards/reviews returns 200', initialReviews.status === 200);
  check('initial reviews list is empty', initialReviews.data.reviews.length === 0);

  // Verify initial due-count (all 3 unreviewed cards are due)
  const dueCountRes = await call('GET', '/flashcards/due-count', { token: tokenA });
  check('GET /flashcards/due-count reports 3 unreviewed cards', dueCountRes.data.dueCount === 3);

  // Verify due cards list
  const dueCardsRes = await call('GET', '/flashcards/due', { token: tokenA });
  check('GET /flashcards/due returns 3 cards with document metadata', dueCardsRes.data.dueCards.length === 3 && dueCardsRes.data.dueCards[0].documentTitle === 'cells.pdf');

  // Submit review for card 1: Good (3)
  const rev1 = await call('POST', '/flashcards/review', {
    token: tokenA,
    body: { documentId: doc._id, cardId: cid1, rating: 3 },
  });
  check('POST /flashcards/review returns 200', rev1.status === 200);
  check('review response has repetition 1', rev1.data.review.repetition === 1);
  check('review response has interval 1', rev1.data.review.interval === 1);
  check('review response has easeFactor 2.5', rev1.data.review.easeFactor === 2.5);
  check('review response includes rating previews', Boolean(rev1.data.previews[3]));

  // Submit review for card 2: Easy (4)
  const rev2 = await call('POST', '/flashcards/review', {
    token: tokenA,
    body: { documentId: doc._id, cardId: cid2, rating: 4 },
  });
  check('card 2 Easy review has easeFactor 2.65', rev2.data.review.easeFactor === 2.65);
  check('card 2 Easy review interval >= 3', rev2.data.review.interval >= 3);

  // Submit review for card 3: Again (1)
  const rev3 = await call('POST', '/flashcards/review', {
    token: tokenA,
    body: { documentId: doc._id, cardId: cid3, rating: 1 },
  });
  check('card 3 Again review has repetition 0', rev3.data.review.repetition === 0);
  check('card 3 Again review interval 1', rev3.data.review.interval === 1);

  // Check document reviews map
  const updatedDocReviews = await call('GET', `/documents/${doc._id}/flashcards/reviews`, { token: tokenA });
  check('reviews list now has 3 records', updatedDocReviews.data.reviews.length === 3);
  check('reviewsByCardId map contains card 1 review', Boolean(updatedDocReviews.data.reviewsByCardId[cid1]));

  // Validation: invalid rating
  const invalidRating = await call('POST', '/flashcards/review', {
    token: tokenA,
    body: { documentId: doc._id, cardId: cid1, rating: 5 },
  });
  check('rejects rating outside 1..4 with 400', invalidRating.status === 400);

  // Validation: missing cardId
  const missingCardId = await call('POST', '/flashcards/review', {
    token: tokenA,
    body: { documentId: doc._id, rating: 3 },
  });
  check('rejects missing cardId with 400', missingCardId.status === 400);
}

console.log('\n--- 4. Multi-User Isolation & Cascade Deletion ---');
{
  const { data: authB } = await call('POST', '/auth/register', {
    body: { name: 'Student B', email: 'studentB@example.com', password: 'password123' },
  });
  const tokenB = authB.token;

  // User B has no documents
  const bDueCount = await call('GET', '/flashcards/due-count', { token: tokenB });
  check('User B has 0 due cards', bDueCount.data.dueCount === 0);

  const bDueCards = await call('GET', '/flashcards/due', { token: tokenB });
  check('User B due cards array is empty', bDueCards.data.dueCards.length === 0);

  // User B attempts to review User A document
  const { data: authA } = await call('POST', '/auth/login', {
    body: { email: 'sm2@example.com', password: 'password123' },
  });
  const docA = await DocumentModel.findOne({ user: authA.user.id });

  const unauthorizedReview = await call('POST', '/flashcards/review', {
    token: tokenB,
    body: { documentId: docA._id, cardId: 'somecard', rating: 3 },
  });
  check('User B cannot review User A cards (returns 404)', unauthorizedReview.status === 404);

  const unauthorizedReviewsList = await call('GET', `/documents/${docA._id}/flashcards/reviews`, {
    token: tokenB,
  });
  check('User B cannot fetch User A card reviews (returns 404)', unauthorizedReviewsList.status === 404);

  // Cascade delete test
  const reviewsCountBefore = await CardReviewModel.countDocuments({ documentId: docA._id });
  check('reviews exist before document deletion', reviewsCountBefore > 0);

  await call('DELETE', `/documents/${docA._id}`, { token: authA.token });
  const reviewsCountAfter = await CardReviewModel.countDocuments({ documentId: docA._id });
  check('deleting document cascades and removes all CardReview records', reviewsCountAfter === 0);
}

server.close();
await mongoose.disconnect();
await mongo.stop();

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
