## Employee Hub — Profile Upgrade Plan

Goal: Replace the current `/profile` page contents with a premium Apple-style Employee Hub. **Nothing existing is removed** — onboarding/training/cert/competency/HR/admin/auth/Supabase code stays intact. The new profile reuses existing data sources (`useOnboardingStatus`, badges, employee record) and adds new tables only for HR self-service, PTO, and a secure login vault.

---

### 1. Profile Shell (rewrite of `src/pages/Profile.tsx`)

- New `ProfileHero` card: avatar, name, role, department, state, manager, onboarding %, Academy progress, badges, and 4 quick-action buttons (Continue Training, Request PTO, View Logins, View Certificates).
- Segmented tab nav (`Overview · My Learning · Certifications · HR · My Logins · Settings`).
- On mobile: tabs collapse into a horizontally swipeable segmented control; sub-pages use sheet/card layout.

### 2. Section components (`src/components/profile/`)

- `OverviewSection.tsx` — hero stats, Academy snapshot, recent activity, badges grid (reuses existing badge data).
- `LearningSection.tsx` — pulls existing training assignments + Academy progress (read-only summary, links into existing pages).
- `CertificationsSection.tsx` — surfaces existing certs/competencies (read-only summary, links to existing detail pages).
- `HRSection.tsx` — 6 cards: PTO, Hours, Payroll, HR Documents, Benefits, Contact HR. Each opens its own panel/sheet.
  - `PTORequestPanel.tsx` (new flow + history list with status chips: Draft / Submitted / Pending / Approved / Denied / Cancelled).
  - `HoursPanel.tsx` (placeholder weekly ring + recent entries + "Open Time System" link to existing `/hr/time-clock`).
  - `PayrollPanel.tsx` (placeholder pay frequency / next pay / login shortcut + disclaimer).
  - `HRDocumentsPanel.tsx` (cards from new `hr_documents` table + acknowledgement chip).
  - `BenefitsPanel.tsx` (links/list from `hr_resources`, no new schema).
  - `ContactHRPanel.tsx` (deep links to `/hr/announcements`, support email).
- `LoginsSection.tsx` — Apple Passwords-style vault. Cards show system, icon, category, username, masked password, login URL, copy-username, "Unlock Password" CTA, last updated, owner, notes.
  - `UnlockSheet.tsx` — bottom sheet asking for PIN; secondary "Use Face ID / Touch ID" button wired to WebAuthn (`navigator.credentials.get`) when available, PIN fallback otherwise. After success: reveal password for 45s, then auto-mask. Logs every reveal/copy/open event.
  - `PinSetupDialog.tsx` — first-run PIN setup (PBKDF2/Argon2-style salted hash stored in `employee_pin_settings`).
- `SettingsSection.tsx` — wraps existing settings (notification prefs, path switcher, theme, sign out). Keeps `PathSwitcher` and `resetOnboarding` from current Profile page.

### 3. Admin additions (`src/pages/admin/LoginVaultAdmin.tsx`)

- Admin-only page (route `/admin/login-vault`, gated by existing `isAdmin`).
- CRUD for `employee_logins`: add, assign to user / role / department, edit username, mark password-reset-required, set rotation date, archive.
- Read-only `login_access_logs` table (filterable by user/system/action).
- Banner: *"Password vault requires encrypted storage before real passwords are added"* until a server-side decrypt edge function is wired.

### 4. Database (additive migrations only)

New tables, all RLS-protected:

- `employee_hr_profiles` — extra fields (manager_id, department, location_state, pto_balance_hours).
- `pto_requests` — id, user_id, pto_type, start_date, end_date, hours, partial_day, reason, status, manager_id, submitted_at, reviewed_at, review_notes.
- `employee_hours_snapshots` — user_id, week_start, total_hours, source.
- `hr_documents` — title, doc_type, file_url, last_updated_at, requires_acknowledgement, audience.
- `hr_document_acknowledgements` — user_id, document_id, acknowledged_at.
- `employee_logins` — user_id, system_name, system_category, login_url, username, encrypted_password (placeholder text), notes, assigned_by, last_updated_at, password_rotates_at, is_active.
- `login_access_logs` — user_id, login_id, action (viewed/copied_username/copied_password/opened/unlock_failed/unlock_success), occurred_at, device, ip.
- `employee_pin_settings` — user_id, pin_hash, pin_salt, last_set_at, failed_attempts, locked_until.
- `secure_unlock_events` — user_id, method (pin/passkey), success, occurred_at.

RLS policy themes:
- Users: full access to their own rows in all 9 tables.
- Managers (existing `has_role` helper, `manager` role): SELECT on `pto_requests` where `manager_id = auth.uid()`; UPDATE status/review_notes only.
- Admins: full CRUD on `hr_documents`, `employee_logins`; SELECT-only on `login_access_logs`, `secure_unlock_events`. Admins do NOT get default access to other users' passwords (separate `vault_admin` flag, optional later).

### 5. Security guardrails (frontend)

- Passwords never rendered in DOM until unlock; stored in component state with a `setTimeout` auto-clear after 45s.
- Copy-to-clipboard guarded behind unlock; logs `copied_password` event.
- `UnlockSheet` enforces local rate limit (3 failed PIN attempts → 60s lockout, mirrored to `employee_pin_settings.locked_until`).
- WebAuthn passkey path ready but disabled when `navigator.credentials` / `PublicKeyCredential` unavailable; UI clearly says "Set up Face ID later".
- Admin warning banner blocks the "real password" entry field until an encrypted vault edge function exists.

### 6. Routing & nav

- `/profile` keeps its current route; tab state via URL hash (`/profile#hr`, `/profile#logins`).
- Add `/admin/login-vault` to existing admin nav (Admin Hub card).
- No removal of existing `/hr/*` routes — HR section panels deep-link into them where the full UI already exists (e.g., Hours → `/hr/time-clock`, Payroll → existing `Payroll.tsx`).

---

### Technical details

- **State**: section-local `useState`; cross-tab via `useSearchParams` hash. No new global store.
- **Data fetching**: `@tanstack/react-query` (already in repo). One query per section.
- **Styling**: existing `GlassPanel`, `GlassPageShell` patterns + new `hero`/`heroOutline` Button variants. All semantic tokens from `index.css`.
- **Sheets/modals**: `@/components/ui/sheet` for mobile, `@/components/ui/dialog` for desktop unlock.
- **WebAuthn placeholder**: small wrapper `src/lib/security/passkey.ts` with `isAvailable()`, `register()`, `verify()` stubs returning typed results — wired to real APIs when present, `notSupported` otherwise.
- **PIN hashing**: client computes PBKDF2(SHA-256, 100k iters) with random salt; salt+hash stored. Verify by recomputing. (Acceptable v1; can move to edge function later.)
- **Audit logging**: thin `logVaultEvent(action, login_id)` helper inserts to `login_access_logs`; called from every reveal/copy/open code path.

### Out of scope for this pass

- Real encrypted password storage (UI ready, banner explains).
- Manager approval workflows beyond PTO status updates.
- Push/email notifications on PTO submit (placeholders only).
- Migrating existing `/hr/payroll`, `/hr/time-clock` UIs into the profile (we link into them).

### Confirm before I build

1. Migration creates **9 new tables** as listed — OK to run?
2. `/profile` page contents are **rewritten** (route + URL stay the same, no other page touched). Any existing demo data on the current Profile (badges array, PathSwitcher, reset onboarding) is preserved inside the new Overview/Settings sections. Confirm OK.
3. Admin login-vault page added at `/admin/login-vault` — OK to add to Admin Hub navigation card?

Reply "go" (or with adjustments) and I'll implement in one pass.