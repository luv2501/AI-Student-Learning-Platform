import mongoose from 'mongoose';

/**
 * Connects to MongoDB Atlas.
 * The server still starts if the DB is unreachable so the API/health page
 * can report the problem instead of crashing silently.
 */
export default async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.warn('[db] MONGO_URI is not set. Add it to server/.env');
    return false;
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`[db] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return true;
  } catch (err) {
    console.error('[db] MongoDB connection failed:', err.message);
    return false;
  }
}
