import fs from 'node:fs/promises';
import Document from '../models/Document.js';
import AskHistory from '../models/AskHistory.js';
import CardReview from '../models/CardReview.js';
import QuizAttempt from '../models/QuizAttempt.js';
import StudySession from '../models/StudySession.js';
import apiError from '../utils/apiError.js';
import { extractPdfText } from '../services/pdfService.js';
import {
  generateNotes,
  generateFlashcards,
  generateQuiz,
  answerQuestion,
  streamNotes,
  streamAsk,
} from '../services/aiService.js';

/** Loads a document that belongs to the logged in user, or 404s. */
async function findOwned(req, { withText = false } = {}) {
  const query = Document.findOne({ _id: req.params.id, user: req.user._id });
  if (withText) query.select('+extractedText +pages');

  const doc = await query;
  if (!doc) throw apiError(404, 'Document not found');
  return doc;
}

async function removeFile(filePath) {
  try {
    await fs.unlink(filePath);
  } catch {
    /* already gone — nothing to clean up */
  }
}

/** POST /api/documents  (multipart, field name "file") */
export async function uploadDocument(req, res) {
  if (!req.file) throw apiError(400, 'Please choose a PDF file to upload');

  let buffer;
  try {
    buffer = await fs.readFile(req.file.path);
  } catch (err) {
    await removeFile(req.file.path);
    throw err;
  }

  if (!buffer || buffer.length < 5 || buffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
    await removeFile(req.file.path);
    throw apiError(400, 'Invalid file format. Only valid PDF files are allowed.');
  }

  let extracted;
  try {
    extracted = await extractPdfText(buffer);
  } catch (err) {
    await removeFile(req.file.path);
    throw err;
  }

  if (extracted.text.length < 30) {
    await removeFile(req.file.path);
    throw apiError(
      422,
      'No readable text found in this PDF. Scanned or image-only PDFs need OCR, which is not supported yet.'
    );
  }

  const doc = await Document.create({
    user: req.user._id,
    originalName: req.file.originalname,
    fileName: req.file.filename,
    filePath: req.file.path,
    size: req.file.size,
    pageCount: extracted.pageCount,
    extractedText: extracted.text,
    pages: extracted.pages || [],
    textLength: extracted.text.length,
    isTruncated: Boolean(extracted.isTruncated),
  });

  res.status(201).json({ document: doc.toPublic() });
}

/** GET /api/documents */
export async function listDocuments(req, res) {
  const documents = await Document.find({ user: req.user._id })
    .select('originalName fileName size pageCount textLength isTruncated createdAt updatedAt notes flashcards quiz')
    .sort({ createdAt: -1 })
    .lean();

  // Send lightweight public shape with standardized metadata and presence flags
  res.json({
    documents: documents.map((d) => Document.toPublic(d, { lightweight: true })),
  });
}

/** GET /api/documents/:id */
export async function getDocument(req, res) {
  const doc = await findOwned(req);
  res.json({ document: doc.toPublic() });
}

/** DELETE /api/documents/:id */
export async function deleteDocument(req, res) {
  const doc = await Document.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!doc) throw apiError(404, 'Document not found');

  await removeFile(doc.filePath);
  await Promise.all([
    AskHistory.deleteOne({ documentId: doc._id }),
    CardReview.deleteMany({ documentId: doc._id }),
    QuizAttempt.deleteMany({ documentId: doc._id }),
    StudySession.deleteMany({ documentId: doc._id }),
  ]);
  res.json({ message: 'Document deleted', id: doc._id });
}

/**
 * Shared handler for the three "generate and cache" endpoints.
 * Pass ?refresh=true (or { refresh: true }) to regenerate.
 */
function makeGenerator(field, generate, isEmpty) {
  return async function generateHandler(req, res) {
    const doc = await findOwned(req, { withText: true });
    const refresh = req.query.refresh === 'true' || req.body?.refresh === true;

    if (!refresh && !isEmpty(doc[field])) {
      return res.json({ [field]: doc[field], cached: true });
    }

    doc[field] = await generate(doc.extractedText);
    await doc.save();

    res.json({ [field]: doc[field], cached: false });
  };
}

export const createNotes = makeGenerator('notes', generateNotes, (v) => !v);
export const createFlashcards = makeGenerator('flashcards', generateFlashcards, (v) => !v?.length);
export const createQuiz = makeGenerator('quiz', generateQuiz, (v) => !v?.length);

/** POST /api/documents/:id/ask or /api/ai/ask/:id */
export async function askDocument(req, res) {
  const question = String(req.body?.question || '').trim();

  if (question.length < 3) throw apiError(400, 'Please type a question first');
  if (question.length > 500) throw apiError(400, 'Question is too long (500 characters max)');

  const doc = await findOwned(req, { withText: true });
  const { answer, citations } = await answerQuestion(doc, question);

  // Persist conversation exchange to AskHistory
  const userMsg = {
    role: 'user',
    content: question,
    createdAt: new Date(),
  };

  const assistantMsg = {
    role: 'assistant',
    content: answer,
    citations: citations || [],
    createdAt: new Date(),
  };

  await AskHistory.findOneAndUpdate(
    { userId: req.user._id, documentId: doc._id },
    {
      $push: { messages: { $each: [userMsg, assistantMsg] } },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );

  res.json({ question, answer, citations: citations || [] });
}

/** GET /api/documents/:id/ask/history or /api/ai/ask/:id/history */
export async function getAskHistory(req, res) {
  const doc = await findOwned(req);
  const historyDoc = await AskHistory.findOne({
    userId: req.user._id,
    documentId: doc._id,
  }).lean();

  res.json({
    history: historyDoc?.messages || [],
  });
}

/** DELETE /api/documents/:id/ask/history or /api/ai/ask/:id/history */
export async function clearAskHistory(req, res) {
  const doc = await findOwned(req);
  await AskHistory.deleteOne({
    userId: req.user._id,
    documentId: doc._id,
  });

  res.json({
    message: 'Ask history cleared',
    documentId: doc._id,
  });
}

function sendSSEEvent(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

/**
 * GET or POST /api/documents/:id/notes/stream
 * Server-Sent Events stream for progressive note generation.
 */
export async function streamNotesRoute(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  try {
    const doc = await findOwned(req, { withText: true });
    const refresh = req.query.refresh === 'true' || req.body?.refresh === true;

    if (!refresh && doc.notes) {
      sendSSEEvent(res, 'done', { notes: doc.notes, cached: true });
      return res.end();
    }

    const abortController = new AbortController();
    let disconnected = false;

    req.on('close', () => {
      if (!res.writableEnded) {
        disconnected = true;
        abortController.abort();
      }
    });

    const notes = await streamNotes(
      doc.extractedText,
      (chunk) => {
        if (!disconnected) {
          const text = typeof chunk === 'string' ? chunk : (chunk?.text ?? '');
          sendSSEEvent(res, 'token', { text });
        }
      },
      { signal: abortController.signal }
    );

    if (!disconnected) {
      doc.notes = notes;
      await doc.save();

      sendSSEEvent(res, 'done', { notes: doc.notes, cached: false });
      res.end();
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      return res.end();
    }
    const message = err?.message || 'Failed to stream notes';
    sendSSEEvent(res, 'error', { message });
    res.end();
  }
}

/**
 * POST /api/documents/:id/ask/stream or /api/ai/ask/:id/stream
 * Server-Sent Events stream for progressive question answering with citations.
 */
export async function streamAskRoute(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  try {
    const question = String(req.body?.question || '').trim();

    if (question.length < 3) {
      sendSSEEvent(res, 'error', { message: 'Please type a question first' });
      return res.end();
    }
    if (question.length > 500) {
      sendSSEEvent(res, 'error', { message: 'Question is too long (500 characters max)' });
      return res.end();
    }

    const doc = await findOwned(req, { withText: true });

    const abortController = new AbortController();
    let disconnected = false;

    req.on('close', () => {
      if (!res.writableEnded) {
        disconnected = true;
        abortController.abort();
      }
    });

    const { answer, citations } = await streamAsk(
      doc,
      question,
      [],
      (token) => {
        if (!disconnected) {
          const text = typeof token === 'string' ? token : (token?.text ?? '');
          sendSSEEvent(res, 'token', { text });
        }
      },
      { signal: abortController.signal, pages: doc.pages }
    );

    if (!disconnected) {
      // Persist conversation exchange to AskHistory
      const userMsg = {
        role: 'user',
        content: question,
        createdAt: new Date(),
      };

      const assistantMsg = {
        role: 'assistant',
        content: answer,
        citations: citations || [],
        createdAt: new Date(),
      };

      await AskHistory.findOneAndUpdate(
        { userId: req.user._id, documentId: doc._id },
        {
          $push: { messages: { $each: [userMsg, assistantMsg] } },
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );

      sendSSEEvent(res, 'done', {
        question,
        answer,
        citations: citations || [],
      });
      res.end();
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      return res.end();
    }
    const message = err?.message || 'Failed to stream answer';
    sendSSEEvent(res, 'error', { message });
    res.end();
  }
}

