import { describe, it, expect } from "vitest";
import fs from "node:fs";

const read = (p: string) => fs.readFileSync(p, "utf8");

describe("Intake / CTM final pass — canonical wiring", () => {
  it("LeadToActivePipeline page exists and satisfies canonical contract", () => {
    const src = read("src/pages/os/intake/LeadToActivePipeline.tsx");
    expect(src).toMatch(/FAMILY_LEAD_PIPELINE_STAGES/);
    expect(src).toMatch(/canonicalFamilyLeadStage/);
    expect(src).toMatch(/getNextFamilyLeadStage/);
    expect(src).toMatch(/getPreviousFamilyLeadStage/);
    expect(src).toMatch(/FAMILY_LEAD_STAGE_OWNERS/);
    expect(src).toMatch(/Family lead workflow/);
    expect(src).toMatch(/Ready to Start Services/);
    expect(src).toMatch(/isPipelineEnd/);
    expect(src).toMatch(/Hard stop/);
    expect(src).toMatch(/Pipeline end/);
    expect(src).toMatch(/Active patient operations start after this point/);
    expect(src).toMatch(/managed in a separate workflow/);
    expect(src).toMatch(/<Ban /);
    expect(src).not.toMatch(/STAGE_TO_LEAD_STATUS/);
    expect(src).toMatch(/useLeads\(/);
    expect(src).toMatch(/moveStage/);
    expect(src).toMatch(/revertStage/);
    // Guard is called before mutation.
    expect(src).toMatch(/guardIntakeMutation/);
  });

  it("Intake action guard exposes synchronous mode mirror + preview", () => {
    const src = read("src/lib/intake/actionGuard.ts");
    expect(src).toMatch(/setIntakeActionMode/);
    expect(src).toMatch(/guardIntakeMutation/);
    expect(src).toMatch(/isIntakeActionAllowed/);
    expect(src).toMatch(/BlockedActionPreview/);
    expect(src).toMatch(/describePreview/);
  });

  it("LeadsContext mirrors intake mode and guards every mutation entry point", () => {
    const src = read("src/contexts/LeadsContext.tsx");
    expect(src).toMatch(/setIntakeActionMode/);
    expect(src).toMatch(/useIntakeOperatingMode/);
    // Each mutation callback calls guardIntakeMutation before writing.
    expect(src).toMatch(/guardIntakeMutation\("update lead fields"/);
    expect(src).toMatch(/guardIntakeMutation\("bulk update"/);
    expect(src).toMatch(/guardIntakeMutation\("advance\/revert stage"/);
    expect(src).toMatch(/guardIntakeMutation\("assign owner"/);
    expect(src).toMatch(/guardIntakeMutation\("add tag"/);
    expect(src).toMatch(/guardIntakeMutation\("delete leads"/);
  });

  it("integration-webhook promotes eligible normalized records via RPC", () => {
    const src = read("supabase/functions/integration-webhook/index.ts");
    expect(src).toMatch(/promote_normalized_record/);
    expect(src).toMatch(/"lead", "inquiry", "form_submission", "inbound_call", "call"/);
    expect(src).toMatch(/eligible\.has\(norm\.record\.recordKind\)/);
  });

  it("ctm-sync uses the shared normalizer + linker (no duplicated field mapping)", () => {
    const src = read("supabase/functions/ctm-sync/index.ts");
    expect(src).toMatch(/from "\.\.\/_shared\/ctm\/normalizer\.ts"/);
    expect(src).toMatch(/normalizeCtmPayload/);
    expect(src).toMatch(/linkOrCreateLeadForCall/);
    // No local re-derivation of caller_number/called_number.
    expect(src).not.toMatch(/c\.caller_number as string/);
  });

  it("ctm-link-call uses shared linker and no longer writes tasks/comms", () => {
    const src = read("supabase/functions/ctm-link-call/index.ts");
    expect(src).toMatch(/linkOrCreateLeadForCall/);
    expect(src).not.toMatch(/intake_communications/);
    expect(src).not.toMatch(/intake_tasks/);
    expect(src).toMatch(/INGEST_ONLY/);
  });

  it("Review queues page reads only canonical tables/view; no mock authority", () => {
    const src = read("src/pages/os/intake/IntakePromotionReviewQueues.tsx");
    expect(src).toMatch(/intake_promotion_state/);
    expect(src).toMatch(/ctm_unmatched_tracking_numbers/);
    expect(src).toMatch(/promote_normalized_record/);
    expect(src).not.toMatch(/localStorage/);
    expect(src).not.toMatch(/MOCK_/);
  });

  it("App.tsx activates /intake/lead-to-active + /intake/review-queues routes", () => {
    const src = read("src/App.tsx");
    expect(src).toMatch(/import LeadToActivePipeline/);
    expect(src).toMatch(/import IntakePromotionReviewQueues/);
    // Both routes must render their canonical component, not a Navigate redirect.
    const leadToActive = src.match(/path="\/intake\/lead-to-active"[\s\S]{0,600}?\/>/);
    expect(leadToActive, "/intake/lead-to-active route missing").not.toBeNull();
    expect(leadToActive![0]).toMatch(/LeadToActivePipeline/);
    expect(leadToActive![0]).not.toMatch(/Navigate/);
    const reviewQueues = src.match(/path="\/intake\/review-queues"[\s\S]{0,600}?\/>/);
    expect(reviewQueues, "/intake/review-queues route missing").not.toBeNull();
    expect(reviewQueues![0]).toMatch(/IntakePromotionReviewQueues/);
  });
});