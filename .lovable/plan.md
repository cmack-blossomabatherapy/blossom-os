## Goal

Bring every RBT-facing training/onboarding surface in line with the new `/onboarding` design (gradient hero, `PhaseChipRail`, `PremiumJourneyTimeline`, `PhasePage`, `VideoIntroCard`, action checklists), and ensure **Phase 0 — Welcome to Blossom** is reachable by every signed-in employee regardless of role.

## Current state

Two parallel systems exist:

```text
NEW design (keep, extend)            OLDER RBT/BCBA flow (retire visual layer)
─────────────────────────────        ──────────────────────────────────────────
src/pages/onboarding/*               src/pages/hr/JourneyHub.tsx
src/components/onboarding/*          src/components/journey/* (HeroBanner, etc.)
src/lib/onboarding/journey.ts        src/data/journey.ts (rbt | bcba audience)
ONBOARDING_PHASES = welcome,
  w1, w2, w3, w45, graduation
```

`hr/JourneyHub` is gated by `roles.includes("rbt") || roles.includes("bcba")`. The Training Catalog (`src/pages/hr/Training.tsx`) and `RBTDetail` use generic shells but not the new journey visual language.

## Changes

### 1. Phase 0 = universal "Welcome to Blossom"

- In `src/lib/onboarding/journey.ts`, mark phase `welcome` as `universal: true` and add a small helper `isPhaseAvailableForRole(phase, role)` returning `true` for `welcome` regardless of role.
- In `src/pages/onboarding/OnboardingHome.tsx`, render the Welcome phase card for every signed-in user; gate only the role-specific phases (`w1`–`graduation`) behind RBT / BCBA.
- Add a top-of-sidebar entry "Welcome to Blossom" that points at `/onboarding/phase/welcome` and is visible to every authenticated user (update `src/lib/navigationAccess.ts`).

### 2. Refactor RBT training to new design

- **`src/pages/hr/JourneyHub.tsx`** — replace the `HeroBanner + LifecycleTracker + CurrentStagePanel + TrainingModulesGrid` layout with the new shell:
  - `OnboardingShell` wrapper
  - gradient hero (matches `/onboarding`)
  - `PhaseChipRail` listing the 5 onboarding phases
  - `PremiumJourneyTimeline` driven by `ONBOARDING_PHASES`
  - Reuse `VideoIntroCard`, `ActionChecklist`, `SystemTrainingCard`, `ShadowingCard` for module rendering
  - Keep admin overrides (resources, module overrides, checklist overrides) wired to the new components.
- **`src/pages/hr/Training.tsx`** (catalog) — keep functionality, restyle:
  - Wrap in the same gradient hero band used on `/onboarding`
  - Replace `GlassPageShell` look with the journey hero + glass panels palette already used by `PhasePage`
  - For the RBT track tab specifically, render an inline `PremiumJourneyTimeline` preview at the top so admins see the same shape RBTs see.
- **`src/pages/RBTDetail.tsx`** — leave staffing data intact; re-skin the page header to match the new gradient hero + chip pattern so a profile opened from training feels continuous. No data/business-logic changes.

### 3. Shared bits

- Lift the gradient hero into `src/components/onboarding/JourneyHero.tsx` (extracted from `OnboardingHome`) so all three pages render the same component.
- Remove the legacy `src/components/journey/HeroBanner.tsx` usage from `JourneyHub` (file stays for now in case other screens import it).

### 4. Verification

- Sign in as a non-RBT user → `/onboarding` shows Welcome card unlocked, other phases locked with role hint.
- Sign in as RBT → `hr/JourneyHub` renders new hero + timeline; Phase 0 marked complete after watching video.
- Training catalog RBT tab shows the embedded timeline preview and matches the new visual system.

## Out of scope

- Database/schema changes.
- Reworking `src/data/journey.ts` audience model — we just stop using its presentational components.
- Touching BCBA-only branching beyond what falls out of the shared refactor.
