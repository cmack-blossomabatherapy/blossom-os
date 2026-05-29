## Goal
Make the public NFC / Smart Badge page show the same profile picture you see in OS user management, give admins a way to upload/replace that picture from the OS profile, and surface a clear "what's missing" checklist so every employee can ship a complete digital business card.

## Why the public badge looks empty today
- The OS user-management profile renders `m.photo` from `useEmployeeDirectory`, which falls back to bundled brochure photos (`PHOTO_BY_CODE`) when the DB column is empty — so it always looks populated.
- The public NFC page (`/nfc/:code`) calls the `get_nfc_badge` RPC and uses the raw `employees.photo_url` column, which is `null` for every current employee. No fallback → initials circle.
- There is no UI in the OS profile to upload/replace `employees.photo_url`. The existing `AvatarUploader` only exists on `/profile` (self-serve). Storage RLS already permits HR admins to write to any path in the `avatars` bucket, so no policy change is needed.

## What we'll build

### 1. Inline photo uploader on the OS Employee profile
- Add a Blossom-styled photo block to the top of `src/pages/os/users/EmployeeProfile.tsx` (header card) that reuses `AvatarUploader`.
- Wire it to the live `employees` row (lookup by `m.uuid`): on save it writes `photo_url` + `avatar_url` and refreshes the directory cache so the badge preview, org chart, and Team Directory all reflect it instantly.
- Editable only for HR/admin roles (reuse existing role helpers); read-only avatar for others.

### 2. Public Smart Badge picks up the same photo
- Extend `get_nfc_badge` RPC to also return `employee_code` so the public page can resolve the brochure fallback the same way the directory does.
- In `NfcPublicProfile.tsx`, when `photo_url` is null, look up `PHOTO_BY_CODE[employee_code]` (small helper imported from `teamDirectory`) before falling back to initials. This means existing seeded employees show their brochure photo immediately, and any uploaded photo wins over it.

### 3. "Smart Badge readiness" panel in the NFC tab
- New section in the NFC tab of `EmployeeProfile.tsx` that shows a checklist of fields the badge actually uses: photo, credential, job title, department, states, about-me/bio, expertise, skills, languages, email/phone (if business-card variant), pronouns.
- Each row shows a status pill (Complete / Missing) and a one-click "Edit" affordance that jumps to the right editor (Identity tab, HR editor, or opens the photo picker). A header progress bar shows "X of N fields complete — ready to print badge".
- The existing `NfcCardPreview` stays; the checklist sits next to it so admins immediately see the cause of any sparse-looking preview.

### 4. Light polish
- When the badge preview shows the initials state, add a subtle "Add a photo to finish this card" caption that opens the new uploader.
- After upload success, invalidate the directory query so the OS user list, org chart, and NFC preview repaint without a manual refresh.

## Technical notes
- Files touched:
  - `src/pages/os/users/EmployeeProfile.tsx` — add header uploader, readiness panel, caption.
  - `src/pages/nfc/NfcPublicProfile.tsx` — consume `employee_code`, brochure-photo fallback.
  - `src/hooks/useEmployeeDirectory.ts` — export `PHOTO_BY_CODE` (or a small `photoForCode()` helper) for reuse.
  - One migration: `CREATE OR REPLACE FUNCTION public.get_nfc_badge(...)` to add `employee_code text` to the returned columns. No table changes, no new policies (avatars RLS already covers HR admin uploads).
- No new bucket, no new table, no new edge function. All data flows through existing RLS.

## Out of scope
- Bulk-backfilling `employees.photo_url` from brochure assets (the fallback covers display; uploader is the path to a "real" stored photo).
- Re-skinning the public `/nfc/:code` page beyond the photo fix.
