/**
 * Focused check of the AI provider configuration (Groq / OpenAI-compatible).
 *   npm --prefix server run check:ai
 *
 * Prints shape checks, the model list and one tiny live request result.
 * Never prints keys or any other .env value.
 */
import 'dotenv/config';
import { aiConfig } from '../src/services/aiService.js';

const { apiKey, baseURL, model, bearer } = aiConfig();

const authHeader = bearer
  ? { Authorization: `Bearer ${apiKey}` }
  : { 'x-api-key': apiKey };

console.log('\nAI config shape check');
console.log(`  api key present     : ${apiKey.length > 0}`);
console.log(`  api key length      : ${apiKey.length} chars`);
console.log(`  key has whitespace  : ${/\s/.test(apiKey)}`);
console.log(`  key has quotes      : ${/^["']|["']$/.test(apiKey)}`);
console.log(`  base url is https   : ${baseURL.startsWith('https://')}`);
console.log(`  base url has spaces : ${/\s/.test(baseURL)}`);
console.log(`  base url ends in /vN: ${/\/v\d+$/.test(baseURL)}`);
console.log(`  model configured    : ${model.length > 0}`);
console.log(`  auth header style   : ${bearer ? 'Authorization: Bearer' : 'x-api-key'}`);
console.log(`  chat endpoint       : {AI_BASE_URL}/chat/completions`);

if (!apiKey) {
  console.log('\nresult: AI_API_KEY is not set in server/.env\n');
  process.exit(1);
}

if (!/\/v\d+$/.test(baseURL)) {
  console.log(
    '\nresult: FAILED before sending\n' +
      '  AI_BASE_URL must be the OpenAI-compatible root, which for Groq ends in /v1:\n' +
      '    AI_BASE_URL=https://api.groq.com/openai/v1\n' +
      '  (Unlike the Anthropic API, OpenAI-compatible paths are relative to /v1.)\n'
  );
  process.exit(1);
}

/** Reads an error message out of a provider response body. */
function detailOf(body) {
  try {
    const parsed = JSON.parse(body);
    return parsed?.error?.message || parsed?.message || '';
  } catch {
    return String(body || '').replace(/\s+/g, ' ').slice(0, 140);
  }
}

// ---------- 1. model discovery ----------
console.log('\nchecking which models the provider offers...');

try {
  const res = await fetch(`${baseURL}/models`, {
    headers: authHeader,
    signal: AbortSignal.timeout(30_000),
  });
  const body = await res.text();

  if (res.ok) {
    const ids = (JSON.parse(body).data || []).map((m) => m.id).sort();
    console.log(`  models available    : ${ids.length}`);
    console.log(`  configured model ok : ${ids.includes(model)}`);
    if (!ids.includes(model)) {
      console.log('\n  AI_MODEL is not in the provider list. Available ids:');
      ids.forEach((id) => console.log(`    ${id}`));
      console.log('\nresult: FAILED — set AI_MODEL to one of the ids above\n');
      process.exit(1);
    }
  } else {
    console.log(`  model list skipped  : HTTP ${res.status} ${detailOf(body)}`);
  }
} catch (err) {
  console.log(`  model list skipped  : ${err.name}`);
}

// ---------- 2. one minimal real request ----------
console.log('\nsending one minimal chat completion (max_completion_tokens 256)...');

let res;
try {
  res = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader },
    body: JSON.stringify({
      model,
      // Enough room for reasoning models to reason AND answer.
      max_completion_tokens: 256,
      ...(/gpt-oss/i.test(model) ? { reasoning_effort: 'low' } : {}),
      messages: [{ role: 'user', content: 'Reply with the single word: ok' }],
    }),
    signal: AbortSignal.timeout(60_000),
  });
} catch (err) {
  console.log(`  error               : ${err.name}`);
  console.log(
    `\nresult: FAILED\n  ${
      err.name === 'TimeoutError'
        ? 'The provider did not respond in time.'
        : 'Could not connect — check AI_BASE_URL host spelling and your network.'
    }\n`
  );
  process.exit(1);
}

const body = await res.text();

if (!res.ok) {
  const detail = detailOf(body);
  let diagnosis = `Provider returned HTTP ${res.status}. ${detail}`;

  if (res.status === 401 || res.status === 403) {
    diagnosis = `Key rejected (${res.status}). Check AI_API_KEY, and that AI_AUTH_STYLE=bearer for Groq. ${detail}`;
  } else if (res.status === 404) {
    diagnosis = `Endpoint or model not found (404). AI_BASE_URL must be the OpenAI-compatible root that ends in /v1 (e.g. https://api.groq.com/openai/v1) so the request lands on /chat/completions. ${detail}`;
  } else if (res.status === 429) {
    const retry = res.headers.get('retry-after');
    diagnosis = `Rate limited (429)${retry ? ` — retry in about ${Math.ceil(Number(retry)) || retry}s` : ''}. Config looks fine. ${detail}`;
  } else if (res.status === 400 || res.status === 422) {
    diagnosis = `Request rejected (${res.status}). The model may not accept this request shape. ${detail}`;
  }

  console.log(`  http status         : ${res.status}`);
  console.log(`\nresult: FAILED\n  ${diagnosis}\n`);
  process.exit(1);
}

const data = JSON.parse(body);
const choice = data?.choices?.[0];
const text = String(choice?.message?.content || '').trim();
const servedModel = data?.model;

console.log(`  reply received      : ${text.length > 0}`);
console.log(`  reply looks sane    : ${/ok/i.test(text)}`);
console.log(`  served model matches: ${servedModel === model}`);
console.log(`  finish reason       : ${choice?.finish_reason ?? 'n/a'}`);
console.log(`  reasoning returned  : ${Boolean(choice?.message?.reasoning)}`);
console.log(`  tokens used         : ${data?.usage?.total_tokens ?? 'n/a'}`);

if (!text) {
  console.log(
    '\nresult: FAILED\n' +
      '  Auth and model are fine, but the model returned no message content' +
      (choice?.finish_reason === 'length'
        ? ' because it hit the token limit while reasoning.\n  Raise max_completion_tokens, or lower reasoning_effort for this model.\n'
        : '.\n  Try a different AI_MODEL.\n')
  );
  process.exit(1);
}

console.log('\nresult: AI provider is working — Phase 4 AI features are ready\n');
process.exit(0);
