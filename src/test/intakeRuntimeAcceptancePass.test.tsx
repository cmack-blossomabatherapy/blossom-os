/**
 * Final Intake runtime verification pass.
 *
 * Renders the real PermissionRoute guard under both Intake experiences
 * (Director of Intake vs Intake Coordinator) and exercises the runtime
 * engines behind the journeys: CTM qualification/idempotency, canonical
 * stage progression with requirement blocks + Director exception, and
 * packet-prep capability gating.
 */
import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { PermissionRoute } from "@/components/auth/PermissionRoute";
import {
  INTAKE_WORKSPACE_ROUTE_ROLES,
  INTAKE_DIRECTOR_ROUTE_ROLES,
  LEADS_ROUTE_ROLES,
} from "@/lib/intake/intakeRouteRoles";
import {
  isDirectorOfIntake,
  isIntakeCoordinator,
  canUseIntakeCapability,
  DIRECTOR_ONLY_CAPABILITIES,
} from "@/lib/intake/intakeRoles";
import {
  INTAKE_CANONICAL_STAGES,
  canonicalIntakeStage,
  INTAKE_STAGE_TO_STORED_STATUS,
  guardIntakeStageTransition,
} from "@/lib/intake/intakeCanonicalStages";
import { qualifyCtmCall, resolveCtmLeadMatch } from "@/lib/intake/ctmQualification";

/* ----------------------------- auth harness ----------------------------- */

const authState = { roles: [] as string[], isAdmin: false };

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "user-1" },
    loading: false,
    roles: authState.roles,
    isAdmin: authState.isAdmin,
    hasPerm: () => true,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

function renderGuard(roles: string[], allowedRoles: string[]) {
  authState.roles = roles;
  authState.isAdmin = roles.includes("admin") || roles.includes("super_admin");
  return render(
    <MemoryRouter initialEntries={["/target?state=GA&tab=queue"]}>
      <Routes>
        <Route
          path="/target"
          element={
            <PermissionRoute allowedRoles={allowedRoles}>
              <div>INTAKE_SURFACE_OK</div>
            </PermissionRoute>
          }
        />
        <Route path="/auth" element={<div>AUTH_PAGE</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

const DIRECTOR = ["intake_lead"];
const COORDINATOR = ["intake_coordinator"];

/* --------------------------- 1. route guards --------------------------- */

describe("Intake route guards — Director vs Coordinator", () => {
  it("Director reaches shared workspace surfaces", () => {
    renderGuard(DIRECTOR, INTAKE_WORKSPACE_ROUTE_ROLES);
    expect(screen.getByText("INTAKE_SURFACE_OK")).toBeTruthy();
  });

  it("Coordinator reaches shared workspace surfaces", () => {
    renderGuard(COORDINATOR, INTAKE_WORKSPACE_ROUTE_ROLES);
    expect(screen.getByText("INTAKE_SURFACE_OK")).toBeTruthy();
  });

  it("Director reaches Director-only surfaces", () => {
    renderGuard(DIRECTOR, INTAKE_DIRECTOR_ROUTE_ROLES);
    expect(screen.getByText("INTAKE_SURFACE_OK")).toBeTruthy();
  });

  it("Coordinator is denied Director-only surfaces", () => {
    renderGuard(COORDINATOR, INTAKE_DIRECTOR_ROUTE_ROLES);
    expect(screen.queryByText("INTAKE_SURFACE_OK")).toBeNull();
  });

  it("both Intake roles reach shared Leads surfaces; RBT does not", () => {
    renderGuard(COORDINATOR, LEADS_ROUTE_ROLES);
    expect(screen.getByText("INTAKE_SURFACE_OK")).toBeTruthy();
    expect(LEADS_ROUTE_ROLES).not.toContain("rbt");
  });
});

/* ----------------- 2. router wiring uses central lists ----------------- */

describe("Intake router wiring", () => {
  const APP = readFileSync("src/App.tsx", "utf8");
  const intakeRoutes = APP.split("\n").filter(
    (l) => /<Route\s+path="\/intake/.test(l) && l.includes("PermissionRoute"),
  );

  it("every guarded /intake route uses a centralized role list (no hand-rolled arrays)", () => {
    const drifted = intakeRoutes.filter((l) => /allowedRoles=\{\[\s*"/.test(l));
    expect(drifted).toEqual([]);
  });

  it("director-only intake routes are guarded by INTAKE_DIRECTOR_ROUTE_ROLES", () => {
    for (const path of ["/intake/assignments", "/intake/configuration", "/intake/review-queues"]) {
      const line = intakeRoutes.find((l) => l.includes(`path="${path}"`));
      expect(line, `${path} missing guarded route`).toBeTruthy();
      expect(line).toContain("INTAKE_DIRECTOR_ROUTE_ROLES");
    }
  });

  it("dashboard, pipeline, tasks and packet prep are open to the whole Intake workspace", () => {
    for (const path of [
      "/intake/dashboard",
      "/intake/lead-to-active",
      "/intake/tasks",
      "/intake/cr-packet-prep",
      "/intake/missing-information",
      "/intake/parent-communication",
    ]) {
      const line = intakeRoutes.find((l) => l.includes(`path="${path}"`));
      expect(line, `${path} missing guarded route`).toBeTruthy();
      expect(line).toContain("INTAKE_WORKSPACE_ROUTE_ROLES");
    }
  });
});

/* --------------------- 3. capability gating (roles) -------------------- */

describe("Intake capability gating", () => {
  it("identifies both experiences", () => {
    expect(isDirectorOfIntake(DIRECTOR)).toBe(true);
    expect(isIntakeCoordinator(COORDINATOR)).toBe(true);
    expect(isDirectorOfIntake(COORDINATOR)).toBe(false);
  });

  it("coordinator cannot use any Director-only capability", () => {
    for (const cap of DIRECTOR_ONLY_CAPABILITIES) {
      expect(canUseIntakeCapability(COORDINATOR, cap)).toBe(false);
      expect(canUseIntakeCapability(DIRECTOR, cap)).toBe(true);
    }
  });
});

/* -------------------------- 4. CTM fixtures --------------------------- */

const QUALIFIED_CALL = {
  ctm_call_id: "CTM-FIXTURE-1",
  direction: "inbound",
  from_number: "+1 (404) 555-0142",
  to_number: "+1 (404) 555-9000",
  tracking_number: "+14045559000",
  duration_seconds: 214,
  talk_time_seconds: 180,
  tags: ["website"],
  campaign_name: "GA Parent Search",
};

describe("CTM ingestion fixtures", () => {
  it("qualifies a real inbound Intake call", () => {
    const r = qualifyCtmCall(QUALIFIED_CALL, { trackingNumbers: ["4045559000"] });
    expect(r.state).toBe("eligible");
    expect(r.reason).toBe("qualified");
  });

  it("creates exactly one lead and stays idempotent on replay", () => {
    const first = resolveCtmLeadMatch({ identifierMatches: [] });
    expect(first).toEqual({ action: "create_lead" });
    // replay of the same call now finds the lead it created → link, not create
    const replay = resolveCtmLeadMatch({ identifierMatches: ["lead-1"] });
    expect(replay).toEqual({ action: "link_existing", leadId: "lead-1", via: "identifier" });
    // provenance always wins → attribution is preserved across retries
    const retry = resolveCtmLeadMatch({ provenanceLeadId: "lead-1", identifierMatches: ["lead-1", "lead-2"] });
    expect(retry).toEqual({ action: "link_existing", leadId: "lead-1", via: "provenance" });
  });

  it("routes ambiguous matches to Director review instead of guessing", () => {
    const r = resolveCtmLeadMatch({ identifierMatches: ["lead-1", "lead-2"] });
    expect(r).toMatchObject({ action: "review", state: "ambiguous_review", reason: "multiple_matches" });
  });

  it("classifies excluded, incomplete and error cases with reasons", () => {
    expect(qualifyCtmCall({ ...QUALIFIED_CALL, direction: "outbound" }).state).toBe("excluded");
    expect(qualifyCtmCall({ ...QUALIFIED_CALL, tags: ["Spam"] }).reason).toBe("excluded_tag");
    expect(
      qualifyCtmCall({ ...QUALIFIED_CALL, talk_time_seconds: 3, duration_seconds: 3 }).reason,
    ).toBe("too_short");
    expect(
      qualifyCtmCall({ ...QUALIFIED_CALL, tracking_number: "+19999999999", to_number: "+19999999999", campaign_name: null, source_name: null }, { trackingNumbers: ["4045559000"] }).reason,
    ).toBe("not_intake_routing");
    expect(
      qualifyCtmCall({ ...QUALIFIED_CALL, from_number: null, caller_email: null }).state,
    ).toBe("incomplete_review");
    expect(qualifyCtmCall({ ...QUALIFIED_CALL, ctm_call_id: null }).state).toBe("error");
    expect(qualifyCtmCall(null).reason).toBe("malformed_payload");
  });
});

/* ------------------ 5. canonical stage journey (1 lead) ---------------- */

type AnyLead = Record<string, unknown>;

const READY_LEAD: AnyLead = {
  id: "lead-fixture",
  status: "Lead Captured",
  parentName: "Dana Reyes",
  childName: "Milo Reyes",
  state: "GA",
  phone: "404-555-0142",
  email: "dana@example.com",
  insurance: "Aetna PPO",
  childAge: "6",
  intake: { dob: "2019-04-02", diagnosisStatus: "Confirmed", referralSource: "Website" },
  formStatus: "Received",
  consentStatus: "Signed",
  vobStatus: "Approved",
};

describe("Canonical Intake stage journey", () => {
  it("walks a fixture lead through all eight canonical stages", () => {
    let lead = { ...READY_LEAD } as never;
    const visited: string[] = [canonicalIntakeStage((lead as AnyLead).status as string)];
    for (let i = 1; i < INTAKE_CANONICAL_STAGES.length; i++) {
      const target = INTAKE_CANONICAL_STAGES[i];
      const decision = guardIntakeStageTransition(lead, target, {
        isDirector: true,
        admissionPacketApproved: true,
        readinessApproved: true,
        benefitsOutcome: "Approved",
      });
      expect(decision.allowed, `blocked at ${target}: ${JSON.stringify(decision)}`).toBe(true);
      lead = { ...(lead as AnyLead), status: INTAKE_STAGE_TO_STORED_STATUS[target] } as never;
      visited.push(canonicalIntakeStage((lead as AnyLead).status as string));
    }
    expect(visited).toEqual([...INTAKE_CANONICAL_STAGES]);
  });

  it("blocks advancement when requirements are missing and lists them", () => {
    const bare = { ...READY_LEAD, status: "Qualification", parentName: "", childName: "", state: "" } as never;
    const decision = guardIntakeStageTransition(bare, "Intake Packet");
    expect(decision.allowed).toBe(false);
    if (decision.allowed === false) {
      expect((decision as { missing: string[] }).missing).toEqual([
        "Parent / guardian name",
        "Child name",
        "Service state",
      ]);
    }
  });

  it("allows a Director exception to bypass a block, but not a coordinator", () => {
    const bare = { ...READY_LEAD, status: "Qualification", childName: "" } as never;
    expect(guardIntakeStageTransition(bare, "Intake Packet", { directorException: true, isDirector: false }).allowed).toBe(false);
    const viaException = guardIntakeStageTransition(bare, "Intake Packet", { directorException: true, isDirector: true });
    expect(viaException.allowed).toBe(true);
    if (viaException.allowed) expect(viaException.viaException).toBe(true);
  });

  it("permits a single-step backward transition and blocks multi-step reverts for coordinators", () => {
    const mid = { ...READY_LEAD, status: INTAKE_STAGE_TO_STORED_STATUS["Benefits Verification"] } as never;
    expect(guardIntakeStageTransition(mid, "Packet Follow Up").allowed).toBe(true);
    expect(guardIntakeStageTransition(mid, "Lead Captured", { isDirector: false }).allowed).toBe(false);
    expect(guardIntakeStageTransition(mid, "Lead Captured", { isDirector: true }).allowed).toBe(true);
  });

  it("never advances more than one stage at a time", () => {
    const lead = { ...READY_LEAD } as never;
    expect(guardIntakeStageTransition(lead, "Intake Packet").allowed).toBe(false);
  });

  it("keeps stored status round-tripping to the canonical stage", () => {
    for (const stage of INTAKE_CANONICAL_STAGES) {
      expect(canonicalIntakeStage(INTAKE_STAGE_TO_STORED_STATUS[stage])).toBe(stage);
    }
  });
});

/* --------------- 6. packet prep gating (waive / approve) -------------- */

describe("CentralReach packet prep gating", () => {
  const SRC = readFileSync("src/pages/os/intake/CentralReachPacketPrep.tsx", "utf8");

  it("gates waive/approve/handoff behind the Director experience", () => {
    expect(SRC).toMatch(/isDirectorOfIntake|canUseIntakeCapability/);
  });

  it("does not activate a patient from Intake", () => {
    expect(SRC).not.toMatch(/activatePatient|patient_activation/i);
  });

  it("packet prep is not gated to Directors at the route level (coordinators prep packets)", () => {
    const APP = readFileSync("src/App.tsx", "utf8");
    const line = APP.split("\n").find((l) => l.includes('path="/intake/cr-packet-prep"'))!;
    expect(line).toContain("INTAKE_WORKSPACE_ROUTE_ROLES");
  });
});
