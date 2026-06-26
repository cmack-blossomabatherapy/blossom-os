## Goal

Replace the generic "B" taskbar icon on the installed desktop app with a proper branded Blossom icon, and verify desktop notifications work from the installed app.

## What's wrong today

- `public/manifest.webmanifest` only references `/blossom-logo-full.png` — a wide rectangular logo. Windows can't use it as a square app icon, so it falls back to `favicon.ico` (the plain "B" in your screenshot).
- No maskable icon is provided, so Windows/Chrome show a plain letter glyph instead of a designed tile.

## Changes

1. **Generate branded square icons** using the Blossom mark on the brand blue (#2B7BD5) background:
   - `public/icons/blossom-icon-192.png` (192×192, any)
   - `public/icons/blossom-icon-512.png` (512×512, any)
   - `public/icons/blossom-icon-maskable-512.png` (512×512, maskable — logo centered in the safe zone so Windows/Android can crop to rounded squares cleanly)
   - `public/icons/blossom-icon-apple-180.png` (180×180, for macOS dock / iOS home screen)
   - `public/favicon.png` (32×32, replaces the old "B" favicon used as the install fallback)

2. **Update `public/manifest.webmanifest`** to reference the new icons, including a `purpose: "maskable"` entry, and keep the existing theme/background colors.

3. **Update `index.html`** head tags:
   - point `<link rel="icon">` at the new `favicon.png`
   - add `<link rel="apple-touch-icon" href="/icons/blossom-icon-apple-180.png">`
   - leave the existing manifest link untouched

4. **Delete `public/favicon.ico`** so browsers stop using the old "B" as a fallback.

## Desktop notifications

No code changes required — push is already wired up. After the icon update I'll tell you exactly where to click inside the installed desktop app to enable Windows desktop notifications (it's the existing `/mobile/permissions` screen; works identically on desktop).

## Out of scope

- No changes to the service worker, push backend, or any business logic.
- Not switching to `vite-plugin-pwa` or offline caching — installability already works.

## Verification

After the build, you'll need to **right-click the taskbar icon → Unpin**, then reinstall the app from the browser (⋮ menu → Install / Apps → Install) so Windows picks up the new icon. Windows aggressively caches PWA icons at install time — there's no way around the reinstall step.
