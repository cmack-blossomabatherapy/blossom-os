## Problem

On `/training/welcome`, the 7 Welcome to Blossom module cards (Welcome Video, Mission & Vision, Core Values, Meet the Team, How Blossom Works, Letter from Chad, Letter from Shira) are display-only chips. Tapping a card — and tapping any "Start"-style cue — goes nowhere. The full written content for every one of those 7 modules already exists further down the same page, but there is no link from the card rail to the section, and there is no per-module Mark Complete control.

To hand this off today, every module needs a working Start button that lands the learner directly on its content, plus an explicit Mark Complete control so the existing onboarding progress (`status.modulesComplete` via `markModuleComplete(...)`) actually advances.

## What to change (scoped to `src/pages/os/OSWelcomeToBlossom.tsx`)

1. **Anchor every module section** by adding stable `id` attributes that match the 7 module ids:
   - `welcome-video-from-blossom` → existing welcome video section
   - `welcome-mission-vision` → Mission & Vision section
   - `welcome-core-values` → Core Values section
   - `welcome-meet-the-team` → Meet the Team section
   - `welcome-how-blossom-works` → How Blossom Works section
   - `welcome-letter-chad` and `welcome-letter-shira` → individual letter articles inside the Leadership Letters section (each `<article>` gets its own id; the two cards link to those)

2. **Make each of the 7 module cards in the rail a real Start control**, instead of a static `<li>`:
   - Render as a `<button>` (or an `<a href="#id">`) that scrolls the matching section into view (`scrollIntoView({ behavior: "smooth", block: "start" })`) and sets focus on it for accessibility.
   - Card shows: number, title, type chip, minutes, status (Complete vs Start/Continue), and an explicit `Start` / `Review` affordance with `ArrowRight`.
   - Use `data-testid="welcome-module-start-{id}"` so this stays testable.

3. **Add a per-module Mark Complete button** on each of the 7 sections (and keep the existing "Mark welcome reviewed" behavior for the video):
   - Button calls `markModuleComplete(m.id)` from `useOnboardingStatus`.
   - Disabled / swapped to "Completed" when `status.modulesComplete.includes(m.id)`.
   - Test id: `welcome-module-complete-{id}`.

4. **Keep the page's existing inline content as the source of truth** — no new routes, no new pages. The user explicitly asked for the Start button to "bring you to the page"; the content for all 7 modules already lives on this page, so the correct behavior is in-page navigation to each module's section.

5. **No change to permissions / role gating.** Super Admin (and every authenticated learner) already reaches `/training/welcome`. The user does not need to be linked to a learner enrollment to read the modules — only the launch-tracker progress requires that, which is a separate surface and out of scope for this fix.

## Out of scope (call out so we don't expand the work)

- No changes to the SD launch tracker, the day checklist, `OSTrainingDetail`, or `academyData`. The welcome modules are not academy `Training` records and should not be — they are universal Day-0 content that lives on `/training/welcome`.
- No DB schema changes. Per-module completion already writes through `useOnboardingStatus`.

## Verification

- Manually click each of the 7 cards → the page scrolls to that module's section.
- Click Mark Complete on each section → the matching rail card flips to "Complete" and the existing onboarding progress increments.
- Add/extend `src/test/welcomeToBlossomFinalize.test.ts` (or the closest existing welcome test) to assert: each module card has `data-testid="welcome-module-start-{id}"`, each section has the matching `id`, and a Mark Complete control exists per module.
- Run the full vitest suite — must stay green.
