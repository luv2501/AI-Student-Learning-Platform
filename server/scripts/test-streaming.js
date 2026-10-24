/**
 * Streaming (Server-Sent Events) Verification Suite (Task 5.4).
 * Tests SSE headers, progressive chunk sequence (token -> done),
 * stream cancellation via abort signals, database persistence,
 * caching fallback, and error handling.
 *
 * Run via: node server/scripts/test-streaming.js
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

const PORT = 5100;
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

// Intercept upstream LLM fetch calls to provide deterministic SSE chunks
const originalFetch = globalThis.fetch;
let mockUpstreamAborted = false;

globalThis.fetch = async function (url, options) {
  const urlStr = String(url);
  if (urlStr.includes('/chat/completions')) {
    const bodyStr = String(options?.body || '');
    const isAsk = bodyStr.includes('STUDENT QUESTION');

    const encoder = new TextEncoder();
    let streamChunks = [];

    if (isAsk) {
      streamChunks = [
        'data: {"choices":[{"delta":{"content":"Photosynthesis takes place "}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"mainly inside chloroplasts."}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"\\n---CITATIONS---\\n[{\\"pageNumber\\": 1, \\"passage\\": \\"It takes place mainly in the chloroplasts.\\"}]"}}]}\n\n',
        'data: [DONE]\n\n',
      ];
    } else {
      streamChunks = [
        'data: {"choices":[{"delta":{"content":"## Summary\\nPhotosynthesis is the process that converts sunlight into glucose."}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"\\n\\n## Key Points\\n- Takes place in chloroplasts\\n- Light reactions split water\\n- Calvin cycle produces glucose"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"\\n\\n## Sections\\n### Chloroplasts\\n- Contain thylakoid membranes\\n- Contain stroma matrix"}}]}\n\n',
        'data: [DONE]\n\n',
      ];
    }

    const readable = new ReadableStream({
      async start(controller) {
        if (options?.signal) {
          options.signal.addEventListener('abort', () => {
            mockUpstreamAborted = true;
            try {
              controller.error(new Error('Aborted'));
            } catch {}
          });
        }

        for (const chunk of streamChunks) {
          if (options?.signal?.aborted) {
            mockUpstreamAborted = true;
            break;
          }
          controller.enqueue(encoder.encode(chunk));
          // Small delay to simulate progressive streaming
          await new Promise((r) => setTimeout(r, 20));
        }
        try {
          controller.close();
        } catch {}
      },
    });

    return new Response(readable, {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
    });
  }

  return originalFetch.apply(this, arguments);
};

// Start in-memory MongoDB
const mongo = await MongoMemoryServer.create();
process.env.MONGO_URI = mongo.getUri('filesense_streaming_test');
process.env.JWT_SECRET = 'test_secret_for_streaming_suite';

const { default: app } = await import('../src/app.js');
const { default: connectDB } = await import('../src/config/db.js');
const { default: User } = await import('../src/models/User.js');
const { default: Document } = await import('../src/models/Document.js');
const { default: AskHistory } = await import('../src/models/AskHistory.js');

await connectDB();
const server = app.listen(PORT);

// Seed users and tokens
const userA = await User.create({
  name: 'Student A',
  email: 'student.a@test.edu',
  password: 'Password123!',
  institution: 'Imperial College',
});

const userB = await User.create({
  name: 'Student B',
  email: 'student.b@test.edu',
  password: 'Password123!',
  institution: 'UCL',
});

const tokenA = jwt.sign({ id: userA._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
const tokenB = jwt.sign({ id: userB._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

// Seed document for user A
const sampleDoc = await Document.create({
  user: userA._id,
  originalName: 'photosynthesis_lecture.pdf',
  fileName: 'seed_photo.pdf',
  filePath: '/tmp/seed_photo.pdf',
  size: 1048576,
  pageCount: 2,
  textLength: 1200,
  extractedText: 'Photosynthesis is the process by which green plants convert light energy into glucose. It takes place mainly in the chloroplasts. Thylakoid membranes split water and produce ATP.',
  pages: [
    { pageNumber: 1, text: 'Photosynthesis takes place mainly in the chloroplasts.' },
    { pageNumber: 2, text: 'Light dependent reactions split water molecules to produce oxygen and ATP.' },
  ],
});

/** Reads all events from an SSE endpoint using native fetch ReadableStream */
async function readSseStream(url, { method = 'GET', body, token, signal } = {}) {
  const res = await originalFetch(BASE + url, {
    method,
    headers: {
      Accept: 'text/event-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  const contentType = res.headers.get('content-type') || '';
  const cacheControl = res.headers.get('cache-control') || '';
  const connection = res.headers.get('connection') || '';

  if (!contentType.includes('text/event-stream')) {
    const errorBody = await res.json().catch(() => ({}));
    return {
      status: res.status,
      headers: { contentType, cacheControl, connection },
      events: [],
      error: errorBody,
    };
  }

  const events = [];
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split(/\r?\n\r?\n/);
      buffer = parts.pop() || '';

      for (const part of parts) {
        if (!part.trim()) continue;
        const lines = part.split(/\r?\n/);
        let event = 'message';
        let dataStr = '';

        for (const line of lines) {
          if (line.startsWith('event:')) {
            event = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            const val = line.slice(5).trim();
            dataStr = dataStr ? `${dataStr}\n${val}` : val;
          }
        }

        if (dataStr) {
          let data;
          try {
            data = JSON.parse(dataStr);
          } catch {
            data = dataStr;
          }
          events.push({ event, data });
        }
      }
    }
  } catch (err) {
    if (signal?.aborted || err.name === 'AbortError') {
      return {
        status: res.status,
        headers: { contentType, cacheControl, connection },
        events,
        aborted: true,
      };
    }
    throw err;
  }

  return {
    status: res.status,
    headers: { contentType, cacheControl, connection },
    events,
  };
}

console.log('\n--- 1. SSE Infrastructure & Headers Response Structure ---');
{
  const res = await readSseStream(`/documents/${sampleDoc._id}/notes/stream`, {
    method: 'GET',
    token: tokenA,
  });

  check('SSE returns HTTP 200', res.status === 200, res.status);
  check('Content-Type is text/event-stream', res.headers.contentType.includes('text/event-stream'), res.headers.contentType);
  check('Cache-Control specifies no-cache', res.headers.cacheControl.includes('no-cache'), res.headers.cacheControl);
  check('Connection is keep-alive', res.headers.connection.toLowerCase().includes('keep-alive'), res.headers.connection);
}

console.log('\n--- 2. Notes Stream Chunk Sequence & Structured Done Payload ---');
{
  const res = await readSseStream(`/documents/${sampleDoc._id}/notes/stream?refresh=true`, {
    method: 'GET',
    token: tokenA,
  });

  const tokenEvents = res.events.filter((e) => e.event === 'token');
  const doneEvents = res.events.filter((e) => e.event === 'done');

  check('receives multiple token events progressively', tokenEvents.length >= 2, tokenEvents.length);
  check('token events have valid text property', tokenEvents.every((e) => typeof e.data?.text === 'string' && e.data.text.length > 0));
  check('receives exactly one done event', doneEvents.length === 1, doneEvents.length);

  const doneData = doneEvents[0]?.data;
  check('done event contains structured notes object', typeof doneData?.notes === 'object' && doneData?.notes !== null);
  check('done notes includes summary', typeof doneData?.notes?.summary === 'string' && doneData?.notes?.summary.length > 0);
  check('done notes includes keyPoints array', Array.isArray(doneData?.notes?.keyPoints) && doneData?.notes?.keyPoints.length > 0);
  check('done notes includes sections array', Array.isArray(doneData?.notes?.sections) && doneData?.notes?.sections.length > 0);
  check('done event reports cached: false on initial generation', doneData?.cached === false);

  // Check MongoDB persistence
  const updatedDoc = await Document.findById(sampleDoc._id);
  check('notes persisted to MongoDB Document model', updatedDoc.notes !== null);
  check('persisted notes summary matches done event', updatedDoc.notes.summary === doneData.notes.summary);
}

console.log('\n--- 3. Notes Stream Caching Optimization ---');
{
  // Calling notes stream without refresh=true should immediately return cached notes without tokens
  const res = await readSseStream(`/documents/${sampleDoc._id}/notes/stream`, {
    method: 'GET',
    token: tokenA,
  });

  const tokenEvents = res.events.filter((e) => e.event === 'token');
  const doneEvents = res.events.filter((e) => e.event === 'done');

  check('cached stream emits 0 token events', tokenEvents.length === 0, tokenEvents.length);
  check('cached stream emits done event immediately', doneEvents.length === 1);
  check('cached done event reports cached: true', doneEvents[0]?.data?.cached === true);
  check('cached done event returns existing notes', Boolean(doneEvents[0]?.data?.notes?.summary));
}

console.log('\n--- 4. Ask Stream: Progressive Answer Tokens & Citations ---');
{
  const res = await readSseStream(`/documents/${sampleDoc._id}/ask/stream`, {
    method: 'POST',
    body: { question: 'Where does photosynthesis occur?' },
    token: tokenA,
  });

  check('ask stream returns HTTP 200', res.status === 200);
  check('Content-Type is text/event-stream', res.headers.contentType.includes('text/event-stream'));

  const tokenEvents = res.events.filter((e) => e.event === 'token');
  const doneEvents = res.events.filter((e) => e.event === 'done');

  check('receives answer tokens progressively', tokenEvents.length >= 2, tokenEvents.length);
  check('tokens do not leak citation JSON delimiter', tokenEvents.every((e) => !e.data?.text?.includes('---CITATIONS---')));

  check('receives done event for ask stream', doneEvents.length === 1);
  const doneData = doneEvents[0]?.data;
  check('done event reports question', doneData?.question === 'Where does photosynthesis occur?');
  check('done event reports answer text', doneData?.answer?.includes('chloroplasts'));
  check('done event includes citations array', Array.isArray(doneData?.citations) && doneData.citations.length > 0);
  check('citation contains pageNumber and passage', doneData?.citations[0]?.pageNumber === 1 && typeof doneData?.citations[0]?.passage === 'string');

  // Verify AskHistory persistence
  const history = await AskHistory.findOne({ documentId: sampleDoc._id, userId: userA._id });
  check('persists conversation exchange to AskHistory', history !== null && history.messages.length >= 2);
  const lastAssistant = history.messages[history.messages.length - 1];
  check('persisted assistant message contains answer', lastAssistant.content.includes('chloroplasts'));
  check('persisted assistant message contains citations', lastAssistant.citations?.length > 0);
}

console.log('\n--- 5. Ask Stream Route Alias (/api/ai/ask/:id/stream) ---');
{
  const res = await readSseStream(`/ai/ask/${sampleDoc._id}/stream`, {
    method: 'POST',
    body: { question: 'What is produced in light reactions?' },
    token: tokenA,
  });

  check('alias route returns HTTP 200', res.status === 200);
  const doneEvents = res.events.filter((e) => e.event === 'done');
  check('alias route completes with done event', doneEvents.length === 1);
}

console.log('\n--- 6. Stream Abort & Client Disconnection Handling ---');
{
  mockUpstreamAborted = false;
  const abortController = new AbortController();

  const streamPromise = readSseStream(`/documents/${sampleDoc._id}/notes/stream?refresh=true`, {
    method: 'GET',
    token: tokenA,
    signal: abortController.signal,
  });

  // Wait a small amount then abort client stream
  setTimeout(() => {
    abortController.abort();
  }, 30);

  const res = await streamPromise;
  check('client stream aborted successfully', res.aborted === true);
  // Wait brief tick for upstream close handler to fire
  await new Promise((r) => setTimeout(r, 60));
  check('forwarded abort signal to upstream provider', mockUpstreamAborted === true);
}

console.log('\n--- 7. Error Emission on Missing Document & Validation ---');
{
  // Missing document
  const fakeId = new mongoose.Types.ObjectId();
  const resMissing = await readSseStream(`/documents/${fakeId}/notes/stream`, {
    method: 'GET',
    token: tokenA,
  });

  check('missing document emits error event', resMissing.events.some((e) => e.event === 'error'));
  const errorEvent = resMissing.events.find((e) => e.event === 'error');
  check('error message indicates Document not found', errorEvent?.data?.message?.includes('not found'));

  // Multi-user isolation: User B cannot stream notes for User A's document
  const resUserB = await readSseStream(`/documents/${sampleDoc._id}/notes/stream`, {
    method: 'GET',
    token: tokenB,
  });

  check('unauthorized user access emits error event', resUserB.events.some((e) => e.event === 'error'));
  const userBError = resUserB.events.find((e) => e.event === 'error');
  check('error message indicates Document not found', userBError?.data?.message?.includes('not found'));

  // Ask stream with too short question (< 3 chars)
  const resShort = await readSseStream(`/documents/${sampleDoc._id}/ask/stream`, {
    method: 'POST',
    body: { question: 'hi' },
    token: tokenA,
  });

  check('invalid question emits error event', resShort.events.some((e) => e.event === 'error'));
  const shortError = resShort.events.find((e) => e.event === 'error');
  check('error indicates question is too short', shortError?.data?.message?.includes('question first'));

  // Missing authentication token
  const resNoAuth = await readSseStream(`/documents/${sampleDoc._id}/notes/stream`, {
    method: 'GET',
  });

  check('request without token returns 401', resNoAuth.status === 401);

  // Authentication via query token (for native EventSource compatibility)
  const resQueryAuth = await readSseStream(`/documents/${sampleDoc._id}/notes/stream?token=${tokenA}`, {
    method: 'GET',
  });

  check('accepts authentication via query token', resQueryAuth.status === 200);
}

// Cleanup
server.close();
await mongoose.disconnect();
await mongo.stop();

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) {
  process.exit(1);
}
