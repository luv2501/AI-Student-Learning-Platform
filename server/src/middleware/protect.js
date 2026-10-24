import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import apiError from '../utils/apiError.js';

/**
 * Blocks the request unless a valid "Authorization: Bearer <token>" header
 * is present. On success req.user holds the logged in user document.
 */
export default async function protect(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ')
    ? header.slice(7)
    : (req.query?.token || '');

  if (!token) {
    return next(apiError(401, 'Not authorized, no token provided'));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return next(apiError(401, 'Not authorized, token is invalid or expired'));
  }

  const user = await User.findById(decoded.id);
  if (!user) return next(apiError(401, 'Not authorized, user no longer exists'));

  req.user = user;
  next();
}
