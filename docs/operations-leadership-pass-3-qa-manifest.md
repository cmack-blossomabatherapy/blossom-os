# Operations Leadership — Pass 3 QA Manifest

**Scope:** System Requests + Command Center wiring + Department / Workflow risk surfaces

## Changes

### New
- `src/components/operations/WorkQueueSignalsCard.tsx`
  - Reads from `operations_work_items` via `useWorkQueue` (Supabase, realtime).
  - Surfaces four tiles: Open, Escalated, High/Urgent, Overdue.
  - Latest 5 active items list with deep links to `/work-queue` and `/work-queue/escalations`.
  - Calm empty state — no mock data.

### Wired
- `src/pages/os/operations/OpsCommandCenter.tsx`
  - Added `<WorkQueueSignalsCard />` directly under the Operational Status Header.
  - Added `<SystemRequestsPanel />` above the Quick Nav footer so leadership can submit / triage system requests from the Command Center.
- `src/pages/os/operations/OpsWorkflowRisks.tsx`
  - Added `<WorkQueueSignalsCard />` under the risk posture header so workflow-risk owners see the persistent work items alongside predictive risks.

## Persistence & Permissions
- Work queue data comes from `public.operations_work_items` (Pass 2 migration).
- System requests come from `public.executive_work_items` (`category="system_request"`).
- No new tables, no new RLS. Existing policies apply:
  - `operations_work_items`: authenticated read/write, admin-only delete.
  - `executive_work_items`: leadership + Super Admin write; others read-only per existing RLS.

## Preserved
- All existing Command Center sections (Pulse, Workflow Streams, Bottlenecks, Coordination Grid, Escalations, Dependencies, Readiness, AI Insights).
- All existing Workflow Risks sections (posture header, risk tiles, grid, bottleneck queue, forecasts, AI engine).
- Deep links to `/work-queue`, `/work-queue/escalations`, `/system/request-intake`.

## Verification
- Typecheck: `tsgo --noEmit` — clean.
- Empty-state behavior preserved: cards render safely with 0 items.
- No hardcoded colors; uses existing `_shared` primitives and semantic tokens.

## Next
- Pass 4 (optional): department-level drill-downs from `WorkQueueSignalsCard` tiles (filter by department in `/work-queue`), and integrations control-center read-only view.