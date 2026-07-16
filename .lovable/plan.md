## Goal
Make each task row fully clickable to open a redesigned side panel that combines activity tracking with in-place editing and a dedicated notes thread — while preserving today's realtime activity log exactly as it works.

## UX

- Clicking anywhere on a task row (except the status pill or Complete button) opens the side panel. The "Activity" button goes away — the whole row becomes the affordance.
- The panel becomes a real workspace with three stacked sections in one scrolling column:
  1. **Header + editable details** — title (click to edit), status pill, owner, due date, task type. Save/Cancel appear only when a field is dirty.
  2. **Notes** — a thread of freeform notes the user can add. Each note shows author + timestamp. Newest first. Notes are additive; the activity log continues to auto-record status changes.
  3. **Activity timeline** — the existing status-change timeline and related communications, unchanged in behavior.

## Data model

- `intake_tasks.notes` already stores everything as a single text blob (activity lines + freeform). Keep that column, keep the existing status-change writer untouched, and layer notes on top by tagging user notes with a stable prefix so they can be parsed back out cleanly:
  - `[<ISO>] Note (by <author>): <body>`
- Existing status lines (`[<ISO>] Status: X → Y (by Z)`) keep flowing through the current parser — no migration needed.
- Editable fields (title, owner, due_date, task_type, status) update `intake_tasks` directly. Status changes still route through `setStatus` so the activity log stays intact.

## Files

- `src/hooks/useIntakeTasksLive.ts`
  - Add `updateFields(id, patch: { title?; owner?; due_date?; task_type? })` — plain optimistic UPDATE, no activity line (edits to metadata are shown in `updated_at` only, matching current behavior for reassign/snooze).
  - Add `addNote(task, body, author)` — appends `[iso] Note (by author): body` to `notes` and mirrors to `intake_communications` when a `lead_id` exists, same pattern as `setStatus`.

- `src/components/tasks/TaskActivityDrawer.tsx` → rename to `TaskDetailDrawer.tsx` (re-export the old name for back-compat).
  - New top section: editable `Title` (inline text), `Status` pill (reuses `setStatus`), `Owner`, `Due date`, `Task type` — using existing `Input`, `Select`, and a date input. Dirty tracking + Save/Cancel row.
  - New middle section: **Notes** — textarea + "Add note" button; list of parsed notes below (parsed from `notes` blob using the new `Note` prefix). Empty state: "No notes yet."
  - Bottom section: existing Activity timeline + Related communications, unchanged.
  - Parser (`parseNotes`) extended to also recognize the `Note (by …):` lines and return them as a separate `userNotes` array alongside `events` and `other`.

- `src/pages/tasks/TasksPage.tsx`
  - Wrap each row in a `<button>`/clickable container that calls `setActivityTask(t)`.
  - Stop-propagation on the status `Select` and the `Complete` button so they don't trigger the drawer.
  - Remove the standalone "Activity" button (row click replaces it).
  - Update the drawer import to `TaskDetailDrawer` (or keep the alias).

## Out of scope

- No schema changes, no new tables, no RLS edits.
- No changes to `intake_communications` structure.
- Subtasks and record links stay read-only in this pass (they can be surfaced in the drawer but not editable yet).
