
# Phone → Blossom OS Integration (CTM-first)

Scope is locked to what you have working today: **CallTrackingMetrics** is the source of truth for every call in and out. Jivetel / GoIntegrator server APIs are deferred; dialing happens through the browser's `tel:` handler so it uses whatever softphone the user has installed (GoIntegrator, native dialer, mobile). When Jivetel API access is available later, we swap the dial handler without touching the rest.

## 1. Universal Click-to-Call

New shared component `<PhoneNumber value={...} context={{ leadId?, clientId?, employeeId? }} />` that:

- Renders the formatted number + a call button.
- On click → opens `tel:+1XXXXXXXXXX` (works with GoIntegrator, iOS, Android, softphones).
- Records the outbound intent in a new `phone_dial_events` table (who dialed, target number, linked record, timestamp) so we can reconcile against the CTM call event that arrives seconds later.

Wired into:
- Intake leads (list rows + detail — both `phone` and `parent_cell_phone`)
- Clients + parent contacts
- Employees / staff directory + org chart cards
- Global replacement of every raw phone number render in the app (search-and-replace pass on the ~dozen components that print `{phone}` today)

## 2. CTM Call Tracking (already flowing)

The `ctm-webhook` edge function already writes to `ctm_call_events`. This pass hardens the downstream side:

**Auto-link + timeline write** (new edge function `ctm-link-call`, triggered from the webhook after insert):
- Match caller/called number against `intake_leads.phone`/`parent_cell_phone`, `clients` contacts, and `employees.work_phone`/`personal_phone`.
- Match outbound calls against the most recent `phone_dial_events` row (same agent + same destination within 60s) to attribute who dialed.
- On match, insert a row into `intake_communications` (for leads) or `client_timeline` (for clients) with direction, duration, recording URL, transcript, CTM call id.
- Update `intake_leads.last_contact_at` / equivalent client field.

**Recording + transcript surfacing:**
- Store `recording_url` and `transcript` on `ctm_call_events` (already columns) and expose them in the timeline entry with a playable audio element and collapsible transcript.

## 3. Missed-Call Alerts + Follow-ups

- Webhook branch: when `call_status = 'missed' | 'voicemail'` and matched to a lead/client, create a `client_tasks` / `intake_tasks` row assigned to the record's owner titled "Return missed call from {name}".
- Fire a message into the floating **escalation chat** thread for that record's owner so it surfaces immediately.
- Unassigned missed calls (no owner) land in a new "Unclaimed Calls" queue on `/phone/lookup`.

## 4. Per-User Call Stats

- New view `v_user_call_stats` aggregating `ctm_call_events` by matched `agent_user_id` (from dial-intent join): calls today/week, avg duration, missed count, talk time.
- Small stat card rendered on the user's own dashboard + on the Intake / BD / Scheduling command centers (filtered to that department's users).

## 5. CTM Lookup Surfaces

**Per-record tab** on lead + client detail pages:
- "Call History" tab listing every `ctm_call_events` row matching any phone number on that record, newest first, with play/transcript inline.

**Global search page** at `/phone/lookup` (Intake, BD, Ops, Exec, Admin roles):
- Search by phone number, date range, agent, tracking number, or transcript keyword (Postgres `to_tsvector` on transcript).
- Row click → jumps to the linked lead/client if matched, or offers "Attach to lead/client" for orphan calls.

## 6. Admin

Extend `/admin/ctm`:
- Add a "Recent unlinked calls" table so an admin can spot mapping gaps.
- Show per-tracking-number call volume last 7 days.

---

## Technical section

**New tables**
- `phone_dial_events` — id, user_id, target_number_e164, linked_lead_id, linked_client_id, linked_employee_id, dialed_at. RLS: user can insert their own; Intake/Ops/Exec/Admin can read all.
- (No new table for stats — view over `ctm_call_events`.)

**Schema tweaks**
- `ctm_call_events`: add `matched_lead_id uuid`, `matched_client_id uuid`, `matched_employee_id uuid`, `matched_agent_user_id uuid`, `linked_dial_event_id uuid`, `linked_at timestamptz`. Indexes on the four match columns + `(caller_number)`, `(called_number)`, and a GIN index on `to_tsvector('english', coalesce(transcript,''))`.

**Edge functions**
- `ctm-link-call` (new, service-role): runs the matching + timeline writes + task creation. Called by `ctm-webhook` after insert and available as a manual "re-link" trigger from the admin page for backfills.
- `ctm-webhook` (existing): add branch to enqueue `ctm-link-call` invocation.

**Frontend**
- `src/components/phone/PhoneNumber.tsx` — the universal click-to-call component + dial-event logger.
- `src/components/phone/CallHistoryTab.tsx` — per-record CTM history with audio + transcript.
- `src/pages/phone/CTMLookup.tsx` — global search page (route `/phone/lookup`, added to Phone menu for allowed roles).
- `src/hooks/useCallStats.ts` + `<CallStatsCard />` for dashboard embeds.
- Search-and-replace pass to swap raw phone renders for `<PhoneNumber />`.

**Access**
- Click-to-call: everyone who can already see the phone number.
- `/phone/lookup`: Intake, BD, Scheduling leads, Ops, Exec, Admin (matches existing Phone allow-list minus RBT).
- Recording/transcript: restricted to Intake, BD, Ops, Exec, Admin, and the assigned owner of the matched record.

**Out of scope this pass** (call out explicitly)
- Jivetel API / GoIntegrator server integration — deferred until you have API creds. Dialing works via `tel:` today; the reconciliation layer (`phone_dial_events` ↔ `ctm_call_events`) is designed so swapping in a real Jivetel dial API later is a one-file change.
- In-browser softphone / WebRTC.
- SMS send from the OS (CTM inbound SMS already logs via the webhook).
