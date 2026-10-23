import crypto from 'node:crypto';

/**
 * Computes a deterministic, collision-resistant 16-character identifier
 * for a flashcard based on its normalized question text.
 * This guarantees that regenerating AI cards preserves review progress
 * for identical or persistent concepts.
 */
export function computeCardId(question) {
  const normalized = String(question || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
  return crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 16);
}

export default computeCardId;
