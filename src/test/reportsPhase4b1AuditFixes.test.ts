/**
 * Phase 4B1 audit-fix regressions.
 *
 * These cover the *integrated* semantics the pages actually rely on: no single
 * fallback date pre-filter, range-scoped turnaround denominators, an open
 * backlog that a date window cannot hide, the shared progress-report engine on
 * the BCBA page, every applicable dimension reason, and missing service hours
 * that never become a factual zero. Synthetic data only; no PHI.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  computeAuthorizationActionTimelines,
  computeProgressReportOps,
  type AuthorizationActionRow,
} from "@/lib/os/reports/crPrimary/metrics/authorizationActions";
import {
  computeAuthorizationActionQueues,
  computeCodeEventCounts,
  computeServiceActivityWithoutCoverage,
} from "@/lib/os/reports/crPrimary/metrics/authorizationCommandCenter";
import { applyFilters } from "@/lib/os/reports/crPrimary/filters";
import { EMPTY_FILTERS } from "@/lib/os/reports/crPrimary/types";
import { buildDimensions } from "@/lib/os/reports/crPrimary/metrics/bcbaPerformanceV2";

const TODAY = "2026-06-15";
const RANGE = { from: "2026-06-01", to: "2026-06-30" };

const action = (over: Partial<AuthorizationActionRow>): AuthorizationActionRow => ({
  record_id: Math.random().toString(36).slice(2),
  ...over,
});

/** The page's non-date filter projection for authorization workflow records. */
const applyNonDateFilters = (rows: AuthorizationActionRow[]) =>
  applyFilters(
    rows,
    { ...EMPTY_FILTERS, from: RANGE.from, to: RANGE.to, from: "", to: "" },
    (r) => ({
      state: r.state,
      client: r.client_name,
      payor: r.payor,
      code: r.service_code,
      status: r.status,
    }),
  );

describe("Phase 4B1 audit · no single fallback-date prefilter", () => {
  const rows = [
    // Submitted before the range, approved inside it.
    action({
      service_code: "97151",
      client_name: "Client A",
      submitted_date: "2026-05-20",
      approved_date: "2026-06-03",
    }),
    // Submitted inside the range, denied after it.
    action({
      service_code: "97153",
      client_name: "Client B",
      submitted_date: "2026-06-04",
      denied_date: "2026-07-02",
    }),
  ];

  it("counts an approval inside the range even though the submission was earlier", () => {
    const scoped = applyNonDateFilters(rows);
    expect(scoped).toHaveLength(2);
    const [ia] = computeCodeEventCounts(scoped, ["97151"], RANGE);
    expect(ia).toMatchObject({ submitted: 0, approved: 1, denied: 0 });
  });

  it("counts the submission only when the denial lands after the range", () => {
    const [direct] = computeCodeEventCounts(applyNonDateFilters(rows), ["97153"], RANGE);
    expect(direct).toMatchObject({ submitted: 1, approved: 0, denied: 0 });
  });

  it("would have lost the in-range approval under a single fallback-date prefilter", () => {
    const prefiltered = applyFilters(
      rows,
      { ...EMPTY_FILTERS, from: RANGE.from, to: RANGE.to },
      (r) => ({ date: r.submitted_date ?? r.received_date ?? r.next_action_due_date }),
    );
    expect(prefiltered).toHaveLength(1);
    const [ia] = computeCodeEventCounts(prefiltered, ["97151"], RANGE);
    expect(ia.approved).toBe(0);
  });

  it("keeps the page free of a fallback-date prefilter on workflow records", () => {
    const src = readFileSync("src/pages/os/reports/AuthorizationAnalysisPage.tsx", "utf8");
    expect(src).not.toMatch(/r\.submitted_date \?\? r\.received_date/);
    expect(src).toMatch(/applyFilters\(data\.authActions, nonDateFilters/);
  });
});

describe("Phase 4B1 audit · range-scoped turnaround denominators", () => {
  it("excludes a valid receipt pair whose submission is outside the range, and counts the in-range decision", () => {
    const out = computeAuthorizationActionTimelines(
      [
        action({
          received_date: "2026-05-10",
          submitted_date: "2026-05-20",
          approved_date: "2026-06-03",
        }),
      ],
      RANGE,
    );
    const row = out.rows[0];
    // Both pairs are documented...
    expect(row.receivedToSubmittedDays).toBe(10);
    expect(row.submittedToDecisionDays).toBe(14);
    // ...but only the decision landed inside the selected range.
    expect(row.countsForReceivedToSubmitted).toBe(false);
    expect(row.countsForSubmittedToDecision).toBe(true);
    expect(out.documentedReceivedToSubmitted).toBe(0);
    expect(out.avgReceivedToSubmittedDays).toBeNull();
    expect(out.outOfRangeReceivedToSubmitted).toBe(1);
    expect(out.documentedSubmittedToDecision).toBe(1);
    expect(out.avgSubmittedToDecisionDays).toBe(14);
  });

  it("preserves same-day 0 inside the range and never coerces missing or reversed pairs to zero", () => {
    const out = computeAuthorizationActionTimelines(
      [
        action({ received_date: "2026-06-05", submitted_date: "2026-06-05" }),
        action({ received_date: null, submitted_date: "2026-06-06" }),
        action({ received_date: "2026-06-10", submitted_date: "2026-06-05" }),
        action({ received_date: "2026-02-31", submitted_date: "2026-06-05" }),
      ],
      RANGE,
    );
    expect(out.rows[0].receivedToSubmittedDays).toBe(0);
    expect(out.documentedReceivedToSubmitted).toBe(1);
    expect(out.avgReceivedToSubmittedDays).toBe(0);
    expect(out.notDocumentedReceivedToSubmitted).toBe(3);
    expect(out.rows.slice(1).map((r) => r.receivedToSubmittedDisplay)).toEqual([
      "Not documented",
      "Not documented",
      "Not documented",
    ]);
  });

  it("keeps unscoped callers unchanged", () => {
    const out = computeAuthorizationActionTimelines([
      action({ received_date: "2020-01-01", submitted_date: "2020-01-03" }),
    ]);
    expect(out.documentedReceivedToSubmitted).toBe(1);
    expect(out.avgReceivedToSubmittedDays).toBe(2);
    expect(out.outOfRangeReceivedToSubmitted).toBe(0);
  });
});

describe("Phase 4B1 audit · open backlog is not hidden by the date range", () => {
  it("keeps open work whose every recorded date sits outside the selected range", () => {
    const rows = [
      action({ client_name: "Client A", received_date: "2025-11-02" }),
      action({ client_name: "Client B", submitted_date: "2025-11-09" }),
      action({
        client_name: "Client C",
        received_date: "2025-10-01",
        next_action_due_date: "2025-10-15",
      }),
    ];
    const queues = computeAuthorizationActionQueues(applyNonDateFilters(rows), RANGE, TODAY);
    expect(queues.pendingSubmissions).toHaveLength(2);
    expect(queues.pendingDecisions).toHaveLength(1);
    expect(queues.overdueActions).toHaveLength(1);
    // The dated aggregates stay range-scoped even though the backlog does not.
    expect(queues.decisionsInRange).toBe(0);
    expect(queues.denialRatePct).toBeNull();
  });

  it("still refuses to call a record overdue without a real recorded due date", () => {
    const queues = computeAuthorizationActionQueues(
      [action({ received_date: "2025-10-01", next_action_due_date: "2026-02-31" })],
      RANGE,
      TODAY,
    );
    expect(queues.pendingSubmissions).toHaveLength(1);
    expect(queues.overdueActions).toHaveLength(0);
  });
});

describe("Phase 4B1 audit · BCBA page uses the shared progress-report engine", () => {
  const src = readFileSync("src/pages/os/reports/BcbaPerformancePage.tsx", "utf8");

  it("consumes computeProgressReportOps and its shared dueRows", () => {
    expect(src).toMatch(/computeProgressReportOps/);
    expect(src).toMatch(/prOps\.dueRows/);
  });

  it("no longer carries a local progress-report classifier or due-date parser", () => {
    expect(src).not.toMatch(/isProgressReportAction/);
    expect(src).not.toMatch(/validDay\(action\.next_action_due_date\)/);
    expect(src).not.toMatch(/validDay\(action\.appeal_due_date\)/);
  });

  it("exposes the client id and an ownership fallback date on shared due rows", () => {
    const ops = computeProgressReportOps(
      [],
      [
        action({
          auth_type: "Progress Report",
          client_name: "Client A",
          client_cr_id: "77",
          submitted_date: "2026-06-02",
          next_action_due_date: "2026-06-20",
          next_action: "Submit progress report",
        }),
      ],
      new Date(`${TODAY}T00:00:00`),
    );
    expect(ops.dueRows[0]).toMatchObject({
      clientCrId: "77",
      dueDate: "2026-06-20",
      recordedDate: "2026-06-02",
      overdue: false,
      resolved: false,
    });
    expect(ops.dueRows[0].daysUntilDue).toBe(5);
  });

  it("never turns resolved, missing, impossible or reversed progress reports into overdue work or a deadline", () => {
    const ops = computeProgressReportOps(
      [],
      [
        // Resolved: an approval closes it out, however old the due date is.
        action({
          auth_type: "Progress Report",
          client_name: "Resolved",
          next_action_due_date: "2026-01-01",
          approved_date: "2026-01-05",
        }),
        // No authoritative due date at all.
        action({ auth_type: "Progress Report", client_name: "No due date" }),
        // Impossible calendar date.
        action({
          auth_type: "Progress Report",
          client_name: "Impossible",
          next_action_due_date: "2026-02-31",
        }),
        // Malformed date.
        action({
          auth_type: "Progress Report",
          client_name: "Malformed",
          next_action_due_date: "soon",
        }),
      ],
      new Date(`${TODAY}T00:00:00`),
    );
    expect(ops.overdueCount).toBe(0);
    expect(ops.withoutDueSource).toBe(3);
    expect(ops.resolvedCount).toBe(1);
    // The page's rule: only an unresolved row with a real due date is a deadline.
    const deadlines = ops.dueRows.filter(
      (r) => !r.resolved && r.dueDate != null && r.daysUntilDue != null,
    );
    expect(deadlines).toHaveLength(0);
  });
});

describe("Phase 4B1 audit · every applicable BCBA dimension reason is projected", () => {
  const input = {
    bcba: "BCBA One",
    states: ["GA"],
    clients: 5,
    rbts: 2,
    currentHours: 10,
    priorHours: 0,
    targetHours: 100,
    elapsedProportion: 1,
    directHours: 100,
    supervisionHours: 10,
    ptClientsWithTarget: 0,
    ptClientsAtPace: 0,
    readinessMeasurable: false,
    nearestDeadlineDays: null,
    authLapses: 0,
    overdueProgressReports: 0,
    confirmedPauses: 0,
    documentedBillingRows: 10,
    lateBillingRows: 0,
    missingCreationRows: 0,
  };

  it("has measurable dimensions whose statuses differ from the overall worst status", () => {
    const dimensions = buildDimensions(input);
    const measurable = dimensions.filter((d) => d.measurable);
    expect(measurable.length).toBeGreaterThanOrEqual(3);
    const statuses = new Set(measurable.map((d) => d.status));
    // If the page filtered reasons to the worst status only, these would be hidden.
    expect(statuses.size).toBeGreaterThan(1);
    expect(measurable.every((d) => d.reason.trim().length > 0)).toBe(true);
  });

  it("projects reasons from measurability, not from equality with the overall status", () => {
    const src = readFileSync("src/pages/os/reports/BcbaPerformancePage.tsx", "utf8");
    expect(src).not.toMatch(/filter\(\(d\) => d\.status === r\.status\)/);
    expect(src).toMatch(/const statusReasons[\s\S]{0,400}d\.measurable/);
  });
});

describe("Phase 4B1 audit · missing service hours are never a factual zero", () => {
  const gaps = [
    { client: "Client A", clientCrId: "1", state: "GA", payor: "Medicaid", lastEnd: "2026-05-31" },
  ];

  it("counts the session, records missing hours, and excludes them from the hour sum", () => {
    const rows = computeServiceActivityWithoutCoverage(
      [
        { client_name: "Client A", client_cr_id: "1", date_of_service: "2026-06-02", hours: 2 },
        { client_name: "Client A", client_cr_id: "1", date_of_service: "2026-06-03", hours: null },
        { client_name: "Client A", client_cr_id: "1", date_of_service: "2026-06-04", hours: undefined },
        { client_name: "Client A", client_cr_id: "1", date_of_service: "2026-06-05", hours: "" as never },
        { client_name: "Client A", client_cr_id: "1", date_of_service: "2026-06-06", hours: true as never },
        { client_name: "Client A", client_cr_id: "1", date_of_service: "2026-06-07", hours: NaN },
      ],
      gaps,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].sessions).toBe(6);
    expect(rows[0].hours).toBe(2);
    expect(rows[0].missingHours).toBe(5);
    expect(rows[0].dataQualityNote).toMatch(/5 of 6 session\(s\) have no recorded hours/);
    expect(rows[0].needsConfirmation).toBe(true);
  });

  it("keeps a real recorded zero as a documented zero", () => {
    const rows = computeServiceActivityWithoutCoverage(
      [
        { client_name: "Client A", client_cr_id: "1", date_of_service: "2026-06-02", hours: 0 },
        { client_name: "Client A", client_cr_id: "1", date_of_service: "2026-06-03", hours: 0 },
      ],
      gaps,
    );
    expect(rows[0].sessions).toBe(2);
    expect(rows[0].hours).toBe(0);
    expect(rows[0].missingHours).toBe(0);
    expect(rows[0].dataQualityNote).toBeNull();
  });
});
