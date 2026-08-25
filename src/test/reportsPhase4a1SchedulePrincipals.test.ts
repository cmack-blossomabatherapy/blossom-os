import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { normalizeCrRow } from "@/lib/os/centralreachUploads/normalize";

/**
 * Phase 4A1 — schedule principal orientation.
 *
 * The audited CentralReach scheduling export proves Principal1 is the PROVIDER
 * and Principal2 is the CLIENT. These fixtures are fully synthetic (no PHI).
 */
const principalOnlyRow = {
  "Event Id": "EVT-1001",
  EventStart: "2026-08-24 09:00",
  EventEnd: "2026-08-24 11:00",
  Principal1: "PROV-77",
  Principal1Name: "Riley Provider",
  Principal2: "CLI-42",
  Principal2Name: "Sam Client",
  ScheduledHours: "2",
  BillingCode: "97153",
  State: "GA",
};

describe("Phase 4A1 schedule principal orientation", () => {
  it("maps Principal1 to the provider and Principal2 to the client", () => {
    const row = normalizeCrRow("scheduling", principalOnlyRow);
    expect(row.provider_name).toBe("Riley Provider");
    expect(row.client_name).toBe("Sam Client");
  });

  it("persists Principal1 as provider_cr_id and Principal2 as client_cr_id", () => {
    const row = normalizeCrRow("scheduling", principalOnlyRow);
    expect(row.provider_cr_id).toBe("PROV-77");
    expect(row.client_cr_id).toBe("CLI-42");
  });

  it("keeps explicit client/provider columns as first preference", () => {
    const row = normalizeCrRow("scheduling", {
      ...principalOnlyRow,
      Client: "Explicit Client",
      ClientId: "CLI-EXPLICIT",
      Provider: "Explicit Provider",
      ProviderId: "PROV-EXPLICIT",
    });
    expect(row.client_name).toBe("Explicit Client");
    expect(row.client_cr_id).toBe("CLI-EXPLICIT");
    expect(row.provider_name).toBe("Explicit Provider");
    expect(row.provider_cr_id).toBe("PROV-EXPLICIT");
  });

  it("normalizes deleted, cancelled and conversion truth", () => {
    const deleted = normalizeCrRow("scheduling", { ...principalOnlyRow, Deleted: "true" });
    expect(deleted.deleted).toBe(true);
    expect(deleted.status).toBe("Deleted");

    const cancelled = normalizeCrRow("scheduling", {
      ...principalOnlyRow,
      Cancelled: "yes",
      "Cancellation Reason": "Client illness",
      "Cancelled By": "Parent",
    });
    expect(cancelled.cancelled).toBe(true);
    expect(cancelled.status).toBe("Cancelled");
    expect(cancelled.cancellation_reason).toBe("Client illness");
    expect(cancelled.cancelled_by).toBe("Parent");

    const converted = normalizeCrRow("scheduling", {
      ...principalOnlyRow,
      "Converted To Timesheet": "1",
    });
    expect(converted.converted_to_timesheet).toBe(true);
  });

  it("keeps timestamps oriented to the event start and end", () => {
    const row = normalizeCrRow("scheduling", principalOnlyRow);
    expect(row.event_date).toBe("2026-08-24");
    expect(row.start_time).toBe("09:00");
    expect(row.end_time).toBe("11:00");
  });

  it("selects the new identity columns from the curated current view", () => {
    const source = readFileSync("src/lib/os/reports/crPrimary/source.ts", "utf8");
    const view = source.slice(source.indexOf("v_cr_schedule_current"));
    const columns = view.slice(0, view.indexOf("\n  );"));
    for (const column of [
      "client_cr_id",
      "provider_cr_id",
      "cancelled",
      "deleted",
      "converted_to_timesheet",
    ]) {
      expect(columns).toContain(column);
    }
    // Curated view must never expose contact data or raw payloads.
    expect(columns).not.toContain("payload");
    expect(columns).not.toContain("email");
    expect(columns).not.toContain("phone");
  });
});
