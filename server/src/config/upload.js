import fs from 'node:fs';
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

/** Accepts a single PDF sent as the "file" form field. */
export const uploadPdf = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_PDF_BYTES, files: 1 },
}).single('file');
