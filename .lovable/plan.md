## Make the OS profile NFC tab role-aware

The public `/nfc/:code` page is already role-aware (RPC returns `role_key`, shell renders the right variant). The stale-feeling surface is the **NFC tab inside the OS employee profile** — its copy and side panels are hardcoded to the RBT/BCBA "parent safety" framing for everyone.

### What to change

Single file: `src/pages/os/users/EmployeeProfile.tsx` (NfcTab component, ~lines 828–1060).

1. **Derive the role variant in the tab**
   - Pull the same role-key logic used by the RPC into a small client helper (`roleKeyFromTitle(job_title)`) and reuse `variantFor()` + `ROLE_VARIANTS` from `src/pages/nfc/roleVariants.ts`.
   - Compute `variant = variantFor(roleKeyFromTitle(m.job_title))` once per render.

2. **Role-aware status copy** (replaces the hardcoded "parent tap" sentence on line 1007–1009)
   - `parentSafety: true` (RBT) → keep current "parents see a verified badge, never personal info" wording.
   - `parentSafety: false` (everyone else) → "When someone taps this tag, they'll see a verified Blossom business card with role, department, and the contact actions you've enabled."
   - Eyebrow chip above the URL row: `<variant.icon /> {variant.eyebrow}` so it's obvious which template is active.

3. **Role-aware "tap experience" card** (replaces lines 1036–1044)
   - Render the variant's `actions` list as the bullets ("Email", "Schedule", "Save to Contacts", etc.) using `ACTION_META` labels/icons.
   - Show the variant's `tagline` as the subhead.
   - For parent-safety roles, keep the "Personal contact info hidden" line; for business-card roles, replace it with "Tap Save to Contacts adds to phone."

4. **Inline live preview**
   - Add a right-column card (next to the QR) that renders a scaled-down mock of the public card using the same variant + the employee's existing fields (photo, name, credential, job title, department, expertise chips, action row).
   - This is presentation-only — no new data fetches, just reuse `m` (DirectoryEmployee) and the variant.
   - Include a small "What [role] looks like to others" label.

5. **Keep everything else as-is**
   - Tag assignment, write-to-tag, revoke, QR, and the production-URL warning all stay untouched.
   - No backend, RPC, or routing changes.

### Out of scope

- The public `/nfc/:code` page (already role-aware).
- The RPC `get_nfc_badge` (already returns `role_key`).
- The admin `/admin/identity` dashboard.

### Technical notes

- Import: `import { variantFor, ACTION_META, type RoleKey } from "@/pages/nfc/roleVariants";`
- Client-side role-key derivation must match the SQL CASE in `get_nfc_badge` — same regex order, same fallback to `"employee"`.
- All colors via semantic tokens (no hex). Preview card uses `bg-card`, `border-border/70`, `text-primary` etc., matching the public shell.
