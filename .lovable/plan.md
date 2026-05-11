## Goal

Right now the HR Journey Editor (`/admin/journey-editor`) lets HR edit each phase (Phase 0 Welcome, Week 1, etc.) and the modules inside them — but the **`/onboarding` landing page itself** (the "Your First 5 Weeks at Blossom" hero on `Journey.tsx`) is hardcoded and can't be changed. This plan makes that hero editable too.

## What gets editable

On the `/onboarding` page hero, HR will be able to change:

- The eyebrow chip ("Your Blossom Journey")
- The main heading ("Your First 5 Weeks at Blossom") — including the gradient-highlighted word
- The subheading paragraph ("A guided journey through who we are…")

Stat strip, progress bar, phase rail, and timeline stay automatic (driven by user data).

## How it works

1. **Storage** — reuse the existing `journey_phase_overrides` table by adding one synthetic row with `phase_id = '__home'`. Columns we already have (`title`, `objective`) cover heading + subheading; we add a new `eyebrow text` column for the chip and a `title_highlight text` column for the gradient word. Existing RLS (HR/Admin/Training Admin write, all authenticated read) already covers the new fields.

2. **Editor UI** — add a new "Journey home" tab at the front of the JourneyEditor tab list (before Phase 0). It contains a single card with inputs for Eyebrow, Title, Highlighted word, and Subheading, plus a Save button using the same upsert pattern as phase saves.

3. **Hook** — extend `useJourneyOverrides` so the home overrides row is exposed via a new `homeOverride` value.

4. **Live page** — `Journey.tsx` reads `homeOverride` and renders the hero using `eyebrow ?? "Your Blossom Journey"`, `title ?? "Your First 5 Weeks at"` + `title_highlight ?? "Blossom"` (the highlighted span), and `objective ?? <existing default>`. Realtime subscription already in the hook means edits propagate without refresh.

## Technical details

```text
DB migration
  ALTER TABLE journey_phase_overrides
    ADD COLUMN eyebrow text,
    ADD COLUMN title_highlight text;

useJourneyOverrides
  homeOverride = phaseOverrides["__home"] | null

Journey.tsx hero
  eyebrow chip   → homeOverride?.eyebrow ?? "Your Blossom Journey"
  h1             → homeOverride?.title ?? "Your First 5 Weeks at "
                   <span gradient> homeOverride?.title_highlight ?? "Blossom" </span>
  paragraph      → homeOverride?.objective ?? "A guided journey through…"

JourneyEditor.tsx
  New first <TabsTrigger value="__home">Journey home</TabsTrigger>
  Card with 4 inputs + Save (upsert into journey_phase_overrides on phase_id='__home')
```

## Files touched

- `supabase/migrations/<new>.sql` — add 2 columns to `journey_phase_overrides`
- `src/hooks/useJourneyOverrides.tsx` — expose `homeOverride`
- `src/pages/admin/JourneyEditor.tsx` — add "Journey home" tab + form
- `src/pages/onboarding/Journey.tsx` — consume overrides in hero

No other phase/module behavior changes.
