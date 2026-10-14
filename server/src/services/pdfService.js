import { PDFParse } from 'pdf-parse';
import apiError from '../utils/apiError.js';

/** Upper bound on what we keep in the database for one document. */
export const MAX_TEXT_CHARS = 200_000;

function tidy(text) {
  return String(text || '')
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Pulls plain text out of a text-based PDF buffer.
 * Scanned/image-only PDFs return almost nothing — no OCR in this phase.
 */
export async function extractPdfText(buffer) {
  let parser;

  try {
    parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    const text = tidy(result?.text);

    const isTruncated = text.length >= MAX_TEXT_CHARS;

    return {
      text: text.slice(0, MAX_TEXT_CHARS),
      pageCount: result?.total ?? result?.numpages ?? result?.pages?.length ?? 0,
      isTruncated,
    };
  } catch {
    throw apiError(
      422,
      'Could not read this PDF. It may be encrypted, password protected or corrupted.'
    );
  } finally {
    try {
      await parser?.destroy();
    } catch {
      /* nothing useful to do if cleanup fails */
    }
  }
}
