# Intake Department Launch — Implementation Plan

This is a focused, in-place upgrade of the existing Intake module. Nothing is rebuilt from scratch. All current routes, contexts, and live hooks stay. The work is grouped into 6 passes so it can be verified end-to-end.

## Pass 1 — Foundation & menu

- Audit `ROLE_MENUS.intake_coordinator` in `src/lib/os/roleMenus.ts`. Ensure the menu shows exactly:
  - Intake Workspace: Intake Dashboard, Referral Queue, Lead To Active Pipeline, Missing Information, Parent Communication, Intake Tasks, Lead Benefits Cheat Sheets, Patient Lifetime Journey
  - Training And Resources: Training Academy, Resource Library, Reports
  - No AI items, no Coming Soon items for intake_coordinator
- Verify all paths are mounted in `src/App.tsx` (they already are). No new routes.
- Add a shared `IntakeWorkspaceShell` (glass header + sticky command bar + segmented filters) under `src/components/os/intake/` to avoid duplicate chrome on every page.
- Add a shared `GlassPanel`/`GlassStat` variant tuned for Intake (depth, hairline borders, translucent layered surfaces) using existing semantic tokens — no hardcoded colors.
- Sweep Intake pages for mojibake (`â€”`, `â†'`, etc.) and replace with proper em dash / arrow glyphs.

## Pass 2 — Intake Dashboard (`/intake/dashboard`)

Rebuild the body of `OSIntakeOperations` (shared with `OSIntakeCoordinator`) around the new shell, keeping all existing data hooks (`useLeads`, `useIntakeTasksLive`, `useIntakeCommsLive`, `getLeadWorkflowRisk`):

- Top metric row: New referrals, In pipeline, Missing info, Open follow-ups, Awaiting VOB, Converted (30d)
- Risk strip: urgent / aged / unassigned leads from `getLeadWorkflowRisk`
- Two-column grid: Owner workload + State breakdown / Lead source breakdown + Aging by stage
- Handoff readiness panel (VOB Completed → ready for Auth/Scheduling)
- Quick actions row: Add Lead (NewLeadDialog), Log contact, Request missing info, Move forward, Open Patient Journey

## Pass 3 — Workflow pages

All keep existing hooks; only UI + interactions upgraded.

- **Referral Queue** — search, filters (state/owner/source/priority/risk/days waiting), 4 sort modes, inline actions (assign, contact, send packet, mark unable to reach, move stage), reuse `LeadActionPanel`, open existing lead detail.
- **Lead To Active Pipeline** — 8-stage kanban with per-stage count / avg age / oldest / at-risk; use existing `moveStage` / `revertStage`; card actions for forward/back/open/add task/log comm/handoff.
- **Missing Information** — leverage `getMissingInfoFlags`; per-lead checklist (forms, DX, insurance, parent info, payer, consent), owner, due, last contact, attempts, follow-up + mark-received + return-to-pipeline actions.
- **Parent Communication** — recent comms from `useIntakeCommsLive`, open follow-ups, cadence indicator, status (call/email/text), template picker (6 templates listed in prompt), log action, link to lead + Patient Journey.
- **Intake Tasks** — `useIntakeTasksLive` driven. Tabs: My / Team / Overdue / Due today. Group by owner / lead / stage. Complete, reassign, add, tie-to-lead.
- **Lead Benefits Cheat Sheets** — keep existing seed; add state filter, insurance type filter, OON guidance, blockers, required info, ask-family list, send-to-VOB checklist, escalation rules, copy-to-clipboard scripts, last reviewed/owner. Data-ready UI for future payer table.

## Pass 4 — Patient Lifetime Journey linkage

- Keep `/patient-journey` route. From Intake pages (lead card menu + dashboard quick action), deep-link with `?leadId=...` so the journey view can scope to the selected lead. No structural rewrite — just ensure entry points exist.

## Pass 5 — Intake Training Academy

- In `src/pages/os/academy/TrainingAcademyHome.tsx` (already department-aware for intake_coordinator), ensure the Intake journey renders with the 24 modules listed in the prompt.
- Add/extend the Intake journey in `src/lib/academy/journeyContent.ts` (or `trainingPaths.ts` — wherever current journeys live) with the full module list. Each module has: what it teaches, why it matters, steps, completion evidence, checklist, knowledge check (where applicable), resource links to relevant `/intake/*` pages and Resource Library items.
- Do not create a separate training app. Existing Academy shell only.

## Pass 6 — Reports + QA

- Ensure `/reports` exposes an Intake report view (or filter) covering: lead volume, conversion by stage/state/source, avg time to first contact, avg days in stage, missing-info rate, VOB sent/completed, coordinator workload, aging risks. Reuse existing report engine; add Intake report definitions if missing.
- Run targeted tests: `intakeRoleMenuSprint15`, `intakeShellHotfixSprint15A`, `intakeSprint09`, `sprint07LeadIntakeEngine`, `sprint08IntakeWorkflowActions`, `canonicalRoutes`, `placeholderRoutes`, `roleMenuLiveRoutes`.
- Mojibake sweep across `src/pages/os/intake/**` and `src/components/intake/**`.
- Verify build passes and no TS errors.

## Technical details

- New files (estimated):
  - `src/components/os/intake/IntakeWorkspaceShell.tsx`
  - `src/components/os/intake/GlassMetric.tsx`
  - `src/lib/intake/parentCommTemplates.ts`
  - `src/lib/intake/benefitsCheatSheetSeed.ts` (extracted/expanded)
  - Intake journey content additions in existing academy content module
- Edited files:
  - `src/pages/os/intake/*.tsx` (all 7)
  - `src/pages/os/OSIntakeOperations.tsx`
  - `src/lib/os/roleMenus.ts` (menu verification only)
  - Academy content module for Intake journey
- Non-goals: no new routes, no schema migrations, no edge functions, no auth changes, no AI menu, no Monday/CTM/Solum integration code beyond UI-ready states.

## Risk & guardrails

- All live hooks preserved; no swap to static arrays.
- Super Admin retains full access (role menu logic untouched outside intake_coordinator entries).
- Non-Intake roles keep their current Coming Soon for Intake modules — no accidental privilege grant.
- Design uses semantic tokens only; no `bg-white` / `text-black` / hex colors in components.

## Acceptance check (will run before handoff)

- Every Intake menu item opens a working page for intake_coordinator.
- Dashboard, queue, pipeline, missing info, comms, tasks all read live data.
- Cheat sheets filter and copy actions work.
- Academy shows the Intake journey with 24 modules for intake_coordinator.
- No mojibake remains in Intake pages.
- Build + targeted tests pass.

Approve this plan and I will execute the 6 passes in order.
