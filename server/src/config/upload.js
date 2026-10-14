import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import multer from 'multer';
import apiError from '../utils/apiError.js';

// Resolved from the server package root so it works no matter where node was started.
const serverRoot = path.resolve(import.meta.dirname, '..', '..');

export const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(serverRoot, 'uploads');

export const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MB

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}.pdf`);
  },
});

function fileFilter(req, file, cb) {
  const looksLikePdf =
    file.mimetype === 'application/pdf' &&
    path.extname(file.originalname).toLowerCase() === '.pdf';

  if (!looksLikePdf) return cb(apiError(400, 'Only PDF files can be uploaded'));
  cb(null, true);
}

const multerSingle = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_PDF_BYTES, files: 1 },
}).single('file');

/**
 * Validates that the uploaded file begins with PDF magic bytes (%PDF-).
 * Magic bytes in hex: 25 50 44 46 2D.
 */
async function validatePdfMagicBytes(filePath) {
  let fd;
  try {
    fd = await fsp.open(filePath, 'r');
    const header = Buffer.alloc(5);
    const { bytesRead } = await fd.read(header, 0, 5, 0);
    return bytesRead === 5 && header.toString('ascii') === '%PDF-';
  } catch {
    return false;
  } finally {
    if (fd) await fd.close().catch(() => {});
  }
}

/**
 * Enhanced PDF upload middleware:
 * - Checks MIME type and extension
 * - Catches request aborts and errors to remove orphaned disk files
 * - Validates file magic bytes (%PDF-) from disk
 */
export function uploadPdf(req, res, next) {
  const cleanup = async () => {
    if (req.file?.path) {
      await fsp.unlink(req.file.path).catch(() => {});
    }
  };

  req.on('aborted', cleanup);

  multerSingle(req, res, async (err) => {
    if (err) {
      await cleanup();
      return next(err);
    }

    if (!req.file) {
      return next();
    }

    // Verify magic bytes for real PDF header (%PDF-)
    const isValid = await validatePdfMagicBytes(req.file.path);
    if (!isValid) {
      await cleanup();
      return next(apiError(400, 'Invalid file format. Only valid PDF files are allowed.'));
    }

    next();
  });
}
