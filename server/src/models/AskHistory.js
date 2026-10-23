import mongoose from 'mongoose';

const citationSchema = new mongoose.Schema(
  {
    pageNumber: {
      type: Number,
      required: true,
    },
    passage: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  citations: {
    type: [citationSchema],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const askHistorySchema = new mongoose.Schema(
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
    messages: {
      type: [messageSchema],
      default: [],
    },
  },
  { timestamps: true }
);

askHistorySchema.index({ userId: 1, documentId: 1 }, { unique: true });

export default mongoose.model('AskHistory', askHistorySchema);
