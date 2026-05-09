# Plan — "Your First 5 Weeks at Blossom"

Embed Shira Lasry's onboarding & training structure as the **core onboarding framework** inside Blossom Academy. We extend the existing `OnboardingGate` + `useOnboardingStatus` + `ONBOARDING_STEPS` plumbing — nothing existing is removed, no schema is broken, all gating, certificates, profiles, and admin controls remain intact.

## Approach (non-destructive)

The current onboarding is a 10-step linear journey (Welcome → Mission → Values → Team → How It Works → Required Role → Required Systems → Policies → Final Check → Complete). We **upgrade the model from "steps" to "phases → weeks → modules"** while keeping the existing storage keys backward compatible.

- `ONBOARDING_STEPS` stays exported (legacy) so nothing breaks.
- New `ONBOARDING_PHASES` becomes the canonical structure consumed by the new UI.
- `useOnboardingStatus` is extended to compute phase/week/module progress from the same `localStorage` state. Completion criteria for cert remains: all required modules done.
- Conditional logic (new state vs existing state) reads a new `onboardingPath` flag from storage (`new_state | existing_state`, default `existing_state`), settable from Profile + admin.

## Phase / Week structure

```text
Phase 0  Welcome to Blossom            (existing welcome/mission/values/team/how-it-works rolled in)
Phase 1  Week One — Foundation & Systems
           - Team Introductions
           - Leadership: Meet Chad Kaufman
           - Leadership: Meet Shira Lasry
           - Shadowing (transition employee + Gary Frank)
           - Systems: CentralReach
           - Systems: Monday.com
           - Systems: Internal Workflows
           - Systems: CR Backend with Eli Berman
           - [conditional] New State Track (Shadow Gary 3 days, state setup, market ops)
           - Week One Outcome
Phase 2  Week Two — Department Immersion
           - Intake, Recruiting, Case Management
           - Scheduling (Daylis), Marketing (Nick), Tracking & Reporting (Corey)
           - Weekly check-in with Chad, daily check-ins with Shira
           - Week Two Outcome
Phase 3  Week Three — Role Application
           - Path A: New State Operations (laws, credentialing, BCBA recruiting, infra, launch)
           - Path B: Existing State Operations (intake work, recruiting work, workflow, coordination)
Phase 4  Weeks Four & Five — Transition to Ownership
           - Intake / Recruiting ownership, KPIs, performance, accountability, leadership comms
Phase 5  Graduation
           - Certificate, completed milestones, unlocked academy
```

## Files

### New
```text
src/lib/onboarding/journey.ts            canonical PHASES / WEEKS / MODULES + path logic
src/lib/onboarding/leadership.ts         Chad / Shira / Gary / Daylis / Nick / Corey / Eli profiles
src/components/onboarding/JourneyTimeline.tsx     vertical timeline of 5 weeks + graduation
src/components/onboarding/PhaseHeader.tsx         hero header per phase
src/components/onboarding/WeekCard.tsx            week summary card (progress, outcome)
src/components/onboarding/ModuleRow.tsx           interactive module/checklist row
src/components/onboarding/LeaderCard.tsx          leadership intro card (avatar, role, message)
src/components/onboarding/ShadowingCard.tsx       shadowing tracker (assignee, checklist, notes)
src/components/onboarding/SystemTrainingCard.tsx  CR/Monday/etc card (video, SOP, Tango links)
src/components/onboarding/CheckInTracker.tsx      Chad weekly + Shira daily check-ins
src/components/onboarding/OutcomeCard.tsx         end-of-week milestone card
src/components/onboarding/PathSwitcher.tsx        new state vs existing state toggle (admin/profile)
src/pages/onboarding/Journey.tsx                  /onboarding (replaces Roadmap as default)
src/pages/onboarding/PhaseWelcome.tsx             /onboarding/phase/welcome
src/pages/onboarding/WeekOne.tsx                  /onboarding/week/1
src/pages/onboarding/WeekTwo.tsx                  /onboarding/week/2
src/pages/onboarding/WeekThree.tsx                /onboarding/week/3 (branches by path)
src/pages/onboarding/WeeksFourFive.tsx            /onboarding/week/4-5
src/pages/onboarding/Graduation.tsx               /onboarding/graduation (rich version of Complete)
```

### Edited
```text
src/lib/onboarding/steps.ts        keep legacy export, add re-export from journey.ts
src/lib/onboarding/storage.ts      add onboardingPath + module-level completion (string keys)
src/hooks/useOnboardingStatus.ts   compute per-phase/week/module progress; unchanged isComplete contract
src/App.tsx                        add new routes; existing /onboarding/* allow-list still wraps everything
src/pages/onboarding/Roadmap.tsx   redirect to /onboarding (Journey)
src/pages/onboarding/Complete.tsx  redirect to /onboarding/graduation
src/pages/onboarding/OnboardingHome.tsx  use journey progress + next module CTA
src/pages/Profile.tsx              show current phase, week, path; admin can set path / reset
src/components/onboarding/LockedStateCard.tsx  show "next module" with phase chip
```

## UI design

- **Vertical timeline** down the left with phase chips, week dots, and a moving progress indicator.
- **Phase header**: large gradient hero (`--gradient-brand`), phase number, title, objective, est. time.
- **Week pages**: stack of `WeekCard` → `ModuleRow`s. Each module shows icon, title, blurb, est minutes, optional leader card / system card / shadowing card / check-in tracker.
- **Leader cards**: avatar circle (initials), name, role, 1-line message, "Mark meeting complete" button.
- **System cards**: icon, name, "Watch training", "View SOP", "Tango walkthrough" buttons (placeholder links), completion toggle.
- **Shadowing card**: assignee name, checklist of observation goals, notes textarea (localStorage), "Mark shadowing complete".
- **Check-in tracker**: weekly grid for Chad, daily grid for Shira (7 cells), tap to mark done + note.
- **Outcome card**: green-tinted milestone card with checkmark icon, listed outcomes, "Continue to Week N+1".
- **Graduation page**: full-screen celebration, existing certificate, list of completed phases/weeks, "Enter Academy".

All semantic tokens — no hardcoded colors. Mobile-first single column; desktop two-column with sticky timeline.

## Conditional logic

- `onboardingPath`: `"existing_state" | "new_state"` stored in `localStorage.blossom.onboarding.v1.path`.
- Week 1 shows the **New State Track** module only when `path === "new_state"`.
- Week 3 renders **Path A** or **Path B** based on `path`.
- Profile page shows path with a switcher (admin/HR roles can change anytime; regular employees can change once before starting).

## Storage extension (backward compatible)

`OnboardingState` adds:
```ts
{
  completed: OnboardingStepId[];           // legacy step ids — kept
  modules: string[];                       // new: granular module keys e.g. "w1.systems.cr"
  acknowledgements: string[];
  notes: Record<string, string>;           // shadowing notes, check-in notes
  checkins: { chad: string[]; shira: string[] }; // ISO dates
  path: "existing_state" | "new_state";
  completedAt?: string;
  certificateId?: string;
}
```
Reading old state without these fields fills defaults. `markStepComplete` continues to work; new helpers `markModuleComplete(key)`, `setPath(p)`, `addCheckIn(who, date)`, `setNote(key, text)`.

`isComplete` criteria: all required modules across phases 0–4 done → flips `completedAt` + cert id (same trigger as before).

## Routes

```text
/onboarding                     Journey (timeline overview, default)
/onboarding/phase/welcome       Phase 0
/onboarding/week/1              Week One
/onboarding/week/2              Week Two
/onboarding/week/3              Week Three (branches)
/onboarding/week/4-5            Weeks Four & Five
/onboarding/graduation          Phase 5
```

Existing routes (`/onboarding/welcome`, `/onboarding/mission`, etc.) remain working — they're folded into Phase 0 cards and still navigable.

## Admin

Profile page (admin/HR): per-user onboarding panel already exists; we add:
- Path selector (existing/new state)
- Phase progress bars
- "Reset onboarding" (already exists)
- "Preview as locked" (already exists)

Out of scope for this round: per-user assignment from a separate admin page (existing `OnboardingCenter` keeps its current responsibilities; we surface the new structure in a follow-up).

## Mobile

- Timeline collapses to horizontal pill scroller at top.
- Week pages stack to single column.
- Module rows expand inline (no modals).
- Sticky "Continue" button at bottom.

## Out of scope

- Schema migrations (none needed; all client-side).
- Real video uploads (placeholder players).
- Per-user admin assignment UI beyond Profile.
- Email notifications on phase completion.

## Rollout order

1. `journey.ts` + `leadership.ts` (data model).
2. Extend `storage.ts` + `useOnboardingStatus.ts`.
3. Shared components (`PhaseHeader`, `WeekCard`, `ModuleRow`, `LeaderCard`, `ShadowingCard`, `SystemTrainingCard`, `CheckInTracker`, `OutcomeCard`, `JourneyTimeline`, `PathSwitcher`).
4. Pages (`Journey`, `PhaseWelcome`, `WeekOne`, `WeekTwo`, `WeekThree`, `WeeksFourFive`, `Graduation`).
5. Wire routes in `App.tsx`; redirect old `Roadmap`/`Complete`.
6. Update `OnboardingHome`, `LockedStateCard`, `Profile` to surface phase/week + path switcher.
7. QA on mobile viewport (430×777) and desktop.
