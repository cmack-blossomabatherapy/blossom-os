## Goal

Replace the AI report flow at `/reports/ai/*` with a new **Create AI Dashboard** experience. Output is always an **interactive dashboard** (KPI cards + charts + risk tables + drilldowns + executive insights), never a text report. Keep deterministic ABA math (97153/97155/97156, auth utilization, cancellations, parent training) and use AI only to (1) pick dashboard type, (2) map columns, (3) generate executive insights / recommended actions.

## Routes & entry points

- New routes (replace old):
  - `/dashboards/ai/new` → `AiDashboardNew.tsx`
  - `/dashboards/ai/:id` → `AiDashboardView.tsx`
- Keep old `/reports/ai/*` routes mounted as redirects to `/dashboards/ai/*` so existing links don't 404.
- `ReportsHome.tsx`: rename the primary card to **"Create AI Dashboard"** with subtitle *"Upload your data. Ask a question. Instantly build an interactive dashboard."* Replace the "AI Reports" list section with **"AI Dashboards"** (same storage, relabeled).

## New file structure

**New library (`src/lib/os/dashboardEngine/`):**
- `types.ts` — `DashboardSpec`, `KpiSpec`, `ChartSpec`, `RiskTableSpec`, `DrilldownSpec`, `DashboardType`, `DataSource`.
- `excelParser.ts` — wraps `xlsx` (already installed) + existing CSV parser to handle `.csv`, `.xlsx`, `.xls`, and multi-sheet workbooks. Returns `ParsedFile[]`.
- `multiFileMerge.ts` — when multiple files are uploaded, infer relationships (shared client id / client name) and produce a unified row set per logical entity (sessions, auths, cancellations, etc.).
- `intentClassifier.ts` — local heuristic + AI fallback: from prompt + detected columns, picks `DashboardType` (Operations | Supervision | Authorization | Parent Training | Cancellation | Scheduling | Recruiting | Billing | Payroll | Leadership | State | BCBA | RBT | Custom).
- `dashboardBuilder.ts` — given `DashboardType` + parsed data + mapping, deterministically produces a full `DashboardSpec` (KPIs, charts, risk tables, drilldown row sets). Reuses existing `reportEngine/calculations.ts` for ABA math.
- `chartPicker.ts` — picks chart type (bar/line/pie/stacked/heatmap/trend) based on dimensionality of each section.
- `dashboardStore.ts` — replaces `aiReports.ts` storage with `blossom.os.aiDashboards.v1` (migration that re-keys existing AI reports as dashboards so history isn't lost).

**New pages:**
- `src/pages/os/dashboards/AiDashboardNew.tsx` — 2-step flow:
  1. Drag-drop **CSV/XLSX** (multi-file). Per-file chip: rows, sheets, date range, detected entity type (sessions / auths / cancellations / billing / etc.).
  2. Single prompt box: *"What would you like to understand from your data?"* with suggested chips ("Show supervision %", "Build leadership dashboard", "Find auth risks"). One CTA: **Build Dashboard**. No "report type" picker.
- `src/pages/os/dashboards/AiDashboardView.tsx` — renders `DashboardSpec`:
  - **Top:** KPI cards (large numbers, sparklines, delta)
  - **Second:** primary + secondary charts (recharts, already installed)
  - **Third:** risk tables (low supervision, expiring auths, missing PT, top cancellation reasons)
  - **Fourth:** drilldown tables (sortable, filterable, searchable)
  - **Bottom:** executive insights + recommended actions (AI narrative)
  - Right rail: filter chips (state, date range, BCBA, payor) — apply across all widgets.
- `src/components/dashboards/` — `KpiTile.tsx`, `ChartCard.tsx`, `RiskTable.tsx`, `DrilldownDrawer.tsx`, `InsightStrip.tsx`, `FilterRail.tsx`.

## Drilldown model

Every KPI tile carries a `drilldown: { title, columns, rows, filters? }`. Click → opens right-side `DrilldownDrawer` (sheet) with sortable table, search, and export. Examples:

| KPI | Drilldown columns |
|---|---|
| Parent Training Missing | Client, BCBA, State, 97156 hrs, Last PT date, Auth status |
| Authorization Risks | Client, Auth #, Utilization %, Remaining hrs, Expiration, BCBA |
| Cancellations | Client, Provider, Date, Reason, Type, State |
| Low Supervision | Client, 97153 hrs, 97155 hrs, Supervision %, BCBA, State |

Drilldowns are built deterministically inside `dashboardBuilder.ts` so click → row set is instant (no AI round-trip).

## ABA auto-intelligence (always run when CPT codes present)

When `procedure_code` includes 97153/97155/97156, auto-compute regardless of prompt:
- Supervision % = 97155 ÷ 97153
- Parent training presence = any 97156 per client
- Auth utilization = worked ÷ authorized
- Flags: low/over utilization, expiring auths (≤30d), missing supervision, missing PT
- These power both KPI tiles and the executive insight strip.

## AI usage (narrow, never invents numbers)

Edge function `generate-ai-dashboard` (rename/replace `generate-ai-report`):
- Input: `{ prompt, detectedColumns, dataSummary, computedKpis, candidateDashboardTypes }`
- Output (tool schema):
```json
{
  "dashboardType": "supervision",
  "title": "Supervision Dashboard — March 2026",
  "executiveInsights": ["string"],
  "recommendedActions": ["string"],
  "kpiPriority": ["supervision_pct", "missing_pt", "auth_risk"],
  "chartHints": { "supervision_by_bcba": "bar", "trend": "line" }
}
```
- AI never returns numbers. Numbers come from `dashboardBuilder.ts`.

## Export & history

- Dashboard view toolbar: **Save · Duplicate · Share · Export PDF · Export Excel · Export CSV**.
  - PDF: `window.print()` with print stylesheet (no new dep).
  - Excel: `xlsx` (already installed) — one sheet per drilldown table.
  - CSV: per-table.
- History card on `ReportsHome` retitled **AI Dashboards**: name, created, creator, source files, dashboard type, last viewed.

## Files to delete / replace

- Delete: `src/pages/os/reports/AiReportNew.tsx`, `src/pages/os/reports/AiReportView.tsx` (replaced by dashboard equivalents; redirects added).
- Keep & reuse: `src/lib/os/reportEngine/*` (the deterministic ABA math is still the math layer under the new builder).
- Replace: `src/lib/os/aiReports.ts` → thin shim that re-exports from new `dashboardStore.ts` for any lingering imports during migration; remove after sweep.
- Edge function: rename folder `supabase/functions/generate-ai-report` → `generate-ai-dashboard` with new tool schema (numbers stripped, narrative + type-picker only).

## Design (Blossom OS)

- Apple-clean, soft purple accents, rounded-2xl cards, hairline borders, generous whitespace.
- KPI tile: large tabular-nums value, tiny sparkline, delta chip, click affordance (`ArrowUpRight`).
- Charts: recharts with muted palette derived from semantic tokens; one accent only.
- One primary CTA per view ("Build Dashboard" on new; "Export" on view).
- No marketing tropes, no walls of text.

## Out of scope (this pass)

- Scheduled dashboard delivery (UI placeholder only, disabled).
- Dashboard templates library (save-as-template stub; full library later).
- Real-time collab / sharing permissions (share = copy link only).

## Risks

- Multi-file relationship inference: start with simple join on `client_name` normalization; flag unmatched rows in a Data Quality strip.
- Large XLSX (>10MB) parsed client-side: warn user, cap rendered drilldown rows to 500 (full data kept for math/export).
- AI dashboard-type misclassification: always show a "Change dashboard type" dropdown in the view header so the user can swap presets without rebuilding.
