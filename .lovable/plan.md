## Goal

1. On every role journey page (`/academy/path/:slug`), render the existing `WelcomeToBlossomCard` above the "Curriculum · Week-by-week journey" section so Phase 0 is always one click away — matching the main Training Academy home.
2. Since Welcome to Blossom now lives as its own persistent section above the curriculum, remove the "Welcome to Blossom" module/lesson from Day 1 of every role journey so it isn't duplicated. Day 1 becomes a role-specific first day (orientation to the role, not the company welcome).

## Files to change

### UI — add card once
- `src/pages/academy/TrainingPathDetail.tsx`
  - Import `WelcomeToBlossomCard` from `@/components/onboarding/WelcomeToBlossomCard`.
  - Render it as a new section directly above the `Curriculum / Week-by-week journey` block (around line 183), inside a `mt-10` wrapper. Show it for every journey (including RBT/BCBA) so behavior is uniform. Only skip when `!hasContent` is false — actually always render, since Welcome exists for every role.

### Data — strip Welcome to Blossom from Day 1
For each role academy file below, edit Week 1 · Day 1 only:
- Rename the day title from `"Welcome to Blossom + <Role> Role Orientation"` (or equivalent) to just the role orientation (e.g. `"Intake Role Orientation"`).
- Remove the `Welcome to Blossom` lesson entry (typically `w1d1-l1` with `kind: "Video"`, 20 min, title `"Welcome to Blossom"`).
- Renumber remaining lessons so IDs stay sequential (`w1d1-l1`, `w1d1-l2`, …) and update the day's `minutes` estimate accordingly (subtract 20).
- Remove `R.welcome` from Day 1's `resources` array if it's the only Welcome reference; leave any role-specific "welcome to intake/HR/etc." resources alone.
- Update the Day 1 `objectives`, `deliverables`, and `checkForUnderstanding` copy so it no longer says "Complete the existing Welcome to Blossom experience" / "Completed Welcome to Blossom" — replace with the role-orientation deliverable that follows.

Files to edit (all Day 1 only, current-state journeys):
- `src/lib/training/intakeAcademy.ts`
- `src/lib/training/recruitingAcademy.ts`
- `src/lib/training/authorizationsAcademy.ts`
- `src/lib/training/schedulingAcademy.ts`
- `src/lib/training/staffingAcademy.ts`
- `src/lib/training/hrAcademy.ts`
- `src/lib/training/credentialingAcademy.ts`
- `src/lib/training/qaAcademy.ts`
- `src/lib/training/caseManagerAcademy.ts`
- `src/lib/training/behavioralSupportAcademy.ts`
- `src/lib/training/assistantStateDirectorAcademy.ts`
- `src/lib/training/stateDirectorAcademy.ts`

Explicitly **not** touched (per prior scope rule): `rbtAcademy.ts` and `bcbaAcademy.ts` — RBT/BCBA journeys remain untouched. The universal Welcome card above the curriculum still appears on those pages via the shared `TrainingPathDetail.tsx` change.

### Readiness / launch checks
- `src/lib/academy/launchAssets.ts` currently asserts that Week 1 Day 1 title contains "welcome to blossom" (line ~140, 205). After removing Welcome from Day 1 titles this check would flip to "pending" for every role. Update the assertion so it treats the standalone Welcome to Blossom entry point (`/training/welcome`) as the source of truth instead of a Day 1 module title — the check becomes "Welcome to Blossom is available for every learner" and always resolves ready when `welcomeToBlossomContent` is present. The launch-readiness tests below then need to be adjusted to match.

### Tests to update
The following tests currently expect Welcome to Blossom inside Day 1 modules or Day 1 title strings. Adjust each expectation to (a) require `WelcomeToBlossomCard` to render on `TrainingPathDetail` and (b) require Welcome to Blossom to be absent from role Day 1 modules:
- `src/test/welcomeToBlossomHotfix.test.ts`
- `src/test/welcomeToBlossomFinalize.test.ts`
- `src/test/welcomeToBlossomContent.test.ts`
- `src/test/welcomeShellFix.test.ts`
- `src/test/sdDayOneReadiness.test.tsx`
- `src/test/sdWeek1LaunchReadiness.test.ts`
- `src/test/sdAssetCompletion.test.tsx`
- `src/test/leadershipReadiness.test.ts`
- `src/test/launchAssets.test.ts`
- `src/test/launchChecklistDoc.test.ts`
- `src/test/welcomeTrainingProgressBridge.test.ts`
- `src/test/trainingRedesignPass2.test.ts`
- `src/test/trainingVisualUpgradePass.test.ts`
- `src/test/trainingResourceNavigation.test.ts`
- `src/test/learnerAcademyHome.test.ts`
- `src/test/sdAcademyQaAuditPass.test.ts`

Any test that inspects the Day 1 first lesson id/title for "Welcome to Blossom" gets flipped: expect the first lesson to be role-specific, and add an assertion that the standalone Welcome entry point / card is still surfaced. Progress-bridge tests continue to point at `/training/welcome` and the `welcomeComplete` flag — that plumbing is unchanged.

### Progress / completion plumbing (unchanged)
`welcomeComplete`, `welcomeModuleId`, the `/training/welcome` route, `WelcomeToBlossomCard`, and `welcomeToBlossomContent.ts` all stay as-is. The Welcome journey remains a first-class experience — we're just stopping the duplicate module inside role Day 1 and giving it a persistent card on every journey page.

## Out of scope
- RBT and BCBA academies (untouched).
- Any change to `/training/welcome` itself or the welcome content.
- Onboarding surfaces outside the Training Academy.
