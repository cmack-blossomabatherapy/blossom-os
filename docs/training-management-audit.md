# Training Management Audit (Pass 1)

## Goal

Consolidate the admin/manager training experience into one calm "control room" workspace anchored at `/hr/training-center`, so a manager can answer:

1. Who is in training?
2. What path are they on?
3. What week/day/module?
4. What setup is missing?
5. What SOP/resource links are pending?
6. Who is at risk?
7. What should the manager do next?

The learner Academy, State Director journey, Leadership Dashboard, and Resource Library catalog remain unchanged.

## Inventory of training admin/management surfaces

| Route | Component | Purpose | Status after Pass 1 |
|---|---|---|---|
| `/hr/training-center` | `TrainingManagementCenter` | Primary admin workspace — journeys/modules/SOPs/Tangos/assignments builder. | **Primary Training Management workspace.** New "Control Room" tab is now the default landing. All builder tabs remain available. |
| `/training/manage` | `OSTrainingManage` | Journey Editor (reorder modules in one journey). | Keep. Linked from Control Room → "Open Journey Editor". |
| `/training/academy/editor` | `AcademyEditor` | Curriculum editor for the State Director academy phases/weeks/modules. | Keep. Linked from Control Room → "Edit Academy curriculum". |
| `/training/academy/leadership` | `LeadershipDashboard` | Per-trainee readiness + launch checklist + risk signals for State Directors. | Keep. Linked from Control Room → "Open Leadership Dashboard". |
| `/training/academy` | `AcademyHome` | Learner academy entry. | Keep, learner-only. Linked from Control Room as preview. |
| `/training/academy/week/:weekId` | `WeekDetail` | Learner week detail. | Keep, learner-only. |
| `/training` | `OSTraining` | Learner Training Hub. | Keep, learner-only. |
| `/training/:id` | `OSTrainingDetail` | Learner training detail. | Keep, learner-only. |
| `/admin/training-dashboard`, `/hr/training-dashboard` | `TrainingDashboard` | Legacy admin overview. | Keep direct-only; superseded by Control Room. Recommend redirect in Pass 2. |
| `/admin/training-statistics` | `TrainingStatistics` | Legacy stats. | Keep direct-only; superseded by Control Room KPI strip + Leadership Dashboard. |
| `/admin/training-assign`, `/admin/track-assign` | `TrainingAssign`, `TrackAssign` | Assignment flows. | Keep. Linked from Control Room → "Assign training". |
| `/hr/training` | `Training` | Legacy HR training page. | Keep direct-only; superseded by Control Room. |
| `/hr/track-analytics` | `TrackAnalytics` | Legacy analytics. | Keep direct-only; superseded by Leadership Dashboard. |

## Duplicates & overlap

- **Three "admin" entry points** (`/hr/training-center`, `/admin/training-dashboard`, `/hr/training`) all attempt to be the manager landing. Pass 1 designates `/hr/training-center` as the primary; the others remain reachable but are not advertised in navigation.
- **Two "editor" surfaces** (`/training/manage` Journey Editor, `/training/academy/editor` Academy curriculum editor). Both retained — they edit different layers (journey-level vs. curriculum-level). Linked separately from the Control Room.
- **Assignment** lives in `/admin/training-assign` and `/admin/track-assign`. Linked from Control Room → "Assign training" (single canonical entry).

## Primary workspace structure

`/hr/training-center` now opens on the **Control Room** tab (`TrainingControlRoom` component) which renders six fixed sections in Calm Future OS style:

1. **Active Trainees** — name, state, mentor, current week/phase, readiness chip, next action, risk chips.
2. **Setup Needed** — per-trainee `LaunchSetupCheck` results: employee link, enrollment status, path, state, mentor.
3. **Launch Readiness** — Welcome assets (videos/training/SOP) + per-trainee launch checklist progress.
4. **Resource / SOP Gaps** — SOP modules in curriculum lacking a Resource Library URL, plus unlinked welcome assets.
5. **Paths & Journeys** — role-based journeys from `useAcademy()` with direct links into the Journey Editor.
6. **Admin Actions** — quick links to Leadership Dashboard, Academy curriculum editor, Journey Editor, learner preview, Resource Library, and Assign Training.

All other builder tabs (Journeys, Modules, Onboarding, SOPs, Tangos, Resource Library, Assignments, Categories, Drafts, Published, AI) remain as secondary tabs.

## Connections

- **Academy data** — Control Room consumes `loadCurriculum`, `listEnrollments`, `listProgress`, `listShadowSessions`, `listCheckins`, `computeReadiness` from `@/lib/academy/api`.
- **Readiness signals** — uses `computeSDReadinessCategories`, `computeLaunchChecklist`, `computeRiskSignals` (`@/lib/academy/leadershipReadiness`).
- **Launch assets** — uses `computeWelcomeAssetStatus`, `computeLaunchSetup`, `computePendingSops` (`@/lib/academy/launchAssets`).
- **Resource Library** — pending SOP rows reference the Resource Library; Admin Actions link directly to `/resource-library`.
- **Employee records** — Setup section flags unlinked employees and unassigned mentors derived from `enrollment.employee` + `enrollment.mentor_employee_id`.
- **RBAC** — `/hr/training-center` route already gated upstream by training-admin permissions; not changed in this pass.

## Behavior preserved

- 5-week / 25-day State Director journey structure unchanged (`SD_JOURNEY_STRUCTURE`).
- Pending videos remain **non-blocking** — `ModuleCard` does not gate completion on `video_url`, and Control Room copy says so explicitly.
- Pending SOP attachments surface as Admin action items, not blockers.
- No RBAC, route, or DB schema changes.
- No placeholder nav links re-added.

## Recommended Pass 2

- Redirect `/admin/training-dashboard`, `/hr/training-dashboard`, `/hr/training` → `/hr/training-center`.
- Move `/admin/training-assign` and `/admin/track-assign` behind a single "Assign" modal on the Control Room.
- Surface non-State-Director journey readiness (BCBA, Authorizations, etc.) once per-journey readiness math is generalized.
- Add an "Assign mentor" quick-action to each Setup Needed row.