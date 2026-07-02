# Authorizations Team — Pass 8 QA Manifest

## Scope
Production-readiness pass across live Authorizations pages/actions. No module rebuild.

## What changed

1. **Authorization Manager role menu is real.** `ROLE_MENUS.authorization_manager` added with the full coordinator surface plus a Team Workload link into `/auth-workspace?view=team`.
2. **Canonicalized menu paths.** Coordinator + Manager menus, and the Super Admin sidebar, now use `/authorizations`, `/authorizations?stage=approved`, `/authorizations?stage=denied`. Legacy `/ops/authorizations`, `/ops/approved-authorizations`, `/ops/denials` redirects remain in `App.tsx` for backwards compat.
3. **`/authorizations` honors `stage=` deep links.** `STAGE_TO_VIEW` now covers `approved`, `denied`, `submitted`, `qa`, `missing`, `missing_docs`. Existing `authId` / `overlayId` / `payor` / `payer` / `state` / `coordinator` params preserved.
4. **OpsRecordsWorkspace remote actions are awaitable.** `create` / `update` / `remove` now return real Promises for the Supabase-backed path — no more fire-and-forget `.catch()`. `rowActions` context signature updated to `Promise<void> | void`.
5. **MissingDocs + PayerRequirements await before success.** MissingDocs already used `await Promise.resolve(update(...))`; PayerRequirements Delete now awaits + toasts success/error accurately.
6. **Export is real.** `/authorizations` Export button downloads a CSV of the currently visible rows with Auth ID, Client, State, Payer, Auth Type, Stage, Coordinator, BCBA, Start / Submitted / Approved / Expires, Days To Expire, Missing Docs, PR Status, Source.
7. **Insights prompts are real links.** "Try asking" buttons now link to `/ai/assistant?context=authorizations&q=<prompt>` (no more `"…assistant coming soon"` toasts).
8. **External send queue is honest + actionable.** `Queue Message Follow-Up` (renamed from "Message BCBA") logs an `external_send_pending` activity with channel / recipient / timestamp AND creates a real follow-up row in `authorization_tasks` via `createTask(...)`. Copy no longer implies a real outbound message was sent.
9. **CentralReach readiness stays honest.** `CentralReachReadinessSection` continues to say integration pending / CentralReach-ready; no "connected" language.

## Files touched

- `src/lib/os/roleMenus.ts`
- `src/components/layout/AppSidebar.tsx`
- `src/pages/os/operations/OpsRecordsWorkspace.tsx`
- `src/pages/os/operations/PayerRequirements.tsx`
- `src/pages/os/OSAuthorizations.tsx`
- `src/hooks/useAuthorizationActions.ts`
- `src/test/authorizationsPass8.test.ts` (new)

## Tests

Added `src/test/authorizationsPass8.test.ts` — 17 tests covering:
- ROLE_MENUS.authorization_manager exists.
- Coordinator + Manager menus contain no `/ops/{authorizations,approved-authorizations,denials}`.
- Super Admin sidebar uses canonical `/authorizations?stage=...` routes.
- `/authorizations` honors `stage=approved|denied|submitted|qa|missing_docs` and preserves `authId` / `overlayId` / `payor` / `payer` / `state` / `coordinator`.
- `OpsRecordsWorkspace` remote path no longer fire-and-forgets, and `rowActions` ctx is Promise-compatible.
- `MissingDocs` and `PayerRequirements` await ops before success toasts.
- No "Export — coming soon" or "assistant coming soon" strings in `/authorizations`.
- CSV export downloads with expected field coverage.
- `queueExternalSend` still logs `external_send_pending`, adds a `Manual follow-up:` task via `createTask`, and the button copy reads `Queue Message Follow-Up`.
- CentralReach readiness UI does not claim connected.

### Results

```
bunx vitest run src/test/authorizationsPass3.test.ts src/test/authorizationsPass4.test.ts \
                 src/test/authorizationsPass5.test.ts src/test/authorizationsPass6.test.ts \
                 src/test/authorizationsPass7.test.ts src/test/authorizationsPass8.test.ts

 ✓ authorizationsPass3.test.ts   (6)
 ✓ authorizationsPass4.test.ts  (14)
 ✓ authorizationsPass5.test.ts  (10)
 ✓ authorizationsPass6.test.ts  (11)
 ✓ authorizationsPass7.test.ts  (20)
 ✓ authorizationsPass8.test.ts  (17)
 Test Files  6 passed (6)   Tests  78 passed (78)
```

Typecheck (`bunx tsgo --noEmit`): clean. Production build is run automatically by the harness and passes.

## Remaining gaps

- **CentralReach: not connected yet.** Authorizations is structured (contract fields, readiness surface, ID-ready columns) for a future CentralReach API / import integration. No live sync is performed.
- **External send channels: not connected.** Outlook / email / SMS are queued as audit + follow-up task. No outbound provider is wired.
- **Team Workload link** currently deep-links `/auth-workspace?view=team`; the dedicated team workload view can be expanded in a future pass.

## Explicit CentralReach status

> CentralReach is **not connected yet**. Authorizations is structured for future CentralReach API / import integration. Language in-product remains "CentralReach-ready" or "integration pending" — never "connected".
