/**
 * Citations and Ask History Verification Suite (Task 5.1).
 * Tests PDF page extraction, Document model pages, AI ask citations contract,
 * AskHistory persistence, retrieval, cascade deletion, and multi-user isolation.
 *
 * Run via: node server/scripts/test-citations.js
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

const PORT = 5098;
const BASE = `http://127.0.0.1:${PORT}/api`;

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

async function call(method, apiPath, { body, token } = {}) {
  const res = await fetch(BASE + apiPath, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

function buildTwoPagePdf(line1, line2) {
  const objects = [
    '<</Type/Catalog/Pages 2 0 R>>',
    '<</Type/Pages/Kids[3 0 R 5 0 R]/Count 2>>',
    '<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 7 0 R>>>>>>',
    null,
    '<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 6 0 R/Resources<</Font<</F1 7 0 R>>>>>>',
    null,
    '<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>',
  ];
  const s1 = `BT /F1 14 Tf 50 700 Td (${line1}) Tj ET`;
  objects[3] = `<</Length ${s1.length}>>stream\n${s1}\nendstream`;
  const s2 = `BT /F1 14 Tf 50 700 Td (${line2}) Tj ET`;
  objects[5] = `<</Length ${s2.length}>>stream\n${s2}\nendstream`;

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

// Start in-memory MongoDB
const mongo = await MongoMemoryServer.create();
process.env.MONGO_URI = mongo.getUri('filesense_citations_test');
process.env.JWT_SECRET = 'test_secret_for_citations_suite';
process.env.AI_API_KEY = process.env.AI_API_KEY || 'mock_test_key';

const { default: app } = await import('../src/app.js');
const { default: connectDB } = await import('../src/config/db.js');
const { default: DocumentModel, getDocPages } = await import('../src/models/Document.js');
const { default: AskHistoryModel } = await import('../src/models/AskHistory.js');
const { extractPdfText } = await import('../src/services/pdfService.js');
const { rankPagesByQuery } = await import('../src/services/aiService.js');

await connectDB();
const server = app.listen(PORT);

console.log('\n--- 1. PDF Page Extraction & Structure ---');
{
  const pdfBuffer = buildTwoPagePdf(
    'Mitochondria are the powerhouses of the eukaryotic cell.',
    'Ribosomes perform translation to synthesize proteins from mRNA.'
  );

  const extracted = await extractPdfText(pdfBuffer);
  check('extracts page count of 2', extracted.pageCount === 2, `got ${extracted.pageCount}`);
  check('returns pages array', Array.isArray(extracted.pages) && extracted.pages.length === 2);
  check('page 1 has correct number and text', extracted.pages[0].pageNumber === 1 && extracted.pages[0].text.includes('Mitochondria'));
  check('page 2 has correct number and text', extracted.pages[1].pageNumber === 2 && extracted.pages[1].text.includes('Ribosomes'));
}

console.log('\n--- 2. Document Model Pages & Backward Compatibility ---');
{
  // Register test user
  const { data: userAuth } = await call('POST', '/auth/register', {
    body: { name: 'Citation Student', email: 'citation@example.com', password: 'password123' },
  });
  const token = userAuth.token;
  const userId = userAuth.user.id;

  // Document with pages
  const docWithPages = await DocumentModel.create({
    user: userId,
    originalName: 'cell_biology.pdf',
    fileName: 'cell_biology.pdf',
    filePath: 'cell_biology.pdf',
    size: 2048,
    pageCount: 2,
    extractedText: 'Full extracted text combining both pages.',
    pages: [
      { pageNumber: 1, text: 'Mitochondria generate ATP.' },
      { pageNumber: 2, text: 'Ribosomes assemble peptides.' },
    ],
    textLength: 50,
  });

  // Verify pages are not leaked in public format
  const publicShape = docWithPages.toPublic();
  check('toPublic does not leak raw pages array', publicShape.pages === undefined);
  check('toPublic preserves pageCount', publicShape.pageCount === 2);

  // Verify .select('+pages') loads the pages
  const loadedWithPages = await DocumentModel.findById(docWithPages._id).select('+pages');
  check('select(+pages) retrieves stored pages', loadedWithPages.pages.length === 2);
  check('getPages() returns stored pages', loadedWithPages.getPages().length === 2);

  // Backward compatibility test: document without pages field
  const legacyDoc = await DocumentModel.create({
    user: userId,
    originalName: 'legacy.pdf',
    fileName: 'legacy.pdf',
    filePath: 'legacy.pdf',
    size: 1024,
    pageCount: 1,
    extractedText: 'Legacy document without pages field.',
    pages: [],
    textLength: 36,
  });

  const legacyPages = getDocPages(legacyDoc);
  check('getDocPages synthesizes fallback page 1 for legacy doc', legacyPages.length === 1);
  check('fallback page has pageNumber 1', legacyPages[0].pageNumber === 1);
  check('fallback page contains extracted text', legacyPages[0].text === 'Legacy document without pages field.');

  // Page ranking helper test
  const testPages = [
    { pageNumber: 1, text: 'Ancient Roman architecture, aqueducts and the Colosseum.' },
    { pageNumber: 2, text: 'Cellular respiration happens inside the mitochondria matrix.' },
    { pageNumber: 3, text: 'The French Revolution began in 1789 with the storming of the Bastille.' },
  ];
  const ranked = rankPagesByQuery(testPages, 'Where does cellular respiration take place?', 12000, 1);
  check('rankPagesByQuery finds relevant page 2', ranked.length === 1 && ranked[0].pageNumber === 2);
}

console.log('\n--- 3. Ask Endpoint, Citations & History Flow ---');
{
  const { data: userAuth } = await call('POST', '/auth/register', {
    body: { name: 'History Student', email: 'history@example.com', password: 'password123' },
  });
  const token = userAuth.token;
  const userId = userAuth.user.id;

  const doc = await DocumentModel.create({
    user: userId,
    originalName: 'metabolism.pdf',
    fileName: 'metabolism.pdf',
    filePath: 'metabolism.pdf',
    size: 4096,
    pageCount: 2,
    extractedText: 'Mitochondria generate ATP. Ribosomes synthesize proteins.',
    pages: [
      { pageNumber: 1, text: 'Mitochondria generate ATP through cellular respiration.' },
      { pageNumber: 2, text: 'Ribosomes translate mRNA into polypeptide protein chains.' },
    ],
    textLength: 110,
  });

  // Verify initial history is empty
  const initialHistory = await call('GET', `/ai/ask/${doc._id}/history`, { token });
  check('initial ask history returns 200 with empty array', initialHistory.status === 200 && Array.isArray(initialHistory.data.history) && initialHistory.data.history.length === 0);

  // Also verify route alias: GET /api/documents/:id/ask/history
  const aliasHistory = await call('GET', `/documents/${doc._id}/ask/history`, { token });
  check('documents route alias returns 200 with empty history', aliasHistory.status === 200 && Array.isArray(aliasHistory.data.history) && aliasHistory.data.history.length === 0);

  // Intercept fetch for controlled citation contract testing
  const originalFetch = global.fetch;
  let interceptedRequest = null;

  global.fetch = async (url, options) => {
    if (typeof url === 'string' && url.includes('/chat/completions')) {
      interceptedRequest = JSON.parse(options.body);
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          choices: [
            {
              finish_reason: 'stop',
              message: {
                content: JSON.stringify({
                  answer: 'Mitochondria produce ATP by conducting cellular respiration in the inner membrane.',
                  citations: [
                    {
                      pageNumber: 1,
                      passage: 'Mitochondria generate ATP through cellular respiration.',
                    },
                  ],
                }),
              },
            },
          ],
        }),
      };
    }
    return originalFetch(url, options);
  };

  // Test POST /api/ai/ask/:id
  const askRes = await call('POST', `/ai/ask/${doc._id}`, {
    token,
    body: { question: 'What organelle produces ATP in the cell?' },
  });

  check('ask endpoint returns 200', askRes.status === 200, `${askRes.status} ${askRes.data.message}`);
  check('response preserves question string', askRes.data.question === 'What organelle produces ATP in the cell?');
  check('response includes answer string', typeof askRes.data.answer === 'string' && askRes.data.answer.includes('ATP'));
  check('response includes citations array', Array.isArray(askRes.data.citations) && askRes.data.citations.length === 1);
  check('citation has pageNumber 1', askRes.data.citations[0].pageNumber === 1);
  check('citation has passage matching document', askRes.data.citations[0].passage.includes('Mitochondria generate ATP'));

  // Verify prompt structure sent to AI
  check('prompt supplied grouped document pages', interceptedRequest?.messages?.some((m) => m.content.includes('--- PAGE 1 ---') && m.content.includes('Mitochondria')));
  check('prompt requested JSON with citations schema', interceptedRequest?.messages?.some((m) => m.content.includes('"citations"')));

  // Verify AskHistory persistence in MongoDB
  const historyInDb = await AskHistoryModel.findOne({ userId, documentId: doc._id });
  check('AskHistory document persisted in MongoDB', Boolean(historyInDb));
  check('compound index { userId: 1, documentId: 1 } on AskHistory', AskHistoryModel.schema.indexes().some(([idx]) => idx.userId === 1 && idx.documentId === 1));
  check('messages array has 2 entries (user + assistant)', historyInDb?.messages?.length === 2);
  check('first message has role user', historyInDb?.messages[0].role === 'user');
  check('second message has role assistant', historyInDb?.messages[1].role === 'assistant');
  check('assistant message contains citations', historyInDb?.messages[1].citations?.length === 1);

  // Test GET /api/ai/ask/:id/history
  const fetchedHistory = await call('GET', `/ai/ask/${doc._id}/history`, { token });
  check('GET /api/ai/ask/:id/history returns 200', fetchedHistory.status === 200);
  check('history contains 2 persisted messages', fetchedHistory.data.history.length === 2);
  check('history item has citations array', fetchedHistory.data.history[1].citations.length === 1);

  // Second question: test appending to existing history
  await call('POST', `/documents/${doc._id}/ask`, {
    token,
    body: { question: 'What is the function of ribosomes?' },
  });
  const updatedHistory = await call('GET', `/ai/ask/${doc._id}/history`, { token });
  check('second question appends to history (now 4 messages)', updatedHistory.data.history.length === 4);

  // Validation tests
  const shortQ = await call('POST', `/ai/ask/${doc._id}`, { token, body: { question: 'hi' } });
  check('rejects question shorter than 3 characters with 400', shortQ.status === 400);

  const longQ = await call('POST', `/ai/ask/${doc._id}`, { token, body: { question: 'a'.repeat(501) } });
  check('rejects question longer than 500 characters with 400', longQ.status === 400);

  // Restore fetch
  global.fetch = originalFetch;
}

console.log('\n--- 4. Multi-User Isolation & History Deletion ---');
{
  // User A
  const { data: userA } = await call('POST', '/auth/register', {
    body: { name: 'User A', email: 'userA@example.com', password: 'password123' },
  });
  // User B
  const { data: userB } = await call('POST', '/auth/register', {
    body: { name: 'User B', email: 'userB@example.com', password: 'password123' },
  });

  const docA = await DocumentModel.create({
    user: userA.user.id,
    originalName: 'private_doc.pdf',
    fileName: 'private_doc.pdf',
    filePath: 'private_doc.pdf',
    size: 1024,
    pageCount: 1,
    extractedText: 'Secret research content.',
    pages: [{ pageNumber: 1, text: 'Secret research content.' }],
    textLength: 24,
  });

  // Seed history for User A
  await AskHistoryModel.create({
    userId: userA.user.id,
    documentId: docA._id,
    messages: [
      { role: 'user', content: 'What is the secret?' },
      { role: 'assistant', content: 'The secret is confidential.', citations: [{ pageNumber: 1, passage: 'Secret research content.' }] },
    ],
  });

  // User B attempts to access User A's history
  const unauthorizedGet = await call('GET', `/ai/ask/${docA._id}/history`, { token: userB.token });
  check('User B cannot view User A ask history (returns 404)', unauthorizedGet.status === 404);

  const unauthorizedDelete = await call('DELETE', `/ai/ask/${docA._id}/history`, { token: userB.token });
  check('User B cannot delete User A ask history (returns 404)', unauthorizedDelete.status === 404);

  // User A clears history via DELETE /api/ai/ask/:id/history
  const clearRes = await call('DELETE', `/ai/ask/${docA._id}/history`, { token: userA.token });
  check('User A clears ask history successfully (200)', clearRes.status === 200);

  const clearedGet = await call('GET', `/ai/ask/${docA._id}/history`, { token: userA.token });
  check('subsequent GET returns empty history array', clearedGet.data.history.length === 0);

  // Cascade delete test: deleting a document deletes its AskHistory
  await AskHistoryModel.create({
    userId: userA.user.id,
    documentId: docA._id,
    messages: [{ role: 'user', content: 'hello' }],
  });
  check('AskHistory exists before document deletion', Boolean(await AskHistoryModel.findOne({ documentId: docA._id })));

  await call('DELETE', `/documents/${docA._id}`, { token: userA.token });
  const historyAfterDocDelete = await AskHistoryModel.findOne({ documentId: docA._id });
  check('deleting document cascades and removes AskHistory record', historyAfterDocDelete === null);
}

server.close();
await mongoose.disconnect();
await mongo.stop();

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
