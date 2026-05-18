# BCBA Performance Dashboard → Operational Intelligence Platform

This is a multi-week build, not a single pass. To ship value fast and avoid breaking the dashboard you rely on daily, I'll phase it. Each phase is independently shippable.

## Scope reality check

The spec touches ~15 distinct subsystems (filters, leaderboard, drawer tabs, unassigned engine, continuity engine, heatmaps, Discover, scorecards, forecasting, import UX, AI insights, header, etc.). Done well, that's roughly 6–10 implementation passes. Done in one pass it would regress the working dashboard. I will phase it and check in after each phase.

## Phase 1 — Foundation (this pass)

Goal: make the existing dashboard immediately feel more intelligent without breaking anything.

1. **Global header upgrade** on `CeoDashboardV2.tsx`, `CeoDashboardV2Insights.tsx`, `CeoDashboardV2RevenueLeaks.tsx`
   - Unified glass header with: title, active-filter pills, date range, upload, append/replace toggle, search, help, **new Insights icon** (Lucide `LineChart`) linking to Insights page.
2. **Smart filter bar** (new `BcbaFilterBar.tsx`)
   - Pills for BCBA / Client / RBT / Code / State / Clinic / Assigned-status
   - Quick-clear, saved-preset dropdown (QA View, Ops View, Unassigned, High-Risk, Low-Utilization)
   - Presets persisted to `localStorage` per user
   - State lifted so graphs/cards/tables/insights all read the same filter store
3. **Executive scorecard strip** above leaderboard
   - Total billable hrs, Avg hrs/BCBA, Supervision ratio, Active clients, Active RBTs, Utilization %, Unassigned %, Continuity score — each vs prior period with trend arrow.
4. **Auto-observations engine** (new `lib/analytics/observations.ts`)
   - Pure functions that scan the in-memory dataset and emit observation strings (e.g. "97155 hours declined 14%", "One BCBA = 28% of billable hours").
   - Rendered as a horizontal "Live Observations" rail under the scorecards.

## Phase 2 — BCBA Leaderboard + Drawer upgrade

- Elite BCBA cards: ranking badge, utilization color, animated bars, quick insight badges, hover preview.
- Drawer adds **Trends**, **Risks**, **AI Insights** tabs powered by the observation engine.

## Phase 3 — Unassigned Sessions + Continuity engine

- Dedicated unassigned operational panel with fix-suggestions (fuzzy match), location clustering, revenue-at-risk.
- Multiple-BCBA continuity timelines.

## Phase 4 — Heatmaps + Discover + Forecasting

- Interactive heatmaps (state × code, BCBA × week).
- "Discover Insights" explorer (pivot-style question chips).
- Lightweight rolling-average forecasts on Insights page.

## Phase 5 — Import UX polish

- Validation preview, column mapping confirmation, duplicate detection, import history log.

## Technical approach

- All work stays in `src/pages/CeoDashboardV2*.tsx` and new modules under `src/components/bcba-intel/` and `src/lib/analytics/`.
- No schema changes in Phase 1. The observation/forecast engines are pure TS over the data already fetched.
- Filter state moves into a `BcbaFilterContext` so every subview subscribes to one source of truth.
- All styling via existing semantic tokens (`glass-hero`, `glass-stat`, etc.) — no new color literals.

## Questions before I start Phase 1

1. **Saved-preset scope** — per-user (localStorage) for now, or do you want them shared team-wide (requires a new table)? I'll default to per-user localStorage unless you say otherwise.
2. **"AI Insights" tab** — pure rule-based observations (instant, free, deterministic) or a Lovable AI call per BCBA (richer prose, costs credits, ~2s latency)? I recommend rule-based for Phase 2 and add an optional "Ask AI" button that calls Lovable AI on demand.
3. **Confirm phase order** above, or do you want a different module first (e.g. Unassigned engine before leaderboard polish)?

Approve and I'll ship Phase 1 immediately.
