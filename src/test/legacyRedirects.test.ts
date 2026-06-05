import { describe, it, expect } from "vitest";

describe("App.tsx legacy dashboard redirects", () => {
  it("redirects legacy dashboard routes to canonical OS pages", async () => {
    const fs = await import("node:fs");
    const src =
      fs.readFileSync("src/App.tsx", "utf8") +
      "\n" +
      fs.readFileSync("src/routes/legacyRoutes.tsx", "utf8");

    const redirects = [
      { from: '"/intake-dashboard"', to: '"/intake"' },
      { from: '"/authorizations-dashboard"', to: '"/authorizations"' },
      { from: '"/scheduling-dashboard"', to: '"/scheduling"' },
      { from: '"/staffing-dashboard"', to: '"/staffing"' },
      { from: '"/qa-dashboard"', to: '"/qa-workspace"' },
      { from: '"/finance-dashboard"', to: '"/billing-finance"' },
      { from: '"/recruiting-dashboard"', to: '"/recruiting/workspace"' },
      { from: '"/phone-calls"', to: '"/phone"' },
    ];

    for (const { from, to } of redirects) {
      const re = new RegExp(
        `<Route path=${from.replace(/[/]/g, "\\/")} element=\\{<Navigate to=${to.replace(/[/]/g, "\\/")} replace />\\} />`,
      );
      expect(src).toMatch(re);
    }
  });

  it("does not render legacy dashboard components directly", async () => {
    const fs = await import("node:fs");
    const src =
      fs.readFileSync("src/App.tsx", "utf8") +
      "\n" +
      fs.readFileSync("src/routes/legacyRoutes.tsx", "utf8");

    const legacyComponents = [
      "IntakeDashboard",
      "AuthorizationsDashboard",
      "SchedulingDashboard",
      "StaffingDashboard",
      "QADashboard",
      "FinanceDashboard",
      "RecruitingDashboard",
    ];

    for (const component of legacyComponents) {
      // Should not appear as a JSX element in a route (e.g. <IntakeDashboard />)
      const routeUsage = new RegExp(`<Route[^>]*element=\\{[^}]*<${component}[^>]*/>[^}]*\\}[^>]*/>`);
      expect(src).not.toMatch(routeUsage);
    }
  });

  it("holds clinic-dashboard unchanged", async () => {
    const fs = await import("node:fs");
    const src = fs.readFileSync("src/App.tsx", "utf8");

    expect(src).toMatch(
      /<Route path="\/clinic-dashboard" element=\{<PermissionRoute permission="dashboard\.view"><ClinicDashboard \/><\/PermissionRoute>\} \/>/,
    );
  });
});
