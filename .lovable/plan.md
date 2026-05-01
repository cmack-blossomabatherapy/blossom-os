
# Premium Training & Resource Hub for RBTs & BCBAs

A new role-aware experience inside the HR Suite that guides RBTs and BCBAs through their lifecycle at Blossom — from training → matching → first case → active. Designed to feel like a modern onboarding platform, not a document library.

## Scope & access

- **New route:** `/hr/journey` (the "Training & Resource Hub" experience)
- **Visible only to RBTs and BCBAs.** Detection is by job title on the user's `employees` row (RBT, Registered Behavior Technician, BCBA, Board Certified Behavior Analyst). Admins can preview via `?as=rbt-uncertified | rbt-certified | rbt-ready | rbt-active | bcba`.
- A "Training Hub" entry is added to the HR sidebar group (only rendered when current employee is RBT/BCBA, or admin).
- Existing pages (`/hr/training`, `/training`, `/hr/resources`, etc.) are untouched.

## Page structure (single page, sectioned)

```text
┌─────────────────────────────────────────────────────────┐
│  HERO — Welcome, role chip, current stage, % progress,  │
│         "Next Step" CTA                                 │
├─────────────────────────────────────────────────────────┤
│  LIFECYCLE TRACKER — horizontal stepper (role-specific) │
│         click step → side sheet with details            │
├─────────────────────────────────────────────────────────┤
│  CURRENT STAGE PANEL  │  NOTIFICATIONS / REMINDERS      │
│  (what to do now,     │  (overdue, ready-to-match,      │
│   who you're with,    │   case assigned, start date)    │
│   "Mark Complete")    │                                 │
├─────────────────────────────────────────────────────────┤
│  TRAINING MODULES — card grid (Ethics, Notes,           │
│         Methodology, Shadowing). Status + Start.        │
├─────────────────────────────────────────────────────────┤
│  MATCHING / CASE — appears at "Ready" or later          │
│  (Sarah Uhr, case manager, BCBA, caregiver, start date, │
│   first-session prep checklist)                         │
├─────────────────────────────────────────────────────────┤
│  RESOURCE HUB — curated card grid                       │
│  (RBT Resource Hub Drive, BACB, Competency guide, …)    │
├─────────────────────────────────────────────────────────┤
│  PROGRESS TRACKING — % complete, completed/remaining,   │
│         estimated time to completion                    │
└─────────────────────────────────────────────────────────┘
```

Lifecycle stepper visual:

```text
●───●───●───◐───○───○───○───○
40hr  Orient Comp Exam Core Match Case Active
 ✓     ✓    ✓   ●   ○    ○    ○    ○
                ↑ you are here
```

## Lifecycle definitions

- **RBT (uncertified):** 40 Hour Course → Orientation (Rebecca Bailey) → Competency Assessment → RBT Exam → Core Trainings (Ethics, Session Notes, Methodology) → Ready for Matching → Assigned to Case → Active
- **RBT (certified):** Orientation → Shadow / Session Notes Training → Lead RBT Evaluation → Ready for Matching → Assigned to Case → Active
- **BCBA:** Orientation → System Training → Clinical Standards → Case Assignment → Active

Each step carries: id, label, description, owner contact, required actions (checklist), status.

## Demo personas (mock, in-memory)

Provided via a `getJourneyForViewer()` helper keyed by employee/email or `?as=` override:
- **Maya Cohen — RBT (uncertified):** halfway through 40hr, competency pending
- **Jordan Reed — RBT (certified):** orientation done, shadowing
- **Priya Patel — RBT (ready):** all training done, awaiting Sarah Uhr match
- **Devon Banks — RBT (active):** matched to BCBA Rachel Greenspan, caregiver "Lopez Family", start date set
- **Dr. Alex Stone — BCBA:** in system training

State is stored in `localStorage` per user (`blossom.journey.<userId>`) so "Mark Complete" persists across reloads. No DB schema changes.

## UX details

- Apple-clean layout, soft Blossom-green gradients in hero and active step, rounded-2xl cards, generous whitespace
- Lifecycle steps clickable → right-side `Sheet` with description, owner, checklist, "Mark Complete"
- Smooth `transition-all` on step nodes; subtle hover lift on cards
- Progress bars use existing `<Progress>` token color
- Empty/locked future stages dimmed with lock icon
- Mobile: stepper becomes vertical timeline, cards stack
- Uses semantic tokens only (`bg-primary`, `text-foreground`, gradients via `--gradient-primary` if present, otherwise `from-primary/10 to-primary/5`)

## Files to add

- `src/data/journey.ts` — types, lifecycle definitions per role, demo personas, viewer resolver, localStorage progress helpers
- `src/pages/hr/JourneyHub.tsx` — the page
- `src/components/journey/HeroBanner.tsx`
- `src/components/journey/LifecycleTracker.tsx` (+ `StepDetailSheet`)
- `src/components/journey/CurrentStagePanel.tsx`
- `src/components/journey/TrainingModulesGrid.tsx`
- `src/components/journey/MatchingPanel.tsx`
- `src/components/journey/ResourceGrid.tsx`
- `src/components/journey/NotificationsPanel.tsx`
- `src/components/journey/ProgressSummary.tsx`

## Files to edit

- `src/App.tsx` — add `<Route path="/hr/journey" element={<JourneyHub />} />` (no permission gate; component handles role check + admin preview)
- `src/components/layout/AppSidebar.tsx` — add "Training Hub" link under HR for RBT/BCBA/admin viewers (conditional)

## Out of scope

- No DB migrations, no edge functions, no real assignment/matching mutations
- Existing `/hr/training`, `/training`, `/hr/resources` pages unchanged
- No changes to permissions table
