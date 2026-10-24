# FileSense — Phase 4 UI Redesign Task Checklist

> **Phase Goal**: Implement the anti-vibecode design system across FileSense with custom design tokens, zero-FOUC dark mode, responsive sidebar/bottom-bar navigation, Lucide icons, Sonner toasts, and full page redesigns.

---

## Task 4.1: Foundation — Design Tokens, Typography & Dark Mode Engine
- [x] Install required frontend dependencies (`lucide-react`, `sonner`, `clsx`, `tailwind-merge` if needed).
- [x] Configure `client/index.html`:
  - [x] Import Google Fonts: `Public Sans` and `Geist Mono`.
  - [x] Add blocking inline theme script in `<head>` to prevent FOUC (reads `localStorage` and `prefers-color-scheme`).
- [x] Configure `client/src/index.css`:
  - [x] Define `:root` semantic tokens (`--bg-base`, `--bg-surface`, `--text-primary`, `--border-subtle`, `--accent`, etc.).
  - [x] Define `.dark` semantic tokens for slate/graphite dark mode.
  - [x] Map typography families (`font-sans`, `font-mono`).
  - [x] Micro-radii tokens (`--radius-xs` through `--radius-2xl`).
- [x] Create `client/src/context/ThemeContext.jsx`:
  - [x] Provide `theme` (`'light' | 'dark' | 'system'`), `resolvedTheme`, and `setTheme`.
  - [x] Persist selection to `localStorage.setItem('filesense_theme', theme)`.
  - [x] Synchronize `window.matchMedia('(prefers-color-scheme: dark)')` listener.
- [x] Create `ThemeToggle.jsx` component with accessible dropdown or toggle button.
- [x] Refactor all 13 foundational UI components in `client/src/components/ui/*` (`Alert`, `Badge`, `Button`, `Card`, `EmptyState`, `Input`, `ProgressBar`, `SegmentedTabs`, `Select`, `Skeleton`, `Spinner`, `StatCard`, `Textarea`) to consume semantic design tokens with 100% preserved API contracts.

---

## Task 4.2: Component Library Upgrade & Lucide Icons
- [x] Refactor `Button.jsx`:
  - [x] Variants: `primary`, `secondary`, `subtle`, `ghost`, `danger`.
  - [x] Loading spinner integration.
  - [x] Accessible focus rings (`focus-visible:ring-2`).
- [x] Refactor `Card.jsx`:
  - [x] Modern border styling (`border-border-subtle bg-surface`).
  - [x] Structured headers, dividers, and padding presets.
- [x] Refactor `Input.jsx` & Form Controls:
  - [x] Clean label alignment, helper text, and error states.
- [x] Refactor `Badge.jsx` & `EmptyState.jsx`:
  - [x] Replace emoji icons with Lucide SVG icons.
  - [x] Muted, readable status tones (`neutral`, `success`, `warning`, `danger`, `accent`).
- [x] Setup `sonner` in root layout (`<Toaster />` with theme awareness).

---

## Task 4.3: Icons, Sonner Toasts & High-Fidelity Skeletons
- [x] Install `sonner` and mount `<Toaster />` in `client/src/App.jsx` with dynamic theme awareness and semantic styling.
- [x] Contextual Sonner toast notifications wired:
  - [x] Document upload success / failure in `Documents.jsx`.
  - [x] Document delete actions in `Documents.jsx` and `StudyWorkspace.jsx`.
  - [x] Task creation, completion toggle, and delete in `Dashboard.jsx`.
  - [x] AI material generation triggers (Notes, Flashcards, Quiz, Ask response) in `StudyWorkspace.jsx` and `GeneratePrompt.jsx`.
- [x] Replaced 100% of remaining emoji icons and unicode symbols with clean Lucide SVG icons across:
  - [x] `Landing.jsx` (feature list, steps, hero).
  - [x] `Dashboard.jsx` (stat card chips, focus empty state, recent docs, task filters).
  - [x] `StatCard.jsx` chips and UI banners.
  - [x] `NotesPanel.jsx`, `FlashcardsPanel.jsx`, `QuizPanel.jsx`, `AskPanel.jsx`, and `TaskItem.jsx`.
- [x] High-fidelity skeleton loaders:
  - [x] Created `SkeletonTaskItem`, `SkeletonTaskList`, `SkeletonDocItem`, `SkeletonDocList`, and `SkeletonWorkspace` in `Skeleton.jsx`.
  - [x] Wired high-fidelity skeletons into `Dashboard.jsx`, `Documents.jsx`, and `StudyWorkspace.jsx` matching real data dimensions and eliminating layout shifts.

---

## Task 4.4: App Shell (Collapsible Desktop Sidebar & Mobile Bottom Tab Bar)
- [x] Create `client/src/components/navigation/Sidebar.jsx`:
  - [x] Collapsible desktop sidebar (w-64 expanded, w-18 icon mode).
  - [x] Brand `Logo` with mark-only toggle when collapsed.
  - [x] Navigation links with active states:
    - Dashboard (`LayoutDashboard`)
    - Library (`BookOpen`)
    - Tasks (`CheckSquare`)
    - Profile (`User`)
  - [x] Bottom pinned section with user initials avatar, name/email, `ThemeToggle`, and Logout button.
  - [x] Collapse toggle button with persistence in `localStorage.getItem('filesense_sidebar_collapsed')`.
- [x] Create `client/src/components/navigation/MobileNav.jsx`:
  - [x] Top compact header with `Logo`, `ThemeToggle`, and user initials dropdown.
  - [x] Sticky bottom navigation tab bar with touch-friendly targets (minimum 44x44px hit areas).
- [x] Create `client/src/components/navigation/PublicNav.jsx`:
  - [x] Restrained top navbar for unauthenticated routes (`/`, `/login`, `/register`).
- [x] Refactor `client/src/components/Layout.jsx`:
  - [x] Public shell for visitor routes with restrained navbar, content, and minimal footer.
  - [x] Authenticated shell with collapsible Sidebar on desktop (`md:`) and MobileNav on mobile (`< 768px`).
  - [x] Disciplined viewport padding (`max-w-7xl`, `pb-24 md:pb-8`) preventing content overlap.

---

## Task 4.4: Core Workspace Redesign (Dashboard, Tasks & Settings)
- [x] Redesign `client/src/pages/Dashboard.jsx` (Task 4.5.3):
  - [x] High-clarity greeting and real-time status summary with localized date.
  - [x] Genuine stat cards with Geist Mono digits and Lucide indicators (Documents, Pending, Completed, Generated Materials).
  - [x] Segmented task filters (`All`, `Today`, `Urgent`, `Completed`) with `SegmentedTabs.jsx` and badge counts.
  - [x] "Recent Documents" quick-action list with direct jump buttons (Notes, Cards, Quiz).
- [x] Redesign Task Management (`TaskForm.jsx`, `TaskItem.jsx`):
  - [x] Semantic design tokens, micro-radii buttons, and zero em-dashes.
  - [x] Lucide `Pencil` and `Trash2` icon action triggers with accessible labels.
  - [x] Toast alerts via Sonner on task creation, completion, and deletion.
  - [x] Urgent/overdue visual hierarchy with semantic tokens.
- [x] Redesign `client/src/pages/Profile.jsx`:
  - [x] Account details card (Name, Email, Institution) with Sonner toast feedback.
  - [x] Security card (Password update with password visibility toggles and mismatch validation).
  - [x] Appearance settings card (Light / Dark / System mode selection paired with ThemeToggle).
  - [x] Usage & activity metrics (Library Documents, Pages, Completed Tasks, Generated Materials).

---

## Task 4.5: Document Intelligence Redesign
- [x] Redesign `client/src/pages/Documents.jsx` (Task 4.5.4):
  - [x] Minimal drag-and-drop file upload zone with Lucide `UploadCloud` icon, 25MB constraint notice, and progress bar.
  - [x] Responsive document cards grid with Geist Mono page count & file size metrics.
  - [x] Fast search filter, status presence tags (Notes, Flashcards, Quiz), and accessible delete safety confirmation.
- [x] Redesign `client/src/pages/StudyWorkspace.jsx` and `client/src/components/pdf/*` (Task 4.5.5):
  - [x] Editorial workspace header: breadcrumb nav, Geist Mono metadata row, material-presence badges, accessible delete confirmation modal.
  - [x] `NotesPanel`: zero-padded key-point counters, left-accent summary callout, section grid with hover cards.
  - [x] `FlashcardsPanel`: `Card 04 / 18` Geist Mono progress tracker, `Mastered` / `Needs review` aria-pressed grading buttons, Shuffle/Reset/New set actions.
  - [x] `QuizPanel`: editorial score summary with zero-padded fraction, percentage chip, correct/incorrect breakdown with Lucide icons, accessible aria-pressed option rows.
  - [x] `AskPanel`: threaded chat (user right-aligned, AI left-aligned with `BookOpen` avatar), document citation chip in Geist Mono, autofocus-on-reply, improved suggestion chips.
  - [x] `GeneratePrompt`: refined first-run idle state with `rounded-xl` icon container and font-mono PanelShell subtitle.
- [x] Redesign `client/src/pages/NotFound.jsx` (Task 4.5.6):
  - [x] Centered minimal editorial container on `bg-base` with high-contrast inks.
  - [x] Geist Mono numerical error chip (`404 // NOT_FOUND`).
  - [x] Editorial headline "Page not found" with restrained helper subtext free of em-dashes.
  - [x] Primary action "Back to Dashboard" (`/dashboard`) and secondary action "Open Library" (`/documents`).
  - [x] Verified catch-all route integrity in `client/src/App.jsx`.

---

## Task 4.6: Marketing & Auth Polish, Verification & Security Audit
- [x] Redesign & Polish `client/src/pages/Landing.jsx` (Task 4.5.1):
  - [x] Editorial minimalist hero in Public Sans with warm neutral base (`bg-base`).
  - [x] Removed purple/blue gradient containers, abstract glowing blobs, and em-dashes.
  - [x] Realistic high-utility document inspection preview frame.
  - [x] Structured 4-step workflow pipeline with Lucide icons (`UploadCloud`, `FileText`, `CheckSquare`, `MessageSquare`).
  - [x] WCAG AA contrast on all cards across light paper and dark slate modes.
  - [x] Direct calls to action leading to `/register` and `/login`.
- [x] Polish `Login.jsx`, `Register.jsx`, and `AuthLayout.jsx` (Task 4.5.2):
  - [x] Editorial split shell in `AuthLayout.jsx` with product showcase and micro-radii containers.
  - [x] Accessible form controls using refactored `Input`, `Button`, and `Alert` components.
  - [x] Password visibility toggle with Lucide `Eye` and `EyeOff` icons.
  - [x] High-contrast primary submit button with loading spinner state.
- [x] Micro-Interactions & Restrained Motion (`framer-motion`):
  - [x] Verified `framer-motion` installation in `client/package.json`.
  - [x] Subtle restrained transitions on panel and route transitions (duration <= 150ms).
  - [x] Created `MotionTransition.jsx` and `Modal.jsx` respecting `@media (prefers-reduced-motion: reduce)` and `useReducedMotion()`.
  - [x] Disciplined card hover states without aggressive scaling.
- [x] WCAG 2.1 AA Accessibility Audit:
  - [x] Replaced `window.confirm` with accessible `Modal.jsx` dialogs featuring focus trapping, Escape dismissal, and focus restoration.
  - [x] Upgraded `SegmentedTabs.jsx` with full WAI-ARIA tablist pattern: keyboard arrow navigation (`ArrowLeft`/`ArrowRight`/`Home`/`End`) and dynamic `tabIndex`.
  - [x] Audited buttons and interactive controls: added `aria-busy` to loading buttons, `aria-expanded` and `aria-haspopup` to navigation menus.
  - [x] Audited and calibrated color tokens in `index.css`: `--text-muted` and `--warning` guarantee >= 4.5:1 contrast across Light and Dark themes.
- [x] Frontend Security Audit:
  - [x] Verified zero backend secrets (`AI_API_KEY`, `JWT_SECRET`, `MONGO_URI`) exist in client code.
  - [x] Verified safe token storage under `filesense_token`.
- [x] Final Verification:
  - [x] Run `npm run build` in `client/` (0 errors).
  - [x] Run all server test scripts (`test-api.js`, `test-tasks.js`, `test-documents.js`, `test-ai.js`) -> 100% pass rate (132/132 tests passed).

---

## Phase 5: Advanced Intelligence & History

### Task 5.1: Citations and Saved Ask History
- [x] PDF Page Extraction & Document Model:
  - [x] Updated `pdfService.js` to extract text per page (`pages: [{ pageNumber, text }]`) using `pdf-parse`.
  - [x] Updated `Document` model with `pages` schema (`select: false` to avoid leaking raw text).
  - [x] Maintained 100% backward compatibility for existing documents via `getDocPages(doc)` fallback.
- [x] Ask History Model & Persistence:
  - [x] Created `server/src/models/AskHistory.js` with `userId`, `documentId`, `messages` array, and compound index `{ userId: 1, documentId: 1 }`.
  - [x] Re-exported model from `server/models/AskHistory.js`.
  - [x] Updated `aiService.js` `answerQuestion`: groups document text by pages, requests JSON schema with ground-truth citations, extracts `pageNumber` and `passage`.
  - [x] Persisted user questions and assistant responses with citations into `AskHistory` on every ask.
  - [x] Implemented `GET /api/documents/:id/ask/history` and `GET /api/ai/ask/:id/history` to return conversation history.
  - [x] Implemented `DELETE /api/documents/:id/ask/history` and `DELETE /api/ai/ask/:id/history` to clear history.
  - [x] Cascade delete: deleting a document removes its associated `AskHistory`.
- [x] Frontend Citations & Ask History UI (`AskPanel.jsx`):
  - [x] Fetches conversation history on mount via `api.get('/ai/ask/${doc._id}/history')`.
  - [x] Renders clickable citation chips in Geist Mono (`Page 1`, `Page 2`) with `FileText` icon.
  - [x] Clicking a citation displays an accessible expandable callout with the supporting passage and close button.
  - [x] Added "Clear history" button with Lucide `RotateCcw` in header.
  - [x] Wired accessible confirmation dialog using `Modal.jsx` and Sonner toast feedback.
- [x] Verification & Tests:
  - [x] Created `server/scripts/test-citations.js` (40/40 tests passing).
  - [x] Verified `npm --prefix client run build` (0 errors).
  - [x] Verified all server test suites: `test-api.js` (27/27), `test-tasks.js` (42/42), `test-documents.js` (40/40), `test-ai.js` (23/23), `test-citations.js` (40/40).

### Task 5.2: Spaced Repetition (SM-2) for Flashcards
- [x] Data Architecture & Stable Flashcard Identities:
  - [x] Created `server/src/utils/cardId.js` with deterministic SHA-256 hash generator `computeCardId(question)` (persists review progress across AI regenerations).
  - [x] Created `server/src/models/CardReview.js` with fields: `userId`, `documentId`, `cardId`, `repetition`, `interval`, `easeFactor`, `dueDate`, `lastReviewed`, and `history` logs.
  - [x] Re-exported model from `server/models/CardReview.js`.
  - [x] Created compound unique index on `{ userId: 1, documentId: 1, cardId: 1 }` and index on `{ userId: 1, dueDate: 1 }`.
  - [x] Updated `Document.js` `flashcardSchema` and `formatPublicDocument` to populate deterministic `cardId`.
  - [x] Updated `aiService.js` `generateFlashcards` to attach deterministic `cardId`.
  - [x] Added cascade deletion of `CardReview` records on document deletion in `documentController.js`.
- [x] SM-2 Scheduling Engine & Endpoints:
  - [x] Implemented standard SuperMemo SM-2 scheduler (`server/src/utils/sm2.js`):
    - [x] Rating 1: Again (repetition = 0, interval = 1d, easeFactor -= 0.2).
    - [x] Rating 2: Hard (repetition += 1, interval = round(prev * 1.2), easeFactor -= 0.15).
    - [x] Rating 3: Good (repetition += 1, interval = 1d -> 6d -> round(prev * easeFactor)).
    - [x] Rating 4: Easy (repetition += 1, interval = round(prev * easeFactor * 1.3), easeFactor += 0.15).
    - [x] Bound easeFactor floor at 1.3; calculated `dueDate = now + interval days`.
    - [x] Created `previewRatings` and `getCardState` helpers.
  - [x] Implemented Endpoints (`server/src/controllers/flashcardController.js` and `server/src/routes/flashcardRoutes.js`):
    - [x] `POST /api/flashcards/review`: accepts `{ documentId, cardId, rating }`, updates review, returns next review state and previews.
    - [x] `GET /api/flashcards/due`: lists cards due across all documents with document title/id for unified review.
    - [x] `GET /api/flashcards/due-count`: lightweight aggregation returning `{ dueCount }`.
    - [x] `GET /api/documents/:id/flashcards/reviews`: returns user's review map for a document.
- [x] Frontend: FlashcardsPanel & Dashboard Integration:
  - [x] Created `client/src/lib/sm2.js` mirroring SM-2 math and preview calculations for zero latency.
  - [x] Redesigned `client/src/components/pdf/FlashcardsPanel.jsx`:
    - [x] Persistent SM-2 status and document review map loading.
    - [x] 4 rating buttons under flipped cards: Again (1), Hard (2), Good (3), Easy (4).
    - [x] Estimated next review interval preview in Geist Mono above each button (`1d`, `6d`, etc.).
    - [x] Keyboard shortcuts: 1, 2, 3, 4 when card is flipped; Spacebar to flip; Left/Right arrows to navigate.
    - [x] Review status badge (`New`, `Due`, `Learning`, `Review`) in Geist Mono with semantic Badge tones.
    - [x] Due-only filtering toggle with badge count.
  - [x] Updated `client/src/pages/Dashboard.jsx`:
    - [x] Added `dueFlashcardsCount` query to dashboard `load()`.
    - [x] Added "Review due today" action banner with active badge count and "Start review session" button.
    - [x] Added "Review Due" quick action button in Cockpit Header.
    - [x] Created `client/src/components/flashcards/DueReviewModal.jsx` for multi-document review sessions with focus trapping, progress bar, and workspace links.
- [x] Testing & Verification:
  - [x] Created `server/scripts/test-spaced-repetition.js` (46/46 tests passing).
  - [x] Verified `npm --prefix client run build` (0 errors).
  - [x] Verified 100% pass rate across all 6 test suites: `test-api.js` (27/27), `test-tasks.js` (42/42), `test-documents.js` (40/40), `test-ai.js` (23/23), `test-citations.js` (40/40), `test-spaced-repetition.js` (46/46) -> 218/218 passing.

### Task 5.3: Quiz History and Weak Spots Detection
- [x] Quiz Attempt Model & Database Persistence:
  - [x] Created `server/src/models/QuizAttempt.js` and `server/models/QuizAttempt.js` with fields: `userId`, `documentId`, `score`, `totalQuestions`, `correctCount`, `answers` array with `topic`, and `createdAt`.
  - [x] Created compound index `{ userId: 1, documentId: 1, createdAt: -1 }` and index `{ userId: 1, createdAt: -1 }`.
  - [x] Updated `quizQuestionSchema` and public doc formatter in `server/src/models/Document.js` to store and surface `topic`.
  - [x] Added cascade deletion in `server/src/controllers/documentController.js` to delete associated `QuizAttempt` records when a document is deleted.
- [x] Weak Spots & Targeted Quizzing Engine:
  - [x] Updated AI quiz prompt and parser in `server/src/services/aiService.js` to assign a concise `topic` attribute to every question.
  - [x] Created `generateWeakSpotsQuiz(text, topics, count = 5)` in `aiService.js` to generate focused gap practice.
  - [x] Implemented `calculateWeakSpots` in `server/src/controllers/quizController.js` (accuracy < 60% or repeatedly missed >= 2 times).
  - [x] Endpoints implemented and mounted:
    - [x] `POST /api/quizzes/attempts`: Save attempt with score, answers, and topics.
    - [x] `GET /api/documents/:id/quizzes/attempts`: Return past attempts for a document chronologically.
    - [x] `GET /api/quizzes/weak-spots`: Aggregate and return user's weak topics across all documents.
    - [x] `POST /api/quizzes/weak-spots` and `POST /api/ai/quiz/weak-spots`: Generate targeted 5-question gap quiz.
    - [x] `GET /api/quizzes/history/summary`: Lightweight summary for dashboard metrics (recent attempts, average score, score trend).
- [x] Frontend: QuizPanel & Dashboard Analytics:
  - [x] Updated `client/src/components/pdf/QuizPanel.jsx`:
    - [x] Automatically persists completed quiz attempt via `POST /api/quizzes/attempts`.
    - [x] Added accessible "Attempt History" modal dialog showing past scores, correct/total count, and timestamps in Geist Mono.
    - [x] Added weak spots detection banner with topic chips and "Practice weak spots" button.
    - [x] Implemented targeted quiz mode with active banner and return button.
  - [x] Created `client/src/components/quizzes/ScoreTrendChart.jsx`:
    - [x] Minimal, accessible SVG line/area chart adhering to semantic tokens (zero external chart libraries).
    - [x] Displays gridlines (0%, 50%, 100%), hover/focus tooltips, data point dots, and accessible ARIA attributes.
  - [x] Created `client/src/components/quizzes/WeakSpotsPracticeModal.jsx`:
    - [x] Focus-trapped modal dialog for 5-question targeted gap practice right from Dashboard.
  - [x] Updated `client/src/pages/Dashboard.jsx`:
    - [x] Added quiz summary metrics to `load()`.
    - [x] Integrated `ScoreTrendChart` and "Knowledge Gaps" weak spots card in a responsive 3-column layout.
    - [x] Mounted `WeakSpotsPracticeModal`.
- [x] Testing & Verification:
  - [x] Created `server/scripts/test-quiz-history.js` (38/38 tests passing).
  - [x] Verified `npm --prefix client run build` (0 errors).
  - [x] Verified 100% pass rate across all 7 server test suites: `test-api.js` (27/27), `test-tasks.js` (42/42), `test-documents.js` (40/40), `test-ai.js` (23/23), `test-citations.js` (40/40), `test-spaced-repetition.js` (46/46), `test-quiz-history.js` (38/38) -> 256/256 passing.

### Task 5.4: Streaming (Server-Sent Events) for AI Output
- [x] SSE Infrastructure & LLM Streaming Service:
  - [x] Implemented `askAIStream({ system, prompt, messages, maxTokens, onToken, signal })` using OpenAI/Groq compatible streaming completion (`stream: true`).
  - [x] Implemented `streamNotes(documentText, onChunk, options)` with structured markdown notes prompt and `parseNotesOutput` extractor.
  - [x] Implemented `streamAsk(documentText, question, history, onChunk, options)` with delimiter-based citation extraction (`---CITATIONS---`).
  - [x] Handled stream cancellation via `AbortController` and `req.on('close')`, forwarding abort signals to cancel upstream LLM calls cleanly.
  - [x] Accumulated responses and persisted to MongoDB (`Document.notes` and `AskHistory`) on stream finish without breaking data contracts.
- [x] API Routes & SSE Protocols:
  - [x] `GET /api/documents/:id/notes/stream` (and `POST` endpoint):
    - [x] Set SSE headers (`Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`).
    - [x] Stream structured events: `event: token` with `{"text": "..."}`, `event: done` with `{"notes": {...}, "cached": boolean}`, `event: error` with `{"message": "..."}`.
    - [x] Immediate cached fallback if notes already exist and refresh is not requested.
  - [x] `POST /api/documents/:id/ask/stream` (and alias `/api/ai/ask/:id/stream`):
    - [x] Stream progressive answer tokens cleanly.
    - [x] Include citations array in `event: done` payload.
    - [x] Save complete user and assistant exchange to `AskHistory` on finish.
  - [x] Authentication & Resilience:
    - [x] Supported standard Bearer JWT authentication and query token fallback in `protect.js`.
    - [x] Handled edge disconnects cleanly without unhandled rejections or leaked connections.
- [x] Frontend: Streaming Hook & UI Components:
  - [x] Created `client/src/hooks/useAiStream.js` using `fetch` with `ReadableStream` reader, token parsing, and active `stopStream` abort controller.
  - [x] Updated `client/src/components/pdf/NotesPanel.jsx`:
    - [x] Replaced waiting spinner with progressive token streaming view with blinking indicator.
    - [x] Rendered persistent "Stop generating" button with Lucide `Square`.
    - [x] Smoothly auto-scrolls as new tokens arrive if user is near bottom.
    - [x] Handled fallback to existing cached notes with live regeneration stream preview.
  - [x] Updated `client/src/components/pdf/AskPanel.jsx`:
    - [x] Progressively streams assistant message bubble in real-time.
    - [x] Shows "Stop" button with Lucide `Square` during active stream.
    - [x] Animates and reveals citation chips with `animate-rise` once stream completes and `done` payload arrives.
- [x] Testing & Verification:
  - [x] Created `server/scripts/test-streaming.js` (42/42 tests passing).
  - [x] Verified `npm --prefix client run build` (0 errors).
  - [x] Verified 100% pass rate across all 8 server test suites: `test-api.js` (27/27), `test-tasks.js` (42/42), `test-documents.js` (40/40), `test-ai.js` (23/23), `test-citations.js` (40/40), `test-spaced-repetition.js` (46/46), `test-quiz-history.js` (38/38), `test-streaming.js` (42/42) -> 298/298 passing.



