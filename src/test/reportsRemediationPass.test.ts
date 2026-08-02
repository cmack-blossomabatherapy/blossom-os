import { describe, it, expect } from "vitest";
import { suggestColumnMappings, inverseMapping } from "@/lib/os/reportEngine/mapper";
import { visibleReportsForRole, visibleDepartmentDashboardsForRole } from "@/lib/os/reportsCatalog";

describe("CentralReach header alias normalization", () => {
  it("maps CR authorization export headers", () => {
    const headers = [
      "ClientName", "AuthorizationNumber", "AuthorizedHoursMonth",
      "WorkedHours", "RemainingHours", "PendingHours",
    ];
    const inv = inverseMapping(suggestColumnMappings(headers));
    expect(inv.client_name).toBe("ClientName");
    expect(inv.authorization_number).toBe("AuthorizationNumber");
    expect(inv.authorized_hours).toBe("AuthorizedHoursMonth");
    expect(inv.worked_hours).toBe("WorkedHours");
    expect(inv.remaining_hours).toBe("RemainingHours");
    expect(inv.pending_hours).toBe("PendingHours");
  });

  it("maps CR billing export headers", () => {
    const headers = ["DateOfService", "ClientName", "ProviderName", "ProcedureCode", "TimeWorkedInHours"];
    const inv = inverseMapping(suggestColumnMappings(headers));
    expect(inv.service_date).toBe("DateOfService");
    expect(inv.client_name).toBe("ClientName");
    expect(inv.provider_name).toBe("ProviderName");
    expect(inv.procedure_code).toBe("ProcedureCode");
    expect(inv.worked_hours).toBe("TimeWorkedInHours");
  });

  it("maps CR scheduling export headers to client_name", () => {
    const headers = ["ClientName", "Course", "Segment", "Event", "Cancelled"];
    const inv = inverseMapping(suggestColumnMappings(headers));
    expect(inv.client_name).toBe("ClientName");
  });
});

describe("Reports catalog is role-identical", () => {
  it("RBT sees the same shared report catalog as everyone else", () => {
    const ids = visibleReportsForRole("rbt" as never).map((r) => r.id);
    expect(ids).toEqual(visibleReportsForRole("admin" as never).map((r) => r.id));
  });

  it("RBT sees all 9 department dashboards", () => {
    expect(visibleDepartmentDashboardsForRole("rbt" as never)).toHaveLength(9);
  });

  it("BCBA sees the full shared catalog", () => {
    const ids = visibleReportsForRole("bcba" as never).map((r) => r.id);
    expect(ids).toContain("bcba-productivity-report-v3");
    expect(ids).toContain("bcba-supervision");
    expect(ids).toContain("parent-training");
    expect(ids).toContain("cancellation-command-center");
  });

  it("admin/exec keep the full approved six", () => {
    const ids = visibleReportsForRole("admin" as never).map((r) => r.id);
    expect(ids).toContain("bcba-productivity-report-v3");
    expect(ids).toContain("cancellation-command-center");
    expect(ids).toContain("authorization-analysis");
    expect(ids).toContain("authorization-utilization-hour-based");
    expect(ids).toContain("parent-training");
    expect(ids).toContain("bcba-supervision");
  });
});