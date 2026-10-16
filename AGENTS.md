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
