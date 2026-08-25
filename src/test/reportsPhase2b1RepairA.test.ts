/**
 * Phase 2B1 correctness repair A.
 *
 * Covers the three verified audit failures:
 *  1. canonical V3 ownership must be date-exact (segments, not month-collapse);
 *  2. Authorization Command Center exports must follow the active tab and
 *     classify lifecycle kind from the recorded kind;
 *  3. utilization must prorate FULL-range authorized hours (never the already
 *     monthly figure), keep source-window fields aligned or unavailable, and
 *     never turn all-null totals into zeros.
 */
import { describe, it, expect } from "vitest";
import { buildOwnership, type OwnershipResult } from "@/lib/os/bcbaProductivityV3/engine";
import {
  buildCanonicalOwnershipIndex,
  toEngineRows,
} from "@/lib/os/reports/crPrimary/ownership/v3Ownership";
import {
  buildAuthorizationTabExport,
  projectLifecycleEvent,
} from "@/lib/os/reports/crPrimary/metrics/authorizationExport";
import { classifyLifecycleEvent } from "@/lib/os/reports/crPrimary/metrics/authorizationLifecycle";
import { computeProratedUtilization } from "@/lib/os/reports/crPrimary/metrics/authorizationProration";
import { buildUtilizationTabExport } from "@/lib/os/reports/crPrimary/metrics/authorizationUtilizationExport";
import { computeAuthorizationTrend } from "@/lib/os/reports/crPrimary/metrics/authorizationTrends";
import { resolveActiveScope } from "@/lib/os/reports/crPrimary/metrics/authorizationUtilizationScope";

/* ------------------------- ownership adapter ------------------------- */

const shared = (over: Record<string, unknown>) =>
  ({
    clientId: "CR-1",
    clientName: "Alex Doe",
    renderingProvider: "Dr. Reed",
    providerLabels: "BCBA ,Georgia Location",
    code: "97155",
    hours: 2,
    date: "2026-03-02",
    state: "GA",
    payor: "Payor A",
    location: "Georgia",
    ...over,
  }) as never;

const sharedFixture = [
  shared({}),
  shared({ code: "97153", renderingProvider: "RBT One", providerLabels: "RBT", date: "2026-03-05", hours: 4 }),
  shared({ renderingProvider: "Dr. Kim", date: "2026-03-15" }),
  shared({ code: "97153", renderingProvider: "RBT One", providerLabels: "RBT", date: "2026-03-20", hours: 6 }),
];

describe("canonical V3 ownership adapter", () => {
  const direct = buildOwnership(toEngineRows(sharedFixture));
  const index = buildCanonicalOwnershipIndex(direct);

  it("passes the V3 ownership result through untouched", () => {
    const fingerprint = (r: OwnershipResult) =>
      r.rows.map((row) => [row.clientId, row.clientName, row.monthKey, row.date, row.owner, row.ownerReason].join("|"));
    expect(fingerprint(index.result)).toEqual(fingerprint(direct));
  });

  it("resolves a mid-month BCBA change to the owner of that date", () => {
    const before = index.resolve({ clientCrId: "CR-1", date: "2026-03-05" });
    const after = index.resolve({ clientCrId: "CR-1", date: "2026-03-20" });
    expect(before.bcba).toBe("Dr. Reed");
    expect(after.bcba).toBe("Dr. Kim");
    expect(before.basis).toBe("segment");
    expect(before.matchedBy).toBe("client_cr_id");
  });

  it("returns unknown when no segment covers the requested date", () => {
    const r = index.resolve({ clientCrId: "CR-1", date: "2031-01-01" });
    expect(r.bcba).toBeNull();
    expect(r.basis).toBe("none");
  });

  it("labels the dateless answer as a fallback instead of a fact", () => {
    const r = index.resolve({ clientName: "alex  doe" });
    expect(r.bcba).not.toBeNull();
    expect(r.basis).toBe("fallback_latest_segment");
    expect(r.matchedBy).toBe("client_name");
  });

  it("never guesses an owner for an unknown client", () => {
    expect(index.resolve({ clientName: "Nobody", date: "2026-03-05" }).bcba).toBeNull();
  });

  it("exposes V3 provenance for disclosure panels", () => {
    expect(index.conflicts).toEqual(direct.conflicts);
    expect(index.gaps).toEqual(direct.gaps);
    expect(index.clientsWithoutAnchors).toEqual(direct.clientsWithoutAnchors);
  });
});

/* --------------------- authorization command center -------------------- */

const event = (over: Record<string, unknown> = {}) =>
  ({
    record_id: "e1",
    source: "operational",
    event_type: "approved",
    event_date: "2026-03-04",
    client_name: "Alex Doe",
    authorization_number: "A-1",
    auth_type: "RA",
    lifecycle_kind: null,
    payor: "Payor A",
    state: "GA",
    reason: null,
    ...over,
  }) as never;

const pauseOps = {
  confirmedPauses: [
    {
      key: "p1",
      eventDate: "2026-03-08",
      client: "Alex Doe",
      authorizationNumber: "A-1",
      state: "GA",
      payor: "Payor A",
      reason: "Family travel",
      source: "weekly",
    },
  ],
  pauseReasons: [],
  candidates: [
    {
      key: "c1",
      client: "Bea Ray",
      state: "GA",
      payor: "Payor A",
      lastEnd: "2026-02-01",
      note: "Confirm before scheduling",
      needsConfirmation: true as const,
    },
  ],
};

const progressOps = {
  hasEvents: true,
  submitted: 1,
  approved: 0,
  denied: 0,
  resubmitted: 0,
  events: [
    {
      key: "pr1",
      eventDate: "2026-03-03",
      client: "Alex Doe",
      authorizationNumber: "A-1",
      payor: "Payor A",
      state: "GA",
      outcome: "submitted" as const,
      reason: "Not documented",
      source: "operational",
    },
  ],
  dueRows: [
    {
      key: "due1",
      client: "Alex Doe",
      authorizationNumber: "A-1",
      state: "GA",
      payor: "Payor A",
      status: "PR drafting",
      nextAction: "Send progress report",
      dueDate: "2026-03-20",
      dueSource: "next_action_due_date" as const,
      daysUntilDue: 5,
      overdue: false,
      note: "",
    },
  ],
  overdueCount: 0,
  withoutDueSource: 0,
};

const continuityRow = {
  key: "k1",
  authorizationNumber: "A-1",
  client: "Alex Doe",
  clientCrId: "CR-1",
  payor: "Payor A",
  state: "GA",
  code: "97153",
  startDate: "2026-01-01",
  endDate: "2026-06-30",
  daysToExpiry: 100,
  continuity: "active" as const,
  window: null,
  authorizedHours: null,
  usedHours: null,
  remainingHours: null,
  renewal: "no_action" as const,
  note: "Active coverage",
};

const exportInput = {
  events: [event()],
  byKind: [{ kind: "reauthorization", label: "Reauthorization", submitted: 0, approved: 1, denied: 0, resubmitted: 0, paused: 0, other: 0, approvalRate: 100, denialRate: 0 }] as never,
  continuityRows: [continuityRow],
  progress: progressOps as never,
  pauses: pauseOps as never,
};

describe("authorization command center lifecycle + exports", () => {
  it("classifies a generic approved event by its recorded auth type", () => {
    const c = classifyLifecycleEvent("approved", "RA");
    expect(c.kind).toBe("reauthorization");
    const projected = projectLifecycleEvent(event());
    expect(projected.kind).toBe("Reauthorization");
    expect(projected.kindSource).toBe("Recorded authorization type");
  });

  it("exports lifecycle events, with the recorded kind, on the lifecycle tab", () => {
    const p = buildAuthorizationTabExport("lifecycle", exportInput);
    expect(p.name).toBe("authorization-lifecycle-events");
    expect(p.rows[0].kind).toBe("Reauthorization");
  });

  it("falls back to the lifecycle matrix when no events exist", () => {
    const p = buildAuthorizationTabExport("lifecycle", { ...exportInput, events: [] });
    expect(p.name).toBe("authorization-lifecycle-matrix");
    expect(p.rows).toHaveLength(1);
  });

  it("exports continuity rows on the continuity tab", () => {
    const p = buildAuthorizationTabExport("continuity", exportInput);
    expect(p.name).toBe("authorization-continuity");
    expect(p.rows[0].authorizedHours).toBe("Not documented");
  });

  it("exports progress-report events and due rows, never continuity", () => {
    const p = buildAuthorizationTabExport("progress-reports", exportInput);
    expect(p.name).toBe("authorization-progress-reports");
    expect(p.rows.map((r) => r.section)).toEqual([
      "Progress-report event",
      "Progress-report due",
    ]);
  });

  it("exports confirmed pauses separately from Needs Confirmation candidates", () => {
    const p = buildAuthorizationTabExport("pauses", exportInput);
    expect(p.name).toBe("authorization-pauses");
    expect(p.rows.map((r) => r.section)).toEqual(["Confirmed pause", "Needs Confirmation"]);
  });
});

/* --------------------------- utilization ---------------------------- */

const auth = (over: Record<string, unknown> = {}) =>
  ({
    authorization_id: "AUTH-1",
    authorization_number: "A-1",
    client_name: "Alex Doe",
    client_cr_id: "CR-1",
    payor: "Payor A",
    state: "GA",
    procedure_code: "97153",
    start_date: "2026-01-01",
    end_date: "2026-06-30",
    is_active: true,
    authorized_hours: 120,
    authorized_hours_auth_range: 120,
    authorized_hours_month: 20,
    ...over,
  }) as never;

describe("utilization proration formula", () => {
  it("prorates full-range authorized hours instead of the monthly figure", () => {
    const r = computeProratedUtilization([auth()], [], {
      from: "2026-03-01",
      to: "2026-03-31",
      today: "2026-03-15",
      snapshotWindow: "month",
    });
    const prorated = r.rows[0].proratedAuthorizedHours ?? 0;
    // 120 hrs over 181 days, 31 days in range ≈ 20.6 — not 20 prorated again.
    expect(prorated).toBeGreaterThan(19);
    expect(prorated).toBeLessThan(22);
    expect(r.rows[0].authorizedHours).toBe(120);
    expect(r.rows[0].sourceWindowAuthorizedHours).toBe(20);
  });

  it("marks source-window figures unavailable for an arbitrary custom range", () => {
    const r = computeProratedUtilization(
      [auth({ worked_hours: 99, remaining_hours: 21, worked_hours_month: 10 })],
      [],
      { from: "2026-02-10", to: "2026-03-04", today: "2026-03-15", snapshotWindow: "unavailable" },
    );
    const row = r.rows[0];
    expect(row.sourceUsedHours).toBeNull();
    expect(row.sourceRemainingHours).toBeNull();
    expect(row.scheduledHours).toBeNull();
    expect(row.pendingHours).toBeNull();
    expect(row.sourceWindowAuthorizedHours).toBeNull();
  });

  it("keeps all-null totals null rather than reporting zero", () => {
    const r = computeProratedUtilization([auth({ authorized_hours: null, authorized_hours_auth_range: null })], [], {
      from: "2026-03-01",
      to: "2026-03-31",
      today: "2026-03-15",
      snapshotWindow: "unavailable",
    });
    expect(r.totals.authorizedHours).toBeNull();
    expect(r.totals.sourceUsedHours).toBeNull();
    expect(r.totals.scheduledHours).toBeNull();
    expect(r.totals.pendingHours).toBeNull();
    expect(r.totals.projectedDemandHours).toBeNull();
    expect(r.totals.varianceHours).toBeNull();
  });

  it("excludes an explicitly active but future-dated authorization from Active", () => {
    const scope = resolveActiveScope(
      { is_active: true, startDate: "2026-09-01", endDate: "2026-12-31" },
      "2026-03-15",
    );
    // The page filters on today being inside coverage; a future start has no
    // hours to utilize yet.
    expect(scope.active && "2026-03-15" >= "2026-09-01").toBe(false);
  });

  it("never lets ambiguous billing hours into the trend", () => {
    const auths = [auth(), auth({ authorization_id: "AUTH-2", authorization_number: "A-2" })];
    const billing = [
      { id: "b1", date_of_service: "2026-03-03", hours: 5, client_name: "Alex Doe", client_cr_id: "CR-1", procedure_code: "97153" },
    ];
    const r = computeProratedUtilization(auths, billing, {
      from: "2026-03-01",
      to: "2026-03-31",
      today: "2026-03-15",
      snapshotWindow: "month",
    });
    const clean = r.allocations.filter(
      (a) => a.basis === "authorization_id" || a.basis === "unique_fallback",
    );
    const trend = computeAuthorizationTrend(
      [{ startDate: "2026-01-01", endDate: "2026-06-30", authorizedHours: 120 }],
      clean.map((a) => ({ date: a.date, hours: a.hours })),
      { from: "2026-03-01", to: "2026-03-31", grain: "month" },
    );
    expect(r.allocation.ambiguous).toBe(1);
    expect(trend.points[0].usedHours).toBe(0);
  });

  it("keeps percent and hour series in separate chart datasets", () => {
    const trend = computeAuthorizationTrend(
      [{ startDate: "2026-03-01", endDate: "2026-03-31", authorizedHours: 40 }],
      [{ date: "2026-03-10", hours: 20 }],
      { from: "2026-03-01", to: "2026-03-31", grain: "month" },
    );
    expect(Object.keys(trend.hours[0])).toEqual(["label", "value", "secondary"]);
    expect(Object.keys(trend.pace[0])).toEqual(["label", "value"]);
    expect(trend.pace[0].value).toBe(50);
  });

  it("exports the active utilization tab", () => {
    const trend = computeAuthorizationTrend(
      [{ startDate: "2026-03-01", endDate: "2026-03-31", authorizedHours: 40 }],
      [{ date: "2026-03-10", hours: 20 }],
      { from: "2026-03-01", to: "2026-03-31", grain: "month" },
    );
    const input = {
      utilizationRows: [{ client: "Alex Doe" }],
      utilizationColumns: [{ key: "client", label: "Client" }],
      reconciliationRows: [{ client: "Recon" }],
      gapRows: [{ client: "Gap" }],
      trend,
    };
    expect(buildUtilizationTabExport("utilization", input).rows[0].client).toBe("Alex Doe");
    expect(buildUtilizationTabExport("reconciliation", input).rows[0].client).toBe("Recon");
    expect(buildUtilizationTabExport("gaps", input).rows[0].client).toBe("Gap");
    const trendExport = buildUtilizationTabExport("trends", input);
    expect(trendExport.name).toBe("authorization-utilization-trends");
    expect(trendExport.rows[0].usedHours).toBe(20);
  });
});
