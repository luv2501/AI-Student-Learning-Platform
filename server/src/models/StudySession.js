import mongoose from 'mongoose';

const studySessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      default: null,
      index: true,
    },
    durationMinutes: {
      type: Number,
      required: [true, 'Duration in minutes is required'],
      min: [1, 'Duration must be at least 1 minute'],
    },
    type: {
      type: String,
      enum: {
        values: ['pomodoro', 'short_break', 'long_break', 'free_focus'],
        message: '{VALUE} is not a valid session type',
      },
      default: 'pomodoro',
    },
    completedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// Compound index for querying user's recent sessions and calculating activity
studySessionSchema.index({ userId: 1, completedAt: -1 });

export default mongoose.model('StudySession', studySessionSchema);
