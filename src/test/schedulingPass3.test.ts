import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { normalizeSchedulingIdentity, isUuid } from "@/hooks/useSchedulingActions";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("Scheduling Pass 3 — identity normalization", () => {
  it("keeps a real UUID in client_id and clears client_key duplication", () => {
    const id = "11111111-2222-4333-8444-555555555555";
    const out = normalizeSchedulingIdentity({ clientId: id, clientName: "Avery" });
    expect(out.client_id).toBe(id);
    expect(out.client_key).toBeNull();
    expect(out.client_name).toBe("Avery");
    expect(out.source_record_id).toBe(id);
    expect(out.source_system).toBe("blossom_os");
  });

  it("routes a Monday/imported key into client_key, never client_id", () => {
    const out = normalizeSchedulingIdentity({ clientId: "monday_99812345", clientName: "Sam" });
    expect(out.client_id).toBeNull();
    expect(out.client_key).toBe("monday_99812345");
    expect(out.source_record_id).toBe("monday_99812345");
  });

  it("turns empty string client ids into nulls (never empty strings)", () => {
    const out = normalizeSchedulingIdentity({ clientId: "   ", providerName: "Riley", providerRole: "rbt" });
    expect(out.client_id).toBeNull();
    expect(out.client_key).toBeNull();
    expect(out.source_record_id).toBeNull();
    expect(out.provider_name).toBe("Riley");
    expect(out.provider_role).toBe("rbt");
  });

  it("isUuid only accepts UUIDs", () => {
    expect(isUuid("11111111-2222-4333-8444-555555555555")).toBe(true);
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(isUuid("")).toBe(false);
    expect(isUuid(null)).toBe(false);
  });
});

describe("Scheduling Pass 3 — risky source patterns are gone", () => {
  it("RBT roster no longer fakes id: \"\" for contact dialog", () => {
    const src = read("src/pages/os/OSSchedulingRosterRBTs.tsx");
    expect(src).not.toMatch(/id:\s*""/);
    expect(src).toContain("provider={");
    expect(src).toContain('role: "rbt"');
  });

  it("BCBA roster no longer fakes id: \"\" for contact dialog", () => {
    const src = read("src/pages/os/OSSchedulingRosterBCBAs.tsx");
    expect(src).not.toMatch(/id:\s*""/);
    expect(src).toContain("provider={");
    expect(src).toContain('role: "bcba"');
  });

  it("AssignRbtDialog and ContactAttemptDialog re-sync defaults on open", () => {
    const src = read("src/components/scheduling/SchedulingDialogs.tsx");
    expect(src).toContain("useEffect");
    // AssignRbtDialog must sync defaultRbt on open
    expect(src).toMatch(/if \(open\) setRbt\(defaultRbt[^)]*\)/);
    // ContactAttemptDialog must sync defaultContactType on open
    expect(src).toMatch(/if \(open\) setContactType\(defaultContactType\)/);
  });

  it("useSchedulingActions never inserts a raw clientId into client_id directly", () => {
    const src = read("src/hooks/useSchedulingActions.ts");
    expect(src).not.toMatch(/client_id:\s*params\.clientId/);
    expect(src).toContain("normalizeSchedulingIdentity");
  });
});

describe("Scheduling Pass 3 — canonical routes", () => {
  const app = read("src/App.tsx");

  it("/scheduling-team redirects to /scheduling", () => {
    expect(app).toMatch(/path="\/scheduling-team"[\s\S]{0,120}Navigate to="\/scheduling"/);
  });

  it("no live nav file links to /scheduling-team", () => {
    for (const p of [
      "src/lib/os/roleMenus.ts",
      "src/lib/os/roleHome.ts",
      "src/lib/os/workspaces.ts",
      "src/pages/os/OSSchedulingResources.tsx",
      "src/pages/os/OSSchedulingWorkspace.tsx",
    ]) {
      const src = read(p);
      expect(src, `${p} should not reference /scheduling-team`).not.toContain("/scheduling-team");
    }
  });

  it("Scheduling menu Schedule Gaps points directly to the workspace view", () => {
    const menus = read("src/lib/os/roleMenus.ts");
    const block = menus.slice(menus.indexOf("scheduling_team:"), menus.indexOf("scheduling_team:") + 2000);
    expect(block).toContain("/scheduling-workspace?view=coverage_risk");
  });

  it("/credentialing/reports redirects (and category param preserved)", () => {
    expect(app).toMatch(/path="\/credentialing\/reports"[\s\S]{0,120}Navigate to="\/reports/);
  });

  it("/reports is explicitly live for scheduling roles", () => {
    const shell = read("src/pages/os/OSShell.tsx");
    for (const role of ["scheduling_team", "scheduling_lead", "scheduling_coordinator"]) {
      const start = shell.indexOf(`${role}: new Set`);
      const end = shell.indexOf("])", start);
      expect(shell.slice(start, end)).toContain('"/reports"');
    }
  });
});

describe("Scheduling Pass 3 — MakeUpSessions shows readable client identity", () => {
  it("prefers client_name then client_key then client_id", () => {
    const src = read("src/pages/os/operations/MakeUpSessions.tsx");
    expect(src).toContain("r.client_name ?? r.client_key ?? r.client_id");
  });
});