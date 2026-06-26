## Problem

Last turn I redesigned `src/pages/os/OSIntakeOperations.tsx`, but the `/intake/dashboard` route the Intake team actually lands on renders `src/pages/os/intake/IntakeDashboard.tsx` — a different, plainer file built on `GrowthPageShell` / `Section` / `StatCard`. That's why nothing changed for you visually.

## Plan

Redesign `src/pages/os/intake/IntakeDashboard.tsx` with the same direction we agreed on:

1. **Remove "Intake workspaces" section** entirely (it's the same redundant grid you flagged).
2. **Intake Pulse KPI row** — replace plain `StatCard`s with gradient/tone chips (sky, amber, rose, violet, indigo, emerald), each with an icon, value, sub-label, and a thin progress bar showing share of total. Clicking a tile drills down (filters the lists below by stage bucket / blocker).
3. **Pipeline Insights row** (new, using `recharts` already in the project):
   - Readiness Funnel — horizontal bar of families per canonical stage.
   - Stage Aging — stacked bar (Fresh / Waiting / Overdue) per stage.
   - Source Mix — donut of top referral sources.
   - All segments click-through to filter the action lists.
4. **Action Required redesign** — three-column card layout, left urgency bar (red/amber/sky), color-coded status pills, owner avatar, last-touch + days-in-stage, quick actions (Open lead, Log contact). Replaces the current cramped list.
5. **Handoff Readiness** — keep, restyled as emerald-toned cards matching the new system.
6. **Shared `SectionHeader`** — uniform icon chip + title + subtitle across every block (Pulse, Insights, Action Required, Handoff, Owner workload, Aging, State, Source), so the whole page feels like one design.
7. Keep existing data sources (`useLeads`, owner/stage/source aggregations) and canonical stage helpers — visual/layout only, no business-logic or schema changes.

### Technical notes

- File touched: `src/pages/os/intake/IntakeDashboard.tsx` only (plus, if needed, a small `IntakeDashboardCharts.tsx` extracted alongside it for the recharts block).
- Keep `GrowthPageShell` as the outer wrapper for layout consistency with other Intake pages, but stop using the plain `Section` / `StatCard` primitives inside — render the new tiles/cards directly so we control gradients, tones, and spacing.
- Reuse the canonical pipeline stage list already imported in this file; no DB or context changes.
- The previous redesign of `OSIntakeOperations.tsx` stays — it's a sibling operations view and won't hurt — unless you'd like me to revert it.

## Question for you

Do you want me to **also leave the previous `OSIntakeOperations.tsx` redesign in place**, or revert that file so only the real dashboard is restyled?
