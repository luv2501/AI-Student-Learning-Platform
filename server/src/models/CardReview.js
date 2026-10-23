import mongoose from 'mongoose';
import { DEFAULT_EASE_FACTOR, MIN_EASE_FACTOR } from '../utils/sm2.js';

const reviewLogSchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 4,
    },
    reviewedAt: {
      type: Date,
      default: Date.now,
    },
    interval: {
      type: Number,
      required: true,
    },
    easeFactor: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const cardReviewSchema = new mongoose.Schema(
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
    cardId: {
      type: String,
      required: true,
      trim: true,
    },
    repetition: {
      type: Number,
      default: 0,
      min: 0,
    },
    interval: {
      type: Number,
      default: 0,
      min: 0,
    },
    easeFactor: {
      type: Number,
      default: DEFAULT_EASE_FACTOR,
      min: MIN_EASE_FACTOR,
    },
    dueDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lastReviewed: {
      type: Date,
      default: null,
    },
    history: {
      type: [reviewLogSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// Compound unique index ensuring one review record per (user, document, card)
cardReviewSchema.index({ userId: 1, documentId: 1, cardId: 1 }, { unique: true });

// Compound index for fast due cards queries sorted by due date
cardReviewSchema.index({ userId: 1, dueDate: 1 });

export default mongoose.model('CardReview', cardReviewSchema);
