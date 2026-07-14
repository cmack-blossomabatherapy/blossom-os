## Problem

Visiting `/tasks` shows a blank page with just a spinner — no sidebar, no header, no content.

Two root causes:

1. In `src/App.tsx` the route is registered as `<Route path="/tasks" element={<IntakeTasks />} />` — it is NOT wrapped in `<OSShellPage>`. Every other in-app destination (`/home`, `/academy`, `/leads`, etc.) is wrapped in `OSShellPage`, which is what renders the left sidebar, the top bar (Home button, role switcher), and the auth/MFA gating that gets a signed-in user past the loading state. Without it, `/tasks` renders the intake page alone and, when auth/MFA hooks that normally live inside the shell are missing, the app stalls on a plain spinner (redirect to `/mfa/verify` in some cases).
2. The component behind `/tasks` is still `IntakeTasks` — labelled "Growth & Admissions → Tasks" and scoped to leads/intake data via `useIntakeTasksLive` + `useLeads`. That contradicts the earlier promise that "Every role should have a Tasks page and it should look and work the same." For non-intake roles it either loads with intake-only pulse tiles or shows nothing meaningful.

## Fix

Frontend / routing only — no schema or business-logic changes.

### 1. Wrap the route in OSShell (`src/App.tsx`)

Change:
```
<Route path="/tasks" element={<IntakeTasks />} />
```
to:
```
<Route path="/tasks" element={<OSShellPage><TasksPage /></OSShellPage>} />
```

This restores the sidebar, Home button, top bar, and auth flow so the page actually renders for a signed-in user.

### 2. Introduce a universal Tasks page (`src/pages/tasks/TasksPage.tsx`)

New thin page that renders the same tasks experience for every role:

- Header: "Tasks" (no "Growth & Admissions" eyebrow), description "Your task list — follow-ups, actions, and reminders."
- Uses the existing `useIntakeTasksLive` hook (which is already the source of `user_tasks` for the current user regardless of role) plus, when the current role has intake permissions, the lead-linked columns; for non-intake roles the lead column is hidden and lead-specific filters (Escalated tag) are suppressed.
- Reuses the current filter chips (All / Overdue / Due Today), search, sort, `AssigneePicker`, and complete/snooze/reassign actions from `IntakeTasks` — pulled into shared subcomponents so both the universal page and the intake workspace stay in sync.
- Keeps the "Add Lead" action ONLY when the viewer has an intake-facing role; other roles get a generic "New Task" action that opens the existing task-creation dialog (`CreateLeadTaskDialog` reused in "generic task" mode, or the existing generic task dialog if present in `src/components/tasks/`).

### 3. Keep IntakeTasks for the intake workspace

`IntakeTasks.tsx` (mounted at `/intake/tasks`) stays intact for intake coordinators who want the lead-scoped view. The new `TasksPage` is what `/tasks` renders for everyone.

### 4. Sanity checks

- Re-run the existing `src/test/deepLinksResolve.test.ts` to confirm `/tasks?task=…` still resolves.
- Verify via Playwright at `/tasks` that the sidebar renders, the Home button is present, and the tasks list appears with the current user's `user_tasks` rows.

## Out of scope

- No changes to the `user_tasks` schema, RLS, hooks, or task-creation flows.
- No changes to `/intake/tasks` behavior.
- No design-system or menu changes beyond what's needed to render the shell.
