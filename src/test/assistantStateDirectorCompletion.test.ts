import { describe, it, expect } from "vitest";
import { rolesForTitle } from "@/components/team/BulkProvisionDialog";
import { ROLE_MENUS } from "@/lib/os/roleMenus";
import { ROLE_HOME } from "@/lib/os/roleHome";
import { WORKSPACES } from "@/lib/os/workspaces";
import { visibleReportsForRole } from "@/lib/os/reportsCatalog";
import { scopeLeadsForUser } from "@/lib/leads/scoping";
import { scopeClientsForUser } from "@/lib/clients/scoping";

describe("Assistant State Director completion pass", () => {
  it("provisions Assistant State Director titles to the canonical role", () => {
    expect(rolesForTitle("Assistant State Director")).toEqual(["assistant_state_director"]);
    expect(rolesForTitle("NC Assistant State Director")).toEqual(["assistant_state_director"]);
    // General/Regional State Director must NOT be swallowed by the assistant branch.
    expect(rolesForTitle("State Director")).toEqual(["state_director"]);
    expect(rolesForTitle("Regional State Director")).toEqual(["state_director"]);
  });

  it("routes Assistant State Director home to /state-operations", () => {
    expect(ROLE_HOME.assistant_state_director).toBe("/state-operations");
  });

  it("has a canonical Assistant State Director menu with exactly one Reports link → /reports", () => {
    const menu = ROLE_MENUS.assistant_state_director;
    expect(menu).toBeTruthy();
    const items = menu!.sections.flatMap((s) => s.items);
    const paths = items.map((i) => i.path);

    // Required routes are all present.
    for (const p of [
      "/state-operations",
      "/intake/dashboard",
      "/ops/tasks",
      "/ops/state-escalations",
      "/ops/staffing",
      "/ops/scheduling",
      "/resource-library",
      "/reports",
    ]) {
      expect(paths).toContain(p);
    }

    // No stale /state-director?role=assistant leakage.
    expect(paths.some((p) => p.includes("/state-director?role=assistant"))).toBe(false);

    // Exactly one Reports link, pointing at the canonical /reports page.
    const reports = items.filter((i) => i.label === "Reports");
    expect(reports).toHaveLength(1);
    expect(reports[0].path).toBe("/reports");
  });

  it("workspace catalog no longer routes Assistant State Director to /state-director?role=assistant", () => {
    const ws = WORKSPACES.find((w) => w.id === "assistant-state-director");
    expect(ws).toBeTruthy();
    expect(ws!.path).toBe("/state-operations");
    for (const tab of ws!.tabs ?? []) {
      expect(tab.path.startsWith("/state-director?role=assistant")).toBe(false);
    }
  });

  it("surfaces state-support reports for Assistant State Director from /reports catalog", () => {
    const ids = visibleReportsForRole("assistant_state_director").map((r) => r.id);
    // Sample of reports that state_director sees — assistant must mirror.
    for (const id of [
      "bcba-performance",
      "lifecycle",
      "intake-perf",
      "qa-auth-utilization",
      "auth-performance",
      "bcba-productivity-report-v3",
    ]) {
      expect(ids).toContain(id);
    }
  });

  it("applies state scoping to Assistant State Director in lead/client helpers", () => {
    const leads = [
      { id: "1", state: "NC" } as any,
      { id: "2", state: "GA" } as any,
    ];
    const scoped = scopeLeadsForUser(leads, { roles: ["assistant_state_director"], state: "NC" });
    expect(scoped.map((l) => l.id)).toEqual(["1"]);

    const clients = [
      { id: "a", state: "NC" } as any,
      { id: "b", state: "TN" } as any,
    ];
    const scopedClients = scopeClientsForUser(clients, { roles: ["assistant_state_director"], state: "NC" });
    expect(scopedClients.map((c) => c.id)).toEqual(["a"]);
  });
});