## Intake Export 88 — Phase 2 Plan

Phase 1 already shipped the canonical pipeline cleanup across `/leads`, IntakeDashboard, LeadActionPanel, ParentCommunication, MissingInformation, and the role menu. Phase 2 finishes the surfaces that still reference legacy stages and adds Intake-specific Training, Resource Library, and Reports cards.

### Scope (in order)

1. **Lead Detail drawer + page audit** (`src/components/leads/LeadDetailDrawer.tsx`, `LeadDetailPanel.tsx`, `src/pages/LeadDetail.tsx`)
   - Replace any remaining legacy stage strings with `canonicalFamilyLeadStage` + the helpers added in Phase 1 (`isNonQualifiedStatus`, `isCannotReachStatus`, `isLeadOutOfPipeline`, `hasMissingFormReview`).
   - Rename "Missing Information" badges/sections to "Packet Follow Up / Missing Info" and "VOB" wording to "Benefits Verification".
   - Ensure stage selectors only offer canonical stages; bulk move and quick actions go through `intakeWorkflow` helpers.

2. **Training Academy — Intake role view** (`src/pages/os/OSTraining.tsx` + supporting data)
   - Add an Intake learner section listing the existing Intake SOPs / workflows already in the resource collections (no new modules invented).
   - Surface "Continue Learning" cards filtered to the Intake role using the existing role-aware filter; no LMS bloat.

3. **Resource Library — Intake collection surface** (`src/lib/resources/resourceCollections.ts`, `src/pages/os/OSResourceLibrary.tsx`)
   - Make sure the Intake collection is selectable and that Intake-tagged resources show up for Intake roles. Fix any miscategorized "VOB" → "Benefits Verification" labels in the collection metadata only.

4. **Reports — Intake report cards** (`src/pages/Reports.tsx` or the live reports catalog)
   - Add Intake-specific report cards (Lead volume by source, Stage aging, Packet follow-up backlog, Conversion to Ready to Start). Cards route to existing report views; no new analytics engine.

5. **Tests** — extend `src/test/intakeExport88FullDepartmentLaunch.test.ts` with assertions covering:
   - LeadDetailDrawer no longer contains legacy stage labels.
   - Training page renders the Intake section for the intake role.
   - Resource Library exposes the Intake collection.
   - Reports page lists the four Intake report cards.

### Out of scope (per the original Export 88 directives)
- No active patient workflow.
- No automations.
- No new AI menu sections.
- No new unrelated department pages.
- No Phone System / Patient Lifetime Journey access additions.

### Risk / sequencing
Phase 2 touches presentation surfaces only — no schema changes. After each step I'll run the existing canonical-pipeline tests plus the new assertions to make sure legacy stage drift cannot return.
