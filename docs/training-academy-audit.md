# Training Academy — Audit (Pass 1)

Date: 2026-06-05
Owner: Training Academy
Scope: route inventory + State Director journey hardening

## Canonical learner route

- **`/training/academy`** → `AcademyHome` (`src/pages/hr/academy/AcademyHome.tsx`).
  This is the single canonical entry point for a learner. All other learner-style
  routes either redirect here, link here, or render specialized journey content
  inside this same surface.

## Admin / leadership routes

- `/training/academy/editor` → `AcademyEditor` — gated by
  `PermissionRoute permission="hr.training.assign"` and `TRAINING_ADMIN_ROLES`.
- `/training/academy/leadership` → `LeadershipDashboard` — gated by
  `PermissionRoute permission="hr.training.view"`.
- `/training/academy/week/:weekId` → `WeekDetail` — open to enrolled learners
  via the same parent gate as `/training/academy`.

## Known overlapping / adjacent training routes

| Route | Renders | Notes |
|-------|---------|-------|
| `/training` | `OSTraining` (role academy) | Role-based localStorage academy. Consumes `src/lib/training/academyData.ts` (State Director journey lives here). |
| `/training/department/:dept` | `TrainingDepartment` | Older department-scoped catalog. Still in use; not deprecated. |
| `/training/catalog` | `TrainingCatalog` | Cross-department course catalog. |
| `/training/hub` | `TrainingHub` | Top-level training landing. |
| `/my-learning` | `MyLearning` | Personal queue view. |
| `/academy` | `OperationsAcademy` (`blossom/OperationsAcademy`) | Blossom org-wide academy surface. |
| `/recruiting/academy` | `OSRecruitingTrainingAcademy` | Recruiting-scoped academy wrapper. |
| `/blossom/academy/:trackId` | `TrackDetail` | Org track detail page. |
| `/onboarding/academy-preview` | `OnboardingAcademyPreview` | Pre-onboarding preview. |
| `/hr/journey/drive` | `JourneyDrive` | RBT/BCBA Drive resource hub. |

These remain intact in Pass 1. No routes were added or removed.

## State Director data — source of truth

- **File:** `src/lib/training/academyData.ts`
- **Journey structure:** `SD_JOURNEY_STRUCTURE` (5 weeks × 5 days, 104 modules)
- **Modules:** built via `buildSdModule(week, day, position, title)` which
  hydrates each entry with description, `whyItMatters`, `whatToDo`,
  `completionEvidence`, optional `reflectionPrompt`, `type`, `estimatedMinutes`,
  checklist, and a named SOP resource.
- **SOP catalog:** `SD_SOPS_BY_WEEK` — positional mapping of the canonical SOP
  names the State Director program uses (Resource Library is the source of truth
  for the actual document URLs).
- **Week 1 Day 1 ("Welcome to Blossom")** — handcrafted in `SD_W1D1_SPECS` and
  preserved exactly:
  Welcome Video, Mission & Vision, Core Values, Meet the Team, How Blossom Works,
  Welcome from Chad Kaufman, A Note from Shira Lasry.

## Module types now supported

`TrainingType` was extended to: `Video`, `Training`, `SOP`, `Task`, `Meeting`,
`Shadowing`, `Quiz`, `Reflection` (in addition to the legacy `Workflow`,
`Tango`, `Checklist`, `Quick Guide`). `OSTraining` `TYPE_ICON` was updated to
include the new entries.

## Recommended cleanup order (future passes)

1. Consolidate `/training` (role academy) and `/training/academy` (DB-backed
   academy) — today they're two parallel systems. Pick one as the learner home
   and make the other a department-scoped catalog only.
2. Move `SD_SOPS_BY_WEEK` SOP names into the Resource Library and link real URLs
   onto each module's `resources[0].url`.
3. Wire welcome videos (W1D1) to actual hosted video URLs when available.
4. Pull `Final Knowledge Review` quiz into a real quiz engine.
5. Surface "next action" + readiness on `AcademyHome` from the State Director
   journey data (currently driven only by the DB academy).
6. Audit `/training/hub`, `/training/catalog`, `/academy`, `/my-learning` for
   overlap and either retire one or assign each a distinct role.

## Out of scope for Pass 1

- No RBAC changes (gates around editor + leadership unchanged).
- No route removals or redirect re-adds.
- No ingestion of sensitive Current Materials.
- No redesign of `AcademyHome` / `WeekDetail`; styling polish only.