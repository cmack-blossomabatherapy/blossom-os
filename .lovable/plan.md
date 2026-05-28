
# Evaluations: Cycles → Rules Engine

Rip out the "Create Cycle" workflow. Generate every staff member's evaluation schedule automatically from their hire date + role + rules.

## Database

1. **New table `evaluation_rules`** (one row per role)
   - `role` ('BCBA' | 'RBT'), `eval_type` ('30-Day' | 'Quarterly' | 'Annual'), `enabled`, `cadence_days`, `first_offset_days`, `reminder_days_before`
   - Seed defaults:
     - BCBA: Quarterly every 90 days, Annual every 365 days
     - RBT: 30-Day at day 30, Quarterly every 90 days, Annual every 365 days

2. **Modify `evaluations`**
   - Make `cycle_id` nullable, stop using it for new rows
   - Add `due_date date NOT NULL`, `generated_from_hire_date boolean default true`, `assigned_reviewer_id uuid`
   - Widen `evaluation_type` check to include `'30-Day'`
   - Index on `(staff_id, due_date)` and `(due_date) where final_status != 'Complete'`

3. **Database function `regenerate_staff_evaluations(staff_id)`**
   - Reads staff hire_date + role, loads `evaluation_rules`, generates future evaluations up to 2 years out
   - Idempotent: skips evals already created for the same `(staff_id, eval_type, due_date)`
   - Never touches evals already In Progress / Complete

4. **Triggers**
   - On `evaluation_staff` INSERT or UPDATE of (hire_date, role, active) → call `regenerate_staff_evaluations`
   - On `evaluation_rules` UPDATE → optional admin "Regenerate all schedules" button (manual, not auto, to avoid surprise)

5. **Deprecate (don't drop yet)** `evaluation_cycles` table — leave it in place but stop writing to it; remove all UI references.

## UI changes

1. **Delete** `CreateCycleDialog.tsx` and the **Cycles** tab.

2. **New "Schedule" tab** (replaces Cycles in the tab bar)
   - Table of upcoming evaluations across all staff: Employee · Review Type · Due Date · Days Until Due · Status · Reviewer
   - Filters: role, eval type, overdue only, next 30/60/90 days
   - Row click → open staff drawer focused on that evaluation

3. **Settings tab → "Evaluation Rules" section**
   - Two cards (BCBA / RBT), each with toggles + cadence inputs for 30-Day / Quarterly / Annual
   - "Save & regenerate future schedules" button

4. **Add Staff dialog** stays the same on input fields. On save it just inserts the staff row — the trigger auto-creates the schedule. Confirmation toast: "Scheduled X upcoming evaluations."

5. **Staff profile drawer**
   - Show "Upcoming Evaluations" list (next 4) with human names: "90-Day Quarterly Review · Due Jun 15"
   - Keep current evaluation workflow (self-eval, leadership, meeting, complete) unchanged

6. **Overview tab**
   - KPI cards: Due this week / Due this month / Overdue (driven off the new `due_date`)

## What stays the same

- `evaluations` lifecycle (self → leadership → meeting → complete)
- Forms, responses, emails queue, AI insights, coaching plans — all keep working since they reference `evaluations.id`
- Resend dispatcher already shipped

## Migration strategy

Since the DB has 0 cycles and 0 evals, no data migration needed. Migration just:
- creates `evaluation_rules` + seeds defaults
- alters `evaluations` (nullable cycle_id, adds due_date + reviewer)
- creates the regenerate function + triggers
- backfills schedules for the 2 existing staff rows

## Out of scope (for now)

- No bulk regenerate when rules change → manual button only
- Cycles table stays in DB but hidden; can drop in a future cleanup migration once we're sure nothing else queries it
