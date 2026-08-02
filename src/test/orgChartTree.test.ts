import { describe, expect, it } from "vitest";
import {
  ORG_ROOT_ID,
  ancestorsOf,
  auditViventiumCoverage,
  buildOrgTree,
  canReparent,
  descendantsOf,
  type OrgPersonInput,
} from "@/lib/os/orgChart/tree";
import {
  cleanJobTitle,
  normalizeRoleKey,
  responsibilitiesForTitle,
} from "@/lib/os/orgChart/responsibilities";

const ceo: OrgPersonInput = {
  id: "ceo",
  name: "Chad Kaufman",
  title: "CEO",
  leadershipLevel: "executive",
  departmentName: "Executive",
};
const coo: OrgPersonInput = {
  id: "coo",
  name: "Ops Boss",
  title: "Chief Operating Officer",
  leadershipLevel: "executive",
  departmentName: "Operations",
  managerId: "ceo",
};
const sd: OrgPersonInput = {
  id: "sd",
  name: "Nina Director",
  title: "State Director",
  leadershipLevel: "director",
  departmentName: "State Leadership",
  managerId: "coo",
};
const bcba: OrgPersonInput = {
  id: "bcba",
  name: "Brandy Roden",
  title: "Board Certified Behavior Analyst (BCBA) - Georgia",
  leadershipLevel: "individual",
  departmentName: "State Leadership",
};
const rbt: OrgPersonInput = {
  id: "rbt",
  name: "Areeb Hasan",
  title: "Registered Behavior Technician (RBT) - Marietta GA, 30064",
  leadershipLevel: "individual",
  departmentName: "State Leadership",
  managerId: "bcba",
};
const people = [ceo, coo, sd, bcba, rbt];

describe("buildOrgTree", () => {
  it("puts parentless executives under the company root", () => {
    const tree = buildOrgTree(people);
    expect(tree.nodes.get("ceo")!.parentId).toBe(ORG_ROOT_ID);
    expect(tree.nodes.get(ORG_ROOT_ID)!.childIds).toContain("ceo");
  });

  it("uses employees.manager_id when present", () => {
    const tree = buildOrgTree(people);
    expect(tree.nodes.get("coo")!.parentId).toBe("ceo");
    expect(tree.nodes.get("coo")!.parentSource).toBe("manager");
    expect(tree.nodes.get("rbt")!.parentId).toBe("bcba");
  });

  it("infers a department leader for people with no manager", () => {
    const tree = buildOrgTree(people);
    const node = tree.nodes.get("bcba")!;
    expect(node.parentId).toBe("sd");
    expect(node.parentSource).toBe("inferred");
  });

  it("honors a manual override above HR data", () => {
    const tree = buildOrgTree(people, [
      { employeeId: "rbt", parentEmployeeId: "sd", parentOverride: true },
    ]);
    expect(tree.nodes.get("rbt")!.parentId).toBe("sd");
    expect(tree.nodes.get("rbt")!.parentSource).toBe("override");
  });

  it("counts direct and total reports", () => {
    const tree = buildOrgTree(people);
    expect(tree.nodes.get("sd")!.directReports).toBe(1);
    expect(tree.nodes.get("sd")!.totalReports).toBe(2);
    expect(tree.nodes.get("ceo")!.totalReports).toBe(4);
  });

  it("breaks cycles instead of hanging", () => {
    const a: OrgPersonInput = { id: "a", name: "A", managerId: "b" };
    const b: OrgPersonInput = { id: "b", name: "B", managerId: "a" };
    const tree = buildOrgTree([a, b]);
    const roots = tree.nodes.get(ORG_ROOT_ID)!.childIds;
    expect(roots.length).toBeGreaterThan(0);
    expect(tree.nodes.size).toBe(3);
  });

  it("hides descendants of a collapsed node", () => {
    const tree = buildOrgTree(people, [{ employeeId: "sd", collapsed: true }]);
    expect(tree.hidden.has("bcba")).toBe(true);
    expect(tree.hidden.has("rbt")).toBe(true);
    expect(tree.hidden.has("sd")).toBe(false);
  });

  it("keeps pinned positions from a saved drag and auto-lays out the rest", () => {
    const tree = buildOrgTree(people, [
      { employeeId: "sd", positionX: 999, positionY: 42 },
    ]);
    expect(tree.nodes.get("sd")!.position).toEqual({ x: 999, y: 42 });
    expect(tree.nodes.get("sd")!.pinned).toBe(true);
    // depth-based Y for non-pinned nodes
    expect(tree.nodes.get("ceo")!.position.y).toBe(
      tree.nodes.get(ORG_ROOT_ID)!.position.y + 104 + 88,
    );
  });

  it("exposes ancestors and descendants for drill-down", () => {
    const tree = buildOrgTree(people);
    expect(ancestorsOf(tree, "rbt")).toEqual(["bcba", "sd", "coo", "ceo", ORG_ROOT_ID]);
    expect(descendantsOf(tree, "sd").sort()).toEqual(["bcba", "rbt"]);
  });

  it("blocks re-parenting onto self or a descendant", () => {
    const tree = buildOrgTree(people);
    expect(canReparent(tree, "sd", "sd")).toBe(false);
    expect(canReparent(tree, "sd", "rbt")).toBe(false);
    expect(canReparent(tree, "rbt", "ceo")).toBe(true);
  });
});

describe("responsibilities catalog", () => {
  it("normalizes messy Viventium titles", () => {
    expect(normalizeRoleKey("Registered Behavior Technician (RBT) - Marietta GA, 30064")).toBe("rbt");
    expect(normalizeRoleKey("Board Certified Behavior Analyst (BCBA) - Georgia")).toBe("bcba");
    expect(normalizeRoleKey("State Director")).toBe("state_director");
    expect(normalizeRoleKey("Assistant State Director")).toBe("assistant_state_director");
    expect(normalizeRoleKey("Authorization Coordinator")).toBe("authorizations");
    expect(normalizeRoleKey("Office")).toBe("office");
    expect(normalizeRoleKey(null)).toBe("unknown");
  });

  it("always returns responsibilities", () => {
    for (const t of ["RBT", "BCBA", "State Director", "Whatever Role", null]) {
      expect(responsibilitiesForTitle(t).length).toBeGreaterThan(0);
    }
  });

  it("cleans location noise off titles", () => {
    expect(cleanJobTitle("Registered Behavior Technician (RBT) - Marietta GA, 30064")).toBe(
      "Registered Behavior Technician (RBT)",
    );
    expect(cleanJobTitle("State Director")).toBe("State Director");
  });
});

describe("auditViventiumCoverage", () => {
  it("summarizes sync + manager coverage for active staff", () => {
    const audit = auditViventiumCoverage([
      {
        id: "1",
        viventiumEmployeeId: "V1",
        viventiumSyncStatus: "synced",
        viventiumLastSync: "2026-07-15T00:00:00Z",
        managerId: "2",
        jobTitle: "RBT",
        status: "active",
      },
      {
        id: "2",
        viventiumEmployeeId: null,
        viventiumSyncStatus: "not_connected",
        managerId: null,
        jobTitle: "",
        status: "active",
      },
      { id: "3", status: "terminated" },
    ]);
    expect(audit.total).toBe(2);
    expect(audit.synced).toBe(1);
    expect(audit.coveragePct).toBe(50);
    expect(audit.missingManager).toBe(1);
    expect(audit.missingTitle).toBe(1);
    expect(audit.notConnected).toBe(1);
    expect(audit.lastSyncAt).toBe("2026-07-15T00:00:00Z");
  });
});