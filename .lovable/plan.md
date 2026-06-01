## Goal

Transform `/reports/ai/new` from a "prompt + CSV preview to AI" feature into a real CSV-driven reporting assistant. The data pipeline (parse → inspect → map → calculate) must be deterministic in TypeScript. The AI is only used for narrative/summary/insights — never to invent numbers.

## New file structure

**New library (deterministic engine — pure TS, no AI):**
- `src/lib/os/aiReports/csvParser.ts` — robust CSV parser, multi-file safe, returns `{ headers, rows, rowCount, dateRange }`.
- `src/lib/os/aiReports/schemaInspector.ts` — `inspectCSVSchema(parsed)` returns detected canonical fields (client, provider, date, procedure_code, authorized_hours, worked_hours, pending_hours, remaining_hours, cancellation_reason, session_status) plus missing fields.
- `src/lib/os/aiReports/columnMapper.ts` — `suggestColumnMappings(headers)` using a synonym dictionary; `validateRequiredFields(mapping, requiredKeys)`.
- `src/lib/os/aiReports/calculations.ts` — `normalizeProcedureCodes`, `calculateAuthorizationUtilization`, `calculateCancellations`, `calculateSupervision`, `calculateParentTraining`, `generateExecutiveSummary`, `generateDataQualityFlags`.
- `src/lib/os/aiReports/presets.ts` — report-type presets (Monthly ABA Ops, Auth Utilization, Cancellation, Supervision, Parent Training, Billing, Custom) with required canonical fields + prompt template.
- `src/lib/os/aiReports/types.ts` — `CanonicalField`, `ColumnMapping`, `ParsedFile`, `InspectionResult`, `ReportComputation`.

**Updated UI (step wizard):**
- `src/pages/os/reports/AiReportNew.tsx` — rebuilt as 4-step wizard:
  1. Upload CSV (multi-file, shows row/col count + date range per file)
  2. Choose report type preset OR write custom prompt
  3. Review inspection + edit column mappings (with manual override dropdowns)
  4. Generate → routes to `AiReportView`
- `src/pages/os/reports/AiReportView.tsx` — receives precomputed `ReportComputation` from sessionStorage, renders deterministic KPI cards / tables / data-quality warnings, then calls the edge function only for narrative summary + insights + recommendations layered on top of the real numbers. Adds CSV / Excel / PDF download + copy-summary + regenerate.

**Updated edge function:**
- `supabase/functions/generate-ai-report/index.ts` — accepts the precomputed `ReportComputation` JSON (KPIs, tables, missing fields). System prompt rewritten: AI only writes narrative, executive summary, insight bullets, recommendations, risks based on supplied numbers. Tool schema returns only `{ summary, insights[], recommendations[], risks[], sectionNarratives{} }`. Numbers come from us.

## Data flow

```text
CSV files
  → parseCSV (Papa-style streaming, all rows kept)
  → inspectCSVSchema (detect canonical fields per file)
  → suggestColumnMappings (synonym dictionary)
  → user reviews/overrides mappings in UI
  → calculations.run(preset, parsedFiles, mapping)
  → ReportComputation { kpis, sections[{title, table, chart}], dataQuality, missingFields }
  → edge function generate-ai-report (adds narrative only)
  → AiReportView renders deterministic numbers + AI narrative
```

## Calculations (deterministic)

- **Auth utilization**: per row group by `(client, auth_number, procedure_code)`; `utilization% = worked_hours / authorized_hours`. Flags: `<50% low`, `>=90% near-max`, `>100% over`, missing auth → flag.
- **Cancellations**: filter `session_status` containing "cancel"; group by reason; classify into {client, provider, no-show, illness, weather, other}; top reasons; repeat-offender clients (>=3).
- **Supervision**: per client sum hours for 97153 and 97155; supervision% = 97155/97153; flags <5%, <10%, missing 97155.
- **Parent training**: per client presence of 97156; total 97156 hours; with/without counts + %.
- **Procedure code normalization**: strip whitespace, uppercase, extract leading 5-digit CPT.
- **Data quality**: missing-column list, rows excluded (missing client/date/code), counts.

If a required field is missing, calculations skip and emit `"Unable to calculate because the uploaded CSV does not contain [field]"`.

## Synonym dictionary (column mapper)

| Canonical | Synonyms |
|---|---|
| client_name | client, client name, patient, learner, member |
| provider_name | provider, principal, staff, therapist, rbt, bcba, rendering provider |
| procedure_code | cpt, code, service code, procedure code, billing code |
| service_date | date, service date, appointment date, session date, dos |
| worked_hours | worked, worked hours, billed hours, rendered hours, units, hours |
| authorized_hours | authorized, authorized hours, auth units, auth hours |
| pending_hours | pending, pending hours, pending units |
| remaining_hours | remaining, remaining hours, remaining units |
| cancellation_reason | cancellation reason, cancel reason, reason, status reason |
| session_status | status, appointment status, session status |
| authorization_number | auth, auth #, authorization, authorization number |

## Step 3 UI — inspection + mapping

For each uploaded file: card showing filename, rows, date range, detected canonical fields (green chips), missing required fields for selected preset (amber chips), and a table `Detected column → Canonical field` with a dropdown to override.

## Step 5 — output

- Deterministic KPI cards on top.
- Executive summary (AI narrative).
- Per-section: table (real rows from computation) + AI 1-sentence narrative + insight bullets.
- Data Quality section always shown when flags exist.
- Buttons: Download CSV (computation rows), Download Excel (via SheetJS — `xlsx` already in deps? if not, fall back to CSV multi-sheet zip), Download PDF (print stylesheet + `window.print()`), Copy summary, Regenerate.

## Edge function changes

Old: send CSV preview, AI computes everything.
New: send `{ preset, computation, prompt, audience, timeframe }`. AI returns narrative only. Tool schema:

```json
{
  "summary": "string (2-4 sentences)",
  "insights": ["string"],
  "recommendations": ["string"],
  "risks": [{ "label": "string", "severity": "low|med|high", "note": "string" }],
  "sectionNarratives": { "<sectionId>": "string" }
}
```

If AI fails, UI still renders deterministic numbers with a fallback summary "AI narrative unavailable — numbers below are computed from your CSV."

## Testing

After build, manually validate with a small synthetic CSV containing 97153/97155/97156 rows (built into `__test__/sample.csv` for QA) and confirm:
- Supervision % computed correctly
- Parent training presence detected
- Auth utilization where columns exist
- Missing-field messaging when columns absent

## Out of scope (this pass)

- Real PDF library (use browser print).
- Server-side persistence (keep localStorage AI reports list).
- File size limits beyond browser memory — show warning above 10MB.

## Risks

- Large CSVs (>50k rows) parsed client-side may be slow; will use streaming parser and cap deterministic table outputs to top 100 rows for rendering (full data still used for math).
- `xlsx` package may not be installed — will add as dep only if user approves, otherwise emit multi-CSV zip via `jszip` (also a new dep). Default fallback: download CSV per section.
