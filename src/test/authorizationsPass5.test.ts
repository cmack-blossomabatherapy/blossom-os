import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Pass 5 guardrails — verify the source-system, refresh-after-write, report,
 * edit, CentralReach readiness, and missing-docs wiring stays correct.
 */
function read(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

describe("Authorizations Pass 5 — source system, refresh, reports, edit, CR readiness", () => {
  it("OSAuthWorkspace.liveAuthToCard no longer hardcodes source: \"monday\"", () => {
    const src = read("src/pages/os/OSAuthWorkspace.tsx");
    // Must accept a ctx with source/overlayId/bcba/meta.
    expect(src).toMatch(/function liveAuthToCard\([^)]*ctx:\s*\{/);
    expect(src).toMatch(/source:\s*ctx\.source/);
    expect(src).not.toMatch(/source:\s*"monday"\s*,/);
    // mondayItemId is conditional on actual Monday source.
    expect(src).toMatch(/mondayItemId:\s*ctx\.source\s*===\s*"monday"/);
  });

  it("OSAuthWorkspace.buildOverlay passes overlay_id and per-source identifiers", () => {
    const src = read("src/pages/os/OSAuthWorkspace.tsx");
    expect(src).toMatch(/overlay_id:\s*a\.overlayId/);
    expect(src).toMatch(/monday_item_id:\s*a\.source\s*===\s*"monday"/);
    expect(src).toMatch(/centralreach_authorization_id:\s*a\.source\s*===\s*"centralreach"/);
  });

  it("OSAuthWorkspace defines runActionAndRefresh and uses it for write actions", () => {
    const src = read("src/pages/os/OSAuthWorkspace.tsx");
    expect(src).toMatch(/runActionAndRefresh/);
    expect(src).toMatch(/runActionAndRefresh\(\(\)\s*=>\s*actions\.submitAuth/);
    expect(src).toMatch(/runActionAndRefresh\(\(\)\s*=>\s*actions\.sendToQA/);
  });

  it("Active Authorizations write handlers do not silently swallow errors", () => {
    const ws = read("src/pages/os/OSAuthWorkspace.tsx");
    const list = read("src/pages/os/OSAuthorizations.tsx");
    expect(ws).not.toMatch(/\.catch\(\(\)\s*=>\s*undefined\)/);
    expect(list).not.toMatch(/\.catch\(\(\)\s*=>\s*undefined\)/);
  });

  it("OSAuthorizations drawer refreshes live data after writes", () => {
    const src = read("src/pages/os/OSAuthorizations.tsx");
    expect(src).toMatch(/onRefresh\?\.\(\)/);
    expect(src).toMatch(/runRefresh\(\(\)\s*=>\s*actions\./);
  });

  it("Authorizations report drilldown view= params are valid ViewIds", () => {
    const catalog = read("src/lib/os/reportsCatalog.ts");
    const allowed = new Set([
      "all", "expiring", "denied", "high_risk", "approved",
      "ready", "in_review", "missing", "qa",
    ]);
    const re = /\/authorizations\?view=([a-z_]+)/g;
    let m: RegExpExecArray | null;
    let found = 0;
    while ((m = re.exec(catalog)) != null) {
      found++;
      expect(allowed.has(m[1])).toBe(true);
    }
    expect(found).toBeGreaterThan(0);
  });

  it("Authorizations operational report KPIs do not ship as bare \"-\" without a live override", () => {
    const hook = read("src/hooks/useAuthorizationReportMetrics.ts");
    expect(hook).toContain("auth-expiration-risk");
    expect(hook).toContain("auth-workflow-bottleneck");
    expect(hook).toContain("auth-operational-performance");
    const home = read("src/pages/os/reports/ReportsHome.tsx");
    expect(home).toContain("useAuthorizationReportMetrics");
    expect(home).toMatch(/reportsWithLive/);
  });

  it("updateAuthorizationRecord and EditAuthorizationDialog exist and are wired", () => {
    const hook = read("src/hooks/useAuthorizationActions.ts");
    expect(hook).toContain("updateAuthorizationRecord");
    expect(hook).toMatch(/authorization_operational_records/);

    const ui = read("src/components/authorizations/AuthorizationActionUI.tsx");
    expect(ui).toContain("EditAuthorizationDialog");

    const list = read("src/pages/os/OSAuthorizations.tsx");
    expect(list).toContain("EditAuthorizationDialog");
  });

  it("CentralReach readiness section is rendered on both active detail drawers", () => {
    const ws = read("src/pages/os/OSAuthWorkspace.tsx");
    const list = read("src/pages/os/OSAuthorizations.tsx");
    expect(ws).toContain("CentralReachReadinessSection");
    expect(list).toContain("CentralReachReadinessSection");
  });

  it("Missing Docs page exposes an Open Authorization link when linked", () => {
    const md = read("src/pages/os/operations/MissingDocs.tsx");
    expect(md).toMatch(/authorization_id/);
    expect(md).toMatch(/\/authorizations\?authId=/);
  });
});