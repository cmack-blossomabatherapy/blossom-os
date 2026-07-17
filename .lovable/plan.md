
## Goal
Fix three problems on the After-Hours AI page:
1. "Sync from Retell" only pulls ~50 calls; all 500+ historical calls since June 18 must land in the OS.
2. Synced calls all show as **Intake**; each call must be routed to the correct department (Intake / Scheduling / State Director / HR / Urgent).
3. When a new call arrives, the routed department must get an in-app notification (the bell) in real time — not just email.

## What changes

### 1. Retell sync — paginate through everything
`supabase/functions/retell-sync/index.ts`
- Loop through Retell's `POST /v2/list-calls` using the `pagination_key` cursor until exhausted (or a safety cap of 5,000 calls per run).
- Batch upserts into `phone_ai_calls` in chunks of 500 with `onConflict: 'retell_call_id'`.
- Accept an optional `since` timestamp in the body (defaults to the newest `call_started_at` already stored, or June 18 for first run) so re-syncs are cheap.
- Track `records_received / created / updated` on `integration_sync_runs` for observability.
- Return `{ fetched, inserted, updated, pages, oldest, newest }`.

### 2. Classify department on sync (not just webhook)
Extract the department classifier into `supabase/functions/_shared/classifyAfterHoursCall.ts` and call it from both `retell-sync` and `retell-webhook`, so every row — historical and live — is written with the correct `department_to_notify` (`intake`, `scheduling`, `state_director`, `hr`, `urgent`). Existing rows already stored as `intake` are re-classified during the next sync via upsert.

### 3. Per-department in-app notifications
- New migration adds a `notify_after_hours_call()` trigger on `phone_ai_calls` (AFTER INSERT and AFTER UPDATE of `department_to_notify` when it changes from NULL / from the previous value).
- The trigger inserts one row into `user_notifications` for every profile whose role/department matches the routed department. Mapping:
  - `intake` → users in Intake department (or with the Intake OS role)
  - `scheduling` → Scheduling
  - `state_director` → State Directors scoped to the call's `state` when known, otherwise all State Directors
  - `hr` → HR
  - `urgent` → Intake + State Directors + Operations Leadership (fan-out)
- Deduped via a `dedupe_key` of `ah_call:{call_id}:{department}` so re-runs never spam.
- Notification body includes caller name, state, reason snippet, and links to `/phone/ai-calls?call={id}`.
- Existing email routing via `notify-after-hours-call` is preserved and continues to fire in parallel.

### 4. Real-time UI stays in sync
- Confirm `phone_ai_calls` is in `supabase_realtime` publication (add if missing). The `AfterHoursAIBoard` already subscribes to this table and will refresh on every INSERT/UPDATE automatically.
- No UI code changes needed beyond removing the "up to 50" language and passing no limit, letting the sync run to completion.

### 5. First run backfill
After deploying, trigger `retell-sync` once with `{ since: "2026-06-18T00:00:00Z" }` to pull every historical call into `phone_ai_calls`. The trigger will then generate department notifications for all of them (deduped, so safe).

## Not doing
- Not changing the Retell webhook contract — Retell already POSTs to the existing URL.
- Not touching `phone_ai_call_routing` (email routing) — that keeps working as-is.
- Not adding a separate department table; using existing `profiles.department` + role assignments.

## Verification
- Manually run the sync and confirm 500+ rows land in `phone_ai_calls` with a mix of `department_to_notify` values.
- Insert a synthetic row via the webhook path and confirm the corresponding department users see a bell notification within seconds.
- Confirm existing rows previously stored as `intake` get re-classified after the next sync.
