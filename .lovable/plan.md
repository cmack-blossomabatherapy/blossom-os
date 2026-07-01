# Mapsly Integration Plan (Confirmed Direction)

**Decision:** Mapsly for **all** mapping across Blossom OS (Business Development, BCBA/RBT mileage, Recruiting). Mapbox will not be used.

## Phase 1 — Foundation (this pass)
- DB tables: `mapsly_object_map`, `mapsly_sync_log`, `mileage_trips`, `mileage_reimbursement_exports`, `bd_territories`, `bd_territory_leads`.
- Edge function `mapsly-proxy` — server-side gateway that forwards authenticated requests to `https://api.mapsly.com` using `MAPSLY_API_KEY`.
- Admin hub page `/admin/mapsly` — connection test, sync buttons (clients / employees / leads / candidates), sync log.
- Waiting on user to add `MAPSLY_API_KEY` secret.

## Phase 2 — Mileage tracking (`/mileage`)
- Staff self-service view of their trips + status.
- Admin view: approve / reject trips, generate reimbursement export (CSV for Viventium), track rate/mile.
- Webhook endpoint to ingest trips from Mapsly mobile tracker.

## Phase 3 — BD Territory + Routing (`/bd/territories`)
- Territory list (state/region/owner), pins for leads/prospects/referrals.
- Territory editor (color, owner, boundary) — admin/BD lead.
- Route planning entry point (deep link into Mapsly).

## Phase 4 — Recruiting Map (`/recruiting/map`)
- Candidate proximity view: plot candidates and clients, filter by role/state, drive-time radius via Mapsly.
- Deep link into Mapsly for route + list building.

## Phase 5 — Retire Mapbox
- **Verified: no Mapbox dependency or code exists** in the repo. Nothing to remove.

## Next step
Add `MAPSLY_API_KEY` in Project Secrets, then click **Test Connection** on `/admin/mapsly` to validate.