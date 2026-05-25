
## Recruiting Team — Audit & Real Backend Plan

The Recruiting Team module has **17 pages** wired up at clean routes (`/recruiting/*`) with a working sidebar nav. Everything renders, drag-and-drop stage moves persist, and interview checklists persist. **Every other page still runs on per-file static mock arrays.** There is no `candidates` table — only `recruiting_workflow_stages` and `interview_outcome_checks`.

Making "all data real" means designing one shared candidate domain, seeding it with realistic Blossom data, and rewriting each page to read/write from it. That is a large body of work. Here is how I will phase it so it lands correctly without breaking what already works.

### Phase 0 — Audit pass (no code changes)
- Confirm every sidebar link routes to a real page (✅ confirmed — all 17 routes exist in `App.tsx`).
- Confirm cross-page links (Team → Pipeline, Pipeline → Interviews, etc.) are intact.
- Catalog the data shape every page invents locally so the unified schema covers them all.

### Phase 1 — Foundation: real candidate backend
- **Migration**: create `recruiting_candidates` (identity, role RBT/BCBA, state, pipeline stage, source, recruiter, dates), `recruiting_interviews`, `recruiting_offers`, `recruiting_onboarding_tasks`, `recruiting_background_checks`, `recruiting_orientation_slots`, `recruiting_staffing_needs`, `recruiting_followups`, `recruiting_escalations`, `recruiting_messages`. RLS: authenticated read; recruiter/admin write.
- **Seed** ~30 realistic candidates across GA/NC/TN/VA/MD with the full lifecycle populated (some in pipeline, some interviewing, some offered, some onboarding, some BG-check, some orientation-ready, some staffed). This is realistic operational data — not Lorem.
- **Shared hook** `useRecruitingCandidates()` with filters + realtime, used by every page.

### Phase 2 — Pipeline + Workspace + Team dashboard
Rewire these three (the entry points) onto `useRecruitingCandidates`. Drag-and-drop already persists; now the candidates themselves do.

### Phase 3 — Interviews, Offers, Onboarding, Background, Orientation
Rewire the per-stage operational pages. Each becomes a filtered view + the stage-specific child table (interview slots, offer terms, BG status, orientation date, onboarding tasks).

### Phase 4 — Staffing Needs, RBT, BCBA, Performance
Rewire the staffing/role-specific views. Performance pulls real aggregates from the candidates + interviews + offers tables.

### Phase 5 — Follow-Ups, Escalations, Messages
These are operational comm/workflow tables — wire to their own seeded tables plus realtime.

### Phase 6 — Verification
- Click every sidebar item, confirm no errors and real data renders.
- Verify cross-page deep links (`?queue=`, `?stage=`, `?candidate=`) resolve correctly.
- Run the Supabase linter; fix any RLS findings.

### Scope note
Phase 1 alone is ~10 tables, RLS, ~30 seeded candidates with full child records, and one shared hook. Phases 2–5 each rewrite 3–5 large page files (600–800 lines each). I will execute **Phase 0 + Phase 1** in this response (migration + seed + hook), then continue Phase 2+ in follow-up turns so each phase is reviewable and the app never breaks mid-flight.

### Technical details
- Tables use `gen_random_uuid()` PKs, `created_at`/`updated_at`, `updated_at` triggers, and the existing role pattern (no roles on profiles).
- Realtime publication added for tables that need live drag/drop sync.
- Hook lives at `src/hooks/useRecruitingCandidates.ts`; child-record hooks live alongside it.
- Existing `recruiting_workflow_stages` and `interview_outcome_checks` are kept; they continue to override the canonical stage when a recruiter has dragged a card.

Proceed with Phase 0 audit + Phase 1 (schema, seed, hook)?
