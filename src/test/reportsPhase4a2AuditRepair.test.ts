import { describe, it, expect } from "vitest";

import { strictDay, strictDaysBetween } from "@/lib/os/reports/crPrimary/metrics/calendarDate";
import {
  computeAuthorizationContinuity,
  classifyContinuityRow,
  hasCurrentCoverage,
  endDateOf,
  type ContinuityAuthRow,
} from "@/lib/os/reports/crPrimary/metrics/authorizationContinuity";
import {
  isActionResolved,
  validDay,
  timelineDays,
  computeProgressReportOps,
  type AuthorizationActionRow,
} from "@/lib/os/reports/crPrimary/metrics/authorizationActions";

const TODAY = "2026-08-25";

const auth = (r: Partial<ContinuityAuthRow>): ContinuityAuthRow => ({
  client_name: "Client A",
  ...r,
});

const action = (r: Partial<AuthorizationActionRow>): AuthorizationActionRow => ({
  record_id: r.record_id ?? "rec-1",
  status: "Progress report",
  ...r,
});

describe("Phase 4A2 audit repair — strict calendar-date validation", () => {
  it("rejects impossible calendar dates that JavaScript would roll over", () => {
    expect(strictDay("2026-02-31")).toBeNull();
    expect(strictDay("2026-04-31")).toBeNull();
    expect(strictDay("2026-13-01")).toBeNull();
    expect(strictDay("2026-00-10")).toBeNull();
    expect(strictDay("2026-01-00")).toBeNull();
    expect(strictDay("2026-01-32")).toBeNull();
  });

  it("honours leap years exactly", () => {
    expect(strictDay("2024-02-29")).toBe("2024-02-29");
    expect(strictDay("2026-02-29")).toBeNull();
    expect(strictDay("2100-02-29")).toBeNull();
    expect(strictDay("2000-02-29")).toBe("2000-02-29");
  });

  it("accepts a timestamp only when its leading day is real", () => {
    expect(strictDay("2026-03-02T10:15:00Z")).toBe("2026-03-02");
    expect(strictDay("2026-02-31T10:15:00Z")).toBeNull();
  });

  it("rejects malformed and empty values", () => {
    for (const v of ["", "   ", "not a date", "3/2/2026", "20260302", null, undefined, true]) {
      expect(strictDay(v)).toBeNull();
    }
  });

  it("never produces day counts from impossible dates", () => {
    expect(strictDaysBetween("2026-02-28", "2026-03-01")).toBe(1);
    expect(strictDaysBetween("2026-02-31", "2026-03-01")).toBeNull();
    expect(strictDaysBetween("2026-03-01", "2026-03-01")).toBe(0);
    expect(timelineDays("2026-02-31", "2026-03-05")).toBeNull();
    expect(validDay("2026-02-31")).toBeNull();
  });

  it("an impossible date creates neither coverage nor a usable end date", () => {
    const row = auth({ start_date: "2026-02-31", end_date: "2026-02-31" });
    expect(hasCurrentCoverage(row, TODAY)).toBe(false);
    expect(endDateOf(row)).toBeNull();
    expect(classifyContinuityRow(row, TODAY).continuity).toBe("unknown_dates");
  });
});

describe("Phase 4A2 audit repair — row-level continuity matches client truth", () => {
  const agrees = (rows: ContinuityAuthRow[]) => {
    const m = computeAuthorizationContinuity(rows, TODAY);
    const covered = rows.filter((r) => hasCurrentCoverage(r, TODAY)).length;
    return { metrics: m, covered };
  };

  it("active + expired rows for one client agree with current coverage", () => {
    const rows = [
      auth({ client_cr_id: "1", start_date: "2026-08-01", end_date: "2026-12-31" }),
      auth({ client_cr_id: "1", start_date: "2025-01-01", end_date: "2025-06-30" }),
    ];
    const { metrics, covered } = agrees(rows);
    expect(covered).toBe(1);
    expect(metrics.active).toBe(1);
    expect(metrics.expired).toBe(1);
    expect(metrics.clientsWithoutCoverage).toHaveLength(0);
  });

  it("an inactive row overlapping today is never active or expiring", () => {
    const rows = [
      auth({
        client_cr_id: "2",
        is_active: false,
        start_date: "2026-08-01",
        end_date: "2026-09-10",
      }),
    ];
    const { metrics, covered } = agrees(rows);
    expect(covered).toBe(0);
    expect(metrics.active).toBe(0);
    expect(metrics.expiringSoon).toBe(0);
    expect(metrics.unknownDates).toBe(1);
    expect(metrics.rows[0].note).toMatch(/inactive/i);
  });

  it("a future follow-up end never becomes the current expiry", () => {
    const row = auth({
      client_cr_id: "3",
      start_date: "2026-08-01",
      end_date: "2026-08-20",
      followup_start_date: "2026-10-01",
      followup_end_date: "2026-12-31",
    });
    const { metrics, covered } = agrees([row]);
    expect(covered).toBe(0);
    expect(metrics.active).toBe(0);
    // The displayed end must be the pair that produced the state.
    expect(metrics.rows[0].continuity).toBe("expired");
    expect(metrics.rows[0].endDate).toBe("2026-08-20");
  });

  it("a real current pair drives expiring with its own end date", () => {
    const row = auth({
      client_cr_id: "4",
      start_date: "2026-08-01",
      end_date: "2026-09-05",
      followup_start_date: "2026-09-06",
      followup_end_date: "2027-03-01",
    });
    const { metrics } = agrees([row]);
    expect(metrics.rows[0].continuity).toBe("expiring");
    expect(metrics.rows[0].endDate).toBe("2026-09-05");
    expect(metrics.rows[0].daysToExpiry).toBe(11);
    expect(metrics.expiringSoon).toBe(1);
    expect(metrics.active).toBe(1);
  });

  it("impossible and unknown pairs land in unknown dates, never active", () => {
    const rows = [
      auth({ client_cr_id: "5", start_date: "2026-02-31", end_date: "2026-02-31" }),
      auth({ client_cr_id: "6" }),
    ];
    const { metrics, covered } = agrees(rows);
    expect(covered).toBe(0);
    expect(metrics.active).toBe(0);
    expect(metrics.unknownDates).toBe(2);
    expect(metrics.clientsWithoutCoverage).toHaveLength(0);
  });

  it("future-only rows are not started and never a coverage gap", () => {
    const rows = [auth({ client_cr_id: "7", start_date: "2026-10-01", end_date: "2026-12-31" })];
    const { metrics } = agrees(rows);
    expect(metrics.rows[0].continuity).toBe("not_started");
    expect(metrics.active).toBe(0);
    expect(metrics.clientsWithoutCoverage).toHaveLength(0);
  });
});

describe("Phase 4A2 audit repair — denied with live appeal is not resolved", () => {
  it("'Completed - Denied' with an appeal next action stays live work", () => {
    expect(
      isActionResolved(
        action({ status: "Completed - Denied", next_action: "File appeal with payor" }),
      ),
    ).toBe(false);
  });

  it("a denied_date with an appeal due date stays live work", () => {
    expect(
      isActionResolved(
        action({
          workflow_stage: "Closed",
          denied_date: "2026-07-01",
          appeal_due_date: "2026-09-01",
        }),
      ),
    ).toBe(false);
  });

  it("denied with no meaningful next action is resolved when the status says closed", () => {
    for (const next of ["", "  ", "N/A", "None", "No action", "Not documented"]) {
      expect(
        isActionResolved(
          action({ status: "Closed - Denied", denied_date: "2026-07-01", next_action: next }),
        ),
      ).toBe(true);
    }
  });

  it("an approved_date remains definitive even with incidental next-action text", () => {
    expect(
      isActionResolved(
        action({
          status: "Approved",
          approved_date: "2026-07-15",
          next_action: "Send approval letter to family",
        }),
      ),
    ).toBe(true);
  });

  it("a denied row with a live appeal still shows up as overdue work", () => {
    const ops = computeProgressReportOps(
      [],
      [
        action({
          record_id: "pr-1",
          status: "Completed - Denied",
          next_action: "Progress report appeal",
          next_action_due_date: "2026-07-01",
          denied_date: "2026-06-20",
        }),
      ],
      new Date("2026-08-25T12:00:00Z"),
    );
    expect(ops.dueRows).toHaveLength(1);
    expect(ops.dueRows[0].resolved).toBe(false);
    expect(ops.dueRows[0].overdue).toBe(true);
    expect(ops.overdueCount).toBe(1);
  });

  it("an impossible due date is no authoritative due date, never zero days", () => {
    const ops = computeProgressReportOps(
      [],
      [
        action({
          record_id: "pr-2",
          status: "Progress report submitted",
          next_action_due_date: "2026-02-31",
        }),
      ],
      new Date("2026-08-25T12:00:00Z"),
    );
    expect(ops.dueRows[0].dueDate).toBeNull();
    expect(ops.dueRows[0].daysUntilDue).toBeNull();
    expect(ops.dueRows[0].overdue).toBe(false);
    expect(ops.dueRows[0].dueSource).toBe("none");
  });
});
