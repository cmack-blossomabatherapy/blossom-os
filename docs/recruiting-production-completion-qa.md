# Recruiting Production Completion QA

Date: 2026-07-29 · Environment: production-connected Lovable Cloud project
Verification: Vitest full suite, TypeScript, production build, live Playwright smoke against the running app with an authenticated session.

---

## 1. Menu / route inventory and evidence

All 20 Recruiting-role menu paths were loaded in a real browser with an authenticated session and MFA satisfied. Result of the final run (see §7 for the failures found and fixed):

| Path | Renders | Notes |
| --- | --- | --- |
| /recruiting-team | PASS | Recruiting dashboard |
| /recruiting/workspace | PASS | Recruiting OS workspace |
| /recruiting/pipeline | PASS | Candidate pipeline + Apploi health bar |
| /recruiting/jobs | PASS | **New** — live Apploi job postings (135 of 135 rendered) |
| /recruiting/rbt | PASS | Includes staffing handoff panel |
| /recruiting/bcba | PASS | Includes staffing handoff panel |
| /recruiting/office-staff | PASS | First-class family pipeline |
| /recruiting/clinic-staff | PASS | First-class family pipeline |
| /recruiting/interviews | PASS | Was crashing — fixed |
| /recruiting/offers | PASS | Was crashing — fixed |
| /recruiting/background | PASS | Was crashing — fixed |
| /recruiting/orientation | PASS | Was crashing — fixed |
| /recruiting/onboarding | PASS | Was blank — fixed |
| /recruiting/staffing-needs | PASS | Was crashing — fixed; hosts handoff review queue |
| /recruiting/performance | PASS | Was crashing — fixed |
| /recruiting/follow-ups | PASS | Was crashing — fixed |
| /recruiting/messages | PASS | Was crashing — fixed |
| /recruiting/escalations | PASS | Was crashing — fixed |
| /recruiting/resources | PASS | Redirects to /resource-library (intended) |
| /reports | PASS | Single canonical reports entry for recruiting roles |

Final Playwright pass over the previously broken routes returned **zero page errors and zero non-warning console errors**.

## 2. Apploi integration

- Base: `https://partners.apploi.com` · endpoints used: `/jobs/search`, `/applicants`, `/applicants/applicant-statuses` (read-only; no POST anywhere in the adapter).
- Auth: team-scoped `x-api-key` read from the server secret `APPLOI_API_KEY`. Never present in `src/`; enforced by test.
- Record counts: **135 job postings**, **0 applicants**.
- Idempotency: normalized-record upsert keyed on integration + provider record id + kind, reporting insert/update per record; re-running the sync updates rather than duplicating.
- Schedule: `apploi-sync-cron` invoked by pg_cron every 4 hours, throttled server-side (30 min scheduled / 5 min manual).
- Security:
  - Scheduled invocation requires the server-only `APPLOI_CRON_SECRET` in `x-cron-secret`, compared with a constant-time check. A public caller with no secret is rejected.
  - Manual "Sync now" requires a valid JWT (`getClaims`) plus a recruiting/HR/admin role read server-side from `user_roles`. Unauthenticated → 401; wrong role → 403.
  - Upstream errors are sanitized; the API key is stripped from any operator-visible message and never logged.

### Known provider limitation (external blocker)
The granted Apploi partner key is authorized for `/jobs/search` only. `/applicants` returns zero records with no upstream error — applicant read permission has not been granted to this team key. Surfaced to recruiters as an honest "applicant records are not yet shared" state, and to admins only as a diagnostic that names the missing permission and states it is a provider permission gap, not a sync failure. Resolution requires Apploi enabling applicant scope for the Blossom partner key.

## 3. Role permission matrix

| Capability | recruiting_team / _lead / _coordinator | staffing / operations | admin |
| --- | --- | --- | --- |
| Recruiting menu + all 20 routes | Yes | Partial (staffing queues) | Yes |
| Apploi job postings | Read | Read | Read |
| Apploi admin diagnostic | Hidden | Hidden | Visible (`super_admin` / `systems_admin`) |
| Manual Apploi sync | Yes (server-authorized) | No | Yes |
| Propose staffing handoff | Yes | Yes | Yes |
| Accept / decline handoff | No | Yes | Yes |
| Client PHI (diagnosis, insurance, notes) | No | Per existing clinical policy | Per policy |
| Integration sync run rows | No (health via definer RPC only) | No | Yes |

Menus alone are not the control: route guards and RLS enforce the same matrix on direct URL access.

## 4. Pipelines and staffing handoff data flow

All four pipelines (RBT, BCBA, Office Staff, Clinic Staff) read `recruiting_candidates` with real persisted search/filter/sort, candidate detail, owner, source, applied title, internal stage, provider status, next action, and activity history in `recruiting_activity_events`. Stage moves go through the canonical stage mappers, so board substages are never cast onto `pipeline_stage`. Manual candidate entry works for every family, which is required while Apploi applicant scope is unavailable.

Handoff flow:

```text
recruiter (candidate detail)
  → StaffingHandoffDialog  (minimum staffing-fit fields only)
  → recruiting_staffing_needs   (handoff_status = proposed)
  → recruiting_staffing_need_events (audit trail)
  → StaffingHandoffReviewQueue (staffing/operations)
  → accepted | declined | cancelled
```

- Client selection goes through the `recruiting_client_staffing_options` SECURITY DEFINER function, which returns masked alias + location only. Recruiting code never queries `clients` directly.
- Fields captured: client label/alias, state, city/clinic, service setting, role needed, priority, desired start, required availability, staffing-fit preference notes, source/entered-by. No diagnosis, clinical notes, or insurance — enforced by test.
- Duplicate active proposals for the same candidate + client + role are blocked.
- A candidate who has not cleared offer/onboarding/readiness gates is saved as a proposed future match with the blocker shown, never as an assigned clinician.

## 5. Database / RLS changes

- `recruiting_staffing_needs`: extended with staffing-fit + handoff columns. RLS on; read via `recruiting_can_read`, write via `recruiting_can_write`.
- `recruiting_staffing_need_events`: new audit table. RLS on; read for recruiting or `staffing.view`, insert for recruiting or `staffing.edit`.
- `recruiting_client_staffing_options()`: SECURITY DEFINER, returns masked client staffing options only.
- `integration_normalized_records`: recruiting/HR roles may read only `integration_id = 'apploi'` rows of kind `candidate`/`job`; admins read all.
- `integration_sync_runs`: admin-only read; recruiters see health through the definer health RPC.
- Secret added: `APPLOI_CRON_SECRET` (server-only, never returned to any client).

## 6. Fixes made in this pass

1. **Route-crashing realtime defect (highest impact).** `useRecruitingCandidates` reused fixed Supabase realtime topics, so a second subscriber on the same topic threw `cannot add postgres_changes callbacks ... after subscribe()`, blanking 10 Recruiting routes behind the error boundary. Every subscription now gets a unique topic.
2. Registered `/recruiting/jobs` in routing, all three recruiting role menus, and the OSShell live-path sets.
3. Corrected the `OperatorDiagnosticsGate` import path on the jobs page.
4. Aligned the integration readiness manifest with the live Apploi adapter (documentation URL, optional secrets), removing two stale contract failures.
5. Updated the pre-existing Apploi test contract to expect the hardened `apploi-sync-cron` manual-sync path.

## 7. Test commands and results

```text
npx vitest run
  → Test Files 337 passed (337)
  → Tests 7430 passed | 64 skipped (7494) | 0 failed

npx tsgo --noEmit -p tsconfig.app.json   → clean
npx vite build                            → success

Playwright smoke (20 recruiting routes, authenticated):
  → 20/20 render, 0 page errors, 0 non-warning console errors
```

New tests: `src/test/recruitingProductionCompletion.test.ts` (16 tests) covering cron secret + JWT/role authorization, no frontend credentials, minimum-PHI handoff contract, lifecycle/audit/duplicate guards, recruiter-vs-staffing separation of powers, and the jobs surface.

## 8. Runbook

- **Manual refresh:** Recruiting → Job Postings or Candidate Pipeline → "Sync now". Throttled to one manual run per 5 minutes.
- **Scheduled refresh:** pg_cron job `apploi-sync-every-4h`. If it stops, confirm the job row still sends `x-cron-secret` and that `APPLOI_CRON_SECRET` matches the function secret.
- **Applicants stay at zero:** expected until Apploi grants applicant scope. Recruiters continue with manual candidate entry; no code change needed when the scope is granted — the adapter already reads `/applicants`.
- **Rotating the Apploi key:** update `APPLOI_API_KEY` in Project Settings → Secrets; no redeploy of the frontend required.

## 9. Rollback

- Revert the code changes listed in §6; they are additive except the realtime topic fix, which is safe to keep.
- `/recruiting/jobs` can be removed by deleting its route, menu entries, and OSShell live-path entries.
- The staffing handoff is disabled by removing `StaffingHandoffPanel` from the RBT/BCBA records and the review queue from staffing needs; the tables retain their data.
- To disable scheduled syncing without a deploy, unschedule the pg_cron job or unset `APPLOI_CRON_SECRET` (scheduled calls then fail closed).
