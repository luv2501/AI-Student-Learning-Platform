# StudyMind — AI Student Learning Platform

An AI powered study planner and learning assistant: plan subjects and topics around your exam
dates, turn lecture PDFs into summaries, flashcards and quizzes, and track daily progress.

## Tech stack

| Layer    | Tech                                                  |
| -------- | ----------------------------------------------------- |
| Frontend | React + Vite, Tailwind CSS, React Router, Axios        |
| Backend  | Node.js, Express                                      |
| Database | MongoDB Atlas + Mongoose                              |
| Auth     | JWT + bcrypt                                          |
| AI       | Groq / OpenAI-compatible API                          |
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
| POST   | /api/documents/:id/quiz | yes | AI multiple choice quiz      |
| POST   | /api/documents/:id/ask  | yes | Ask a question about the PDF |


## Setup

```bash
npm run install:all          # installs root, server and client dependencies
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Fill in `server/.env` (at minimum `MONGO_URI`).

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
npm --prefix server run check:db        # redacted MongoDB connection check
```
All tests boot an in-memory MongoDB — no Atlas connection needed.

