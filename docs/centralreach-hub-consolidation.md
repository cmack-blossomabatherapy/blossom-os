# CentralReach Data Hub — Consolidation Report

_Last updated: 2026-07-18_

## 1. Executive summary

Every CentralReach import surface in Blossom OS has been consolidated behind a single admin entry point: **`/system/centralreach`** — the CentralReach Data Hub. Legacy upload pages redirect into it. Reporting downstream (BCBA Productivity V3, HR BCBA Productivity, Cancellation Command Center, QA Authorization Utilization) continues to read the same underlying tables and requires no changes.

## 2. Scope

In scope: all inbound file-based imports of CentralReach data (billing, scheduling, authorization, employees, clients, assignments, schedule, timesheets, documentation, dashboard audit) and their history, freshness, audit, and data-quality tooling.

Out of scope: outbound write-back queues (`bcba_centralreach_outbox`, `state_centralreach_outbox`), CentralReach Packet Prep intake workflow (kept — different purpose; guard added), and the `import-bcba-sessions` server-side name-extraction edge function (non-overlapping, retained).

## 3. Surfaces inventoried

| # | Surface | Old route | New route |
|---|---|---|---|
| A | CentralReach Uploads (reporting hub) | `/system/centralreach-uploads` | `/system/centralreach?tab=reporting` |
| B | BCBA Productivity Uploads | `/system/bcba-productivity-uploads` | `/system/centralreach?tab=reporting` |
| C | CR Sync Center | `/admin/centralreach-sync` | `/system/centralreach?tab=workforce-clinical` |
| D | Shared Report Dataset Uploads (embedded) | — | embedded in Reporting tab |
| E | Intake Packet Prep | `/intake/cr-packet-prep` | unchanged (guard added) |
| F | BCBA CR Outbox | embedded | unchanged (outbound) |
| G | State CR Outbox | embedded | unchanged (outbound) |
| H | RBT freshness badge | embedded | reader migrated to `cr_sync_freshness()` |

## 4. Retain / merge / retire decisions

- **Retained**: outbound outboxes, Packet Prep, `import-bcba-sessions`.
- **Merged behind hub**: A, B, C, D — all reachable through `/system/centralreach` tabs.
- **Redirected**: A, B, C legacy routes plus `/system/authorization-uploads`, `/system/cancellation-uploads`, `/admin/centralreach-sync`.

## 5. Target product structure

Seven tabs at `/system/centralreach`:

1. Overview — freshness heatmap + counts + jump-to
2. Reporting Imports — auto-detect wizard for billing/scheduling/auth (was `/system/centralreach-uploads`)
3. Workforce & Clinical Imports — template-driven wizard for employees, clients, assignments, schedule, timesheets, auths, documentation, dashboard audit (was CR Sync Center)
4. Import History — unified across `cr_sync_runs`, `shared_report_datasets`, `bcba_productivity_upload_batches`
5. Freshness — thresholds and levels via `cr_sync_freshness()`
6. Data Quality — triage queue over `cr_data_quality_exceptions`
7. Audit Log — read-only view of `cr_sync_audit`

## 6. Import engine

- **Reporting engine** (unchanged): auto-detect by header signature → `shared_report_datasets` or `bcba_productivity_billing_rows` via the existing `adminUploadStore` / `sharedReportDatasets` code paths.
- **Workforce/clinical engine** (unchanged): file SHA-256 fingerprint dedupe, external-ID row idempotency, per-template `column_map`/`field_types`/`required_fields`, `cr_rollback_run` RPC, `cr_freshness_config` thresholds, `cr_sync_audit` append-only, `cr-sync-source` storage bucket.
- **Lineage bridge** (new): `shared_report_datasets.cr_run_id` and `bcba_productivity_upload_batches.cr_run_id` nullable columns for future forward-mirroring of legacy runs into `cr_sync_runs`.

## 7. Permission model

New table `cr_upload_permissions(user_id, capability)` with capabilities: `view`, `upload_reporting`, `upload_workforce`, `upload_clinical_ops`, `edit_templates`, `commit`, `rollback`, `download_source`, `configure`.

Route guards:

- `/system/centralreach` — `AdminRoute`
- `/intake/cr-packet-prep` — `PermissionRoute(admin, super_admin, intake, intake_coordinator, intake_lead, intake_team, operations_leadership)` **(previously ungated — closed in this pass)**

## 8. Data-quality queue

New table `cr_data_quality_exceptions` (severity, category, status, owner, comment) for actionable issues surfaced from `cr_sync_run_errors` or cross-report reconciliation. Admin and operations leadership only.

## 9. Freshness unification

`useCrSync.ts` (RBT active-day badge) now reads `cr_sync_freshness()` first, falls back to legacy `rbt_data_sync_status` if the RPC returns nothing. This gives ONE source of truth for "how stale is CentralReach data" going forward. `rbt_data_sync_status` remains writable for one release for rollback safety.

## 10. Downstream reports & dashboards — preserved unchanged

`BcbaProductivityReportV3`, `HrBcbaProductivityDashboard`, `CancellationCommandCenter`, `QaAuthUtilizationDashboard`, `useBcbaWorkflow`, `useBcbaHomeData`, `BcbaClientTimeline` — all continue reading `bcba_productivity_billing_rows` / `shared_report_datasets` directly. No refactor required.

## 11. Route redirects

All five legacy routes `<Navigate replace>` into the appropriate hub tab. No 404s.

## 12. Retired UI

`CentralReachUploads` and `CrSyncCenter` component files are retained (embedded by the hub); their direct routes are gone. `BcbaProductivityUploads.tsx` was already dead (its route redirected). No files deleted in this pass — safer for rollback.

## 13. Migration risks

- Deep links to `/system/centralreach-uploads` (bookmarks, emails, docs) redirect automatically; no user action required.
- Any external RPA scripts driving the old URL should be updated to the new one.
- `cr_sync_freshness()` returns no rows until workforce/clinical imports have run; the RBT badge falls back to the legacy source so no visible break.

## 14. Testing performed

- Route redirects verified (`tests/centralreachHubRouting.test.ts`).
- Existing 33+ operations, executive, and BCBA test suites unchanged and passing.
- Migration linter: 175 pre-existing warnings, **zero introduced** by this migration.

## 15. Tests completed

See `src/tests/centralreachHubRouting.test.ts` for redirect / tab-parameter coverage.

## 16. Defects found

- `/intake/cr-packet-prep` was unguarded — closed.
- RBT freshness badge and CR Sync freshness were parallel systems with no single source of truth — unified reader added.

## 17. Defects fixed

See §16. Both closed in this pass.

## 18. Remaining limitations

- Data-quality queue is scaffolded but not yet auto-populated from `cr_sync_run_errors`; population job is a follow-up.
- Legacy `rbt_data_sync_status` writes remain for one release before retirement.
- `import-bcba-sessions` runs are not yet mirrored into `cr_sync_runs`; deferred.
- Retention lifecycle on `cr-sync-source` storage bucket is not yet configured (default proposal: 90 days).

## 19. Migration risks

See §13.

## 20. Administrator training

- Bookmark **`/system/centralreach`**. All prior upload pages redirect here.
- Reporting uploads (billing/scheduling/auth): use the **Reporting Imports** tab — same experience as before, auto-detects file type.
- Workforce/clinical uploads (employees, schedule, timesheets, etc.): use the **Workforce & Clinical Imports** tab — template-driven, supports rollback.
- Check freshness weekly from **Overview** or **Freshness** tab.
- Triage data-quality issues from the **Data Quality** tab.

## 21. Standard procedures

- **Daily**: upload today's CentralReach billing export via Reporting Imports.
- **Weekly**: upload workforce and schedule exports via Workforce & Clinical; verify no `stale`/`critical` levels on Overview.
- **Monthly**: review Data Quality queue; download source files from History for audit retention.

## 22. Rollback plan

1. Revert redirects in `src/App.tsx` (git revert the routing chunk).
2. Restore direct routes for `CentralReachUploads` and `CrSyncCenter` (components still exist).
3. RBT freshness reader will continue functioning; the RPC path is null-safe with a legacy fallback.
4. The database migration is additive (new columns nullable, new tables independent) — no data loss on revert.

## 23. Go-live checklist

- [x] Legacy routes redirect
- [x] Hub renders all seven tabs
- [x] `/intake/cr-packet-prep` guarded
- [x] Freshness reader migrated
- [x] Migration applied, no new linter warnings
- [x] Downstream reports unchanged
- [x] Routing test added
- [ ] External docs / bookmarks updated (owner: operations leadership)
- [ ] `cr-sync-source` bucket lifecycle configured (follow-up)
- [ ] `rbt_data_sync_status` retired next release