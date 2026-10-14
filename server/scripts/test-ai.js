/**
 * Focused LIVE test of the four AI endpoints against the configured provider.
 *   npm --prefix server run test:ai
 *
 * Makes 4 real AI requests, so it costs tokens and needs AI_API_KEY set.
 * PDF upload/extraction is covered separately by test:documents — this seeds a
 * document directly so the run stays focused on the AI path.
 */
import 'dotenv/config';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

const PORT = 5096;
const BASE = `http://127.0.0.1:${PORT}/api`;

const SAMPLE_TEXT = `Photosynthesis is the process by which green plants, algae and some bacteria
convert light energy into chemical energy stored as glucose. It takes place mainly in the
chloroplasts, which contain the green pigment chlorophyll. The process has two stages. The
light dependent reactions occur in the thylakoid membranes and split water molecules to release
oxygen, producing ATP and NADPH. The light independent reactions, also called the Calvin cycle,
occur in the stroma and use ATP and NADPH to fix carbon dioxide into glucose. The overall word
equation is carbon dioxide plus water, in the presence of light, produces glucose and oxygen.
Factors that limit the rate of photosynthesis include light intensity, carbon dioxide
concentration and temperature. Photosynthesis is the foundation of almost every food chain on
Earth and is responsible for the oxygen in the atmosphere.`;

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

async function call(method, path, { body, token } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

if (!process.env.AI_API_KEY) {
  console.log('\nAI_API_KEY is not set — run "npm run check:ai" first.\n');
  process.exit(1);
}

const mongo = await MongoMemoryServer.create();
process.env.MONGO_URI = mongo.getUri('studymind_ai_test');
process.env.JWT_SECRET = 'test_secret_not_used_in_production';

const { default: app } = await import('../src/app.js');
const { default: connectDB } = await import('../src/config/db.js');
const { default: DocumentModel } = await import('../src/models/Document.js');
const { aiConfig } = await import('../src/services/aiService.js');

await connectDB();
const server = app.listen(PORT);

const { data: auth } = await call('POST', '/auth/register', {
  body: { name: 'AI Tester', email: 'ai-test@example.com', password: 'secret123' },
});
const token = auth.token;

const doc = await DocumentModel.create({
  user: auth.user.id,
  originalName: 'photosynthesis.pdf',
  fileName: 'seeded.pdf',
  filePath: 'seeded.pdf',
  size: 1024,
  pageCount: 1,
  extractedText: SAMPLE_TEXT,
  textLength: SAMPLE_TEXT.length,
});

console.log(`\nprovider: ${aiConfig().model}`);

/** Reports rate limits distinctly instead of counting them as bugs. */
function rateLimited(status, data) {
  if (status !== 429) return false;
  console.log(`  SKIP  rate limited by provider — ${data.message}`);
  return true;
}

console.log('\nnotes');
{
  const { status, data } = await call('POST', `/documents/${doc._id}/notes`, { token });
  if (!rateLimited(status, data)) {
    check('returns 200', status === 200, `${status} ${data.message}`);
    check('has a summary', typeof data.notes?.summary === 'string' && data.notes.summary.length > 20);
    check('has key points', data.notes?.keyPoints?.length > 0, data.notes?.keyPoints?.length);
    check('has sections', data.notes?.sections?.length > 0, data.notes?.sections?.length);
    check('not served from cache', data.cached === false);

    const again = await call('POST', `/documents/${doc._id}/notes`, { token });
    check('second call is cached', again.data.cached === true, again.data.cached);
  }
}

console.log('\nflashcards');
{
  const { status, data } = await call('POST', `/documents/${doc._id}/flashcards`, { token });
  if (!rateLimited(status, data)) {
    check('returns 200', status === 200, `${status} ${data.message}`);
    check('returns cards', data.flashcards?.length > 0, data.flashcards?.length);
    check('cards have q and a', data.flashcards?.every((c) => c.question && c.answer));
  }
}

console.log('\nquiz');
{
  const { status, data } = await call('POST', `/documents/${doc._id}/quiz`, { token });
  if (!rateLimited(status, data)) {
    check('returns 200', status === 200, `${status} ${data.message}`);
    check('returns questions', data.quiz?.length > 0, data.quiz?.length);
    check(
      'questions are well formed',
      data.quiz?.every(
        (q) =>
          q.question &&
          q.options?.length >= 2 &&
          q.correctIndex >= 0 &&
          q.correctIndex < q.options.length
      )
    );
  }
}

console.log('\nask your pdf');
{
  const { status, data } = await call('POST', `/documents/${doc._id}/ask`, {
    token,
    body: { question: 'Where in the cell does photosynthesis take place?' },
  });
  if (!rateLimited(status, data)) {
    check('returns 200', status === 200, `${status} ${data.message}`);
    check('answer is not empty', data.answer?.length > 20, data.answer?.length);
    check(
      'answer uses the document',
      /chloroplast|thylakoid|stroma/i.test(data.answer || ''),
      (data.answer || '').slice(0, 80)
    );
  }
}

server.close();
await mongoose.disconnect();
await mongo.stop();

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
