# Blossom OS — Premium Frontend Redesign

This is a frontend-only redesign matching your attached mockup (light, airy, purple-gradient, glassmorphism, sidebar + topbar + main + right rail). No backend, data, or API work in this phase — every screen renders against mock state already in `src/data/*`.

Scope is large (9+ pages + global shell + new component primitives). Shipping it in one pass would break the working app. I'll phase it, ship each phase independently, and you can review the look before I move to the next.

## Phase 0 — Design system foundation (1 pass)

Establish the visual language so every page inherits it.

- Update `src/index.css` tokens: soft white background (`hsl(250 30% 99%)`), light gray surface, deep purple primary with glow, gradient utilities (`--gradient-brand`, `--gradient-aurora`), softer shadows, larger radii (`--radius: 1rem`).
- Add tokenized utility classes: `.os-card`, `.os-card-floating`, `.os-glass`, `.os-kpi`, `.os-pill`, `.os-rail`.
- Typography scale tuned for airy hierarchy (Inter, tighter tracking on headings).
- Animation primitives: `fade-in`, `lift-on-hover`, KPI counter, skeleton shimmer.
- Light theme is primary. Existing dark variants kept but de-emphasized.

## Phase 1 — Global shell (1 pass)

Rebuild the chrome to match the mockup exactly.

- **New `AppSidebar`** — floating glass panel, rounded, soft shadow, collapsible. Logo + "Operations System" subtitle. Items: Dashboard, Leads, Clients, RBT/BCBA, Scheduling, Intake, Case Management, Billing, Reports, Training, HR Suite, Settings. Active item glow. AI assistant card pinned bottom with "Ask Blossom AI". "Old Version" link below it, visible only when `isAdmin` (Super Admin).
- **New `TopBar`** — centered global search with ⌘K chip, notifications bell, messages, profile with role line. Greeting handled inside dashboard, not topbar.
- **`RightRail`** — new optional slot in `AppLayout` for per-page widgets (Tasks, Calendar, Activity).
- Mobile: sidebar becomes sheet, right rail collapses below main, bottom nav stays.

## Phase 2 — Dashboard (1 pass)

Rebuild `src/pages/Index.tsx` (or `Dashboard.tsx`) into the command-center shown in your mockup.

- Greeting block ("Good morning, {name} 👋").
- KPI strip: New Leads, Active Clients, Today's Appts, Revenue MTD — with trend chips.
- Revenue Overview area chart + Lead Pipeline donut (Recharts, mock data).
- Department Overview grid (Intake, Scheduling, RBT/BCBA, Billing, Case Management).
- Quick Actions row.
- Right rail: My Tasks, Upcoming Calendar, Recent Activity.

## Phase 3 — Operational pages (2 passes)

Re-skin to the new system using shared primitives. Structure only, mock data.

Pass A: Leads, Clients, RBT/BCBA, Scheduling.
Pass B: Intake, Case Management, Billing, Reports.

Each page gets: hero strip, KPI row, primary view (pipeline / cards / calendar / table), filter rail, empty states.

## Phase 4 — Training + HR Suite (1 pass)

Training as a standalone academy feel (roadmap, badges, continue learning, department cards). HR Suite hub linking to onboarding, recruiting, evaluations, compliance.

## Phase 5 — Component polish (1 pass)

Reusable primitives audit: cards, KPI block, status pills, tags, drawers, command palette refresh, empty-state illustrations, skeletons. Final responsive sweep at 430px / 768px / 1280px / 1920px.

## Out of scope (this phase)

- No new backend tables, edge functions, or RLS changes.
- No CSV/import work.
- No changes to the BCBA Performance dashboard intelligence engine you just shipped — it keeps working as-is and will inherit the new tokens automatically.

## Technical notes

- Work stays in `src/components/layout/*`, `src/components/shared/*`, `src/pages/*`, `src/index.css`, `tailwind.config.ts`.
- All colors via semantic tokens — no hex literals in components.
- Existing routes/auth/onboarding gates untouched.
- "Old Version" link routes to `/legacy` (a thin wrapper that mounts the current `Dashboard.tsx` so nothing is lost during transition).

## Questions before I start

1. **Start point** — ship Phase 0 + Phase 1 + Phase 2 together as the first visible milestone (≈ the screen in your mockup), then pause for your review before rolling pages? Or do you want me to blast through Phases 0–5 back-to-back without checkpoints?
2. **Light vs dark** — your mockup is light-mode. Keep dark mode working as a secondary theme, or drop it entirely for now?
3. **"Old Version" target** — route `/legacy` to today's `Dashboard.tsx` only, or expose the entire current sidebar under `/legacy/*` so admins can reach every old page?

Approve (with answers to 1–3) and I'll start with Phase 0 + 1 + 2 immediately.
