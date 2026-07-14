
# Resource Library — Full Audit & Hardening Pass

Goal: prove the library is trustworthy for every role. Fix what the audit surfaces, then ship a repeatable QA report so we can re-run this any time.

## What the audit already shows (live DB, 8,870 rows)

| Signal | Count | Notes |
|---|---|---|
| Total resources | 8,870 | 7,512 published, 1,295 pending file upload, 63 stuck `pending_review + missing_file`, 1,176 `missing_file + pending_upload` |
| Videos | 60 | detection now works, but many will be `missing_file` |
| Dirty titles | Hundreds | `"156 02 Source Document…"`, `"019 03 Training Academ 018 …"`, `"00 Ann First Week Onboarding Package page 6"`, `"04 Job Packet"`, page-split files, truncated words like `"Academ"` |
| Resource type casing | 6 rows | `SOP` / `sop`, `Checklist` / `checklist`, `Guide` / `guide` — breaks type filtering |
| Role mapping drift | 3 rows | Stray `hr_director`, `payroll_coordinator`, `billing_finance` singletons (canonical is `hr_team` / `billing_finance_team`) |
| RBT coverage | 500 | Sanity-check — RBTs should mostly get training + role packet only |
| Marketing / BD | 944 / 1,443 | Verify no PHI/finance leakage |
| Sensitive rows | ~2.9k | Confirm none escape to `rbt / bcba / case_manager / scheduling_team / staffing_team` |

## Plan

### 1. Data cleanup migration (one migration, idempotent)
- **Normalize `resource_type`** to lowercase canonical values (`sop`, `checklist`, `guide`, `workflow`).
- **Normalize `visibility_roles`**: map `hr_director → hr_team`, `payroll_coordinator → billing_finance_team`, `billing_finance → billing_finance_team`; dedupe arrays.
- **Rewrite `title`** in place using the same rules as `cleanResourceTitle` (strip leading `NNN `, `NN NN `, `W#D# `, `RFO-#####`, `page N` suffixes, trailing extensions, collapse whitespace). Only touch rows whose current title matches the dirty patterns so re-runs are no-ops.
- **Backfill empty `description`** using the type/department/title template already in `resourceDisplayDescription` so search + list cards read cleanly even for API consumers.
- **Sensitivity guardrail**: for any `is_sensitive = true`, remove `rbt`, `bcba`, `case_manager`, `scheduling_team`, `staffing_team`, `behavioral_support` from `visibility_roles` (leadership / HR / finance keep access).
- **Quarantine broken rows**: set `is_active = false` on the 63 `pending_review + missing_file` rows so they stop showing up in admin queues until re-uploaded; log the list to `docs/`.

### 2. Fix the display layer where the DB can't help
- Extend `cleanResourceTitle` to catch the patterns the audit revealed:
  - Double order prefix + truncated word: `019 03 Training Academ 018 …` → `Training Academy — Billing Department Guide`.
  - `page N` / `page N of M` trailing markers.
  - Preserve capitalization for acronyms (`SOP`, `CR`, `VOB`, `RBT`, `BCBA`, `HR`, `PTO`).
- Extend `inferResourceCategoryFromTitle` for the new academy/onboarding patterns so titles auto-categorize correctly.
- Update `useLibraryResources.ts` to trust the cleaned DB value first, fall back to the client cleaner only when needed.

### 3. Role-by-role visibility verification
Build a single audit script (`scripts-tmp-audit-library.mjs`, dev-only) that, for every canonical `OSRole`:
- Counts visible published resources.
- Flags roles with `0` visible resources.
- Flags any `is_sensitive` row visible to disallowed roles.
- Flags rows visible only to `super_admin` that aren't tagged `admin_only`.
- Writes results to `docs/resource-library-role-audit.md` (checked in so we can diff future runs).

### 4. UX polish for the library shell
- `/resource-library` (Home): show role name in header, per-section counts pulled from the same scoped set the sub-tabs use (Home / My Role / Departments / Training / SOPs & Forms / Videos), so numbers never disagree between tabs.
- **My Role** and **Departments**: keep the current tabs. Add an "Only pinned" toggle and an empty-state CTA that links to the correct admin upload page for admins, and to Ask Blossom for everyone else.
- **Videos**: show a `Missing file` badge instead of hiding rows whose bucket object is gone, so admins can spot what to re-upload.
- **Detail view**: display cleaned title + description, source note, owner, last reviewed date, and a `Report issue` button that files a `system_issues` row scoped to `resource-library`.

### 5. Admin surfaces
- `Resource Management` and `Training Management Center`:
  - Add a top card "Library health" with the same counts the audit produces (published, pending file, missing file, sensitive-but-broadly-visible).
  - Deep-link each count to a filtered list so admins can act.
- Keep the existing bulk upload + QA checklist untouched.

### 6. Tests + docs
- Extend `src/test/resourceLibrary.test.ts`:
  - `cleanResourceTitle` covers all newly discovered dirty patterns.
  - `useLibraryResources` filters `is_active + published` (regression).
  - Sensitivity guardrail: given a synthetic `is_sensitive` row, `isVisibleToRole('rbt' | 'bcba' | ...)` returns `false`.
  - Role-map normalization: legacy `hr_director` / `payroll_coordinator` / `billing_finance` map to canonical roles when read.
- Add `docs/resource-library-role-audit.md` (generated) and `docs/resource-library-final-qa-manifest.md` describing the pass, migration IDs, and how to re-run the audit script.

### Technical notes
- All migrations run through the DB migration tool with the standard `GRANT` + RLS structure; existing policies on `hr_resources` are already correct so no policy changes.
- No changes to storage buckets, no re-ingest — this pass only cleans metadata, tightens visibility, and hardens the UI.
- Learner UI still reads via `useLibraryResources` (published only). Admin UI keeps using `useAdminResources` and gets the new health card.

### Deliverables
1. One data-cleanup migration.
2. Updated `cleanResourceTitle` + `resourceDisplayDescription` + `useLibraryResources`.
3. Role-scoped `/resource-library/*` polish (badges, counts, empty states, report-issue).
4. Library health card on the two admin pages.
5. New tests + two docs (`role-audit`, `final-qa-manifest`).

Once approved I'll implement in one build pass and report per-role counts before/after.
