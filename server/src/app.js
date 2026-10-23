import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import flashcardRoutes from './routes/flashcardRoutes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
  })
);
app.use(express.json());

const DB_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    api: 'FileSense API',
    database: DB_STATES[mongoose.connection.readyState] ?? 'unknown',
    time: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/flashcards', flashcardRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
