## Verified current state

- The `app_role` enum has three recruiting values: `recruiting_assistant`, `recruiting_lead`, `recruiting_coordinator`. There is no `director_of_recruiting` value.
- `testrecruiting@blossomabatherapy.com` holds only `recruiting_assistant`, which has **no sidebar menu entry** — that is why the account sees nothing.
- Apploi is connected (team 50104, last success 2026-07-28) and has synced **136 job postings and 0 applicants**. `recruiting_candidates` is completely empty.
- Sync is currently **one-way read-only**: an edge function pulls from Apploi into `integration_normalized_records`, then a manual import maps candidates into `recruiting_candidates`. Nothing is ever written back to Apploi.

## 1. Collapse to two recruiting roles

**Director of Recruiting** and **Recruiting Coordinator** become the only recruiting roles.

- Reuse the existing enum value `recruiting_lead` as the backing value for **Director of Recruiting** (relabel only — no enum churn, no data migration risk). Add a `director_of_recruiting` alias only if you'd rather the raw value read cleanly; say the word and I'll add it as a new enum value with a backfill.
- Retire `recruiting_assistant` and the legacy `recruiting_team` key from every selectable list: user management / add-new-hire role picker, bulk provisioning, role management, and the "View as role" preview switcher. Existing holders keep working (permission functions continue to accept the legacy values) so nothing breaks mid-flight.
- Reassign the test account to **Recruiting Coordinator** so it lands on a real menu immediately.
- Align the label and description everywhere: role catalog, role menus, role home, permissions matrix, AI permissions, training journey assignments, reports catalog, workspaces, department dashboards.
- Both roles get a full recruiting menu. Director of Recruiting additionally sees Recruiting Performance, Escalations, Staffing Handoff review, and the Apploi Integration page; Coordinator sees the day-to-day pipeline surfaces.

## 2. Remove Job Postings — applicants only

- Delete the "Job Postings" menu item from every recruiting menu and retire the `/recruiting/jobs` route (redirect to the pipeline so old links don't 404).
- Stop syncing jobs in the Apploi runner; the sync becomes applicants-only.
- Keep the 136 already-synced job records in place but stop surfacing them — no UI reads them after this change.
- Recruiting surfaces (Pipeline, RBT/BCBA/Office/Clinic pipelines, Interviews, Offers) all read `recruiting_candidates`, which is applicant-only. No change needed there beyond the honest empty state below.

## 3. Two-way Apploi (applicants)

**Inbound (already built, currently returns nothing):** Apploi `/applicants` → normalized records → `recruiting_candidates`, keyed on the durable Apploi applicant id, with recruiter-owned fields (stage, notes, next action) protected from being clobbered on re-sync.

**Outbound (new):** when a recruiter changes a candidate's stage or disposition in Blossom OS, push that status back to Apploi via the applicant status-update endpoint, mapped through a Blossom-stage → Apploi-status table. Writes are queued and retried, and every push is written to `recruiting_activity_events` so there's an audit trail. A conflict rule decides the winner when both sides changed since the last sync (last-write-wins by timestamp, with the losing value logged).

**Blocker, stated plainly:** the current partner key returns **zero applicants** and has no documented write scope. Both the inbound applicant feed and any write-back require Apploi to enable applicant read + write scope on this key. I'll build the plumbing behind a feature flag that stays dark until the scope check passes, so the moment Apploi grants access it turns on without another release. Until then the pipeline will show an honest banner: "Apploi is connected, but applicant access is not enabled on the current API key."

## 4. Email to Apploi

I'll draft a ready-to-send email in chat requesting: applicant read scope on the partner key for team 50104, applicant status write-back scope, webhook support for real-time applicant events, and the endpoint/field documentation for status values — including the exact evidence (endpoint called, response, timestamps) so their support team can act without a back-and-forth.

## Technical notes

- Files: `src/lib/roles.ts`, `src/lib/os/roleMenus.ts`, `src/lib/os/roleHome.ts`, `src/lib/os/permissions.ts`, `src/lib/access/roleAssignments.ts`, `src/components/team/BulkProvisionDialog.tsx`, `src/App.tsx`, plus the label references in AI permissions, training journeys, reports catalog, and workspaces.
- Edge function: `supabase/functions/_shared/integrations/providers/apploi.ts` (drop job sync, add write-back) and `apploi-sync-cron`.
- Small migration: an outbound push queue table with grants + RLS, and a role reassignment for the test account. No enum change unless you want the literal `director_of_recruiting` value.
- Existing tests in `recruitingRoutesE2E.test.tsx` and the Apploi identity tests get updated for the two-role model and the removed jobs route.
