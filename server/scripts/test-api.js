/**
 * End to end API tests.
 * Runs against an in-memory MongoDB, so no Atlas connection is needed:
 *   npm --prefix server run test:api
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

const PORT = 5099;
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
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

// ---------- boot ----------
const mongo = await MongoMemoryServer.create();
process.env.NODE_ENV = 'test';
process.env.MONGO_URI = mongo.getUri('studymind_test');
process.env.JWT_SECRET = 'test_secret_not_used_in_production';
process.env.JWT_EXPIRES_IN = '1h';

const { default: app } = await import('../src/app.js');
const { default: connectDB } = await import('../src/config/db.js');

await connectDB();
const server = app.listen(PORT);

// ---------- tests ----------
console.log('\nhealth');
{
  const { status, data } = await call('GET', '/health');
  check('health returns ok', status === 200 && data.status === 'ok', JSON.stringify(data));
  check('health reports connected db', data.database === 'connected', data.database);
}

const student = {
  name: 'Test Student',
  email: 'Test.Student@Example.com',
  password: 'secret123',
  institution: 'Test University',
};
let token = '';

console.log('\nregister');
{
  const { status, data } = await call('POST', '/auth/register', { body: student });
  check('creates account', status === 201, `${status} ${JSON.stringify(data)}`);
  check('returns a token', typeof data.token === 'string' && data.token.length > 20);
  check('lowercases email', data.user?.email === 'test.student@example.com', data.user?.email);
  check('never returns password', data.user?.password === undefined);
  token = data.token;
}
{
  const { status } = await call('POST', '/auth/register', { body: student });
  check('rejects duplicate email', status === 409, status);
}
{
  const { status, data } = await call('POST', '/auth/register', {
    body: { name: 'X', email: 'x@y.com', password: '1234567' },
  });
  check('rejects password shorter than 8 characters', status === 400 && /8 characters/i.test(data.message || ''), `${status} ${data.message}`);
}
{
  const { status } = await call('POST', '/auth/register', { body: { name: 'X' } });
  check('rejects missing fields', status === 400, status);
}

console.log('\nlogin');
{
  const { status } = await call('POST', '/auth/login', {
    body: { email: student.email, password: 'wrongpass' },
  });
  check('rejects wrong password', status === 401, status);
}
{
  const { status } = await call('POST', '/auth/login', {
    body: { email: 'nobody@example.com', password: 'secret123' },
  });
  check('rejects unknown email', status === 401, status);
}
{
  const { status, data } = await call('POST', '/auth/login', {
    body: { email: 'TEST.student@example.com', password: student.password },
  });
  check('logs in (case insensitive email)', status === 200 && !!data.token, status);
  token = data.token;
}

console.log('\nprotected routes');
{
  const { status } = await call('GET', '/auth/me');
  check('blocks request with no token', status === 401, status);
}
{
  const { status } = await call('GET', '/auth/me', { token: 'not.a.real.token' });
  check('blocks invalid token', status === 401, status);
}
{
  const { status, data } = await call('GET', '/auth/me', { token });
  check('returns current user', status === 200 && data.user?.name === student.name, status);
  check('includes institution', data.user?.institution === 'Test University');
}

console.log('\nprofile update');
{
  const { status, data } = await call('PUT', '/auth/me', {
    token,
    body: { name: 'Updated Student', institution: 'New College' },
  });
  check('updates name', status === 200 && data.user?.name === 'Updated Student', status);
  check('updates institution', data.user?.institution === 'New College');
}
{
  const { status } = await call('PUT', '/auth/me', {
    token,
    body: { newPassword: 'brandnew1' },
  });
  check('needs current password to change password', status === 400, status);
}
{
  const { status, data } = await call('PUT', '/auth/me', {
    token,
    body: { currentPassword: student.password, newPassword: 'short' },
  });
  check('profile update rejects new password shorter than 8 characters', status === 400 && /8 characters/i.test(data.message || ''), `${status} ${data.message}`);
}
{
  const { status } = await call('PUT', '/auth/me', {
    token,
    body: { currentPassword: 'nope', newPassword: 'brandnew1' },
  });
  check('rejects wrong current password', status === 401, status);
}
{
  const { status } = await call('PUT', '/auth/me', {
    token,
    body: { currentPassword: student.password, newPassword: 'brandnew1' },
  });
  check('changes password', status === 200, status);
}
{
  const { status } = await call('POST', '/auth/login', {
    body: { email: student.email, password: 'brandnew1' },
  });
  check('logs in with new password', status === 200, status);
}
{
  const { status } = await call('POST', '/auth/login', {
    body: { email: student.email, password: student.password },
  });
  check('old password no longer works', status === 401, status);
}

console.log('\nrate limiting');
{
  let hitRateLimit = false;
  let lastStatus = 0;
  for (let i = 0; i < 15; i++) {
    const res = await call('POST', '/auth/login', {
      body: { email: 'ratelimit.test@example.com', password: 'password123' },
    });
    lastStatus = res.status;
    if (res.status === 429) {
      hitRateLimit = true;
      break;
    }
  }
  check('auth rate limiter triggers 429 after exceeding limit', hitRateLimit, `last status: ${lastStatus}`);
}

console.log('\nmisc');
{
  const { status } = await call('GET', '/does-not-exist');
  check('unknown route returns 404', status === 404, status);
}

// ---------- teardown ----------
server.close();
await mongoose.disconnect();
await mongo.stop();

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
