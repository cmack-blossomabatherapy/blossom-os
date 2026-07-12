## Fix 1 — Login always lands on Company Home

**File:** `src/pages/Auth.tsx`

- Change the post-login redirect to always send users to `/home` (CompanyHome) on a fresh sign-in, instead of computing `redirectTo` from `location.state.from`.
- Keep the "return to `from`" behavior only when `from` is one of a small allow-list of app pages that meaningfully benefit from resume (e.g. `/reports/*`, `/work-queue`, `/clients/*`). Direct deep-links like `/user-management/...` will no longer trap the user there; they'll land on the company home first.
- No other auth changes.

Result: signing in as `testintake@blossomabatherapy.com` (or anyone) drops you on the Company Home page (calendar, updates, highlights).

## Fix 2 — Personal Information section shows every NFC Badge field

**File:** `src/pages/account/AccountSettings.tsx` (extend existing Profile card; keep the same "Your account" page)

Today it edits: first name, last name, preferred name, pronouns, address, meeting link.

Add the remaining NFC Badge fields so a user can fully populate their digital card from Settings:

- **Identity & display**
  - Photo (upload → `employees.photo_url`, uses existing avatar storage)
  - Credential (e.g. "BCBA, LPC")
  - LinkedIn URL
- **Contact**
  - Work phone
  - Extension
  - (Email + job title stay read-only — HR-managed, matching the existing note)
- **About**
  - Short bio / About me (textarea)
  - Languages (chip input)
  - Expertise (chip input)
  - Skills (chip input)
  - "I can help with…" (chip input)
- **Emergency contact** (collapsible section)
  - Name, relationship, phone, email → stored on `employees.emergency_contact` JSON
- **Badge visibility toggles** (mirrors what the NFC page reads from `nfc_settings`)
  - Public card enabled / Internal card enabled / Business-card style / Emergency info visible

Implementation notes:
- Extend the `ProfileRow` select to include: `photo_url, credential, linkedin_url, phone, extension, bio, about_me, expertise, skills, languages, help_with, emergency_contact, nfc_settings`.
- Save writes back to the same `employees` row so the NFC public profile immediately reflects changes (it already reads those columns via the `Badge` type in `src/pages/nfc/NfcPublicProfile.tsx`).
- Reuse existing shadcn `Input`, `Textarea`, `Switch`, and a small chip-list helper for array fields.
- Preserve the current single-column, calm layout — grouped into "Identity", "Contact", "About you", "Emergency contact", "Badge visibility" sections with dividers.
- Nothing else on the page changes.

## Out of scope
- No changes to NFC public profile rendering, roles, routing (other than login default), user management, or HR data model.
- No new tables — all fields already exist on `employees`.