/**
 * Streaks & Focus Timer Verification Suite (Task 5.6).
 * Tests StudySession model validations & compound indexes,
 * timezone-aware streak calculations across boundaries,
 * POST /api/timer/session and GET /api/timer/stats endpoints,
 * weekly calendar breakdown, multi-user isolation, and cascade cleanup.
 *
 * Run via: node server/scripts/test-streaks-timer.js
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

const PORT = 5102;
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

async function call(method, apiPath, { body, token, headers = {} } = {}) {
  const res = await fetch(BASE + apiPath, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

// Start in-memory MongoDB
const mongo = await MongoMemoryServer.create();
process.env.MONGO_URI = mongo.getUri('filesense_streaks_timer_test');
process.env.JWT_SECRET = 'test_secret_for_streaks_timer_suite';

const { default: app } = await import('../src/app.js');
const { default: connectDB } = await import('../src/config/db.js');
const { default: DocumentModel } = await import('../src/models/Document.js');
const { default: StudySessionModel } = await import('../src/models/StudySession.js');
const { default: UserModel } = await import('../src/models/User.js');
const {
  getDateString,
  getYesterdayString,
  getDaysAgoString,
  calculateStreak,
  getActiveStreak,
  getWeeklyBreakdownDays,
} = await import('../src/utils/streak.js');

await connectDB();
const server = app.listen(PORT);

try {
  console.log('\n--- Section 1: StudySession Model Validations & Compound Indexes ---');

  // Test 1: StudySession requires userId
  let noUserErr = false;
  try {
    await StudySessionModel.create({
      durationMinutes: 25,
      type: 'pomodoro',
    });
  } catch (err) {
    noUserErr = err.name === 'ValidationError' && Boolean(err.errors.userId);
  }
  check('StudySession schema requires userId', noUserErr);

  // Test 2: StudySession requires durationMinutes >= 1
  let invalidDurationErr = false;
  try {
    await StudySessionModel.create({
      userId: new mongoose.Types.ObjectId(),
      durationMinutes: 0,
      type: 'pomodoro',
    });
  } catch (err) {
    invalidDurationErr = err.name === 'ValidationError' && Boolean(err.errors.durationMinutes);
  }
  check('StudySession schema enforces durationMinutes >= 1', invalidDurationErr);

  // Test 3: StudySession rejects invalid session type enum
  let invalidTypeErr = false;
  try {
    await StudySessionModel.create({
      userId: new mongoose.Types.ObjectId(),
      durationMinutes: 25,
      type: 'invalid_type',
    });
  } catch (err) {
    invalidTypeErr = err.name === 'ValidationError' && Boolean(err.errors.type);
  }
  check('StudySession schema rejects invalid session type enum', invalidTypeErr);

  // Test 4: Compound index { userId: 1, completedAt: -1 } exists
  await StudySessionModel.init();
  const indexes = await StudySessionModel.collection.indexes();
  const hasCompoundIndex = indexes.some(
    (idx) => idx.key?.userId === 1 && idx.key?.completedAt === -1
  );
  check('StudySession has compound index on { userId: 1, completedAt: -1 }', hasCompoundIndex);

  console.log('\n--- Section 2: Timezone & Pure Streak Calculation Utility ---');

  // Test 5: getDateString formats YYYY-MM-DD
  const testDate = new Date('2026-10-24T23:30:00Z');
  const utcDateStr = getDateString(testDate, 'UTC');
  check('getDateString produces valid YYYY-MM-DD for UTC', utcDateStr === '2026-10-24');

  // Test 6: getDateString correctly reflects timezones crossing midnight
  // In Asia/Kolkata (UTC+5:30), 23:30 on Oct 24 is 05:00 on Oct 25
  const kolkataDateStr = getDateString(testDate, 'Asia/Kolkata');
  check('getDateString evaluates calendar day in target timezone (Asia/Kolkata)', kolkataDateStr === '2026-10-25');

  // Test 7: getYesterdayString calendar math across month and year boundaries
  check('getYesterdayString calculates yesterday for regular day', getYesterdayString('2026-10-24') === '2026-10-23');
  check('getYesterdayString handles month transition', getYesterdayString('2026-03-01') === '2026-02-28');
  check('getYesterdayString handles leap year transition', getYesterdayString('2024-03-01') === '2024-02-29');
  check('getYesterdayString handles year transition', getYesterdayString('2026-01-01') === '2025-12-31');

  // Test 8: Streak calculation: brand new user
  const newUser = { streakCount: 0, longestStreak: 0, lastActiveDate: null };
  const s1 = calculateStreak(newUser, 'UTC', '2026-10-20');
  check('New user first activity initializes streakCount to 1', s1.streakCount === 1);
  check('New user first activity sets longestStreak to 1', s1.longestStreak === 1);
  check('New user first activity records lastActiveDate', s1.lastActiveDate === '2026-10-20');

  // Test 9: Same day activity maintains streak
  const userSameDay = { streakCount: 1, longestStreak: 1, lastActiveDate: '2026-10-20' };
  const s2 = calculateStreak(userSameDay, 'UTC', '2026-10-20');
  check('Second activity on same day maintains streakCount at 1', s2.streakCount === 1);
  check('Second activity on same day maintains longestStreak at 1', s2.longestStreak === 1);

  // Test 10: Next calendar day increments streak
  const userNextDay = { streakCount: 1, longestStreak: 1, lastActiveDate: '2026-10-20' };
  const s3 = calculateStreak(userNextDay, 'UTC', '2026-10-21');
  check('Consecutive day activity increments streakCount to 2', s3.streakCount === 2);
  check('Consecutive day activity updates longestStreak to 2', s3.longestStreak === 2);

  // Test 11: Third consecutive day increments streak
  const userDay3 = { streakCount: 2, longestStreak: 2, lastActiveDate: '2026-10-21' };
  const s4 = calculateStreak(userDay3, 'UTC', '2026-10-22');
  check('Third consecutive day increments streakCount to 3', s4.streakCount === 3);
  check('Third consecutive day updates longestStreak to 3', s4.longestStreak === 3);

  // Test 12: Skipped day resets streak to 1 while preserving longestStreak
  const userSkipped = { streakCount: 3, longestStreak: 3, lastActiveDate: '2026-10-22' };
  const s5 = calculateStreak(userSkipped, 'UTC', '2026-10-24'); // Skipped Oct 23
  check('Skipped day resets streakCount to 1', s5.streakCount === 1);
  check('Skipped day preserves longestStreak at 3', s5.longestStreak === 3);
  check('Skipped day updates lastActiveDate to today', s5.lastActiveDate === '2026-10-24');

  // Test 13: getActiveStreak returns alive streak for today or yesterday, 0 for lapsed
  check('getActiveStreak returns active streak if active today', getActiveStreak({ streakCount: 5, lastActiveDate: '2026-10-24' }, 'UTC', '2026-10-24') === 5);
  check('getActiveStreak returns active streak if active yesterday', getActiveStreak({ streakCount: 5, lastActiveDate: '2026-10-23' }, 'UTC', '2026-10-24') === 5);
  check('getActiveStreak returns 0 if last active 2 days ago', getActiveStreak({ streakCount: 5, lastActiveDate: '2026-10-22' }, 'UTC', '2026-10-24') === 0);
  check('getActiveStreak returns 0 for user with no activity', getActiveStreak({ streakCount: 0, lastActiveDate: null }, 'UTC', '2026-10-24') === 0);

  // Test 14: getWeeklyBreakdownDays builds exactly 7 calendar days
  const weekDays = getWeeklyBreakdownDays('2026-10-24');
  check('getWeeklyBreakdownDays returns exactly 7 items', weekDays.length === 7);
  check('getWeeklyBreakdownDays ends with today', weekDays[6].date === '2026-10-24');
  check('getWeeklyBreakdownDays starts 6 days ago', weekDays[0].date === '2026-10-18');
  check('getWeeklyBreakdownDays items have dayName and 0 minutes', typeof weekDays[0].dayName === 'string' && weekDays[0].minutes === 0);

  console.log('\n--- Section 3: Timer & Streaks API Endpoints ---');

  // Register two distinct users for testing
  const { data: authA } = await call('POST', '/auth/register', {
    body: { name: 'Alice Focus', email: 'alice.timer@example.com', password: 'password123' },
  });
  const tokenA = authA.token;
  const userAId = authA.user.id;

  const { data: authB } = await call('POST', '/auth/register', {
    body: { name: 'Bob Focus', email: 'bob.timer@example.com', password: 'password123' },
  });
  const tokenB = authB.token;

  // Test 15: Auth protection on POST /api/timer/session
  const unauthSession = await call('POST', '/timer/session', { body: { durationMinutes: 25 } });
  check('POST /api/timer/session rejects unauthenticated requests (401)', unauthSession.status === 401);

  // Test 16: Validation on durationMinutes
  const invalidDurationReq = await call('POST', '/timer/session', {
    token: tokenA,
    body: { durationMinutes: 0 },
  });
  check('POST /api/timer/session rejects durationMinutes < 1 (400)', invalidDurationReq.status === 400);

  // Test 17: Validation on session type
  const invalidTypeReq = await call('POST', '/timer/session', {
    token: tokenA,
    body: { durationMinutes: 25, type: 'nap_time' },
  });
  check('POST /api/timer/session rejects invalid type (400)', invalidTypeReq.status === 400);

  // Test 18: Record valid Pomodoro session
  const validSessionRes = await call('POST', '/timer/session', {
    token: tokenA,
    headers: { 'x-user-timezone': 'UTC' },
    body: { durationMinutes: 25, type: 'pomodoro' },
  });
  check('POST /api/timer/session returns 201 on valid submission', validSessionRes.status === 201);
  check('POST /api/timer/session returns created session object', validSessionRes.data?.session?.durationMinutes === 25);
  check('POST /api/timer/session initializes user streak to 1', validSessionRes.data?.streak?.streakCount === 1);
  check('POST /api/timer/session returns longestStreak', validSessionRes.data?.streak?.longestStreak === 1);

  // Verify User record in DB was updated
  const userDocA = await UserModel.findById(userAId);
  check('User document in database reflects updated streakCount', userDocA.streakCount === 1);
  check('User document in database reflects lastActiveDate', Boolean(userDocA.lastActiveDate));

  // Test 19: Record session linked to a document
  const testDoc = await DocumentModel.create({
    user: userAId,
    originalName: 'OperatingSystems.pdf',
    fileName: 'os.pdf',
    filePath: 'uploads/os.pdf',
    size: 4096,
    pageCount: 12,
    extractedText: 'Operating systems memory management and processes.',
    textLength: 50,
  });

  const docSessionRes = await call('POST', '/timer/session', {
    token: tokenA,
    headers: { 'x-user-timezone': 'UTC' },
    body: { durationMinutes: 30, type: 'free_focus', documentId: testDoc._id.toString() },
  });
  check('POST /api/timer/session accepts valid documentId', docSessionRes.status === 201);
  check('StudySession in DB stores documentId reference', docSessionRes.data?.session?.documentId === testDoc._id.toString());

  // Test 20: GET /api/timer/stats returns accurate focus minutes and streak
  const statsRes = await call('GET', '/timer/stats', {
    token: tokenA,
    headers: { 'x-user-timezone': 'UTC' },
  });
  check('GET /api/timer/stats returns 200', statsRes.status === 200);
  check('GET /api/timer/stats returns streak object with current = 1', statsRes.data?.streak?.current === 1);
  // Total focus minutes should be 25 + 30 = 55
  check('GET /api/timer/stats accurately computes todayMinutes', statsRes.data?.todayMinutes === 55);
  check('GET /api/timer/stats accurately computes totalMinutes', statsRes.data?.totalMinutes === 55);
  check('GET /api/timer/stats returns 7-day weeklyBreakdown', Array.isArray(statsRes.data?.weeklyBreakdown) && statsRes.data?.weeklyBreakdown.length === 7);

  // Today's breakdown entry should have 55 minutes
  const todayEntry = statsRes.data.weeklyBreakdown[statsRes.data.weeklyBreakdown.length - 1];
  check('weeklyBreakdown maps today focus minutes accurately', todayEntry.minutes === 55);

  // Test 21: Breaks do not inflate focus minutes
  await call('POST', '/timer/session', {
    token: tokenA,
    headers: { 'x-user-timezone': 'UTC' },
    body: { durationMinutes: 5, type: 'short_break' },
  });
  await call('POST', '/timer/session', {
    token: tokenA,
    headers: { 'x-user-timezone': 'UTC' },
    body: { durationMinutes: 15, type: 'long_break' },
  });

  const statsAfterBreak = await call('GET', '/timer/stats', {
    token: tokenA,
    headers: { 'x-user-timezone': 'UTC' },
  });
  check('Break sessions do not inflate todayMinutes', statsAfterBreak.data?.todayMinutes === 55);
  check('Break sessions do not inflate totalMinutes', statsAfterBreak.data?.totalMinutes === 55);

  console.log('\n--- Section 4: Multi-User Isolation & Cascade Cleanup ---');

  // Test 22: User B data isolation
  const statsResB = await call('GET', '/timer/stats', {
    token: tokenB,
    headers: { 'x-user-timezone': 'UTC' },
  });
  check('User B timer stats are isolated with 0 todayMinutes', statsResB.data?.todayMinutes === 0);
  check('User B timer stats are isolated with 0 totalMinutes', statsResB.data?.totalMinutes === 0);
  check('User B timer stats show 0 active streak', statsResB.data?.streak?.current === 0);

  // Test 23: Cascade deletion of StudySession when Document is deleted
  const sessionsBeforeDelete = await StudySessionModel.find({ documentId: testDoc._id });
  check('StudySession exists before document deletion', sessionsBeforeDelete.length > 0);

  const deleteDocRes = await call('DELETE', `/documents/${testDoc._id}`, { token: tokenA });
  check('DELETE /api/documents/:id returns 200', deleteDocRes.status === 200);

  const sessionsAfterDelete = await StudySessionModel.find({ documentId: testDoc._id });
  check('Cascade cleanup removes StudySessions referencing deleted document', sessionsAfterDelete.length === 0);

  console.log('\n------------------------------------------------------------');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('------------------------------------------------------------\n');

  server.close();
  await mongoose.disconnect();
  await mongo.stop();

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
} catch (err) {
  console.error('Unexpected error in test suite:', err);
  server?.close();
  await mongoose.disconnect().catch(() => {});
  await mongo?.stop().catch(() => {});
  process.exit(1);
}
