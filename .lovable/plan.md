# Operations Leadership Role — Build Plan

Build the dedicated Operations Leadership role experience in Blossom OS, following the same pattern used for Scheduling Team, BCBA, RBT, and Payroll Coordinator (curated sidebar + role-owned pages, fully real-data).

## 1. Sidebar — `OPS_LEADERSHIP_SECTIONS` in `src/pages/os/OSShell.tsx`

```
HOME
  • Executive Dashboard       → /operations
  • Operations Command Center → /operations/command-center
  • Leadership Briefing       → /operations/briefing

OPERATIONS OVERSIGHT
  • Department Health         → /operations/department-health
  • Workflow Risks            → /operations/workflow-risks
  • Escalations & Blockers    → /operations/escalations

PEOPLE & PERFORMANCE
  • Team Accountability       → /operations/accountability
  • Staffing & Capacity       → /operations/staffing-capacity
  • Training & Adoption       → /operations/training-adoption

COMMUNICATION
  • Leadership Updates        → /operations/updates

RESOURCES
  • Resource Library          → /operations/resources

AI
  • Ask Blossom AI            → /ai/assistant
```

Hook into the `sections =` branch alongside `scheduling_team`, `bcba`, etc.

## 2. Route home

Update `ROLE_HOME.operations_leadership` → `/operations` (already set). Update `ALL_ROLE_DASHBOARDS` label to "Operations Leadership".

## 3. Pages (all under `src/pages/os/operations/`)

Each page is a calm, real-data view using existing live hooks:
`useLiveAuthorizations`, `useStateWorkforce`, `useStateOps`, `useCentralReachOps`, `useRecruitingCandidates`, `useVobReviews`, `useLiveTeam`, `useAcademyComplete`, `useLeads/useStateMondayPipeline`.

| Page | Purpose | Primary signals |
|---|---|---|
| `OpsExecutiveDashboard` (reuse existing `OSOperations` as base, simplify) | Quiet org snapshot | dept health scores, top 3 risks, top 3 wins |
| `OpsCommandCenter` | Org-wide execution view | cross-dept queues from auths/staffing/recruiting |
| `OpsLeadershipBriefing` | Daily exec briefing | what changed today, attention list, wins |
| `OpsDepartmentHealth` | Per-department scoring | Healthy/Attention/At Risk/Blocked per dept |
| `OpsWorkflowRisks` | Bottlenecks across pipelines | auth stalls, intake stalls, missing docs |
| `OpsEscalations` | Unresolved leadership issues | critical staffing, expired auths, stalled candidates |
| `OpsAccountability` | Follow-through tracker | overdue PRs, stalled stages by owner |
| `OpsStaffingCapacity` | Capacity overview | BCBA capacity, RBT util, hiring pipeline |
| `OpsTrainingAdoption` | Training & SOP adoption | academy completion by role |
| `OpsLeadershipUpdates` | Posted announcements | placeholder list + composer (mock, stored in Supabase later) |
| `OpsResourceLibrary` | Filtered library | reuse existing library hook, filter to leadership tag |

Each page uses the standard `OSShell`, glass cards, semantic tokens, and empty states. No mock data; all numbers come from live hooks. Where a signal isn't yet available, render a calm "Coming online" empty state, not fake numbers.

## 4. Routes — `src/App.tsx`

Add the 10 new routes alongside existing `/operations`, wrapped in the same `ProtectedRoute` used by sibling routes. The existing `/operations` route keeps pointing to the executive dashboard (renamed component or repointed import).

## 5. Permissions

`operations_leadership` already has `scope: "company"` and broad module access. No permissions change required.

## Out of scope (this build)

- Leadership Updates write-path (Supabase table) — UI scaffold only, can be wired in a follow-up.
- Training Academy authoring for leadership journeys — separate effort.

## Delivery order

1. Sidebar sections + routes wired (clickable shell).
2. Real-data hooks plugged into each page in dependency order: Executive → Command Center → Briefing → Department Health → Workflow Risks → Escalations → Accountability → Staffing → Training → Updates → Resources.

Shippable after step 1; pages fill in progressively.