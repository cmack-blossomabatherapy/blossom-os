# Authorization Analysis — make the weekly authorization tracker real

## What is actually broken

The report is not "empty because of filters". It is empty because the two fields it classifies on are blank for every row:

- `cr_authorizations` holds 3,283 rows, but **`status` is NULL in 3,283 of 3,283** and **`procedure_code` is NULL in 3,283 of 3,283**.
- The real CentralReach authorization export has no `Status` and no `ProcedureCode` column. It carries `ServiceCodes` (" 97151: Behavior Identification assessment..."), `ClientLabels`, `IsActive`, `ActualStartDate` / `ActualEndDate`, `FollowUpStartDate` / `FollowUpEndDate`, and the hours columns.
- Because the classifier reads only `status` + `procedure_code`, every row lands in kind "other" / status "other", so every KPI, every weekly bar, and every breakdown computes zero.

The workflow signal you want is already in the export, just in `ClientLabels`:

```text
Initial Treatment Approved      1,584
Initial Assessment Approved     1,029
Reassessment Approved             956
Initial Treatment                 892
Reassessment                      872
Initial Assessment                782
Concurrent Treatment Approved     558
Telehealth Approved               659
DENIED                             15
```

Service codes present: 97151 (1,016), 97153 (758), 97156 (755), 97155 (754).

What CentralReach does **not** contain: submission dates, any progress-report submitted/approved/denied event, and any pause reason. The operational tables that were supposed to hold them (`client_reauth_cycles`, `authorization_operational_records`, `bcba_progress_reports`) are all empty. So those numbers cannot be derived — the Authorization team has to log them.

## The plan

### 1. Capture the missing CentralReach fields

Extend the authorization normalizer and table so the labels and service codes survive the import:

- New columns on `cr_authorizations`: `service_codes`, `client_labels`, `is_active`, `actual_start_date`, `actual_end_date`, `followup_start_date`, `followup_end_date`.
- `procedure_code` now derives from the 5-digit code inside `ServiceCodes`.
- `status` derives from labels + activity: Approved / Denied / Active / Expired, instead of NULL.
- Reprocess the existing authorization batch so all 3,283 rows backfill — no re-upload needed from you.

### 2. Fix the classifier

- Stage (kind) comes from label first, code second: 97151 or "Initial Assessment" label → Initial Assessment; "Initial Treatment" → Initial Treatment; "Reassessment" / "Reauth" → RA; 97155/97156 treatment codes fall in behind the labels rather than overriding them.
- Approved / Denied read the label ("... Approved", "DENIED"), not free text.
- Removes the current bug where the loose `\bpr\b` / `\bra\b` patterns swallow unrelated text.

### 3. Weekly authorization tracker (the 15 metrics)

A new `authorization_weekly_events` table plus a simple entry screen on the Authorization Analysis page, so the Auth team logs each event once:

Event types tracked: IA Submitted / Approved / Denied, IT Submitted / Approved / Denied, RA Submitted / Approved / Denied, PR Submitted / Approved / Denied, Service Pause (with required reason: No RA on file, PR late or missing — plus a free-text why, Other).

Each entry records client, payor, state, event date (rolls into its week), and who logged it. Logging is restricted to Authorization, QA, Operations Leadership, Executive, and Super Admin roles.

### 4. Rebuild the report around all 15 rows

- **Weekly matrix table**: one row per metric, one column per week, so the 15 tracked items read exactly as you listed them.
- **KPI cards**: submissions this week, approval rate, denials, services paused.
- **Charts**: submitted vs approved vs denied by week; pause reasons breakdown.
- **Breakdowns**: by payor, by state, by client.
- **Derived pause detection** (from CentralReach, no logging needed): clients with billed or scheduled activity in a week but no authorization whose active period covers that date → "No covering authorization". Shown alongside team-logged pauses so gaps in logging are visible.
- Every cell and bar drills down to the underlying rows and exports to CSV.
- Date filters use the existing period-overlap matcher, so an authorization that started before the window still counts while it is active.

### 5. Verification

- Confirm the weekly matrix is non-zero against the real 3,283 rows and that IA / IT / RA counts reconcile to the label counts above.
- Canary test pinning label-driven classification and derived-pause detection so this cannot silently go blank again.
- Confirm any row that cannot be classified surfaces in an "Unclassified" bucket rather than being dropped.

## Technical notes

- Migration: add columns to `cr_authorizations`; create `authorization_weekly_events` with GRANTs, RLS, role-scoped write policy, and state scoping for State Directors.
- `src/lib/os/centralreachUploads/normalize.ts` — `authorizationRow()` gains `ServiceCodes`, `ClientLabels`, `IsActive`, `Actual*`, `FollowUp*` mapping and code/status derivation.
- `src/lib/os/reports/crPrimary/metrics/authorizationAnalysis.ts` — label-first `classifyAuthKind`, label-based `classifyAuthStatus`, and a new weekly-matrix builder merging tracker events with CR-derived rows.
- New `src/lib/os/reports/crPrimary/metrics/authPauseDetection.ts` — coverage-gap pause detection over billing + schedule facts.
- `src/lib/os/reports/crPrimary/source.ts` / `types.ts` — select the new columns; add the tracker reader.
- `src/pages/os/reports/AuthorizationAnalysisPage.tsx` — weekly matrix, pause panel, and the log-event dialog.
- One-time reprocess of the existing authorization batch to backfill the new columns.
