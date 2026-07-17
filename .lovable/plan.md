
# RBT Employee Experience — Architecture & Implementation Plan

Blossom OS = employee guidance, learning, support, growth, and operational command center. CentralReach remains clinical system of record. Data flows in via controlled exports/imports initially, not live API.

---

## A. Existing-System Architecture Assessment

- **Stack:** React 18 + Vite + TS + Tailwind + shadcn, React Router, TanStack Query, Supabase (Lovable Cloud).
- **Shell:** `AppLayout` + `AppSidebar` (desktop) + `MobileBottomNav` (5 slots: Home / Academy / Learning / Resources / Profile) + `TopBar` + `CommandPalette` + `NotificationBell`.
- **Auth / roles:** `AuthContext`, `useAuth`, `user_roles` (enum `app_role`), `has_role()` SECURITY DEFINER, `PermissionRoute`. `roleMenus.ts` already contains an `rbt` menu group and OSRole entry.
- **Existing RBT surface:** menu items route to `/rbt/my-day`, `/rbt/training-academy`, `/welcome`, `/rbt/resources`, `/rbt/schedule`, `/rbt/clients`, `/rbt/supervision`, `/rbt/help`, `/rbt/readiness`, `/rbt/messages` — many are stubs or unrouted in `App.tsx`.
- **RBT tables already in DB:** `rbt_client_assignments`, `rbt_sessions`, `rbt_supervision`, `rbt_help_requests`, `rbt_messages`, `rbt_session_support_logs`, `rbt_readiness_records`, `rbt_competency_records`, `rbt_resources`, `rbt_resource_prefs`.
- **Learning:** dual system — `academy_*` (phases/weeks/modules/lessons/progress) and `training_*` (courses/tracks/journeys/role assignments, `training_role_journey_assignments`). Role journeys already exist and are admin-editable in `TrainingManagementCenter`.
- **HR/Employee:** `employees`, `employee_hr_profiles`, `employee_onboarding` (+ tasks), `employee_role_assignments`, `employee_trainings`, `employee_documents_hr`, `evaluations`, `pto_requests`, `time_clock_punches`, `hours_timesheets`, `mileage_trips`.
- **Support/comms:** `escalation_threads`, `user_notifications` (with realtime + triggers), `hr_messages`, `hr_announcements`, `push_subscriptions`.
- **Scheduling source:** currently CentralReach-adjacent; `client_schedule_slots`, `scheduling_*`. No RBT-facing mobile schedule view yet.
- **Audit:** `hr_audit_logs`, `role_audit_log`, `academy_audit_log`, `onboarding_audit_log`, `system_tool_audit_logs`.
- **Mobile:** `useIsMobile`, `MobileBottomNav` exists but is generic (not role-scoped). Most OS pages assume desktop with sidebar.
- **Integrations:** CentralReach uploads unified at `/os/system/centralreach-uploads`; Viventium sync edge fn; Retell/CTM sync. No RBT-scoped import view.

## B. Gap Analysis

1. No lifecycle model — RBT status is scattered (`employees.status`, `employee_onboarding.stage`, `academy_enrollments`, ad-hoc booleans).
2. No RBT-scoped mobile shell — mobile bottom nav is generic, hits desktop pages that overflow.
3. `/rbt/*` routes referenced in menu but not registered in `App.tsx` (except `/welcome`, `/rbt/training-academy` maps).
4. No RLS scoping "RBT sees only own data" — most policies grant `authenticated` broadly. `rbt_client_assignments` policies exist but not enforced end-to-end on session/schedule reads.
5. No pathway concept (Fast Track / Developing / Certification) as a first-class entity; only role journeys.
6. No last-successful-sync surfacing on RBT-facing imported data screens.
7. No RBT-side "assigned clients" minimal view — existing client tables expose full PHI.
8. No fellowship-ready extensibility (career-track pathway with milestones + cohort).
9. Push notifications wired for tasks but not for schedule changes, supervision, or announcements to RBTs.
10. Admin has no single "RBT lifecycle" console; stage transitions are implicit.

## C. Proposed RBT Information Architecture (Mobile-First, 5 tabs)

```text
[ Home ]      Today card • Next shift • Outstanding actions • Announcements
              Lifecycle-aware "next step" module (e.g. finish Week 2, submit BACB app)

[ Schedule ]  Today / Week / Month • Shift details (client initials + service, NOT chart)
              Availability • PTO request • Mileage log entry • Sync-time banner

[ Learn ]     My Pathway (Fast Track / Developing / Certification / Fellowship)
              Assigned journey • Continue module • Certificates • Competencies
              Shadow sessions • Quizzes

[ Support ]   Ask for help (typed: schedule, client, supervision, HR, tech, urgent)
              Escalation threads • Messages/announcements • Supervisor contact
              SOP/Resource search (role-scoped)

[ Me ]        Profile • Credentials & expirations • Documents to sign • Pay/timesheet
              PTO • Mileage • Reviews • Career interests (fellowship opt-in)
              Notification prefs • Sign out
```

Content within each tab is filtered by lifecycle stage, pathway, permissions, assignments, and pending actions.

## D. Lifecycle State Model

New enum `rbt_lifecycle_stage` + row per employee in new `rbt_lifecycle_state`:

```text
offer_accepted → preboarding → training → certification_in_progress →
ready_for_staffing → first_case_pending → first_case_active → first_30_days →
active → established → advanced_candidate → lead → trainer_floater_lead →
fellowship_applicant → fellowship_participant → bcba_transition →
leave_inactive → offboarding
```

- Transitions are driven by rules (`rbt_lifecycle_rules`) that are admin-configurable, not hardcoded — e.g. "40h training complete AND BACB verified → ready_for_staffing".
- Every transition writes `rbt_lifecycle_events` (actor, from, to, reason, source: manual|rule|import).
- Home screen "what's next" reads the current stage + open required actions.

## E. Proposed Database Changes (net-new; no destructive edits)

All new public tables include GRANT + RLS + triggers.

1. `rbt_lifecycle_state (employee_id PK, stage, pathway_id, entered_at, updated_by)`.
2. `rbt_lifecycle_events (id, employee_id, from_stage, to_stage, reason, source, actor_id, occurred_at)`.
3. `rbt_pathways (id, key, name, description, is_active, created_by)` — seeded with fast_track / developing / certification / fellowship; admin CRUD.
4. `rbt_pathway_steps (id, pathway_id, order_index, key, title, required, kind: module|task|document|external, ref_id, gate_stage)`.
5. `rbt_pathway_progress (id, employee_id, pathway_step_id, status, completed_at, evidence_url)`.
6. `rbt_lifecycle_rules (id, from_stage, to_stage, predicate_json, is_active)` — admin-editable JSON DSL evaluated server-side.
7. `rbt_career_interests (employee_id, interested_in_lead, interested_in_fellowship, notes, updated_at)`.
8. `rbt_data_sync_status (source, last_success_at, last_attempt_at, status, message)` — surfaced on every imported-data screen.
9. Extend `rbt_client_assignments` view: expose only `client_initials`, `service_code`, `location_type`, `bcba_first_name`, `bcba_last_initial`, `next_session_at` — via SECURITY DEFINER view `rbt_assigned_clients_min_v`.
10. `rbt_shift_import_batches` + `rbt_shift_events` (append-only), source-tagged with stable `external_id`, never name-keyed.

RLS pattern for every RBT-facing table: `USING (employee_id = auth.uid())` OR `has_role(auth.uid(), 'admin')` OR designated coordinator via `has_role`/`case_manager_assignments`. Anon has zero access.

## F. Permission Model

- Role `rbt` (already exists).
- New role capabilities via `role_permissions`:
  - `rbt.self.read` — own data.
  - `rbt.pathway.progress.write` — own progress only.
  - `rbt.support.create` — create help/escalation.
  - `rbt.assigned_clients.read_min` — minimum-necessary client fields.
  - `rbt.admin.manage` (admin/hr/training_manager) — lifecycle overrides, pathway CRUD, rules.
- All queries go through RLS; UI role-gates for menu visibility only.

## G. Page & Route Inventory (all under `/rbt` in `App.tsx`; mobile shell)

```text
/rbt                     → Home (today, next steps, announcements)
/rbt/schedule            → schedule list (source-of-truth banner + sync time)
/rbt/schedule/:shiftId   → shift detail (min PHI)
/rbt/learn               → pathway overview + continue
/rbt/learn/pathway       → pathway detail
/rbt/learn/module/:id    → module runner (reuse academy runtime)
/rbt/learn/competencies  → competencies + shadow sessions
/rbt/support             → hub
/rbt/support/new         → categorized help form
/rbt/support/:threadId   → thread view
/rbt/messages            → announcements + DMs
/rbt/me                  → profile hub
/rbt/me/credentials      → BACB, CPR, background, expirations
/rbt/me/documents        → sign / view
/rbt/me/pay              → timesheet / mileage / pay
/rbt/me/pto              → PTO
/rbt/me/reviews          → evaluations
/rbt/me/career           → fellowship & lead interest
/rbt/me/settings         → notifications + sign out

Admin (existing shell):
/admin/rbt/lifecycle     → cohort table + transitions + rules editor
/admin/rbt/pathways      → pathway + step CRUD
/admin/rbt/imports       → RBT-scoped import monitor + last-sync banner control
```

## H. Component Inventory (reuse first)

- Reuse: `OSShell` (desktop admin), `MobileBottomNav` (extend to role-aware variant), `NotificationBell`, `AssigneePicker`, `TaskDetailDrawer`, academy runtime (`TrainingPathDayDetail`, `academy_runtime_progress`), `EscalationThreads`, `hr_messages` UI, `useUserTasks`, push infra.
- New (small, focused):
  - `RbtMobileShell` (safe-area top bar + 5-tab bottom nav + FAB "Ask for help").
  - `RbtLifecycleBadge`, `PathwayProgressBar`, `NextStepCard`.
  - `SyncStatusBanner` (reads `rbt_data_sync_status`).
  - `AssignedClientCardMinimal`.
  - `ShiftCard`, `ShiftDetailSheet`.
  - `HelpRequestForm` (typed categories → routes to correct queue).
  - `LifecycleAdminTable`, `PathwayEditor`, `LifecycleRuleEditor`.

## I. Mobile Interaction Plan

- Everything below `md:` uses `RbtMobileShell`; no desktop sidebar for role `rbt`. Desktop `rbt` users get same shell in a centered max-w-md column.
- 5-tab persistent bottom nav; active tab colored via `--primary`, safe-area padding.
- Sheets/drawers instead of modal dialogs (`vaul` `Sheet`).
- Pull-to-refresh on Home/Schedule via TanStack Query `refetch`.
- Large tap targets (min 44px), single-column, generous spacing per Blossom design skill.
- All forms are step-based, one question per screen where possible.
- Offline-tolerant reads (React Query cache); writes queue with toast + retry.

## J. Import / Data Strategy

- **CentralReach exports** land in `centralreach_uploads` (existing) → parser writes to `rbt_shift_events` keyed by CR stable IDs.
- **Viventium** sync updates `employees` + `employee_hr_profiles` (existing).
- Every RBT-facing screen reading imported data shows `SyncStatusBanner` with `last_success_at` + relative time, and a stale badge if > threshold (per source, admin-configurable).
- No name-based joins; all joins on `external_id` / `employee_id`.
- Manual override tools are admin-only and auditable.

## K. Security & PHI Minimization

- RLS: every new RBT table enforces `employee_id = auth.uid()` for the RBT role; admins via `has_role`.
- Minimum-necessary view (`rbt_assigned_clients_min_v`) — no diagnoses, no notes, no full names beyond initials.
- No RBT can list other RBTs; supervisor contact is scoped to assigned BCBA only.
- Support/help requests store only what the RBT entered; PHI redaction hint on textarea.
- Push payloads contain no PHI (deep-link only).
- Audit: every lifecycle transition, pathway completion override, assignment change, PHI-adjacent view (client card open) logged to `hr_audit_logs` / `rbt_lifecycle_events`.
- Anon role has no grants on any new table.

## L. Implementation Phases

**Phase 0 — Foundations (schema + shell)**
- Migration: lifecycle + pathway tables, RLS, GRANTs, min-view.
- `RbtMobileShell` + role-aware bottom nav.
- Register `/rbt/*` routes with `PermissionRoute allowedRoles={["rbt","admin"]}`.

**Phase 1 — Home + Me**
- Home (next step, today, announcements).
- Me hub (profile, credentials, documents, pay, PTO, reviews, career interests).

**Phase 2 — Learn**
- Pathway model wired to existing academy runtime.
- Seed 3 pathways (fast track / developing / certification) via admin editor.
- Competencies + shadow sessions reuse existing tables.

**Phase 3 — Schedule**
- Read from `rbt_shift_events` with sync banner.
- Shift detail with minimum-necessary client card.
- Availability + mileage entry.

**Phase 4 — Support**
- Typed help form → routes to correct queue (`escalation_threads`, `rbt_help_requests`).
- Messages/announcements (`hr_announcements`, `hr_messages`).

**Phase 5 — Admin**
- `/admin/rbt/lifecycle` cohort console + rule editor.
- `/admin/rbt/pathways` CRUD.
- Fellowship pathway scaffold (opt-in via career interests).

**Phase 6 — Notifications + polish**
- Push for schedule changes, supervision, announcements, lifecycle transitions.
- Empty states, skeletons, accessibility, dark mode audit.

## M. Risks & Assumptions

- Assumes CR export cadence is at least daily; stale banner threshold configurable.
- Assumes `employees.id` == `auth.uid()` for RBT users (verified via `profiles`/`employee_role_assignments`); if not, add `employee_user_map`.
- Assumes admins will curate pathway steps before launch — Phase 5 must ship before Phase 2 usable to real cohorts.
- Fellowship program details still evolving — model is extensible via pathway/step JSON, no rebuild needed.
- Push requires user permission grant; degrade gracefully.

## N. Test Strategy

- **Unit:** lifecycle rule evaluator (predicate_json DSL), pathway progress computation, min-view field allow-list.
- **RLS:** SQL tests asserting RBT A cannot read RBT B's rows across every new + touched table (assignments, shifts, help, progress, pay).
- **Integration:** import → shift appears with correct sync timestamp; stale banner triggers > threshold.
- **E2E (Playwright, mobile viewport 390x844):** login as seeded RBT → each tab renders, no horizontal scroll, no PHI leak on client card, help request creates thread, module completion advances pathway.
- **A11y:** axe on all `/rbt/*` routes; 44px targets; focus order in sheets.
- **Regression:** existing academy, HR, scheduling, notifications suites remain green.

---

Awaiting review before I start Phase 0.
