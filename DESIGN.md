# FileSense — Design System & Anti-Vibecode Specification

> **Mission**: Build an ultra-refined, utilitarian, high-clarity document intelligence workspace. FileSense rejects generic "AI SaaS template" tropes in favor of typographic precision, functional density, and honest interface aesthetics.

---

## 1. Core Philosophy: The Anti-Vibecode Directives

Modern AI interfaces have fallen into a trap of generic, distracting visual clichés ("vibecoding"). FileSense enforces a strict set of design rules to ensure a professional, focused, and distraction-free workspace.

### Strict Zero-Vibecode Rules

| Cliché to Ban | Why It's Banned | What We Do Instead |
| :--- | :--- | :--- |
| **Emoji Icons** (📝, 📚, 🎯, 💡) | Childish, inconsistent across OS/browsers, unprofessional | **Lucide Icons** exclusively (`lucide-react`) with consistent 1.5px/1.75px stroke widths |
| **Purple/Neon Glowing Orbs & Mesh Blobs** | Unnecessary GPU consumption, illegible contrast, gimmicky | **Flat, solid surfaces** with subtle structural borders and intentional depth |
| **Glassmorphism & `backdrop-blur` Overload** | Causes visual vibration, muddy contrast on text, poor performance | **Opaque card backgrounds** (`bg-surface`) with precise 1px borders (`border-border`) |
| **Rainbow / Hyper-Saturated Gradients** | Distracts from document content, screams "cheap template" | **Single muted accent** (warm slate / dark graphite / deep indigo) used strictly for primary actions |
| **Fake Vanity Metrics & Empty Spinners** | Dishonest feedback and bloated UI | **Real data visualizations**, concise status pills, and fast optimistic UI |
| **Massive Rounded "Pill" Cards & Excess Padding** | Wastes screen real estate, reduces information density | **8px / 12px radii**, disciplined 16px/24px padding, clear grid alignment |

---

## 2. Color Palette & Semantic Tokens

FileSense uses a **warm neutral base** with **structural gray dividers** and a **single disciplined accent color**. All colors must be consumed through CSS custom properties to ensure seamless, zero-flash dark mode support.

### Light Theme (Paper & Ink)
- **App Background (`--bg-base`)**: `#F9F9FB` (warm, soft off-white that reduces eye fatigue)
- **Surface / Card (`--bg-surface`)**: `#FFFFFF` (pure crisp white for readable cards)
- **Elevated Surface (`--bg-elevated`)**: `#FFFFFF` with soft 1px shadow
- **Muted Surface (`--bg-subtle`)**: `#F3F4F6` (subtle contrast for tables, chips, toolbars)
- **Primary Text (`--text-primary`)**: `#111827` (slate 900 — deep, high contrast)
- **Secondary Text (`--text-secondary`)**: `#4B5563` (slate 600 — clear hierarchy)
- **Muted / Placeholder Text (`--text-muted`)**: `#9CA3AF` (slate 400)
- **Border / Divider (`--border-subtle`)**: `#E5E7EB` (slate 200 — 1px structural lines)
- **Active Border (`--border-focus`)**: `#1F2937` (slate 800)
- **Accent Primary (`--accent`)**: `#2563EB` or `#1E293B` (rich navy or deep slate)
- **Accent Hover (`--accent-hover`)**: `#1D4ED8`
- **Accent Contrast Text (`--accent-contrast`)**: `#FFFFFF`

### Dark Theme (Slate & Graphite)
- **App Background (`--bg-base`)**: `#0B0D12` (deep obsidian / slate black — not muddy gray)
- **Surface / Card (`--bg-surface`)**: `#13161C` (graphite surface with crisp separation)
- **Elevated Surface (`--bg-elevated`)**: `#1A1D26` (popovers, dropdowns, modals)
- **Muted Surface (`--bg-subtle`)**: `#161922` (item row hovers, secondary chips)
- **Primary Text (`--text-primary`)**: `#F3F4F6` (slate 100 — clean, readable white)
- **Secondary Text (`--text-secondary`)**: `#9CA3AF` (slate 400 — balanced subtitle text)
- **Muted / Placeholder Text (`--text-muted`)**: `#6B7280` (slate 500)
- **Border / Divider (`--border-subtle`)**: `#242834` (structural 1px border for card boundaries)
- **Active Border (`--border-focus`)**: `#60A5FA` or `#E5E7EB`
- **Accent Primary (`--accent`)**: `#3B82F6` (clear electric blue for readability on dark)
- **Accent Hover (`--accent-hover`)**: `#60A5FA`
- **Accent Contrast Text (`--accent-contrast`)**: `#FFFFFF`

### Status Accents (Muted & Functional)
- **Success**: Soft emerald (`#059669` light / `#10B981` dark)
- **Warning**: Warm amber (`#D97706` light / `#F59E0B` dark)
- **Danger / Destructive**: Rose / crimson (`#DC2626` light / `#EF4444` dark)
- **Info**: Calm slate blue (`#2563EB` light / `#38BDF8` dark)

---

## 3. Typography: Public Sans & Geist Mono

Typography is the backbone of FileSense. Clean typography conveys authority, speed, and readability.

```html
<!-- Font imports in client/index.html -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600&family=Public+Sans:ital,wght@0,300..0,800;1,300..1,800&display=swap"
  rel="stylesheet"
/>
```

### Type Families
- **Primary Body & UI**: `'Public Sans', -apple-system, BlinkMacSystemFont, sans-serif`
  - High x-height, engineered for legibility across small UI labels, body copy, and dense data tables.
- **Monospace & Code (`font-mono`)**: `'Geist Mono', ui-monospace, SFMono-Regular, monospace`
  - Used for document statistics, page counters, time stamps, API tokens, shortcuts, and code blocks.

### Type Scale & Hierarchy
- **Display / Hero**: `36px` (`2.25rem`), font-weight 700, tracking `-0.025em`, line-height 1.15
- **Page Header (H1)**: `24px` (`1.5rem`), font-weight 600, tracking `-0.02em`, line-height 1.25
- **Section Header (H2)**: `18px` (`1.125rem`), font-weight 600, tracking `-0.015em`, line-height 1.3
- **Card Title / Group (H3)**: `15px` (`0.9375rem`), font-weight 600, tracking `-0.01em`
- **Standard Body**: `14px` (`0.875rem`), font-weight 400, line-height 1.5
- **Small / Meta**: `12px` (`0.75rem`), font-weight 500, line-height 1.4
- **Overline / Micro Tag**: `11px` (`0.6875rem`), font-weight 600, tracking `+0.05em`, uppercase

---

## 4. Layout & Spacing System

- **Base Grid**: 4px base increment (`4px`, `8px`, `12px`, `16px`, `20px`, `24px`, `32px`, `48px`).
- **Container Max-Width**: `1200px` for main content dashboard; `768px` for focused reading / reader mode.
- **Card Geometry**:
  - Border radius: `rounded-xl` (`10px` or `12px`), never oversized `rounded-3xl` for internal tools.
  - Border: 1px solid `var(--border-subtle)`.
  - Shadows: Crisp, subtle drop shadow (`box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05)`), never huge colored glow.

---

## 5. UI Elements & Components Standards

1. **Buttons**:
   - **Primary**: Solid accent background, crisp font-medium, subtle hover brightness shift.
   - **Secondary**: 1px subtle border, surface background, dark text, clean hover.
   - **Ghost / Subtle**: No border, background transparent, active state background tint.
   - **Destructive**: Rose tint border or muted red background; never screaming neon.
2. **Icons (`lucide-react`)**:
   - Standard icon size: `16px` (`h-4 w-4`) inside buttons and tables; `18px` (`h-4.5 w-4.5`) in sidebars.
   - Always paired with an explicit `aria-hidden="true"` or wrapped with an accessible label.
3. **Empty States**:
   - Minimalist illustration or clean Lucide icon in a muted circular surface (`bg-subtle`).
   - Honest copy explaining what document or task is missing, with a single clear primary CTA.
4. **Toasts (`sonner`)**:
   - Positioned bottom-right on desktop, top-center on mobile.
   - High-contrast, compact, automatically dismissible, with custom styling adhering to theme tokens.
