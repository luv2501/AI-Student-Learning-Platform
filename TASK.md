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
