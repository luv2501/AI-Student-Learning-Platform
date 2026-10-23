import mongoose from 'mongoose';

const flashcardSchema = new mongoose.Schema(
  { question: String, answer: String },
  { _id: false }
);

const quizQuestionSchema = new mongoose.Schema(
  {
    question: String,
    options: [String],
    correctIndex: Number,
    explanation: String,
  },
  { _id: false }
);

const pageSchema = new mongoose.Schema(
  {
    pageNumber: { type: Number, required: true },
    text: { type: String, default: '' },
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    originalName: { type: String, required: true, trim: true },
    fileName: { type: String, required: true }, // name on disk
    filePath: { type: String, required: true },
    size: { type: Number, default: 0 },
    pageCount: { type: Number, default: 0 },

    // Large fields: excluded from queries unless asked for with .select('+extractedText +pages')
    extractedText: { type: String, default: '', select: false },
    pages: { type: [pageSchema], default: [], select: false },
    textLength: { type: Number, default: 0 },
    isTruncated: { type: Boolean, default: false },

    // Cached AI output so the same PDF is not paid for twice
    notes: { type: mongoose.Schema.Types.Mixed, default: null },
    flashcards: { type: [flashcardSchema], default: [] },
    quiz: { type: [quizQuestionSchema], default: [] },
  },
  { timestamps: true }
);

/**
 * Transforms a document (or lean document object) into its public representation.
 * In lightweight mode (used for lists), raw AI payloads and heavy text are omitted.
 * In full mode (used for single document detail), cached AI payloads are included.
 */
export function formatPublicDocument(doc, { lightweight = false } = {}) {
  if (!doc) return null;
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };

  const hasNotes = Boolean(obj.notes);
  const hasFlashcards = Boolean(Array.isArray(obj.flashcards) && obj.flashcards.length > 0);
  const hasQuiz = Boolean(Array.isArray(obj.quiz) && obj.quiz.length > 0);
  const isTruncated = Boolean(obj.isTruncated);

  const base = {
    _id: obj._id,
    title: obj.title || obj.originalName || '',
    originalName: obj.originalName || obj.title || '',
    fileName: obj.fileName,
    fileSize: obj.fileSize ?? obj.size ?? 0,
    size: obj.size ?? obj.fileSize ?? 0,
    pageCount: obj.pageCount ?? 0,
    textLength: obj.textLength ?? 0,
    isTruncated,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
    hasNotes,
    hasFlashcards,
    hasQuiz,
  };

  if (lightweight) {
    return base;
  }

  return {
    ...base,
    user: obj.user,
    notes: obj.notes || null,
    flashcards: Array.isArray(obj.flashcards) ? obj.flashcards : [],
    quiz: Array.isArray(obj.quiz) ? obj.quiz : [],
  };
}

/** Returns pages array with backward compatibility fallback to extractedText if pages is empty. */
export function getDocPages(doc) {
  if (!doc) return [];
  if (Array.isArray(doc.pages) && doc.pages.length > 0) {
    return doc.pages;
  }
  const text = doc.extractedText || '';
  if (text.length > 0) {
    return [{ pageNumber: 1, text }];
  }
  return [];
}

/** Everything except the bulky extracted text, with standardized presence flags. */
documentSchema.methods.toPublic = function toPublic(options = {}) {
  return formatPublicDocument(this, options);
};

documentSchema.methods.getPages = function getPages() {
  return getDocPages(this);
};

documentSchema.statics.toPublic = function toPublic(doc, options = {}) {
  return formatPublicDocument(doc, options);
};

documentSchema.statics.getPages = function getPages(doc) {
  return getDocPages(doc);
};

export default mongoose.model('Document', documentSchema);