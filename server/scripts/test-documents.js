/**
 * Focused tests for the PDF/document API (phase 4).
 *   npm --prefix server run test:documents
 * AI calls are not exercised — with no AI_API_KEY the endpoints must
 * report a clear "not configured" error instead of failing obscurely.
 */
import fs from 'node:fs';
import path from 'node:path';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

const PORT = 5097;
const BASE = `http://127.0.0.1:${PORT}/api`;
const TEST_UPLOADS = path.resolve('uploads-test');

let passed = 0;
let failed = 0;

function check(name, ok, extra = '') {
  if (ok) {
    passed++;
    console.log(`  ok    ${name}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name} ${extra}`);
  }
}

/** Builds a small but structurally valid one-page PDF containing `line`. */
function buildPdf(line, padding = '') {
  const objects = [
    '<</Type/Catalog/Pages 2 0 R>>',
    '<</Type/Pages/Kids[3 0 R]/Count 1>>',
    '<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>',
    null, // content stream, built below
    '<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>',
  ];

  const stream = `BT /F1 14 Tf 50 700 Td (${line}) Tj ET`;
  objects[3] = `<</Length ${stream.length}>>stream\n${stream}\nendstream`;

  let pdf = '%PDF-1.4\n';
  if (padding) pdf += `% ${padding}\n`;

  const offsets = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });

  const startxref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<</Size ${objects.length + 1}/Root 1 0 R>>\nstartxref\n${startxref}\n%%EOF\n`;

  return Buffer.from(pdf, 'latin1');
}

/** Builds a multi-line valid PDF containing thousands of lines to test text length bounds. */
function buildPdfMulti(lines) {
  let stream = 'BT /F1 14 Tf 50 700 Td\n';
  for (const l of lines) {
    stream += '(' + l + ') Tj T*\n';
  }
  stream += 'ET';
  const objects = [
    '<</Type/Catalog/Pages 2 0 R>>',
    '<</Type/Pages/Kids[3 0 R]/Count 1>>',
    '<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>',
    null,
    '<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>',
  ];
  objects[3] = '<</Length ' + stream.length + '>>stream\n' + stream + '\nendstream';
  let pdf = '%PDF-1.4\n';
  const offsets = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const startxref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<</Size ${objects.length + 1}/Root 1 0 R>>\nstartxref\n${startxref}\n%%EOF\n`;
  return Buffer.from(pdf, 'latin1');
}

async function call(method, path, { body, token, form } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      ...(form ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form || (body ? JSON.stringify(body) : undefined),
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

function pdfForm(buffer, filename = 'lecture.pdf', type = 'application/pdf') {
  const form = new FormData();
  form.append('file', new Blob([buffer], { type }), filename);
  return form;
}

// ---------- boot ----------
fs.rmSync(TEST_UPLOADS, { recursive: true, force: true });

const mongo = await MongoMemoryServer.create();
process.env.NODE_ENV = 'test';
process.env.MONGO_URI = mongo.getUri('studymind_docs_test');
process.env.JWT_SECRET = 'test_secret_not_used_in_production';
process.env.UPLOAD_DIR = TEST_UPLOADS;
delete process.env.AI_API_KEY; // prove the no-key path is handled

const { default: app } = await import('../src/app.js');
const { default: connectDB } = await import('../src/config/db.js');
const { default: DocumentModel } = await import('../src/models/Document.js');

await connectDB();
const server = app.listen(PORT);

const signup = async (email) =>
  (
    await call('POST', '/auth/register', {
      body: { name: 'Student', email, password: 'secret123' },
    })
  ).data.token;

const tokenA = await signup('docs-a@example.com');
const tokenB = await signup('docs-b@example.com');

const SENTENCE = 'Photosynthesis converts light energy into chemical energy in chloroplasts.';
let docId = '';
let storedFile = '';

console.log('\nauth guard');
{
  check('list requires a token', (await call('GET', '/documents')).status === 401);
  const up = await call('POST', '/documents', { form: pdfForm(buildPdf(SENTENCE)) });
  check('upload requires a token', up.status === 401, up.status);
}

console.log('\nupload + validation');
{
  const { status, data } = await call('POST', '/documents', {
    token: tokenA,
    form: pdfForm(buildPdf(SENTENCE), 'biology-notes.pdf'),
  });
  check('accepts a PDF', status === 201, `${status} ${JSON.stringify(data)}`);
  check('keeps the original name', data.document?.originalName === 'biology-notes.pdf');
  check('records a page count', data.document?.pageCount >= 1, data.document?.pageCount);
  check('records extracted text length', data.document?.textLength > 20, data.document?.textLength);
  check('does not leak extracted text', data.document?.extractedText === undefined);
  check('normal PDF isTruncated is false', data.document?.isTruncated === false);
  docId = data.document?._id;
  storedFile = data.document?.fileName;
}
{
  const { status, data } = await call('POST', '/documents', {
    token: tokenA,
    form: pdfForm(Buffer.from('just plain text'), 'notes.txt', 'text/plain'),
  });
  check('rejects a non-PDF', status === 400, `${status} ${data.message}`);
}
{
  const { status } = await call('POST', '/documents', {
    token: tokenA,
    form: pdfForm(buildPdf(SENTENCE), 'renamed.pdf', 'application/octet-stream'),
  });
  check('rejects a wrong mime type', status === 400, status);
}
{
  const fakePdf = Buffer.from('NOT_A_VALID_PDF_HEADER_DATA');
  const { status, data } = await call('POST', '/documents', {
    token: tokenA,
    form: pdfForm(fakePdf, 'spoofed.pdf', 'application/pdf'),
  });
  check(
    'rejects upload lacking %PDF- magic bytes',
    status === 400 && data.message === 'Invalid file format. Only valid PDF files are allowed.',
    `${status} ${data.message}`
  );
  const filesOnDisk = fs.existsSync(TEST_UPLOADS) ? fs.readdirSync(TEST_UPLOADS) : [];
  const leakedFile = filesOnDisk.find((f) => f.endsWith('.pdf') && f !== storedFile);
  check('spoofed file cleaned up from disk', !leakedFile, leakedFile);
}
{
  const big = buildPdf(SENTENCE, 'x'.repeat(11 * 1024 * 1024));
  const { status, data } = await call('POST', '/documents', {
    token: tokenA,
    form: pdfForm(big, 'huge.pdf'),
  });
  check('rejects files over 10 MB', status === 400 && /too large/i.test(data.message || ''), `${status} ${data.message}`);
}
{
  const { status } = await call('POST', '/documents', { token: tokenA, form: new FormData() });
  check('rejects an empty upload', status === 400, status);
}

console.log('\ntext extraction');
{
  const stored = await DocumentModel.findById(docId).select('+extractedText').lean();
  check('extracted the real sentence', stored?.extractedText?.includes('Photosynthesis'), stored?.extractedText?.slice(0, 40));
  check('saved the file to disk', fs.existsSync(path.join(TEST_UPLOADS, storedFile)));
}

console.log('\nlist + detail');
{
  const { status, data } = await call('GET', '/documents', { token: tokenA });
  check('lists own documents', status === 200 && data.documents?.length === 1, data.documents?.length);
  const first = data.documents?.[0];
  check('reports empty AI flags', first?.hasNotes === false && first?.hasFlashcards === false && first?.hasQuiz === false);
  check('list item has unified metadata', Boolean(first?.title) && typeof first?.fileSize === 'number');

  const detail = await call('GET', `/documents/${docId}`, { token: tokenA });
  check('returns one document', detail.status === 200 && detail.data.document?._id === docId);
  check(
    'detail has unified metadata and flags',
    Boolean(detail.data.document?.title) &&
      typeof detail.data.document?.fileSize === 'number' &&
      detail.data.document?.hasNotes === false
  );

  const bad = await call('GET', '/documents/not-an-id', { token: tokenA });
  check('malformed id returns 400', bad.status === 400, bad.status);
}

console.log('\nownership');
{
  const list = await call('GET', '/documents', { token: tokenB });
  check('other user sees nothing', list.data.documents?.length === 0, list.data.documents?.length);

  for (const [label, res] of [
    ['read', await call('GET', `/documents/${docId}`, { token: tokenB })],
    ['notes', await call('POST', `/documents/${docId}/notes`, { token: tokenB })],
    ['flashcards', await call('POST', `/documents/${docId}/flashcards`, { token: tokenB })],
    ['quiz', await call('POST', `/documents/${docId}/quiz`, { token: tokenB })],
    ['ask', await call('POST', `/documents/${docId}/ask`, { token: tokenB, body: { question: 'What is this?' } })],
    ['delete', await call('DELETE', `/documents/${docId}`, { token: tokenB })],
  ]) {
    check(`cannot ${label} another user document`, res.status === 404, res.status);
  }
}

console.log('\nAI endpoints without a key');
{
  for (const kind of ['notes', 'flashcards', 'quiz']) {
    const { status, data } = await call('POST', `/documents/${docId}/${kind}`, { token: tokenA });
    check(`${kind} reports missing config`, status === 503 && /AI_API_KEY/.test(data.message || ''), `${status} ${data.message}`);
  }

  const ask = await call('POST', `/documents/${docId}/ask`, {
    token: tokenA,
    body: { question: 'What does photosynthesis produce?' },
  });
  check('ask reports missing config', ask.status === 503, `${ask.status} ${ask.data.message}`);

  const short = await call('POST', `/documents/${docId}/ask`, { token: tokenA, body: { question: 'a' } });
  check('ask rejects a too short question', short.status === 400, short.status);
}

console.log('\ndelete');
{
  const { status } = await call('DELETE', `/documents/${docId}`, { token: tokenA });
  check('deletes own document', status === 200, status);
  check('removes the file from disk', !fs.existsSync(path.join(TEST_UPLOADS, storedFile)));
  check('deleting twice returns 404', (await call('DELETE', `/documents/${docId}`, { token: tokenA })).status === 404);
}

console.log('\nlong PDF truncation');
{
  const tokenC = await signup('docs-c@example.com');
  const lines = Array.from(
    { length: 2500 },
    (_, i) => `Line ${i} Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore`
  );
  const truncatedPdf = buildPdfMulti(lines);
  const { status, data } = await call('POST', '/documents', {
    token: tokenC,
    form: pdfForm(truncatedPdf, 'truncated-book.pdf'),
  });
  check('accepts long PDF', status === 201, `${status} ${data.message}`);
  check('flags long PDF as isTruncated: true', data.document?.isTruncated === true, data.document?.isTruncated);
  check('textLength capped at 200,000', data.document?.textLength === 200000, data.document?.textLength);

  if (data.document?._id) {
    await call('DELETE', `/documents/${data.document._id}`, { token: tokenC });
  }
}

// ---------- teardown ----------
server.close();
await mongoose.disconnect();
await mongo.stop();
fs.rmSync(TEST_UPLOADS, { recursive: true, force: true });

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
