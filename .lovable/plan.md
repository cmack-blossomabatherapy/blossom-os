## Problem
In the Task Activity drawer, the "Status Changes" and "Related Communications" sections feel cramped and messy — the orange "Note - internal" pill overflows its card and collides with the section heading, the timeline dots don't align with their rows, and everything runs together without breathing room.

## Fix (visual only, no logic changes)
Rework `src/components/tasks/TaskActivityDrawer.tsx`:

1. **Header/meta block** — promote to a soft glass card with a status chip (colored dot + label) on the right instead of a plain "Current status:" line. Owner shows an avatar-initial circle. Timestamps use muted icons in a two-column layout.

2. **Status timeline** — replace the thin left rail with proper spacing: 14px indent, larger dots aligned to the transition row baseline, "from → to" rendered as two subtle pills with an arrow between, and the timestamp on its own muted line. Add a card wrapper so the timeline sits in a container instead of floating.

3. **Related communications** — fix the badge overflow. Move the type badge inline with the timestamp inside the card (never outside it), shrink to a rounded chip with a leading dot, and constrain long labels ("Note · internal" instead of "Note - internal" with a proper middle dot). Add `mt-3` between the heading and the first card so nothing hugs the header line.

4. **Consistent rhythm** — bump section spacing from `space-y-6` to `space-y-5`, standardize card padding to `p-4`, unify border color to `border-border/50`, and give each section header a small leading icon (Activity, MessageSquare) for scannability.

5. **Empty states** — soften the dashed-border boxes to a centered icon + one-line message inside a `bg-muted/20` card.

No data model, hook, or fetch behavior changes — this is purely the drawer's presentation layer.

## Files
- `src/components/tasks/TaskActivityDrawer.tsx` — restructure JSX and Tailwind classes for the header meta, timeline, communications list, and empty states.
