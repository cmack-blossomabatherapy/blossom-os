## Goal

When a parent taps a Blossom NFC card, their phone should:
1. Show a safe-looking prompt ("Open in Safari: blossom.abacommandcenter.com")
2. Open the public Smart Badge profile directly — no Lovable login, no sandbox screen
3. Read as "Blossom Smart Badge" in the OS tap prompt / share previews

## Why it's broken today

- `EmployeeProfile → NfcTab` builds the URL with `window.location.origin`.
- When you copy it from the preview, it points to `id-preview--…lovable.app` / `lovableproject.com`, which is gated by Lovable's sandbox auth — that's the "Login to Lovable" screen parents see.
- The `/nfc/:code` route itself is already public (not behind `ProtectedRoute`), so the only thing wrong is the host.

## Changes

### 1. Centralize a public base URL
Add `src/lib/publicUrl.ts` exporting `PUBLIC_BASE_URL` and a `nfcBadgeUrl(code)` helper.
- Resolves in this order: `VITE_PUBLIC_BASE_URL` env → `https://blossom.abacommandcenter.com` (custom domain) → fallback to `window.location.origin`.
- Used everywhere a public-facing URL is generated (NFC tab QR + copy link, public share buttons).

### 2. Wire NFC tab to the public URL
In `src/pages/os/users/EmployeeProfile.tsx → NfcTab`:
- Replace `${window.location.origin}/nfc/${…}` with `nfcBadgeUrl(active?.tag_code ?? m.uuid ?? m.id)`.
- Prefer the tag's short code (e.g. `NFC-1A2B3C`) over the UUID for shorter, friendlier URLs on the OS prompt.
- Update the "Profile URL" helper text to say "This is what you write to the physical tag. Use the production URL so phones recognize it as safe."

### 3. Brand the OS tap prompt + share preview
In `src/pages/nfc/NfcPublicProfile.tsx`:
- Set `document.title = "Blossom Smart Badge — {Employee Name}"`.
- Inject Open Graph + Twitter meta (`og:title = "Blossom Smart Badge"`, `og:description`, `og:image = blossom logo`, `theme-color = #2B7BD5`) via a small `useEffect`. This makes iOS Safari, iMessage previews, and Android Chrome show a Blossom card instead of a raw URL.
- Add an Apple touch icon link so the saved-to-home-screen badge is Blossom-branded.

### 4. Soften the page's first-paint copy
Replace the loading state text on `NfcPublicProfile` from "Verifying…" to "Opening Blossom Smart Badge…" so the parent sees brand language even before the data resolves. Keep the rest of the parent-portal layout as-is — it's already safe (photo, role, "Contact Blossom", "Report concern", no personal contact info).

### 5. Document re-programming the physical tag
Add a small "How to write this to a tag" note in the NFC tab pointing the admin at any standard NFC writer app and the production URL — because even after the code change, **the existing physical tag still holds the old preview URL** and must be rewritten once with the new URL.

## Out of scope

- Changing the underlying route path (`/nfc/:code` stays).
- Auth flow changes — the public profile already requires no login; only the host needs fixing.
- Building an in-app NFC writer.

## Acceptance

- Generating an NFC card for Corey Mack in the profile shows a URL starting with `https://blossom.abacommandcenter.com/nfc/NFC-…`.
- Tapping a tag programmed with that URL opens the Smart Badge directly on the phone, with the OS prompt reading "Open in Safari: blossom.abacommandcenter.com".
- iMessage / link previews show "Blossom Smart Badge" with the Blossom logo.
- No "Login to Lovable" screen appears.
