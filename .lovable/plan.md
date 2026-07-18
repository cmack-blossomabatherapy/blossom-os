# BCBA Experience — Architecture & Implementation Plan

CentralReach remains system of record. Blossom OS organizes, prioritizes, monitors, routes, and supports work around it. Nothing below duplicates session notes, program books, treatment goals, graphs, claims, or full charts.

---

## A. Existing Architecture Assessment

**Stack.** React 18 + Vite + TS, Tailwind + shadcn, React Query, Supabase (Lovable Cloud). Semantic tokens in `index.css`; `OSShell` provides desktop chrome (left nav + top bar) with role-scoped menus in `src/lib/os/roleMenus.ts`. Mobile experiences use dedicated shells (`RbtAppShell` with 5-tab bottom nav).

**Auth & Roles.** Supabase Auth. Roles in `user_roles` + `employee_role_assignments`; `has_role()` security-definer function drives RLS. `hr_user_role_slugs` is now request-scoped memoized. State scoping via employee/client `state` fields.

**Employees / Clients.** `employees` (65 cols, links to profiles by email; synced from Viventium), `profiles`, `org_chart_nodes`, `clients` (60 cols), `client_authorizations`, `client_assessments`, `client_service_sessions`, `client_schedule_slots`, `client_compliance_flags`, `client_qa_reviews`, `client_reauth_cycles`, `client_documents`, `client_timeline`.

**RBT lifecycle already built.** `rbt_lifecycle_stages/state/events/rules/gate_completions`, `advance_rbt_lifecycle()` RPC, admin console `/admin/rbt-lifecycle`, mobile app at `/rbt/app/*`, preboarding, readiness/staffing, pathways, first case, first-90, growth, support, notifications, sync center. **A parallel BCBA lifecycle engine is already scaffolded** (`bcba_lifecycle_stages/state/events/rules/gate_completions`, `advance_bcba_lifecycle` RPC, 18 stages seeded, `/admin/bcba-lifecycle` console).

**Existing BCBA-adjacent tables.** `bcba_action_tasks`, `bcba_assignment_history`, `bcba_billable_sessions/imports`, `bcba_client_notes`, `bcba_supervision_logs`, `bcba_parent_training_logs`, `bcba_treatment_plan_items`, `bcba_workflow_activity_events`, `bcba_productivity_*`, `bcba_centralreach_outbox`, `qa_note_monitoring`, `qa_work_item_overrides`, `authorization_*`, `clinical_work_items`, `clinical_activity_log`, `clinical_saved_views`.

**Reusable systems (do NOT duplicate).**
- Training: `academy_*`, `training_*`, `TrainingAcademyHome`, role journey assignments.
- Support: `rbt_support_*` → generalize to unified `support_*` with audience/routing.
- Notifications: `user_notifications` + `rbt_notification_rules` + `emit_rbt_notification` → generalize.
- Imports: `cr_sync_*` templates + engine at `/admin/centralreach-sync`.
- Audit: `hr_audit_logs`, `academy_audit_log`, `*_events` tables, `role_audit_log`.
- Tasks: `user_tasks` (universal) + `TaskDetailDrawer` + `AssigneePicker`.
- Admin hub: `/admin/rbt` `DashboardShell` pattern.

## B. Gap Analysis

| Area | Present | Gap |
|---|---|---|
| BCBA lifecycle engine | Scaffolded | No employee-facing UI, no stage-aware home cards |
| Caseload command center | Partial tables | No unified case-health scoring, no BCBA home |
| BCBA↔RBT relationship | `bcba_assignment_history`, `rbt_client_assignments` | No canonical triad (BCBA/RBT/Client) view |
| RBT first-session BCBA follow-up | Table exists | Not surfaced to owning BCBA |
| Supervision cadence | Logs exist | No due-date engine, no risk scoring, no calendar |
| Assessment lifecycle | `client_assessments` | No pipeline (intake→admin→scoring→report→submitted) |
| Authorization deadline radar | Authorization tables | No BCBA-owned countdown board |
| Parent training compliance | Logs | No cadence/target tracking |
| QA correction workflow | `qa_note_monitoring` | Not routed to BCBA action queue |
| Productivity/capacity | Billable imports | No BCBA-facing scorecard with explanation |
| Support | RBT-only | Needs BCBA categories + routing |
| Notifications | RBT rules | Needs BCBA rule set |
| Mobile | RBT shell | Needs `BcbaAppShell` (5 tabs) |
| Admin | RBT hub | Needs `/admin/bcba` hub |

## C. BCBA Information Architecture

Desktop primary nav (7): **Home · Caseload · My RBTs · Clinical Work · Learn · Support · Me**.
Mobile primary nav (5): **Home · Caseload · RBTs · Work · Me**.

- **Home** — lifecycle-aware cards: today's schedule, RBT first sessions this week, supervision due, auth deadlines <30d, QA corrections, overdue reports, productivity pulse, unread support updates, credential alerts, CR freshness.
- **Caseload** — client tiles with case-health chip (Healthy / Watch / At-Risk / Critical), filters (auth ending, missing supervision, report due, QA open, low utilization), client drawer summarizes assignment, RBT pairings, auth, upcoming deadlines, QA items, links out to CR.
- **My RBTs** — assigned RBT list with pairing, supervision status, open follow-ups, competency snapshot, training status, and shared support items.
- **Clinical Work** — tabs: Assessments · Reports · Reassessments · QA Corrections · Parent Training · Authorizations. Kanban-style pipelines fed by `clinical_work_items`.
- **Learn** — reuses Academy filtered to BCBA pathway.
- **Support** — reuses unified support center scoped to BCBA categories.
- **Me** — profile, credentials, availability, growth, notification prefs.

## D. Page & Route Map

```
/bcba                         → redirect to /bcba/home
/bcba/home
/bcba/caseload                 (list) ?clientId=… opens drawer
/bcba/caseload/:clientId       (deep page, mirrors drawer)
/bcba/rbts                     ?rbtId=… drawer
/bcba/rbts/:rbtId
/bcba/clinical                 (tab hub)
/bcba/clinical/assessments
/bcba/clinical/reports
/bcba/clinical/reassessments
/bcba/clinical/qa
/bcba/clinical/parent-training
/bcba/clinical/authorizations
/bcba/learn                    → /training/academy?audience=bcba
/bcba/support                  → /support?audience=bcba
/bcba/me
/bcba/app/*                    (mobile shell, BcbaAppShell)

/admin/bcba                     hub
/admin/bcba/lifecycle           (exists)
/admin/bcba/caseload-rules
/admin/bcba/supervision-rules
/admin/bcba/assessment-config
/admin/bcba/authorization-rules
/admin/bcba/qa-routing
/admin/bcba/productivity-config
/admin/bcba/notifications
/admin/bcba/workforce
```

## E. Proposed Database Changes

All new `public.*` tables receive the mandatory GRANT block, `updated_at` trigger, RLS, and `has_role()`-based policies. State/clinic scoping via `state text` + `clinic_id uuid`.

New tables:
- `bcba_caseload_assignments` — bcba_id, client_id, role (primary/secondary), started_at, ended_at, status, source (cr|manual).
- `bcba_rbt_pairings` — bcba_id, rbt_id, client_id, started_at, status, first_session_plan_id.
- `bcba_case_health_snapshots` — client_id, bcba_id, score, band, factors jsonb, calculated_at.
- `bcba_supervision_schedule` — client_id, rbt_id, bcba_id, cadence_days, next_due_at, last_completed_at, status.
- `bcba_assessment_workitems` — client_id, bcba_id, type, stage, due_at, blockers jsonb.
- `bcba_report_workitems` — client_id, bcba_id, kind (progress|reassessment), due_at, submitted_at, status.
- `bcba_parent_training_targets` — client_id, bcba_id, cadence_days, next_due_at, target_minutes_month.
- `bcba_productivity_targets` — bcba_id, period, target_billable_hours, target_supervision_pct.
- `bcba_capacity_profile` — bcba_id, weekly_hours_available, max_clients, notes.
- `bcba_notification_rules` — mirror `rbt_notification_rules` shape.
- Unified: rename/alias RBT support to `support_*` via views, add `support_audience` enum (`rbt`|`bcba`) on tickets, categories, routing rules (backward compatible; existing RBT rows default to `rbt`).

Extend:
- `client_authorizations` → add `bcba_owner_id`, `deadline_stage`, `days_remaining` (generated).
- `clinical_work_items` → add `bcba_owner_id`, `case_health_impact`.
- `qa_note_monitoring` → add `routed_to_bcba_id`, `sla_due_at`.
- `rbt_first_session_bcba_followups` — ensure BCBA-owner index & Home surfacing.

RPCs:
- `compute_bcba_case_health(client_id)` — weights configurable in `bcba_caseload_rules`.
- `advance_bcba_lifecycle` (exists) — extend gates for onboarding/systems_setup/initial_caseload_setup.
- `bcba_supervision_recalc(rbt_id, client_id)` — recomputes next_due_at.
- `emit_bcba_notification` — thin wrapper reusing shared engine.

## F. BCBA Lifecycle Model

Reuses the 18 seeded stages. Gates per stage (all admin-editable):
- offer_accepted → preboarding: I-9, offer signed.
- preboarding → credentialing: background check.
- credentialing → onboarding: BCBA cert on file, insurance panels required per state.
- onboarding → systems_setup: CR access, Blossom login, calendar linked.
- systems_setup → initial_caseload_setup: first client assigned in `bcba_caseload_assignments`.
- initial_caseload_setup → first_30_days: first assessment or first supervision logged.
- first_30_days → first_90_days: automatic after 30d + no red flags.
- first_90_days → active_bcba: checkpoint survey complete + leadership confirm.
- active → established → senior_candidate → lead → clinical_director_candidate / fellowship_supervisor: eligibility engine mirroring RBT growth.
- leave / inactive / offboarding / separated: manual w/ audit.

Every transition writes `bcba_lifecycle_events` + `hr_audit_logs`.

## G. BCBA-to-RBT Relationship Model

Canonical triad: **(bcba_id, rbt_id, client_id)** in `bcba_rbt_pairings`. All BCBA↔RBT views derive from this join across `rbt_client_assignments`, `bcba_caseload_assignments`, `rbt_first_case`, `rbt_supervision`, `rbt_help_requests`, `rbt_session_support_logs`. RBT app's "My BCBA" and BCBA app's "My RBTs" both read from this table so records stay symmetric.

## H. Caseload & Case-Health Model

`compute_bcba_case_health` produces a 0–100 score with bands. Weighted factors (defaults, admin-tunable):
- Authorization runway (25%) — days to expiration vs. threshold.
- Supervision compliance (20%) — % supervision met last 30d.
- Documentation status (15%) — open QA + missing notes.
- Utilization vs. authorized (15%).
- Cancellation rate (10%).
- Report/reassessment on-time (10%).
- Open support/escalations (5%).
Snapshots stored daily; drawer explains each factor.

## I. Supervision Model

`bcba_supervision_schedule` per (client, rbt) with cadence, next_due, last_completed. Recompute on new `bcba_supervision_logs` insert (trigger). Surfaces: BCBA Home "Supervision Due" card, Caseload chip, RBT tile, notifications at T-3/T-0/overdue. Never stores clinical content — only status metadata.

## J. Assessment & Clinical-Work Model

`bcba_assessment_workitems` and `bcba_report_workitems` are workflow trackers only (stage, blockers, due dates, links to CR). Stages: Intake → Scheduled → Administered → Scoring → Draft → Internal Review → Submitted. QA corrections flow through `qa_note_monitoring` with SLA → BCBA action queue. No treatment content stored.

## K. Authorization & Deadline Model

Extend `client_authorizations` with `bcba_owner_id` and deadline bands (Green >45d, Amber 15–45, Red <15, Critical <7). Reassessment radar joins auth end with report due to alert BCBA to start reassessment window. Rules configurable in `/admin/bcba/authorization-rules`.

## L. Permission Model

Roles: `bcba`, `senior_bcba`, `lead_bcba`, `clinical_director`, `state_director`, `operations_leadership`, `super_admin`.

- BCBA: SELECT rows where `bcba_owner_id = auth.uid()` OR present in `bcba_caseload_assignments`/`bcba_rbt_pairings`. Write only own workitems, supervision logs, notes, followups.
- Lead/Senior BCBA: read team's caseloads within clinic.
- Clinical Director: read state-wide clinical summaries.
- State Director: state-scoped.
- Ops Leadership / Super Admin: full within audit.

All policies via `has_role()`; every table follows the four-step CREATE→GRANT→ENABLE RLS→POLICY structure.

## M. PHI Minimization

- Store status/metadata/pointers, never clinical narrative.
- Client display uses `first_name + last_initial` for non-owners.
- Assessment/report tables carry stage + link, not content.
- Audit reads of PHI-adjacent tables via `hr_audit_logs`.
- Retention: snapshots pruned after 400d; audit kept 7y; support/notifications 2y (configurable).
- No PHI in notifications, deep links use IDs.

## N. CentralReach Export Dependency Map

Reuses `/admin/centralreach-sync` templates:
- Employee/Contact export → BCBA credentialing, capacity.
- Client Assignment export → `bcba_caseload_assignments`, `bcba_rbt_pairings`.
- Schedule/Appointment export → supervision opportunity detection, cancellation oversight.
- Timesheet/Billing export → productivity, utilization.
- Authorization export → deadline radar.
Freshness surfaced everywhere via `cr_freshness_config` badges.

## O. Administrative Role Matrix

`/admin/bcba` tiles: Lifecycle · Caseload Rules · Supervision Rules · Assessment Config · Authorization Rules · QA Routing · Productivity Config · Notifications · Workforce · Test Cohort. Access limited to Clinical Director, Ops Leadership, Super Admin (configurable list mirroring `ADMIN_HUB_ROLES`).

## P. Mobile & Desktop Plan

- Desktop uses `OSShell` with BCBA role menu (7 items).
- Mobile: new `BcbaAppShell` mirroring `RbtAppShell`, 5 tabs, dashboard-card framework (`bcba_dashboard_cards`) driven by lifecycle stage.
- Auto-landing: BCBA-only users route to `/bcba/app/home`; multi-role users use OSShell.

## Q. Implementation Phases

1. **Foundations** — extend lifecycle gates, permission helpers, generalize support/notifications to `audience`, add `bcba_dashboard_cards`.
2. **Caseload core** — `bcba_caseload_assignments`, `bcba_rbt_pairings`, case-health RPC + snapshots, Caseload page + drawer.
3. **Supervision + RBT bridge** — schedule table, triggers, My RBTs page, RBT-first-session BCBA follow-up surfacing.
4. **Clinical Work** — assessment/report workitems, QA routing, parent training targets, authorization deadline radar.
5. **Home + Mobile shell** — BCBA Home cards, `BcbaAppShell`, dashboard-card engine.
6. **Productivity + Capacity + Growth** — targets, scorecard, growth mirror of RBT growth engine.
7. **Admin hub** — `/admin/bcba/*` configuration pages, test cohort.
8. **Notifications + Audit hardening** — BCBA rule set, deep links, audit coverage review.
9. **Polish + rollout** — empty states, CR freshness, permission QA, PHI review.

## R. Testing Strategy

- Unit: case-health scoring, supervision recompute, lifecycle gate evaluation, permission helpers.
- Integration: RLS matrix per role × table; CR import → caseload/pairing sync idempotency.
- E2E (Playwright via shell): BCBA home load, caseload drawer, supervision log flow, QA correction routing, deep links, mobile shell.
- Data: seed synthetic BCBA cohort per lifecycle stage (like `rbt_synthetic_test_profiles`).
- Security: `supabase--linter` after each migration; PHI-in-notifications audit.

## S. Risks, Assumptions, Unresolved Questions

**Risks.** CR export cadence gaps causing stale case-health; permission leakage via shared BCBA/RBT views; scope creep into clinical content; performance of daily case-health snapshots at scale.

**Assumptions.** Existing `bcba_lifecycle_*` scaffolding is the canonical engine; support/notification generalization is acceptable (backward compatible via `audience` default `rbt`); CR imports remain the sole source for schedule/billing/auth truth.

**Open questions for review.**
1. Should case-health weights be global, per-state, or per-clinic?
2. Which roles beyond Clinical Director may edit supervision cadence rules?
3. Should Blossom auto-create reassessment workitems from auth end dates, or require BCBA confirm?
4. What is the retention period for case-health snapshots?
5. Any regulated states that forbid storing pairing metadata outside CR?

Awaiting review before implementation begins.
