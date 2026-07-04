# State Director — Functionality Pass 2 QA

_Supersedes any earlier "Pass 1" QA doc that referenced localStorage as the source of truth._

## Current persistence truth

- Operational **tasks, escalations, notes, activity, and department handoffs** are backed by Supabase (`state_operational_tasks`, `state_operational_escalations`, `state_operational_notes`, `state_operational_activity`, `state_department_handoffs`).
- Local optimistic records and Supabase rows share the **same UUID** — `createTask`, `createEscalation`, and `escalateTask` all pass `id: created.id` into the Supabase insert; activity inserts pass `relatedId: created.id`.
- Realtime is enabled on all five tables; the store subscribes on first mount so every director sees the same live picture.
- `stateDirectorStore.ts` uses `createSupabaseBackedStateOperationsAdapter()` (renamed from the old `createLocalStorageAdapter`). **localStorage is not the source of truth.**
- Seed data (`stateDirectorSeed.ts`) still provides state **profiles and metrics** as fallback until a metrics source is wired. This is clearly labeled sample data and is not presented as CentralReach-live.

## CentralReach integration — honest status

- CentralReach is the clinical EMR / source of truth.
- Blossom OS State Ops records are **not** imported into CentralReach; they will link to CentralReach client context once the connector is live.
- The State Ops badge and dashboard footer say: _"CentralReach context: not connected yet — internal ops records will link to CentralReach client context once the connector is live."_
- No "pending import" or "import-ready" copy remains on the State Operations dashboard.

## Reports and Training preservation

- Reports remain **one canonical page** at `/reports`. There is no `/state-director/reports`.
- State Director menu has exactly one Reports entry, and it points at `/reports`.
- BCBA Productivity Report remains reachable inside `/reports`.
- State Director and Assistant State Director Training Academy items point at `/training` (the existing State Director training journey). RBT/BCBA training content was not touched.

## Manually verified paths (State Director + Assistant State Director)

- `/state-operations`
- `/ops/state-escalations`
- `/ops/tasks`
- `/ops/staffing`
- `/intake/dashboard`
- `/authorizations`
- `/ops/scheduling`
- `/qa-team`
- `/phone`
- `/training`
- `/resource-library`
- `/reports`

## Known remaining limitations (deferred to a future pass)

- State metrics table is not yet persisted; KPIs on the State Operations dashboard still come from seed data.
- Department handoff UI (`deliverHandoff`) is wired in the service layer but does not yet have a dedicated in-page dialog exposed on every department snapshot page — this is the next natural step.
- RLS helper functions (`user_is_leadership`, `user_state_code`, `user_is_state_scoped_role`) exist as SECURITY DEFINER; a follow-up pass will audit `search_path`, `REVOKE ... FROM PUBLIC`, and align every GRANT with an equivalent policy.
- CentralReach connector is not live; when it is, replace the "not connected yet" badge with a real per-record sync state.