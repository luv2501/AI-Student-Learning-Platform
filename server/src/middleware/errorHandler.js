export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let message = err.message || 'Something went wrong on the server';

  // Mongoose schema validation (e.g. password too short)
  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  // Duplicate unique field (e.g. email)
  if (err.code === 11000) {
    status = 409;
    message = `That ${Object.keys(err.keyValue || { value: '' })[0]} is already in use`;
  }

  // Malformed ObjectId in the URL
  if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid id in request';
  }

  // File upload problems (multer)
  if (err.name === 'MulterError') {
    status = 400;
    message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'That PDF is too large. The limit is 10 MB.'
        : `Upload failed: ${err.message}`;
  }

  // Only unexpected failures are worth a stack trace; deliberate
  // statuses (like 503 "AI not configured") are normal responses.
  if (!err.status && status >= 500) console.error('[error]', err);

  res.status(status).json({ message });
}
