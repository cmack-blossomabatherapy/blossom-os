# Resource Library — Bulk Upload & Publishing Workflow (Pass 2)

Goal: give Resource Management admins a calm, role-aware workflow for
importing the prepared upload manifest (343 files total — 291 ready,
52 held for review/conversion/safety) without leaking sensitive material
into the standard Resource Library.

## Surfaces

- `/hr/resource-management` — admin-only Resource Management workspace.
  Now includes the **Bulk upload & import** panel at the top of the page
  (`src/components/resources/ResourceBulkUploadPanel.tsx`).
- `/resource-library` — user-facing Resource Library. Continues to render
  only `Published` resources whose `uploadStatus` is `published`
  (or unset for legacy seed entries) and that pass `isVisibleToRole`.

## Upload lifecycle (`ResourceUploadStatus`)

| Status | Meaning | Where it appears |
|---|---|---|
| `ready_to_upload` | Metadata complete, safe to publish | Resource Management — "Ready to publish" queue |
| `pending_review` | Generic admin review | Resource Management only |
| `needs_conversion` | Wrong file type (heic, pages, numbers, key) | Resource Management only |
| `privacy_review` | Possible PHI/PII / filled-in / consent / named-person | Resource Management only |
| `business_review` | Leadership / business approval needed | Resource Management only |
| `vault_only` | Credential / login / portal / vault material | Admin vault — **never** in the standard Library |
| `excluded` | `_Sensitive_Not_For_Shared_Context` or unsafe | Never published |
| `published` | Live in the user-facing Resource Library | `/resource-library` |

`isVisibleToRole` enforces the visibility rule: only `published` (or unset
legacy) entries are returned; everything else stays in Resource Management.

## Auto-classification (`classifyUploadCandidate`)

New candidates are classified up-front to land in the correct queue:

1. Source path contains `_Sensitive_Not_For_Shared_Context` → `excluded`.
2. Title / filename / tags contain a credential keyword
   (`login`, `password`, `credential`, `vault`, `account`, `portal`,
   `passcode`, `ssn`) → `vault_only` + `sensitivity: admin_only`.
3. Title / filename / tags contain a privacy keyword
   (`filled in`, `completed`, `signed`, `consent`, `phi`, `client name`,
   `personal message`, `generic document`) → `privacy_review`.
4. File extension is `.heic`, `.pages`, `.numbers`, `.key` → `needs_conversion`.
5. Otherwise → `ready_to_upload`.

## Role mapping (`CATEGORY_ROLE_DEFAULTS` + `TAG_ROLE_RULES`)

Defaults applied by category, then widened by tag/title rules:

- **HR handbooks & policies**: HR, Operations Leadership, Executive
  Leadership, Super Admin. State-specific handbooks get a state scope.
- **RBT-facing**: RBT, BCBA, State Director, Operations Leadership, Super Admin.
- **BCBA-facing**: BCBA, QA, State Director, Operations Leadership, Super Admin.
- **Scheduling / CentralReach**: Scheduling, BCBA, State Director,
  Operations Leadership, Super Admin (add RBT only when clearly RBT-facing).
- **Recruiting**: Recruiting, HR, Operations Leadership, Super Admin.
- **Authorization / payer**: Authorization Coordinator, BCBA, State Director,
  Operations Leadership, Super Admin. State-scope payer docs where possible.
- **Finance / payroll / bill bonus**: Billing & Finance, Payroll Coordinator,
  HR, Operations Leadership, Executive Leadership, Super Admin.
- **Leadership / State Director**: State Director, Operations Leadership,
  Executive Leadership, HR, Super Admin.
- **Phone System**: Intake, Scheduling, Authorization, Recruiting, HR,
  State Director, Operations Leadership, Super Admin.

Super Admin is always added so the chip set reflects what the visibility
helper will actually allow.

## Storage assumptions

Supabase Storage is **not yet wired** for the bulk pipeline. The panel is
intentionally mock-safe:

- `Choose files` reads file metadata only — no upload happens.
- `Publish ready resources` promotes `ready_to_upload` candidates into the
  in-memory `resources` list with `attachmentStatus: "pending_upload"`.
- No fake `url` / `fileUrl` values are written; the Resource Library detail
  panel already renders pending attachments as a calm placeholder.
- When storage is wired up: replace `candidateToResource` so it uploads to
  the appropriate bucket / folder, stores the public or signed URL, and
  flips `attachmentStatus` to `available`. Vault-only resources should land
  in a private bucket and stay outside of `visibleResources`.

## Excluded / vault-only policy

- Anything under `_Sensitive_Not_For_Shared_Context` is **never** ingested
  and is hard-coded to `excluded` if it ever reaches the classifier.
- Credential / login / vault / portal material is forced to `vault_only` +
  `sensitivity: admin_only` and is filtered out of the standard Library by
  `isVisibleToRole` for every role except `super_admin`.
- `isVisibleToRole` also runs a defensive keyword check on every resource's
  title and tags before returning it — even if a future change misses a
  status flag, credential-style entries cannot leak.

## How admins process the manifest

1. Open `/hr/resource-management` and scroll to **Bulk upload & import**.
2. Drop a batch of files. Items auto-route into queues.
3. **Ready to publish** (≈ 291 files): review chips, edit titles/roles if
   needed, then click **Publish ready resources** to promote them.
4. **Needs privacy review** (named-person messages, filled-in docs): edit
   metadata or convert to a sanitized template, then **Mark ready**.
5. **Needs business review**: leadership/business owner approves, then
   **Mark ready**.
6. **Needs conversion**: export to PDF/PNG/Markdown, re-upload, then
   **Mark ready**.
7. **Vault only**: stays in Resource Management — never reaches the
   standard Library. Wire to a private storage bucket when available.
8. **Excluded**: kept visible to admins for traceability only; not
   published, not vaulted.

## Tests

See `src/test/resourceLibraryPass2.test.ts` for coverage of role mapping,
credential blocking, privacy review routing, queue rendering, and the
admin-vs-user visibility split.