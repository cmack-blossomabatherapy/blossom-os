# HR Team Role — Full Audit Plan

12 pages, ~8,700 lines. I'll do this in **4 phases**, shipping each phase as a self-contained pass so we can verify before moving on.

## Scope (every page in HR Team role)

```
Workspace        Operations              Records              Comms / Resources
─────────────    ───────────────────     ─────────────────    ──────────────────
HR Workspace     Orientation Queue       New Hires            Messages & Updates
Training Academy HR Requests             Employee Support     Resource Library
                 Compliance & Documents  Training & Certs
                                         Evaluations & Growth
```

Plus: confirm `/hr-team` landing, sidebar entries, and remove links to any legacy `/hr/*` routes still referenced from HR Team views.

## Audit checklist applied to every page

1. **Real data only** — every list/KPI sourced from Supabase tables (`employees`, `employee_onboarding`, `employee_cases`, `employee_trainings`, `employee_certifications`, `employee_evaluations`, `hr_announcements`, `recruiting_orientation_slots`, `academy_*`, etc.). Remove any remaining mock arrays, placeholder counts, or hardcoded names.
2. **Loading + empty states** — skeleton on load, calm empty state, no fake fillers.
3. **Buttons work** — every CTA, row action, filter, tab, and detail-panel action either performs a real mutation (insert/update via supabase client) or navigates to a real OS route. No dead `onClick={() => {}}`.
4. **Routes are new** — all internal links point to `/hr/workspace`, `/hr/new-hires`, `/hr/orientation-queue`, etc. — never to legacy `/hr/onboarding`, `/hr/directory`, `/hr/training`, `/hr/reviews`.
5. **Design matches Blossom OS** — `OSShell` + semantic tokens + glass/hairline cards, one primary action per view, no raw color classes.
6. **Permissions** — HR Team role only; sensitive payroll/financial actions hidden.
7. **Mobile** — KPI grid + tables collapse cleanly.

## Phase 1 — Foundation & data layer

- Inventory all Supabase tables the pages need; for any that don't exist yet (e.g. `hr_requests`, evaluation cycles), create a migration with RLS.
- Create `src/lib/os/hr/queries.ts` with shared typed query helpers (employees, onboarding, cases, trainings, evaluations, announcements, orientation slots) so all 12 pages use one source of truth.
- Fix `/hr-team` landing (`OSHRTeam`) to use real KPIs from those queries.

## Phase 2 — Records pages

- `OSHRNewHires` — wire to `employee_onboarding` + `employees`; row actions (advance stage, add blocker, message employee).
- `OSHREmployeeSupport` — wire to `employee_cases`; resolve / reassign / escalate mutations.
- `OSHRTrainingCerts` — wire to `employee_trainings` + `employee_certifications` + `academy_enrollments`; assign / mark complete / remind.
- `OSHREvaluations` — wire to evaluation cycle tables; schedule / record outcome.

## Phase 3 — Operations pages

- `OSHROrientationQueue` — wire to `recruiting_orientation_slots`; confirm / reschedule / mark attended.
- `OSHRRequests` — wire to (new) `hr_requests` table; intake / assign / resolve.
- `OSHRCompliance` — wire to `employee_certifications` + compliance documents; upload / verify / remind.

## Phase 4 — Workspace, comms, resources, QA

- `OSHRWorkspace` — top-level command center driven by Phase 1 queries.
- `OSHRTrainingAcademy` — real `academy_tracks` + `academy_enrollments` data.
- `OSHRMessages` — wire compose/reply/escalate to `employee_cases` + `hr_announcements` mutations.
- `OSHRResources` — confirm category structure, persist saved/recent state per HR user.
- Final QA pass per checklist on all 12 pages; mobile pass; verify no legacy `/hr/*` link remains in HR Team views; confirm build is clean.

## Deliverable per phase

Short report listing: tables touched, mutations added, dead buttons fixed, legacy routes removed, and any deferred items. Then we proceed to the next phase.

---

**Reply "go" (or "start phase 1") and I'll begin with Phase 1.** If you want to reorder phases or add/remove pages from scope, tell me now.