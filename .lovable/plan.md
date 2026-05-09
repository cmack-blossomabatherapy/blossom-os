# Phase 1 — Blossom OS Foundation

This plan reorganizes the existing Command Center into a polished, executive-ready internal operating system. **No existing routes, auth, HR training admin, or Supabase logic is removed** — we add a new top-level "Blossom OS" navigation layer over the current app and upgrade specific pages.

## Scope (Phase 1 only)

In: visual redesign of dashboard hero, new/upgraded top-level pages, navigation reorganization, mock data scaffolding, role-aware UI placeholders.
Out: AI course creator, deep integrations, new Supabase tables, destructive migrations, backend enforcement of new permissions.

## Navigation Structure

Reorganize `AppSidebar` into a clean "Blossom OS" group at the top, with existing CRM/HR groups preserved underneath:

```
BLOSSOM OS
  Dashboard              /            (rebranded)
  Operations Academy     /academy     (new)
  Blossom Training       /training    (upgrade existing TrainingHub)
  Resource Hub           /resources   (upgrade existing)
  Departments            /departments (new)
  Locations              /locations   (new, links existing /clinics)
  Users                  /users       (new, wraps existing /team)
  Reports                /reports     (upgrade existing)
  Admin Settings         /settings    (existing, add new panels)

PIPELINE / OPERATIONS / RECORDS / HR  (all existing routes preserved)
```

## Pages to Create or Upgrade

### 1. Dashboard (`/`) — branded hero
- New `BlossomHero` component: brand image area, title "Blossom ABA Command Center", subtitle, 4 quick-action buttons (Continue Training, Resource Hub, Operations Academy, Admin Settings).
- Replaces top of `Dashboard.tsx`. Existing KPI strips and panels stay below.
- Adds executive cards row: My Assigned Trainings, In Progress, Completed, Certifications, Overdue, Department Resources, Latest Updates, Quick Links.
- Admin-only second row: Total Users, Active Trainings, Completion Rate, Overdue Trainings, Certificates Issued, Departments, Locations, Recent Activity (gated via `hasPerm('admin.*')`).

### 2. Operations Academy (`/academy`) — new
- Hero, description, grid of 9 track cards (Intake, Authorizations, Staffing, QA, Scheduling, State Director, Clinic Operations, Leadership, Systems).
- Each card: name, description, course count, est. time, role tags, completion %, "View Track".
- Track detail route `/academy/:trackId`: Overview, Curriculum modules, Required courses, Optional resources, Competencies, Certificate area, admin Edit button.

### 3. Blossom Training (`/training`) — upgrade
- Keep existing TrainingHub; add search, filters (department, role, location, required/optional, status), course-card grid with required/optional/completion badges, enroll button.
- Sample categories listed in spec. Existing Training Admin links preserved.

### 4. Resource Hub (`/resources`) — upgrade
- Search bar, category filters, Featured / Recently Added sections, department resource sections.
- Resource cards: title, type, department, last updated, owner, view + open/download.

### 5. Departments (`/departments`) — new
- Grid of 16 department cards. Detail page `/departments/:id`: overview, owner, team members, related trainings/SOPs/resources, KPIs placeholder, meetings, systems used, helpful links.

### 6. Locations (`/locations`) — new
- Cards for states (GA, NC, TN, VA, MD) and clinics (Peachtree Corners, Riverdale). Detail page: address, location-specific trainings/resources/contacts, login links, compliance requirements.

### 7. Users (`/users`) — new wrapper
- Reuses existing Team data; adds LMS fields in profile drawer (assigned tracks, courses, certifications, competencies, credits, training status). Admin actions: assign track/course, view certs/competencies, export placeholder.

### 8. Reports (`/reports`) — upgrade
- Cards for: Training completion by dept/location, Overdue trainings, Certifications issued, Competency completion, Course activity, Enrollment, User progress. Each with Export CSV / Email / Print buttons (placeholders).

### 9. Admin Settings (`/settings`) — extend
- Add new nav sections: Branding, Course Categories, Track Categories, Certificate Templates, Competency Library, Notification Settings, Report Settings. Existing panels (states, clinics, roles, etc.) preserved.

### 10. HR Training Admin
- Untouched functionally. Add a header note/breadcrumb visually connecting it under "Blossom Training → Admin".

## Design System

- Reuse existing `GlassPageShell`, `GlassHero`, semantic tokens. No hardcoded colors.
- New `BlossomHero` for the dashboard with brand image (generated, calm clinical illustration) + gradient wash.
- Consistent card pattern: `rounded-2xl`, soft shadow, hover lift.
- Mobile-first responsive (recent audit conventions preserved).

## Data Model (mock, frontend-only)

New file `src/data/blossomOS.ts` with typed mock arrays:
- `tracks`, `courses`, `curriculums`, `resources`, `departments`, `locations`, `certificates`, `competencies`, `enrollments`, `activityLog`.

No Supabase migrations in Phase 1. Existing tables (`academy_*`, `hr_*`) remain the source of truth where already wired; new pages use mock until Phase 2.

## Role-Based Access

- Use existing `useAuth().hasPerm`. Admin-only sections wrapped in conditional render with a small "Admin" chip.
- Non-admin users see a filtered view (assigned trainings, general catalog, resources). UI placeholders only — backend enforcement deferred.

## Files Touched

**New**
- `src/components/dashboard/BlossomHero.tsx`
- `src/components/blossom/ExecutiveCard.tsx`
- `src/components/blossom/TrackCard.tsx`, `CourseCard.tsx`, `ResourceCard.tsx`, `DepartmentCard.tsx`, `LocationCard.tsx`
- `src/data/blossomOS.ts`
- `src/pages/academy/OperationsAcademy.tsx` + `TrackDetail.tsx`
- `src/pages/Departments.tsx` + `DepartmentDetail.tsx`
- `src/pages/Locations.tsx` + `LocationDetail.tsx`
- `src/pages/Users.tsx`
- `src/assets/blossom-hero.jpg` (generated)

**Edited**
- `src/App.tsx` — register new routes
- `src/components/layout/AppSidebar.tsx` — add Blossom OS group at top
- `src/pages/Dashboard.tsx` — prepend hero + executive cards
- `src/pages/TrainingHub.tsx` — search + filters + cards
- `src/pages/hr/ResourceHub.tsx` — knowledge-base layout
- `src/pages/Reports.tsx` — new report cards + actions
- `src/data/settings.ts` + `src/pages/Settings.tsx` — new admin sections (stub panels)

## Out of Scope (deferred to later phases)
- AI course creator
- New Supabase tables / RLS for Blossom OS data model
- Real CSV export, email, print
- Backend role enforcement for new sections
- Removing or merging existing CRM modules

## Estimated Result
A cohesive, branded internal OS where leadership immediately sees the command center, training organization, centralized resources, department hubs, user tracking, and a reports foundation — all without touching working CRM/HR code.
