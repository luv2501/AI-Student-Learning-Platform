# FileSense — AI Agent Operational Protocol & Guidelines

> **Target Audience**: All AI assistants and autonomous coding agents (Claude, Gemini, etc.) working on the `AI-Student-Learning-Platform` (FileSense) codebase.

---

## 1. Core Operating Principles

1. **Anti-Vibecode Enforcement**: Always inspect `DESIGN.md` before generating UI code. Reject floating glowing spheres, mesh gradients, glassmorphism blur traps, and emoji icons.
2. **Never Break Contracts**: Do not alter server API routes, request/response JSON schemas, or authentication header expectations unless explicitly instructed.
3. **Zero FOUC (Flash of Unstyled Content)**: Every dark mode implementation must preserve the inline head script in `client/index.html` and respect semantic tokens.
4. **No Manual Lockfile Edits**: Always run `npm install` inside the affected folder (`client` or `server`) if dependencies are modified; never manually edit `package-lock.json`.
5. **No Placeholders or Stubs**: Do not write `// TODO: implement later` or dummy mock screens. Every component must be fully wired and functional.

---

## 2. Anti-Vibecode Checklist

Before submitting or committing any UI changes, agents must verify each point:

- [ ] **No Emojis as Icons**: Are all icons imported from `lucide-react`? Emojis like 📝, 📚, 🎯, ✓, ⬆, 🔍, 🏁 are prohibited in UI chrome and action buttons.
- [ ] **Semantic Tokens Used**: Are colors using semantic classes (`bg-base`, `bg-surface`, `text-primary`, `border-subtle`, `text-secondary`, etc.) rather than hardcoded `text-slate-900` or raw hex codes that break dark mode?
- [ ] **No Neon Orbs / Glow Blobs**: Are there zero radial gradient blur spheres or ambient mesh backgrounds?
- [ ] **Typography Grounded**: Are headings and body copy styled with `'Public Sans'`, and technical stats / page numbers styled with `'Geist Mono'` (`font-mono`)?
- [ ] **Disciplined Borders & Radii**: Are cards using `rounded-xl` (`10px`-`12px`) with a 1px border instead of pill-shaped `rounded-3xl`?
- [ ] **Accessible Interactions**: Do buttons and inputs have visible `:focus-visible` outlines and touch-friendly tap targets (minimum 44x44px on mobile)?

---

## 3. Decision Log Protocol

When making non-trivial architectural, structural, or dependency decisions, document the change in this section of `AGENTS.md` using the standard format:

```markdown
### [YYYY-MM-DD] - <Decision Title>
- **Context**: Why was this decision necessary?
- **Decision**: What was implemented?
- **Alternatives Considered**: What was rejected and why?
- **Impact**: Files affected and verification steps taken.
```

### Active Decision Log

### [2026-10-16] - Lucide Icons & Sonner Integration
- **Context**: Need to eliminate raw emoji icons and fragmented alert banners across the frontend.
- **Decision**: Adopt `lucide-react` for all icons and `sonner` for toast notifications.
- **Alternatives Considered**: FontAwesome (too heavy, dated), React Hot Toast (less refined styling control).
- **Impact**: All client views will use consistent SVG icons and centralized toast triggers.

### [2026-10-17] - Tailwind v4 Design Tokens & Micro-Radii Component System
- **Context**: Task 4.1 requires a high-utility, anti-vibecode design token system with zero FOUC, Public Sans + Geist Mono typography, and micro-radii across all UI components.
- **Decision**: Configured Tailwind v4 `@theme` mappings for surfaces, borders, text inks, and micro-radii (`2px`-`12px`). Refactored all 13 UI primitives (`Alert`, `Badge`, `Button`, `Card`, `EmptyState`, `Input`, `ProgressBar`, `SegmentedTabs`, `Select`, `Skeleton`, `Spinner`, `StatCard`, `Textarea`) to consume semantic tokens while preserving 100% of their prop APIs and event handlers. Replaced emoji placeholders with Lucide icons.
- **Alternatives Considered**: Retaining ad-hoc slate/indigo hex values (causes dark mode breakage and inconsistent border radii).
- **Impact**: All 13 UI primitives support theme tokens natively; verified clean Vite production build and server test suites passing.

### [2026-10-17] - Lucide Icons, Sonner Toasts & High-Fidelity Skeletons
- **Context**: Task 4.3 requires complete removal of emojis, wiring unified Sonner toasts across user actions, and high-fidelity skeleton loaders to prevent layout shifts.
- **Decision**: Installed `sonner` and mounted `<Toaster />` in `App.jsx` with theme synchronization. Wired toasts for document upload/deletion, task creation/toggle/deletion, and AI generation triggers. Eliminated 100% of emojis across `Landing.jsx`, `Dashboard.jsx`, and study panels in favor of Lucide SVG icons. Extended `Skeleton.jsx` with domain-specific loaders (`SkeletonTaskItem`, `SkeletonTaskList`, `SkeletonDocItem`, `SkeletonDocList`, `SkeletonWorkspace`) matching the exact row heights and card bounds of loaded data.
- **Alternatives Considered**: Ad-hoc alert banners (poor user feedback, causes UI bouncing).
- **Impact**: All async operations provide immediate toast feedback; zero jarring layout shifts during data loading.

### [2026-10-17] - Collapsible Desktop Sidebar & Mobile Bottom Tab Bar
- **Context**: Task 4.4 requires split public vs authenticated shell layouts, responsive desktop sidebar with state persistence, and touch-friendly mobile bottom navigation.
- **Decision**: Created `Sidebar.jsx` (supporting collapsible `w-64` / `w-18` icon mode with `localStorage` persistence, mark toggle, user initials, and logout button), `MobileNav.jsx` (`MobileHeader` + `MobileBottomBar` with 44px touch targets), and `PublicNav.jsx` for visitor routes. Updated `Layout.jsx` to dynamically switch shells based on authentication state, with disciplined viewport paddings.
- **Alternatives Considered**: Retaining single top navbar for all screens (causes mobile navigation clutter and suboptimal workspace screen real estate on desktop).
- **Impact**: Zero regressions on `ProtectedRoute` or `GuestRoute`; clean responsive layout across all breakpoints.

### [2026-10-17] - Editorial Landing Page Redesign (Task 4.5.1)
- **Context**: Task 4.5.1 requires full compliance with `DESIGN.md` rules on `Landing.jsx` (zero purple/blue gradient containers, zero ambient blur blobs, zero em-dashes, and verified WCAG AA contrast).
- **Decision**: Redesigned hero with warm neutral `bg-base` and restrained `bg-accent` CTA. Replaced abstract gradient container with an authentic, high-utility document inspection preview frame. Converted 3-column bento grids into a structured 4-step workflow pipeline with Lucide SVG icons and micro-radii. Removed 100% of em-dashes and emojis from marketing copy.
- **Alternatives Considered**: Generic SaaS gradient hero (rejected per Anti-Vibecode rules).
### [2026-10-17] - Editorial Auth Shell, Login & Register Redesign (Task 4.5.2)
- **Context**: Task 4.5.2 requires an editorial split shell for visitor authentication routes (`AuthLayout.jsx`) and modern accessible forms for `Login.jsx` and `Register.jsx` with password visibility toggle and semantic tokens.
- **Decision**: Refactored `AuthLayout.jsx` into a 12-column editorial split shell: left panel showcases 4 key document intelligence capabilities (`MessageSquare`, `FileText`, `Layers`, `CheckSquare`) with micro-radii containers and quiet trust proof; right panel provides a high-contrast form container using `bg-surface` and `border-border-subtle`. Upgraded `Input.jsx` to support `showPasswordToggle` with Lucide `Eye` and `EyeOff` icons. Upgraded `Button.jsx` to support a loading state with Lucide `Loader2`. Refactored `Login.jsx` and `Register.jsx` to use semantic tokens, standard autocomplete attributes (`email`, `current-password`, `new-password`), and accessible inline validation messages.
- **Alternatives Considered**: Floating modal auth popups (poor mobile ergonomics and cluttered UX).
### [2026-10-17] - Editorial Dashboard & Task Management Redesign (Task 4.5.3)
- **Context**: Task 4.5.3 requires modernizing `Dashboard.jsx`, `TaskItem.jsx`, and `TaskForm.jsx` with authentic Geist Mono metrics, SegmentedTabs task filtering, Lucide icon triggers, and high-utility recent document quick launch.
- **Decision**: Refactored cockpit header with localized date formatting and status subtext. Implemented 4 authentic `StatCard` metrics (`Documents in Library`, `Pending Tasks`, `Completed Tasks`, `Generated Materials`) computed from live data. Integrated `SegmentedTabs` for task management (`All`, `Today`, `Urgent`, `Completed`) with dynamic badge counters. Upgraded `TaskItem` with Lucide `Pencil` and `Trash2` action buttons. Upgraded `TaskForm` with semantic design tokens and eliminated em-dashes. Enhanced Recent Documents with PDF badges, page counts, generation badges, and 1-click jump buttons (`Notes`, `Cards`, `Quiz`, `Study`).
- **Alternatives Considered**: Retaining circular progress ring alongside fragmented stat boxes (caused visual clutter and uneven grid balance).
### [2026-10-17] - Editorial Profile Page Redesign & Route Fix
- **Context**: The Profile route was crashing or unresponsive due to unguarded state initialization against `user` attributes before context hydration, alongside outdated non-semantic gradient styling.
- **Decision**: Redesigned `Profile.jsx` following `DESIGN.md`: defensive state initialization with context synchronization, authentic usage statistics (`Documents in Library`, `Completed Tasks`, `Generated Materials`, `Account Status`), user details management with Sonner toasts, appearance settings card featuring active theme resolution and explicit Light/Dark/System controls, and password change with accessible password visibility toggles (`Eye`/`EyeOff`) and mismatch validation. Verified navigation links in `Sidebar.jsx` and `MobileNav.jsx` cleanly target `/profile`.
- **Alternatives Considered**: Basic unstyled placeholder (rejected per anti-vibecode and full functionality guidelines).
### [2026-10-18] - Editorial Documents Library Redesign (Task 4.5.4)
- **Context**: Task 4.5.4 requires redesigning `Documents.jsx` with an editorial minimalism layout adhering strictly to `DESIGN.md`: zero emojis, zero em-dashes, Public Sans + Geist Mono typography, WCAG AA contrast, drag-and-drop upload zone with progress indicator, responsive cards grid, search filtering, presence badges, and accessible delete confirmation.
- **Decision**: Refactored `Documents.jsx` into an editorial document intelligence cockpit. Enhanced `Input.jsx` with `leftElement` support for search inputs. Updated `Skeleton.jsx` with `SkeletonDocCard` and added `variant="grid"` support to `SkeletonDocList` for zero layout shifts. Implemented drag-and-drop dropzone with `UploadCloud`, explicit 25MB constraint notice, native file picker trigger, and real-time upload progress with `ProgressBar.jsx` and Sonner toasts. Converted list to a responsive cards grid (`Card.jsx`) with PDF badge, title, Geist Mono metadata row (page count, file size, date), material presence badges (Notes, Flashcards, Quiz), full-width "Open Workspace" action button, and an accessible delete confirmation modal dialog with Sonner toast feedback. Added `/workspace/:id` route alias in `App.jsx`.
- **Alternatives Considered**: Native `window.confirm` for deletion (less accessible and visually inconsistent with editorial design).
- **Impact**: Zero regressions on document contracts (`node server/scripts/test-documents.js` passed 40/40); Vite production build passes with `0` errors.

### [2026-10-19] - Editorial StudyWorkspace & AI Panels Redesign (Task 4.5.5)
- **Context**: Task 4.5.5 requires redesigning `StudyWorkspace.jsx` and all five `client/src/components/pdf/` panels to meet `DESIGN.md` requirements: zero emojis, zero em-dashes, Geist Mono typography for metrics, WCAG AA contrast, and accessible UI patterns replacing any `window.confirm` calls.
- **Decision**: Replaced `window.confirm` in `StudyWorkspace.jsx` with an accessible modal dialog matching the pattern established in `Documents.jsx`. Added escape-key handler and aria-modal attributes. Upgraded workspace header: breadcrumb nav with `ArrowLeft`, Geist Mono metadata row, and material-presence badges using `StickyNote`/`Layers`/`HelpCircle` icons. Redesigned `GeneratePrompt.jsx`: `PanelShell` subtitle now uses `font-mono text-xs text-muted` and a `border-b` section separator; idle state has `rounded-xl` icon container and improved spacing. Redesigned `NotesPanel.jsx`: zero-padded `padStart(2, '0')` key-point counters, left-accent-border callout for summary, hover section cards. Redesigned `FlashcardsPanel.jsx`: zero-padded `Card 04 / 18` Geist Mono progress tracker, renamed self-grading to `Mastered` / `Needs review` with `Check`/`X` icons and `aria-pressed` attributes, richer Sonner toast descriptions. Redesigned `QuizPanel.jsx`: editorial score summary card with zero-padded fraction, percentage chip with semantic color-border, `CheckCircle2`/`XCircle` correct/incorrect count row, accessible `aria-pressed` option buttons. Redesigned `AskPanel.jsx`: threaded chat with right-aligned user bubbles (`bg-accent rounded-xl rounded-br-sm`), left-aligned AI answers with `BookOpen` avatar chip, document citation chip in Geist Mono, autofocus after reply, improved suggestion chip styling.
- **Alternatives Considered**: Full CSS flip-card 3D animation for flashcards (rejected per anti-vibecode: adds GPU-intensive transforms with no content value gain).
- **Impact**: Zero regressions — `test-documents.js` 40/40, `test-api.js` 27/27, `test-tasks.js` 42/42; Vite production build exits `0`.

### [2026-10-19] - Editorial NotFound Page Redesign (Task 4.5.6)
- **Context**: Task 4.5.6 requires redesigning `NotFound.jsx` in accordance with `DESIGN.md`: eliminate rainbow gradient text, hardcoded slate hex codes, and emojis; provide a Geist Mono numerical error chip, clean headline, restrained subtext free of em-dashes, and contextual primary/secondary action triggers.
- **Decision**: Redesigned `NotFound.jsx` into an editorial error shell: centered container on `bg-base`, Geist Mono `404 // NOT_FOUND` chip using semantic tokens (`bg-subtle`, `border-border-subtle`, `text-accent`), high-contrast Public Sans headline and subtext, and context-aware action buttons ("Back to Dashboard" / "Open Library" for authenticated users; "Back to Home" / "Sign In" for visitors). Verified catch-all `<Route path="*" element={<NotFound />} />` in `App.jsx`.
- **Alternatives Considered**: Generic illustration or playful error page (rejected per anti-vibecode: honest, high-utility minimalism preferred).
- **Impact**: Zero compilation errors on Vite production build; 100% test pass rate across all server test suites.

### [2026-10-19] - Motion, Micro-Interactions, WCAG 2.1 AA Audit & Phase 4 Wrap-up (Task 4.6)
- **Context**: Task 4.6 requires verifying Framer Motion integration, ensuring restrained motion (duration <= 150ms) with `prefers-reduced-motion` compliance, eliminating `window.confirm` calls, auditing keyboard navigation and ARIA attributes (focus traps, tablists, button states), auditing color contrast ratios (>= 4.5:1), and conducting frontend secrets hygiene.
- **Decision**: Installed `framer-motion`. Built accessible `Modal.jsx` featuring complete focus trapping, Escape key listener, initial focus assignment, and focus restoration to trigger elements upon closing. Built `MotionTransition.jsx` with `useReducedMotion()` and <= 150ms duration. Replaced the last `window.confirm` in `Dashboard.jsx` with `Modal.jsx`. Refactored `SegmentedTabs.jsx` to follow the W3C WAI-ARIA tablist pattern with arrow-key keyboard navigation and dynamic `tabIndex`. Added `aria-busy` to `Button.jsx`, `aria-expanded` and `aria-haspopup` to navigation headers, and linked `aria-describedby` in `Input.jsx`. Re-calibrated semantic color tokens in `index.css` (`--text-muted`, `--warning`) to guarantee >= 4.5:1 contrast across both Light and Dark themes. Verified zero secrets in frontend code and safe token storage under `filesense_token`.
- **Alternatives Considered**: Retaining native `window.confirm` for task deletion (rejected due to accessibility and design inconsistency).
- **Impact**: Zero compilation errors on Vite production build; 132/132 tests passing across all server test suites (`test-api.js`, `test-tasks.js`, `test-documents.js`, `test-ai.js`). Phase 4 UI Redesign is 100% complete.

### [2026-10-23] - Citations & Saved Ask History (Task 5.1)
- **Context**: Task 5.1 requires extracting and persisting PDF text per page, returning ground-truth citations (`{ pageNumber, passage }`) with AI answers, persisting Q&A message exchanges to MongoDB (`AskHistory`), allowing users to browse saved history and clear it with accessible confirmation, and maintaining 100% backward compatibility for legacy documents.
- **Decision**: 
  - Updated `pdfService.js` to extract text per page (`pages: [{ pageNumber, text }]`) using `pdf-parse`.
  - Updated `Document.js` schema with `pages` array (`select: false` to prevent leaking raw text in queries) and backward-compatible `getDocPages()` fallback.
  - Created `AskHistory.js` model with compound index `{ userId: 1, documentId: 1 }` storing user/assistant message pairs and citation objects.
  - Updated `aiService.js` `answerQuestion` to group document text by pages, prompt the LLM for JSON with structured citations, and filter valid `{ pageNumber, passage }` entries.
  - Implemented `POST /api/documents/:id/ask` (alias `/api/ai/ask/:id`), `GET .../ask/history`, and `DELETE .../ask/history`. Added cascade cleanup of `AskHistory` on document deletion.
  - Redesigned `AskPanel.jsx` in accordance with `DESIGN.md`: loads conversation history on mount, displays Geist Mono citation chips (`Page 1`, `Page 2`) with `FileText` icons, toggles accessible inline excerpt callouts with supporting passages, and adds a "Clear history" action using `Modal.jsx` and Sonner toasts.
- **Alternatives Considered**: In-memory session chat storage (rejected because student study context should persist across page reloads and browser sessions). Full-screen modal popups for citations (rejected in favor of compact inline excerpt callouts preserving reading flow).
- **Impact**: Zero regressions — all 5 test suites pass 100% (`test-api.js` 27/27, `test-tasks.js` 42/42, `test-documents.js` 40/40, `test-ai.js` 23/23, `test-citations.js` 40/40); Vite production build exits `0`.

### [2026-10-24] - Spaced Repetition (SM-2) for Flashcards (Task 5.2)
- **Context**: Flashcard learning required scientific active recall scheduling rather than static session-only reviews. In addition, when AI regenerates flashcards for a document, existing review history should not be lost.
- **Decision**: 
  - Designed deterministic `cardId` derivation (SHA-256 hash of normalized question text) so AI card regeneration preserves historical review progress for identical concepts.
  - Implemented `CardReview` model with `{ userId, documentId, cardId, repetition, interval, easeFactor, dueDate, lastReviewed, history }` indexed on `{ userId: 1, documentId: 1, cardId: 1 }` and `{ userId: 1, dueDate: 1 }`.
  - Implemented SuperMemo SM-2 engine (`sm2.js`) handling 4 ratings (1: Again, 2: Hard, 3: Good, 4: Easy), bounding easeFactor to >= 1.3, and calculating due dates.
  - Built endpoints: `POST /api/flashcards/review`, `GET /api/flashcards/due`, `GET /api/flashcards/due-count`, and `GET /api/documents/:id/flashcards/reviews`. Added cascade deletion on document removal.
  - Redesigned `FlashcardsPanel.jsx` adhering to `DESIGN.md`: persistent review status, 4 rating buttons under flipped cards with Geist Mono interval previews (`1d`, `6d`, etc.), keyboard shortcuts (Spacebar flip, 1/2/3/4 rating), and review state badges.
  - Integrated `DueReviewModal.jsx` and "Review due today" action banner in `Dashboard.jsx`.
- **Alternatives Considered**: In-memory session tracking (rejected because long-term retention requires multi-day persistent scheduling). Full SuperMemo SM-5/17 (overly complex parameter calibration for web app MVP).
- **Impact**: Zero regressions — all 6 server test suites pass 100% (`test-api.js` 27/27, `test-tasks.js` 42/42, `test-documents.js` 40/40, `test-ai.js` 23/23, `test-citations.js` 40/40, `test-spaced-repetition.js` 46/46 — total 218/218 passing); Vite production build exits `0`.

### [2026-10-24] - Quiz History & Weak Spots Detection (Task 5.3)
- **Context**: Students taking quizzes needed historical performance tracking, visibility into concept retention across quiz attempts, and automated gap remediation rather than repetitive random questioning.
- **Decision**: 
  - Created `QuizAttempt` model with `{ userId, documentId, score, totalQuestions, correctCount, answers: [{ question, selectedOption, correctOption, isCorrect, topic }], createdAt }` and compound indexes `{ userId: 1, documentId: 1, createdAt: -1 }` and `{ userId: 1, createdAt: -1 }`.
  - Added cascade deletion of `QuizAttempt` records upon document deletion in `documentController.js`.
  - Updated AI quiz generator prompt and parser in `aiService.js` to assign a concise `topic` string attribute to each generated question.
  - Implemented weak spot aggregation (`quizController.js`): topics with accuracy < 60% or repeatedly missed >= 2 times are categorized as weak spots. Added `generateWeakSpotsQuiz(text, topics, count = 5)` for focused gap remediation.
  - Built endpoints: `POST /api/quizzes/attempts`, `GET /api/documents/:id/quizzes/attempts`, `GET /api/quizzes/weak-spots`, `POST /api/quizzes/weak-spots` (and alias `POST /api/ai/quiz/weak-spots`), and `GET /api/quizzes/history/summary`.
  - Updated `QuizPanel.jsx`: auto-persists completed attempts, provides an accessible "Attempt History" modal dialog in Geist Mono, and displays a weak spots detection banner with topic chips and a 1-click targeted practice trigger.
  - Updated `Dashboard.jsx`: created a zero-dependency SVG `ScoreTrendChart` visualizer with hover/focus tooltips and accessible ARIA attributes, alongside a "Knowledge Gaps" weak spots card with `WeakSpotsPracticeModal` for on-demand 5-question targeted quizzes.
- **Alternatives Considered**: In-memory session tracking (rejected because long-term learning requires cross-session gap detection). Heavy charting libraries like Chart.js or Recharts (rejected per anti-vibecode: lightweight vanilla SVG preserves fast bundle load, zero FOUC, and complete token fidelity).
- **Impact**: Zero regressions — all 7 server test suites pass 100% (`test-api.js` 27/27, `test-tasks.js` 42/42, `test-documents.js` 40/40, `test-ai.js` 23/23, `test-citations.js` 40/40, `test-spaced-repetition.js` 46/46, `test-quiz-history.js` 38/38 — total 256/256 passing); Vite production build exits `0`.

### [2026-10-24] - Server-Sent Events (SSE) AI Streaming (Task 5.4)
- **Context**: Long-running LLM generation for Notes and Ask-PDF created UX latency and waiting spinners. Users needed progressive token streaming, real-time feedback, and the ability to cancel generation mid-stream without wasting server resources.
- **Decision**: 
  - Implemented `askAIStream` in `aiService.js` consuming OpenAI/Groq compatible streaming completion (`stream: true`) with native `ReadableStream` reader, backoff retries, and clean abort signals.
  - Implemented `streamNotes` with high-utility markdown formatting and `parseNotesOutput` structured extractor, saving to `Document.notes` on stream completion.
  - Implemented `streamAsk` with partial match protection isolating answer text from `---CITATIONS---` grounding delimiter, saving full exchanges to `AskHistory` upon finish.
  - Built SSE routes: `GET /api/documents/:id/notes/stream` (with immediate cached fallback and `cached: true/false`), `POST /api/documents/:id/ask/stream` (and alias `/api/ai/ask/:id/stream`).
  - Added query token support in `protect.js` for EventSource compatibility alongside standard Bearer auth.
  - Forwarded client disconnects (`req.on('close')`) to `AbortController` to terminate upstream calls immediately.
  - Created `useAiStream.js` hook in `client/src/hooks/` with `ReadableStream` reader and active abort controls.
  - Upgraded `NotesPanel.jsx` with real-time progressive stream preview, Lucide `Square` "Stop generating" button, smooth auto-scroll, and cached notes fallback.
  - Upgraded `AskPanel.jsx` with progressive real-time message bubble, Lucide `Square` "Stop" button, and smooth `animate-rise` citation reveal upon stream finish.
- **Impact**: Zero regressions — all 8 server test suites pass 100% (`test-api.js` 27/27, `test-tasks.js` 42/42, `test-documents.js` 40/40, `test-ai.js` 23/23, `test-citations.js` 40/40, `test-spaced-repetition.js` 46/46, `test-quiz-history.js` 38/38, `test-streaming.js` 42/42 — total 298/298 passing); Vite production build exits `0`.

### [2026-10-24] - Continuous Integration (GitHub Actions CI Pipeline) (Task 5.5)
- **Context**: As test suites expanded to 8 suites and 298 assertions across core APIs, tasks, documents, spaced repetition, quiz gap detection, and SSE streaming, manual individual test execution created regression risk and lacked automated branch gatekeeping.
- **Decision**: 
  - Designed `server/scripts/run-all-tests.js`: sequentially executes all 8 test suites, captures stdout/stderr, counts assertions, times execution per suite, formats an editorial ASCII summary table, and enforces clean exit codes (0 for full pass, 1 for any failure).
  - Configured root `package.json` with `"test"`, `"test:server"`, `"build"`, and `"build:client"`.
  - Built `.github/workflows/ci.yml` running on Node 20.x with npm dependency caching across two parallel jobs: `test-server` (unified server test runner with mock test environment) and `build-client` (production Vite build with artifact integrity verification).
  - Added simulated mock provider fallback in `test-ai.js` when `AI_API_KEY` is not present, enabling 100% test pass rate in external CI without exposing API credentials.
  - Added live GitHub Actions status badge and comprehensive testing documentation to `README.md`.
- **Alternatives Considered**: Monolithic single-file test script (rejected to preserve ability to run isolated domain suites during focused local development). Running tests concurrently (rejected because multiple in-memory MongoDB instances on identical ports can conflict).
- **Impact**: Zero regressions — `npm test` runs all 8 test suites (298/298 passing in ~17s); `npm run build:client` exits `0`; CI automated gatekeeping active.

---





## 4. Mandatory Verification Checklist

Before declaring ANY task or subtask complete, the agent **MUST** run and pass every item in this checklist:

1. **Client Build Verification**:
   ```bash
   npm --prefix client run build
   ```
   - Must exit with code `0`.
   - Zero compilation errors, unresolved imports, or broken asset paths.

2. **Server Test Suites Verification**:
   ```bash
   node server/scripts/test-api.js
   node server/scripts/test-tasks.js
   node server/scripts/test-documents.js
   node server/scripts/test-ai.js
   ```
   - 100% pass rate across all suites.
   - Zero regressions on MongoDB in-memory fixtures.

3. **Brand & Secret Integrity Check**:
   - Ensure `studymind` does not appear as active brand copy (only `LEGACY_TOKEN_KEY` in `api.js` for migration).
   - Verify `AI_API_KEY`, `JWT_SECRET`, and `MONGO_URI` are never present in client bundles or `.env.example`.

4. **Git Cleanliness**:
   - Verify `git status` reflects only intended file modifications.
   - Ensure no leftover scratch scripts or temporary debug logs are left behind.
