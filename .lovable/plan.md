## RBT Role Buildout — Confirmed Principles

Before writing code, confirming the RBT role is governed by:

- **Role-scoped** — only see RBT-relevant pages, no leadership/finance/recruiting/HR-admin surfaces
- **Assignment-scoped** — only their assigned clients, schedule, BCBA, supervision, training
- **Mobile-first** — primary surface is one-thumb usable; desktop is a graceful upgrade
- **Extremely simple** — daily clarity over analytics; no KPI walls, no charts unless they answer "what do I do next?"
- **Focused on**: today's schedule, assigned clients, session support, training, communication, help/escalations

If anything above is wrong, say so and I'll adjust before building.

---

## Phased Build (this chat = phase 1)

### Phase 1 — Right now
1. **Rebuild the RBT sidebar** in `OSShell.tsx` with the exact RBT menu (Home / Clients & Sessions / Communication / Resources / AI).
2. **Rebuild `/rbt` Dashboard** (`OSRBT.tsx`) — strip the current "mission control" page back to a calm, mobile-first daily-clarity dashboard:
   - Greeting + today's date
   - Next session card (single focal point)
   - Today's schedule (compact list, 1 line per session)
   - Schedule changes / cancellations alert (if any)
   - Supervision reminder (assigned BCBA + next touchpoint)
   - 1 training reminder (next due)
   - Quick "Need Help" button
   - No analytics, no wellness gauge, no team comparison, no AI sparkles panel
3. **Add placeholder routes** for the rest of the RBT menu so navigation never 404s.

### Phase 2 — Next chats (one page per turn, in order)
- My Day (execution home — session check-in flow)
- My Schedule
- My Clients
- Session Support
- Supervision
- Messages & Updates
- Need Help / Escalations
- RBT Training Academy journey
- RBT-scoped Resource Library view
- RBT-scoped Ask Blossom AI prompts

### Phase 3 — Data wiring
Replace mock data with real assignments from existing CentralReach / `useCentralReachOps` / `bcbaCaseload` hooks, scoped to `auth.user_id` → assigned RBT record.

---

## Technical notes

- Reuse `OSShell` — add a new `RBT_SECTIONS` array and route on `role === "rbt"` (same pattern as `BCBA_SECTIONS`).
- New routes: `/rbt/my-day`, `/rbt/clients`, `/rbt/schedule`, `/rbt/session-support`, `/rbt/supervision`, `/rbt/messages`, `/rbt/help`, `/rbt/training-academy`, `/rbt/resources`. AI uses existing `/ai/assistant`.
- Mobile-first: dashboard built at `375px` baseline, scales up. No horizontal scroll, tap targets ≥ 44px.
- Design tokens only (no raw colors). Apple-calm aesthetic per Blossom OS design system.
- Strip the existing `OSRBT.tsx` decoratively-heavy hero, AI panel, wellness gauge, performance sparklines, badges, and "Daily Mission Control" branding. Save as backup? — No, replace; we can always revert.

---

## Open questions (answer only if you want different defaults)

1. Keep the rich "right rail" on the dashboard or drop it entirely for calm? (Default: **drop it** on the dashboard; My Day will have a small "support" rail.)
2. For the "Need Help" entry — separate page (default) or a global modal triggered from every page?
3. Real-data wiring: do it now (Phase 1) or after all pages have shape (Phase 3, default)?
