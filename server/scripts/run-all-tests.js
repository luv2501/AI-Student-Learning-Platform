/**
 * Unified Test Runner for FileSense Server Test Suites (Task 5.5).
 * Sequentially executes all 8 test suites, aggregates pass/fail counts,
 * prints an editorial summary table, and exits with code 0 or 1.
 *
 * Run via: node server/scripts/run-all-tests.js or npm test
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverDir = path.resolve(__dirname, '..');
const repoRoot = path.resolve(serverDir, '..');

const SUITES = [
  { file: 'test-api.js', label: 'Auth, Health & Profile Security' },
  { file: 'test-tasks.js', label: 'Tasks Engine, Timezones & Filters' },
  { file: 'test-documents.js', label: 'Document Upload & PDF Extraction' },
  { file: 'test-ai.js', label: 'AI Chunking, Retry & Generation' },
  { file: 'test-citations.js', label: 'Page Citations & Ask History' },
  { file: 'test-spaced-repetition.js', label: 'SM-2 Flashcard Engine' },
  { file: 'test-quiz-history.js', label: 'Quiz History & Weak Spots' },
  { file: 'test-streaming.js', label: 'SSE AI Streaming & Abort Signals' },
];

function runSuite(suite) {
  return new Promise((resolve) => {
    const scriptPath = path.join(__dirname, suite.file);
    const start = Date.now();

    const child = spawn(process.execPath, [scriptPath], {
      cwd: repoRoot,
      env: {
        ...process.env,
        NODE_ENV: process.env.NODE_ENV || 'test',
        JWT_SECRET: process.env.JWT_SECRET || 'ci-test-secret-key-at-least-32-chars-long',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (d) => {
      stdout += d.toString();
    });

    child.stderr.on('data', (d) => {
      stderr += d.toString();
    });

    child.on('close', (code) => {
      const durationMs = Date.now() - start;
      const combined = stdout + '\n' + stderr;

      // Count passed and failed assertions from output
      let okCount = 0;
      let failCount = 0;

      const lines = combined.split('\n');
      for (const line of lines) {
        if (/^\s*ok\s+/.test(line)) {
          okCount++;
        } else if (/^\s*FAIL\s+/.test(line)) {
          failCount++;
        }
      }

      // If summary line like "27 passed, 0 failed" exists, extract exact numbers
      const summaryMatch = combined.match(/(\d+)\s+passed,\s+(\d+)\s+failed/i);
      if (summaryMatch) {
        okCount = Number(summaryMatch[1]);
        failCount = Number(summaryMatch[2]);
      }

      const passed = code === 0 && failCount === 0;

      resolve({
        suite,
        passed,
        exitCode: code,
        okCount,
        failCount,
        durationMs,
        stdout,
        stderr,
      });
    });
  });
}

async function main() {
  console.log('\n========================================================================================');
  console.log('FileSense — Unified Server Test Runner');
  console.log('========================================================================================\n');

  const results = [];
  let totalOk = 0;
  let totalFail = 0;
  const overallStart = Date.now();

  for (const suite of SUITES) {
    process.stdout.write(`Running ${suite.file.padEnd(28)} `);
    const result = await runSuite(suite);
    results.push(result);
    totalOk += result.okCount;
    totalFail += result.failCount;

    if (result.passed) {
      console.log(`[PASS] (${result.okCount} passed in ${(result.durationMs / 1000).toFixed(2)}s)`);
    } else {
      console.log(`[FAIL] (exit ${result.exitCode}, ${result.failCount} failed in ${(result.durationMs / 1000).toFixed(2)}s)`);
    }
  }

  const overallDuration = ((Date.now() - overallStart) / 1000).toFixed(2);

  // Print Summary Table
  console.log('\n========================================================================================');
  console.log(
    'Suite                                         Status       Passed   Failed     Duration'
  );
  console.log('----------------------------------------------------------------------------------------');

  for (const r of results) {
    const name = `${r.suite.file} (${r.suite.label})`;
    const truncatedName = name.length > 44 ? name.slice(0, 41) + '...' : name.padEnd(44);
    const status = r.passed ? 'PASSED ' : 'FAILED ';
    const passedStr = String(r.okCount).padStart(8);
    const failedStr = String(r.failCount).padStart(8);
    const timeStr = `${(r.durationMs / 1000).toFixed(2)}s`.padStart(11);

    console.log(`${truncatedName}  ${status}  ${passedStr} ${failedStr}  ${timeStr}`);
  }

  console.log('----------------------------------------------------------------------------------------');
  const summaryText = `TOTAL: ${results.length} suites, ${totalOk} passed, ${totalFail} failed`;
  console.log(`${summaryText.padEnd(73)}${overallDuration}s`);
  console.log('========================================================================================\n');

  // Print failure details if any
  const failedSuites = results.filter((r) => !r.passed);
  if (failedSuites.length > 0) {
    console.error('Failure Details:\n');
    for (const f of failedSuites) {
      console.error(`--- ${f.suite.file} Output ---`);
      console.error(f.stdout);
      if (f.stderr) console.error(f.stderr);
      console.error('\n');
    }
    process.exit(1);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Unexpected error running test suite:', err);
  process.exit(1);
});
