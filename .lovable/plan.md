# Phase 4 — Blossom OS Intelligence Layer

Transform the Command Center into an executive intelligence and analytics platform. **All Phase 1/2/3 work, routes, auth, HR Training Admin, Resource Hub, Operations Academy, integrations, automations, and Supabase wiring stay intact.** No destructive migrations.

## Scope (Phase 4)

In: New `/intelligence/*` section with executive dashboards, workforce/training/compliance/onboarding analytics, state & department deep-dives, KPI scorecards, predictive risk widgets, custom report builder. Mock data with shapes ready for Phase 5 live wiring.

Out: Real BI engine, ML risk models, live Supabase metric materialization, PDF generation backends.

## New Top-Level Section: "Intelligence" Sidebar Group

Add a new sidebar group between **Operations** and **Operate**:

```
INTELLIGENCE
  Executive Command Center  /intelligence
  Workforce Intelligence    /intelligence/workforce
  Training Intelligence     /intelligence/training
  Compliance Intelligence   /intelligence/compliance
  Onboarding Intelligence   /intelligence/onboarding
  Department Analytics      /intelligence/departments
  State Dashboards          /intelligence/states
  KPI Scorecards            /intelligence/scorecards
  Risk & Insights           /intelligence/risk
  Report Builder            /intelligence/reports
```

## Pages to Create

### 1. Executive Command Center (`/intelligence`)
- Hero: org name + Operational Health Score (0–100 ring) + Workforce Readiness Score + last-updated timestamp.
- 12 polished KPI cards with trend arrows, sparklines, comparison vs previous period: Active Employees, In Training, Compliance %, Overdue Trainings, New Hires, Completion Rate, Dept Readiness, Avg Onboarding Time, Open Tasks, Competencies Earned, Certs Expiring, Automation Success.
- "Active Alerts" feed (e.g., "Georgia compliance dropped 6%", "12 overdue onboardings").
- Operational bottlenecks panel.
- State comparison strip (5 states with mini-bars).
- Integration health + Automation health mini-cards.

### 2. Workforce Intelligence (`/intelligence/workforce`)
- Department readiness heatmap (departments × competency areas).
- Employee readiness score distribution chart.
- Skill gap & competency gap bars per department.
- Engagement score table (low/medium/high).
- Workforce distribution by state and location (donut + bars).
- Filter bar: department, state, role, manager.

### 3. Training Intelligence (`/intelligence/training`)
- Training funnel (Assigned → Started → 50% → Completed → Quiz Passed).
- Completion rate trend line.
- Top engaged courses + top dropoff courses.
- Difficulty matrix (avg time vs quiz pass rate).
- High vs low performers split.

### 4. Compliance Intelligence (`/intelligence/compliance`)
- Org compliance gauge + state compliance bars.
- Expiring certifications timeline (next 30/60/90 days).
- Missing requirements grouped by employee.
- At-risk employees panel.
- Compliance trend (last 6 months).
- Audit-readiness checklist + Export CSV/PDF buttons.

### 5. Onboarding Intelligence (`/intelligence/onboarding`)
- Onboarding flow visualization: Hired → Enrolled → In Progress → Completed → Verified → Operational (horizontal stages with counts).
- Avg time to completion KPI.
- Stuck onboarding callouts.
- Department onboarding leaderboard.
- New-hire grid with progress rings.

### 6. Department Analytics (`/intelligence/departments`) + detail
- Card grid for all 16 departments with mini-readiness ring, completion %, open tasks, alerts count.
- Detail `/intelligence/departments/:id`: completion %, competency breakdown, compliance score, readiness ring, open tasks, alerts, training engagement, activity feed.

### 7. State & Location Dashboards (`/intelligence/states`) + detail
- 5 state cards (GA, NC, TN, VA, MD) + 2 clinic cards (Peachtree, Riverdale) with employee count, onboarding %, compliance %, training %, alerts.
- Detail `/intelligence/states/:id`: full state breakdown, departments active in state, expiring certs in state.

### 8. KPI Scorecards (`/intelligence/scorecards`) — EOS / Bloom Growth style
- Tabs: Weekly / Monthly / Department / Leadership.
- Scorecard rows: KPI name, owner, target, current, trend, status (red/yellow/green).
- Examples per spec (weekly hires onboarded, compliance %, onboarding speed, training %, task %, QA training, leadership accountability).

### 9. Risk & Insights (`/intelligence/risk`)
- Smart-insight cards: Users likely to fall behind, Departments with declining completion, Compliance risk alerts, Low-engagement users, Overdue onboarding risk, High-workload managers, Training bottlenecks.
- Each card: title, severity pill, description, affected count, action button.

### 10. Report Builder (`/intelligence/reports`)
- Left rail: pick metrics (multi-select chips).
- Top filters: date range, state, department, role.
- Right preview: live mock chart/table preview.
- Save Template / Export CSV / Export PDF / Email Report buttons.
- Report templates list: Onboarding, Compliance, Department Training, Competency, Certification, Operational Readiness.

## Shared Intelligence Components

New under `src/components/intelligence/`:
- `KpiCard` — value, trend arrow, sparkline (SVG), comparison delta, click handler
- `ScoreRing` — animated SVG progress ring (used for readiness/health scores)
- `Heatmap` — CSS-grid heatmap with intensity tones
- `TrendLine` — lightweight SVG line chart (no external deps)
- `Sparkline` — inline mini line/bar
- `FunnelChart` — vertical funnel with conversion %
- `AlertFeedItem` — alert row with severity pill
- `ScorecardRow` — KPI scorecard table row with traffic-light status
- `InsightCard` — predictive insight card
- `FilterBar` — shared filter chips (dept/state/role/date)

All components use semantic tokens, are pure CSS/SVG (no chart library install), and follow the existing GlassPageShell + Card patterns.

## Data Layer

New file `src/data/blossomIntelligence.ts` exports typed mocks:
- `executiveKpis`, `operationalHealthScore`, `workforceReadinessScore`
- `departmentReadiness[]`, `competencyGaps[]`, `engagementScores[]`
- `trainingFunnel`, `completionTrend`, `coursePerformance[]`
- `complianceByState[]`, `expiringCertifications[]`, `complianceTrend`, `atRiskEmployees[]`
- `onboardingStages`, `onboardingByDept[]`, `newHireProgress[]`
- `stateMetrics[]`, `clinicMetrics[]`
- `weeklyScorecard[]`, `monthlyScorecard[]`, `departmentScorecard[]`, `leadershipScorecard[]`
- `riskInsights[]`, `executiveAlerts[]`
- `reportTemplates[]`

Shapes mirror eventual Supabase tables (analytics, kpi_snapshots, readiness_scores, risk_alerts, reporting_templates, department_metrics, state_metrics) so Phase 5 wiring is mechanical.

## Filtering Architecture

Shared `IntelligenceFilters` context (department, state, role, manager, date range) at the section level. Each page subscribes and reflects filter state in URL params.

## Sidebar Update

Insert "Intelligence" group in `AppSidebar.tsx`. Icons from lucide already in scope: `BarChart3`, `Activity`, `GraduationCap`, `ShieldCheck`, `Compass`, `Building2`, `MapPin`, `Trophy`, `AlertTriangle`, `FileBarChart`.

## What This Doesn't Touch

- Existing `/dashboard`, `/leadership-dashboard`, `/reports`, role-specific dashboards — preserved as-is.
- HR Training Admin, Academy Editor — preserved.
- Phase 3 Operations pages — preserved.
- Supabase schema — no migrations in Phase 4.
- CRM modules — preserved.

## Role-Based Access

- Intelligence section visible to all authenticated users.
- Admin-only controls: Report Builder save/email/template management, scorecard editing.
- Non-admins see read-only view.
- Backend enforcement deferred (UI-level gating via `useAuth().isAdmin`).

## Acceptance

- New "Intelligence" sidebar group renders.
- All 10 pages render with rich mock data, polished components, smooth filtering.
- No external chart libs installed (SVG/CSS only) to keep bundle lean.
- TypeScript builds cleanly.
- No existing route or page regresses.

## Files (Estimate)

**New** (~20): `src/data/blossomIntelligence.ts`, ~10 pages under `src/pages/intelligence/`, ~9 components under `src/components/intelligence/`.

**Edited** (~2): `src/App.tsx` (routes), `src/components/layout/AppSidebar.tsx` (group).
