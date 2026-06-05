# Resource Library — Storage & Persistence Plan (Pass 3)

## Existing setup (pre-Pass 3)

| Asset | Status |
| --- | --- |
| `public.hr_resources` table | Existed (id, title, description, kind, category, url, storage_path, visibility_states/roles, is_pinned, is_active, uploaded_by_name, timestamps). |
| Storage bucket for resources | None — only legacy buckets (`journey-resources`, `journey-attachments`, `journey-videos`, `bcba-imports`, etc.). |
| `useLibraryResources` hook | Reads `hr_resources` and maps to `Resource`. |
| Bulk upload UI | Mock-safe panel that produced `attachmentStatus: "pending_upload"` resources only. |
| Open/download | Used `selected.url || selected.fileUrl` and rendered "Attachment pending" otherwise. |

## Pass 3 decisions

### Storage bucket

- **Bucket:** `resource-library` (private).
- **Path layout:** `{category}/{resourceId}/{safeFileName}`
  - `category` = `ResourceCategoryId` (e.g. `sops`, `hr`, `workflows`).
  - `resourceId` = freshly minted UUID for the row.
  - `safeFileName` = lowercased, hyphenated, extension-preserving, length-capped.
- **No local filesystem paths** are stored or surfaced in the UI.
- **No public URLs** — all opens go through short-lived signed URLs (10 min).

### Persisted metadata

`hr_resources` was extended (additive, nullable-safe) with:

| Column | Purpose |
| --- | --- |
| `upload_status`     | `published` is the only status visible in the standard library; held statuses stay admin-only. Default `published` so existing rows keep working. |
| `attachment_status` | `available`, `pending_upload`, or `excluded` (drives the calm placeholder). |
| `sensitivity`       | `public_internal`, `role_restricted`, `admin_only`, `excluded`. |
| `resource_type`     | Higher-level taxonomy (`sop`, `handbook`, `template`, …). |
| `source_note`       | Friendly admin note about where the file came from. |
| `tags`              | Search/role-inference tags. |
| `departments`       | Department scoping (free-form). |
| `file_name` / `file_size` / `mime_type` | Persisted directly from the uploaded `File`. |
| `storage_bucket`    | Which bucket the file lives in (defaults to `resource-library`). |

`storage_path` already existed and continues to hold the in-bucket key.

### Upload lifecycle

1. Admin drops files into `ResourceBulkUploadPanel`.
2. Each file is auto-classified into a queue (Pass 2 behavior, unchanged).
3. On **Publish ready resources**:
   - Only candidates with `uploadStatus === "ready_to_upload"` upload.
   - File is uploaded to `resource-library/{category}/{id}/{safeFileName}`.
   - On success → insert row with `upload_status='published'`, `attachment_status='available'`.
   - On failure → orphan file is removed best-effort, **no DB row is created**, candidate keeps a calm error chip.
4. Held statuses (`privacy_review`, `business_review`, `needs_conversion`, `vault_only`, `excluded`, `pending_review`) **never upload**.

### Read path

- `useLibraryResources` now filters `is_active = true AND upload_status = 'published'` and hydrates all new columns (including `storage_path`).
- `OSResourceLibrary` resolves a signed URL on the user's click via `resolveResourceOpenUrl` — no `href="#"` fallback, no public bucket exposure.

## RLS / security

- `hr_resources` keeps its existing `Manage resources` / `View resources` permission-gated policies.
- Storage bucket `resource-library` is **private**, with two policies on `storage.objects`:
  - `resource-library admins manage` — `ALL` for users holding `hr.resources.manage`.
  - `resource-library viewers read` — `SELECT` for users holding `hr.resources.view` or `hr.view`.
- Signed URLs are issued per-click, short-lived (10 minutes), and never persisted.
- Visibility helper `isVisibleToRole` continues to gate by upload status, sensitivity, role, state, and a keyword safety net for credentials.

## Held / review handling

- Held items are tracked in component state until a Pass 4 review table lands.
- They do not appear in the standard Resource Library — only `published` rows are read.
- Vault and excluded statuses are blocked from being marked ready by the panel actions.

## Remaining backend gaps (intentional)

- A dedicated `hr_resource_review_queue` table would let held items persist across sessions; today they live only in the admin panel's local state.
- The legacy `hr_resource_category` enum is narrow (`handbook|payroll|training|clinical|it|benefits|onboarding|general`); resources are mapped onto it but the richer `ResourceCategoryId` lives in code via category names + the new metadata columns.
- No batch re-classification job yet — admins re-add files that were misrouted.
- A future pass may move to a fully separate `resource_library_files` table; this pass keeps the change additive on `hr_resources` to avoid breaking existing readers.
