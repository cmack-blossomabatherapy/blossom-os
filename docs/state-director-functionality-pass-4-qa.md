# State Director Functionality — Pass 4 QA

## Summary
- Added `state_director` to `PhoneSystemRoute` allow-list. Assistant State Director intentionally excluded.
- Added `IntakeAiCallsRoute` guard on `/phone/ai-calls` so After-Hours AI stays Intake-owned.
- Added `SendToStateSupportButton` (`defaultKind="handoff"`) to the State Operations dashboard header, the Task detail dialog, and the Escalation detail dialog. Handoffs prefill title/description/priority/state and preserve linked client / lead / candidate / authorization / scheduling refs plus `sourceModule` (`state_operations_dashboard`, `state_task_detail`, `state_escalation_detail`).
- Fixed `deliverHandoff` activity linking: activity rows now log with `relatedType: "handoff"` and the handoff row's id. `insertActivity` accepts `"handoff"` as a related type.
- `useStateDailyHealthNotes` now uses the generated Supabase types (`Database["public"]["Tables"]["state_daily_health_notes"]["Row" | "Insert"]`) — no `as any` remains.
- State Director store: hydrate/refresh failures and every remaining fire-and-forget Supabase write (notes, updates, task-escalation companion escalation, activity) surface a destructive toast via `reportSaveFailure` instead of silent `.catch(() => {})`.
- State Operations KPI cards and the state health table are now explicitly labeled **Seed fallback metrics** with an inline note that only tasks, escalations, notes, handoffs, and daily health notes are live.
- Added `StateDirectorSnapshotBanner` and mounted it on `/intake/dashboard`, `/authorizations`, `/ops/staffing`, `/ops/scheduling`, and `/qa-team`. Renders only when `role` is `state_director` or `assistant_state_director`. Normal department operators still see the standard workspace.
- Migration `20260706_..._state_ops_helper_grants` revokes `PUBLIC`/`anon` execute from `user_is_leadership`, `user_state_code`, `user_is_state_scoped_role` and grants execute only to `authenticated`.

## Route table — State Director
| Menu item | Path | Route exists | Guard | Notes |
|---|---|---|---|---|
| State Dashboard | `/state-operations` | ✅ | shell live-path | Snapshot + seed KPIs labeled |
| State Health | `/state-operations` | ✅ | shell live-path | same page |
| State Escalations | `/ops/state-escalations` | ✅ | shell live-path | live queue |
| State Task Queue | `/ops/tasks` | ✅ | shell live-path | live queue |
| State Staffing Snapshot | `/ops/staffing` | ✅ | shell live-path | snapshot banner |
| State Intake Snapshot | `/intake/dashboard` | ✅ | shell live-path | snapshot banner |
| State Authorization Snapshot | `/authorizations` | ✅ | shell live-path | snapshot banner |
| State Scheduling Snapshot | `/ops/scheduling` | ✅ | shell live-path | snapshot banner |
| State Clinical Snapshot | `/qa-team` | ✅ | shell live-path | snapshot banner |
| Phone System | `/phone` | ✅ | `PhoneSystemRoute` incl. `state_director` | full access |
| Training Academy | `/training` | ✅ | shell live-path | untouched |
| Resource Library | `/resource-library` | ✅ | shell live-path | untouched |
| Reports | `/reports` | ✅ | shell live-path | single Reports page |

## Route table — Assistant State Director
| Menu item | Path | Notes |
|---|---|---|
| State Support Dashboard | `/state-operations` | Snapshot mode, state-scoped |
| State Intake Support | `/intake/dashboard` | snapshot banner |
| State Task Queue | `/ops/tasks` | live |
| Escalation Support | `/ops/state-escalations` | live |
| Staffing Support | `/ops/staffing` | snapshot banner |
| Scheduling Support | `/ops/scheduling` | snapshot banner |
| Authorization Support | `/authorizations` | snapshot banner |
| Training Academy | `/training` | untouched |
| Resource Library | `/resource-library` | untouched |
| Reports | `/reports` | untouched |

Phone System is **not** in Assistant menu and Assistant is **not** in `PhoneSystemRoute` allow-list, so direct navigation to `/phone` is blocked for Assistant.

## What is live vs seed fallback
- **Live**: `state_operational_tasks`, `state_operational_escalations`, `state_operational_notes`, `state_operational_activity`, `state_department_handoffs`, `state_daily_health_notes`.
- **Seed fallback**: state profiles (`STATE_DIRECTOR_SEED.profiles`) and per-state KPI metrics (`healthScore`, `activeClients`, `authorizedHours`, etc.). Labeled in the UI.

## Supabase tables used
- `state_operational_tasks`, `state_operational_escalations`, `state_operational_notes`, `state_operational_activity`, `state_department_handoffs`, `state_daily_health_notes`.

## Handoff flow proof
`deliverHandoff` → insert into `state_department_handoffs` → companion insert into `state_operational_tasks` (routed to `to_department`) → `insertActivity({ kind: "handoff", relatedType: "handoff", relatedId: handoff.id })`. No activity row labels a handoff id as a task id.

## Phone access proof
- `state_director` present in `PhoneSystemRoute` allow-list.
- `assistant_state_director` NOT present.
- `/phone/ai-calls` wrapped in `IntakeAiCallsRoute` (Intake + admin only).

## Daily Health Notes typing proof
`src/hooks/useStateDailyHealthNotes.ts` uses `Database["public"]["Tables"]["state_daily_health_notes"]["Row"]` and `["Insert"]`; zero `as any` casts remain.

## RLS hardening proof
See migration executed 2026-07-06 revoking public/anon execute on `user_is_leadership`, `user_state_code`, `user_is_state_scoped_role` and granting execute to `authenticated`.

## Remaining limitations
- State KPI metrics remain seeded (labeled). No `state_operational_metrics` table yet — see Fix 6 "Best Option" for the follow-up path.
- Coaching notes for RBT competency and CentralReach sync job itself are outside this pass.
- Some in-place `updateEscalation`/`updateTask` returns are still synchronous with best-effort persistence, but every path now surfaces failures via toast instead of silently.