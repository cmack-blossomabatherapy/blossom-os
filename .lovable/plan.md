# Resource Library Reorganization Plan

The `hr_resources` table currently holds **8,870 items** across three buckets (`resource-library` 6,146, `knowledge-documents` 2,659, `resource-videos` 59, unknown 6). Role tags are inconsistent — a mix of `snake_case` (`super_admin`, `bcba`), Title Case (`Super Admin`, `BCBA`), and stray labels (`State VA`, `Regional State Director`) — and per-role pages (`/hr/team-resources`, `/rbt/resources`, `/bcba/resources`, etc.) each render their own UI. Executives cannot see everything unless explicitly tagged. This plan fixes both the data and the surface in phases.

---

## Phase 1 — Canonical Role & Category Vocabulary

Establish a single source of truth in `src/lib/resources/resourceRoles.ts`:

- Canonical role slugs match `OSRole` in `src/lib/os/permissions.ts` (`super_admin`, `executive_leadership`, `ceo`, `coo`, `director_of_operations`, `state_director`, `assistant_state_director`, `intake_coordinator`, `authorization_coordinator`, `scheduling_team`, `staffing_team`, `recruiting_team`, `hr_team`, `qa_team`, `clinical_director`, `bcba`, `rbt`, `case_manager`, `behavioral_support`, `marketing_team`, `business_development`, `billing_finance`, `credentialing_team`, `payroll_coordinator`).
- Alias map normalizes legacy labels (e.g., `Super Admin` → `super_admin`, `State VA` → `state_director` + state=`VA`, `Regional State Director` → `state_director`, `BCBA` → `bcba`).
- Category taxonomy: `HR`, `Payroll`, `Onboarding`, `Handbook`, `Clinical`, `IT/Systems`, `Training`, `SOPs`, `Videos`, `General`.

## Phase 2 — Data Reconciliation Migration

One SQL migration that:

1. Adds `visibility_roles_normalized text[]` column (temp) and backfills via alias map.
2. Replaces `visibility_roles` with the normalized array; drops the temp column.
3. Backfills `state_scope` from legacy `State VA`/`State NC` tags.
4. Ensures every row includes `executive_leadership`, `ceo`, `coo`, `director_of_operations`, `super_admin` in `visibility_roles` (Executive sees all).
5. Sets `resource_type` from bucket: `knowledge-documents` → SOP/Doc, `resource-videos` → Video, `resource-library` → keep or infer from mime.
6. Normalizes `category` values and fills missing `topic_tags` from filename/title heuristics.
7. Marks 6 orphan rows (no bucket) as `is_active=false`, `pending_reason='missing_storage'` for admin review.

## Phase 3 — Unified Resource Library UI

Make `/resource-library` the single library experience for every role. Every existing per-role route (`/hr/team-resources`, `/rbt/resources`, `/bcba/resources`, `/qa/resources`, `/scheduling/resources`, `/recruiting/resources`, `/payroll/resources`, `/authorizations/resources`, `/case-manager/resources`, `/operations/resources`, `/executive/resources`) redirects to `/resource-library` with a role pre-filter query param. Same layout, same filters, same detail drawer — content differs only by what the RLS + visibility filter returns.

Standard layout:

```text
┌───────────────────────────────────────────────────────────┐
│ Search  |  Type ▾  Category ▾  Department ▾  State ▾  Role ▾│
├───────────────────────────────────────────────────────────┤
│ Pinned for you                                            │
│ [card] [card] [card]                                      │
├───────────────────────────────────────────────────────────┤
│ Browse by category                                        │
│ HR · Payroll · Onboarding · Clinical · IT · Training · … │
├───────────────────────────────────────────────────────────┤
│ Recently added                                            │
│ [row] [row] [row]                                         │
└───────────────────────────────────────────────────────────┘
```

- Sub-routes kept: `/resource-library/role`, `/department`, `/training`, `/sops`, `/videos`, `/resource/:id`, `/admin/qa` — but restyled to share the same header, filter bar, and card component (`ResourceCard`).
- Removes per-role bespoke pages: they become thin wrappers importing the unified page with a preset filter.
- Detail drawer: preview (PDF/video/link), metadata, tags, roles/states, owner, last reviewed, download/open.

## Phase 4 — Access Enforcement

- Update `useLibraryResources.ts` to filter by canonical role and always include the current user's role plus any role they inherit from the executive allow-list.
- Tighten RLS on `hr_resources` so `SELECT` requires the current user's role to appear in `visibility_roles` OR the user is `super_admin`/`executive_leadership`/`ceo`/`coo`/`director_of_operations`.
- Signed URLs remain the only way to fetch files from `resource-library`, `knowledge-documents`, and `resource-videos` (unchanged).

## Phase 5 — Admin QA & Ongoing Hygiene

- `/resource-library/admin/qa` (HR + Super Admin) gains: "Untagged", "Missing storage", "Ambiguous role", and "Duplicate title" queues.
- Bulk actions: assign roles, assign category, assign state, archive.
- Weekly audit log entry via `academy_audit_log` when bulk role edits occur.

## Phase 6 — Verification

- `src/test/resourceLibraryUnified.test.ts`: renders unified library, verifies filter chips, verifies Executive sees all buckets, RBT sees only RBT-tagged.
- `src/test/resourceRoleNormalization.test.ts`: alias map coverage.
- Manual QA checklist in `docs/qa/resource-library-unified.md`.

---

## Technical notes

- Data migration is idempotent — safe to re-run; alias map is versioned.
- `hr_resources.visibility_roles` stays `text[]` (no enum) to avoid churn if new roles land.
- No changes to bucket names, storage paths, or file contents — only metadata.
- Per-role menu entries in `src/lib/os/roleMenus.ts` keep pointing to `/resource-library` (already canonical for most roles); stragglers get redirected.

## Out of scope

- Re-uploading or renaming source files.
- Changing Training Academy content (that lives in `academy_*` tables).
- Building a new upload wizard (existing `/hr/resource-management` stays).
