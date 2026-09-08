import { describe, it, expect } from "vitest";
import {
  computeClinicOperations,
  CLINIC_OPS_DATA_GAP_NOTE,
  type ClinicOpsBillingInput,
  type ClinicOpsScheduleInput,
} from "@/lib/os/reports/crPrimary/metrics/clinicOperations";

function billing(overrides: Partial<ClinicOpsBillingInput> = {}): ClinicOpsBillingInput {
  return {
    dateOfService: "2026-03-05",
    procedureCode: "97153",
    hours: 2,
    clientName: "Alex Kim",
    clientCrId: "CR-1",
    providerName: "Provider One",
    location: "Riverdale Clinic",
    isVoid: false,
    deleted: false,
    ...overrides,
  };
}

function schedule(overrides: Partial<ClinicOpsScheduleInput> = {}): ClinicOpsScheduleInput {
  return {
    eventDate: "2026-03-05",
    startTime: null,
    endTime: null,
    serviceCode: "97153",
    scheduledHours: 2,
    clientName: "Alex Kim",
    clientCrId: "CR-1",
    providerName: "Provider One",
    location: "Riverdale Clinic",
    status: "Scheduled",
    attendance: null,
    cancelled: false,
    deleted: false,
    convertedToTimesheet: true,
    cancellationReason: null,
    ...overrides,
  };
}

const base = { clinicScope: "all" as const, today: "2026-03-10", scheduleCoverageEnd: "2026-03-31", windowTo: "2026-03-15" };

describe("clinic normalization through clinic operations metrics", () => {
  it("maps riverdale variants to Riverdale", () => {
    for (const loc of ["Riverdale Clinic", "RIVERDALE", "  riverdale center "]) {
      const m = computeClinicOperations({ ...base, billing: [billing({ location: loc })], schedule: [] });
      expect(m.clinics.map((c) => c.clinicLabel)).toEqual(["Riverdale"]);
    }
  });

  it('maps "Georgia Clinic" and 3850 Holcomb Bridge to Peachtree Corners', () => {
    const m1 = computeClinicOperations({ ...base, billing: [billing({ location: "Georgia Clinic" })], schedule: [] });
    expect(m1.clinics.map((c) => c.clinicLabel)).toEqual(["Peachtree Corners"]);
    const m2 = computeClinicOperations({
      ...base,
      billing: [billing({ location: "3850 Holcomb Bridge Rd, Peachtree Corners, GA" })],
      schedule: [],
    });
    expect(m2.clinics.map((c) => c.clinicLabel)).toEqual(["Peachtree Corners"]);
  });

  it("maps unmapped/blank locations to Other / Unmapped and never prints a street address", () => {
    const m = computeClinicOperations({
      ...base,
      billing: [billing({ location: "123 Main St, Atlanta, GA" }), billing({ location: "" })],
      schedule: [],
    });
    expect(m.clinics.map((c) => c.clinicLabel)).toEqual(["Other / Unmapped"]);
    const csvLike = JSON.stringify(m.clinics);
    expect(csvLike).not.toContain("123 Main St");
  });
});

describe("delivered vs scheduled hour separation", () => {
  it("counts delivered hours only from nonvoid, nondeleted billing facts", () => {
    const m = computeClinicOperations({
      ...base,
      billing: [billing({ hours: 3 }), billing({ hours: 5, isVoid: true }), billing({ hours: 7, deleted: true })],
      schedule: [],
    });
    expect(m.deliveredHours).toBe(3);
  });

  it("counts upcoming scheduled hours only from kept, nondeleted, noncancelled future events", () => {
    const m = computeClinicOperations({
      ...base,
      billing: [],
      schedule: [
        schedule({ eventDate: "2026-03-20", scheduledHours: 4 }), // future, kept
        schedule({ eventDate: "2026-03-21", scheduledHours: 2, cancelled: true }), // future, cancelled
        schedule({ eventDate: "2026-03-21", scheduledHours: 9, deleted: true }), // future, deleted
      ],
    });
    expect(m.upcomingScheduledHours).toBe(4);
  });
});

describe("future events excluded from cancellations and conversion checks", () => {
  it("does not count a future cancelled event in the elapsed-unconverted bucket", () => {
    const m = computeClinicOperations({
      ...base,
      billing: [],
      schedule: [schedule({ eventDate: "2026-03-20", cancelled: true, convertedToTimesheet: false })],
    });
    expect(m.strictCancellations).toBe(1);
    expect(m.elapsedUnconverted).toBe(0);
  });

  it("only flags elapsed (past) kept sessions as unconverted", () => {
    const m = computeClinicOperations({
      ...base,
      billing: [],
      schedule: [
        schedule({ eventDate: "2026-03-01", convertedToTimesheet: false }), // past, not converted
        schedule({ eventDate: "2026-03-01", convertedToTimesheet: true }), // past, converted
        schedule({ eventDate: "2026-03-20", convertedToTimesheet: false }), // future, not due yet
      ],
    });
    expect(m.elapsedUnconverted).toBe(1);
  });

  it("action queue ranks the elapsed-unconverted bucket ahead of cancellations", () => {
    const m = computeClinicOperations({
      ...base,
      billing: [],
      schedule: [
        schedule({ eventDate: "2026-03-01", scheduledHours: 1, convertedToTimesheet: false }),
        schedule({ eventDate: "2026-03-02", scheduledHours: 9, cancelled: true }),
      ],
    });
    expect(m.actionQueue[0].kind).toBe("unconverted");
    expect(m.actionQueue[1].kind).toBe("cancelled");
  });
});

describe("code mix totals", () => {
  it("sums delivered hours per procedure code", () => {
    const m = computeClinicOperations({
      ...base,
      billing: [
        billing({ procedureCode: "97153", hours: 2 }),
        billing({ procedureCode: "97153", hours: 1 }),
        billing({ procedureCode: "97155", hours: 3 }),
        billing({ procedureCode: "97156", hours: 0.5 }),
      ],
      schedule: [],
    });
    const byCode = Object.fromEntries(m.codeMix.map((c) => [c.key, c.hours]));
    expect(byCode["97153"]).toBe(3);
    expect(byCode["97155"]).toBe(3);
    expect(byCode["97156"]).toBe(0.5);
  });
});

describe("incomplete schedule coverage flag", () => {
  it("flags incomplete when the window extends past schedule snapshot coverage", () => {
    const m = computeClinicOperations({
      ...base,
      windowTo: "2026-04-15",
      scheduleCoverageEnd: "2026-03-31",
      billing: [],
      schedule: [],
    });
    expect(m.scheduleCoverageIncomplete).toBe(true);
    expect(m.dataQualityWarnings.some((w) => w.includes("scheduling snapshot coverage"))).toBe(true);
  });

  it("does not flag incomplete when the window is within coverage", () => {
    const m = computeClinicOperations({
      ...base,
      windowTo: "2026-03-15",
      scheduleCoverageEnd: "2026-03-31",
      billing: [],
      schedule: [],
    });
    expect(m.scheduleCoverageIncomplete).toBe(false);
  });

  it("always includes the capacity/staffing/census data-gap note", () => {
    const m = computeClinicOperations({ ...base, billing: [], schedule: [] });
    expect(m.dataQualityWarnings).toContain(CLINIC_OPS_DATA_GAP_NOTE);
  });
});
