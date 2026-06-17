import { describe, it, expect } from "vitest";
import { PHASE3_REPORTS, reportRoute } from "@/lib/os/phase3Reports";

describe("phase3Reports.reportRoute", () => {
  it("never returns /coming-soon for any report (live or setup-needed)", () => {
    for (const report of PHASE3_REPORTS) {
      const route = reportRoute(report);
      expect(route.startsWith("/coming-soon")).toBe(false);
      expect(route).not.toMatch(/coming[-_]?soon/i);
    }
  });

  it("falls back to /reports?report=<id> when no live route exists", () => {
    const noRoute = PHASE3_REPORTS.find((r) => !r.route);
    if (noRoute) {
      expect(reportRoute(noRoute)).toBe(`/reports?report=${encodeURIComponent(noRoute.id)}`);
    }
  });

  it("has no remaining 'coming_soon' statuses in the catalog", () => {
    for (const report of PHASE3_REPORTS) {
      // @ts-expect-error — coming_soon is no longer a valid Phase3Status
      expect(report.status).not.toBe("coming_soon");
    }
  });
});