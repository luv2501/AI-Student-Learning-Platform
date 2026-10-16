# FileSense — Phase 4 Product Requirements Document (PRD)

## 1. Executive Summary

Phase 4 transforms **FileSense** from an initial prototype UI into an enterprise-grade, high-density, anti-vibecode document intelligence platform. The primary goal is delivering a fast, accessible, aesthetically refined experience with dark mode support, an ergonomic app shell, and zero design clichés.

---

## 2. Key Product Objectives

1. **Anti-Vibecode Design Execution**: Implement the design tokens, typography, and clean aesthetic defined in `DESIGN.md`.
2. **Zero-FOUC Dark Mode**: Robust light/dark theme system with instant script execution before render to prevent theme flashing.
3. **Responsive App Shell**: Ergonomic desktop collapsible/fixed navigation sidebar paired with a mobile sticky bottom navigation bar.
4. **Professional UI Tooling**: Replace all arbitrary emojis and raw alert components with **Lucide React** icons and **Sonner** notifications.
5. **Full Page Redesign**: Polish every user flow — Landing, Auth, Dashboard, Task Manager, Documents, and Document Intelligence Suite.
6. **Security & Production Hardening**: Frontend secrets inspection, error boundary coverage, and accessible interactive landmarks.

---

## 3. Detailed Feature Requirements

### 3.1 Design System & CSS Custom Properties
- Define semantic CSS custom properties in `client/src/index.css` scoped under `:root` and `.dark`.
- Tokens required:
  - Backgrounds: `--bg-base`, `--bg-surface`, `--bg-elevated`, `--bg-subtle`
  - Text: `--text-primary`, `--text-secondary`, `--text-muted`
  - Borders: `--border-subtle`, `--border-focus`
  - Accent: `--accent`, `--accent-hover`, `--accent-contrast`
  - Status: `--success`, `--warning`, `--destructive`, `--info`
- Integrate Google Fonts: **Public Sans** (sans) and **Geist Mono** (mono).
- Configure Tailwind CSS (`index.css` / theme classes) to consume semantic tokens effortlessly.

### 3.2 Dark Mode System (Zero FOUC)
- Create a lightweight `ThemeContext` providing `theme` (`'light' | 'dark' | 'system'`), `resolvedTheme` (`'light' | 'dark'`), and `setTheme`.
- Prevent Flash of Unstyled Content (FOUC):
  - Add an inline blocking script in `client/index.html` inside `<head>` that reads `localStorage.getItem('filesense_theme')` or system preference (`prefers-color-scheme`) and applies `.dark` to `document.documentElement` before the DOM renders.
- Include an accessible theme switcher toggle with smooth icon transition (`Sun` / `Moon` / `Laptop`).

### 3.3 Modern App Shell & Navigation
- **Desktop (>= 768px)**:
  - Collapsible/fixed left sidebar navigation (width ~240px).
  - Navigation items:
    - Overview / Dashboard (`LayoutDashboard` icon)
    - Documents (`FileText` / `Library` icon)
    - Tasks (`CheckSquare` icon)
    - Profile & Settings (`Settings` / `User` icon)
  - Bottom section with user avatar, name, theme toggle, and quick logout.
- **Mobile (< 768px)**:
  - Minimal top header containing brand `Logo` (mark only or compact) and user profile trigger.
  - Sticky bottom tab bar (h-14) with touch-friendly tap targets (minimum 44x44px) for core pages.
  - Smooth route transition indicator and zero layout shifting.

### 3.4 Iconography & Toast Feedback
- **Lucide Icons (`lucide-react`)**:
  - Completely replace all emojis (📝, 📚, 🎯, ◔, ◷, !, ✓, ⬆, 🔍, 🏁) across the entire client application.
  - Set default stroke width to `1.75px` for a clean, sharp look.
- **Sonner Toasts (`sonner`)**:
  - Replace raw inline banners/alerts on mutations with elegant toast feedback:
    - Document upload progress and success/failure.
    - AI generation trigger confirmations (Notes, Flashcards, Quiz).
    - Task creation, completion toggle, deletion.
    - Profile update and password change confirmations.
  - Configure with dark mode synchronization and accessible announcements.

### 3.5 Page-by-Page Redesign Specifications

#### A. Landing Page (`client/src/pages/Landing.jsx`)
- Modern, clean hero section with crisp typography (no glowing purple mesh orbs).
- Clear value proposition: "Understand every document with AI".
- Live feature breakdown with clean Lucide cards and monospace metadata tags.
- Direct CTA paths into free registration or demo workspace.

#### B. Dashboard (`client/src/pages/Dashboard.jsx`)
- Concise greeting with time-aware context and real task breakdown.
- Stat cards with genuine metrics, subtle borders, and monospace numbers.
- Split layout:
  - Left: "Today's Focus" list with quick checkbox toggling and due date badges.
  - Right: "Recent Documents" with instant study action triggers.
- Full task table/list with filter tabs (All, Pending, Done).

#### C. Document Library & Detail (`client/src/pages/Documents.jsx` & `DocumentDetail.jsx`)
- Drag-and-drop upload zone with clear PDF format guidance and clean SVG upload icon.
- Document list showing file size, page count, upload date, and active AI capability badges.
- **Document Detail Workspace**:
  - Document summary and preview header.
  - Tabbed or split interface for:
    1. **Study Notes**: Hierarchical markdown view with copy/print shortcuts.
    2. **Flashcards**: Interactive 3D flip card with shuffle and self-grading counters.
    3. **Quiz Engine**: Interactive multi-choice questions, answer validation, and score recap.
    4. **Ask Document (Q&A)**: Grounded conversational chat with citations and streaming feedback.

#### D. Task Manager (`client/src/pages/Dashboard.jsx` / Task Components)
- Fast inline or modal task creator (title, subject, priority, due date).
- Sorting by urgency and filter by subject/status.
- Optimistic toggle state for instant completion feedback.

#### E. Profile & Settings (`client/src/pages/Profile.jsx`)
- Clean account information editor (Name, Email, Institution).
- Password change card with current password validation.
- Theme preference selector (Light, Dark, System).

#### F. Auth Pages (`Login.jsx`, `Register.jsx`, `AuthLayout.jsx`)
- Distraction-free two-column layout on desktop, focused card on mobile.
- Form inputs with clear focus states, inline validation errors, and toggleable password visibility.

### 3.6 Frontend Security & Secrets Scan
- Verify that **NO backend API keys** (such as `AI_API_KEY`, `JWT_SECRET`, or `MONGO_URI`) are referenced in client files or exposed via `import.meta.env`.
- Ensure client `.env.example` only specifies `VITE_API_URL` and `VITE_PROXY_TARGET`.
- Ensure all authenticated requests securely transmit `Bearer ${token}` via the centralized `api.js` interceptor.

---

## 4. Success Metrics
- **Zero FOUC**: Theme persists without light/dark flicker across page reloads.
- **Zero Build Warnings**: `npm run build` generates a clean bundle.
- **100% Pass Rate on Server Test Suites**: All existing backend and AI API contracts remain intact.
- **Strict Anti-Vibecode Compliance**: 0 emojis used for UI controls, 0 neon gradient blobs, 100% Lucide icons.
