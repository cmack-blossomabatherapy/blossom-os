I found the likely loop:

- The page sets `loading=true` every time it reloads calls, so the list visibly blinks to `Loading…`.
- Realtime is subscribed to every `phone_ai_calls` database change and calls `load()` immediately for each inserted/upserted Retell call.
- The sync function upserts many calls in chunks, which can trigger many realtime reloads plus the two manual timed reloads at 4s and 15s.
- Backend logs show the Retell sync is also hitting database statement timeouts during upsert, so the button can create a noisy partial sync that keeps making the UI refresh/reload.

Plan to fix this permanently:

1. Stabilize the After-Hours AI Calls UI
   - Split initial page loading from background refresh.
   - Only show the big `Loading…` state on first page load.
   - For sync/realtime refreshes, keep the existing list visible and show a small syncing/refreshing state instead of blanking the list.
   - Remove the 4s/15s forced reload timers.

2. Debounce realtime updates
   - Replace `() => load()` on every database event with one debounced refresh.
   - If 50 calls are inserted/upserted, the UI refreshes once instead of blinking/reloading 50 times.
   - Prevent overlapping `load()` calls from stacking.

3. Make the Sync Retell button safe
   - Guard against double-clicks and repeated syncs while one is in progress.
   - Add a short client-side cooldown so it cannot accidentally start multiple backend sync jobs.
   - On success, do one quiet refresh and show a clear success/error toast.

4. Make the edge function bounded and predictable
   - Change `retell-sync` from a broad background history job into a short, recent-calls sync.
   - Fetch a limited recent batch from Retell instead of paging through many records.
   - Check existing `retell_call_id`s first and insert only missing calls where possible, avoiding heavy repeated upserts of existing rows.
   - Return a real result with counts, for example `{ fetched, inserted, skippedExisting }`, instead of “queued” while background work continues unseen.

5. Deploy and verify
   - Deploy the updated `retell-sync` function.
   - Test the function response directly.
   - Verify the frontend no longer blanks/blinks during sync and the button returns to normal state.