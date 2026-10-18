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
