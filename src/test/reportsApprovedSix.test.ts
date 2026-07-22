import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { REPORTS, visibleReportsForRole } from "@/lib/os/reportsCatalog";
import { OS_ROLES } from "@/lib/os/permissions";

const APPROVED: Array<{ id: string; title: string; path: string }> = [
  { id: "bcba-productivity-report-v3",           title: "BCBA Productivity Report V3",              path: "/reports/bcba-productivity-report-v3" },
  { id: "cancellation-command-center",           title: "Cancellation Command Center",              path: "/reports/cancellation-command-center" },
  { id: "authorization-analysis",                title: "Authorization Analysis",                   path: "/reports/authorization-analysis" },
  { id: "authorization-utilization-hour-based",  title: "Authorization Utilization — Hour Based",   path: "/reports/authorization-utilization-hour-based" },
  { id: "parent-training",                       title: "Parent Training",                          path: "/reports/parent-training" },
  { id: "bcba-supervision",                      title: "BCBA Supervision",                         path: "/reports/bcba-supervision" },
];

const app = fs.readFileSync("src/App.tsx", "utf8");

describe("Approved six reports — routing & catalog", () => {
  for (const r of APPROVED) {
    it(`${r.id} drilldown goes to ${r.path}`, () => {
      const rep = REPORTS.find((x) => x.id === r.id);
      expect(rep, `report ${r.id} missing from catalog`).toBeTruthy();
      expect(rep!.title).toBe(r.title);
      expect(rep!.drilldownPath).toBe(r.path);
    });

    it(`${r.path} is mounted in App.tsx`, () => {
      const escaped = r.path.replace(/[/]/g, "\\/");
      expect(new RegExp(`path="${escaped}"`).test(app)).toBe(true);
    });
  }

  it("visibleReportsForRole always includes the six approved reports for every role", () => {
    // Pass 02 layers department dashboards on top of the approved six. The
    // guarantee is that every role continues to see the six — department
    // dashboards appear additively for roles whose visibleTo list allows it.
    const approved = APPROVED.map((r) => r.id).sort();
    for (const role of OS_ROLES) {
      const visibleIds = visibleReportsForRole(role.id).map((r) => r.id);
      const approvedForRole = visibleIds.filter((id) => approved.includes(id)).sort();
      expect(approvedForRole).toEqual(approved);
    }
  });

  it("no approved card links to legacy shared QA routes", () => {
    const legacy = ["/reports/qa-auth-utilization", "/reports/qa-supervision-pt", "/reports/qa-cancellation"];
    for (const r of APPROVED) {
      const rep = REPORTS.find((x) => x.id === r.id)!;
      for (const l of legacy) expect(rep.drilldownPath!.startsWith(l)).toBe(false);
    }
  });

  it("legacy card routes redirect to their approved canonical routes", () => {
    for (const [from, to] of [
      ["/reports/qa-supervision", "/reports/bcba-supervision"],
      ["/reports/qa-parent-training", "/reports/parent-training"],
      ["/reports/auth-utilization", "/reports/authorization-utilization-hour-based"],
      ["/reports/bcba-productivity-report", "/reports/bcba-productivity-report-v3"],
      ["/reports/intake-performance", "/reports"],
    ] as const) {
      const escFrom = from.replace(/[/]/g, "\\/");
      const escTo = to.replace(/[/]/g, "\\/");
      // Accept both plain <Navigate to="…"> and Phase 4's query-preserving
      // <NavigateWithSearch to="…"> — both redirect to the canonical route.
      const rx = new RegExp(`path="${escFrom}"[^>]*Navigate(?:WithSearch)? to="${escTo}"`);
      expect(rx.test(app), `expected ${from} → ${to} redirect`).toBe(true);
    }
  });

  it("shared dashboards contain view-aware page titles", () => {
    const auth = fs.readFileSync("src/pages/os/reports/QaAuthUtilizationDashboard.tsx", "utf8");
    expect(auth).toMatch(/Authorization Analysis/);
    expect(auth).toMatch(/Authorization Utilization — Hour Based/);
    const sup = fs.readFileSync("src/pages/os/reports/QaSupervisionPtDashboard.tsx", "utf8");
    expect(sup).toMatch(/"Parent Training"/);
    expect(sup).toMatch(/"BCBA Supervision"/);
  });

  it("Authorization + Cancellation dashboards no longer say the admin dataset is 'coming'", () => {
    const auth = fs.readFileSync("src/pages/os/reports/QaAuthUtilizationDashboard.tsx", "utf8");
    const cancel = fs.readFileSync("src/pages/os/reports/CancellationCommandCenter.tsx", "utf8");
    expect(auth).not.toMatch(/dataset is coming/i);
    expect(cancel).not.toMatch(/dataset is coming/i);
    expect(auth).toMatch(/system\/authorization-uploads/);
    expect(cancel).toMatch(/system\/cancellation-uploads/);
  });

  it("Admin upload routes are mounted for authorization + cancellation datasets", () => {
    expect(app).toMatch(/path="\/system\/authorization-uploads"/);
    expect(app).toMatch(/path="\/system\/cancellation-uploads"/);
  });
});
