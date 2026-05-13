## Goal

Today every CSV upload wipes the table and the dashboard pulls **every** session in 1k pages on each visit. As uploads pile up daily this gets slower and risks losing history when someone uploads a partial CSV. We'll fix three things:

1. Let each upload choose **Replace** or **Append** (merge).
2. Make the dashboard load the **last 90 days** by default, with a one-click "Load older" expansion.
3. Cache the loaded window in `sessionStorage` so refreshes/navigation are instant.

No visual redesign — just better data flow.

---

## 1. Upload: Replace vs Append

In the upload sheet, add a small toggle next to the file picker:

- **Replace all data** (current behavior — deactivates + deletes prior imports)
- **Append to existing** (keeps prior imports active, dedupes by natural key)

Pass `mode: "replace" | "append"` to the `import-bcba-sessions` edge function.

Edge function changes:
- `replace`: unchanged (existing flow).
- `append`: insert the new import row as `is_active = true`, do NOT touch prior imports, and dedupe rows on insert using a natural key `(date_of_service, client_full, provider_full, procedure_code, hours)` so re-uploading an overlapping CSV doesn't double-count.
  - Add a unique index on that tuple (nullable-safe via `coalesce`) and use `ON CONFLICT DO NOTHING`.

Dashboard reads change from `.eq("is_active", true) … limit 1` to "all active imports" — totals become the union of every active import.

---

## 2. Dashboard: recent window by default, expand on demand

Replace the unbounded paged fetch with a date-windowed query.

- Default window: **last 90 days** (`date_of_service >= today − 90d`).
- Window selector chips at the top of the page: `30d · 90d · 6mo · 12mo · All`.
- Persist the chosen window in the same `localStorage` key as the other filters.
- Server-side filter via `.gte("date_of_service", …)` — much smaller payload than today.
- "Load older" button appears at the bottom of the BCBA list whenever a window is active; clicking expands to the next tier (90d → 6mo → 12mo → All) and re-fetches.
- Existing date-range pickers in the filter sheet still work and override the chip when set.

Keep the 1k pagination loop, but it'll usually finish in one page now.

---

## 3. Cache the loaded window

After a successful fetch, write `{ windowKey, fetchedAt, sessions }` to `sessionStorage` (key: `ceoDashV2.cache.v1`).

On mount:
- If cache exists and `windowKey` matches the current selection and `fetchedAt` is < 10 minutes old → hydrate instantly, then revalidate in the background.
- Otherwise fetch fresh.

A small "Refresh" icon button in the header force-refetches and rewrites the cache. Successful upload also invalidates the cache.

`sessionStorage` (not `localStorage`) so it doesn't bloat across tabs/devices and clears naturally.

---

## 4. Small supporting pieces

- Add an index on `bcba_billable_sessions(date_of_service)` and `(import_id, date_of_service)` so the windowed query stays fast as the table grows.
- Header shows `N sessions · window: last 90 days · updated 2m ago` so the user can see exactly what's loaded.
- If append mode is used, the "active import" badge becomes "N active imports" and clicking it lists them with delete buttons (so a bad partial upload can be rolled back).

---

## Out of scope (call out if you want these next)

- Server-side aggregation / RPC views (not needed yet given the smaller window).
- Cross-session caching to IndexedDB.
- Background pre-warming of older windows.

---

## Files touched

- `supabase/functions/import-bcba-sessions/index.ts` — accept `mode`, append path, dedupe.
- New migration — unique index for dedupe + `date_of_service` indexes.
- `src/pages/CeoDashboardV2.tsx` — window chips, multi-import fetch, sessionStorage cache, append/replace toggle, active-imports manager.
