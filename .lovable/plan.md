## Goal
Make the uploaded Blossom flower mark the icon everywhere: browser tab, installed/desktop app icon, and iOS home screen.

## Changes

1. Generate square icons from the uploaded PNG (ImageMagick, transparent-safe, centered/padded, never stretched):
   - `public/favicon.png` — 64x64
   - `public/icons/blossom-icon-192.png` — 192x192
   - `public/icons/blossom-icon-512.png` — 512x512
   - `public/icons/blossom-icon-apple-180.png` — 180x180 (opaque white background, since iOS doesn't support transparency well)
   - `public/icons/blossom-icon-maskable-512.png` — 512x512 with ~12% safe-zone padding on a white background so Android/desktop maskable crops don't clip petals

2. `index.html` — keep existing link tags (paths unchanged), just confirm favicon type/sizes still match the new files.

3. `public/manifest.webmanifest` — no path changes needed; keep `background_color`/`theme_color` as-is unless you want them tuned to the mark.

4. Cache note: `public/sw.js` may cache icons — bump any cache version so installed apps pick up the new icon.

## Technical detail
Existing filenames are reused so no code, manifest, or HTML path edits are required beyond verification. Old icon files are overwritten in place.
