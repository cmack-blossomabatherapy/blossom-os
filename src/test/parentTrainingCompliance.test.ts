import { describe, expect, it } from "vitest";
import {
  computeParentTrainingCompliance,
  resolveClientPayorRule,
  isSingleCalendarMonth,
  authDatePair,
  isAuthInScopeForMonth,
  MULTI_MONTH_UNAVAILABLE,
  PEACHSTATE_THRESHOLD_HOURS,
  OTHER_PAYOR_THRESHOLD_HOURS,
  type PtcAuthorizationInput,
} from "@/lib/os/reports/crPrimary/metrics/parentTrainingCompliance";

const MONTH = { from: "2024-05-01", to: "2024-05-31" };

/** An in-scope, proven-active 97156 authorization for the selected month. */
function auth(overrides: Partial<PtcAuthorizationInput> = {}): PtcAuthorizationInput {
  return {
    clientName: "Kid A",
    payor: "Peachstate",
    procedureCode: "97156",
    isActive: true,
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    ...overrides,
  };
}

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

  it("uses the 0.25 threshold for a single other payor", () => {
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

  it("ignores inactive rows and non-97156 scopes", () => {
    const r = resolveClientPayorRule([
      { clientName: "A", payor: "Cigna", procedureCode: "97156", isActive: false },
      { clientName: "A", payor: "Aetna", procedureCode: "97153", isActive: true },
      { clientName: "A", payor: "Peachstate", procedureCode: "97156", isActive: true },
    ]);
    expect(r.status).toBe("resolved");
    expect(r.thresholdHours).toBe(PEACHSTATE_THRESHOLD_HOURS);
  });
});

describe("month window + authorization scoping helpers", () => {
  it("accepts one calendar month and rejects a multi-month range", () => {
    expect(isSingleCalendarMonth(MONTH)).toBe(true);
    expect(isSingleCalendarMonth({ from: "2024-05-01", to: "2024-06-30" })).toBe(false);
    expect(isSingleCalendarMonth({ from: null, to: "2024-05-31" })).toBe(false);
  });

  it("prefers actual dates over fallback dates and records provenance", () => {
    expect(
      authDatePair({
        clientName: "A",
        actualStartDate: "2024-05-02",
        actualEndDate: "2024-05-20",
        startDate: "2020-01-01",
        endDate: "2020-12-31",
      }),
    ).toEqual({ start: "2024-05-02", end: "2024-05-20", provenance: "actual" });

    expect(authDatePair({ clientName: "A", startDate: "2024-01-01", endDate: "2024-12-31" }).provenance).toBe(
      "fallback",
    );
    expect(authDatePair({ clientName: "A" }).provenance).toBe("none");
  });

  it("counts an authorization whose active dates cover the month, and ignores expired/out-of-window/undated ones", () => {
    expect(isAuthInScopeForMonth(auth(), MONTH)).toBe(true);
    expect(isAuthInScopeForMonth(auth({ endDate: "2024-04-30" }), MONTH)).toBe(false);
    expect(isAuthInScopeForMonth(auth({ startDate: "2024-06-01", endDate: "2024-12-31" }), MONTH)).toBe(false);
    expect(isAuthInScopeForMonth(auth({ startDate: null, endDate: null }), MONTH)).toBe(false);
  });

  it("never treats inactive or null/unknown is_active as proven active", () => {
    expect(isAuthInScopeForMonth(auth({ isActive: false }), MONTH)).toBe(false);
    expect(isAuthInScopeForMonth(auth({ isActive: null }), MONTH)).toBe(false);
    expect(isAuthInScopeForMonth(auth({ isActive: undefined }), MONTH)).toBe(false);
  });
});

const resolveOwner = () => "BCBA One";

describe("computeParentTrainingCompliance", () => {
  it("shows a Choose one calendar month unavailable state for a multi-month range", () => {
    const result = computeParentTrainingCompliance({
      billed: [
        { date: "2024-05-01", procedureCode: "97156", hours: 5, clientName: "Kid A", isVoid: false, deleted: false },
      ],
      authorizations: [auth()],
      resolveOwner,
      window: { from: "2024-05-01", to: "2024-06-30" },
    });
    expect(result.singleMonth).toBe(false);
    expect(result.unavailableReason).toBe(MULTI_MONTH_UNAVAILABLE);
    expect(result.clientRows).toHaveLength(0);
    expect(result.bcbaRows).toHaveLength(0);
  });

  it("includes a client with an active authorization and zero billed hours as Monitor", () => {
    const { clientRows } = computeParentTrainingCompliance({
      billed: [],
      authorizations: [auth({ clientName: "Kid Zero", payor: "Aetna" })],
      resolveOwner,
      window: MONTH,
    });
    expect(clientRows).toHaveLength(1);
    expect(clientRows[0].client).toBe("Kid Zero");
    expect(clientRows[0].completed97156Hours).toBe(0);
    expect(clientRows[0].status).toBe("monitor");
    expect(clientRows[0].thresholdHours).toBe(OTHER_PAYOR_THRESHOLD_HOURS);
  });

  it("ignores an expired authorization when setting the target", () => {
    const { clientRows } = computeParentTrainingCompliance({
      billed: [
        { date: "2024-05-01", procedureCode: "97156", hours: 0.1, clientName: "Kid A", isVoid: false, deleted: false },
      ],
      authorizations: [auth({ payor: "Aetna", startDate: "2023-01-01", endDate: "2024-04-30" })],
      resolveOwner,
      window: MONTH,
    });
    expect(clientRows[0].status).toBe("no_target");
  });

  it("ignores an authorization with null is_active", () => {
    const { clientRows } = computeParentTrainingCompliance({
      billed: [
        { date: "2024-05-01", procedureCode: "97156", hours: 0.1, clientName: "Kid A", isVoid: false, deleted: false },
      ],
      authorizations: [auth({ payor: "Aetna", isActive: null })],
      resolveOwner,
      window: MONTH,
    });
    expect(clientRows[0].status).toBe("no_target");
  });

  it("is Healthy at exactly the Peachstate 2.0 hour boundary", () => {
    const { clientRows } = computeParentTrainingCompliance({
      billed: [
        { date: "2024-05-01", procedureCode: "97156", hours: 2.0, clientName: "Kid A", isVoid: false, deleted: false },
      ],
      authorizations: [auth()],
      resolveOwner,
      window: MONTH,
    });
    expect(clientRows[0].status).toBe("healthy");
    expect(clientRows[0].gapHours).toBe(0);
  });

  it("is Monitor a hair below the Peachstate boundary", () => {
    const { clientRows } = computeParentTrainingCompliance({
      billed: [
        { date: "2024-05-01", procedureCode: "97156", hours: 1.99, clientName: "Kid A", isVoid: false, deleted: false },
      ],
      authorizations: [auth()],
      resolveOwner,
      window: MONTH,
    });
    expect(clientRows[0].status).toBe("monitor");
    expect(clientRows[0].gapHours).toBeCloseTo(0.01);
  });

  it("is Healthy at exactly the 0.25 boundary for another payor", () => {
    const { clientRows } = computeParentTrainingCompliance({
      billed: [
        { date: "2024-05-01", procedureCode: "97156", hours: 0.25, clientName: "Kid B", isVoid: false, deleted: false },
      ],
      authorizations: [auth({ clientName: "Kid B", payor: "Aetna" })],
      resolveOwner,
      window: MONTH,
    });
    expect(clientRows[0].status).toBe("healthy");
  });

  it("is Monitor a hair below the 0.25 boundary", () => {
    const { clientRows } = computeParentTrainingCompliance({
      billed: [
        { date: "2024-05-01", procedureCode: "97156", hours: 0.24, clientName: "Kid B", isVoid: false, deleted: false },
      ],
      authorizations: [auth({ clientName: "Kid B", payor: "Aetna" })],
      resolveOwner,
      window: MONTH,
    });
    expect(clientRows[0].status).toBe("monitor");
  });

  it("never counts void/deleted rows and never uses 97153 as denominator", () => {
    const { clientRows } = computeParentTrainingCompliance({
      billed: [
        { date: "2024-05-01", procedureCode: "97156", hours: 5, clientName: "Kid C", isVoid: true, deleted: false },
        { date: "2024-05-01", procedureCode: "97156", hours: 5, clientName: "Kid C", isVoid: false, deleted: true },
        { date: "2024-05-01", procedureCode: "97153", hours: 10, clientName: "Kid C", isVoid: false, deleted: false },
      ],
      authorizations: [auth({ clientName: "Kid C", payor: "Aetna" })],
      resolveOwner,
      window: MONTH,
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
        auth({ clientName: "Kid D", payor: "Aetna" }),
        auth({ clientName: "Kid D", payor: "Cigna" }),
      ],
      resolveOwner,
      window: MONTH,
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
      authorizations: [auth()],
      resolveOwner,
      window: MONTH,
    });
    expect(bcbaRows).toHaveLength(1);
    expect(bcbaRows[0].status).toBe("healthy");

    const { bcbaRows: bcbaRows2 } = computeParentTrainingCompliance({
      billed: [
        { date: "2024-05-01", procedureCode: "97156", hours: 2.0, clientName: "Kid A", isVoid: false, deleted: false },
        { date: "2024-05-01", procedureCode: "97156", hours: 0.1, clientName: "Kid G", isVoid: false, deleted: false },
      ],
      authorizations: [auth(), auth({ clientName: "Kid G", payor: "Aetna" })],
      resolveOwner,
      window: MONTH,
    });
    expect(bcbaRows2[0].status).toBe("monitor");
  });
});
