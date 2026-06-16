## What I found

The entire phone tracking system (extensions, queues, shared routing, state directory, corporate menu, state intake routing, coverage templates, holiday profiles, settings, change requests, directory labels) lives **only in the user's browser localStorage** under the key `blossom.phone-system.v2` (`src/contexts/PhoneSystemContext.tsx:60`). There is no backend table for any of it.

That fully explains "it's all gone":
- Edits made on one device/browser are invisible to everyone else.
- Clearing site data, switching browsers, an incognito window, or signing in on a new machine wipes the data for that session.
- If the storage key version is ever changed (it was bumped to `v2` at some point), all earlier edits are abandoned.

The only phone-related DB tables today are for AI call logs (`phone_ai_calls`, `phone_ai_call_routing`, `phone_ai_call_notifications`) — the configuration data is not persisted anywhere shared.

## Fix

Move phone-system configuration to the database so it is shared across users and survives browser changes. Keep the existing context API surface so the pages don't need to be rewritten.

### 1. New tables (single migration)

All in `public` schema, with grants + RLS:

- `phone_employees` — extension, user_id, email, name, department, role, source, plus fields the page edits (dnd, forwarding, etc.).
- `phone_queues` — id, name, description, agents (jsonb/text[]), strategy, ring/timeout, etc.
- `phone_shared_routing` — id, name, agents, businessHoursRouting, after-hours config.
- `phone_change_requests` — id, type, status, payload jsonb, created_by, created_at.
- `phone_coverage_templates` — id, name, schedule jsonb.
- `phone_holiday_profiles` — id, name, dates jsonb.
- `phone_state_directory` — state, numbers jsonb.
- `phone_corporate_menu` — option, target, order_index.
- `phone_state_intake_routing` — state, routing jsonb.
- `phone_settings` — singleton row (key = 'default'), jsonb blob mirroring `AdminSettings`.
- `phone_directory_labels` — singleton row, jsonb blob.

RLS: authenticated users can read everything; only users with the `admin` role (via existing `has_role`) can insert/update/delete. `service_role` full access. Add `updated_at` triggers.

### 2. Replace localStorage in `PhoneSystemContext.tsx`

- On mount: load each table in parallel; seed any empty table from the existing `SEED_*` constants in `src/data/phoneSystem.ts` on first run so we don't lose the current defaults.
- All `set*` / `upsert*` / `saveEmployeeExtension` mutations write to the DB (`upsert` for collections, `delete` for removals) and update local state on success; on failure, toast and revert.
- Remove the `KEY` localStorage write/read entirely.
- Keep the `useEmployeeDirectory` sync, but persist the merged results.
- Add a lightweight Realtime channel on the phone tables so a second user sees edits immediately.

### 3. Recover lost edits

I can't recover what was in another user's browser — that data was never sent to a server. Once the new schema is live, all future edits persist for everyone. If the affected user still has the original browser/profile open, I'll add a one-time "Import from this browser" button on the Phone admin page that reads the old `blossom.phone-system.v2` localStorage entry and writes it into the new tables, so any edits still cached locally get rescued.

### 4. Pages

`src/pages/phone/PhonePages.tsx` and related components already go through the context, so no UI rewrite is needed — they'll automatically read from the DB-backed context. I'll spot-check each section (Extensions, Queues, Shared Routing, State Directory, Corporate Menu, State Intake, Coverage Templates, Holiday Profiles, Settings, Change Requests, Directory Labels) to confirm save buttons round-trip.

## Out of scope

- No changes to the AI call log tables.
- No telephony provider integration changes.
