import rateLimit from 'express-rate-limit';

/**
 * Custom error handler for rate limiters to ensure standard API JSON error format:
 * { message: '...' }
 */
function limitHandler(message) {
  return (req, res, _next, options) => {
    res.status(options.statusCode).json({
      message: message || options.message,
    });
  };
}

/**
 * Strict rate limiting on authentication endpoints (/login, /register).
 * Protects against brute-force attacks and credential stuffing.
 * 20 attempts per 15 minutes per IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test' || process.env.DISABLE_RATE_LIMIT === 'true',
  handler: limitHandler(
    'Too many authentication attempts from this IP. Please try again after 15 minutes.'
  ),
});

/**
 * Rate limiting on resource-heavy AI generation endpoints (notes, flashcards, quiz, ask).
 * Protects against downstream LLM provider rate limits and excessive token burn.
 * 25 requests per minute per IP.
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test' || process.env.DISABLE_RATE_LIMIT === 'true',
  handler: limitHandler(
    'AI generation rate limit reached. Please wait a moment before sending more requests.'
  ),
});
