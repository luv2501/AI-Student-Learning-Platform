# FileSense — Understand Every Document

An AI powered document intelligence workspace: turn lecture PDFs and documents into summaries,
flashcards, quizzes, and answers, understand every document, and track daily progress.

## Tech stack

| Layer    | Tech                                                  |
| -------- | ----------------------------------------------------- |
| Frontend | React + Vite, Tailwind CSS, React Router, Axios        |
| Backend  | Node.js, Express                                      |
| Database | MongoDB Atlas + Mongoose                              |
| Auth     | JWT + bcrypt                                          |
| AI       | OpenAI-compatible API (Groq by default, `openai/gpt-oss-20b` via `AI_API_KEY`) |
| Uploads  | Multer + PDF text extraction                          |

## Project structure

```
client/            React + Vite frontend
  src/components/  Shared UI (Navbar, Layout, route guards, ui/*)
  src/context/     AuthContext (session state)
  src/pages/       Route pages
  src/lib/api.js   Axios instance + JWT header
server/            Express API
  src/app.js       Express app + route mounting
  src/server.js    Entry point
  src/config/db.js MongoDB connection
  src/models/      Mongoose schemas
  src/controllers/ Route handlers
  src/routes/      Express routers
  src/middleware/  protect (JWT), error handling
  scripts/         API tests (in-memory MongoDB)
```

## AI Architecture & Configuration

The AI layer is provider-agnostic and interfaces with standard OpenAI-compatible chat completions (`/v1/chat/completions`). It defaults to **Groq** for fast inference using `openai/gpt-oss-20b` (or any model specified via `AI_MODEL`), authenticated via `AI_API_KEY`.

> **Important**: FileSense does **not** use Anthropic / Claude. All AI capabilities (lecture summaries & study notes, flashcard generation, quiz generation, and PDF Q&A) use OpenAI-compatible chat completion endpoints.

| Environment Variable | Default / Example | Purpose |
| -------------------- | ----------------- | ------- |
| `AI_API_KEY` | *(Required for AI)* | API key for Groq or an OpenAI-compatible provider |
| `AI_BASE_URL` | `https://api.groq.com/openai/v1` | Base URL pointing to the completions endpoint (must end in `/v1`) |
| `AI_MODEL` | `openai/gpt-oss-20b` | Model name supported by the provider |
| `AI_AUTH_STYLE` | `bearer` | HTTP header authorization style (`bearer` or `api-key`) |

## API

| Method | Route              | Auth | Purpose                        |
| ------ | ------------------ | ---- | ------------------------------ |
| GET    | /api/health        | no   | API + database status          |
| POST   | /api/auth/register | no   | Create account, returns JWT    |
| POST   | /api/auth/login    | no   | Log in, returns JWT            |
| GET    | /api/auth/me       | yes  | Current user profile           |
| PUT    | /api/auth/me       | yes  | Update profile / password      |
| GET    | /api/tasks         | yes  | List own tasks (?status, ?subject) |
| GET    | /api/tasks/stats   | yes  | Dashboard statistics           |
| POST   | /api/tasks         | yes  | Create task                    |
| PUT    | /api/tasks/:id     | yes  | Update task                    |
| PATCH  | /api/tasks/:id/toggle | yes | Complete / uncomplete task   |
| DELETE | /api/tasks/:id     | yes  | Delete task                    |
| POST   | /api/documents     | yes  | Upload a PDF (field `file`, 10 MB max) + extract text |
| GET    | /api/documents     | yes  | List own PDFs                  |
| GET    | /api/documents/:id | yes  | One PDF (with cached AI output) |
| DELETE | /api/documents/:id | yes  | Delete PDF + file on disk      |
| POST   | /api/documents/:id/notes | yes | AI study notes (`?refresh=true` to regenerate) |
| POST   | /api/documents/:id/flashcards | yes | AI flashcards           |
| POST   | /api/documents/:id/ask  | yes | Ask question about PDF with page citations (alias: `/api/ai/ask/:id`) |
| GET    | /api/documents/:id/ask/history | yes | Get stored conversation history (alias: `/api/ai/ask/:id/history`) |
| DELETE | /api/documents/:id/ask/history | yes | Clear conversation history (alias: `/api/ai/ask/:id/history`) |

## Setup

```bash
npm run install:all          # installs root, server and client dependencies
cp server/.env.example server/.env
cp client/.env.example client/.env
```

1. **Backend (`server/.env`)**:
   - Provide `MONGO_URI` with your MongoDB connection string.
   - Configure `JWT_SECRET` with a secure random key.
   - Configure `AI_API_KEY` (e.g., from Groq) along with `AI_BASE_URL` to enable AI study notes, flashcards, quizzes, and Q&A. *(Do not configure Anthropic keys).*
2. **Frontend (`client/.env`)**:
   - Leave empty in local development to use the Vite proxy (`/api` forwards to `http://localhost:5000`, configurable via `VITE_PROXY_TARGET`).
   - In production, set `VITE_API_URL` to your hosted server's `/api` endpoint.

## Run

```bash
npm run dev                  # server on :5000 and client on :5173
```

Open http://localhost:5173. The landing page shows API and database status.

## Tests

```bash
npm --prefix server run test:api        # auth + profile
npm --prefix server run test:tasks      # tasks CRUD + ownership
npm --prefix server run test:documents  # PDF upload, extraction, ownership
npm --prefix server run test:ai         # AI service & prompt formatting (mocked)
npm --prefix server run check:db        # redacted MongoDB connection check
```
All tests boot an in-memory MongoDB — no Atlas or external AI connection needed.

