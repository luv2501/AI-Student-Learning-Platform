# FileSense — Model Execution Split Matrix (Phase 4)

This matrix distributes tasks between **Claude** (specialized in complex architectural foundations, CSS token architecture, and app shell ergonomics) and **Gemini** (specialized in component upgrades, iconography mapping, toast integration, settings, and end-to-end verification sweeps).

---

## 1. Task Assignment Matrix

| Task ID | Task Title | Primary Assignee | Secondary / Reviewer | Primary Focus Area |
| :--- | :--- | :--- | :--- | :--- |
| **Task 4.1** | Foundation, Tokens & Dark Mode | **Claude** | Gemini | CSS variable architecture, zero-FOUC script, typography setup |
| **Task 4.2** | Component Library & Lucide Icons | **Gemini** | Claude | `lucide-react` mapping, `sonner` toasts, primitive UI states |
| **Task 4.3** | Responsive App Shell (Sidebar & Bottom Bar) | **Claude** | Gemini | Navigation ergonomics, responsive layout split, active states |
| **Task 4.4** | Workspace Redesign (Dashboard, Tasks, Profile) | **Gemini** | Claude | Task manager UI, Profile settings card, dashboard polish |
| **Task 4.5** | Document Intelligence Suite | **Claude** | Gemini | Notes reader, Flashcards flip engine, Quiz flow, Ask PDF UI |
| **Task 4.6** | Auth/Landing Polish & Final Audit | **Gemini** | Claude | Landing page, secrets scan, test script suite verification |

---

## 2. Detailed Task Breakdown & Handoff Criteria

### Task 4.1: Foundation, Design Tokens & Dark Mode
- **Owner**: **Claude**
- **Responsibilities**:
  - Configure `client/index.html` with blocking zero-FOUC theme detector and Google Fonts (`Public Sans` & `Geist Mono`).
  - Create semantic CSS custom properties in `client/src/index.css` for light and dark modes.
  - Implement `ThemeContext.jsx` with system preference sync and `localStorage` persistence under `'filesense_theme'`.
  - Implement `ThemeToggle.jsx`.
- **Handoff Criteria to Gemini**:
  - `client/src/index.css` has complete token set.
  - `ThemeContext` provides `theme`, `resolvedTheme`, and `setTheme`.
  - Zero FOUC on browser reload.

---

### Task 4.2: Component Library & Lucide Icons
- **Owner**: **Gemini**
- **Dependencies**: Task 4.1 completed.
- **Responsibilities**:
  - Install and configure `lucide-react` and `sonner`.
  - Replace all unicode/emoji icons across `Button.jsx`, `Badge.jsx`, `EmptyState.jsx`, `Input.jsx`, and `Card.jsx`.
  - Mount `<Toaster />` in root layout with theme binding.
  - Standardize button focus rings and accessible aria attributes.
- **Handoff Criteria to Claude**:
  - All primitives consume CSS semantic tokens (`bg-surface`, `text-primary`, etc.).
  - Zero emoji icons remain in UI primitives.

---

### Task 4.3: Modern App Shell (Sidebar & Mobile Nav)
- **Owner**: **Claude**
- **Dependencies**: Task 4.2 completed.
- **Responsibilities**:
  - Build `client/src/components/navigation/Sidebar.jsx` for desktop (fixed/collapsible 240px).
  - Build `client/src/components/navigation/MobileNav.jsx` with top bar + sticky bottom tab bar.
  - Update `client/src/components/Layout.jsx` to render the responsive shell seamlessly.
- **Handoff Criteria to Gemini**:
  - Desktop sidebar cleanly collapses or sits fixed without overlapping page content.
  - Mobile bottom navigation targets are >= 44x44px.

---

### Task 4.4: Core Workspace Redesign (Dashboard, Tasks & Settings)
- **Owner**: **Gemini**
- **Dependencies**: Task 4.3 completed.
- **Responsibilities**:
  - Redesign `Dashboard.jsx` with genuine stats, monospace numbers, and "Today's Focus" list.
  - Refactor `TaskForm.jsx` and `TaskItem.jsx` with Lucide icons and Sonner completion toasts.
  - Redesign `Profile.jsx` with profile info card, password card, and theme selector.
- **Handoff Criteria to Claude**:
  - Task completion, creation, and deletion work optimistically with toast feedback.
  - Profile updates and password changes validated and tested.

---

### Task 4.5: Document Intelligence Suite
- **Owner**: **Claude**
- **Dependencies**: Task 4.3 completed.
- **Responsibilities**:
  - Redesign `Documents.jsx` with clean drag-and-drop zone and file list.
  - Redesign `DocumentDetail.jsx`:
    - Structured Markdown notes viewer.
    - Flashcards carousel with keyboard shortcuts and flip state.
    - Quiz engine with instant scoring and explanation review.
    - Ask Document conversational panel.
- **Handoff Criteria to Gemini**:
  - All 4 AI tabs function properly without UI layout shift.
  - Copy notes button copies markdown with toast confirmation.

---

### Task 4.6: Marketing & Auth Polish, Verification & Security Audit
- **Owner**: **Gemini**
- **Dependencies**: Tasks 4.4 and 4.5 completed.
- **Responsibilities**:
  - Polish `Landing.jsx`, `Login.jsx`, `Register.jsx`, and `AuthLayout.jsx`.
  - Run frontend secrets scan (`git grep` for `AI_API_KEY`, `JWT_SECRET`, `MONGO_URI` in `client/`).
  - Run `npm run build` in `client/`.
  - Run all 4 server test scripts and ensure 100% pass rate.
- **Handoff Criteria**:
  - Production build succeeds with 0 errors.
  - All 132 server tests pass with 0 failures.

---

## 3. Verification Protocol

Any model finishing its assigned task must run:
```bash
# 1. Build check
npm --prefix client run build

# 2. Server regression check
node server/scripts/test-api.js
node server/scripts/test-tasks.js
node server/scripts/test-documents.js
node server/scripts/test-ai.js
```
Both models must report test execution results and modified files upon handoff.
