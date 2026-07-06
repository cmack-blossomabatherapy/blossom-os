# State Director Functionality — Pass 7 QA

## What changed

- **CentralReach readiness actions are now wired from the UI.**
  Task and Escalation detail dialogs on the State Director / Assistant
  State Director experience now include a **Send to CentralReach readiness**
  button that calls `createStateCentralReachOutboxItem(...)` in
  `src/lib/os/stateDirector/stateOperationsService.ts` and creates a row
  in `public.state_centralreach_outbox`.
- **Payload is honest.** Object type is inferred conservatively from linked
  refs (`client` → `authorization` → `schedule` → `lead` → `candidate` →
  `unknown`). Action type is `needs_mapping` when linked context exists,
  `blocked_missing_cr_id` when it does not. `centralreachExternalId` is
  only populated when a real value already lives in the row's metadata —
  no fake IDs.
- **State scoping enforced.** State Director / Assistant State Director
  can only queue readiness items for their assigned state. Cross-state
  attempts show a disabled button with the tooltip: *"You can only queue
  CentralReach readiness work for your assigned state."*
- **Panel refresh signal.** The `CentralReachReadinessPanel` now exposes
  `bumpCentralReachReadiness()` and re-loads via `useSyncExternalStore`
  whenever a new readiness item is created, so the new row appears
  immediately without a page refresh.
- **Panel shows an open count** ("N open" badge next to the title) and
  keeps the honest note that the live CentralReach API is *not connected*.
- **Route guard clarity.** Pass 4/5/6 assistant route tests now recognize
  the shared `OPERATIONS_AND_STATE_ROUTE_ROLES` constant instead of
  requiring the literal string `assistant_state_director` on the same
  JSX line. A new `src/test/operationsRoleConstants.test.ts` guards the
  shape of the constant so future edits cannot silently add unrelated
  roles (e.g. `rbt`, `bcba`, `marketing`, `hr`, `payroll`).
- **Store persistence comment cleanup.** `stateDirectorStore.ts` now
  documents the contract explicitly: *optimistic UI* updates are allowed,
  but every primary write (task/escalation/note/status/ownership/handoff)
  is awaited, failures surface through `persistError` **and** a
  destructive toast, and *no primary write silently fakes success*. The
  misleading `// Best-effort Supabase persistence.` inline comment on the
  note-add path was replaced with accurate wording.

## What was preserved

- `/reports` remains the only canonical Reports route. No role-specific
  reports pages exist for State Director or Assistant State Director.
- BCBA Productivity Report V3 is still available at
  `/reports/bcba-productivity-report-v3`.
- `/training` still routes to the State Director training journey. RBT
  and BCBA training content is untouched.
- Phone System access: `state_director` allowed, `assistant_state_director`
  still blocked in `PhoneSystemRoute` ALLOWED.
- Existing manual metrics UI, snapshot banners, DailyHealthNotesPanel,
  LinkedContextPanel, and SendToStateSupportButton flow all preserved.
- The existing `state_centralreach_outbox` migration and panel were
  reused; no schema changes were made in this pass.
- No Monday, Make.com, or duplicated Login Vault / NFC pages introduced.

## How CentralReach readiness works now

1. A State Director (or Assistant SD, Operations Leadership, Super Admin)
   opens a task or escalation from `/ops/tasks` or `/ops/state-escalations`.
2. In the detail dialog they click **Send to CentralReach readiness**.
3. `createStateCentralReachOutboxItem` inserts a row into
   `public.state_centralreach_outbox` with:
   - `state_code`, `source_type` (`task` or `escalation`), `source_id`,
     `centralreach_object_type` (inferred from linked refs),
     `centralreach_external_id` (only if a real id exists), `action_type`,
     `sync_status = 'not_connected'`, and a `payload` containing the
     task/escalation fields + linked context + `sourceModule`.
4. On success a toast appears: *"CentralReach readiness item created —
   This is queued for mapping. Nothing was sent to CentralReach yet."*
5. `bumpCentralReachReadiness()` fires and the `CentralReachReadinessPanel`
   on the State Operations dashboard re-loads immediately.
6. On failure a destructive toast shows the real service error.

## CentralReach live API status

**The live CentralReach API is NOT connected in this pass.** This is a
readiness/outbox layer only. Rows created here document work that will
need to be mapped or manually updated when the integration lands.

## Validation

- Build: `bun run build` — passes (existing dynamic-import warnings only).
- Focused test suite:
  ```
  bunx vitest run \
    src/test/assistantStateDirectorCompletion.test.ts \
    src/test/assistantStateDirectorPass2.test.ts \
    src/test/assistantStateDirectorPass3.test.ts \
    src/test/assistantStateDirectorPass4.test.ts \
    src/test/stateDirectorAssistantPass.test.ts \
    src/test/stateDirectorAssistantPass5.test.ts \
    src/test/stateDirectorAssistantPass6.test.ts \
    src/test/stateDirectorFunctionalityPass1.test.ts \
    src/test/stateDirectorFunctionalityPass4.test.ts \
    src/test/stateDirectorFunctionalityPass5.test.ts \
    src/test/stateDirectorFunctionalityPass6.test.ts \
    src/test/stateDirectorFunctionalityPass7.test.ts \
    src/test/stateDirectorJourney.test.ts \
    src/test/stateDirectorPass2.test.ts \
    src/test/stateDirectorPass3.test.ts \
    src/test/operationsRoleConstants.test.ts
  ```
  Result: **16 files passed, 148 tests passed, 0 failed.**

## Known limitations

- No `Sync now` action was added — the CentralReach API integration is a
  future pass.
- Object-type inference is conservative and rule-based; when a mapping
  team lands the CentralReach connector they can refine the enum.
- The readiness panel refresh signal is a tiny module-level counter
  because the panel and the action button always co-exist inside the
  State Operations page. A wider realtime subscription can be layered on
  later without changing the button contract.