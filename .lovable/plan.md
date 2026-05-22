## Goal

Rebuild `/leads` so it stops feeling like a CRM pipeline and starts behaving like a **Family Intake Operations** workspace. The North Star is **Service Readiness**: every section answers "what is preventing this family from becoming ready for services, and what should Intake do next?"

## Scope

- Replace the page rendered at `/leads` (currently `OSLeadsV2`) with a new `OSIntakeOperations` page.
- Reuse the existing data layer: `monday_leads_raw` → `mondayMapper.ts` → `LeadsContext`, plus `monday_updates_raw` for activity. No schema changes.
- All new UI lives in `src/components/leads/intake/`. The old `OSLeadsV2` + its components stay in the repo (unrouted) so we can fall back if needed, then deleted in a follow-up pass.
- Mock-only Ask Blossom AI rail (no edge function this round).

## Page structure

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Header: "Leads" + subtitle + search + [Add Inquiry][Follow-Up]      │
│         [Send Intake Packet][Open VOB Center]                       │
├──────────────────────────────────────────────┬──────────────────────┤
│ Intake Pulse (6 calm KPI pills)              │                      │
│                                              │  Ask Blossom AI      │
│ § Families Needing Action  (hero section)    │  • prompt chips      │
│   action cards, urgency, quick actions       │  • insights          │
│                                              │  • daily priorities  │
│ § Daily Follow-Ups (tabbed queues)           │                      │
│                                              │                      │
│ § Assessment Coordination                    │                      │
│                                              │                      │
│ § Missing Information Center                 │                      │
│                                              │                      │
│ § Service Readiness Pipeline (12 stages)     │                      │
│                                              │                      │
│ § Recent Activity (from monday_updates_raw)  │                      │
└──────────────────────────────────────────────┴──────────────────────┘
```

Right rail is 320px, sticky. Main column scrolls. Mobile: rail collapses into a bottom sheet, sections stack, follow-ups float to top.

## Sections in detail

**Intake Pulse (KPI strip)** — 6 pills only: New Inquiries, Awaiting Contact, Missing Information, VOB Pending, Assessment Coordination Needed, Ready for Next Step. Derived from existing `Lead` fields (`status`, `formReviewStatus`, `vobStatus`, plus a derived `readinessStatus`). One muted accent, no charts.

**Families Needing Action (hero)** — Large operational cards grouped by blocker reason (Packet not completed, Missing insurance card, Parent unavailable, Assessment not scheduled, VOB pending, Consent missing, Financial review, Stopped responding). Each card: parent name, patient, state, stage, IC owner, blocker, urgency dot, days waiting. Inline quick actions: Call, Text, Email, Send Packet, Add Note, Open, Escalate. Open → detail drawer.

**Daily Follow-Ups** — Segmented tabs: Due Today / Overdue / Waiting on Family / Missing Docs / Assessment Coord / Final Attempts / Waiting on VOB. Compact row cards with Call/Text/Email/Note/Snooze/Escalate.

**Assessment Coordination** — New mini-board with columns: Needs Assessment, Scheduled, Clinician Assigned, Awaiting Family Availability, Completed. Derived from status + tasks; click → drawer's Assessment tab.

**Missing Information Center** — Visual blocker grid: Insurance card, Intake form, Consent, Diagnosis, Availability, Referral. Each tile shows count + top 3 families + "Request Missing Info" action.

**Service Readiness Pipeline** — Horizontal scroller, 12 stages: New Inquiry → Initial Contact → Packet Sent → Forms Received → Missing Info → Insurance Verified → Sent to VOB → Financially Cleared → Assessment Coordination → Ready for Client Setup → Ready for Authorization → Ready for Staffing. Each stage card: count, overdue, waiting, avg days in stage. Cards open a filtered family list in the drawer.

**Recent Activity** — Feed pulled from `monday_updates_raw` joined to leads by `parent_item_name`. Icons per type (contact, packet sent, insurance uploaded, VOB received, assessment scheduled, note).

**Ask Blossom AI rail** — Prompt chips ("Summarize this family", "Find stuck intake cases", "Show missing documents", "What's preventing readiness?", "Draft follow-up"), 3 mocked insight cards, daily priorities list (top 5 families to call today, computed client-side from urgency + days waiting).

## Lead Detail Drawer

Refactor the existing `LeadDetailDrawer` into a tabbed intake-focused layout: Family Info · Intake Status · Forms & Docs · Insurance · VOB · Assessment Coordination · Communication · Activity · Internal Notes · Operational Readiness. Footer actions: Call, Text, Email, Add Note, Send Forms, Move Stage, Escalate, Open VOB.

## Readiness model

Add a derived helper `getReadinessStatus(lead)` returning one of: `Awaiting Contact | Waiting on Family | Waiting on Internal Review | Financial Review Needed | Assessment Coordination | Operationally Ready | Cannot Proceed`. Pure function over existing `Lead` fields — no DB writes. Used by KPI pulse, action cards, pipeline counts, and the drawer's Operational Readiness panel.

## Role scoping

Reuse existing `useUserRole` / lead scoping. Intake Coordinators see only `lead.owner === currentUser`; Intake Leadership + Operations Leadership + Super Admin see all; State Directors see only their state; RBT/BCBA hidden via `PermissionRoute permission="leads.view"`.

## Files

```text
src/pages/os/OSIntakeOperations.tsx        (new — replaces OSLeadsV2 at /leads)

src/components/leads/intake/
  IntakeHeader.tsx
  IntakePulse.tsx                    (6 KPI pills)
  FamiliesNeedingAction.tsx          (hero blocker cards)
  DailyFollowUps.tsx                 (tabbed queues)
  AssessmentCoordination.tsx         (mini board)
  MissingInfoCenter.tsx              (blocker tiles)
  ServiceReadinessPipeline.tsx       (12-stage scroller)
  RecentActivityFeed.tsx             (from monday_updates_raw)
  AskBlossomIntakeRail.tsx           (mock AI)
  IntakeDetailDrawer.tsx             (refactor of LeadDetailDrawer)

src/lib/leads/readiness.ts           (getReadinessStatus, blocker derivation, pipeline stages)
src/lib/leads/intakeQueues.ts        (queue builders for follow-ups + action cards)

src/App.tsx                          (swap OSLeadsV2 → OSIntakeOperations on /leads)
```

## Design tokens

White / `bg-background`, hairline `border-border`, `rounded-2xl` cards, soft `shadow-sm`, hover-lift. Single primary accent for CTAs; muted chips for status; red/amber/green only for true urgency (overdue days). Glass treatment on rail + drawer. No gradients on cards.

## Out of scope (v1)

- Writing changes back to Lovable Cloud (in-memory only, same as current).
- Real Ask Blossom AI calls.
- Drag-and-drop on the pipeline.
- Deleting `OSLeadsV2.tsx` and the old leads components (kept temporarily for safety).
