import mongoose from 'mongoose';
import Document from '../models/Document.js';
import QuizAttempt from '../models/QuizAttempt.js';
import apiError from '../utils/apiError.js';
import { generateWeakSpotsQuiz } from '../services/aiService.js';

/**
 * Derives weak spots from an array of QuizAttempt documents or plain objects.
 * Topics with accuracy < 60% or repeatedly missed >= 2 times are flagged as weak spots.
 */
export function calculateWeakSpots(attempts = []) {
  if (!Array.isArray(attempts) || !attempts.length) return [];

  const statsByTopic = {};

  for (const attempt of attempts) {
    const answers = Array.isArray(attempt.answers) ? attempt.answers : [];
    for (const ans of answers) {
      const topic = String(ans.topic || 'General').trim() || 'General';
      if (!statsByTopic[topic]) {
        statsByTopic[topic] = {
          topic,
          total: 0,
          correct: 0,
          missed: 0,
          documentIds: new Set(),
        };
      }
      statsByTopic[topic].total += 1;
      if (ans.isCorrect) {
        statsByTopic[topic].correct += 1;
      } else {
        statsByTopic[topic].missed += 1;
      }
      if (attempt.documentId) {
        statsByTopic[topic].documentIds.add(String(attempt.documentId));
      }
    }
  }

  const weakSpots = [];

  for (const stats of Object.values(statsByTopic)) {
    const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    const isWeak = (accuracy < 60 || stats.missed >= 2) && stats.missed > 0;

    if (isWeak) {
      weakSpots.push({
        topic: stats.topic,
        accuracy,
        totalQuestions: stats.total,
        correctCount: stats.correct,
        missedCount: stats.missed,
        documentCount: stats.documentIds.size,
      });
    }
  }

  // Sort by highest miss count first, then lowest accuracy
  weakSpots.sort((a, b) => {
    if (b.missedCount !== a.missedCount) {
      return b.missedCount - a.missedCount;
    }
    return a.accuracy - b.accuracy;
  });

  return weakSpots;
}

/**
 * POST /api/quizzes/attempts
 * Saves a completed quiz attempt with score, answers, and topics.
 */
export async function submitQuizAttempt(req, res) {
  const { documentId, answers, isTargeted, topicsPracticed } = req.body || {};

  if (!documentId || !mongoose.isValidObjectId(documentId)) {
    throw apiError(400, 'A valid documentId is required');
  }

  if (!Array.isArray(answers) || answers.length === 0) {
    throw apiError(400, 'Answers array must contain at least one question result');
  }

  const doc = await Document.findOne({ _id: documentId, user: req.user._id });
  if (!doc) {
    throw apiError(404, 'Document not found');
  }

  const cleanedAnswers = answers.map((a) => {
    if (!a?.question) {
      throw apiError(400, 'Each answer must include a question string');
    }
    return {
      question: String(a.question).trim(),
      selectedOption: String(a.selectedOption || '').trim(),
      correctOption: String(a.correctOption || '').trim(),
      isCorrect: Boolean(a.isCorrect),
      topic: String(a.topic || 'General').trim() || 'General',
    };
  });

  const totalQuestions = cleanedAnswers.length;
  const correctCount = cleanedAnswers.filter((a) => a.isCorrect).length;
  const score = Math.round((correctCount / totalQuestions) * 100);

  const attempt = await QuizAttempt.create({
    userId: req.user._id,
    documentId: doc._id,
    score,
    totalQuestions,
    correctCount,
    answers: cleanedAnswers,
    isTargeted: Boolean(isTargeted),
    topicsPracticed: Array.isArray(topicsPracticed) ? topicsPracticed : [],
  });

  // Calculate updated weak spots for this document
  const docAttempts = await QuizAttempt.find({
    userId: req.user._id,
    documentId: doc._id,
  }).lean();

  const weakSpots = calculateWeakSpots(docAttempts);

  res.status(201).json({
    attempt,
    weakSpots,
  });
}

/**
 * GET /api/documents/:id/quizzes/attempts
 * Returns past attempts for this document sorted chronologically (latest first).
 */
export async function getDocumentQuizAttempts(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw apiError(400, 'Invalid document ID');
  }

  const doc = await Document.findOne({ _id: req.params.id, user: req.user._id });
  if (!doc) {
    throw apiError(404, 'Document not found');
  }

  const attempts = await QuizAttempt.find({
    userId: req.user._id,
    documentId: doc._id,
  })
    .sort({ createdAt: -1 })
    .lean();

  const weakSpots = calculateWeakSpots(attempts);

  res.json({
    attempts,
    count: attempts.length,
    weakSpots,
  });
}

/**
 * GET /api/quizzes/weak-spots
 * Aggregates and returns user's weak topics across all documents.
 */
export async function getUserWeakSpots(req, res) {
  const attempts = await QuizAttempt.find({ userId: req.user._id }).lean();
  const weakSpots = calculateWeakSpots(attempts);

  res.json({
    weakSpots,
    count: weakSpots.length,
  });
}

/**
 * POST /api/ai/quiz/weak-spots
 * Generates a 5-question targeted remediation quiz focusing specifically on gap areas.
 */
export async function createWeakSpotsQuiz(req, res) {
  const { documentId, topics } = req.body || {};

  let targetDoc = null;

  if (documentId) {
    if (!mongoose.isValidObjectId(documentId)) {
      throw apiError(400, 'Invalid documentId provided');
    }
    targetDoc = await Document.findOne({
      _id: documentId,
      user: req.user._id,
    }).select('+extractedText');
  } else {
    // Pick the most relevant document that has questions in these weak topics
    const userDocs = await Document.find({ user: req.user._id })
      .select('+extractedText')
      .sort({ updatedAt: -1 })
      .limit(5);

    if (userDocs.length > 0) {
      targetDoc = userDocs[0];
    }
  }

  if (!targetDoc) {
    throw apiError(404, 'Document not found for generating targeted quiz');
  }

  if (!targetDoc.extractedText) {
    throw apiError(400, 'Document text is empty or unavailable for quiz generation');
  }

  let targetTopics = Array.isArray(topics) && topics.length ? topics : [];

  if (!targetTopics.length) {
    // Automatically find weak spots for this document
    const docAttempts = await QuizAttempt.find({
      userId: req.user._id,
      documentId: targetDoc._id,
    }).lean();
    const docWeakSpots = calculateWeakSpots(docAttempts);
    targetTopics = docWeakSpots.map((w) => w.topic).slice(0, 3);
  }

  if (!targetTopics.length) {
    targetTopics = ['Key Concepts'];
  }

  const questions = await generateWeakSpotsQuiz(targetDoc.extractedText, targetTopics, 5);

  res.json({
    questions,
    topics: targetTopics,
    documentId: targetDoc._id,
    documentTitle: targetDoc.title || targetDoc.originalName,
    isTargeted: true,
  });
}

/**
 * GET /api/quizzes/history/summary
 * Lightweight summary for dashboard metrics (recent attempts, average score, score trend).
 */
export async function getQuizHistorySummary(req, res) {
  const attempts = await QuizAttempt.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .populate('documentId', 'title originalName')
    .lean();

  const totalAttempts = attempts.length;

  if (totalAttempts === 0) {
    return res.json({
      totalAttempts: 0,
      averageScore: 0,
      bestScore: 0,
      recentAttempts: [],
      scoreTrend: [],
      weakSpots: [],
    });
  }

  const totalScore = attempts.reduce((sum, a) => sum + (a.score || 0), 0);
  const averageScore = Math.round(totalScore / totalAttempts);
  const bestScore = Math.max(...attempts.map((a) => a.score || 0));

  const recentAttempts = attempts.slice(0, 8).map((a) => {
    const docTitle = a.documentId?.title || a.documentId?.originalName || 'Untitled Document';
    return {
      _id: a._id,
      documentId: a.documentId?._id || a.documentId,
      documentTitle: docTitle,
      score: a.score,
      correctCount: a.correctCount,
      totalQuestions: a.totalQuestions,
      isTargeted: Boolean(a.isTargeted),
      topicsPracticed: a.topicsPracticed || [],
      createdAt: a.createdAt,
    };
  });

  // Chronological score trend for visualizer (oldest to newest, up to 12 points)
  const scoreTrend = [...attempts]
    .reverse()
    .slice(-12)
    .map((a) => {
      const docTitle = a.documentId?.title || a.documentId?.originalName || 'Document';
      return {
        attemptId: a._id,
        score: a.score,
        date: a.createdAt,
        documentTitle: docTitle,
        correctCount: a.correctCount,
        totalQuestions: a.totalQuestions,
      };
    });

  const weakSpots = calculateWeakSpots(attempts);

  res.json({
    totalAttempts,
    averageScore,
    bestScore,
    recentAttempts,
    scoreTrend,
    weakSpots,
  });
}
