# State Director — Functionality Pass 1 QA

_Updated: 2026-07-02_

This pass makes the State Director role fully clickable, functional, and
persisted from the current baseline. Nothing was rebuilt; the pass targets
route/menu correctness, a real State Director operating store, persisted
escalations + tasks + activity, and honest snapshot access into department
workspaces.

## Absolute rules preserved

- Training Academy for `state_director` and `assistant_state_director` still routes to **`/training`** (unchanged).
- **`/reports` remains the single canonical Reports page.** No role-scoped Reports page was added. The State Director menu contains exactly one Reports entry.
- BCBA Productivity Report V3 still visible to `state_director` inside `/reports` (`src/lib/os/reportsCatalog.ts`).
- Super Admin surfaces, Login Vault, and NFC Badge Management were not moved.
- State Directors are not the execution owner for other departments — they see snapshots and can create escalations, follow-up tasks, and add notes; department teams still own their normal work.

## Menu / route matrix

| Menu item                       | Path                        | Route target                                                         | Live for state_director | Notes |
| ------------------------------- | --------------------------- | -------------------------------------------------------------------- | ----------------------- | ----- |
| State Dashboard                 | `/state-operations`         | `StateOperationsPage` (rewritten, store-backed)                      | ✅                       | Real KPIs + escalation/task previews + activity |
| State Health                    | `/state-operations`         | same                                                                 | ✅                       | Same page |
| State Escalations               | `/ops/state-escalations`    | `StateEscalationsPage` (rewritten, store-backed)                     | ✅                       | CRUD, filters, detail drawer |
| State Task Queue                | `/ops/tasks`                | `OperationalTasksPage` (rewritten, store-backed)                     | ✅                       | CRUD, filters, escalate, complete |
| State Staffing Snapshot         | `/ops/staffing`             | `OSStaffingWorkspace` (state_director + assistant_state_director in `allowedRoles`) | ✅ | Guard already includes both roles |
| State Intake Snapshot           | `/intake/dashboard`         | `IntakeWorkspaceLanding`                                             | ✅                       | Unguarded route (any signed-in role) |
| State Authorization Snapshot    | `/authorizations`           | `AuthorizationsRouter`                                               | ✅                       | Canonical workspace; `/ops/authorizations` also whitelisted for redirect landing |
| State Scheduling Snapshot       | `/ops/scheduling`           | Redirects → `/scheduling-workspace?bucket=coverage_risk`             | ✅                       | Added `/scheduling-workspace` to state_director + assistant live paths so the shell renders correctly after redirect |
| State Clinical Snapshot         | `/qa-team`                  | `OSQATeam`                                                           | ✅                       | Route is unguarded; assistant live paths also include it |
| Phone System                    | `/phone`                    | `PhoneDashboard` inside `BlockIntakeRoute`                           | ✅                       | State Director not blocked; execution still owned by Super Admin/HR/Marketing/Exec |
| Training Academy                | `/training`                 | Existing training academy                                            | ✅                       | Not migrated to `/academy` |
| Resource Library                | `/resource-library`         | Existing library                                                     | ✅                       | Unchanged |
| Reports                         | `/reports`                  | Canonical `ReportsHome`                                              | ✅                       | Only Reports link in menu |

No State Director menu item points to `/coming-soon`. Every path resolves to a mounted route or an intentional in-shell redirect.

## Route guard fixes (`src/pages/os/OSShell.tsx`)

`ROLE_SPECIFIC_LIVE_PATHS.state_director` now includes:
`/scheduling-workspace`, `/ops/authorizations`, `/ops/family-staffing-preferences`.

`ROLE_SPECIFIC_LIVE_PATHS.assistant_state_director` now includes the same three, plus `/qa-team`.

`src/App.tsx` already had `state_director` + `assistant_state_director` in `allowedRoles` for `/ops/staffing`, `/ops/family-staffing-preferences`, `/state-operations`, `/ops/state-escalations`, `/ops/tasks`. No further guard changes needed for pass 1.

## State Director operating layer

New module: **`src/lib/os/stateDirector/`**

- `types.ts` — `StateProfile`, `StateMetrics`, `Escalation`, `OpsTask`, `ActivityEvent`, `StateDirectorSnapshot`, `StateDirectorAdapter`.
- `stateDirectorSeed.ts` — GA, NC, TN, VA, MD profiles, per-state metrics, seed escalations/tasks/activity. Used only on first hydration; user mutations persist.
- `stateDirectorStore.ts` — pluggable adapter, default is `localStorage`. Full CRUD:
  - `createEscalation`, `updateEscalation`, `addEscalationNote`, `resolveEscalation`, `reopenEscalation`
  - `createTask`, `updateTask`, `completeTask`, `escalateTask`, `addTaskNote`
  - Every mutation emits an `ActivityEvent` and recomputes per-state open counts.
  - `useStateDirectorSnapshot()` / `useStateDirectorView(stateFilter)` React hooks.
- `integrationAdapters.ts` — typed adapter contracts for CentralReach, CTM, Apploi, BloomGrowth. Stubs return neutral data so the UI cannot pretend integrations are live.

Swap point for Supabase persistence: `setStateDirectorAdapter(supabaseAdapter)`.

## Persisted actions available (all live in `src/pages/os/stateDirector/StateDirectorPages.tsx`)

- **State Operations (`/state-operations`)**: state selector, 12 KPI cards, state health table, department snapshot links, open-escalation preview, open-task preview, activity feed, quick actions to create task/escalation, click any row to edit.
- **State Escalations (`/ops/state-escalations`)**: search, state/status/priority filters, new escalation dialog, detail drawer (edit status/priority/owner/resolution, add notes, resolve, reopen).
- **Operational Tasks (`/ops/tasks`)**: search, state/status/priority filters, overdue toggle, new task dialog, detail drawer (edit status/priority/owner, add notes, escalate into a new escalation, complete).

Everything persists across reloads via `localStorage` (key `blossom.state_director.v1`) and syncs across browser tabs via the `storage` event. The UI updates in real time via `useSyncExternalStore`.

## Reports

No changes to the canonical `/reports` page. State Director report visibility is preserved via existing `visibleTo` arrays in `src/lib/os/reportsCatalog.ts` (34 entries reference `state_director`), covering:

- State Performance, Staffing Health, BCBA Performance, Authorization Performance / Expiration Risk / Bottlenecks / Operational Performance / Denials & Rework / Missing Documentation, Scheduling Health, BCBA Productivity Report V3, Client Lifecycle, Intake Performance, Authorization Utilization, Session Cancellation, and more.

## Manual QA — View As Role → State Director

1. Open the role switcher → **State Director**.
2. Confirm the sidebar shows the exact menu listed in the matrix above.
3. Click each menu item; every page must load inside the Blossom OS shell (no "coming soon" banner, no permission wall).
4. On `/state-operations`:
   - Change the state selector (leadership only).
   - Click **Escalation** → create one → confirm it appears in the "Open escalations" list and in `/ops/state-escalations`.
   - Click **Task** → create one → confirm it appears in the "Open tasks" list and in `/ops/tasks`.
   - Open an escalation row → change status/priority/owner, add a note, **Mark resolved** → confirm activity event added.
   - Open a task row → **Escalate** → confirm a new escalation appears and the task status becomes `escalated`; **Complete** another task → confirm activity event.
5. Refresh the page → all mutations survive (localStorage).
6. Open `/reports` → confirm it is the only Reports link and BCBA Productivity Report V3 is present.
7. Open `/training` → confirm the State Director Training Academy journey still loads (unchanged content).
8. Open `/ops/staffing`, `/ops/scheduling`, `/authorizations`, `/intake/dashboard`, `/qa-team`, `/phone` → each renders normally in the Blossom OS shell.

## Integration readiness

`src/lib/os/stateDirector/integrationAdapters.ts` defines typed contracts for:

- **CentralReach** — clients, authorized/scheduled/delivered hours, cancellations, supervision, parent training, PR risk, auth expirations.
- **CTM / Jivetel** — state call volume, missed calls, average handle time.
- **Apploi** — recruiting pipeline.
- **BloomGrowth** — L10 open/overdue accountability items.

No live network calls; the stubs return empty/neutral data so consumers do not depend on integrations that are not connected yet.

## Known limitations (deferred to later passes)

- State Director snapshot mode inside `OSStaffingWorkspace`, `IntakeWorkspaceLanding`, `AuthorizationsRouter`, `SchedulingWorkspace`, `OSQATeam`, and `PhoneDashboard` is currently visibility-only (no per-role snapshot toggle inside those workspaces). The State Director menu opens them cleanly, but adding a `?view=state-director` snapshot pane inside each is a separate pass so we don't destabilize the existing department teams' workflows.
- Supabase persistence for `state_ops_*` tables is scaffolded via the adapter contract; no migration is applied in this pass. The store keeps parity with the eventual schema so a Supabase adapter can be dropped in without UI changes.
- Activity timeline is scoped to State Director mutations; other departments' activity is not yet aggregated here.