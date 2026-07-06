
---

## Pass 7 addendum — verification repair

Pass 6 shipped the product changes correctly, but three route tests were
brittle: they asserted the literal string `assistant_state_director`
appeared on the same JSX line as the route, which broke as soon as those
routes were switched to the shared `OPERATIONS_AND_STATE_ROUTE_ROLES`
constant. Pass 7 repairs the verification layer without changing product
behavior.

### Fixed in Pass 7

- `src/test/assistantStateDirectorPass4.test.ts`,
  `src/test/stateDirectorAssistantPass5.test.ts`,
  `src/test/stateDirectorAssistantPass6.test.ts` — route checks now accept
  either an inline `assistant_state_director` literal OR a spread of the
  shared `OPERATIONS_AND_STATE_ROUTE_ROLES` constant, and separately assert
  the constant itself contains `assistant_state_director`. The tests still
  fail if Assistant State Director is removed from the actual allow list.
- New `src/test/operationsRoleConstants.test.ts` — guards the shape of
  `OPERATIONS_LEADERSHIP_ROUTE_ROLES` and `OPERATIONS_AND_STATE_ROUTE_ROLES`
  so unrelated roles (`rbt`, `bcba`, `marketing`, `hr`, `payroll`) can
  never be silently added to state-scoped ops surfaces.
- `src/lib/os/stateDirector/stateDirectorStore.ts` — persistence-contract
  doc block rewritten to state plainly: optimistic UI is allowed, but
  every primary write is awaited, failures surface through `persistError`
  and a destructive toast, and no primary write silently fakes success.
  The misleading `Best-effort Supabase persistence.` inline comment on
  the note-add path was replaced with an accurate comment.

### Preserved product decisions

- Assistant State Director is still not in `PhoneSystemRoute` ALLOWED.
- No role-specific Reports pages were added. `/reports` remains the only
  canonical Reports route (verified by the assistant menu test:
  exactly one `/reports` entry and no `/state-director/reports` /
  `/assistant-state-director/reports` routes).
- State Director retains full `/phone` access (Pass 5 correction stands).
- Training academy, State Director journey, and Super Admin behavior
  untouched.

### Validation commands (Pass 7)

```
bun run build
bunx vitest run \
  src/test/stateDirectorAssistantPass6.test.ts \
  src/test/stateDirectorAssistantPass5.test.ts \
  src/test/assistantStateDirectorPass4.test.ts \
  src/test/assistantStateDirectorPass3.test.ts \
  src/test/stateDirectorFunctionalityPass6.test.ts \
  src/test/stateDirectorFunctionalityPass5.test.ts \
  src/test/stateDirectorFunctionalityPass4.test.ts \
  src/test/stateDirectorFunctionalityPass1.test.ts \
  src/test/operationsRoleConstants.test.ts
```

### Results

- Production build: PASS.
- Targeted vitest run: **9 files, 83 tests, 83 passed, 0 failed**.
  - `stateDirectorFunctionalityPass1` — 11 passed
  - `stateDirectorFunctionalityPass4` — 8 passed
  - `stateDirectorFunctionalityPass5` — 9 passed
  - `stateDirectorFunctionalityPass6` — 7 passed
  - `assistantStateDirectorPass3` — 11 passed
  - `assistantStateDirectorPass4` — 12 passed
  - `stateDirectorAssistantPass5` — 9 passed
  - `stateDirectorAssistantPass6` — 13 passed
  - `operationsRoleConstants` — 3 passed

Assistant State Director is now at a real 100% readiness point for
route/menu/page verification, state scoping, shared reports, and
CentralReach-ready workflow structure.
# State Director Functionality — Pass 6 QA

## Summary
Pass 6 hardens the State Director role: manual state metrics are now editable in the UI,
the store comments match current behavior, department snapshot banners derive real counts
from page data, RLS noise in unit tests is eliminated via service mocking, and a
CentralReach readiness/outbox layer exists so a future integration has a clean hook.

## What changed
- **Store (`stateDirectorStore.ts`)**
  - Comment rewritten to describe current Pass 6 truth (Supabase-backed writes returning `{ok,error}`, live metrics with seed fallback, `not_connected` CR sync tag, outbox table).
  - New `refreshStateMetrics()` re-hydrates persisted metrics and merges them over the current snapshot, preserving seed fallback for states with no live row. `useRefreshStateMetrics()` hook wrapper exposed.
- **Manual metrics editor** (`StateDirectorPages.tsx`)
  - New `ManualMetricsDialog` and an `Update Metrics` button in the State Operations header.
  - Gated to `super_admin`, `executive_leadership`, `operations_leadership`, and `state_director` — Assistant State Director never sees the action.
  - State-scoped director is pinned to their assigned state; leadership must pick a specific state before save (else inline error).
  - Fields: health score/label, active clients, authorized/scheduled/delivered hours, staffing gaps, intake pipeline, auths <30d, clinical risks, recruiting needs, cancellation risk, aging blockers. Open escalations/tasks shown as derived read-only context.
  - Save calls `upsertStateMetric({ ..., source: "manual" })`, then `refreshStateMetrics()`. Sonner toast on success/failure; inline error preserved on failure — no silent success.
- **Snapshot banners** (Pass 5 gap fixed)
  - `OSStaffingWorkspace`: `openBlockers = getClientStaffingNeeds(clients).length`, `overdueCount = pending/suggested match count`, `topRisks` derived from open staffing needs, awaiting matches, clients without an RBT.
  - `OSSchedulingWorkspace`: `openBlockers = counts.needs_rbt + counts.coverage_risk + uncovered (CR)`, `overdueCount = atRisk (CR)`, `topRisks` from the existing counts.
  - `OSQATeam`: `openBlockers = needsReview + missingInfo`, `overdueCount = overdue`, `topRisks` from needsReview/overdue/escalations.
  - No page still uses the `"Snapshot counts not connected yet"` placeholder.
- **CentralReach readiness layer**
  - New table `public.state_centralreach_outbox` (leadership + state-scoped RLS mirroring `state_operational_metrics`).
  - New service helpers: `loadStateCentralReachOutbox`, `createStateCentralReachOutboxItem`, `updateStateCentralReachOutboxStatus`.
  - New `CentralReachReadinessPanel` rendered on State Operations. Panel plainly labels "Live CentralReach API is not connected yet."
- **Test cleanup (RLS noise)**
  - `stateDirectorFunctionalityPass1.test.ts` now `vi.mock`s `stateOperationsService` so store CRUD unit tests exercise the optimistic in-memory contract without hitting real Supabase RLS. `reportSaveFailure` no longer fires from these tests. Persistence UI behavior itself is unchanged in the app.

## Validation
- `npx vite build` — passes (48s). Existing chunk-size warning only.
- `npx vitest run` on the 12-file State Director suite — **12 files / 109 tests / all pass**. **No RLS violation stderr** during CRUD paths anymore.
- New `src/test/stateDirectorFunctionalityPass6.test.ts` — 7/7 pass. Covers refreshStateMetrics, upsertStateMetric wiring, editor role gating, real banner counts, CentralReach readiness layer presence, and unified `/reports` + `/training` for State Director.

## Preserved
- Single shared `/reports` (State Director menu still points at `/reports` via `STATE_TRAINING_AND_RESOURCES`).
- `/training` remains the State Director Training path.
- `PhoneSystemRoute` still allows `state_director` and blocks `assistant_state_director`.
- No AI menu additions, no Monday migration or Make.com language, no duplicate Login Vault / NFC pages, no rebuild.

## Remaining limitations
- **CentralReach itself is still not connected.** The readiness/outbox table and panel are the honest hook a future integration will use — rows say `not_connected` / `needs_mapping` / `manual_update_required`. Do not read this as a live sync.
- Manual metrics editor persists via Supabase (`state_operational_metrics`); it requires an authenticated user with the correct role scope at runtime.
- Auto-derived `openEscalations` / `openTasks` in the metrics editor are informational only; the persisted values still come from the metrics row itself and are updated on save.
