# FileSense — Phase 4 UI Redesign Task Checklist

> **Phase Goal**: Implement the anti-vibecode design system across FileSense with custom design tokens, zero-FOUC dark mode, responsive sidebar/bottom-bar navigation, Lucide icons, Sonner toasts, and full page redesigns.

---

## Task 4.1: Foundation — Design Tokens, Typography & Dark Mode Engine
- [ ] Install required frontend dependencies (`lucide-react`, `sonner`, `clsx`, `tailwind-merge` if needed).
- [ ] Configure `client/index.html`:
  - [ ] Import Google Fonts: `Public Sans` and `Geist Mono`.
  - [ ] Add blocking inline theme script in `<head>` to prevent FOUC (reads `localStorage` and `prefers-color-scheme`).
- [ ] Configure `client/src/index.css`:
  - [ ] Define `:root` semantic tokens (`--bg-base`, `--bg-surface`, `--text-primary`, `--border-subtle`, `--accent`, etc.).
  - [ ] Define `.dark` semantic tokens for slate/graphite dark mode.
  - [ ] Map typography families (`font-sans`, `font-mono`).
- [ ] Create `client/src/context/ThemeContext.jsx`:
  - [ ] Provide `theme` (`'light' | 'dark' | 'system'`), `resolvedTheme`, and `setTheme`.
  - [ ] Persist selection to `localStorage.setItem('filesense_theme', theme)`.
  - [ ] Synchronize `window.matchMedia('(prefers-color-scheme: dark)')` listener.
- [ ] Create `ThemeToggle.jsx` component with accessible dropdown or toggle button.

---

## Task 4.2: Component Library Upgrade & Lucide Icons
- [ ] Refactor `Button.jsx`:
  - [ ] Variants: `primary`, `secondary`, `subtle`, `ghost`, `destructive`.
  - [ ] Loading spinner integration (using Lucide `Loader2`).
  - [ ] Accessible focus rings (`focus-visible:ring-2`).
- [ ] Refactor `Card.jsx`:
  - [ ] Modern border styling (`border-border-subtle bg-surface`).
  - [ ] Structured headers, dividers, and padding presets.
- [ ] Refactor `Input.jsx` & Form Controls:
  - [ ] Floating or clean label alignment, helper text, and error states.
  - [ ] Password visibility toggle (`Eye` / `EyeOff` from Lucide).
- [ ] Refactor `Badge.jsx` & `EmptyState.jsx`:
  - [ ] Replace emoji icons with Lucide SVG icons.
  - [ ] Muted, readable status tones (`neutral`, `success`, `warning`, `danger`, `accent`).
- [ ] Setup `sonner` in root layout (`<Toaster />` with theme awareness).

---

## Task 4.3: Modern App Shell (Desktop Sidebar + Mobile Bottom Bar)
- [ ] Create `client/src/components/navigation/Sidebar.jsx`:
  - [ ] Fixed/collapsible desktop sidebar (240px width).
  - [ ] Brand `Logo` with mark and styled text.
  - [ ] Navigation links with active states:
    - Dashboard (`LayoutDashboard`)
    - Documents (`FileText`)
    - Tasks (`CheckSquare`)
    - Profile (`Settings` / `User`)
  - [ ] User profile footer with avatar initials, theme toggle, and logout button.
- [ ] Create `client/src/components/navigation/MobileNav.jsx`:
  - [ ] Top compact header with `Logo` and user trigger.
  - [ ] Sticky bottom navigation bar with 4 core destination tabs.
- [ ] Update `client/src/components/Layout.jsx`:
  - [ ] Unify layout to render Sidebar on `md:` screens and MobileNav on smaller screens.
  - [ ] Main viewport area with disciplined padding and responsive container bounds.

---

## Task 4.4: Core Workspace Redesign (Dashboard, Tasks & Settings)
- [ ] Redesign `client/src/pages/Dashboard.jsx`:
  - [ ] High-clarity greeting and real-time status summary.
  - [ ] Genuine stat cards with Geist Mono digits and Lucide indicators.
  - [ ] "Today's Focus" list with instant checkbox toggles.
  - [ ] "Recent Documents" quick-action list.
- [ ] Redesign Task Management (`TaskForm.jsx`, `TaskItem.jsx`):
  - [ ] Replace custom prompt confirm with clean modal or inline delete.
  - [ ] Add toast alerts via Sonner on task creation, completion, and deletion.
  - [ ] Urgent/overdue visual hierarchy without neon colors.
- [ ] Redesign `client/src/pages/Profile.jsx`:
  - [ ] Account details card (Name, Email, Institution).
  - [ ] Security card (Password update with strength indicators).
  - [ ] Appearance settings card (Light / Dark / System mode selection).

---

## Task 4.5: Document Intelligence Redesign
- [ ] Redesign `client/src/pages/Documents.jsx`:
  - [ ] Minimal drag-and-drop file upload zone with Lucide `UploadCloud` icon.
  - [ ] Document list with Geist Mono page count & file size metrics.
  - [ ] Fast search filter and status tags.
- [ ] Redesign `client/src/pages/DocumentDetail.jsx`:
  - [ ] Sticky document header with title, page count, and action buttons.
  - [ ] Tabbed workspace:
    - **Notes**: Structured typography, section cards, copy button with toast feedback.
    - **Flashcards**: Crisp card flip animation, keyboard shortcuts (`Space` to flip, `Arrow` to navigate), shuffle.
    - **Quiz**: Clean option selector, instant answer feedback with explanation, score summary.
    - **Ask Document (Q&A)**: Chat interface with grounded document answers and clean input bar.

---

## Task 4.6: Marketing & Auth Polish, Verification & Security Audit
- [ ] Polish `client/src/pages/Landing.jsx`:
  - [ ] Anti-vibecode hero with clear typography and dark/light mode balance.
  - [ ] Features grid with Lucide icons and clean borders.
  - [ ] Direct calls to action.
- [ ] Polish `Login.jsx`, `Register.jsx`, and `AuthLayout.jsx`:
  - [ ] Clean card layouts, inline error messages, and loading states.
- [ ] Frontend Security Audit:
  - [ ] Verify zero backend secrets (`AI_API_KEY`, `JWT_SECRET`, `MONGO_URI`) exist in client code.
  - [ ] Verify safe token storage under `filesense_token`.
- [ ] Final Verification:
  - [ ] Run `npm run build` in `client/` (0 errors).
  - [ ] Run all server test scripts (`test-api.js`, `test-tasks.js`, `test-documents.js`, `test-ai.js`) -> 100% pass rate.
