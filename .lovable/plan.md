Sprint 02 is large. I'll execute it in 9 phases (A-I) matching the brief, one phase per turn so we can verify each. Reply "phase a go" to start, or "all phases" to run them sequentially.

## Phase A — State Director / Assistant SD training routing
- Add `isStateDirectorTrainingRole` helper in `src/lib/os/roleMenus.ts`
- Override Training Academy entry to `/training` for both SD + ASD (custom training section)
- `OSShell.tsx` mobile bottom nav: route Training → `/training` for both roles
- `OSTraining.tsx`: replace `isSD` with role-set check; ASD uses SD journey data
- Tests: extend `roleMenuLiveRoutes` + add ASD training journey test

## Phase B — Remove page-level `/coming-soon` & "Coming Soon" copy
- Repo-wide audit; remove from: BusinessDevelopmentDashboard, IntakeDashboard, ReferralQueue, LeadToActivePipeline, IntakeTasks, OperationsPages, PeoplePages, ReportsLanding, GrowthPageShell usage
- Replace with `needs_data` / `ready` / `setup_needed` + acceptable copy
- Keep `/coming-soon` route only as bookmark redirect
- Test: assert no `/coming-soon` or "Coming Soon" in listed page files

## Phase C — Intake pages live with real lead data
- `IntakeDashboard`: KPIs + cards from `useLeads()`, real action wiring
- `ReferralQueue`: filtered live list w/ row actions
- `LeadToActivePipeline`: stage-grouped board
- `MissingInformation`, `ParentCommunication`, `IntakeTasks`, `BenefitsCheatSheets`: real data or ready-for-data state w/ correct routes

## Phase D — Add Lead round-trip
- Extend `intake_leads.select(...)` in `LeadsContext` to include all new columns
- Extend `IntakeLeadRow` + `intakeLeadRowToLead` to surface them (via `sourceMetadata`/`originalColumnData` extension on Lead)
- `LeadDetailDrawer` + `LeadDetailPanel`: add Source & Attribution / Parent & Guardian / Insurance & Intake sections
- Test: select list + mapper round-trip

## Phase E — Patient Lifetime Journey live
- `PatientLifetimeJourney.tsx`: drive timeline from `useLeads()` + `intake_communications`
- Filters (state/source/stage/owner/date/priority), actions, empty state copy

## Phase F — Business Development Dashboard
- Replace `/coming-soon` links with real tabbed routes (`/business-development?tab=...`)
- Add minimal tabbed `BusinessDevelopment` page (Overview/Partners/Outreach/Tasks/Providers/Community)
- Remove `coming_soon` status usage

## Phase G — Reports catalog + landing
- `phase3Reports.ts`: drop `coming_soon`; `reportRoute` returns `/reports?report=<id>` fallback
- `ReportsLanding.tsx`: setup-needed detail card w/ Connect/Upload/Request/Star actions, remove Coming Soon copy
- BCBA Productivity Report V3 stays live for all roles
- Test: `reportRoute` never returns `/coming-soon`

## Phase H — Block old workspace shell leakage
- `App.tsx`: replace `<Route path="/ws/:id" element={<WorkspacePage/>}/>` with `<Navigate to="/dashboard" replace/>`
- `OSShell.tsx`: remove visible "Old Version" buttons
- Clean stray old-shell links in `workspaces.ts` / `workspaceContent.ts`
- Test: `/ws/:id` does not render WorkspacePage

## Phase I — Regression tests
- Consolidate new assertions into `src/test/sprint02Regression.test.ts` covering all bullets in the brief

## Validation each phase
- Build via harness
- `bunx vitest run` for affected test files
