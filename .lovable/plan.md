# Training Admin → Operations Academy editor + Staff track assignment

The Operations Academy currently lives in its own tables (`academy_tracks → academy_phases → academy_weeks → academy_modules → academy_module_resources`) and is rendered read-only on `/hr/academy`. The Training Admin only manages the lighter `training_courses` / `training_tracks` system. This change makes the Academy fully editable from Training Admin and lets admins create new Academy-style tracks and assign them to specific staff (not just roles).

## What we'll add

### 1. New "Academy" tab in Training Admin (`/hr/training`)

A complete editor for the Operations Academy structure:

- **Tracks list** (left rail): every `academy_track` with create / rename / archive
- **Phase + Week tree** (middle): drag-orderable phases under the selected track, weeks under each phase. Inline create / rename / delete / reorder. Edit phase color token, week objective, outcomes.
- **Module editor** (right pane): when a week is selected, list its `academy_modules` with full CRUD — title, description, type (video / SOP / shadow / quiz / checkin), leader, duration label, required flag, applies-to path, quiz JSON, and child `academy_module_resources` (label + url + kind).
- **Quiz editor**: structured editor for the JSON quiz field (questions / choices / correct answer) instead of raw JSON.
- **AI assist on modules**: "Generate description" + "Generate quiz" buttons that call the existing `generate-training-draft` function and pre-fill fields.

### 2. Staff assignment for Tracks

Currently `training_tracks` can only target a role or auto-assign on hire. Add direct **per-employee enrollment** for both Academy tracks and Training tracks.

- New table `training_track_enrollments(id, track_id, employee_id, assigned_by, due_date, status, started_at, completed_at, created_at)` for `training_tracks`.
- Reuse existing `academy_enrollments` for Academy tracks (already has `employee_id` + `track_id`).
- New "Assign to staff" dialog on every track (Academy or Training):
  - Multi-select employees (search by name / role / department)
  - Optional due date
  - Required toggle
  - Creates enrollments in the matching table
- Show roster on the track detail panel: list of currently enrolled employees with status badges, remove button, "extend due date" action.

### 3. Tracks tab upgrades

- Show **type pill** on every track: "Academy" (multi-week) vs "Training" (course list).
- "+ New track" now offers two options: Quick Training Track (existing flow) or Academy Track (creates an `academy_track` and jumps to the Academy tab).
- "Assigned staff" count next to course count.

## Schema changes (one migration)

```sql
create table public.training_track_enrollments (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.training_tracks(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  assigned_by uuid,
  due_date date,
  status text not null default 'assigned',  -- assigned | in_progress | completed | waived
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (track_id, employee_id)
);
-- RLS: managers (hr.training.assign or admin) can manage; employees can read their own.
```

No changes needed to existing `academy_*` tables (already have everything).

## Out of scope this pass

- Drag-and-drop with `@dnd-kit` for week / module reorder — we'll use ▲▼ buttons updating `position` for now.
- Auto-progress recompute when modules are deleted (we'll just orphan-clean `academy_progress` via cascade).
- Editing `academy_audit_log` / `academy_checkins` (these stay system-managed).
