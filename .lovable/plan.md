# HR Admin Assistant Track — Plan

A premium, calm, mobile-first 4-week onboarding track lives inside the **HR Academy** (the existing `academy_*` tables), with a dedicated dashboard and gated app access for the assigned employee.

## 1. Make Academy multi-track aware (small but required)

Today `loadCurriculum()` returns the first active track only. To safely add a second track without breaking the existing Operations Academy:

- Extend academy API: `loadCurriculum(trackId?)`, `listTracks()`, `loadCurriculumByName("HR Admin Assistant")`.
- AcademyHome picks the track based on the viewer's enrollment; if none, shows a track selector (Operations Academy vs HR Admin Assistant).
- No destructive schema changes — both tracks coexist in `academy_tracks` with `is_active = true`.

## 2. Seed the HR Admin Assistant track (data migration)

One migration inserts:

- 1 `academy_track`: `HR Admin Assistant` (department: `HR`, color: `teal`)
- 4 `academy_phases` (one per week-theme) using calm color tokens: teal → primary → violet → amber
- 4 `academy_weeks`:
  - **W1 — Foundation, Culture, Systems**: Welcome, Mission/Vision, Core Values, Meet the Team, Org Chart, How Blossom Works, system intros (Viventium, Monday, Teams, SharePoint, Outlook, Tapcheck, Jivetel, HR Request Forms)
  - **W2 — Employee Support & Access Management**: answering employee questions, onboarding workflows, account creation, email/phone setup, permissions, system access, HR request workflows, interactive workflow simulations
  - **W3 — Operations, Audits, Organization**: Jivetel audits, email audits, SharePoint organization, scanning mail, HR documentation, operational standards
  - **W4 — Independent Application**: workers comp support, independent workflow handling, employee comms, onboarding execution, accountability, operational excellence
- ~28 `academy_modules` mixing types: `training`, `video`, `sop`, `quiz`, `shadowing`, `reflection`, `task`. Each with duration_label, leader_name (Nikki Goldenberg where appropriate), description, key points.
- 5 certificate definitions (in a new `academy_certificates` lookup or as `module_type='task'` capstone rows tagged `certificate`):
  - HR Foundations · Employee Support · HR Operations · Onboarding Systems · Blossom HR Certified

## 3. New competency tracking

Add `academy_competencies` (track_id, name) and `academy_competency_scores` (enrollment_id, competency_id, score 0-5, updated_by_name). Seven competencies:
communication, organization, onboarding, employee support, HR systems, professionalism, documentation.

## 4. HR Admin Assistant Dashboard (new route `/training/hr-admin-assistant`)

Premium Apple-style dashboard, mobile-first:
- Welcome hero with greeting + readiness ring
- **Today's tasks** (modules + shadow sessions due)
- **Onboarding progress** roadmap (reuses `RoadmapTimeline`)
- **Upcoming shadowing**
- **Assigned SOPs** chips
- **Completed modules** glowing cards
- **Competency scores** radial chart
- **Nikki feedback notes** (pulled from `academy_checkins` where `with_name = Nikki Goldenberg`)
- **Quick system links**: Viventium, Monday, Teams, SharePoint, Outlook, Tapcheck, Jivetel
- Cinematic transitions, glow on completion, badge unlocks

Sidebar entry under HR → Training: "HR Admin Assistant".

## 5. Role-gated app access until graduation

Add a small lock layer:
- New table `onboarding_track_locks(user_id, track_id, unlocked_at, unlocked_modules text[])` OR reuse existing `onboarding_state`.
- A `useTrackLock()` hook returns `{ locked: true, allowedRoutes: [...] }` while the user has an active HR Admin Assistant enrollment that is not 100% complete.
- `AppLayout` redirects locked users away from admin/HR routes to `/training/hr-admin-assistant`. Allowed: `/training/*`, `/profile`, `/help`, `/auth`.
- On graduation (all required modules complete + capstone signed off by Nikki), the lock auto-clears and existing roles take effect.

## 6. Attach to testhr@blossomabatherapy.com & reset

A second SQL migration (idempotent):
- Look up the auth user by email, the `employees` row, and any existing `academy_enrollments`.
- Delete prior `academy_progress`, `academy_shadow_sessions`, `academy_checkins`, `academy_competency_scores` for that user.
- Insert a fresh `academy_enrollments` row pointing at the new HR Admin Assistant track with `path='existing_state'`, `mentor_employee_id` = Nikki, `current_week_id` = Week 1.
- Insert `onboarding_track_locks` row so admin/HR routes are blocked until completion.
- Roles are NOT removed — the lock layer hides them; once the track completes the original roles work again.

## 7. Mobile polish

- All new components built mobile-first (375px baseline), using existing `GlassPanel`, `GlassHero`, `GlassStat`, `ReadinessRing`, `RoadmapTimeline`, plus new `CompetencyRadial`, `CertificateCard`, `SystemLinkChip`.
- Bottom-sheet style task lists, large tap targets, sticky progress bar, haptic-feeling micro-animations.

## Technical Section

**Files added/changed:**
- `supabase/migrations/<ts>_hr_admin_assistant_track.sql` — schema additions + seed
- `supabase/migrations/<ts>_attach_testhr_hr_admin.sql` — reset & enroll testhr@
- `src/lib/academy/api.ts` — multi-track helpers, competencies API, lock helpers
- `src/lib/academy/types.ts` — `AcademyCompetency`, `AcademyCompetencyScore`, `OnboardingTrackLock`
- `src/hooks/useTrackLock.ts` — gating hook
- `src/components/layout/AppLayout.tsx` — apply lock redirects
- `src/components/academy/CompetencyRadial.tsx` (new)
- `src/components/academy/CertificateCard.tsx` (new)
- `src/components/academy/SystemLinkChip.tsx` (new)
- `src/pages/hr/academy/HRAdminAssistantDashboard.tsx` (new)
- `src/pages/hr/academy/AcademyHome.tsx` — track selector when multi-track
- `src/App.tsx` — new route, sidebar entry

**Schema additions only** (no destructive changes):
- `academy_competencies` and `academy_competency_scores` with RLS (trainee can read own; HR/admin can write)
- `onboarding_track_locks` with RLS (user reads own; HR/admin manage)

**Out of scope for this pass** (call out and confirm if desired): real Loom/Tango embed URLs (placeholders used), live SharePoint deep links (configurable later via AcademyEditor), email notifications when Nikki posts feedback.

Approve and I'll execute steps 1–6 in order, starting with the migrations.
