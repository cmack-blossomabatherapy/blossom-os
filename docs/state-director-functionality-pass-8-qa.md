# State Director Functionality — Pass 8 QA

## What changed

- **Every primary State Director mutation is now awaitable.**
  `updateEscalation`, `addEscalationNote`, `resolveEscalation`,
  `reopenEscalation`, `updateTask`, `completeTask`, `escalateTask`, and
  `addTaskNote` are now `async` and return
  `StateDirectorMutationResult<T> = { ok, error?, item? }`.
  Optimistic UI is preserved, but callers now see the real persistence
  outcome.
- **Detail dialogs await database persistence.** Task and Escalation
  detail dialogs in `StateDirectorPages.tsx` now track a local `busy`
  state, show loading labels (`Saving...`, `Adding...`, `Resolving...`,
  `Reopening...`, `Escalating...`, `Completing...`), disable
  duplicate clicks, and only close the dialog / clear the note field
  when the returned result is `ok: true`. Failed writes keep the dialog
  open and surface the real error toast via the existing failure helper.
- **Task escalation is fully honest.** `escalateTask(...)` awaits both
  the companion escalation insert AND the original task row update
  (`status: escalated`, `related_escalation_id`). Either failure returns
  `{ ok: false, error }`, marks the row with `persistError`, and does
  not let the UI close as if the escalation succeeded. The activity
  mirror insert remains a background write (non-critical) and is never
  used to claim primary success.
- **CentralReach readiness de-dupe.** `createStateCentralReachOutboxItem`
  now checks for an active row on the same `(state_code, source_type,
  source_id)` triple before inserting. Active statuses are
  `not_connected | pending | ready | error | failed`. If a match exists
  the service returns `{ ok: true, id: existing.id, alreadyQueued: true }`,
  the readiness button surfaces the friendly toast
  *"Already in CentralReach readiness queue"*, and no duplicate row is
  created.
- **DB safety net.** A new migration adds a partial unique index
  `uniq_state_cr_outbox_active_source` on
  `(state_code, source_type, source_id)` where
  `source_id IS NOT NULL AND sync_status IN
  ('not_connected','pending','ready','error','failed')` so even a raw
  insert cannot create duplicate active queue rows.
- **Readiness status vocabulary expanded.** The `sync_status` CHECK
  constraint now accepts `not_connected | pending | ready | synced |
  error | failed`. New user-created readiness rows default to
  `pending`, not `not_connected`. The panel maps legacy `not_connected`
  to *pending* and legacy `error` to *failed* for display, so existing
  rows keep working.
- **Menu-to-route regression coverage.** `stateDirectorFunctionalityPass8.test.ts`
  asserts every State Director and Assistant State Director menu path
  is either mounted or redirected in `App.tsx`, is present in
  `ROLE_SPECIFIC_LIVE_PATHS`, and that `/ops/scheduling` still
  redirects to `/scheduling-workspace` for both roles.
- **Encoding guard.** The pass 8 test suite also fails if any known
  mojibake sequence appears in State Director source files or this QA
  doc.

## What was preserved

- `/reports` remains the only Reports hub. Both SD and ASD menus
  contain exactly one Reports item pointing at `/reports`. No
  `/state-director/reports` or `/assistant-state-director/reports`
  route was added.
- BCBA Productivity Report V3 remains available in the shared Reports
  catalog.
- `/training` remains the State Director training journey.
- State Director Phone System access preserved.
  Assistant State Director still does NOT have `/phone` in their menu.
- `SendToStateSupportButton`, `LinkedContextPanel`,
  `DailyHealthNotesPanel`, manual metrics dialog, and the
  CentralReach readiness panel behavior all preserved.
- No Monday or Make.com references introduced; no fake CentralReach
  sync or *Sync now* button.

## Which writes are now awaitable

| Store method              | Awaited primary write(s)                                            |
| ------------------------- | ------------------------------------------------------------------- |
| `createEscalation`        | escalation row insert                                                |
| `updateEscalation`        | escalation row update                                                |
| `addEscalationNote`       | note insert                                                          |
| `resolveEscalation`       | escalation row update (`status=resolved`, `resolved_at`, resolution) |
| `reopenEscalation`        | escalation row update (`status=open`)                                |
| `createTask`              | task row insert                                                      |
| `updateTask`              | task row update                                                      |
| `completeTask`            | task row update (`status=completed`, `completed_at`)                 |
| `escalateTask`            | escalation insert + original task update (both awaited)              |
| `addTaskNote`             | note insert                                                          |
| `createStateCentralReachOutboxItem` | de-dupe select + outbox insert                              |

Secondary activity-mirror writes (`sbInsertActivity`) remain
background best-effort and are never used to claim primary success.

## How CentralReach readiness de-dupe works

1. A director clicks *Send to CentralReach readiness* on a task or
   escalation.
2. The service runs a scoped SELECT for the same
   `(state_code, source_type, source_id)` restricted to
   `ACTIVE_CENTRALREACH_SYNC_STATUSES`.
3. If a row exists, the service returns
   `{ ok: true, id: existing.id, alreadyQueued: true }` — no insert.
4. If no row exists, an insert runs with `sync_status: 'pending'` (or
   the caller-provided override).
5. The button toasts either *"Already in CentralReach readiness queue"*
   or *"CentralReach readiness item created"*.
6. `bumpCentralReachReadiness()` refreshes the panel.
7. The DB-level partial unique index guarantees the same de-dupe rule
   even for future callers that bypass the service.

## Status display

| Stored value       | Displayed label |
| ------------------ | --------------- |
| `not_connected`    | pending         |
| `pending`          | pending         |
| `ready`            | ready           |
| `synced`           | synced          |
| `error`            | failed          |
| `failed`           | failed          |

CentralReach live API is still **not connected**. This queue is a
readiness / mapping layer, not a sync integration.

## Build result

`node ./node_modules/vite/bin/vite.js build` — passes.

## Test result

Focused State Director suite + Pass 8 guard — passes.

## Known limitations

- The de-dupe is scoped to *active* statuses. Once a row is `synced`,
  a new readiness item can be queued for the same source. That is
  intentional so re-work after a completed sync remains possible.
- Object-type inference for CentralReach payloads remains conservative;
  refinement is a future integration concern.