## Pass 5b scope

Pass 5 says "the rendered pages must use the real tables." 5a built the candidate-identity foundation. 5b is the first batch of page rewrites — specifically the four Recruiting pages whose lists today are still computed from synthetic builders (`buildEscalations`, etc.) or from `useLegacyRecruitingCandidates`, even though the live hooks are imported.

I'm proposing four pages this pass, not all seventeen, because each page is 600–840 lines with deeply nested filters, drawers, chips, and AI panels that all read from the synthetic shape. Trying to swing all seventeen in one turn is how regressions sneak in.

### Pages in this pass

```text
src/pages/os/OSRecruitingEscalations.tsx      → render rows from useRecruitingEscalations
src/pages/os/OSRecruitingFollowUps.tsx        → render rows from useRecruitingFollowups
src/pages/os/OSRecruitingMessages.tsx         → render rows from useRecruitingMessages
src/pages/os/OSRecruitingStaffingNeeds.tsx    → render rows from useRecruitingStaffingNeeds
```

For each page:

- Replace the synthetic `buildXxx(candidates)` array (or legacy candidate-derived `base`) with the live hook's `items` as the primary list source.
- Map each live row to the page's existing card/row component using a thin `toViewModel(row, candidateLookup)` adapter so the UI stays visually identical.
- Use `useRecruitingCandidateLookup` (from 5a) to attach candidate name / state / role to live rows that only carry a `candidate_id`.
- Keep the existing filter chips, search, drawers, and AI panels intact — they operate on the view model, not the raw row.
- Empty state: when the live table has zero rows, render an honest "No live records yet" panel instead of falling back to synthetic data.
- Every row-level action already routes through `useRecruitingMutations`; no change there.

### New / updated tests

- `src/test/recruitingRenderedDataSourcePass5.test.ts` — for each of the four pages, assert the rendered list reads from the live hook's `items` (not from `buildXxx` and not from `useLegacyRecruitingCandidates`).
- Update `src/test/recruitingNoLocalOnlyWorkflowPass3.test.ts` only if a removed symbol breaks it.

### Out of scope (deferred)

- The 13 board pages (Offers / Background / Orientation / Onboarding / Interviews / RBT / BCBA / Pipeline / Workspace / Team / Performance / Resources / Training Academy). Their boards already persist through `runPageStageMove` from 5a; rewriting them to render from live child tables is **Pass 5c**.
- Deleting/redirect-collapsing `src/pages/Recruiting.tsx` and `src/pages/RecruitingDashboard.tsx` — that's the **Pass 5d** cleanup with `recruitingLegacyDemoPagesPass5.test.ts`.

### Technical notes

- `recruiting_escalations` has fewer columns than the synthetic `Esc` shape, so view-model fields like `operationalImpact`, `staffingImpact`, and `leadership` get derived from `severity` + `status` + age, with honest defaults rather than fabricated values.
- The "stage" chips on Escalations / Followups map to `status` on the live tables (`Open`, `In Progress`, `Resolved`, `Done`); `setStageMap` becomes optimistic on top of the live row's status and persists via `mutations.resolveEscalation` / `mutations.resolveFollowup` / `mutations.snoozeFollowup`.
- Messages page swaps `buildMessages(candidates)` for `useRecruitingMessages()` and pages by `sent_at`. `markMessageRead` / `markMessageHandled` already wired.
- Staffing Needs swaps the legacy candidate-derived list for `useRecruitingStaffingNeeds` items; `markStaffingNeedWorking`, `linkCandidateToStaffingNeed`, `closeStaffingNeed` already wired.

### Verification

- `bunx vitest run src/test/recruitingRenderedDataSourcePass5.test.ts src/test/recruitingApploiIdentityPass5.test.ts src/test/recruitingNoLocalOnlyWorkflowPass3.test.ts` passes.
- `tsgo` is clean on the four edited pages.
- Manual: each page loads with the live table empty and shows the honest empty state, then shows new rows when records exist.
