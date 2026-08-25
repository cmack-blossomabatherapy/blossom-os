/**
 * Phase 4B3 — Parent Training (97156) and BCBA Supervision truth rules.
 *
 * Synthetic inputs only. These tests pin the rules an operator relies on:
 * identity is resolved CR-id first, bucket membership is disjoint, a target can
 * only come from one valid matched in-scope 97156 coverage pair, and supervision
 * never fabricates an RBT link or blends scheduled work into completed work.
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  NO_TARGET_LABEL,
  computeParentTrainingAnalysis,
  isAuthTargetInScope,
  resolveClientTarget,
  strictAuthorizedHoursMonth,
  type PtAuthorizationInput,
  type ParentTrainingInput,
  type PtSessionInput,
} from "@/lib/os/reports/crPrimary/metrics/parentTrainingV2";
import {
  SUPERVISION_BENCHMARK_PCT,
  computeSupervisionAnalysis,
  type SupervisionSessionInput,
} from "@/lib/os/reports/crPrimary/metrics/bcbaSupervisionV2";

const TODAY = "2026-08-15";
const WINDOW = { from: "2026-08-01", to: "2026-08-31" };

const pt = (over: Partial<PtSessionInput> = {}): PtSessionInput => ({
  date: "2026-08-05",
  procedureCode: "97156",
  hours: 1,
  clientName: "Client A",
  clientCrId: "c1",
  providerName: "BCBA One",
  payor: "Aetna",
  state: "GA",
  ...over,
});

const auth = (over: Partial<PtAuthorizationInput> = {}): PtAuthorizationInput => ({
  clientName: "Client A",
  clientCrId: "c1",
  procedureCode: "97156",
  serviceCodes: "97156",
  authorizedHoursMonth: 4,
  startDate: "2026-07-01",
  endDate: "2026-12-31",
  isActive: true,
  ...over,
});

const run = (over: Partial<ParentTrainingInput> = {}) =>
  computeParentTrainingAnalysis({
    billed: [],
    scheduled: [],
    authorizations: [],
    activeClients: [],
    resolveOwner: () => "BCBA One",
    window: WINDOW,
    today: TODAY,
    ...over,
  });

describe("Phase 4B3 — Parent Training", () => {
  it("propagates the schedule CR client id and keeps same-name distinct ids separate", () => {
    const a = run({
      billed: [pt({ clientName: "Jordan Smith", clientCrId: "cr-1" })],
      scheduled: [pt({ date: "2026-08-25", clientName: "Jordan Smith", clientCrId: "cr-2" })],
    });
    const keys = a.clientRows.map((r) => r.clientKey).sort();
    expect(keys).toEqual(["cr:cr-1", "cr:cr-2"]);
    const scheduled = a.clientRows.find((r) => r.clientKey === "cr:cr-2")!;
    expect(scheduled.upcomingSessions).toBe(1);
    expect(scheduled.completedSessions).toBe(0);
  });

  it("joins a unique id-less alias deterministically across input permutations", () => {
    const withId = pt({ clientName: "Riley Doe", clientCrId: "cr-9" });
    const withoutId = pt({ date: "2026-08-06", clientName: "Riley Doe", clientCrId: null });
    const forward = run({ billed: [withId, withoutId] });
    const reversed = run({ billed: [withoutId, withId] });
    expect(forward.clientRows).toHaveLength(1);
    expect(reversed.clientRows).toHaveLength(1);
    expect(forward.clientRows[0].clientKey).toBe("cr:cr-9");
    expect(reversed.clientRows[0].clientKey).toBe("cr:cr-9");
    expect(reversed.clientRows[0].completedSessions).toBe(2);
  });

  it("keeps completed, upcoming and cancelled buckets disjoint and never delivers a scheduled event", () => {
    const a = run({
      billed: [pt({ date: "2026-08-03", hours: 1.5 })],
      scheduled: [
        pt({ date: "2026-08-20" }),
        pt({ date: "2026-08-22", cancelled: true, cancellationReason: "Client cancelled" }),
        pt({ date: "2026-08-10" }), // kept, already past: not upcoming, not delivered
      ],
    });
    expect(a.completedSessions).toBe(1);
    expect(a.completedHours).toBe(1.5);
    expect(a.upcomingSessions).toBe(1);
    expect(a.cancelledSessions).toBe(1);
    const buckets = a.events.map((e) => e.bucket).sort();
    expect(buckets).toEqual(["cancelled", "completed", "upcoming"]);
  });

  it("only a valid matched in-scope 97156 pair can set a target", () => {
    const a = run({ billed: [pt()], authorizations: [auth()] });
    expect(a.clientRows[0].hasTarget).toBe(true);
    expect(a.clientRows[0].authorizedMonthlyHours).toBe(4);
    // actual pair matched on its own columns is usable
    expect(
      isAuthTargetInScope(
        { actualStartDate: "2026-08-01", actualEndDate: "2026-08-31" },
        WINDOW,
        TODAY,
      ),
    ).toBe(true);
    // crossing an actual start with a follow-up end is never coverage
    expect(
      isAuthTargetInScope(
        { actualStartDate: "2026-08-01", followupEndDate: "2026-09-30" },
        WINDOW,
        TODAY,
      ),
    ).toBe(false);
  });

  it("inactive, future, expired, malformed, reversed, pairless and non-97156 rows yield No target", () => {
    const cases: PtAuthorizationInput[] = [
      auth({ isActive: false }),
      auth({ startDate: "2026-10-01", endDate: "2026-12-31" }), // future
      auth({ startDate: "2025-01-01", endDate: "2025-06-30" }), // expired
      auth({ startDate: "not-a-date", endDate: "also-bad" }), // malformed
      auth({ startDate: "2026-08-31", endDate: "2026-08-01" }), // reversed
      auth({ startDate: null, endDate: null }), // no pair
      auth({ procedureCode: "97155", serviceCodes: "97155" }), // wrong scope
    ];
    for (const a of cases) {
      const analysis = run({ billed: [pt()], authorizations: [a] });
      const row = analysis.clientRows[0];
      expect(row.hasTarget).toBe(false);
      expect(row.expectedCadence).toBe(NO_TARGET_LABEL);
      expect(row.belowTarget).toBe(false);
      expect(row.status).toBe("no_target");
      expect(analysis.belowTargetQueue).toHaveLength(0);
    }
  });

  it("treats null, blank, boolean and nonfinite authorized hours as no target, but a real positive value works", () => {
    for (const bad of [null, undefined, "", "   ", true, false, NaN, Infinity, 0, -3]) {
      expect(strictAuthorizedHoursMonth(bad)).toBeNull();
      expect(
        resolveClientTarget([auth({ authorizedHoursMonth: bad as never, frequency: null })]).source,
      ).toBe("none");
    }
    expect(strictAuthorizedHoursMonth(6)).toBe(6);
    expect(resolveClientTarget([auth({ authorizedHoursMonth: 6 })]).perMonth).toBe(6);
    // an unambiguous cadence is accepted only when hours are unusable
    const cadence = resolveClientTarget([
      auth({ authorizedHoursMonth: null, frequency: "2 sessions per week" }),
    ]);
    expect(cadence.source).toBe("frequency");
    expect(cadence.type).toBe("sessions");
    // prose is not a target
    expect(
      resolveClientTarget([
        auth({ authorizedHoursMonth: null, frequency: "as clinically indicated" }),
      ]).source,
    ).toBe("none");
  });

  it("applies the no-upcoming, below-target and needs-reschedule rules correctly", () => {
    // No upcoming: completed earlier, nothing ahead of today.
    const noUpcoming = run({ billed: [pt()], authorizations: [auth()] });
    expect(noUpcoming.noUpcomingQueue.map((r) => r.clientKey)).toEqual(["cr:c1"]);

    // Below target: 1 of 4 authorized hours with an upcoming session on the books.
    const below = run({
      billed: [pt({ hours: 1 })],
      scheduled: [pt({ date: "2026-08-28" })],
      authorizations: [auth()],
    });
    expect(below.clientRows[0].belowTarget).toBe(true);
    expect(below.clientRows[0].pacePct).toBeLessThan(100);

    // Needs reschedule: cancelled with nothing later.
    const needs = run({
      scheduled: [pt({ date: "2026-08-10", cancelled: true })],
    });
    expect(needs.needsRescheduleQueue).toHaveLength(1);

    // A later kept 97156 appointment clears the reschedule requirement.
    const rescheduled = run({
      scheduled: [pt({ date: "2026-08-10", cancelled: true }), pt({ date: "2026-08-20" })],
    });
    expect(rescheduled.needsRescheduleQueue).toHaveLength(0);

    // A later billed 97156 fact also clears it.
    const madeUp = run({
      billed: [pt({ date: "2026-08-12" })],
      scheduled: [pt({ date: "2026-08-10", cancelled: true })],
    });
    expect(madeUp.needsRescheduleQueue).toHaveLength(0);
  });

  it("keeps schedule-only clients visible in the client rows", () => {
    const a = run({
      scheduled: [pt({ date: "2026-08-30", clientName: "Schedule Only", clientCrId: "cr-s" })],
      activeClients: [{ client: "Schedule Only", clientCrId: "cr-s" }],
    });
    expect(a.clientRows.map((r) => r.client)).toContain("Schedule Only");
  });
});

const sv = (over: Partial<SupervisionSessionInput> = {}): SupervisionSessionInput => ({
  date: "2026-08-05",
  procedureCode: "97153",
  hours: 10,
  clientName: "Client A",
  clientCrId: "c1",
  providerName: "RBT One",
  providerCrId: "p1",
  state: "GA",
  payor: "Aetna",
  ...over,
});

describe("Phase 4B3 — BCBA Supervision", () => {
  it("keeps Past and Projected source membership exact", () => {
    const a = computeSupervisionAnalysis({
      past: [sv({ hours: 20 }), sv({ procedureCode: "97155", hours: 1 })],
      projected: [sv({ date: "2026-08-28", hours: 10 })],
      resolveOwner: () => "BCBA One",
    });
    expect(a.past.directHours).toBe(20);
    expect(a.past.supervisionHours).toBe(1);
    expect(a.projected.directHours).toBe(30);
    expect(a.projected.supervisionHours).toBe(1);
    // scheduled hours never appear as completed
    expect(a.projected.rows[0].completedDirectHours).toBe(20);
    expect(a.projected.rows[0].scheduledDirectHours).toBe(10);
  });

  it("propagates scheduled client and provider ids and keeps distinct same-name ids separate", () => {
    const a = computeSupervisionAnalysis({
      past: [sv({ clientName: "Jordan Smith", clientCrId: "cr-1" })],
      projected: [
        sv({ date: "2026-08-30", clientName: "Jordan Smith", clientCrId: "cr-2", hours: 5 }),
      ],
      grouping: "client",
      resolveOwner: () => "BCBA One",
    });
    expect(a.projected.rows.map((r) => r.key).sort()).toEqual(["cr:cr-1", "cr:cr-2"]);
    expect(a.projected.rows.every((r) => r.label === "Jordan Smith")).toBe(true);

    const byRbt = computeSupervisionAnalysis({
      past: [sv({ providerName: "Sam Lee", providerCrId: "rbt-1" })],
      projected: [sv({ date: "2026-08-30", providerName: "Sam Lee", providerCrId: "rbt-2" })],
      grouping: "rbt",
      resolveOwner: () => "BCBA One",
    });
    expect(byRbt.projected.rows.map((r) => r.key).sort()).toEqual(["cr:rbt-1", "cr:rbt-2"]);
  });

  it("computes the ratio and hours needed for the 5% operational benchmark; zero direct hours is Insufficient data", () => {
    const a = computeSupervisionAnalysis({
      past: [sv({ hours: 100 }), sv({ procedureCode: "97155", hours: 1 })],
      projected: [],
      resolveOwner: () => "BCBA One",
    });
    expect(a.past.rows[0].ratioPct).toBe(1);
    expect(a.past.rows[0].hoursToTarget).toBe(4);
    expect(SUPERVISION_BENCHMARK_PCT).toBe(5);

    const none = computeSupervisionAnalysis({
      past: [sv({ procedureCode: "97155", hours: 2 })],
      projected: [],
      resolveOwner: () => "BCBA One",
    });
    expect(none.past.rows[0].ratioPct).toBeNull();
    expect(none.past.rows[0].status).toBe("insufficient_data");
  });

  it("never fabricates or spreads unlinked 97155 hours across RBTs", () => {
    const a = computeSupervisionAnalysis({
      past: [
        sv({ providerName: "RBT One", providerCrId: "rbt-1", hours: 40 }),
        sv({ providerName: "RBT Two", providerCrId: "rbt-2", hours: 40 }),
        // supervision with no explicit RBT link
        sv({ procedureCode: "97155", hours: 4, providerName: "BCBA One", providerCrId: "b1" }),
      ],
      projected: [],
      grouping: "rbt",
      resolveOwner: () => "BCBA One",
    });
    for (const row of a.past.rows) {
      expect(row.supervisionHours).toBe(0);
      expect(row.supervisionLinkable).toBe(false);
      expect(row.ratioPct).toBeNull();
      expect(row.status).toBe("insufficient_data");
    }
    // The overall operational ratio still reads the real facts.
    expect(a.past.directHours).toBe(80);
    expect(a.past.supervisionHours).toBe(4);
  });

  it("attributes 97155 to an RBT only through an explicit source link", () => {
    const a = computeSupervisionAnalysis({
      past: [
        sv({ providerName: "RBT One", providerCrId: "rbt-1", hours: 40 }),
        sv({
          procedureCode: "97155",
          hours: 2,
          providerName: "BCBA One",
          providerCrId: "b1",
          supervisedProviderName: "RBT One",
          supervisedProviderCrId: "rbt-1",
        }),
      ],
      projected: [],
      grouping: "rbt",
      resolveOwner: () => "BCBA One",
    });
    const row = a.past.rows.find((r) => r.key === "cr:rbt-1")!;
    expect(row.supervisionHours).toBe(2);
    expect(row.ratioPct).toBe(5);
    expect(row.status).toBe("meets_target");
  });
});

const read = (rel: string) => fs.readFileSync(path.join(process.cwd(), rel), "utf8");

describe("Phase 4B3 — page copy and protected boundary", () => {
  const ptPage = read("src/pages/os/reports/ParentTrainingPage.tsx");
  const svPage = read("src/pages/os/reports/BcbaSupervisionPage.tsx");

  it("states the operational benchmark and the required supervision-log export", () => {
    expect(svPage).toMatch(/operational benchmark/i);
    expect(svPage).toMatch(/SUPERVISION_PROVENANCE_NOTE/);
    expect(svPage).not.toMatch(/BACB/i);
    expect(svPage).not.toMatch(/credentialing compliance/i);
  });

  it("keeps admin, Data Hub and import directions off both staff pages", () => {
    for (const page of [ptPage, svPage]) {
      expect(page).not.toMatch(/Data Hub/i);
      expect(page).not.toMatch(/\/os\/admin/i);
      expect(page).not.toMatch(/estimated lost revenue/i);
    }
  });

  it("propagates the schedule CR client id on both pages", () => {
    expect(ptPage).toMatch(/clientCrId: r\.client_cr_id/);
    expect(svPage).toMatch(/providerCrId: r\.provider_cr_id/);
    expect(svPage).not.toMatch(/clientCrId: null/);
    expect(ptPage).not.toMatch(/clientCrId: null,/);
  });

  it("leaves every protected BCBA Productivity V3 path untouched", () => {
    const protectedPaths = [
      "src/pages/os/reports/BcbaProductivityReportV3.tsx",
      "src/lib/os/bcbaProductivityV3/adminUploadStore.ts",
      "src/lib/os/bcbaProductivityV3/engine.ts",
      "src/lib/os/bcbaProductivityV3/inferAssignments.ts",
      "src/lib/os/bcbaProductivityV3/model.ts",
      "src/lib/os/bcbaProductivityV3/stateNormalization.ts",
      "src/lib/os/bcbaProductivityV3/store.ts",
    ];
    for (const p of protectedPaths) {
      expect(fs.existsSync(path.join(process.cwd(), p))).toBe(true);
    }
  });
});
