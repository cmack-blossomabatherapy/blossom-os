# Operations Leadership — Pass 4 QA Manifest

**Scope:** Work Queue deep-link filters + Integration readiness snapshot on Ops Command Center.

## Changes

### Work Queue deep-link filters
- `src/pages/os/work-queue/WorkQueuePage.tsx` now reads `useSearchParams()` on mount and
  prefills `view`, `priority`, `status`, and `department` from the URL. Backwards
  compatible — no params → default "active" view.
- `src/components/operations/WorkQueueSignalsCard.tsx` tiles now deep-link with the
  appropriate query string:
  - Open → `/work-queue?status=active`
  - Escalated → `/work-queue/escalations`
  - High / Urgent → `/work-queue?priority=urgent`
  - Overdue → `/work-queue?view=overdue`

### Integration readiness on the Ops Command Center
- `src/pages/os/operations/OpsCommandCenter.tsx` embeds
  `<IntegrationReadinessCard title="Operational integration readiness" />`
  above the quick-nav footer.
- The card reads `integration_catalog` + `integration_connections` directly
  (no secrets exposed) and surfaces honest posture (healthy / attention /
  risk), counts by status, and top attention items.

## Persistence & Permissions
- No new tables, no new RLS. Existing policies on `integration_catalog` and
  `integration_connections` apply.

## Preserved
- All existing Work Queue filters, tabs, and dialogs.
- All existing Command Center sections.

## Verification
- Typecheck: `tsgo --noEmit` — clean.
- Deep links tested by URL construction; page filters initialize from
  `useSearchParams` and remain interactive after mount.

## Next candidates
- Pass 5 (optional): unified Reports landing enhancements for Ops Leadership
  and department-scoped Work Queue permissions (currently authenticated
  read/write; admin-only delete).