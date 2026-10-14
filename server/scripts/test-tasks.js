/**
 * Focused tests for the task API (phase 3).
 * Uses an in-memory MongoDB:  npm --prefix server run test:tasks
 */
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

const mongo = await MongoMemoryServer.create();
process.env.MONGO_URI = mongo.getUri('studymind_tasks_test');
process.env.JWT_SECRET = 'test_secret_not_used_in_production';

const { default: app } = await import('../src/app.js');
const { default: connectDB } = await import('../src/config/db.js');

await connectDB();
const server = app.listen(PORT);

// two separate students, to prove data isolation
const signup = async (email) =>
  (await call('POST', '/auth/register', {
    body: { name: 'Student', email, password: 'secret123' },
  })).data.token;

const tokenA = await signup('a@example.com');
const tokenB = await signup('b@example.com');

const day = 24 * 60 * 60 * 1000;
const yesterday = new Date(Date.now() - day).toISOString();
const today = new Date().toISOString();
const nextWeek = new Date(Date.now() + 7 * day).toISOString();

let taskId = '';

console.log('\nauth guard');
{
  const { status } = await call('GET', '/tasks');
  check('list requires a token', status === 401, status);
  const created = await call('POST', '/tasks', { body: { title: 'x' } });
  check('create requires a token', created.status === 401, created.status);
}

console.log('\ncreate + validation');
{
  const { status, data } = await call('POST', '/tasks', {
    token: tokenA,
    body: {
      title: 'Revise integration by parts',
      description: 'Chapter 7 exercises',
      subject: 'Maths',
      priority: 'high',
      dueDate: nextWeek,
    },
  });
  check('creates a task', status === 201, `${status} ${JSON.stringify(data)}`);
  check('stores fields', data.task?.subject === 'Maths' && data.task?.priority === 'high');
  check('starts incomplete', data.task?.completed === false);
  taskId = data.task?._id;
}
{
  const { status } = await call('POST', '/tasks', { token: tokenA, body: { title: '   ' } });
  check('rejects blank title', status === 400, status);
}
{
  const { status } = await call('POST', '/tasks', {
    token: tokenA,
    body: { title: 'Bad priority', priority: 'urgent' },
  });
  check('rejects invalid priority', status === 400, status);
}
{
  const { status, data } = await call('POST', '/tasks', {
    token: tokenA,
    body: { title: 'No subject given' },
  });
  check('defaults subject and priority', data.task?.subject === 'General' && data.task?.priority === 'medium', status);
}

console.log('\nlist + filters');
{
  await call('POST', '/tasks', {
    token: tokenA,
    body: { title: 'Overdue essay', subject: 'History', dueDate: yesterday },
  });
  await call('POST', '/tasks', {
    token: tokenA,
    body: { title: 'Physics lab today', subject: 'Physics', dueDate: today },
  });

  const { status, data } = await call('GET', '/tasks', { token: tokenA });
  check('lists own tasks', status === 200 && data.tasks?.length === 4, data.tasks?.length);
  check('sorts earliest due first', data.tasks?.[0]?.title === 'Overdue essay', data.tasks?.[0]?.title);
  check('undated tasks sort last', data.tasks?.[3]?.title === 'No subject given', data.tasks?.[3]?.title);

  const bySubject = await call('GET', '/tasks?subject=History', { token: tokenA });
  check('filters by subject', bySubject.data.tasks?.length === 1, bySubject.data.tasks?.length);
}

console.log('\ncomplete + stats');
{
  const { status, data } = await call('PATCH', `/tasks/${taskId}/toggle`, { token: tokenA });
  check('toggles to complete', status === 200 && data.task?.completed === true, status);
  check('records completedAt', !!data.task?.completedAt);

  const again = await call('PATCH', `/tasks/${taskId}/toggle`, { token: tokenA });
  check('toggles back to pending', again.data.task?.completed === false);
  check('clears completedAt', again.data.task?.completedAt === null);

  await call('PATCH', `/tasks/${taskId}/toggle`, { token: tokenA });

  const { data: statsData } = await call('GET', '/tasks/stats', { token: tokenA });
  const s = statsData.stats;
  check('stats total', s?.total === 4, JSON.stringify(s));
  check('stats completed', s?.completed === 1, JSON.stringify(s));
  check('stats pending', s?.pending === 3, JSON.stringify(s));
  check('stats overdue', s?.overdue === 1, JSON.stringify(s));
  check('stats dueToday', s?.dueToday === 1, JSON.stringify(s));
  check('stats completionRate', s?.completionRate === 25, JSON.stringify(s));

  const pending = await call('GET', '/tasks?status=pending', { token: tokenA });
  check('filters pending only', pending.data.tasks?.length === 3, pending.data.tasks?.length);
  const done = await call('GET', '/tasks?status=completed', { token: tokenA });
  check('filters completed only', done.data.tasks?.length === 1, done.data.tasks?.length);
}

console.log('\nupdate');
{
  const { status, data } = await call('PUT', `/tasks/${taskId}`, {
    token: tokenA,
    body: { title: 'Renamed task', subject: '', priority: 'low', dueDate: null },
  });
  check('updates title', status === 200 && data.task?.title === 'Renamed task', status);
  check('blank subject falls back to General', data.task?.subject === 'General');
  check('clears due date', data.task?.dueDate === null);

  const bad = await call('PUT', `/tasks/${taskId}`, { token: tokenA, body: { title: '' } });
  check('rejects empty title on update', bad.status === 400, bad.status);
}

console.log('\ndata isolation');
{
  const { status, data } = await call('GET', '/tasks', { token: tokenB });
  check('other user sees no tasks', status === 200 && data.tasks?.length === 0, data.tasks?.length);

  const read = await call('PUT', `/tasks/${taskId}`, { token: tokenB, body: { title: 'hijack' } });
  check('cannot update another user task', read.status === 404, read.status);

  const del = await call('DELETE', `/tasks/${taskId}`, { token: tokenB });
  check('cannot delete another user task', del.status === 404, del.status);

  const toggle = await call('PATCH', `/tasks/${taskId}/toggle`, { token: tokenB });
  check('cannot toggle another user task', toggle.status === 404, toggle.status);

  const { data: statsB } = await call('GET', '/tasks/stats', { token: tokenB });
  check('stats are per user', statsB.stats?.total === 0, JSON.stringify(statsB.stats));
}

console.log('\ndelete');
{
  const { status } = await call('DELETE', `/tasks/${taskId}`, { token: tokenA });
  check('deletes own task', status === 200, status);

  const missing = await call('DELETE', `/tasks/${taskId}`, { token: tokenA });
  check('deleting twice returns 404', missing.status === 404, missing.status);

  const badId = await call('DELETE', '/tasks/not-an-id', { token: tokenA });
  check('malformed id returns 400', badId.status === 400, badId.status);

  const { data } = await call('GET', '/tasks', { token: tokenA });
  check('task removed from list', data.tasks?.length === 3, data.tasks?.length);
}

server.close();
await mongoose.disconnect();
await mongo.stop();

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
