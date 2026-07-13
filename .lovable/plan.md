## Goal

Turn `/home` into the true daily home: calendar + **My Tasks** + **My Goals & Milestones**, add a persistent "Home" button, and build a goal → milestone → approval workflow assigned by leadership (Super Admin / CEO / COO / DOO).

## What we're adding

### 1. Persistent "Home" button
- Add a small Home icon button in the top OS bar (visible on every page, all roles) that routes to `/home`. The existing sidebar "Home" link stays, but this makes it always-visible even when the sidebar is collapsed or on mobile.

### 2. My Tasks on the home page
A new "My Tasks" card next to the calendar:
- Shows tasks assigned **to me** (open + due soon), grouped by Today / This week / Later.
- Inline quick-add: title, due date, optional assignee (any user), priority.
- Row actions: complete, snooze, reassign, open detail drawer.
- "Assigned by me" toggle to see tasks I've delegated.
- Feeds the calendar too — tasks with due dates show as calendar dots (new "Task" category, filterable).

### 3. Goals & Milestones workflow
A new "My Goals" card on home + a full `/goals` page.

Flow:
```text
Leadership assigns Goal → User drafts Milestones → Leadership approves/requests changes → User works milestones → Goal marked complete
```

- **Assign (leadership only: super_admin, ceo, coo, doo, exec):** pick user, title, description, target date, category, priority.
- **User builds milestones:** after a goal lands in their queue, they add 3–7 milestones (title, target date, success criteria) and hit "Submit for approval". Goal status moves `draft_milestones → pending_approval`.
- **Approval:** approvers see a review queue. They can approve, request changes (with comment), or reject. Approved goals move to `active`. Milestones can be individually approved or sent back.
- **Progress:** user marks milestones complete; goal % completion is derived. Leadership can view progress on a "Team Goals" tab.
- **Visibility:** user sees their own goals; leadership sees all; managers see direct reports (based on `employee_relationships`).

### 4. Updated Home layout
```text
┌────────────────────────┬──────────────────────┐
│ Company Calendar       │ Selected day + Up    │
│ (with filters)         │ next                 │
├────────────────────────┼──────────────────────┤
│ My Tasks               │ My Goals             │
│ (Today/Week/Later)     │ (active + progress)  │
├────────────────────────┴──────────────────────┤
│ Highlights · Updates (existing)               │
└───────────────────────────────────────────────┘
```

## Technical section

### Data model (new tables, all with GRANTs + RLS)

**`user_tasks`**
- `id`, `title`, `description`, `assignee_id` (uuid → profile), `assigned_by_id`, `due_at`, `priority` (low/med/high), `status` (open/in_progress/done/cancelled), `related_record_type`, `related_record_id`, `related_url`, `completed_at`, timestamps.
- RLS: assignee or assigner can read/update; leadership can read all; anyone authenticated can create tasks they assign.
- Calendar integration: query on home merges tasks with `due_at` into the calendar event index (new synthetic category `task`).

**`user_goals`**
- `id`, `title`, `description`, `category`, `owner_id` (assigned user), `assigned_by_id`, `target_date`, `priority`, `status` (`draft_milestones | pending_approval | changes_requested | active | completed | archived`), `approval_notes`, `approved_by_id`, `approved_at`, timestamps.
- RLS: owner reads/updates own; leadership roles (super_admin/ceo/coo/doo/exec) read all + insert + approve; manager reads direct reports.

**`user_goal_milestones`**
- `id`, `goal_id` (fk cascade), `title`, `success_criteria`, `target_date`, `status` (`pending | approved | changes_requested | in_progress | done`), `order_index`, `completed_at`, `approval_notes`, timestamps.
- RLS: mirrors goal.

**`user_goal_activity`** (lightweight audit)
- `id`, `goal_id`, `actor_id`, `action` (`assigned|milestones_submitted|approved|changes_requested|milestone_completed|goal_completed`), `note`, `created_at`.

Helper: reuse existing `has_role` for leadership checks (add roles to policy where needed). Approver set = users with role in {`super_admin`,`ceo`,`coo`,`doo`,`exec`}.

### Frontend

- `src/hooks/useUserTasks.ts` — react-query CRUD + realtime subscribe on my assignee_id.
- `src/hooks/useUserGoals.ts` — goals + milestones with react-query, `submitForApproval`, `approveGoal`, `requestChanges`, `completeMilestone`.
- `src/pages/os/home/CompanyHome.tsx` — add `MyTasksCard` and `MyGoalsCard`; merge tasks into calendar events (new "Task" filter chip using the filter UI just built).
- `src/pages/os/home/tasks/TaskDrawer.tsx` — detail/edit drawer.
- `src/pages/os/goals/GoalsPage.tsx` at `/goals` with tabs: **My Goals**, **Assign Goal** (leadership), **Approval Queue** (leadership), **Team Goals** (leadership/manager).
- `src/pages/os/goals/GoalDetail.tsx` — milestone builder, submit for approval, approval controls, activity timeline.
- `src/pages/os/OSShell.tsx` — add persistent Home icon button in the top bar (all roles); add `/goals` route in role menus under Core / Personal for everyone, plus an "Approval Queue" entry for leadership roles.
- `src/App.tsx` — register `/goals` and `/goals/:goalId` routes.

### Design (per Blossom OS system)
- Floating rounded cards, soft borders, generous spacing, muted palette.
- Status pills with semantic colors (amber = pending approval, blue = active, green = done, rose = changes requested).
- Empty states: "No tasks for today — you're clear." / "No goals yet. Leadership will assign your first goal."
- Approval actions use existing button variants; no giant forms — progressive disclosure inside the goal drawer.

### Out of scope (call out)
- No notifications/email on approvals in this pass (activity log only); can layer on later.
- No cross-linking tasks ↔ goals in v1 (goal completion is milestone-driven).