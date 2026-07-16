## Goal

Tasks should work the same way for **leads** and **clients (patients)** — real record pickers on creation, a visible linked chip that deep-links to the record, and quick "Add task" entry from a client drawer just like leads have today.

Today: `intake_tasks` already has `lead_id`, `related_record_type/id/label`, and `related_url`. The New Task dialog has a real lead search picker but only free-text for "client". The task detail drawer doesn't show or edit the linked record at all. There's no "Add task" affordance on the Client drawer.

## Changes

### 1. `src/components/tasks/CreateTaskDialog.tsx` — real Client picker
- Add `defaultClientId?: string` prop, mirror of `defaultLeadId`.
- When `kind === "client"`, render a Popover + Command search over `useClients()` (child name, parent name, state) — same UX as the lead picker.
- On save with a client selected:
  - `related_record_type = "client"`, `related_record_id = <clientId>`
  - `related_record_label = "<Child> · <Parent>"`
  - `related_url = "/os/clients?client=<id>"` (matches `resolveRelatedRecordHref`)
- Keep the free-text "Other" branch for authorizations/employees/etc. unchanged.

### 2. `src/components/tasks/TaskActivityDrawer.tsx` — show + edit linked record
- Add a "Linked to" row to the header card. Uses `relatedRecordChipLabel` + `resolveRelatedRecordHref` from `src/lib/tasks/relatedRecord.ts` to render a clickable chip (opens the lead or client drawer via the existing deep link).
- Add an inline "Change" control that opens a small popover with a kind switcher (None / Lead / Client / Other) and the same Command search used by CreateTaskDialog. Saving calls the existing `updateFields` mutation with `lead_id` (for leads), `related_record_type`, `related_record_id`, `related_record_label`, `related_url`.
- If a task has `lead_id` but no `related_record_*` (older rows), display "Lead · <lead name>" resolved from `useLeads()` so nothing looks empty.

### 3. `src/components/clients/ClientDetailDrawer.tsx` (or the equivalent client-side drawer used at `/os/clients`) — "Add task" button
- Add a header button "Add task" that opens `CreateTaskDialog` with `defaultClientId={client.id}` (mirroring the existing Lead drawer's `CreateLeadTaskDialog` flow).
- Keep the current empty state of the client's Tasks section but source it from `intake_tasks` filtered by `related_record_type='client' AND related_record_id=<id>`.

### 4. `src/pages/tasks/TasksPage.tsx` — linked chip in the row
- Add a small chip next to the task title showing `relatedRecordChipLabel(task)`; click stops propagation and navigates to `resolveRelatedRecordHref(task)`. Falls back to the lead label when only `lead_id` is set.

### 5. `src/pages/os/home/MyTasksCard.tsx` (Company Home) — same chip
- Render the same linked chip on each task item so users see "Contact Lead · Ava Chen" instead of just "Contact Lead".

### 6. Hook plumbing
- `useIntakeTasksLive.ts` `updateFields` already accepts partial columns — no schema change, just make sure `related_record_*` and `lead_id` are in the allowed set. `CreateIntakeTaskInput` already supports them.
- No migration required. Existing `intake_tasks` columns cover everything.

## Out of scope

- No new task table, no many-to-many linking (one task → one primary linked record, matching current schema).
- No changes to `user_tasks`, StateDirector's local `CreateTaskDialog`, or ReferralCRM's bulk dialog.
- No change to `TaskDetailPanel.tsx` (legacy mock-based panel, not on the active `/tasks` route).

## Verification

- Create a task from `/tasks` linked to a client — the chip appears in the row and links to the client drawer.
- Open the task drawer, change the link from Client A → Lead B; the chip updates and the deep link now goes to the lead drawer.
- On the Client drawer, "Add task" pre-selects the current client and the created task shows up under the client's Tasks section and on `/tasks`.
- Home page "My Tasks" shows the linked chip for the current in-progress task.
