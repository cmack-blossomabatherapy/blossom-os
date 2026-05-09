# Refocus: Blossom Academy (Training & Onboarding First)

## Goal
Reframe the frontend so employees experience a premium **learning + onboarding platform**, not an ERP. Keep all existing pages, routes, data, Supabase, auth, automations, and admin tools intact — just hide them from the default user experience and surface them only for admins.

## Scope (frontend only)
No database changes. No deletion of pages, routes, or backend logic. No changes to RLS, edge functions, or Supabase. Operational pages remain reachable via direct URL and via the Admin area for admins.

---

## 1. New primary navigation (replaces current sidebar/bottom nav for non-admins)

Default user nav (sidebar + mobile bottom nav):
1. Home
2. Blossom Academy
3. My Learning
4. Training Catalog
5. Resource Hub
6. Announcements
7. Profile

Admin-only additional section ("Admin" group, collapsed by default):
- User Management → `/team`
- Course Management → `/admin/training-dashboard`
- Reporting → `/reports`
- Academy Settings → `/settings`
- Operations (link group that exposes existing Operate / Pipeline / Records / Intelligence / HR Suite / Dashboards as a single "Operations" submenu so nothing is lost)

Mobile bottom nav (5 tabs): Home · Academy · Learning · Resources · Profile.

## 2. New Home (`/`)
Replace current operational Dashboard view at `/` with a **Welcome experience** for non-admins. Admins keep a "Switch to Operations" button that links to existing `LeadershipDashboard`.

Sections (all use existing data/components where available):
- Branded hero: "Welcome back, {firstName}" + onboarding progress ring (reuse `ReadinessRing`)
- Continue Learning (reuse academy/training data)
- Onboarding roadmap preview (reuse `RoadmapTimeline` + `hr/onboardingRoadmap`)
- Assigned Courses
- Announcements (latest 3, from existing `hr/Announcements` data)
- Recommended Learning
- Recent Resources

Remove operational KPI cards, pipeline widgets, and revenue panels from the default Home.

## 3. Blossom Academy (`/academy`)
New canonical academy hub (route alias to existing `/blossom/academy` content via redirect or wrapper). Polished landing with:
- Onboarding journeys
- Academy tracks (existing `academyTracks`)
- Featured trainings
- Role-specific recommendations
- Department pathways

## 4. My Learning (`/my-learning`)
New page that aggregates existing training data:
- Continue Learning
- Assigned Courses
- Completed Courses
- Upcoming Trainings
- Certifications
- Saved Resources
- Recommended Learning

## 5. Training Catalog (`/catalog`)
New page styled like a streaming catalog (search, filters, categories, featured, required). Pulls from existing `data/training.ts`.

## 6. Resource Hub (`/resources`)
Keep existing page; refresh layout to feel searchable/organized (categorized cards, search bar, filter chips). No data changes.

## 7. Announcements (`/announcements`)
Promote existing `hr/AnnouncementsFeed` to a top-level route with a calmer, positive layout.

## 8. Profile (`/profile`)
New page focused on: learning progress, certifications, competencies, achievements, academy completion, onboarding progress, badges. Reuses existing employee profile data.

## 9. Admin experience
- Add a single **Admin** sidebar group (admin roles only) that contains links to every existing operational/admin page so nothing is lost: Dashboards, Operate, Pipeline, Records, Intelligence, HR Suite, Automations, Reports, Settings, Team, Training Admin, etc.
- Existing pages and routes remain at their current paths. No deletions.

## 10. Visual / design polish
- Lean into existing semantic tokens (calm blue primary, warm neutrals).
- Larger headings, more whitespace, soft cards, subtle gradients on hero, rounded-2xl, shadow-sm.
- Mobile-first spacing on all new pages.
- Keep current AssistantWidget, MobileAlertsButton, MobileBottomNav fixes.

---

## Technical notes

- **Navigation source of truth**: rewrite the section list in `src/components/layout/AppSidebar.tsx` and `src/components/layout/MobileBottomNav.tsx` to the new structure. Gate the legacy operational sections behind an "Admin → Operations" submenu visible only when `roles.includes("admin")` (or other admin roles via existing `roles.ts`).
- **Routing**: in `src/App.tsx`, add new routes (`/academy`, `/my-learning`, `/catalog`, `/announcements`, `/profile`) that render new lightweight page components. Existing routes stay.
- **Home swap**: `/` currently maps to operational Dashboard. Change it to a new `WelcomeHome` component for all signed-in users; add an admin shortcut to `LeadershipDashboard`.
- **Page titles**: update `pageTitles` map in `AppLayout.tsx`.
- **Access**: keep current temporary unlock in `navigationAccess.ts` (everything viewable). No backend role changes.
- **No file deletions** — just new files and edits to nav + App routes + Home.

## Files to add
- `src/pages/WelcomeHome.tsx`
- `src/pages/academy/AcademyHome.tsx` (wrapper around existing `OperationsAcademy` content, restyled)
- `src/pages/MyLearning.tsx`
- `src/pages/TrainingCatalog.tsx`
- `src/pages/Announcements.tsx` (top-level wrapper)
- `src/pages/Profile.tsx`

## Files to edit
- `src/App.tsx` — add new routes, swap `/` to `WelcomeHome`
- `src/components/layout/AppSidebar.tsx` — new nav structure, admin group
- `src/components/layout/MobileBottomNav.tsx` — new 5 tabs
- `src/components/layout/AppLayout.tsx` — page titles
- (Optional) light style tweaks on `ResourceHub` and `AnnouncementsFeed`

## Out of scope
- Any database / RLS / edge-function changes
- Removing or renaming existing pages/routes
- Re-locking by role (kept as-is per current temporary unlock)
