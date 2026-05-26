# Executive Leadership Audit — Phased Plan

The Executive Leadership role has **11 pages** in `src/pages/os/executive/` plus 1 legacy page (`OSExecutive.tsx` mounted at `/executive/legacy`). Routes and sidebar nav are wired and match. No runtime errors are currently logged. Below is a phased audit so we fix the right things in the right order.

## Pages in scope

```text
/executive                          → ExecutiveOverview
/executive/pulse                    → CompanyPulse
/executive/briefing                 → ExecutiveBriefing
/executive/organizational-health    → OrganizationalHealth
/executive/strategic-risks          → StrategicRisks
/executive/growth-readiness         → GrowthReadiness
/executive/leadership-accountability→ LeadershipAccountability
/executive/staffing-expansion       → StaffingExpansion
/executive/operational-consistency  → OperationalConsistency
/executive/updates                  → ExecutiveUpdates
/executive/resources                → ExecResourceLibrary
/executive/legacy                   → OSExecutive  (LEGACY — to remove)
```

Shared data hooks already in use: `useOpsIntelligence`, `useStateWorkforce`, `useCentralReachOps`, `useStateOps`.

## Phase 1 — Legacy & routing cleanup (fast, low risk)
- Delete `src/pages/os/OSExecutive.tsx`, remove its import + the `/executive/legacy` route from `src/App.tsx`.
- Sweep the rest of the codebase for any stale links to `/executive/legacy` or to `OSExecutive` and remove them.
- Confirm every sidebar entry in `OSShell.tsx` for the executive role maps to a real route (already verified — keep this as a sanity step).

## Phase 2 — Page-by-page audit (the bulk of the work)
For each of the 11 active pages, verify:
1. **Imports & compile** — page renders with no missing imports or dead refs.
2. **Data wiring** — uses real hooks (`useOpsIntelligence` / `useStateWorkforce` / `useCentralReachOps`); no hardcoded mock blocks left over.
3. **Every button / link works** — `<Link to=…>` targets exist; action buttons have handlers (toast / navigate / drawer) instead of dead `onClick`.
4. **AI prompt cards** — clicking surfaces an Ask Blossom drawer/toast (consistent behavior across exec pages).
5. **Empty/loading states** — calm skeletons + "all clear" empty states, never blank.

We will work in this order (lightest → heaviest):
1. ExecutiveOverview
2. CompanyPulse
3. ExecutiveBriefing
4. OrganizationalHealth
5. StrategicRisks
6. GrowthReadiness
7. LeadershipAccountability
8. StaffingExpansion
9. OperationalConsistency
10. ExecutiveUpdates
11. ExecResourceLibrary

After each page, I'll note what was changed (or "clean — no changes needed").

## Phase 3 — Design system pass
- Confirm every page uses the Blossom OS design tokens (no raw `bg-white`/`text-gray-*`/etc.).
- Ensure shared `ExecPage`, `ExecCard`, `HealthPill`, `AIPrompt`, `ActionPill` primitives from `_shared.tsx` are used consistently — extend `_shared.tsx` if a primitive is being re-implemented inline anywhere.
- One primary CTA per page, hairline borders, soft shadows, rounded-2xl cards.

## Phase 4 — Cross-page consistency
- Standardize AI prompt behavior (single shared handler).
- Standardize "Quick actions" footer across all 11 pages.
- Ensure breadcrumbs / page headers follow the same structure.

## Phase 5 — Final verification
- Visit every executive route in the preview, screenshot, confirm no console errors.
- Confirm role gating in `OSShell` still shows the right sidebar for `executive_leadership`.

## How we'll proceed
I'll execute **Phase 1** immediately (it's mechanical), then pause after each subsequent phase so you can review before I move on. That way we catch design/data direction issues before they multiply across pages.

Reply "go" to start Phase 1, or tell me to reorder/skip phases.
