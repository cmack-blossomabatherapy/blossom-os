import { describe, it, expect } from "vitest";
import {
  computeParentTrainingCompliance,
  resolveClientPayorRule,
  PEACHSTATE_THRESHOLD_HOURS,
  OTHER_PAYOR_THRESHOLD_HOURS,
} from "@/lib/os/reports/crPrimary/metrics/parentTrainingCompliance";

describe("resolveClientPayorRule", () => {
  it("matches peachstate alias variants case/space-insensitively", () => {
    for (const payor of ["Peachstate", "PEACH STATE Health Plan", "peach-state"]) {
      const r = resolveClientPayorRule([
        { clientName: "A", payor, procedureCode: "97156", isActive: true },
      ]);
      expect(r.status).toBe("resolved");
      expect(r.thresholdHours).toBe(PEACHSTATE_THRESHOLD_HOURS);
    }
  });

  it("applies the 0.25 threshold for exactly one other payor", () => {
    const r = resolveClientPayorRule([
      { clientName: "A", payor: "Aetna", procedureCode: "97156", isActive: true },
    ]);
    expect(r.status).toBe("resolved");
    expect(r.thresholdHours).toBe(OTHER_PAYOR_THRESHOLD_HOURS);
  });

  it("returns no_target when no payor is documented", () => {
    const r = resolveClientPayorRule([
      { clientName: "A", payor: null, procedureCode: "97156", isActive: true },
    ]);
    expect(r.status).toBe("no_target");
  });

  it("returns needs_payor_review for more than one distinct active payor", () => {
    const r = resolveClientPayorRule([
      { clientName: "A", payor: "Aetna", procedureCode: "97156", isActive: true },
      { clientName: "A", payor: "Cigna", procedureCode: "97156", isActive: true },
    ]);
    expect(r.status).toBe("needs_payor_review");
  });

  it("ignores inactive authorizations and non-97156 authorizations", () => {
    const r = resolveClientPayorRule([
      { clientName: "A", payor: "Cigna", procedureCode: "97156", isActive: false },
      { clientName: "A", payor: "Aetna", procedureCode: "97153", isActive: true },
      { clientName: "A", payor: "Peachstate", procedureCode: "97156", isActive: true },
    ]);
    expect(r.status).toBe("resolved");
    expect(r.thresholdHours).toBe(PEACHSTATE_THRESHOLD_HOURS);
  });
});

const resolveOwner = () => "BCBA One";

describe("computeParentTrainingCompliance", () => {
  it("is Healthy at exactly the Peachstate 2.0 hour boundary", () => {
    const { clientRows } = computeParentTrainingCompliance({
      billed: [
        { date: "2024-05-01", procedureCode: "97156", hours: 2.0, clientName: "Kid A", isVoid: false, deleted: false },
      ],
      authorizations: [
        { clientName: "Kid A", payor: "Peachstate", procedureCode: "97156", isActive: true },
      ],
      resolveOwner,
    });
    expect(clientRows[0].status).toBe("healthy");
    expect(clientRows[0].gapHours).toBe(0);
  });

  it("is Monitor a hair below the Peachstate boundary", () => {
    const { clientRows } = computeParentTrainingCompliance({
      billed: [
        { date: "2024-05-01", procedureCode: "97156", hours: 1.99, clientName: "Kid A", isVoid: false, deleted: false },
      ],
      authorizations: [
        { clientName: "Kid A", payor: "Peachstate", procedureCode: "97156", isActive: true },
      ],
      resolveOwner,
    });
    expect(clientRows[0].status).toBe("monitor");
    expect(clientRows[0].gapHours).toBeCloseTo(0.01);
  });

  it("is Healthy at exactly the 0.25 boundary for another payor", () => {
    const { clientRows } = computeParentTrainingCompliance({
      billed: [
        { date: "2024-05-01", procedureCode: "97156", hours: 0.25, clientName: "Kid B", isVoid: false, deleted: false },
      ],
      authorizations: [
        { clientName: "Kid B", payor: "Aetna", procedureCode: "97156", isActive: true },
      ],
      resolveOwner,
    });
    expect(clientRows[0].status).toBe("healthy");
  });

  it("is Monitor a hair below the 0.25 boundary", () => {
    const { clientRows } = computeParentTrainingCompliance({
      billed: [
        { date: "2024-05-01", procedureCode: "97156", hours: 0.24, clientName: "Kid B", isVoid: false, deleted: false },
      ],
      authorizations: [
        { clientName: "Kid B", payor: "Aetna", procedureCode: "97156", isActive: true },
      ],
      resolveOwner,
    });
    expect(clientRows[0].status).toBe("monitor");
  });

  it("never counts scheduled/cancelled or void/deleted rows and never uses 97153 as denominator", () => {
    const { clientRows } = computeParentTrainingCompliance({
      billed: [
        { date: "2024-05-01", procedureCode: "97156", hours: 5, clientName: "Kid C", isVoid: true, deleted: false },
        { date: "2024-05-01", procedureCode: "97156", hours: 5, clientName: "Kid C", isVoid: false, deleted: true },
        { date: "2024-05-01", procedureCode: "97153", hours: 10, clientName: "Kid C", isVoid: false, deleted: false },
      ],
      authorizations: [
        { clientName: "Kid C", payor: "Aetna", procedureCode: "97156", isActive: true },
      ],
      resolveOwner,
    });
    expect(clientRows[0].completed97156Hours).toBe(0);
    expect(clientRows[0].completed97153Hours).toBe(10);
    expect(clientRows[0].status).toBe("monitor");
  });

  it("flags multiple distinct payors as Needs Payor Review and No target for none", () => {
    const { clientRows } = computeParentTrainingCompliance({
      billed: [
        { date: "2024-05-01", procedureCode: "97156", hours: 1, clientName: "Kid D", isVoid: false, deleted: false },
        { date: "2024-05-01", procedureCode: "97156", hours: 1, clientName: "Kid E", isVoid: false, deleted: false },
      ],
      authorizations: [
        { clientName: "Kid D", payor: "Aetna", procedureCode: "97156", isActive: true },
        { clientName: "Kid D", payor: "Cigna", procedureCode: "97156", isActive: true },
      ],
      resolveOwner,
    });
    const d = clientRows.find((r) => r.client === "Kid D")!;
    const e = clientRows.find((r) => r.client === "Kid E")!;
    expect(d.status).toBe("needs_payor_review");
    expect(e.status).toBe("no_target");
  });

  it("rolls up BCBA: Healthy only when every resolvable client passes, Monitor when any fails, unresolvable clients don't force Monitor", () => {
    const { bcbaRows } = computeParentTrainingCompliance({
      billed: [
        { date: "2024-05-01", procedureCode: "97156", hours: 2.0, clientName: "Kid A", isVoid: false, deleted: false },
        { date: "2024-05-01", procedureCode: "97156", hours: 0, clientName: "Kid F", isVoid: false, deleted: false },
      ],
      authorizations: [
        { clientName: "Kid A", payor: "Peachstate", procedureCode: "97156", isActive: true },
        // Kid F has no documented payor -> no_target, must not force Monitor.
      ],
      resolveOwner,
    });
    expect(bcbaRows).toHaveLength(1);
    expect(bcbaRows[0].status).toBe("healthy");

    const { bcbaRows: bcbaRows2 } = computeParentTrainingCompliance({
      billed: [
        { date: "2024-05-01", procedureCode: "97156", hours: 2.0, clientName: "Kid A", isVoid: false, deleted: false },
        { date: "2024-05-01", procedureCode: "97156", hours: 0.1, clientName: "Kid G", isVoid: false, deleted: false },
      ],
      authorizations: [
        { clientName: "Kid A", payor: "Peachstate", procedureCode: "97156", isActive: true },
        { clientName: "Kid G", payor: "Aetna", procedureCode: "97156", isActive: true },
      ],
      resolveOwner,
    });
    expect(bcbaRows2[0].status).toBe("monitor");
  });
});
