# State Director Dashboard — Hours vs Clients Hero

## The one thing this dashboard answers

> "Are we staffing efficiently this week, by code, vs where we were?"

Everything else is supporting cast. The hero is a single time-series chart of **Service Hours vs Active Clients**, filterable by procedure code, with a 3-week moving average. Pulled directly from the Yosif transcript.

## Data

We already have `bcba_billable_sessions` (34,121 rows, Jan–May 2026) and the new TXT (2,822 more rows, May 10–20). We import the new file and add billing/state columns so the dashboard can filter and slice properly. PHI (client names) is stored but **never rendered** — every row goes through a `redactClient()` helper.

### Schema additions (additive, nullable)

On `bcba_billable_sessions`:
- `state` text — ServiceLocationStateProvince
- `service_location` text — Home / Clinic / School / Telehealth
- `payor_name` text, `payor_type` text (medicaid / commercial)
- `units` numeric, `charges_total` numeric, `amount_paid` numeric, `amount_owed` numeric
- `is_billable` boolean (false for admin/cancellation codes)

The existing `import-bcba-sessions` edge function gets a small column-mapping extension. `source_id` unique index handles the May 10–18 overlap automatically.

## The dashboard layout (top to bottom)

### 1. Header strip
- Greeting + state + date
- Small health badge: `NC · Stable · 82` (the old ring, demoted)
- Live data freshness chip

### 2. HERO — Hours vs Clients (the chart Yosif wants)

A single large chart, ~360px tall.

- **Line A**: total billable service hours per week
- **Line B**: active distinct clients per week
- **3-week moving average overlay** on each line (subtle dashed)
- Tooltip shows: week, hours, clients, hours/client

Above the chart, one focused number:

```
HOURS PER ACTIVE CLIENT
  14.2 hrs ↑ +1.8 vs prior period
```

This is the staffing efficiency metric — the single number Yosif uses to judge health (his Kate Saul vs Shana Roberts example).

Controls inline with the chart header:
- **Code chips**: All · 97153 (Direct) · 97155 (Supervision) · 97151 (Assessment) · 97156 (Parent)
- **Window chips**: 4w · 12w · 26w · YTD (default 12w)

### 3. Quick stats row (4 small tiles)
- Hours this week
- Active clients this week
- Hours / client (with delta)
- Supervision ratio (97155 hrs ÷ 97153 hrs) — directly answers his "is the BCBA actually maximizing?" question

### 4. BCBA Supervision Leaderboard (small, calm)

The Kate Saul / Shana Roberts comparison made visual. Top + bottom 5 BCBAs ranked by **supervision hours per direct hour** in the period. No client names anywhere.

### 5. Attention Required
Generated from data, not seeded:
- `$X in sessions unbilled > 7 days`
- `N patients without an assigned BCBA` (using existing label parser)
- `N BCBAs above 35 billable hrs/wk`
- `Cancellation/admin-time spike vs prior week`

### 6. My Priorities
Top 5 action items routed to the director (existing pattern, real data when available).

## What gets removed from the current screen

- Big Health Ring as the hero → demoted to a small chip in the header
- Generic "Operational Pulse" mock chart → replaced by the real Hours vs Clients chart
- Team & Staffing tile grid → folded into the supervision leaderboard
- Mock briefing paragraph → real one generated from this week's data

## What stays mock (call out, don't fake)

- Leads / intake / recruiting / orientation tiles — not in this export. We mark them "Awaiting data source" rather than show fake numbers.

## Files we touch

- **Migration**: add columns to `bcba_billable_sessions`
- **Edge function**: `supabase/functions/import-bcba-sessions/index.ts` — map new columns
- **New**: `src/lib/phi/redact.ts` — single redaction helper
- **New**: `src/lib/analytics/stateOps.ts` — pure aggregation functions (hours/clients series, supervision ratios, attention generators)
- **New**: `src/hooks/useStateOps.ts` — fetches sessions for a state + window, memoizes aggregations
- **Rewrite**: `src/pages/os/OSStateDirector.tsx` — new layout per above
- **New**: `src/components/state-director/HoursVsClientsChart.tsx` — the hero chart
- **New**: `src/components/state-director/SupervisionLeaderboard.tsx`

## After the migration

User uploads the TXT once through the existing import flow (or we trigger the edge function with the file we already have at `/tmp/sessions.csv`). Dashboard then renders against real numbers for NC and every other state with data.

## Out of scope (this pass)

- Leads data source
- Auth / scheduling joins
- OT / ST service lines
- Writeback to billing system
- Dazos / PowerBI integration decisions (that's Corey + Chad's call)
