## Summary

Two changes:
1. Add new **Work Setting** options for office/leadership staff in the employee record
2. Build a brand-new **"Blossom Operations Academy"** experience inside the Training section — a guided, multi-week leadership/operations onboarding journey, completely separate from RBT/BCBA training

---

## Part 1 — Work Setting expansion

Today `work_setting` enum is: `clinic | home | hybrid | admin | field`.

Add these office/leadership options (keep all existing for backward compatibility):
- `office` — Office Staff
- `leadership` — Leadership / Executive
- `intake` — Intake Coordinator
- `recruiting` — Recruiting
- `scheduling` — Scheduling
- `state_director` — State Director
- `operations` — Operations
- `systems` — Systems / IT

Then surface them in `AddEmployeeDialog` (and the Employment editor) with friendlier labels grouped as "Field staff" vs "Office & Leadership".

These work-setting values are what gates a person into the **Operations Academy** (only office/leadership settings see it; RBT/BCBA continue using existing Training Hub).

---

## Part 2 — Blossom Operations Academy

A new top-level experience inside Training. Cohort/journey style — not a flat course list.

### Routes & navigation
- `/training/academy` — Academy homepage (auto-routes to your own journey if you're enrolled, otherwise overview)
- `/training/academy/me` — My Academy (the trainee experience)
- `/training/academy/week/:weekId` — Week detail / module view
- `/training/academy/leadership` — Leadership / admin dashboard (cohort overview)
- `/training/academy/employee/:id` — Drill into one trainee from leadership view

Sidebar entry under Training: **"Operations Academy"** (visible to office/leadership work_setting + admins).

### Data model (new tables)

```text
academy_tracks            — defines program version (default "Office Operations 2026")
academy_phases            — Foundation, Immersion, Application, Ownership
academy_weeks             — Week 1..5 with phase_id, week_number, title, summary
academy_modules           — module within a week (training, shadowing, meeting, video, sop, quiz, reflection)
academy_module_resources  — attachments / links / Tango / video URL per module

academy_enrollments       — employee_id + track_id + start_date + status + path (new_state | existing_state) + assigned_state
academy_progress          — enrollment_id + module_id + status + score + completed_at + verified_by
academy_shadow_sessions   — enrollment_id + shadowed_employee_id + department + date + hours + notes + mentor_signoff
academy_checkins          — enrollment_id + with_employee_id + meeting_date + agenda + notes + action_items + leader_rating
academy_quiz_attempts     — module_id + enrollment_id + answers jsonb + score
academy_readiness_scores  — computed snapshot per enrollment (training %, shadowing %, immersion %, mentor %, overall)
```

All RLS gated via existing `hr.training.*` permissions; trainees can read/update their own rows; leadership uses `hr.training.assign` / `hr.employees.view`.

### Seed content

Seed the full curriculum from the brief into `academy_phases / weeks / modules`:
- **Phase 1 — Foundation (Week 1)**: Team Intros, Leadership Training (Chad / Shira), Shadowing, Systems Training (CR + Monday), Backend Deep Dive (Eli), Video Training, New State Conditional Track (Gary, 3 days)
- **Phase 2 — Department Immersion (Week 2)**: Intake, Recruiting, Case Management, Scheduling (Daylis), Marketing (Nick), Tracking & Reporting (Corey), Leadership Check-ins
- **Phase 3 — Role Application (Week 3)**: branched modules — Path A (New State) vs Path B (Existing State)
- **Phase 4 — Ownership (Weeks 4–5)**: Intake ownership, Recruiting ownership, KPI tracking, Escalations, Leadership eval

### UI — Trainee experience

**Academy Home (`/training/academy/me`)**
- Hero: "Blossom Operations Academy" with mesh gradient, current phase badge, current week, days in program, mentor card, readiness ring (e.g. 87%)
- Stat strip: Modules complete, Shadowing hours, Check-ins logged, Quiz avg
- Upcoming this week (top 3 modules + next mentor meeting)
- Recent activity feed

**Roadmap view**
- Horizontal timeline of connected week cards (Week 1 → 2 → 3 → 4-5)
- Each card shows: phase color bar, title, objective one-liner, % complete, status pill (Locked / In Progress / Complete)
- Click → expands into week detail
- Path A / Path B fork visualized at Week 3

**Week detail page**
- Objective banner + outcome checklist
- Modules grouped by type with icons: Meeting, Shadowing, Systems, Video, SOP, Quiz, Reflection
- Each module is a rich card: description, leader/mentor chip, duration, resources (Tango/video/SOP), action button (Start / Mark Complete / Submit / Take Quiz)
- "Conditional" modules surface only when path/state matches
- Week completion gate: required trainings + shadowing + mentor signoff

**Shadowing logger**
- Dialog to log a session: who shadowed, department, date, hours, notes
- Mentor sign-off button (visible to the shadowed employee or admins)
- Aggregated total hours per department

**Check-in logger**
- Log meeting with leader (Chad weekly, Shira daily, etc.)
- Notes, action items, leader rating field (only writable by leader)

**Quizzes & reflections**
- Simple inline quiz UI (multiple choice, short answer)
- Reflection = textarea submission, marked "submitted" until mentor reviews

### UI — Leadership / Admin experience

**Cohort dashboard (`/training/academy/leadership`)**
- KPI strip: Active trainees, Avg readiness, On-track count, At-risk count
- Trainee table: name, role, week, phase, % complete, readiness score, mentor, last check-in, status pill
- Filters: state, path (new/existing state), risk
- Click row → trainee detail with full progress, all shadow sessions, all check-ins, ability to sign off / approve advance

**Leadership actions**
- Approve week completion
- Leave feedback (writes to `academy_checkins` with `leader_rating`)
- Flag concern (creates an `employee_cases` row with type "academy_concern")
- Recommend additional training

### Readiness score formula

```text
overall = round(
  0.40 * training_completion_pct +
  0.20 * shadowing_completion_pct +
  0.15 * immersion_completion_pct +
  0.15 * mentor_avg_rating_pct +
  0.10 * quiz_avg_pct
)
```
Computed live in a Postgres view `academy_readiness_v` and snapshotted into `academy_readiness_scores` weekly.

### Design language
- Reuse existing tokens (`--primary` blue, dark sidebar, semantic surfaces) — no new hardcoded colors
- Apple-onboarding feel: large rounded-2xl cards, gradient hero, soft shadows, milestone confetti on week completion (lightweight CSS, no library)
- Phase color bars: Foundation = blue, Immersion = teal, Application = amber, Ownership = violet (all via HSL tokens)
- Empty / locked states are first-class

### Files to create

```text
supabase/migrations/<ts>_academy.sql           — enum additions + 9 tables + RLS + seed
src/lib/academy/types.ts                        — TS types + phase/module-type meta
src/lib/academy/api.ts                          — typed Supabase queries
src/lib/academy/readiness.ts                    — score calculation helper (client mirror)
src/pages/hr/academy/AcademyHome.tsx
src/pages/hr/academy/AcademyRoadmap.tsx         — (default tab on home)
src/pages/hr/academy/WeekDetail.tsx
src/pages/hr/academy/LeadershipDashboard.tsx
src/pages/hr/academy/TraineeDetail.tsx
src/components/academy/HeroBanner.tsx
src/components/academy/RoadmapTimeline.tsx
src/components/academy/WeekCard.tsx
src/components/academy/ModuleCard.tsx
src/components/academy/ReadinessRing.tsx
src/components/academy/ShadowSessionDialog.tsx
src/components/academy/CheckinDialog.tsx
src/components/academy/QuizRunner.tsx
src/components/academy/ReflectionForm.tsx
src/components/academy/MentorChip.tsx
src/components/academy/PhaseBadge.tsx
```

### Files to edit

```text
src/lib/hr/types.ts                  — extend WorkSetting union + label map
src/components/hr/AddEmployeeDialog.tsx     — new grouped Work Setting options
src/components/hr/profile/EmploymentTab.tsx — same options
src/components/layout/AppSidebar.tsx        — add "Operations Academy" entry
src/lib/navigationAccess.ts                 — route guards
src/App.tsx                                  — register new routes
src/pages/hr/Training.tsx                   — link/promo card to Academy for office staff
```

### Out of scope (this iteration)
- Real video hosting — we use existing video URL fields
- AI auto-grading of reflections — mentor reviews manually
- Mobile-first redesign — desktop-first per project memory
- Migrating RBT/BCBA training into this flow — they keep current Training Hub

---

## Build order

1. Migration: enum additions + tables + RLS + seed curriculum
2. Types + API helpers
3. Trainee experience (Home → Roadmap → WeekDetail → ModuleCard with all module types)
4. Shadowing & Check-in dialogs
5. Quiz runner + Reflection form
6. Leadership dashboard + Trainee detail
7. Wire AddEmployeeDialog work-setting options + sidebar route + Training landing promo
8. Readiness ring + score view
9. QA pass: empty states, locked weeks, branching paths, role gating
