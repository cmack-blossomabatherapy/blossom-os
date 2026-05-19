# Reports Operating System — Redesign Plan

Transform `/os/reports` from a tabbed KPI dump into an Apple-style, AI-native **Reports Operating System**: a home page where users browse, favorite, upload, request, and open rich dashboards — filtered by role.

This is a large redesign. To ship value fast and avoid a 30-file mega-PR, I'll deliver in 3 phases. **Phase 1 is the meaningful milestone** (you'll see the new experience). Phases 2–3 deepen it.

---

## Phase 1 — Reports Home + Detail Shell + Request Modal (this PR)

**New page structure (replaces current `Reports.tsx` content inside OS shell):**

```
ReportsHome (/os/reports)
├── Hero            ← title, AI ops summary, 4 CTAs (Upload, Saved View, Request, Ask AI)
├── AI Insights strip ← 3 pulse cards (auth risk ↑, parent training ↑, QA backlog)
├── Featured Dashboards ← 4 large cards w/ mini sparkline preview, KPI chips, owner, AI snippet
├── Category Grid   ← 10 category cards (Operations, QA, Auth, Scheduling, Recruiting,
│                     Financial, Clinical, Training, Leadership, State Analytics)
├── Saved Views + Recent + Favorites ← 3-column row
├── Upload Center card ← drag/drop zone (visual only Phase 1)
└── Request a New Report card ← opens modal
```

**Role-aware visibility:**
- New `src/lib/os/reportsCatalog.ts` defines all reports + categories with `visibleTo: OSRole[]`.
- `useOSRole()` filters featured + categories + dashboards client-side.
- Roles map per spec (QA → Supervision/PT 97156/QA Compliance; Auth → Utilization/Expiring/Denials; State Director → State Perf/Staffing/Recruiting/Auth Risk; BCBA → Caseload/Supervision/PT/Progress; Executive → Exec KPIs/Financials/Growth; Admin → all).

**Report Detail page** (`/os/reports/:reportId`):
- Reuses the existing `ExecutiveView/IntakeView/...` blocks but wrapped in a new shell with:
  hero header, filter bar, AI summary panel, KPI strip, charts (existing components), action center, related reports, save view / export buttons.
- Existing report content (`executiveKpis`, funnels, etc. from `src/data/reports.ts`) is preserved and rendered inside the new shell — no data loss.

**Request a Report modal:**
- All 10 fields from spec (title, dept, purpose, metrics, data sources multi-select, example upload, frequency, priority, viz pref, AI assist toggle).
- Multi-step wizard (3 steps: Context → Data → Delivery).
- Submission stored in localStorage (Phase 1) under `os.reportRequests`. Toast confirmation.

**New files:**
- `src/lib/os/reportsCatalog.ts` — categories + reports definitions + role filter helper.
- `src/pages/os/reports/ReportsHome.tsx`
- `src/pages/os/reports/ReportDetail.tsx`
- `src/components/os/reports/ReportsHero.tsx`
- `src/components/os/reports/AIInsightsStrip.tsx`
- `src/components/os/reports/FeaturedDashboardCard.tsx`
- `src/components/os/reports/CategoryCard.tsx`
- `src/components/os/reports/UploadCenterCard.tsx`
- `src/components/os/reports/RequestReportCard.tsx`
- `src/components/os/reports/RequestReportDialog.tsx`
- `src/components/os/reports/SavedViewsPanel.tsx`

**Routing:**
- `src/App.tsx` (or OS router): `/os/reports` → `ReportsHome`, `/os/reports/:reportId` → `ReportDetail`. Existing `/reports` (non-OS) untouched.

**Visual style:**
- Soft white surfaces, subtle purple/blue gradient washes, glass cards (`bg-card/70 backdrop-blur border border-border/60`), generous spacing, lift-on-hover, AI pulse dot animation, skeleton shimmer for "loading" dashboards.
- All colors via semantic tokens (no hardcoded hex in components).

---

## Phase 2 — Upload Center + Request Queue (next PR)

- Functional drag/drop in Upload Center, file preview, mock auto-detect ("Looks like a CentralReach Supervision export").
- Upload history list.
- `/os/reports/requests` — Super Admin queue (status pipeline, assign builder, comments).
- Status badges + filter chips.

## Phase 3 — Backend persistence + AI assist

- Lovable Cloud tables: `report_categories`, `reports`, `report_views`, `report_uploads`, `report_requests`, `report_request_comments`, `report_favorites` (RLS per spec).
- Replace localStorage with Supabase queries.
- Wire AI assist toggle to `google/gemini-2.5-flash` via Lovable AI gateway to suggest KPIs from uploaded sample.
- Notifications hooks.

---

## Technical notes

- `OSShell` already handles the right utility rail / role context — no changes there.
- Existing `src/data/reports.ts` mock data is reused for dashboard detail pages; no migration needed yet.
- `RequestReportDialog` uses `react-hook-form` + `zod` (already in deps) for validation.
- All new components are presentation-only in Phase 1 (no backend), keeping scope tight.
- File count Phase 1: ~11 new + 2 edited (`App.tsx` route, possibly `OSShell` if a nested route is needed).

Approve to start Phase 1?
