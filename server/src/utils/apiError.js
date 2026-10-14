/**
 * Small helper for throwing errors with an HTTP status.
 * Usage: throw apiError(400, 'Email is required');
 */
export default function apiError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}
