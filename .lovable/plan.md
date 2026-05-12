# Unified Employee Operating System

Goal: replace the disconnected hardcoded Team Directory, static Org Chart, and separate user/employee records with **one centralized employee record** that powers every surface in Blossom Academy.

---

## 1. Central Data Model (Lovable Cloud)

Extend the existing `employees` table (and link to `profiles` / `user_roles`) with the fields required to power every surface. New columns added via migration:

**Identity & contact**
- `preferred_name`, `pronouns`, `phone`, `photo_url`, `bio`, `employee_code`
- `start_date`, `employment_type`, `active` (bool)

**Org structure**
- `department` (already), `sub_department`, `title`, `state`, `states_supported text[]`
- `manager_id uuid` → self-FK (`reports_to`)
- `leadership_level` enum: `executive | director | manager | lead | individual`

**Directory & visibility**
- `show_in_directory bool default true`
- `show_in_org_chart bool default true`
- `featured bool`
- `supports_onboarding bool`
- `leadership_badge text`
- `contact_visibility` enum: `public | internal | leadership`

**Onboarding & competencies**
- `onboarding_status` enum: `not_started | welcome | mission | orientation | training | complete`
- `unlock_level int` (0–5)
- `certifications text[]`, `competencies text[]`

System role / permissions stay in `user_roles` + a new `employee_permissions` jsonb for granular flags (hr, qa, admin, leadership, state_access[], department_access[]).

A view `v_employee_directory` joins everything for read-side simplicity.

---

## 2. Single Source of Truth Hook

`src/hooks/useEmployeeDirectory.ts` — Tanstack Query hook that:
- subscribes to `employees` realtime
- exposes `employees`, `byDepartment`, `byManager`, `leadership`, `onboardingSupporters`
- powers Directory, Org Chart, Profile, search, and admin manager

All current consumers of `src/data/teamDirectory.ts` switch to this hook. The static file becomes a **seed** used once for import.

---

## 3. Pages rewired (no UI redesign — they already look great)

- `src/pages/onboarding/Team.tsx` → reads from hook, same cinematic UI
- `src/pages/hr/OrgChart.tsx` → builds nodes/edges from `manager_id` graph, same ecosystem visuals
- `src/pages/hr/EmployeeDetail.tsx` (existing) → shows central record + onboarding progress + permissions
- `src/components/onboarding/JourneyHero.tsx` unlock chips driven by `onboarding_status`

---

## 4. Admin Org Structure Manager (new)

`src/pages/admin/OrgStructure.tsx` (Admin only). Apple/Notion-feel:
- Left: department tree (drag to reorder, create, rename)
- Center: hierarchy canvas — drag an employee card onto another to set `manager_id`
- Right: inspector for selected employee → title, department, badges, visibility toggles, permissions, onboarding unlock override

Uses `@dnd-kit/core` (already in project if present, else add). All mutations write to `employees` and trigger realtime updates everywhere.

Route: `/admin/org-structure`, gated by `admin` / `hr_admin`.

---

## 5. Onboarding Unlock Logic

`src/lib/onboarding/unlocks.ts`:
```
welcome      → unlocks: team-directory
mission      → unlocks: org-chart
orientation  → unlocks: department-training
complete     → unlocks: hr-tools
```
Admin override via `unlock_level` on the employee record. `navigationAccess.ts` consults this map.

---

## 6. Import / Seed

One-time edge function `seed-employees` (or migration with INSERTs) that takes the 44 teammates from `src/data/teamDirectory.ts` and upserts them into `employees` with departments, titles, leadership badges, onboarding-support flags, and reporting structure (Chad → execs → directors → ICs based on brochure hierarchy).

---

## 7. Technical Notes

- **RLS**: employees readable by any authenticated user (directory needs it); writable only by `admin` / `hr_admin`. `contact_visibility = 'leadership'` filtered in the view.
- **Realtime**: `ALTER PUBLICATION supabase_realtime ADD TABLE public.employees;`
- **Photos**: keep current bundled JPEGs as fallback; `photo_url` column for future uploads to a `team-photos` storage bucket.
- **Types**: regenerated automatically after migration.

---

## Build Order

1. Migration: extend `employees`, add enums, view, RLS, realtime
2. Seed employees from `teamDirectory.ts`
3. `useEmployeeDirectory` hook + types
4. Rewire Team Directory + Org Chart to hook
5. Employee profile page wiring
6. Onboarding unlock map + nav gating
7. Admin Org Structure Manager (drag-and-drop)
8. QA pass on mobile + desktop

---

## Scope Check

This is a large multi-step build (~8 substantive steps, schema + seed + 4 pages + 1 new admin page). Want me to proceed end-to-end, or split it — e.g. **Phase A** (1–6: data model + wiring everything to one source, no new admin UI) first, then **Phase B** (admin drag-and-drop manager) as a follow-up? Phase A alone delivers the “one connected ecosystem” feeling; Phase B adds the editing surface.
