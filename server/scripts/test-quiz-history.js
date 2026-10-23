/**
 * Quiz History & Weak Spots Detection Verification Suite (Task 5.3).
 * Tests QuizAttempt model validations & compound indexes, attempt submission,
 * score calculation, weak spots aggregation algorithm, document history,
 * summary metrics, multi-user isolation, and cascade cleanup.
 *
 * Run via: node server/scripts/test-quiz-history.js
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

const PORT = 5098;
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
process.env.MONGO_URI = mongo.getUri('filesense_quiz_test');
process.env.JWT_SECRET = 'test_secret_for_quiz_suite';

const { default: app } = await import('../src/app.js');
const { default: connectDB } = await import('../src/config/db.js');
const { default: DocumentModel } = await import('../src/models/Document.js');
const { default: QuizAttemptModel } = await import('../src/models/QuizAttempt.js');
const { calculateWeakSpots } = await import('../src/controllers/quizController.js');

await connectDB();
const server = app.listen(PORT);

try {
  // Seed two distinct users
  const { data: authA } = await call('POST', '/auth/register', {
    body: { name: 'Alice Quizzer', email: 'alice.quiz@example.com', password: 'password123' },
  });
  const tokenA = authA.token;
  const userAId = authA.user.id;

  const { data: authB } = await call('POST', '/auth/register', {
    body: { name: 'Bob Quizzer', email: 'bob.quiz@example.com', password: 'password123' },
  });
  const tokenB = authB.token;
  const userBId = authB.user.id;

  // Seed documents
  const docA = await DocumentModel.create({
    user: userAId,
    originalName: 'CellBiology.pdf',
    fileName: 'cell_bio.pdf',
    filePath: 'uploads/cell_bio.pdf',
    size: 2048,
    pageCount: 12,
    extractedText: 'Mitochondria produce ATP through cellular respiration. Chloroplasts carry out photosynthesis in plant cells. The nucleus stores genetic DNA. Ribosomes synthesize proteins.',
    quiz: [
      {
        question: 'Which organelle produces ATP through cellular respiration?',
        options: ['Mitochondria', 'Chloroplast', 'Ribosome', 'Golgi'],
        correctIndex: 0,
        explanation: 'Mitochondria are the powerhouse of the cell.',
        topic: 'Cellular Respiration',
      },
      {
        question: 'Where does photosynthesis take place in plants?',
        options: ['Nucleus', 'Chloroplast', 'Mitochondria', 'Vacuole'],
        correctIndex: 1,
        explanation: 'Chloroplasts absorb sunlight for photosynthesis.',
        topic: 'Photosynthesis',
      },
      {
        question: 'What organelle synthesizes proteins?',
        options: ['Ribosome', 'Lysosome', 'Nucleus', 'Cell Wall'],
        correctIndex: 0,
        explanation: 'Ribosomes assemble amino acids into proteins.',
        topic: 'Protein Synthesis',
      },
    ],
  });

  const docB = await DocumentModel.create({
    user: userBId,
    originalName: 'Chemistry.pdf',
    fileName: 'chem.pdf',
    filePath: 'uploads/chem.pdf',
    size: 1024,
    pageCount: 5,
    extractedText: 'Acids have a pH less than 7. Bases have a pH greater than 7.',
    quiz: [
      {
        question: 'What is the pH of a neutral solution?',
        options: ['7', '1', '14', '0'],
        correctIndex: 0,
        explanation: 'Pure water has a neutral pH of 7.',
        topic: 'Acids and Bases',
      },
    ],
  });

  // --- 1. Model Validations & Indexes ---
  console.log('\n--- 1. QuizAttempt Model Validations & Indexes ---');
  {
    const indexes = QuizAttemptModel.schema.indexes();
    const hasCompoundDocIndex = indexes.some(
      ([fields]) => fields.userId === 1 && fields.documentId === 1 && fields.createdAt === -1
    );
    const hasUserCreatedIndex = indexes.some(
      ([fields]) => fields.userId === 1 && fields.createdAt === -1
    );

    check('compound index { userId: 1, documentId: 1, createdAt: -1 } exists', hasCompoundDocIndex);
    check('user index { userId: 1, createdAt: -1 } exists', hasUserCreatedIndex);

    let failedValidation = false;
    try {
      await QuizAttemptModel.create({
        userId: userAId,
      });
    } catch {
      failedValidation = true;
    }
    check('rejects QuizAttempt creation when required fields are missing', failedValidation);
  }

  // --- 2. Weak Spots Calculation Engine ---
  console.log('\n--- 2. Weak Spots Calculation Engine ---');
  {
    const mockAttempts = [
      {
        documentId: docA._id,
        answers: [
          { topic: 'Photosynthesis', isCorrect: false },
          { topic: 'Photosynthesis', isCorrect: false },
          { topic: 'Cellular Respiration', isCorrect: true },
          { topic: 'Cellular Respiration', isCorrect: true },
          { topic: 'Protein Synthesis', isCorrect: false },
          { topic: 'Protein Synthesis', isCorrect: true },
        ],
      },
      {
        documentId: docA._id,
        answers: [
          { topic: 'Photosynthesis', isCorrect: true },
          { topic: 'Protein Synthesis', isCorrect: false },
        ],
      },
    ];

    const weakSpots = calculateWeakSpots(mockAttempts);

    // Photosynthesis: 1 correct, 2 missed -> 33% accuracy, 2 missed -> weak spot!
    const photo = weakSpots.find((w) => w.topic === 'Photosynthesis');
    check('identifies Photosynthesis as weak spot (missed >= 2, acc < 60%)', Boolean(photo));
    check('calculates accurate Photosynthesis percentage (33%)', photo?.accuracy === 33);
    check('records 2 missed count for Photosynthesis', photo?.missedCount === 2);

    // Protein Synthesis: 1 correct, 2 missed -> 33% accuracy, 2 missed -> weak spot!
    const protein = weakSpots.find((w) => w.topic === 'Protein Synthesis');
    check('identifies Protein Synthesis as weak spot', Boolean(protein));

    // Cellular Respiration: 2 correct, 0 missed -> 100% accuracy, 0 missed -> NOT a weak spot!
    const respiration = weakSpots.find((w) => w.topic === 'Cellular Respiration');
    check('excludes Cellular Respiration from weak spots (100% accuracy, 0 missed)', respiration === undefined);
  }

  // --- 3. Endpoints & Quiz History Persistence ---
  console.log('\n--- 3. Endpoints & Quiz History Persistence ---');
  {
    // Initial history is empty
    const initialRes = await call('GET', `/documents/${docA._id}/quizzes/attempts`, { token: tokenA });
    check('GET /api/documents/:id/quizzes/attempts returns 200', initialRes.status === 200);
    check('initial document attempts list is empty', initialRes.data.attempts.length === 0);
    check('initial weak spots is empty', initialRes.data.weakSpots.length === 0);

    // Submit attempt 1: user misses 2 questions
    const attempt1Payload = {
      documentId: docA._id.toString(),
      answers: [
        {
          question: 'Which organelle produces ATP through cellular respiration?',
          selectedOption: 'Mitochondria',
          correctOption: 'Mitochondria',
          isCorrect: true,
          topic: 'Cellular Respiration',
        },
        {
          question: 'Where does photosynthesis take place in plants?',
          selectedOption: 'Nucleus',
          correctOption: 'Chloroplast',
          isCorrect: false,
          topic: 'Photosynthesis',
        },
        {
          question: 'What organelle synthesizes proteins?',
          selectedOption: 'Lysosome',
          correctOption: 'Ribosome',
          isCorrect: false,
          topic: 'Protein Synthesis',
        },
      ],
    };

    const submitRes1 = await call('POST', '/quizzes/attempts', {
      token: tokenA,
      body: attempt1Payload,
    });

    check('POST /api/quizzes/attempts returns 201', submitRes1.status === 201);
    check('calculates score of 33% for 1/3 correct', submitRes1.data.attempt.score === 33);
    check('records totalQuestions 3', submitRes1.data.attempt.totalQuestions === 3);
    check('records correctCount 1', submitRes1.data.attempt.correctCount === 1);
    check('returns detected weak spots in submit response', submitRes1.data.weakSpots.length > 0);

    // Submit attempt 2: user misses Photosynthesis again
    const attempt2Payload = {
      documentId: docA._id.toString(),
      answers: [
        {
          question: 'Where does photosynthesis take place in plants?',
          selectedOption: 'Mitochondria',
          correctOption: 'Chloroplast',
          isCorrect: false,
          topic: 'Photosynthesis',
        },
        {
          question: 'What organelle synthesizes proteins?',
          selectedOption: 'Ribosome',
          correctOption: 'Ribosome',
          isCorrect: true,
          topic: 'Protein Synthesis',
        },
      ],
    };

    const submitRes2 = await call('POST', '/quizzes/attempts', {
      token: tokenA,
      body: attempt2Payload,
    });

    check('second attempt returns 201', submitRes2.status === 201);
    check('calculates score of 50% for 1/2 correct', submitRes2.data.attempt.score === 50);

    // Fetch document attempts
    const docHistoryRes = await call('GET', `/documents/${docA._id}/quizzes/attempts`, { token: tokenA });
    check('document attempts count is now 2', docHistoryRes.data.attempts.length === 2);
    check('attempts are sorted reverse chronologically', docHistoryRes.data.attempts[0]._id === submitRes2.data.attempt._id);

    // Fetch user-wide weak spots
    const weakSpotsRes = await call('GET', '/quizzes/weak-spots', { token: tokenA });
    check('GET /api/quizzes/weak-spots returns 200', weakSpotsRes.status === 200);
    const topWeak = weakSpotsRes.data.weakSpots[0];
    check('identifies Photosynthesis as top weak spot with 2 missed', topWeak?.topic === 'Photosynthesis' && topWeak?.missedCount === 2);

    // Fetch history summary for dashboard
    const summaryRes = await call('GET', '/quizzes/history/summary', { token: tokenA });
    check('GET /api/quizzes/history/summary returns 200', summaryRes.status === 200);
    check('summary reports totalAttempts 2', summaryRes.data.totalAttempts === 2);
    check('summary reports averageScore 42% (avg of 33 and 50)', summaryRes.data.averageScore === 42);
    check('summary reports bestScore 50%', summaryRes.data.bestScore === 50);
    check('summary includes scoreTrend with 2 data points', summaryRes.data.scoreTrend.length === 2);
    check('summary includes top weak spots list', summaryRes.data.weakSpots.length > 0);

    // Validation: rejects missing documentId
    const rejectNoDoc = await call('POST', '/quizzes/attempts', {
      token: tokenA,
      body: { answers: [{ question: 'Q', isCorrect: true }] },
    });
    check('rejects attempt submission with missing documentId (400)', rejectNoDoc.status === 400);

    // Validation: rejects empty answers array
    const rejectEmpty = await call('POST', '/quizzes/attempts', {
      token: tokenA,
      body: { documentId: docA._id.toString(), answers: [] },
    });
    check('rejects attempt submission with empty answers array (400)', rejectEmpty.status === 400);

    // Validation: targeted quiz rejects invalid documentId
    const rejectTargetedInvalid = await call('POST', '/ai/quiz/weak-spots', {
      token: tokenA,
      body: { documentId: 'invalid-id' },
    });
    check('rejects targeted quiz request with invalid documentId (400)', rejectTargetedInvalid.status === 400);

    // Validation: User B cannot trigger targeted quiz on User A document
    const rejectTargetedUserB = await call('POST', '/ai/quiz/weak-spots', {
      token: tokenB,
      body: { documentId: docA._id.toString() },
    });
    check('User B cannot trigger targeted quiz for User A document (404)', rejectTargetedUserB.status === 404);
  }

  // --- 4. Multi-User Isolation & Cascade Deletion ---
  console.log('\n--- 4. Multi-User Isolation & Cascade Deletion ---');
  {
    // User B attempts to access User A's document history
    const userBAccess = await call('GET', `/documents/${docA._id}/quizzes/attempts`, { token: tokenB });
    check('User B cannot view User A document quiz attempts (returns 404)', userBAccess.status === 404);

    // User B attempts to submit attempt for User A's document
    const userBSubmit = await call('POST', '/quizzes/attempts', {
      token: tokenB,
      body: {
        documentId: docA._id.toString(),
        answers: [{ question: 'Q', isCorrect: true, topic: 'Cell' }],
      },
    });
    check('User B cannot submit quiz attempt for User A document (returns 404)', userBSubmit.status === 404);

    // User B has empty weak spots
    const userBWeak = await call('GET', '/quizzes/weak-spots', { token: tokenB });
    check('User B has 0 weak spots', userBWeak.data.weakSpots.length === 0);

    // Verify QuizAttempt records exist before document deletion
    const attemptsBefore = await QuizAttemptModel.countDocuments({ documentId: docA._id });
    check('QuizAttempt records exist before document deletion (count: 2)', attemptsBefore === 2);

    // Delete Document A as User A
    const deleteDocRes = await call('DELETE', `/documents/${docA._id}`, { token: tokenA });
    check('document deletion returns 200', deleteDocRes.status === 200);

    // Verify cascade deletion cleaned up QuizAttempt records
    const attemptsAfter = await QuizAttemptModel.countDocuments({ documentId: docA._id });
    check('cascade delete removed all associated QuizAttempt records (count: 0)', attemptsAfter === 0);
  }

  console.log(`\n${passed} passed, ${failed} failed\n`);
} catch (err) {
  console.error('Test suite failed with unexpected error:', err);
  failed++;
} finally {
  server.close();
  await mongoose.disconnect();
  await mongo.stop();
  process.exit(failed > 0 ? 1 : 0);
}
