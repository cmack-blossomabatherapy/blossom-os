import { describe, it, expect } from "vitest";
import {
  qualifyCtmCall as qualifyBrowser,
  resolveCtmLeadMatch,
} from "@/lib/intake/ctmQualification";
import { qualifyCtmCall as qualifyEdge } from "../../supabase/functions/_shared/ctm/qualification.ts";
import { evaluateAdmissionReadiness } from "@/lib/intake/admissionReadiness";
import {
  INTAKE_CANONICAL_STAGES,
  canonicalIntakeStage,
  guardIntakeStageTransition,
  INTAKE_STAGE_TO_STORED_STATUS,
} from "@/lib/intake/intakeCanonicalStages";
import {
  normalizeIntakeRole,
  isDirectorOfIntake,
  isIntakeCoordinator,
  hasIntakeAccess,
} from "@/lib/intake/intakeRoles";
import type { Lead } from "@/data/leads";

const CONFIG = {
  trackingNumbers: ["(555) 200-1000"],
  campaigns: ["intake"],
  excludedTags: ["spam", "internal"],
  excludedNumbers: ["555-999-0000"],
  minDurationSeconds: 15,
};

const FIXTURES = [
  { name: "qualified", call: { ctm_call_id: "1", direction: "inbound", from_number: "5551112222", tracking_number: "5552001000", duration_seconds: 120 }, state: "eligible" },
  { name: "outbound", call: { ctm_call_id: "2", direction: "outbound", from_number: "5551112222", tracking_number: "5552001000", duration_seconds: 120 }, state: "excluded" },
  { name: "spam tag", call: { ctm_call_id: "3", direction: "inbound", tags: ["Spam"], from_number: "5551112222", tracking_number: "5552001000", duration_seconds: 120 }, state: "excluded" },
  { name: "blocked number", call: { ctm_call_id: "4", direction: "inbound", from_number: "5559990000", tracking_number: "5552001000", duration_seconds: 120 }, state: "excluded" },
  { name: "wrong routing", call: { ctm_call_id: "5", direction: "inbound", from_number: "5551112222", tracking_number: "5553334444", duration_seconds: 120 }, state: "excluded" },
  { name: "too short", call: { ctm_call_id: "6", direction: "inbound", from_number: "5551112222", tracking_number: "5552001000", duration_seconds: 4 }, state: "excluded" },
  { name: "no identifier", call: { ctm_call_id: "7", direction: "inbound", tracking_number: "5552001000", duration_seconds: 120 }, state: "incomplete_review" },
  { name: "missing id", call: { direction: "inbound" }, state: "error" },
];

describe("Intake acceptance — shared CTM qualification", () => {
  it.each(FIXTURES)("$name is judged identically in the app and the backend", ({ call, state }) => {
    const browser = qualifyBrowser(call as never, CONFIG);
    const edge = qualifyEdge(call as never, CONFIG);
    expect(browser.state).toBe(state);
    expect(edge).toEqual(browser);
  });

  it("never guesses between multiple lead matches", () => {
    expect(resolveCtmLeadMatch({ identifierMatches: ["a", "b"] })).toMatchObject({
      action: "review",
      state: "ambiguous_review",
    });
    expect(resolveCtmLeadMatch({ identifierMatches: ["a"] })).toMatchObject({ action: "link_existing" });
    expect(resolveCtmLeadMatch({})).toMatchObject({ action: "create_lead" });
    expect(resolveCtmLeadMatch({ provenanceLeadId: "p", identifierMatches: ["a", "b"] })).toMatchObject({
      action: "link_existing",
      via: "provenance",
    });
  });
});

describe("Intake acceptance — canonical stages", () => {
  it("owns exactly eight stages ending at Admission Ready", () => {
    expect(INTAKE_CANONICAL_STAGES).toHaveLength(8);
    expect(INTAKE_CANONICAL_STAGES.at(-1)).toBe("Admission Ready");
  });

  it("maps every canonical stage to a stored pipeline status", () => {
    for (const stage of INTAKE_CANONICAL_STAGES) {
      expect(INTAKE_STAGE_TO_STORED_STATUS[stage]).toBeTruthy();
      expect(canonicalIntakeStage(INTAKE_STAGE_TO_STORED_STATUS[stage])).toBe(stage);
    }
  });

  it("blocks advancement when requirements are missing and allows a Director exception", () => {
    const lead = { id: "l1", status: "Lead Captured" } as unknown as Lead;
    const blocked = guardIntakeStageTransition(lead, "Contact / Qualification");
    expect(blocked.allowed).toBe(false);

    const coordinatorException = guardIntakeStageTransition(lead, "Contact / Qualification", {
      directorException: true,
      isDirector: false,
    });
    expect(coordinatorException.allowed).toBe(false);

    const directorException = guardIntakeStageTransition(lead, "Contact / Qualification", {
      directorException: true,
      isDirector: true,
    });
    expect(directorException).toMatchObject({ allowed: true, viaException: true });
  });

  it("advances one step at a time", () => {
    const lead = { id: "l2", status: "Lead Captured", phone: "5551112222" } as unknown as Lead;
    expect(guardIntakeStageTransition(lead, "Intake Packet").allowed).toBe(false);
    expect(guardIntakeStageTransition(lead, "Contact / Qualification").allowed).toBe(true);
  });
});

describe("Intake acceptance — admission readiness", () => {
  const items = [
    { key: "demographics", label: "Demographics", required: true, status: "complete" as const },
    { key: "insurance", label: "Insurance Cards", required: true, status: "missing" as const, missing: ["Payer / plan"] },
  ];

  it("blocks handoff while a required item is missing", () => {
    const r = evaluateAdmissionReadiness(items);
    expect(r.checklistSatisfied).toBe(false);
    expect(r.handoffEligible).toBe(false);
    expect(r.blockers.join(" ")).toContain("Insurance Cards");
  });

  it("counts a Director waiver as satisfied but still requires approval", () => {
    const waived = [
      items[0],
      { ...items[1], status: "waived" as const, waivedBy: "dir", waivedReason: "Self-pay family" },
    ];
    const r = evaluateAdmissionReadiness(waived);
    expect(r.checklistSatisfied).toBe(true);
    expect(r.submissionReady).toBe(false);
    expect(r.blockers).toContain("Director of Intake approval required");
  });

  it("is handoff eligible once approved", () => {
    const waived = [items[0], { ...items[1], status: "waived" as const, waivedReason: "Self-pay" }];
    const r = evaluateAdmissionReadiness(waived, {
      approvedBy: "dir",
      approvedAt: new Date().toISOString(),
    });
    expect(r.submissionReady).toBe(true);
    expect(r.handoffEligible).toBe(true);
  });
});

describe("Intake acceptance — role aliases", () => {
  it("normalizes every legacy alias to the two supported experiences", () => {
    for (const r of ["director_of_intake", "intake_lead", "intake_director", "intake_manager"]) {
      expect(normalizeIntakeRole(r)).toBe("intake_lead");
    }
    for (const r of ["intake_coordinator", "intake", "intake_team"]) {
      expect(normalizeIntakeRole(r)).toBe("intake_coordinator");
    }
    expect(normalizeIntakeRole("rbt")).toBeNull();
  });

  it("scopes Director-only capabilities", () => {
    expect(isDirectorOfIntake(["intake_coordinator"])).toBe(false);
    expect(isDirectorOfIntake(["intake_lead"])).toBe(true);
    expect(isDirectorOfIntake(["super_admin"])).toBe(true);
    expect(isIntakeCoordinator(["intake"])).toBe(true);
    expect(hasIntakeAccess(["rbt"])).toBe(false);
  });
});
