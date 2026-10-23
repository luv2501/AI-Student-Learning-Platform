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

export const CHUNK_TARGET_SIZE = 8_000;
export const MAX_CHUNKS = 10;

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were',
  'will', 'with', 'what', 'where', 'when', 'who', 'how', 'why', 'which', 'did',
  'do', 'does', 'can', 'could', 'should', 'would', 'this', 'there', 'their'
]);

/**
 * Splits document text into chunks along paragraph boundaries (~8,000 characters per chunk).
 * Honors a maximum chunk cap (default 10) to respect token budgets and provider limits.
 */
export function chunkText(text, targetSize = CHUNK_TARGET_SIZE, maxChunks = MAX_CHUNKS) {
  const clean = String(text || '').trim();
  if (!clean) return [];
  if (clean.length <= targetSize) return [clean];

  const paragraphs = clean.split(/\n\s*\n/);
  const chunks = [];
  let current = '';

  for (const para of paragraphs) {
    if (chunks.length >= maxChunks) break;
    const trimmed = para.trim();
    if (!trimmed) continue;

    if (current && current.length + trimmed.length + 2 > targetSize) {
      chunks.push(current);
      current = '';
      if (chunks.length >= maxChunks) break;
    }

    if (trimmed.length > targetSize) {
      // Split large paragraph by sentence or newline boundaries
      const parts = trimmed.split(/(?<=[.?!])\s+|\n+/);
      for (const part of parts) {
        const pTrimmed = part.trim();
        if (!pTrimmed) continue;
        if (current && current.length + pTrimmed.length + 1 > targetSize) {
          chunks.push(current);
          current = '';
          if (chunks.length >= maxChunks) break;
        }
        current = current ? `${current} ${pTrimmed}` : pTrimmed;
      }
    } else {
      current = current ? `${current}\n\n${trimmed}` : trimmed;
    }
  }

  if (current && chunks.length < maxChunks) {
    chunks.push(current);
  }

  return chunks.slice(0, maxChunks);
}

/**
 * Computes information density of chunks based on unique vocabulary ratio and size,
 * returning the topK most information-dense chunks.
 */
export function rankDenseChunks(chunks, topK = 3) {
  if (chunks.length <= topK) return chunks;

  const scored = chunks.map((chunk, index) => {
    const words = chunk.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    const unique = new Set(words);
    const score = (unique.size / Math.max(words.length, 1)) * Math.min(chunk.length, 8000);
    return { chunk, score, index };
  });

  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  return scored.slice(0, topK).map((s) => s.chunk);
}

/**
 * Ranks chunks based on keyword overlap with the student's question,
 * returning only the top relevant chunks for the prompt context.
 */
export function rankChunksByQuery(chunks, query, topK = 3) {
  if (chunks.length <= topK) return chunks;

  const keywords = (String(query || '').toLowerCase().match(/\b[a-z0-9_-]{2,}\b/g) || [])
    .filter((w) => !STOP_WORDS.has(w));

  if (!keywords.length) return chunks.slice(0, topK);

  const scored = chunks.map((chunk, index) => {
    const lower = chunk.toLowerCase();
    let score = 0;
    for (const kw of keywords) {
      let count = 0;
      let pos = 0;
      while ((pos = lower.indexOf(kw, pos)) !== -1) {
        count++;
        pos += kw.length;
      }
      score += count;
    }
    return { chunk, score, index };
  });

  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  return scored.slice(0, topK).map((s) => s.chunk);
}

/**
 * Retries an asynchronous function with exponential backoff on HTTP 429 / rate limits.
 */
export async function retryWithBackoff(
  fn,
  { maxRetries = 3, initialDelayMs = 1000, maxDelayMs = 8000 } = {}
) {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      const is429 =
        err?.status === 429 ||
        /rate limit/i.test(err?.message || '') ||
        /429/.test(String(err));
      const isTransientJson = /Failed to generate JSON/i.test(err?.message || '');

      if ((!is429 && !isTransientJson) || attempt >= maxRetries) {
        throw err;
      }

      attempt++;
      const retryAfterMatch = err?.message?.match(/try again in about (\d+)s/i);
      const retryAfterSeconds = retryAfterMatch ? Number(retryAfterMatch[1]) : null;
      const delayMs = retryAfterSeconds
        ? retryAfterSeconds * 1000
        : Math.min(initialDelayMs * Math.pow(2, attempt - 1), maxDelayMs);

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
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
 * Uses retryWithBackoff on 429 errors.
 */
async function askAI({ system, prompt, maxTokens = 3000, json = false }) {
  const { apiKey, baseURL, model, bearer } = aiConfig();

  if (!apiKey) {
    throw apiError(503, 'AI features are not configured on the server. Set AI_API_KEY in server/.env');
  }

  return retryWithBackoff(async () => {
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
          ...(json ? { response_format: { type: 'json_object' } } : {}),
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
      throw apiError(
        502,
        data?.choices?.[0]?.finish_reason === 'length'
          ? 'The AI ran out of tokens before finishing. Please try again.'
          : 'The AI returned an empty response. Please try again.'
      );
    }
    return text;
  });
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
  const chunks = chunkText(text);

  let contentToSynthesize = text;

  if (chunks.length > 1) {
    // Multi-chunk: summarize each chunk sequentially to respect rate limits, then merge
    const chunkSummaries = [];
    for (let i = 0; i < chunks.length; i++) {
      const raw = await askAI({
        json: true,
        system: `You are a study assistant that extracts key revision notes from a document section. ${JSON_ONLY}`,
        prompt: `Extract key facts and takeaways from part ${i + 1} of ${chunks.length}.
Return JSON:
{
  "sectionSummary": "brief 1-2 sentence overview",
  "points": ["important bullet points"]
}

DOCUMENT PART:
${chunks[i]}`,
      });

      const parsed = parseJson(raw, 'chunk summary');
      const sectionSummary = String(parsed.sectionSummary || '').trim();
      const points = Array.isArray(parsed.points)
        ? parsed.points.map((p) => String(p).trim()).filter(Boolean)
        : [];
      chunkSummaries.push({ sectionSummary, points });
    }

    contentToSynthesize = chunkSummaries
      .map(
        (cs, i) =>
          `Section ${i + 1}: ${cs.sectionSummary}\nPoints:\n${cs.points.map((p) => `- ${p}`).join('\n')}`
      )
      .join('\n\n');
  }

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
${contentToSynthesize}`,
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
  const chunks = chunkText(text);
  const context =
    chunks.length <= 1
      ? chunks[0] || text
      : rankDenseChunks(chunks, 3).join('\n\n--- Next Section ---\n\n');

  const raw = await askAI({
    json: true,
    system: `You are a study assistant that writes flashcards for exam revision. ${JSON_ONLY}`,
    prompt: `Write ${count} flashcards from the document below.

Return a JSON array: [{ "question": "...", "answer": "..." }]

Rules: one idea per card, questions short and specific, answers under 40 words, cover the whole document, use only information from it.

DOCUMENT:
${context}`,
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
  const chunks = chunkText(text);
  const context =
    chunks.length <= 1
      ? chunks[0] || text
      : rankDenseChunks(chunks, 3).join('\n\n--- Next Section ---\n\n');

  const raw = await askAI({
    json: true,
    system: `You are a study assistant that writes multiple choice practice questions. ${JSON_ONLY}`,
    prompt: `Write ${count} multiple choice questions from the document below.

Return a JSON array:
[{ "question": "...", "options": ["a", "b", "c", "d"], "correctIndex": 0, "explanation": "why that answer is right" }]

Rules: exactly 4 options per question, only one correct, correctIndex is 0-based, plausible wrong options, explanation under 30 words, use only information from the document.

DOCUMENT:
${context}`,
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

/**
 * Ranks pages based on keyword overlap with the student's question,
 * returning the most relevant pages within character budget.
 */
export function rankPagesByQuery(pages, query, maxChars = 12000, topK = 5) {
  if (!Array.isArray(pages) || pages.length === 0) return [];
  if (pages.length === 1) return pages;

  const totalLength = pages.reduce((sum, p) => sum + (p.text?.length || 0), 0);
  if (totalLength <= maxChars && pages.length <= topK) return pages;

  const keywords = (String(query || '').toLowerCase().match(/\b[a-z0-9_-]{2,}\b/g) || [])
    .filter((w) => !STOP_WORDS.has(w));

  const scored = pages.map((page, index) => {
    const lower = (page.text || '').toLowerCase();
    let score = 0;
    for (const kw of keywords) {
      let count = 0;
      let pos = 0;
      while ((pos = lower.indexOf(kw, pos)) !== -1) {
        count++;
        pos += kw.length;
      }
      score += count;
    }
    return { page, score, index };
  });

  scored.sort((a, b) => b.score - a.score || a.index - b.index);

  const selected = [];
  let accumulated = 0;
  for (const item of scored) {
    if (selected.length >= topK) break;
    if (accumulated > 0 && accumulated + (item.page.text?.length || 0) > maxChars) break;
    selected.push(item.page);
    accumulated += item.page.text?.length || 0;
  }

  selected.sort((a, b) => a.pageNumber - b.pageNumber);
  return selected;
}

/**
 * Answers a student question grounded strictly in the document pages,
 * returning the answer and verifiable citations [{ pageNumber, passage }].
 */
export async function answerQuestion(documentOrText, question, options = {}) {
  let pages = [];

  if (Array.isArray(documentOrText)) {
    pages = documentOrText;
  } else if (documentOrText && typeof documentOrText === 'object') {
    if (Array.isArray(documentOrText.pages) && documentOrText.pages.length > 0) {
      pages = documentOrText.pages;
    } else {
      const text = documentOrText.extractedText || documentOrText.text || '';
      pages = [{ pageNumber: 1, text }];
    }
  } else if (typeof documentOrText === 'string') {
    if (Array.isArray(options?.pages) && options.pages.length > 0) {
      pages = options.pages;
    } else {
      pages = [{ pageNumber: 1, text: documentOrText }];
    }
  }

  const selectedPages = rankPagesByQuery(pages, question, 12000);

  const pagesContext = selectedPages
    .map((p) => `--- PAGE ${p.pageNumber} ---\n${p.text}`)
    .join('\n\n');

  const raw = await askAI({
    json: true,
    maxTokens: 2000,
    system: `You are an academic study assistant that answers questions grounded strictly in the provided document. ${JSON_ONLY}
Return this exact JSON format:
{
  "answer": "Clear, direct answer explaining the concept. Plain text only, no markdown.",
  "citations": [
    {
      "pageNumber": 1,
      "passage": "Exact supporting sentence or excerpt from the page"
    }
  ]
}

Rules:
- If the answer cannot be found in the provided document, state clearly: "This document does not contain information to answer that question." and return an empty citations array: "citations": [].
- Each citation must have an integer pageNumber matching the page where the passage appears, and a concise passage quoting the text.
- Keep the answer under 200 words. Plain text only.`,
    prompt: `DOCUMENT (BY PAGE):
${pagesContext}

STUDENT QUESTION: ${question}`,
  });

  let answer = '';
  let citations = [];

  try {
    const parsed = parseJson(raw, 'answer and citations');
    answer = String(parsed.answer || '').trim();
    if (Array.isArray(parsed.citations)) {
      citations = parsed.citations
        .map((c) => ({
          pageNumber: Number(c.pageNumber || c.page),
          passage: String(c.passage || c.quote || c.text || '').trim(),
        }))
        .filter((c) => Number.isInteger(c.pageNumber) && c.pageNumber > 0 && c.passage.length > 0);
    }
  } catch {
    answer = String(raw || '').trim();
    citations = [];
  }

  if (!answer) {
    throw apiError(502, 'The AI returned an empty answer. Please try again.');
  }

  return { answer, citations };
}
