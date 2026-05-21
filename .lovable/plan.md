## Real Data Backfill — Jan → May 2026, State-Scoped

### What we actually have in the database today

- `bcba_billable_sessions` — **34,121 real sessions** with `date_of_service`, `state`, `bcba_name`, `client_full`, `hours`, `charges_total`, `amount_paid`, `payor_*`, `procedure_code`. Date range **2026-01-01 → 2026-05-18**. State coverage: GA (21,235) · TN (5,626) · VA (3,251) · NC (2,927) · MD (196) · unassigned (886).
- `employees` — 4 rows (mostly the test logins we just made).
- `clients`, `intake_leads`, `client_authorizations`, `client_service_sessions`, `kpi_values`, `hours_timesheets`, `payroll_runs`, `critical_alerts`, `qa_note_monitoring`, `training_assignments` — **all empty (0 rows)**.

Everywhere else, the UI reads from `src/data/*.ts` mock files (~4,000 lines across clients, leads, pipeline, recruiting, scheduling, staffing, calls, ops, journey, KPIs, etc.).

So "real data everywhere" really means two things:

1. **Promote the BCBA session data into a single source of truth** that every dashboard reads from (it's the only true production data we have).
2. **Backfill the empty tables with realistic, internally-consistent records derived from the session data** (same clients, same BCBAs, same states, same dates) so leads/clients/auths/schedules/KPIs/hours/QA/alerts all line up with what actually happened Jan–May.

Then enforce state scoping for state directors everywhere.

### Scope & approach

Phased so each step is reviewable and reversible. Each phase ends with the State Director dashboards showing real, state-filtered numbers.

---

### Phase 1 — Source-of-truth derivation from real sessions

Build deterministic views/tables on top of `bcba_billable_sessions`:

- `v_clients_real` — distinct `client_full` × `state` × primary `bcba_name` × first/last `date_of_service` × total hours/charges/paid YTD.
- `v_bcbas_real` — distinct `bcba_name` × `state` × clients served × weekly hours × utilization.
- `v_state_kpis_daily` — per `state` × `date_of_service`: sessions, hours, billable $, collected $, active clients, active BCBAs.
- `v_state_kpis_weekly` / `v_state_kpis_monthly` — rollups for dashboard widgets and charts.
- `v_payor_mix` — per state, payor breakdown of hours and charges.

These views power every leadership/state-director chart with **zero made-up numbers**.

### Phase 2 — Backfill `clients` and `employees` from real sessions

- Insert one `clients` row per distinct (client_full, state) seen in sessions (~758 clients). Assign `intake_date` = first `date_of_service`, `status` = active if seen in last 30 days else inactive, `primary_bcba` linked to the most-frequent BCBA.
- Insert one `employees` row per distinct (bcba_name, state) BCBA (~80) with `job_title='BCBA'`, `state`, `hire_date` = first session seen.
- Skip the 886 sessions with `state = NULL` for now, or attribute by majority BCBA-state.

### Phase 3 — Backfill operational tables for Jan–May

Derived, internally consistent with sessions:

- `client_authorizations` — one active auth per client per quarter (Q1 + Q2 2026), units = sum of session units, expiring dates spread realistically.
- `client_service_sessions` — copy the session rows into the canonical scheduling table.
- `client_schedule_slots` — recurring weekly slots reconstructed from session-day-of-week patterns.
- `hours_timesheets` + `hours_timesheet_entries` — weekly timesheets per BCBA from session hours.
- `kpi_values` + `kpi_scorecards` — weekly KPI snapshots per state (hours, billable %, collection %, client count, BCBA utilization) from Phase 1 views.
- `qa_note_monitoring` — sample QA reviews ~5% of sessions, weighted to recent dates.
- `critical_alerts` — generate from real signals: auths expiring <30d, clients with 0 sessions in 14d, BCBAs over 40 hrs/wk.
- `intake_leads` — ~80 realistic leads spread Mar–May per state at realistic conversion rates (about 30% of new clients in that window).

Recruiting, training, payroll: derive plausible records from the BCBA roster + dates. Marked clearly in the migration description.

### Phase 4 — Wire the UI to the database

Replace reads from mock files with real Supabase queries, **filtered by `useOSRole().activeState` for non-super-admins**:

- `src/data/clients.ts` → `useClients(state?)` hook hitting `clients`.
- `src/data/leads.ts`, `pipeline.ts` → `useLeads(state?)`.
- `src/data/scheduling.ts` → reads `client_schedule_slots` + `client_service_sessions`.
- `src/data/authorizations.ts` → reads `client_authorizations` joined to clients/state.
- `src/data/operations.ts`, `stateDirectorReports.ts`, `leadershipDashboard.ts` → read `v_state_kpis_*` views.
- `useStateOps` + `stateOps.ts` → swap mock generator for view-backed queries.
- KPI Scorecards (`OSKpiScorecards.tsx`) → read `kpi_values`.
- Critical Alerts panel, QA queue, Hours, Payroll dashboards → read their real tables.
- Recruiting, Training, Calls, Journey: kept on mocks for now (no source data) — flagged in plan as Phase 5.

State Director users: every query gets `.eq('state', activeState)`. Super admins keep the state switcher. RLS policies updated so state directors can only SELECT their state's rows.

### Phase 5 — Areas left on mocks (call out clearly)

No real source data exists for these yet — building convincing mocks isn't the same as "real data," so flagging instead of pretending:

- Recruiting pipeline & candidates
- Phone calls log
- Training assignments & academy progress (some real schema exists but no historical records)
- Marketing dashboard
- Journey onboarding events for past employees

I'll leave these on the existing mock files **but state-filter them** so a state director still only sees their state's mock slice. We can backfill these from CSVs in a later round when you have the source.

---

### Deliverables per phase

Each phase = one migration (schema/views/seed) + one PR-style batch of UI changes. After every phase you'll be able to log in as `teststatedirector.ga@...` / `.nc@` / `.tn@` / `.md@` / `.va@` and see real, state-scoped numbers in the dashboards covered so far.

### Open questions before I start

1. **MD has only 196 sessions and 39 clients (started Feb 2026).** Confirm: render it as a small but real state, not pad with synthetic rows? this is right
2. **886 sessions have** `state = NULL`**.** Drop them, or auto-assign by majority BCBA state? show as error / issue
3. **Recruiting / phone calls / training history** — do you have CSV exports you can drop in, or proceed with state-scoped mocks for now and circle back? no
4. **Order of phases** — start with Phase 1+2+4 for the State Director dashboard (highest-impact, fastest visible win), or run all four phases sequentially before any UI swap? 

I want to make sure all the data from the admin data uploads. theres so much!