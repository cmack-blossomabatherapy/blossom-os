# Standardize page widths to match Training Academy

## Why

Training Academy uses `mx-auto w-full max-w-6xl px-6 md:px-10 py-10` — comfortable line lengths, centered content, generous side gutters. It reads calmer than the wider pages (Resource Library at `max-w-[1400px]`, and 100+ other pages at `max-w-7xl` / `max-w-[1500px]` / `max-w-[1600px]`).

Goal: make every content page use the same container so navigating between them feels like one product.

## Target container (the single source of truth)

```tsx
<div className="mx-auto w-full max-w-6xl px-6 md:px-10 py-10">
```

Rules:
- Applies to **content pages** rendered inside the OS shell.
- Does **not** apply to: sidebar, top bar, drawers/sheets, dialogs, popovers, tables that need horizontal room (kanban, org chart, wide grids — handled case-by-case in Phase 3).
- Small max-widths inside cards (`max-w-2xl` for prose, `max-w-[220px]` for filter chips, etc.) stay as-is.

## Is it difficult?

Mechanically simple — mostly a find-and-replace across ~130 occurrences. Risk lives in a handful of dense pages (kanban boards, wide tables, reports) where narrowing the container will squeeze columns. Those get reviewed by hand in Phase 3, not blindly narrowed.

## Phased plan

### Phase 1 — Resource Library (unblocks the ask immediately)

Files: `src/pages/os/OSResourceLibrary.tsx` and the six `src/pages/resource-library/*.tsx` sub-pages (Role, Department, Training, SOPs, Videos, AdminQA, Detail).

Change: swap `max-w-[1400px] px-1` → `max-w-6xl px-6 md:px-10 py-10`. Verify the sectioned Intake view and the tabs bar still align.

Deliverable: Resource Library visually matches Training Academy. Ship this first so the user sees the fix today.

### Phase 2 — Core OS pages (Home, Tasks, Goals, AI, Leads, Clients, Reports, HR home, Training Center)

~25 highest-traffic pages. Replace `max-w-7xl` / `max-w-[1500px]` / `max-w-[1600px]` outer containers with the target container. Skip inner max-widths.

Includes: `CompanyHome`, `TasksPage`, `GoalsPage`, `OSAskBlossom`, `OSLeadsV2`, `OSClientsOperations`, `WorkQueuePage`, `TrainingManagementCenter`, `TrainingAcademyHome` (already correct — used as reference), HR home, Command Center wrappers.

### Phase 3 — Remaining pages, with per-page review

~70 pages left. Group them:

- **Straight swap** (dashboards, list views that fit fine at 6xl): apply the target container.
- **Needs breathing room** (kanban boards, wide tables like Scheduling grid, Org Chart, Phone call audit, RCM tables, State Director grids, Report Builder): keep a wider container (`max-w-[1400px]` or `max-w-7xl`) but standardize to *one* wider variant and same `px-6 md:px-10 py-10` gutters so they still feel like the same product.

Deliverable: every page pulls from one of two documented containers — Standard (`max-w-6xl`) or Wide (`max-w-[1400px]`), never a mix of `1500/1600/1680/7xl`.

### Phase 4 — Lock it in

- Add a `<PageContainer variant="standard" | "wide">` component in `src/components/layout/` so future pages can't drift.
- Add an ESLint rule (or a short doc note) forbidding raw `max-w-7xl` / `max-w-[1500px]` etc. on top-level page divs.
- Update the design system skill to name the two allowed containers.

## Rollout

Phase 1 in this next build turn (fast, visible win). Phases 2–4 in subsequent turns so nothing regresses silently — each phase gets its own build and a quick visual pass.

## Technical notes

- OS shell wrapper (`OSShell.tsx` line 847) uses `max-w-[1680px]` — that stays; it's the outer frame around sidebar + content, not the content column.
- Drawers (`SheetContent`), dialogs (`DialogContent`), and popovers keep their own max-widths.
- No changes to Tailwind config needed — `max-w-6xl` already exists.
