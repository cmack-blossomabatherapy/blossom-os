import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ROLE_MENUS } from "@/lib/os/roleMenus";
import {
  INTAKE_WORKSPACE_ROUTE_ROLES,
  INTAKE_DIRECTOR_ROUTE_ROLES,
  LEADS_ROUTE_ROLES,
} from "@/lib/intake/intakeRouteRoles";
import { isDirectorOfIntake, isIntakeCoordinator } from "@/lib/intake/intakeRoles";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");
const APP = read("src/App.tsx");
const DASHBOARD = read("src/pages/os/intake/IntakeDashboard.tsx");
const DIRECTOR_PANEL = read("src/components/intake/IntakeDirectorInsights.tsx");
const REVIEW = read("src/pages/os/intake/IntakePromotionReviewQueues.tsx");

function routeLine(path: string): string {
  const m = APP.match(new RegExp(`<Route path="${path.replace(/[/:]/g, (c) => "\\" + c)}"[^\\n]*`));
  expect(m, `route ${path} not found`).not.toBeNull();
  return m![0];
}

describe("Intake release — route guards", () => {
  it.each(["\\/leads", "\\/leads\\/operations", "\\/leads\\/:id"])(
    "%s is guarded by LEADS_ROUTE_ROLES", (p) => {
      expect(routeLine(p.replace(/\\/g, ""))).toContain("PermissionRoute allowedRoles={LEADS_ROUTE_ROLES}");
    },
  );

  it("intake tasks / missing information / communications are guarded", () => {
    for (const p of ["/intake/tasks", "/intake/missing-information", "/intake/parent-communication"]) {
      expect(routeLine(p)).toContain("allowedRoles={INTAKE_WORKSPACE_ROUTE_ROLES}");
    }
  });

  it("/intake/parent-communication renders the real Communications page, not a redirect", () => {
    const line = routeLine("/intake/parent-communication");
    expect(line).toContain("<ParentCommunication />");
    expect(line).not.toContain("Navigate");
  });

  it("/intake/review-queues is Director-only and stays inside the OS shell", () => {
    const line = routeLine("/intake/review-queues");
    expect(line).toContain("allowedRoles={INTAKE_DIRECTOR_ROUTE_ROLES}");
    expect(line).toContain("<OSShellPage>");
  });

  it("review queues also enforces Director access in the UI", () => {
    expect(REVIEW).toContain("isDirectorOfIntake");
    expect(REVIEW).toContain("intake-review-queues-director-only");
  });
});

describe("Intake release — role access model", () => {
  it("both Intake experiences reach the shared workspace routes", () => {
    for (const r of ["intake_lead", "intake_coordinator", "intake", "intake_team"]) {
      expect(INTAKE_WORKSPACE_ROUTE_ROLES).toContain(r);
      expect(LEADS_ROUTE_ROLES).toContain(r);
    }
  });

  it("Director controls exclude coordinators but include ops leadership", () => {
    expect(INTAKE_DIRECTOR_ROUTE_ROLES).toContain("intake_lead");
    expect(INTAKE_DIRECTOR_ROUTE_ROLES).not.toContain("intake_coordinator");
    expect(INTAKE_DIRECTOR_ROUTE_ROLES).not.toContain("intake_team");
    expect(INTAKE_DIRECTOR_ROUTE_ROLES).toContain("operations_leadership");
    expect(INTAKE_DIRECTOR_ROUTE_ROLES).toContain("admin");
  });

  it("shared authorized non-Intake roles keep Leads access", () => {
    for (const r of [
      "business_development", "marketing", "case_manager", "clinical_director",
      "state_director", "coo", "operations_leadership",
    ]) {
      expect(LEADS_ROUTE_ROLES).toContain(r);
    }
  });

  it("clinical delivery roles are not granted Leads access", () => {
    for (const r of ["rbt", "bcba", "registered_behavior_technician"]) {
      expect(LEADS_ROUTE_ROLES).not.toContain(r);
    }
  });

  it("role predicates agree with the route constants", () => {
    expect(isDirectorOfIntake(["intake_lead"])).toBe(true);
    expect(isDirectorOfIntake(["intake_coordinator"])).toBe(false);
    expect(isIntakeCoordinator(["intake_coordinator"])).toBe(true);
  });
});

describe("Intake release — menu correctness", () => {
  const menuPaths = (role: "intake_lead" | "intake_coordinator") =>
    ROLE_MENUS[role]!.sections.flatMap((s) => s.items.map((i) => i.path));

  it("every Intake menu destination is a mounted route", () => {
    const paths = new Set([...menuPaths("intake_lead"), ...menuPaths("intake_coordinator")]);
    for (const p of paths) {
      const base = p.split("?")[0];
      expect(APP.includes(`path="${base}"`), `${base} not mounted`).toBe(true);
    }
  });

  it("Director Controls are only in the Director menu", () => {
    expect(menuPaths("intake_lead")).toContain("/intake/review-queues");
    expect(menuPaths("intake_coordinator")).not.toContain("/intake/review-queues");
    expect(menuPaths("intake_coordinator")).not.toContain("/intake/assignments");
    expect(menuPaths("intake_coordinator")).not.toContain("/intake/configuration");
  });
});

describe("Intake release — Director dashboard completeness", () => {
  it("dashboard mounts the Director command view for Directors only", () => {
    expect(DASHBOARD).toContain("isDirector && <IntakeDirectorInsights");
  });

  it.each([
    ["Unassigned leads"],
    ["SLA risk"],
    ["Stalled journeys"],
    ["Conversion (30d)"],
    ["Packet readiness"],
    ["CTM health"],
    ["Coordinator workload"],
    ["Source performance"],
  ])("Director view includes %s", (label) => {
    expect(DIRECTOR_PANEL).toContain(label);
  });

  it("Director metrics use canonical Intake stage mapping", () => {
    expect(DIRECTOR_PANEL).toContain("canonicalFamilyLeadStage");
    expect(DIRECTOR_PANEL).toContain("isLeadOutOfPipeline");
    expect(DIRECTOR_PANEL).not.toMatch(/"Sent to VOB"|"New Lead"|"Form Received"/);
  });

  it("Coordinator defaults to My Work with a working Team switch", () => {
    expect(DASHBOARD).toContain('useState<"mine" | "team">(isDirector ? "team" : "mine")');
    expect(DASHBOARD).toContain('onClick={() => setWorkScope(s)}');
  });
});
