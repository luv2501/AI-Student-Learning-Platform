import mongoose from 'mongoose';

const quizAnswerSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    selectedOption: { type: String, default: '' },
    correctOption: { type: String, default: '' },
    isCorrect: { type: Boolean, required: true },
    topic: { type: String, default: 'General' },
  },
  { _id: false }
);

const quizAttemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    totalQuestions: {
      type: Number,
      required: true,
      min: 1,
    },
    correctCount: {
      type: Number,
      required: true,
      min: 0,
    },
    answers: {
      type: [quizAnswerSchema],
      default: [],
    },
    isTargeted: {
      type: Boolean,
      default: false,
    },
    topicsPracticed: {
      type: [String],
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// Compound index for querying a user's document quiz history in reverse chronological order
quizAttemptSchema.index({ userId: 1, documentId: 1, createdAt: -1 });

// Index for aggregate query over user's attempts across all documents
quizAttemptSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('QuizAttempt', quizAttemptSchema);
