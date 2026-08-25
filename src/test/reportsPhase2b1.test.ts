import { describe, it, expect } from "vitest";
import { isProgressReportAction } from "@/lib/os/reports/crPrimary/metrics/authorizationActions";
import {
  assessUtilizationRisk,
  numOrNull,
  resolveActiveScope,
  snapshotWindowMode,
} from "@/lib/os/reports/crPrimary/metrics/authorizationUtilizationScope";
import { computeSupervisionAnalysis } from "@/lib/os/reports/crPrimary/metrics/bcbaSupervisionV2";
import {
  computeParentTrainingAnalysis,
  monthsInWindow,
} from "@/lib/os/reports/crPrimary/metrics/parentTrainingV2";
import {
  computeBcbaPerformanceAnalysis,
  worstStatus,
  type BcbaPerformanceInput,
} from "@/lib/os/reports/crPrimary/metrics/bcbaPerformanceV2";
import { buildCanonicalOwnershipIndex } from "@/lib/os/reports/crPrimary/ownership/v3Ownership";
import type { OwnershipResult } from "@/lib/os/bcbaProductivityV3/engine";

const action = (over: Record<string, unknown> = {}) =>
  ({
    record_id: "r1",
    client_name: "Client A",
    client_cr_id: null,
    authorization_id: null,
    authorization_number: null,
    auth_type: null,
    state: null,
    payor: null,
    service_code: null,
    status: null,
    workflow_stage: null,
    received_date: null,
    submitted_date: null,
    approved_date: null,
    denied_date: null,
    resubmitted_date: null,
    expiration_date: null,
    denial_reason: null,
    missing_info: null,
    next_action: null,
    next_action_due_date: null,
    appeal_due_date: null,
    created_at: null,
    updated_at: null,
    ...over,
  }) as never;

describe("progress-report filtering", () => {
  it("keeps records whose auth type is a progress report", () => {
    expect(isProgressReportAction(action({ auth_type: "Progress Report" }))).toBe(true);
  });

  it("keeps records whose workflow names a progress report or a PR token", () => {
    expect(isProgressReportAction(action({ workflow_stage: "PR drafting" }))).toBe(true);
    expect(isProgressReportAction(action({ next_action: "Send progress report" }))).toBe(true);
  });

  it("excludes generic authorization work", () => {
    expect(isProgressReportAction(action({ next_action: "Submit reauth packet" }))).toBe(false);
    expect(isProgressReportAction(action({ status: "Awaiting payor" }))).toBe(false);
    expect(isProgressReportAction(action())).toBe(false);
  });

  it("does not treat words merely containing 'pr' as progress reports", () => {
    expect(isProgressReportAction(action({ status: "Approved" }))).toBe(false);
    expect(isProgressReportAction(action({ next_action: "Print packet" }))).toBe(false);
  });
});

describe("utilization numeric handling", () => {
  it("keeps missing values null instead of documenting a zero", () => {
    expect(numOrNull(null)).toBeNull();
    expect(numOrNull("")).toBeNull();
    expect(numOrNull("abc")).toBeNull();
    expect(numOrNull(0)).toBe(0);
    expect(numOrNull("1,234.5")).toBe(1234.5);
  });
});

describe("active authorization scope", () => {
  const today = "2026-03-15";

  it("excludes future-dated authorizations", () => {
    const r = resolveActiveScope({ startDate: "2026-04-01", endDate: "2026-09-30" }, today);
    expect(r.active).toBe(false);
    expect(r.reason).toMatch(/has not started/);
  });

  it("excludes expired authorizations", () => {
    expect(resolveActiveScope({ startDate: "2025-01-01", endDate: "2026-01-31" }, today).active).toBe(
      false,
    );
  });

  it("includes authorizations covering today", () => {
    expect(resolveActiveScope({ startDate: "2026-01-01", endDate: "2026-06-30" }, today).active).toBe(
      true,
    );
  });

  it("lets an explicit inactive flag win over the dates", () => {
    expect(
      resolveActiveScope({ is_active: false, startDate: "2026-01-01", endDate: "2026-06-30" }, today)
        .active,
    ).toBe(false);
  });

  it("flags an active row with no coverage dates instead of assuming alignment", () => {
    const r = resolveActiveScope({ is_active: true }, today);
    expect(r.active).toBe(true);
    expect(r.datesMissing).toBe(true);
  });

  it("only claims a snapshot window when the range is the current month", () => {
    expect(snapshotWindowMode({ from: "2026-03-01", to: "2026-03-31" }, today)).toBe("month");
    expect(snapshotWindowMode({ from: "2026-03-05", to: "2026-03-20" }, today)).toBe("unavailable");
    expect(snapshotWindowMode({}, today, true)).toBe("auth_range");
  });
});

describe("exhaustion risk", () => {
  const base = {
    proratedAuthorizedHours: 100,
    usedHours: 50,
    scheduledHours: 10,
    pendingHours: 0,
    remainingHours: 50,
    utilizationPct: 50,
    daysToExpiry: 60,
  };

  it("is insufficient data when authorized or used hours are missing", () => {
    expect(assessUtilizationRisk({ ...base, proratedAuthorizedHours: null }).level).toBe(
      "insufficient_data",
    );
    expect(assessUtilizationRisk({ ...base, usedHours: null }).level).toBe("insufficient_data");
  });

  it("is exhausted when no usable hours remain", () => {
    expect(assessUtilizationRisk({ ...base, remainingHours: 0 }).level).toBe("exhausted");
  });

  it("is at risk when projected demand exceeds authorized hours", () => {
    const r = assessUtilizationRisk({ ...base, usedHours: 80, scheduledHours: 30 });
    expect(r.level).toBe("at_risk");
    expect(r.projectedDemand).toBe(110);
  });

  it("is at risk at 90%+ utilization with more than 14 days left", () => {
    expect(
      assessUtilizationRisk({ ...base, usedHours: 90, scheduledHours: 0, utilizationPct: 90 }).level,
    ).toBe("at_risk");
    expect(
      assessUtilizationRisk({
        ...base,
        usedHours: 90,
        scheduledHours: 0,
        utilizationPct: 90,
        daysToExpiry: 5,
      }).level,
    ).toBe("on_track");
  });

  it("is on track when projected demand fits", () => {
    expect(assessUtilizationRisk(base).level).toBe("on_track");
  });
});

describe("BCBA supervision ratio", () => {
  const resolveOwner = () => "Dr. Reed";
  const past = [
    { date: "2026-03-02", procedureCode: "97153", hours: 100, clientName: "A", providerName: "RBT 1" },
    { date: "2026-03-03", procedureCode: "97155", hours: 4, clientName: "A", providerName: "Dr. Reed" },
  ];

  it("computes 97155 divided by 97153", () => {
    const r = computeSupervisionAnalysis({ past, projected: [], resolveOwner });
    expect(r.past.ratioPct).toBe(4);
    // 4% sits just under the 5% target, which the engine bands as approaching.
    expect(r.past.rows[0].status).toBe("approaching");
    expect(r.past.rows[0].hoursToTarget).toBe(1);
  });

  it("reports insufficient data with no direct hours instead of 0%", () => {
    const r = computeSupervisionAnalysis({
      past: [{ date: "2026-03-03", procedureCode: "97155", hours: 2, clientName: "A", providerName: "Dr. Reed" }],
      projected: [],
      resolveOwner,
    });
    expect(r.past.ratioPct).toBeNull();
    expect(r.past.rows[0].status).toBe("insufficient_data");
  });

  it("adds scheduled sessions to the projected view only", () => {
    const r = computeSupervisionAnalysis({
      past,
      projected: [
        { date: "2026-03-28", procedureCode: "97155", hours: 2, clientName: "A", providerName: "Dr. Reed" },
      ],
      resolveOwner,
    });
    expect(r.past.supervisionHours).toBe(4);
    expect(r.projected.supervisionHours).toBe(6);
    expect(r.projected.ratioPct).toBe(6);
    expect(r.ratioDeltaPct).toBe(2);
  });

  it("groups by client and by RBT", () => {
    const byRbt = computeSupervisionAnalysis({ past, projected: [], grouping: "rbt", resolveOwner });
    expect(byRbt.past.rows.map((r) => r.label).sort()).toEqual(["Dr. Reed", "RBT 1"]);
  });
});

describe("parent training", () => {
  const resolveOwner = () => "Dr. Reed";

  it("counts window months for the target", () => {
    expect(monthsInWindow("2026-03-01", "2026-03-31")).toBe(1);
    expect(monthsInWindow("2026-01-01", "2026-03-31")).toBe(3);
  });

  it("separates completed, upcoming, and cancelled sessions", () => {
    const r = computeParentTrainingAnalysis({
      billed: [
        { date: "2026-03-04", procedureCode: "97156", hours: 1, clientName: "A" },
      ],
      scheduled: [
        { date: "2026-03-28", procedureCode: "97156", hours: 1, clientName: "A" },
        { date: "2026-03-10", procedureCode: "97156", hours: 1, clientName: "B", cancelled: true },
      ],
      activeClients: [{ client: "A" }, { client: "B" }, { client: "C" }],
      resolveOwner,
      window: { from: "2026-03-01", to: "2026-03-31" },
      today: "2026-03-15",
    });
    expect(r.completedSessions).toBe(1);
    expect(r.upcomingSessions).toBe(1);
    expect(r.cancelledSessions).toBe(1);
    expect(r.clients).toBe(3);
  });

  it("never counts a scheduled session as completed", () => {
    const r = computeParentTrainingAnalysis({
      billed: [],
      scheduled: [{ date: "2026-03-28", procedureCode: "97156", hours: 2, clientName: "A" }],
      activeClients: [{ client: "A" }],
      resolveOwner,
      today: "2026-03-15",
    });
    expect(r.completedHours).toBe(0);
    expect(r.upcomingSessions).toBe(1);
    expect(r.noAppointmentQueue).toHaveLength(0);
  });

  it("queues clients with no appointment and clients below target", () => {
    const r = computeParentTrainingAnalysis({
      billed: [{ date: "2026-03-01", procedureCode: "97156", hours: 0.5, clientName: "A" }],
      scheduled: [],
      activeClients: [{ client: "A" }, { client: "C" }],
      resolveOwner,
      window: { from: "2026-03-01", to: "2026-03-31" },
      today: "2026-03-15",
    });
    expect(r.belowTargetQueue.map((c) => c.client)).toEqual(["A"]);
    expect(r.noAppointmentQueue.map((c) => c.client)).toEqual(["C"]);
  });
});

describe("BCBA performance", () => {
  const input = (over: Partial<BcbaPerformanceInput> = {}): BcbaPerformanceInput => ({
    bcba: "Dr. Reed",
    states: ["GA"],
    clients: 10,
    rbts: 5,
    billableHours: 100,
    directHours: 200,
    supervisionHours: 12,
    targetHours: 100,
    forecastHours: 100,
    clientsWithParentTraining: 9,
    authActionCount: 0,
    progressReportsDue: 0,
    progressReportsOverdue: 0,
    ...over,
  });

  it("lets the worst dimension set the overall status", () => {
    expect(worstStatus(["strong", "at_risk", "on_track"])).toBe("at_risk");
    const r = computeBcbaPerformanceAnalysis([input({ progressReportsOverdue: 2 })]);
    expect(r.rows[0].status).toBe("at_risk");
    expect(r.rows[0].drivers).toContain("Documentation Timeliness");
  });

  it("scores productivity as No target when no target row exists", () => {
    const r = computeBcbaPerformanceAnalysis([input({ targetHours: null })]);
    expect(r.rows[0].productivityPct).toBeNull();
    expect(r.rows[0].dimensions[0].status).toBe("insufficient_data");
    expect(r.withoutTargets).toBe(1);
  });

  it("reports supervision as insufficient data with no direct hours", () => {
    const r = computeBcbaPerformanceAnalysis([input({ directHours: 0, supervisionHours: 0 })]);
    expect(r.rows[0].dimensions[1].status).toBe("insufficient_data");
    expect(r.rows[0].supervisionRatioPct).toBeNull();
  });

  it("keeps incentive eligibility separate and blocks it without a target", () => {
    const r = computeBcbaPerformanceAnalysis([input({ targetHours: null })]);
    expect(r.incentives[0].eligible).toBe(false);
    expect(r.incentives[0].blockedBy).toContain("No recorded productivity target");
  });

  it("blocks incentive eligibility when a dimension is At Risk", () => {
    const r = computeBcbaPerformanceAnalysis([input({ progressReportsOverdue: 1 })]);
    expect(r.incentives[0].eligible).toBe(false);
    expect(r.rows[0].status).toBe("at_risk");
  });

  it("marks a fully compliant BCBA eligible", () => {
    const r = computeBcbaPerformanceAnalysis([input()]);
    expect(r.rows[0].status).toBe("strong");
    expect(r.incentives[0].eligible).toBe(true);
  });
});

