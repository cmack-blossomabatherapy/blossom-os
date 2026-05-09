## Goal

Transform Blossom Academy into an onboarding-gated, mission-driven experience. New employees must complete a structured onboarding journey (Welcome → Mission/Vision → Core Values → required training → final check) before the rest of the platform unlocks. Nothing existing is removed — we wrap and gate.

## Approach (non-destructive)

Reuse the existing `AcademyGate` + `useAcademyComplete` plumbing (already tracks required-module completion via `academy_enrollments` + `academy_progress`). We extend that signal into an app-wide **OnboardingGate** instead of building a parallel system.

No destructive migrations. We add (additive only):
- `profiles.onboarding_status` (`not_started | in_progress | completed`, default `not_started`)
- `profiles.onboarding_completed_at` (timestamp, nullable)
- `profiles.onboarding_certificate_id` (text, nullable)
- `onboarding_acknowledgements` table (user_id, key, acknowledged_at) with RLS
- A trigger that flips `onboarding_status` → `completed` when `useAcademyComplete` criteria are satisfied (mirrored server-side via existing `academy_enrollments.status`)

Admins, HR, exec, ops_manager, training_admin keep their existing bypass.

## New routes & pages

```text
/welcome                  → WelcomeToBlossom (hero + Start Journey)
/onboarding               → OnboardingRoadmap (10-step guided journey)
/onboarding/mission       → MissionVision page
/onboarding/values        → CoreValues page (4 value cards)
/onboarding/team          → Meet the Team (reuses existing team data)
/onboarding/how-it-works  → How Blossom Academy Works
/onboarding/final-check   → Final Knowledge Check (uses existing quiz infra)
/onboarding/complete      → Congrats + certificate
/help                     → Help & Support (already have contact pieces; add a hub)
```

Existing routes (Training Catalog, Resource Hub, Departments, Growth Pathways, Announcements, etc.) stay as-is but get wrapped.

## Gating layer

New `src/components/auth/OnboardingGate.tsx`:
- Reads `useOnboardingStatus()` (extends `useAcademyComplete`)
- If complete or bypass → render children
- If not → render `LockedStateCard` (glass card, lock icon, % progress, next step, "Continue Onboarding" button)

New `src/hooks/useOnboardingStatus.ts`:
- Returns `{ status, percent, nextStep, requiredItems, completedItems, bypass, loading }`
- Source of truth: existing academy enrollment + new acknowledgements table

Wrap in `src/App.tsx`:
- Allow-list routes (welcome, onboarding/*, required training course pages, profile, help) render normally
- All other routes get wrapped with `<OnboardingGate>`

## Navigation

`src/components/layout/AppSidebar.tsx` + `MobileBottomNav.tsx`:
- New helper `useNavMode()` returns `"onboarding" | "full"` based on status + bypass
- Onboarding mode shows: Home, Onboarding, Required Training, Help, Profile
- Full mode shows existing nav unchanged
- Locked items in onboarding mode aren't hidden in full sidebar — they show with a small lock chip and route to `/onboarding` (so leadership preview still works)

## Home page behavior

`src/pages/Index.tsx` (or current home): branch on onboarding status.
- Incomplete → `OnboardingHome` component: Welcome hero, progress card, next required step, required courses list, required acknowledgements, limited resources, help card
- Complete → existing home unchanged

## New components

```text
src/components/onboarding/
  WelcomeHero.tsx
  OnboardingProgressCard.tsx
  OnboardingRoadmap.tsx
  RoadmapStep.tsx
  LockedStateCard.tsx
  MissionCard.tsx
  VisionCard.tsx
  ValueCard.tsx
  CompletionCertificate.tsx
  CongratsModal.tsx
src/components/auth/OnboardingGate.tsx
src/hooks/useOnboardingStatus.ts
src/lib/onboarding/
  steps.ts          (canonical 10-step definition)
  acknowledgements.ts (api: list, ack, has)
  certificate.ts    (PDF generation reuses existing onboardingChecklistPdf util)
```

## Admin controls

Extend existing `OnboardingCenter.tsx` and `AcademyEditor.tsx`:
- New "Required for onboarding" toggle on courses + resources (additive column, renders as switch)
- Per-user onboarding panel: status, %, manually mark complete, reset, "Preview as locked user" toggle (sets a session flag the gate respects)
- Onboarding paths by role (reuse existing `academy_enrollments.path`)

## Profile

`src/pages/Profile.tsx`: add Onboarding section — status badge, progress bar, completion date, certificate download button, completed required courses, missing items.

## Technical details

- All locked-state UI uses semantic tokens (`bg-card`, `text-foreground`, gradient `--gradient-brand`) — no hardcoded colors
- Certificate uses existing PDF util pattern from `src/lib/hr/onboardingChecklistPdf.ts`
- Acknowledgements table: `user_id uuid`, `key text`, `acknowledged_at timestamptz default now()`, unique(user_id, key); RLS: users can read/insert their own, admins can read all
- Bypass roles unchanged: `admin, training_admin, hr, hr_admin, hr_manager, exec, ops_manager`
- `useOnboardingStatus` is memoized + cached via React Query if available, else simple state
- No changes to auth flow, Supabase client, or existing course/track data

## Out of scope

- Rebuilding any existing page
- Changing existing course/track schema
- Removing any nav items in full mode
- Email/notification triggers on completion (future)

## Rollout order

1. Migration: add profile fields + acknowledgements table + RLS
2. `useOnboardingStatus` hook + `OnboardingGate` component + `LockedStateCard`
3. Onboarding pages (Welcome, Mission, Vision, Values, Roadmap, Complete)
4. Wrap routes in `App.tsx` + nav mode switch
5. Home branch + Profile section
6. Admin toggles + per-user controls
7. Certificate generation
