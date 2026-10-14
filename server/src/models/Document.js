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

    // Large field: excluded from queries unless asked for with .select('+extractedText')
    extractedText: { type: String, default: '', select: false },
    textLength: { type: Number, default: 0 },

    // Cached AI output so the same PDF is not paid for twice
    notes: { type: mongoose.Schema.Types.Mixed, default: null },
    flashcards: { type: [flashcardSchema], default: [] },
    quiz: { type: [quizQuestionSchema], default: [] },
  },
  { timestamps: true }
);

/** Everything except the bulky extracted text (create() ignores select:false). */
documentSchema.methods.toPublic = function toPublic() {
  const { extractedText, ...rest } = this.toObject();
  return rest;
};

export default mongoose.model('Document', documentSchema);