import apiError from '../utils/apiError.js';

const MODEL_FALLBACK = 'openai/gpt-oss-20b';
const DEFAULT_BASE_URL = 'https://api.groq.com/openai/v1';

/**
 * AI provider settings, read only from this project's own variables.
 * Groq is OpenAI-compatible, so any OpenAI-style chat-completions endpoint
 * works by pointing AI_BASE_URL at it (the URL includes /v1).
 */
export function aiConfig() {
  return {
    apiKey: process.env.AI_API_KEY || '',
    baseURL: (process.env.AI_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, ''),
    model: process.env.AI_MODEL || MODEL_FALLBACK,
    // Groq uses "Authorization: Bearer <key>"; x-api-key is kept for other gateways.
    bearer: String(process.env.AI_AUTH_STYLE || 'bearer').toLowerCase() === 'bearer',
  };
}

/** Long PDFs are trimmed instead of sent whole, to keep requests fast and cheap. */
const MAX_INPUT_CHARS = 60_000;

/** Keeps the start and end of a long document so intros and conclusions survive. */
function limitText(text) {
  const clean = String(text || '').trim();
  if (clean.length <= MAX_INPUT_CHARS) return clean;

  const half = Math.floor(MAX_INPUT_CHARS / 2);
  return `${clean.slice(0, half)}\n\n[... middle of the document omitted ...]\n\n${clean.slice(-half)}`;
}

/** Turns a provider HTTP failure into a clear message for the student. */
function providerError(status, retryAfter, body) {
  let detail = '';
  try {
    const parsed = JSON.parse(body);
    detail = parsed?.error?.message || parsed?.message || '';
  } catch {
    detail = String(body || '').slice(0, 160);
  }
  detail = detail.slice(0, 160);

  if (status === 401 || status === 403) {
    return apiError(503, 'The AI API key was rejected by the provider. Check AI_API_KEY on the server.');
  }
  if (status === 404) {
    return apiError(
      502,
      'The AI provider rejected the model or endpoint. Check AI_MODEL and AI_BASE_URL on the server.'
    );
  }
  if (status === 429 || status === 413) {
    const wait = Number(retryAfter);
    const cause =
      status === 413
        ? "This request was larger than the provider's per-minute token budget"
        : 'AI rate limit reached';
    return apiError(
      429,
      `${cause}${Number.isFinite(wait) && wait > 0 ? `, try again in about ${Math.ceil(wait)}s` : ', please try again in a moment'}.${detail ? ` Provider said: ${detail}` : ''}`
    );
  }
  if (status === 400 || status === 422) {
    return apiError(502, `The AI provider rejected the request${detail ? `: ${detail}` : '.'}`);
  }
  return apiError(502, `The AI service failed (error ${status}). Please try again.`);
}

/**
 * One place where every AI request is made (OpenAI-compatible chat completions).
 * maxTokens is deliberately modest: providers count the requested completion
 * tokens against per-minute limits, and free tiers are small.
 */
async function askAI({ system, prompt, maxTokens = 3000, json = false }) {
  const { apiKey, baseURL, model, bearer } = aiConfig();

  if (!apiKey) {
    throw apiError(503, 'AI features are not configured on the server. Set AI_API_KEY in server/.env');
  }

  let response;
  try {
    response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(bearer ? { Authorization: `Bearer ${apiKey}` } : { 'x-api-key': apiKey }),
      },
      body: JSON.stringify({
        model,
        max_completion_tokens: maxTokens,
        temperature: 0.3,
        // Lets the provider guarantee syntactically valid JSON for the
        // notes / flashcards / quiz prompts.
        ...(json ? { response_format: { type: 'json_object' } } : {}),
        // gpt-oss models spend completion tokens on reasoning before answering;
        // keeping that low leaves the budget for the actual JSON output.
        ...(/gpt-oss/i.test(model) ? { reasoning_effort: 'low' } : {}),
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
      }),
      signal: AbortSignal.timeout(120_000),
    });
  } catch (err) {
    throw apiError(
      502,
      err.name === 'TimeoutError'
        ? 'The AI service took too long to respond. Please try again.'
        : 'Could not reach the AI service. Please try again.'
    );
  }

  if (!response.ok) {
    throw providerError(response.status, response.headers.get('retry-after'), await response.text());
  }

  const data = await response.json().catch(() => null);
  const text = String(data?.choices?.[0]?.message?.content || '').trim();

  if (!text) {
    // Reasoning models can burn the whole token budget before writing an answer.
    throw apiError(
      502,
      data?.choices?.[0]?.finish_reason === 'length'
        ? 'The AI ran out of tokens before finishing. Please try again.'
        : 'The AI returned an empty response. Please try again.'
    );
  }
  return text;
}

/** The model is asked for JSON only, but code fences still get stripped defensively. */
function parseJson(raw, what) {
  const start = raw.search(/[[{]/);
  const end = Math.max(raw.lastIndexOf(']'), raw.lastIndexOf('}'));

  if (start === -1 || end <= start) {
    throw apiError(502, `The AI returned an unexpected format for the ${what}. Please try again.`);
  }

  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    throw apiError(502, `The AI returned invalid ${what} data. Please try again.`);
  }
}

const JSON_ONLY = 'Reply with valid JSON only. No prose, no markdown, no code fences.';

/** JSON mode always returns an object, so a list may arrive under any key. */
function firstArray(data) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    return Object.values(data).find((value) => Array.isArray(value)) || [];
  }
  return [];
}

/** Structured study notes: { summary, keyPoints[], sections[] } */
export async function generateNotes(text) {
  const raw = await askAI({
    json: true,
    system: `You are a study assistant that turns lecture material into concise revision notes for a student. ${JSON_ONLY}`,
    prompt: `Create study notes from the document below.

Return this exact JSON shape:
{
  "summary": "2-3 sentence overview of the document",
  "keyPoints": ["the most important facts a student must remember"],
  "sections": [{ "heading": "topic name", "points": ["short bullet points"] }]
}

Rules: 5-8 key points, 3-6 sections, each section 2-5 bullets. Keep every bullet under 25 words and use only information from the document.

DOCUMENT:
${limitText(text)}`,
  });

  const data = parseJson(raw, 'notes');

  return {
    summary: String(data.summary || '').trim(),
    keyPoints: (Array.isArray(data.keyPoints) ? data.keyPoints : [])
      .map((p) => String(p).trim())
      .filter(Boolean),
    sections: (Array.isArray(data.sections) ? data.sections : [])
      .map((s) => ({
        heading: String(s?.heading || '').trim(),
        points: (Array.isArray(s?.points) ? s.points : []).map((p) => String(p).trim()).filter(Boolean),
      }))
      .filter((s) => s.heading && s.points.length),
  };
}

/** Flashcards: [{ question, answer }] */
export async function generateFlashcards(text, count = 12) {
  const raw = await askAI({
    json: true,
    system: `You are a study assistant that writes flashcards for exam revision. ${JSON_ONLY}`,
    prompt: `Write ${count} flashcards from the document below.

Return a JSON array: [{ "question": "...", "answer": "..." }]

Rules: one idea per card, questions short and specific, answers under 40 words, cover the whole document, use only information from it.

DOCUMENT:
${limitText(text)}`,
  });

  const data = parseJson(raw, 'flashcards');
  const list = firstArray(data);

  const cards = (Array.isArray(list) ? list : [])
    .map((c) => ({
      question: String(c?.question || '').trim(),
      answer: String(c?.answer || '').trim(),
    }))
    .filter((c) => c.question && c.answer);

  if (!cards.length) throw apiError(502, 'The AI did not return any usable flashcards. Please try again.');
  return cards;
}

/** Quiz: [{ question, options[], correctIndex, explanation }] */
export async function generateQuiz(text, count = 8) {
  const raw = await askAI({
    json: true,
    system: `You are a study assistant that writes multiple choice practice questions. ${JSON_ONLY}`,
    prompt: `Write ${count} multiple choice questions from the document below.

Return a JSON array:
[{ "question": "...", "options": ["a", "b", "c", "d"], "correctIndex": 0, "explanation": "why that answer is right" }]

Rules: exactly 4 options per question, only one correct, correctIndex is 0-based, plausible wrong options, explanation under 30 words, use only information from the document.

DOCUMENT:
${limitText(text)}`,
  });

  const data = parseJson(raw, 'quiz');
  const list = firstArray(data);

  const questions = (Array.isArray(list) ? list : [])
    .map((q) => ({
      question: String(q?.question || '').trim(),
      options: (Array.isArray(q?.options) ? q.options : []).map((o) => String(o).trim()).filter(Boolean),
      correctIndex: Number(q?.correctIndex),
      explanation: String(q?.explanation || '').trim(),
    }))
    .filter(
      (q) =>
        q.question &&
        q.options.length >= 2 &&
        Number.isInteger(q.correctIndex) &&
        q.correctIndex >= 0 &&
        q.correctIndex < q.options.length
    );

  if (!questions.length) throw apiError(502, 'The AI did not return any usable questions. Please try again.');
  return questions;
}

/** Answers a student question using only the document text. */
export async function answerQuestion(text, question) {
  const answer = await askAI({
    maxTokens: 2000,
    system:
      'You answer student questions using only the document provided. If the answer is not in the document, say so plainly instead of guessing. Answer in clear plain text, at most 200 words. Do not use markdown.',
    prompt: `DOCUMENT:
${limitText(text)}

STUDENT QUESTION: ${question}`,
  });

  if (!answer) throw apiError(502, 'The AI returned an empty answer. Please try again.');
  return answer;
}
