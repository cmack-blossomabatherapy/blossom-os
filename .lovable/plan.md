## What's happening

`/recruiting/interviews` renders a blank white page. That means a JavaScript error is being thrown during render and nothing is catching it (no route-level error boundary), so React unmounts the tree. I cannot reproduce it directly right now because the sandbox has no signed-in session, so the fix does two things in parallel: (1) make the page surface real errors instead of going blank, and (2) fix the fragile spots most likely to be throwing.

## Root-cause candidates I found while reading the code

`src/pages/os/OSRecruitingInterviews.tsx`:

- `const candidates = useMemo(..., [activeChip, search, state, role, recruiter, source])` — **missing `recruitingCandidates` in the deps**. The board, chips, and AI panel all read from `candidates`, so when data finally loads the memo never refreshes.
- `summary`, `todays`, `followUpQueue` all use `useMemo(..., [])` with `eslint-disable-next-line react-hooks/exhaustive-deps`. They freeze the empty first-render array forever.
- `summary.followUp` / board cards read `c.blockers.length` and `(c.tags ?? []).includes(...)`. If any candidate in `useLegacyRecruitingCandidates` returns a `blockers` value that isn't an array (e.g. from a partially-migrated row), `.length` throws and the whole page crashes to blank.
- `useLegacyRecruitingCandidates` fans across 7 realtime hooks; if any single row has an unexpected shape (e.g. `iv.status` undefined, `c.tags` non-array), the `.forEach` / `.filter` chain throws inside the memo — again, no boundary → blank page.

## Fix plan

### 1. Route-level error boundary so this never blank-screens again
- Wrap the `<Route path="/recruiting/interviews">` element in `src/App.tsx` with the existing `ErrorBoundary` (or a small local one if none is exported) that renders a friendly "Something went wrong on Interviews" panel with the error message + a Retry button.

### 2. Fix stale memo dependencies in `OSRecruitingInterviews.tsx`
- Add `recruitingCandidates` to the deps for `candidates`, `summary`, `todays`, `followUpQueue`.
- Remove the `eslint-disable-next-line react-hooks/exhaustive-deps` comments — they're masking the exact bug that leaves the board empty after data loads.
- Drop the unused `liveInterviews` / `toggleStep` destructures.

### 3. Harden `useLegacyRecruitingCandidates.ts` against bad rows
- Wrap the per-candidate `.map(...)` body in a try/catch that logs the offending candidate id and returns `null`, then `.filter(Boolean)` the result. One bad row can no longer take down the entire page.
- Coerce `c.tags` to `Array.isArray(c.tags) ? c.tags : []` before every `.includes` / `.find`.
- Guarantee `blockers` is always an array (already is, but assert with `[]` fallback where it's produced).

### 4. Defensive reads in the page component
- Replace `c.blockers.length` with `(c.blockers ?? []).length` in `summary.followUp` and `FollowUpCard`.
- Replace `(c.tags ?? []).includes` style reads similarly wherever raw fields are touched.

### 5. Verify
- Reload `/recruiting/interviews`. Expected outcomes:
  - If the underlying data error still exists, the error boundary shows the actual message instead of a blank page → we fix that specific field next.
  - If the crash was from one of the shapes covered in step 3, the page now renders with real interview data.
- Run the existing `recruitingRoleMenuSprint20` and `recruitingWorkspaceTabsPass8` tests to confirm no regression.

## Technical notes

- Files touched: `src/App.tsx`, `src/pages/os/OSRecruitingInterviews.tsx`, `src/hooks/useLegacyRecruitingCandidates.ts`, and possibly a tiny `src/components/errors/RouteErrorBoundary.tsx` if an equivalent doesn't already exist.
- No schema changes, no new tables, no data migrations.
- No behavior change to any other recruiting page — the mapper hardening is purely defensive.
