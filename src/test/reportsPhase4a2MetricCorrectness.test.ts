import { describe, it, expect } from "vitest";

import { finiteNumberOrNull } from "@/lib/os/reports/crPrimary/metrics/numeric";
import { buildClientIdentityResolver } from "@/lib/os/reports/crPrimary/metrics/clientIdentity";
import {
  actualHoursOf,
  forecastHoursOf,
  targetHoursOf,
} from "@/lib/os/reports/crPrimary/metrics/bcbaPerformanceV2";
import {
  computeAuthorizationContinuity,
  type ContinuityAuthRow,
} from "@/lib/os/reports/crPrimary/metrics/authorizationContinuity";
import {
  computeAuthorizationActionTimelines,
  computeProgressReportOps,
  isActionResolved,
  timelineDays,
  type AuthorizationActionRow,
} from "@/lib/os/reports/crPrimary/metrics/authorizationActions";
import { computeParentTrainingAnalysis } from "@/lib/os/reports/crPrimary/metrics/parentTrainingV2";

const TODAY = "2026-08-25";

describe("Phase 4A2 — strict numeric parsing", () => {
  it("never turns missing values into a factual zero", () => {
    for (const v of [null, undefined, "", "   ", true, false, NaN, Infinity, -Infinity, "abc"]) {
      expect(finiteNumberOrNull(v)).toBeNull();
    }
  });

  it("preserves a real zero and trimmed numeric strings", () => {
    expect(finiteNumberOrNull(0)).toBe(0);
    expect(finiteNumberOrNull("0")).toBe(0);
    expect(finiteNumberOrNull(" 12.5 ")).toBe(12.5);
    expect(finiteNumberOrNull(-3)).toBe(-3);
  });

  it("BCBA target/actual/forecast reads stay missing instead of zero", () => {
    expect(targetHoursOf({ mtd_target_hours: null, target_hours: null })).toBeNull();
    expect(actualHoursOf({ mtd_actual_hours: undefined })).toBeNull();
    expect(forecastHoursOf({ forecast_hours: null })).toBeNull();
    expect(targetHoursOf({ mtd_target_hours: 0 })).toBe(0);
    expect(actualHoursOf({ mtd_actual_hours: 18.25 })).toBe(18.25);
  });

  it("continuity hours stay missing when the snapshot has no number", () => {
    const rows: ContinuityAuthRow[] = [
      {
        client_name: "Client A",
        authorized_hours: null,
        worked_hours: undefined,
        remaining_hours: null,
        start_date: "2026-08-01",
        end_date: "2026-12-31",
      },
    ];
    const out = computeAuthorizationContinuity(rows, TODAY);
    expect(out.rows[0].authorizedHours).toBeNull();
    expect(out.rows[0].usedHours).toBeNull();
    expect(out.rows[0].remainingHours).toBeNull();
    const zeroed = computeAuthorizationContinuity(
      [{ client_name: "B", authorized_hours: 0, worked_hours: 0, start_date: "2026-08-01", end_date: "2026-12-31" }],
      TODAY,
    );
    expect(zeroed.rows[0].authorizedHours).toBe(0);
    expect(zeroed.rows[0].remainingHours).toBe(0);
  });
});

describe("Phase 4A2 — order-independent client identity", () => {
  const inputs = [
    { client: "Jane Doe", clientCrId: "  " },
    { client: "jane   doe", clientCrId: "111" },
  ];

  it("adopts a unique alias regardless of input order", () => {
    const forward = buildClientIdentityResolver(inputs);
    const reverse = buildClientIdentityResolver([...inputs].reverse());
    expect(forward.keyFor(null, "Jane Doe")).toBe("cr:111");
    expect(reverse.keyFor(null, "JANE DOE")).toBe("cr:111");
    expect(forward.keyFor("111", "Jane Doe")).toBe("cr:111");
  });

  it("keeps id-less rows separate when a name maps to several CR ids", () => {
    const r = buildClientIdentityResolver([
      { client: "Sam Twin", clientCrId: "1" },
      { client: "Sam Twin", clientCrId: "2" },
      { client: "Sam Twin" },
    ]);
    expect(r.isAmbiguousName("sam twin")).toBe(true);
    expect(r.keyFor(null, "Sam Twin")).toBe("nm:sam twin#ambiguous");
    expect(r.keyFor("1", "Sam Twin")).toBe("cr:1");
    expect(r.keyFor("2", "Sam Twin")).toBe("cr:2");
    expect(r.idsForName("Sam Twin")).toEqual(["1", "2"]);
  });

  it("falls back to a normalized name key with zero ids", () => {
    const r = buildClientIdentityResolver([{ client: "No Id" }]);
    expect(r.keyFor(null, "  No   Id ")).toBe("nm:no id");
  });

  it("Parent Training grouping is identical under any input ordering", () => {
    const billed = [
      {
        date: "2026-08-03",
        procedureCode: "97156",
        hours: 2,
        clientName: "Jane Doe",
        clientCrId: null,
      },
      {
        date: "2026-08-10",
        procedureCode: "97156",
        hours: 1,
        clientName: "Jane Doe",
        clientCrId: "111",
      },
    ];
    const run = (rows: typeof billed) =>
      computeParentTrainingAnalysis({
        billed: rows,
        scheduled: [],
        authorizations: [],
        activeClients: [{ client: "Jane Doe", clientCrId: "111" }],
        resolveOwner: () => "BCBA One",
        window: { from: "2026-08-01", to: "2026-08-31" },
        today: TODAY,
      });
    const a = run(billed);
    const b = run([...billed].reverse());
    expect(a.clientRows).toHaveLength(1);
    expect(a.clientRows[0].clientKey).toBe("cr:111");
    expect(a.clients).toBe(b.clients);
    expect(a.completedHours).toBe(b.completedHours);
    expect(b.clientRows.map((r) => r.clientKey)).toEqual(a.clientRows.map((r) => r.clientKey));
  });
});

describe("Phase 4A2 — current continuity / gap truth", () => {
  const gapKeys = (rows: ContinuityAuthRow[]) =>
    computeAuthorizationContinuity(rows, TODAY).clientsWithoutCoverage.map((c) => c.clientKey);

  it("an expired row is not a gap when another authorization is current", () => {
    expect(
      gapKeys([
        { client_name: "A", client_cr_id: "1", start_date: "2026-01-01", end_date: "2026-03-01" },
        { client_name: "A", client_cr_id: "1", start_date: "2026-08-01", end_date: "2026-12-31" },
      ]),
    ).toEqual([]);
  });

  it("two historical rows produce exactly one gap candidate with the CR id", () => {
    const out = computeAuthorizationContinuity(
      [
        { client_name: "A", client_cr_id: "1", start_date: "2026-01-01", end_date: "2026-02-01" },
        { client_name: "A", client_cr_id: "1", start_date: "2026-02-02", end_date: "2026-03-01" },
      ],
      TODAY,
    );
    expect(out.clientsWithoutCoverage).toHaveLength(1);
    expect(out.clientsWithoutCoverage[0].clientCrId).toBe("1");
    expect(out.clientsWithoutCoverage[0].lastEnd).toBe("2026-03-01");
    expect(out.expired).toBe(2);
  });

  it("future-only, unknown-date and end-today clients are never gap candidates", () => {
    expect(
      gapKeys([
        { client_name: "Future", start_date: "2026-10-01", end_date: "2026-12-31" },
        { client_name: "Unknown", start_date: null, end_date: null },
        { client_name: "EndsToday", start_date: "2026-01-01", end_date: TODAY },
      ]),
    ).toEqual([]);
  });

  it("is_active=false cannot create current coverage", () => {
    // An inactive row overlapping today does not count as coverage, so the
    // client's only past end date makes it a gap candidate.
    expect(
      gapKeys([
        {
          client_name: "A",
          client_cr_id: "9",
          is_active: false,
          start_date: "2026-08-01",
          end_date: "2026-08-20",
        },
      ]),
    ).toEqual(["cr:9"]);
    // Conservative: an inactive row whose latest end is still in the future is
    // not a confirmed gap either.
    expect(
      gapKeys([
        {
          client_name: "B",
          client_cr_id: "10",
          is_active: false,
          start_date: "2026-08-01",
          end_date: "2026-09-30",
        },
      ]),
    ).toEqual([]);
  });

  it("a follow-up future end never combines with an unrelated current start", () => {
    expect(
      gapKeys([
        {
          client_name: "A",
          client_cr_id: "5",
          start_date: "2026-01-01",
          end_date: "2026-02-01",
          followup_start_date: "2026-11-01",
          followup_end_date: null,
        },
      ]),
    ).toEqual(["cr:5"]);
  });

  it("an id-less row adopts a unique alias and never duplicates the gap", () => {
    const out = computeAuthorizationContinuity(
      [
        { client_name: "Jane Doe", start_date: "2026-01-01", end_date: "2026-02-01" },
        { client_name: "jane doe", client_cr_id: "77", start_date: "2026-02-02", end_date: "2026-03-01" },
      ],
      TODAY,
    );
    expect(out.clientsWithoutCoverage.map((c) => c.clientKey)).toEqual(["cr:77"]);
  });

  it("ambiguous same-name clients are kept apart", () => {
    const keys = gapKeys([
      { client_name: "Twin", client_cr_id: "1", start_date: "2026-01-01", end_date: "2026-02-01" },
      { client_name: "Twin", client_cr_id: "2", start_date: "2026-01-01", end_date: "2026-02-01" },
      { client_name: "Twin", start_date: "2026-01-01", end_date: "2026-02-01" },
    ]);
    expect(new Set(keys)).toEqual(new Set(["cr:1", "cr:2", "nm:twin#ambiguous"]));
  });

  it("gap output holds at most one row per identity regardless of order", () => {
    const rows: ContinuityAuthRow[] = [
      { client_name: "A", client_cr_id: "1", start_date: "2026-01-01", end_date: "2026-02-01" },
      { client_name: "A", start_date: "2026-01-05", end_date: "2026-02-05" },
    ];
    expect(gapKeys(rows)).toEqual(["cr:1"]);
    expect(gapKeys([...rows].reverse())).toEqual(["cr:1"]);
  });
});

const prAction = (over: Partial<AuthorizationActionRow>): AuthorizationActionRow => ({
  record_id: "r1",
  client_name: "Client",
  auth_type: "Progress Report",
  next_action_due_date: "2026-01-01",
  ...over,
});

describe("Phase 4A2 — resolved actions are not overdue", () => {
  const today = new Date("2026-08-25T00:00:00");

  it("recognises resolved statuses and a real approved date", () => {
    expect(isActionResolved(prAction({ status: "Approved" }))).toBe(true);
    expect(isActionResolved(prAction({ workflow_stage: "Closed" }))).toBe(true);
    expect(isActionResolved(prAction({ status: "Withdrawn" }))).toBe(true);
    expect(isActionResolved(prAction({ status: "Cancelled" }))).toBe(true);
    expect(isActionResolved(prAction({ approved_date: "2026-05-01" }))).toBe(true);
    expect(isActionResolved(prAction({ status: "Submitted" }))).toBe(false);
    expect(isActionResolved(prAction({ status: "Pending" }))).toBe(false);
    expect(isActionResolved(prAction({ status: "Denied", next_action: "Appeal" }))).toBe(false);
  });

  it("excludes resolved rows from the overdue queue but keeps them visible", () => {
    const ops = computeProgressReportOps(
      [],
      [
        prAction({ record_id: "resolved", status: "Approved" }),
        prAction({ record_id: "open", status: "Pending" }),
      ],
      today,
    );
    expect(ops.dueRows).toHaveLength(2);
    expect(ops.overdueCount).toBe(1);
    expect(ops.resolvedCount).toBe(1);
    const resolved = ops.dueRows.find((r) => r.key.startsWith("resolved"))!;
    expect(resolved.resolved).toBe(true);
    expect(resolved.overdue).toBe(false);
    expect(resolved.resolvedNote).toMatch(/Resolved/);
  });

  it("an invalid due date is no authoritative due date, never zero days", () => {
    const ops = computeProgressReportOps(
      [],
      [prAction({ record_id: "bad", next_action_due_date: "not a date", appeal_due_date: "" })],
      today,
    );
    expect(ops.dueRows[0].dueDate).toBeNull();
    expect(ops.dueRows[0].daysUntilDue).toBeNull();
    expect(ops.dueRows[0].dueSource).toBe("none");
    expect(ops.dueRows[0].overdue).toBe(false);
    expect(ops.withoutDueSource).toBe(1);
  });
});

describe("Phase 4A2 — authoritative action timelines", () => {
  it("computes documented pairs and reports the rest as Not documented", () => {
    const out = computeAuthorizationActionTimelines([
      {
        record_id: "approved",
        received_date: "2026-08-01",
        submitted_date: "2026-08-04",
        approved_date: "2026-08-10",
      },
      {
        record_id: "denied",
        received_date: "2026-08-01",
        submitted_date: "2026-08-02",
        denied_date: "2026-08-06",
      },
      { record_id: "missing" },
      { record_id: "invalid", received_date: "13/13/2026", submitted_date: "nope" },
      { record_id: "reversed", received_date: "2026-08-10", submitted_date: "2026-08-01" },
      {
        record_id: "sameday",
        received_date: "2026-08-05",
        submitted_date: "2026-08-05",
        approved_date: "2026-08-05",
      },
    ]);

    const byKey = (id: string) => out.rows.find((r) => r.key.startsWith(id))!;
    expect(byKey("approved").receivedToSubmittedDays).toBe(3);
    expect(byKey("approved").submittedToDecisionDays).toBe(6);
    expect(byKey("approved").decisionType).toBe("approved");
    expect(byKey("denied").decisionType).toBe("denied");
    expect(byKey("denied").submittedToDecisionDays).toBe(4);
    expect(byKey("missing").receivedToSubmittedDays).toBeNull();
    expect(byKey("missing").receivedToSubmittedDisplay).toBe("Not documented");
    expect(byKey("invalid").receivedToSubmittedDays).toBeNull();
    expect(byKey("reversed").receivedToSubmittedDays).toBeNull();
    expect(byKey("reversed").receivedToSubmittedDisplay).toBe("Not documented");
    expect(byKey("sameday").receivedToSubmittedDays).toBe(0);
    expect(byKey("sameday").submittedToDecisionDays).toBe(0);

    expect(out.documentedReceivedToSubmitted).toBe(3);
    expect(out.documentedSubmittedToDecision).toBe(3);
    expect(out.avgReceivedToSubmittedDays).toBe(Math.round(((3 + 1 + 0) / 3) * 10) / 10);
    expect(out.approvedDecisions).toBe(2);
    expect(out.deniedDecisions).toBe(1);
  });

  it("timelineDays rejects invalid and reversed pairs but keeps same-day zero", () => {
    expect(timelineDays(null, "2026-08-01")).toBeNull();
    expect(timelineDays("2026-08-01", "bad")).toBeNull();
    expect(timelineDays("2026-08-05", "2026-08-01")).toBeNull();
    expect(timelineDays("2026-08-05", "2026-08-05")).toBe(0);
    expect(timelineDays("2026-08-05", "2026-08-07")).toBe(2);
  });

  it("aggregates are null when nothing is documented", () => {
    const out = computeAuthorizationActionTimelines([{ record_id: "x" }]);
    expect(out.avgReceivedToSubmittedDays).toBeNull();
    expect(out.avgSubmittedToDecisionDays).toBeNull();
  });
});
