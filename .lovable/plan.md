
# CentralReach Data Hub — Consolidation Plan

## Discovery Inventory (complete)

| # | Surface | Route | Purpose | Recommendation |
|---|---|---|---|---|
| A | **CentralReach Uploads** (production hub) | `/system/centralreach-uploads` | Auto-detects billing / scheduling / auth exports; fans out to `shared_report_datasets` + BCBA productivity | **RETAIN as base shell** — has all real downstream readers |
| B | BCBA Productivity Uploads (standalone) | redirect → A | Append-only BCBA productivity ingest into `bcba_productivity_upload_batches` / `_billing_rows` | **RETIRE component** — route already redirects, file is dead |
| C | **CR Sync Center** | `/admin/centralreach-sync` | Generic template engine for employees / clients / assignments / schedule / timesheets / auths / documentation / dashboard-audit → `cr_external_records` | **MERGE engine into A**; retire standalone route. Engine is superior (SHA-256 file dedupe, `cr_rollback_run` RPC, `cr_freshness_config` thresholds, mapping templates, `cr_sync_audit`, `cr-sync-source` bucket) but `cr_external_records` currently has **0 rows and 0 non-engine readers** |
| D | Shared Report Dataset Uploads (embedded) | none | Reusable slot uploader inside A → `shared_report_datasets` | **KEEP as internal engine component**; wrap in unified history/freshness |
| E | CentralReach Packet Prep (intake) | `/intake/cr-packet-prep` | Intake document/packet prep workflow (not a bulk importer) | **RETAIN** — different purpose. Fix missing route guard in same pass |
| F | BCBA CentralReach Outbox | embedded | Outbound write-back queue → `bcba_centralreach_outbox` | **RETAIN** — outbound, not inbound |
| G | State CentralReach Outbox | embedded | Outbound write-back queue → `state_centralreach_outbox` | **RETAIN** — outbound, not inbound |
| H | RBT freshness badge | embedded | Employee read-only "last updated" from `rbt_data_sync_status` | **MIGRATE reader** onto `cr_sync_freshness()` so there is one freshness source of truth |
| — | `import-bcba-sessions` edge fn | n/a | Server-side CentralReach CSV parser that extracts BCBA names from client labels | **RETAIN** — non-overlapping (assignment discovery, not billing ingest); wire its runs into unified `cr_sync_runs` for visibility |

Downstream readers to preserve unchanged: `BcbaProductivityReportV3`, `HrBcbaProductivityDashboard`, `CancellationCommandCenter`, `QaAuthUtilizationDashboard`, `useBcbaWorkflow`, `useBcbaHomeData`, RBT `useCrSync`, `BcbaClientTimeline`.

---

## Target Product

Rename `/system/centralreach-uploads` → **CentralReach Data Hub** at `/system/centralreach` (old path kept as redirect). Left-nav sections:

1. **Overview** — freshness heatmap across all import types, last runs, exceptions count, "next expected upload" per type
2. **Upload Data** — single 8-step wizard (Type → Upload → Detect → Map → Validate → Preview → Commit → Results); auto-detect where signature is known, manual selection otherwise
3. **Reporting Imports** — billing / scheduling / authorization / cancellation / utilization (Surface A + D contents)
4. **Workforce Imports** — employees, roles, supervisor relationships (CR Sync `employees` type)
5. **Clinical Operations Imports** — assignments, schedule, timesheets, authorizations, documentation, dashboard-audit (CR Sync remaining types)
6. **Mapping Templates** — `cr_sync_templates` UI (admin-only edit)
7. **Import History** — unified view of `cr_sync_runs` + `bcba_productivity_upload_batches` + `shared_report_datasets` (single virtual list with source badge)
8. **Data Quality** — exceptions: unknown employee/client, orphan appointment, dup ID, invalid status, cross-report mismatch — with owner / status / comment / reprocess / ignore-with-reason
9. **Freshness & Coverage** — `cr_freshness_config` editor + per-type staleness cards; migrate `rbt_data_sync_status` reads onto same source
10. **Exceptions** — aged data-quality queue with SLAs
11. **Settings** — retention, thresholds, permission map
12. **Audit Log** — `cr_sync_audit` unified

## Unified Import Engine

Extend the existing `cr_sync` engine (superior) with adapters for the two legacy paths so we get one engine everywhere:

- **`shared_report_datasets` adapter** — `type_key` `shared:cancellation-scheduling`, `shared:cancellation-billing`, `shared:cancellation-authorization`, `shared:authorization`; commit writes both the shared dataset (for existing reports) and a `cr_sync_runs` record for lineage/freshness/rollback
- **`bcba_productivity` adapter** — `type_key` `billing_bcba_productivity`; commit writes `bcba_productivity_billing_rows` + `_upload_batches` (unchanged, so BcbaProductivityReportV3 keeps working) AND a mirrored `cr_sync_runs` record for unified history/freshness. Void-batch action becomes a `cr_rollback_run` variant.

Engine capabilities available to every adapter: file SHA-256 fingerprint dedupe, external-ID row idempotency, per-template column map + type coercion + required-field validation, preview (add/update/unchanged/reject counts), commit-only-on-explicit-confirm, `cr_sync_run_errors` per-row rejection log, `cr_rollback_run` RPC, `cr_freshness_config` thresholds, `cr_sync_audit` append-only.

## Permission Model

`cr_upload_permissions` mapping (seeded, editable by super_admin):

| Capability | super_admin | systems_admin | reporting_admin | clinical_ops_importer | finance_importer | viewer |
|---|---|---|---|---|---|---|
| View overview / history / freshness | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Upload workforce / clinical ops | ✓ | ✓ | — | ✓ | — | — |
| Upload reporting (billing/scheduling/auth) | ✓ | ✓ | ✓ | — | ✓ | — |
| Edit mapping templates | ✓ | ✓ | — | — | — | — |
| Commit / rollback | ✓ | ✓ | ✓ (own type) | ✓ (own type) | ✓ (own type) | — |
| Download source file | ✓ | ✓ | — | — | — | — |
| Configure freshness / retention | ✓ | ✓ | — | — | — | — |

RBTs and BCBAs get **no upload access**, only role-appropriate freshness badges.

## Migration Steps (in order)

1. **DB migration**: add `shared:*` and `billing_bcba_productivity` rows to `cr_sync_types`; add default templates to `cr_sync_templates`; add `cr_freshness_config` rows for new types; add `cr_upload_permissions` table with GRANTs + RLS; add nullable `cr_run_id` columns to `shared_report_datasets` and `bcba_productivity_upload_batches` for lineage back-refs
2. **Engine adapters**: extend `src/lib/os/crSync/engine.ts` with `sharedDatasetAdapter` + `bcbaProductivityAdapter` so `commit()` writes to legacy tables + creates a `cr_sync_runs` mirror. Add `cr_rollback_run` handlers that call `voidBcbaProductivityBatch` / `deleteSharedReportDataset` respectively.
3. **New hub shell**: `src/pages/os/system/centralreach/CentralReachHub.tsx` with 12 tabs listed above. Route: `/system/centralreach`. Reuse existing wizard/history/freshness/audit/templates panels from `CrSyncCenter.tsx`; embed existing `SharedReportDatasetUploads` under Reporting Imports; embed BCBA productivity upload under Reporting Imports → Billing.
4. **Redirects**: `/system/centralreach-uploads`, `/system/bcba-productivity-uploads`, `/system/authorization-uploads`, `/system/cancellation-uploads`, `/admin/centralreach-sync` all `<Navigate>` to the appropriate tab of `/system/centralreach`.
5. **Retire dead components**: delete `BcbaProductivityUploads.tsx` and `CrSyncCenter.tsx` (behavior moved into hub); keep `CentralReachUploads.tsx` only long enough to verify no direct imports remain, then delete.
6. **Freshness unification**: change `useCrSync.ts` and `BcbaClientTimeline` reads from `rbt_data_sync_status` to `cr_sync_freshness()` output for the relevant `type_key`. Keep `rbt_data_sync_status` writable for one release for rollback safety, then retire.
7. **Guard fix**: wrap `/intake/cr-packet-prep` in `PermissionRoute` for intake roles (single-line fix, in-scope for hardening pass).
8. **Data quality panel**: query `cr_sync_run_errors` grouped by category + a new `cr_data_quality_exceptions` table for user-actionable items (ignore-with-reason, reprocess, comment).
9. **Tests**: unit tests for each adapter (correct file / wrong file / missing columns / reordered / duplicate file / duplicate rows / updated rows / unknown external ID / invalid date / rollback / permission denial); integration tests that `BcbaProductivityReportV3` and `CancellationCommandCenter` still render identical values pre- and post-migration.
10. **Consolidation report** written to `docs/centralreach-hub-consolidation.md` covering all 23 sections the brief requires.

## What stays exactly as-is

- All downstream report/dashboard components — they still read `bcba_productivity_billing_rows` and `shared_report_datasets` unchanged
- The two outbox tables and their UI panels (outbound, not in scope)
- `import-bcba-sessions` edge function (non-overlapping)
- CentralReach Packet Prep behavior (only its route guard changes)

## Risks / open items to confirm before build

1. **Breadth of the change** — this is ~15 file adds, ~10 file edits, one schema migration, and one data-backfill of `cr_sync_runs` mirror rows for existing productivity batches. Full build+test is a multi-hour pass.
2. **`import-bcba-sessions` write target** — the file was truncated in inventory; confirm its destination table before deciding whether to add an adapter for it.
3. **`rbt_data_sync_status` producers** — need one more grep for `insert.*rbt_data_sync_status` / `upsert` to confirm nothing else writes to it before we retire it.
4. **Retention policy** — brief calls for "configurable source-file retention" but existing `cr-sync-source` bucket has no lifecycle rule. Proposed: 90-day default with per-type override in Settings, deletion job via `pg_cron`.

**Ready to build once you confirm** (a) the tab structure above, (b) the permission matrix, and (c) that migrating BCBA productivity behind the CR Sync engine — while keeping the same downstream tables — is acceptable.
