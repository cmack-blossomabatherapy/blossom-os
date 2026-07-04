import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { resolveApploiIdentity } from "@/lib/recruiting/apploiNormalizedIdentity";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("Recruiting Pass 9 — Reports unified", () => {
  const app = read("src/App.tsx");

  it("does not import HrRecruitingPipelineDashboard in App.tsx", () => {
    expect(app).not.toMatch(/import\s+HrRecruitingPipelineDashboard/);
  });

  it("redirects /reports/hr-recruiting-pipeline to /reports", () => {
    expect(app).toMatch(
      /path="\/reports\/hr-recruiting-pipeline"[^>]*to="\/reports(\?report=hr-recruiting-pipeline)?"/,
    );
    expect(app).not.toMatch(
      /path="\/reports\/hr-recruiting-pipeline"[^>]*element=\{<HrRecruitingPipelineDashboard/,
    );
  });

  it("Recruiting role menus do not contain /reports/hr-recruiting-pipeline", () => {
    const menus = read("src/lib/os/roleMenus.ts");
    expect(menus).not.toContain("/reports/hr-recruiting-pipeline");
  });
});

describe("Recruiting Pass 9 — /recruiting/map is active and aligned", () => {
  const app = read("src/App.tsx");
  const menus = read("src/lib/os/roleMenus.ts");
  const workspaces = read("src/lib/os/workspaces.ts");

  it("App.tsx mounts /recruiting/map as an active page (not a redirect)", () => {
    expect(app).toMatch(/path="\/recruiting\/map"\s+element=\{<RecruitingMap/);
  });

  for (const role of ["recruiting_team", "recruiting_lead", "recruiting_coordinator"] as const) {
    it(`${role} role menu includes /recruiting/map`, () => {
      const idx = menus.indexOf(`${role}:`);
      expect(idx).toBeGreaterThan(-1);
      const block = menus.slice(idx, idx + 4000);
      expect(block).toContain("/recruiting/map");
    });
  }

  it("recruiting workspace tabs include /recruiting/map", () => {
    const start = workspaces.indexOf('id: "recruiting"');
    const tabsIdx = workspaces.indexOf("tabs:", start);
    const end = workspaces.indexOf("],", tabsIdx);
    expect(workspaces.slice(tabsIdx, end)).toContain('"/recruiting/map"');
  });
});

describe("Recruiting Pass 9 — Apploi normalized-record identity resolver", () => {
  it("falls back to normalized_record:<id> when no provider or metadata id exists", () => {
    const result = resolveApploiIdentity({
      id: "abc",
      provider_record_id: null,
      metadata: {},
    });
    expect(result.source).toBe("normalized_record");
    expect(result.externalId).toBe("normalized_record:abc");
  });

  it("prefers provider_record_id when present", () => {
    const result = resolveApploiIdentity({
      id: "abc",
      provider_record_id: "pid-1",
      metadata: { id: "meta-1" },
    });
    expect(result.source).toBe("provider");
    expect(result.externalId).toBe("pid-1");
  });

  it("returns source 'none' with null id when nothing is durable", () => {
    const result = resolveApploiIdentity({ id: null, provider_record_id: null, metadata: {} });
    expect(result.source).toBe("none");
    expect(result.externalId).toBeNull();
  });

  it("useApploiIntegration.ts imports the resolver and never blind-inserts", () => {
    const src = read("src/hooks/useApploiIntegration.ts");
    expect(src).toMatch(/resolveApploiIdentity/);
    expect(src).toMatch(/apploi_import_skipped/);
    expect(src).not.toMatch(/onConflict:\s*email\s*\?\s*"email"\s*:\s*"id"/);
  });
});