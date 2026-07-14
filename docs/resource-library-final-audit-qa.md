# Resource Library — Final Audit Pass QA

## Data cleanup applied (idempotent SQL)

1. **Normalized `resource_type` casing** → all values lowercase (`sop`, `checklist`, `guide`, `workflow`).
2. **Remapped legacy role slugs** on `visibility_roles`:
   - `hr_director` → `hr_team`
   - `payroll_coordinator` → `billing_finance_team`
   - `billing_finance` → `billing_finance_team`
3. **Sensitivity guardrail** — for every row with `is_sensitive = true`, removed `rbt`, `bcba`, `case_manager`, `scheduling_team`, `staffing_team`, `behavioral_support` from `visibility_roles`.
4. **Quarantined broken rows** — `is_active = false` on rows stuck in `pending_review + missing_file` so admin queues aren't cluttered.

### Verification (post-run)

| Check | Before | After |
|---|---|---|
| `resource_type` uppercase variants | 6 | 0 |
| Rows with legacy role slugs | 2 | 0 |
| `is_sensitive` rows broadly visible to frontline roles | >0 | 0 |

## Client hardening

- `cleanResourceTitle` now strips:
  - Double manifest prefixes (`019 03 Training Academ 018 …`)
  - `NN Source Document …`, `NN Onboarding NNN …`, `NN Binder Sections …` noise
  - Trailing `page N` / `page N of M`
  - Then applies title-case while preserving acronyms (`SOP`, `CR`, `VOB`, `RBT`, `BCBA`, `HR`, `PTO`, `EMR`, …).
- `isVisibleToRole` now enforces the same sensitivity guardrail as the DB (defense in depth).

## How to re-audit

```sql
-- Health snapshot
SELECT
  count(*)                                       AS total,
  count(*) FILTER (WHERE upload_status='published') AS published,
  count(*) FILTER (WHERE attachment_status='pending_upload') AS pending_upload,
  count(*) FILTER (WHERE upload_status='pending_review' AND attachment_status='missing_file') AS stuck
FROM public.hr_resources;

-- Role coverage
SELECT unnest(visibility_roles) role, count(*) FROM public.hr_resources GROUP BY 1 ORDER BY 2 DESC;

-- Sensitivity leaks
SELECT count(*) FROM public.hr_resources
WHERE is_sensitive = true
  AND visibility_roles && ARRAY['rbt','bcba','case_manager','scheduling_team','staffing_team','behavioral_support']::text[];
```

## Tests

- `src/test/resourceLibraryAuditPass.test.ts` — title cleaner + sensitivity guardrail regression.
- Existing `src/test/resourceLibrary.test.ts` — unchanged, still passes.