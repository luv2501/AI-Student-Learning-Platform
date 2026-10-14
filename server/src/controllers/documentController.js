import fs from 'node:fs/promises';
import Document from '../models/Document.js';
import apiError from '../utils/apiError.js';
import { extractPdfText } from '../services/pdfService.js';
import {
  generateNotes,
  generateFlashcards,
  generateQuiz,
  answerQuestion,
} from '../services/aiService.js';

/** Loads a document that belongs to the logged in user, or 404s. */
async function findOwned(req, { withText = false } = {}) {
  const query = Document.findOne({ _id: req.params.id, user: req.user._id });
  if (withText) query.select('+extractedText');

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

  let extracted;
  try {
    const buffer = await fs.readFile(req.file.path);
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
    textLength: extracted.text.length,
  });

  res.status(201).json({ document: doc.toPublic() });
}

/** GET /api/documents */
export async function listDocuments(req, res) {
  const documents = await Document.find({ user: req.user._id })
    .select('originalName size pageCount textLength createdAt notes flashcards quiz')
    .sort({ createdAt: -1 })
    .lean();

  // Send flags instead of the cached AI payloads to keep the list small.
  res.json({
    documents: documents.map((d) => ({
      _id: d._id,
      originalName: d.originalName,
      size: d.size,
      pageCount: d.pageCount,
      textLength: d.textLength,
      createdAt: d.createdAt,
      hasNotes: Boolean(d.notes),
      hasFlashcards: d.flashcards?.length > 0,
      hasQuiz: d.quiz?.length > 0,
    })),
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

/** POST /api/documents/:id/ask */
export async function askDocument(req, res) {
  const question = String(req.body?.question || '').trim();

  if (question.length < 3) throw apiError(400, 'Please type a question first');
  if (question.length > 500) throw apiError(400, 'Question is too long (500 characters max)');

  const doc = await findOwned(req, { withText: true });
  const answer = await answerQuestion(doc.extractedText, question);

  res.json({ question, answer });
}
