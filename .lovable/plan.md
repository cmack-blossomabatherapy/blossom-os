# Intake Role — Release-Ready Design & Functionality Pass

Scope is the signed-in Intake operator experience only. Training Academy, Resource Library, Reports, LeadDetail, and unrelated roles stay untouched. Nothing published.

## Inventory (confirmed on disk)

Intake operator menu → these routes:

```text
/intake/dashboard              → src/pages/os/intake/IntakeDashboard.tsx        (APPROVED standard)
/intake/tasks                  → src/pages/os/intake/IntakeTasks.tsx
/leads                         → src/pages/os/OSLeadsV2.tsx (list/pipeline/follow-up)
/leads/:id                     → src/pages/LeadDetail.tsx                        (APPROVED standard)
/intake/missing-information    → src/pages/os/intake/MissingInformation.tsx
/phone/ai-calls                → After-Hours AI Calls surface (Intake-scoped)
/intake/cr-packet-prep         → src/pages/os/intake/CentralReachPacketPrep.tsx
```

Approved visual/product benchmarks: `IntakeDashboard.tsx` + `LeadDetail.tsx`.
Shared kit already exists: `IntakeVisuals.tsx` (`IntakeSectionHeader`, `IntakePulseStrip`, `IntakeToneCard`), `GlassHero`, `PermissionGate`, `PipelineProgress`, `StatusBadge`.

## Product rules to enforce on every Intake page

1. **Header/shell**: `OSShell` + `GlassHero` welcome band (state filter, primary CTA), `max-w-7xl mx-auto px-6`, section spacing `space-y-6`, no horizontal overflow at any breakpoint.
2. **Operator IA per row/card**: what needs attention → why → owner → age/SLA → next step → primary action. No technical language.
3. **No diagnostics for Intake role**: provider health, webhook state, credentials/scopes, raw payloads, mapping counters, ingestion metrics — hidden behind `PermissionGate module="admin"` (Super Admin only). Operators only see human-readable readiness ("Call linked", "Import pending").
4. **Offline/integration-ready**: real data first, fall back to imported/local persistence, honest empty states. Never fabricate success. Preserve CTM `INGEST_ONLY`, CentralReach, Monday, comms adapter contracts.
5. **Every clickable → real destination**: audit each button/row; remove decorative/no-op controls; wire to existing dialogs, hooks, or routes. No new popout patient drawers — always route to `/leads/:id`.

## Shared primitives (create once, reuse across 5 non-Dashboard Intake pages)

New file: `src/components/os/intake/IntakePageShell.tsx`
- Wraps `OSShell` + `GlassHero` (eyebrow, title, subtitle, state chip, right slot).
- Standard content container: `max-w-7xl mx-auto px-4 md:px-6 space-y-6`.
- Standard slots: `filters`, `metrics`, `children`.

New file: `src/components/os/intake/IntakeQueueRow.tsx`
- Standard queue row (avatar/initials, title, subtitle, owner chip, age chip, SLA/urgency badge, next-step line, primary action button, overflow menu).
- Renders as `<Link to="/leads/:id">` when a lead is present; otherwise button.

New file: `src/components/os/intake/IntakeEmptyState.tsx`, `IntakeLoadingState.tsx`, `IntakeErrorState.tsx`
- Calm, honest, action-suggestive copy consistent with LeadDetail.

New file: `src/components/os/intake/OperatorDiagnosticsGate.tsx`
- `<PermissionGate module="admin" fallback={null}>` wrapper for any diagnostics block; forces the "hidden for Intake" rule to be one line at each callsite.

## Page-by-page changes

### 1. Intake Dashboard (`IntakeDashboard.tsx`)
- Already the standard. Only change: audit each KPI/queue card → confirm it navigates to the correct filtered working page (`/intake/tasks?filter=…`, `/leads?stage=…`, `/intake/missing-information?blocker=…`, `/phone/ai-calls?state=unreviewed`, `/intake/cr-packet-prep?ready=false`). Fix any that route to a bare page.
- Ensure system-health strip stays wrapped in `OperatorDiagnosticsGate` (Super Admin only).

### 2. Intake Tasks (`IntakeTasks.tsx`)
- Convert to `IntakePageShell`. Real task queue: ownership picker, urgency badge, due/overdue with age, linked lead chip, next-step line.
- Row actions: **Start** (opens `/leads/:id?tab=tasks`), **Complete**, **Snooze** (existing dialog), **Reassign** (existing `AssigneePicker`). Bulk complete/reassign in a footer bar.
- URL-addressable filters: `?owner=me|team&status=open|overdue|done&urgency=high`.
- Empty / loading / error via new primitives.

### 3. Leads list/pipeline/follow-up (`OSLeadsV2.tsx`)
- Keep dedicated full patient record at `/leads/:id` (no drawer). 
- Ensure list/pipeline/follow-up tabs share: filters state, URL params (`?tab=…&stage=…&owner=…&q=…`), selection model, bulk actions (assign coordinator, add tag, export), create/import CTAs. Every row → `navigate('/leads/:id')`.
- Header/shell consistent with Dashboard via `IntakePageShell`.

### 4. Missing Information (`MissingInformation.tsx`)
- Convert to `IntakePageShell` + `IntakeQueueRow`. Columns: blocker type, aging, owner, last attempt, next action.
- Real actions only: **Send reminder** (uses existing comms adapter — will no-op with clear toast if adapter inactive per `INGEST_ONLY`), **Create task**, **Add note**, **Open family** → `/leads/:id?tab=documents`.
- Filter chips by blocker type; URL state.
- Diagnostics (ingestion counters, adapter states) removed from operator view.

### 5. After-Hours AI Calls (`/phone/ai-calls` for Intake)
- Operator inbox view: caller, family match confidence (human phrase, not score), urgency, transcript/summary excerpt, disposition, owner.
- Actions: **Link to lead** (search + attach), **Create lead from call** (opens Add Lead dialog pre-filled), **Assign owner**, **Mark reviewed**, **Open lead** → `/leads/:id?tab=communications`.
- Remove CTM/webhook/provider diagnostics from this Intake-facing route; keep them only under Super Admin CTM Operations panel (existing).

### 6. CentralReach Packet Prep (`CentralReachPacketPrep.tsx`)
- Readiness queue with required-document checklist per family, missing items, validation state, owner, handoff button.
- Row → `/leads/:id?tab=documents`. Handoff action logs to activity and marks stage advance (existing hook).
- Remove import-diagnostic panels; expose only human-readable "Import pending" chip. Full diagnostics remain in Super Admin CentralReach admin route.

## Permission gating

- Any block that contains: provider status, webhook delivery, API credentials, mapping tables, raw payloads, ingestion counters → wrap in `<OperatorDiagnosticsGate>`.
- `useOSRole` `role === "intake_coordinator"` (and other intake_* variants) MUST NOT see diagnostics anywhere in the 6 pages above.
- Super Admin unchanged — sees everything via existing admin routes.

## Functional states (all pages)

Support: persisted UUID + imported ID lookup, missing fields (dash placeholders + "Add" inline), empty datasets (`IntakeEmptyState`), loading (`IntakeLoadingState` skeletons), permission denied (redirect via existing route guard), backend error (`IntakeErrorState` with retry), stale data (soft toast), direct deep link (route resolves without crashing on unknown params).

## Testing

New test files (Vitest, React Testing Library):

- `src/test/intakePageShellPrimitives.test.tsx` — every Intake page renders `IntakePageShell`, has hero + max-w container, no horizontal overflow (assert wrapper class).
- `src/test/intakeCtaContracts.test.tsx` — snapshot of clickable elements per page: every button has an `onClick` OR is a `Link` with a valid path; zero no-ops.
- `src/test/intakeDrilldownRoutes.test.tsx` — dashboard KPI/queue tiles navigate to the exact filtered URLs; every row in Tasks/Missing/CR-Packet navigates to `/leads/:id...`.
- `src/test/intakeDiagnosticsGating.test.tsx` — render each page under role `intake_coordinator` → diagnostics blocks absent; under `super_admin` → present. Covers system-health, provider readiness, webhook state, ingestion counters.
- `src/test/intakeStates.test.tsx` — empty / loading / error / imported-ID / unknown-deep-link render without crash.

Verification: run these focused tests + `tsgo` typecheck + production build. Fix change-caused failures. Do not touch the 50 pre-existing unrelated failures.

## Explicitly out of scope

- Training Academy, Resource Library, Reports (content untouched, shell only stays consistent).
- LeadDetail rebuild (already approved standard — no changes).
- Other roles' menus/pages.
- Publishing.
- Enabling any outbound automation or notification currently disabled.

## Deliverable

One PR-sized change set touching: 4 new shared primitives + 5 Intake page files + Dashboard CTA audit + 5 new test files. Report exact typecheck/build/test status and file list on completion.
