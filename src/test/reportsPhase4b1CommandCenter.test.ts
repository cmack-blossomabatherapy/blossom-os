/**
 * Phase 4B1 focused regressions — BCBA Performance + Authorization Command
 * Center. Synthetic data only; no PHI.
 */
import { describe, expect, it } from "vitest";
import {
  computeAuthorizationContinuity,
  type ContinuityAuthRow,
} from "@/lib/os/reports/crPrimary/metrics/authorizationContinuity";
import {
  computeAuthorizationActionTimelines,
  isActionResolved,
  timelineDays,
  type AuthorizationActionRow,
} from "@/lib/os/reports/crPrimary/metrics/authorizationActions";
import {
  computeAuthorizationActionQueues,
  computeCodeEventCounts,
  computeKindEventCounts,
  computeServiceActivityWithoutCoverage,
} from "@/lib/os/reports/crPrimary/metrics/authorizationCommandCenter";
import { applyFilters } from "@/lib/os/reports/crPrimary/filters";
import { EMPTY_FILTERS, type PrimaryReportFilters } from "@/lib/os/reports/crPrimary/types";
import {
  computeBcbaPerformanceAnalysis,
  worstStatus,
  type BcbaPerformanceInput,
} from "@/lib/os/reports/crPrimary/metrics/bcbaPerformanceV2";

const TODAY = "2026-06-15";
const RANGE = { from: "2026-06-01", to: "2026-06-30" };

const action = (over: Partial<AuthorizationActionRow>): AuthorizationActionRow => ({
  record_id: Math.random().toString(36).slice(2),
  ...over,
});

describe("Phase 4B1 · BCBA authorization lapse counting", () => {
  it("counts one lapse per client identity, not one per historical authorization row", () => {
    const rows: ContinuityAuthRow[] = [
      { client_name: "Client A", client_cr_id: "1", start_date: "2024-01-01", end_date: "2024-06-30" },
      { client_name: "Client A", client_cr_id: "1", start_date: "2024-07-01", end_date: "2024-12-31" },
      { client_name: "Client A", client_cr_id: "1", start_date: "2025-01-01", end_date: "2025-06-30" },
      { client_name: "Client A", client_cr_id: "1", start_date: "2025-07-01", end_date: "2026-01-31" },
    ];
    const out = computeAuthorizationContinuity(rows, TODAY);
    expect(out.rows).toHaveLength(4);
    expect(out.clientsWithoutCoverage).toHaveLength(1);
    expect(out.clientsWithoutCoverage[0].lastEnd).toBe("2026-01-31");
  });

  it("never turns future, unknown, inactive, or malformed rows into current coverage or a deadline", () => {
    const rows: ContinuityAuthRow[] = [
      { client_name: "Future", start_date: "2026-09-01", end_date: "2026-12-31" },
      { client_name: "Unknown", start_date: null, end_date: null },
      {
        client_name: "Inactive",
        start_date: "2026-01-01",
        end_date: "2026-12-31",
        is_active: false,
      },
      { client_name: "Malformed", start_date: "2026-02-31", end_date: "not-a-date" },
    ];
    const out = computeAuthorizationContinuity(rows, TODAY);
    expect(out.active).toBe(0);
    expect(out.expiringSoon).toBe(0);
    const current = out.rows.filter(
      (r) => r.continuity === "active" || r.continuity === "expiring",
    );
    expect(current).toHaveLength(0);
    expect(out.rows.find((r) => r.client === "Malformed")?.continuity).toBe("unknown_dates");
    expect(out.rows.find((r) => r.client === "Inactive")?.continuity).toBe("unknown_dates");
    // No deadline can be derived from any of these rows.
    expect(out.rows.every((r) => r.daysToExpiry == null || r.continuity === "not_started")).toBe(true);
  });
});

describe("Phase 4B1 · current snapshot is not narrowed by the lifecycle date range", () => {
  const snapshotRow = {
    client_name: "Client A",
    state: "GA",
    payor: "Medicaid",
    procedure_code: "97153",
    start_date: "2025-01-01",
    end_date: "2026-12-31",
  };
  const filters: PrimaryReportFilters = { ...EMPTY_FILTERS, from: RANGE.from, to: RANGE.to };

  it("keeps coverage that starts before the selected range when the range is dropped", () => {
    const snapshotFilters = { ...filters, from: "", to: "" };
    const kept = applyFilters([snapshotRow], snapshotFilters, (r) => ({
      state: r.state,
      client: r.client_name,
      payor: r.payor,
      code: r.procedure_code,
    }));
    expect(kept).toHaveLength(1);
  });

  it("still honours non-date filters on the snapshot", () => {
    const snapshotFilters = { ...filters, from: "", to: "", state: "NC" };
    const kept = applyFilters([snapshotRow], snapshotFilters, (r) => ({
      state: r.state,
      client: r.client_name,
      payor: r.payor,
      code: r.procedure_code,
    }));
    expect(kept).toHaveLength(0);
  });
});

describe("Phase 4B1 · action timelines", () => {
  it("treats a genuine same-day pair as 0 days and never as missing", () => {
    expect(timelineDays("2026-06-01", "2026-06-01")).toBe(0);
    const out = computeAuthorizationActionTimelines([
      action({ received_date: "2026-06-01", submitted_date: "2026-06-01" }),
    ]);
    expect(out.rows[0].receivedToSubmittedDays).toBe(0);
    expect(out.rows[0].receivedToSubmittedDisplay).toBe("0 day(s)");
    expect(out.documentedReceivedToSubmitted).toBe(1);
  });

  it("reports missing, malformed, and reversed pairs as Not documented", () => {
    const out = computeAuthorizationActionTimelines([
      action({ received_date: null, submitted_date: "2026-06-05" }),
      action({ received_date: "2026-02-31", submitted_date: "2026-06-05" }),
      action({ received_date: "2026-06-10", submitted_date: "2026-06-05" }),
    ]);
    expect(out.rows.map((r) => r.receivedToSubmittedDays)).toEqual([null, null, null]);
    expect(out.rows.map((r) => r.receivedToSubmittedDisplay)).toEqual([
      "Not documented",
      "Not documented",
      "Not documented",
    ]);
    expect(out.documentedReceivedToSubmitted).toBe(0);
    expect(out.avgReceivedToSubmittedDays).toBeNull();
  });
});

describe("Phase 4B1 · source-dated event counts", () => {
  it("range-filters each 97151/97153 date independently", () => {
    const actions = [
      // Submitted before the range, approved inside it.
      action({ service_code: "97151", submitted_date: "2026-05-20", approved_date: "2026-06-03" }),
      // Submitted inside the range, denied after it.
      action({ service_code: "97153", submitted_date: "2026-06-04", denied_date: "2026-07-02" }),
      // Impossible date contributes nothing.
      action({ service_code: "97151", submitted_date: "2026-06-31" }),
    ];
    const [ia, direct] = computeCodeEventCounts(actions, ["97151", "97153"], RANGE);
    expect(ia).toMatchObject({ submitted: 0, approved: 1, denied: 0 });
    expect(direct).toMatchObject({ submitted: 1, approved: 0, denied: 0 });
  });

  it("reports IA, IT, RA, and PR source events separately", () => {
    const rows = computeKindEventCounts(
      [
        action({ auth_type: "Initial Assessment", submitted_date: "2026-06-02" }),
        action({ auth_type: "Initial Treatment", approved_date: "2026-06-03" }),
        action({ auth_type: "Reauthorization", denied_date: "2026-06-04" }),
        action({ auth_type: "Progress Report", submitted_date: "2026-06-05" }),
      ],
      RANGE,
    );
    expect(rows.map((r) => [r.key, r.submitted, r.approved, r.denied])).toEqual([
      ["initial_assessment", 1, 0, 0],
      ["initial_treatment", 0, 1, 0],
      ["reauthorization", 0, 0, 1],
      ["progress_report", 1, 0, 0],
    ]);
  });
});

describe("Phase 4B1 · resolved vs. unresolved work", () => {
  it("keeps resolved records out of pending and overdue queues", () => {
    const queues = computeAuthorizationActionQueues(
      [
        action({
          received_date: "2026-06-01",
          submitted_date: "2026-06-02",
          approved_date: "2026-06-05",
          next_action_due_date: "2026-06-03",
        }),
      ],
      RANGE,
      TODAY,
    );
    expect(queues.resolvedRows).toHaveLength(1);
    expect(queues.pendingSubmissions).toHaveLength(0);
    expect(queues.pendingDecisions).toHaveLength(0);
    expect(queues.overdueActions).toHaveLength(0);
  });

  it("keeps a denied record with an open appeal unresolved and overdue-eligible", () => {
    const denied = action({
      status: "Completed - Denied",
      denied_date: "2026-06-01",
      next_action: "File appeal",
      appeal_due_date: "2026-06-10",
      submitted_date: "2026-05-20",
    });
    expect(isActionResolved(denied)).toBe(false);
    const queues = computeAuthorizationActionQueues([denied], RANGE, TODAY);
    expect(queues.overdueActions).toHaveLength(1);
    expect(queues.overdueActions[0].daysOverdue).toBe(5);
    expect(queues.denials).toHaveLength(1);
  });

  it("never derives an overdue day count from a missing or impossible due date", () => {
    const queues = computeAuthorizationActionQueues(
      [
        action({ received_date: "2026-06-01" }),
        action({ received_date: "2026-06-01", next_action_due_date: "2026-02-31" }),
      ],
      RANGE,
      TODAY,
    );
    expect(queues.overdueActions).toHaveLength(0);
    expect(queues.pendingSubmissions).toHaveLength(2);
    expect(queues.rows.every((r) => r.dueDate == null)).toBe(true);
  });
});

describe("Phase 4B1 · service activity with no current coverage", () => {
  it("resolves identity CR-ID first, dedupes to one client, and labels a confirmation candidate", () => {
    const rows = computeServiceActivityWithoutCoverage(
      [
        { client_name: "Client A", client_cr_id: "1", date_of_service: "2026-06-02", hours: 2 },
        // Same client, no id on the row — must not split.
        { client_name: "client a", client_cr_id: null, date_of_service: "2026-06-09", hours: 1.5 },
        // Voided rows never count.
        { client_name: "Client A", client_cr_id: "1", date_of_service: "2026-06-10", hours: 3, is_void: true },
        // A client with coverage is not a candidate.
        { client_name: "Client B", client_cr_id: "2", date_of_service: "2026-06-05", hours: 4 },
      ],
      [{ client: "Client A", clientCrId: "1", state: "GA", payor: "Medicaid", lastEnd: "2026-05-31" }],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      client: "Client A",
      clientCrId: "1",
      sessions: 2,
      hours: 3.5,
      lastEnd: "2026-05-31",
      needsConfirmation: true,
    });
    expect(rows[0].note).toMatch(/confirm/i);
    expect(rows[0].note).not.toMatch(/confirmed pause|violation/i);
  });
});

describe("Phase 4B1 · BCBA status banding", () => {
  const base: BcbaPerformanceInput = {
    bcba: "BCBA One",
    states: ["GA"],
    clients: 5,
    rbts: 2,
    currentHours: 0,
    priorHours: 0,
    targetHours: null,
    elapsedProportion: 1,
    directHours: 0,
    supervisionHours: 0,
    ptClientsWithTarget: 0,
    ptClientsAtPace: 0,
    readinessMeasurable: false,
    nearestDeadlineDays: null,
    authLapses: 0,
    overdueProgressReports: 0,
    confirmedPauses: 0,
    documentedBillingRows: 0,
    lateBillingRows: 0,
    missingCreationRows: 0,
  };

  it("stays Insufficient Data below three measurable dimensions", () => {
    const out = computeBcbaPerformanceAnalysis([base]);
    expect(out.rows[0].measurableCount).toBeLessThan(3);
    expect(out.rows[0].status).toBe("insufficient_data");
  });

  it("sets the overall status from the worst applicable dimension", () => {
    const out = computeBcbaPerformanceAnalysis([
      {
        ...base,
        currentHours: 10,
        targetHours: 100,
        directHours: 100,
        supervisionHours: 10,
        documentedBillingRows: 10,
        lateBillingRows: 0,
      },
    ]);
    const row = out.rows[0];
    expect(row.measurableCount).toBeGreaterThanOrEqual(3);
    expect(row.status).toBe("at_risk");
    expect(row.drivers.join(" ")).toMatch(/Productivity/);
    expect(worstStatus(["strong", "on_track", "at_risk"])).toBe("at_risk");
  });
});
