import { describe, expect, it } from "vitest";
import {
  ORG_ROOT_ID,
  buildOrgTree,
  departmentNameOf,
  departmentSummaries,
  scopeIds,
  scopeTrail,
  type OrgPersonInput,
} from "@/lib/os/orgChart/tree";

const roleLabelFor = (title?: string | null) => (title ?? "Teammate").trim() || "Teammate";

const people: OrgPersonInput[] = [
  { id: "ceo", name: "Ava Chief", title: "CEO", departmentName: "Executive", leadershipLevel: "executive" },
  { id: "cd", name: "Cara Clinic", title: "Clinical Director", departmentName: "Clinical", leadershipLevel: "director", managerId: "ceo" },
  { id: "b1", name: "Brandy Roden", title: "BCBA", departmentName: "Clinical", leadershipLevel: "lead", managerId: "cd", state: "GA" },
  { id: "r1", name: "Rae Tech", title: "RBT", departmentName: "Clinical", leadershipLevel: "individual", managerId: "b1", state: "GA" },
  { id: "r2", name: "Rio Tech", title: "RBT", departmentName: "Clinical", leadershipLevel: "individual", managerId: "b1", state: "NC" },
  { id: "hr1", name: "Hana People", title: "HR Manager", departmentName: "HR", leadershipLevel: "manager", managerId: "ceo" },
  { id: "x1", name: "Nia Nodept", title: "Coordinator", departmentName: null, leadershipLevel: "individual" },
];

describe("org chart department grouping", () => {
  const tree = buildOrgTree(people);

  it("labels missing departments as Unassigned", () => {
    expect(departmentNameOf(people[6])).toBe("Unassigned");
    expect(departmentNameOf(people[1])).toBe("Clinical");
  });

  it("groups every person into exactly one department", () => {
    const summaries = departmentSummaries(tree, roleLabelFor);
    const total = summaries.reduce((s, d) => s + d.headcount, 0);
    expect(total).toBe(people.length);
    expect(new Set(summaries.map((d) => d.name)).size).toBe(summaries.length);
  });

  it("sorts departments by headcount and picks the highest-ranking head", () => {
    const summaries = departmentSummaries(tree, roleLabelFor);
    expect(summaries[0].name).toBe("Clinical");
    expect(summaries[0].headcount).toBe(4);
    expect(summaries[0].head?.name).toBe("Cara Clinic");
    expect(summaries[0].anchorId).toBe("cd");
  });

  it("reports role mix, leader count and states per department", () => {
    const clinical = departmentSummaries(tree, roleLabelFor).find((d) => d.name === "Clinical")!;
    expect(clinical.topRoles[0]).toEqual({ label: "RBT", count: 2 });
    expect(clinical.leaders).toBe(2);
    expect(clinical.states).toEqual(["GA", "NC"]);
  });

  it("leaves the head null when a department has no leader", () => {
    const unassigned = departmentSummaries(tree, roleLabelFor).find(
      (d) => d.name === "Unassigned",
    )!;
    expect(unassigned.head).toBeNull();
    expect(unassigned.anchorId).toBe("x1");
  });
});

describe("org chart drill-in scoping", () => {
  const tree = buildOrgTree(people);

  it("returns null (no filtering) for the whole company", () => {
    expect(scopeIds(tree, null)).toBeNull();
    expect(scopeIds(tree, ORG_ROOT_ID)).toBeNull();
    expect(scopeIds(tree, "does-not-exist")).toBeNull();
  });

  it("includes the scope root plus all descendants only", () => {
    const ids = scopeIds(tree, "b1")!;
    expect([...ids].sort()).toEqual(["b1", "r1", "r2"]);
    expect(ids.has("cd")).toBe(false);
  });

  it("scoping a department head includes the whole branch", () => {
    const ids = scopeIds(tree, "cd")!;
    expect(ids.size).toBe(4);
    expect(ids.has("hr1")).toBe(false);
  });

  it("builds a breadcrumb trail from the top down to the scope", () => {
    expect(scopeTrail(tree, "r1")).toEqual(["ceo", "cd", "b1", "r1"]);
    expect(scopeTrail(tree, null)).toEqual([]);
    expect(scopeTrail(tree, ORG_ROOT_ID)).toEqual([]);
  });
});