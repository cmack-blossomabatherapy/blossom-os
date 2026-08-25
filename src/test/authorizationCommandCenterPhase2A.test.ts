/**
 * Phase 2A repair — Authorization Command Center and Utilization guardrails.
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  classifyLifecycleEvent,
  computeAuthorizationLifecycle,
} from "@/lib/os/reports/crPrimary/metrics/authorizationLifecycle";
import {
  NO_AUTHORITATIVE_DUE,
  computePauseOps,
  computeProgressReportOps,
} from "@/lib/os/reports/crPrimary/metrics/authorizationActions";
import {
  allocateBillingToAuthorizations,
  computeProratedUtilization,
  prorationWindow,
} from "@/lib/os/reports/crPrimary/metrics/authorizationProration";
import { computeAuthorizationTrend } from "@/lib/os/reports/crPrimary/metrics/authorizationTrends";
import { currentMonthWindow, withCurrentMonthDefault } from "@/lib/os/reports/crPrimary/reportWindow";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");
const authPage = read("src/pages/os/reports/AuthorizationAnalysisPage.tsx");
const utilPage = read("src/pages/os/reports/AuthorizationUtilizationPage.tsx");
const shell = read("src/components/reports/crPrimary/PrimaryReportShell.tsx");
const app = read("src/App.tsx");

const ev = (over: Record<string, unknown> = {}) => ({
  record_id: Math.random().toString(36).slice(2),
  source: "authorization_weekly_events",
  event_type: "Submitted",
  event_date: "2026-03-10",
  client_name: "Client A",
  authorization_number: "A-1",
  payor: "Payor",
  state: "GA",
  reason: null,
  ...over,
});

describe("lifecycle counts are true event counts", () => {
  it("approved / denied / resubmitted events never manufacture a submission", () => {
    const m = computeAuthorizationLifecycle([
      ev({ event_type: "Approved" }),
      ev({ event_type: "Denied" }),
      ev({ event_type: "Resubmitted" }),
    ]);
    expect(m.submitted).toBe(0);
    expect(m.approved).toBe(1);
    expect(m.denied).toBe(1);
  });

  it("counts a submission only when a submission event exists", () => {
    const m = computeAuthorizationLifecycle([ev(), ev({ event_type: "Approved" })]);
    expect(m.submitted).toBe(1);
  });
});

describe("lifecycle classification", () => {
  it("treats reassessment / RA as reauthorization, not initial assessment", () => {
    expect(classifyLifecycleEvent("Reassessment submitted").kind).toBe("reauthorization");
    expect(classifyLifecycleEvent("RA - submitted").kind).toBe("reauthorization");
    expect(classifyLifecycleEvent("Initial assessment submitted").kind).toBe("initial_assessment");
  });

  it("prefers an explicit curated auth type when one is supplied", () => {
    expect(classifyLifecycleEvent("submitted", "Reauthorization").kind).toBe("reauthorization");
  });

  it("says Unclassified rather than guessing", () => {
    expect(classifyLifecycleEvent("something unmapped").kind).toBe("unclassified");
  });
});

describe("progress reports and pauses stay separate and honest", () => {
  it("only counts true progress-report events", () => {
    const ops = computeProgressReportOps(
      [
        ev({ event_type: "Progress report submitted" }),
        ev({ event_type: "Progress report approved" }),
        ev({ event_type: "Authorization submitted" }),
      ],
      [],
    );
    expect(ops.submitted).toBe(1);
    expect(ops.approved).toBe(1);
    expect(ops.events).toHaveLength(2);
  });

  it("never infers overdue from an authorization start date", () => {
    const ops = computeProgressReportOps([], [
      {
        record_id: "r1",
        client_name: "Client A",
        authorization_number: "A-1",
        status: "In progress",
        next_action: "Send packet",
        next_action_due_date: null,
        appeal_due_date: null,
      },
    ]);
    expect(ops.dueRows[0].dueSource).toBe("none");
    expect(ops.dueRows[0].overdue).toBe(false);
    expect(ops.dueRows[0].note).toBe(NO_AUTHORITATIVE_DUE);
  });

  it("keeps confirmed pauses apart from coverage-gap candidates", () => {
    const ops = computePauseOps(
      [ev({ event_type: "Services paused", reason: "Family travel" })],
      [{ client: "Client B", state: "GA", payor: "Payor", lastEnd: "2026-01-31", note: "Confirm" }],
    );
    expect(ops.confirmedPauses).toHaveLength(1);
    expect(ops.candidates).toHaveLength(1);
    expect(ops.candidates[0].client).toBe("Client B");
  });
});

describe("tabs and redirects", () => {
  it("exposes exactly four ordered, URL-addressable tabs", () => {
    const from = authPage.indexOf("const TABS = [");
    const block = authPage.slice(from, authPage.indexOf("] as const;", from));
    const keys = [...block.matchAll(/key: "([a-z-]+)"/g)].map((m) => m[1]);
    expect(keys).toEqual(["lifecycle", "continuity", "progress-reports", "pauses"]);
    expect(authPage).toContain('useUrlState("tab"');
  });

  it("redirects progress-report routes to the tab, preserving query params", () => {
    expect(app).toMatch(
      /path="\/reports\/progress-reports"[\s\S]{0,300}NavigateWithSearch[\s\S]{0,200}tab: "progress-reports"/,
    );
    expect(app).toMatch(
      /path="\/progress-reports"[\s\S]{0,300}NavigateWithSearch[\s\S]{0,200}tab: "progress-reports"/,
    );
    expect(app).toMatch(
      /path="\/reports\/authorization-utilization"[^>]*to="\/reports\/authorization-utilization-hour-based"/,
    );
  });

  it("defaults both reports to the current month via the shared helper", () => {
    for (const src of [authPage, utilPage]) {
      expect(src).toContain("withCurrentMonthDefault");
      expect(src).toContain("onReset={() => setFilters(DEFAULT_FILTERS)}");
    }
    const w = currentMonthWindow(new Date(2026, 2, 15));
    expect(w).toEqual({ from: "2026-03-01", to: "2026-03-31" });
    expect(withCurrentMonthDefault({ from: "", to: "" }, new Date(2026, 2, 15)).from).toBe(
      "2026-03-01",
    );
  });
});

describe("staff-facing shell", () => {
  it("contains no Data Hub or admin call to action", () => {
    expect(shell).not.toMatch(/centralreach-data-hub/i);
    // No link, button, or copy pointing staff at the admin Data Hub.
    expect(shell).not.toMatch(/<Link[\s\S]{0,200}Data Hub/i);
    expect(shell).not.toMatch(/Open Data Hub|Go to Data Hub|re-upload|Upload a|required export/i);
    expect(shell).not.toMatch(/useOSRoleSafe|super_admin/);
  });
});

describe("proration boundaries", () => {
  it("is inclusive of both coverage days", () => {
    expect(prorationWindow("2026-03-01", "2026-03-31").authDays).toBe(31);
  });

  it("prorates a partial overlap", () => {
    const w = prorationWindow("2026-01-01", "2026-06-30", "2026-03-01", "2026-03-31");
    expect(w.overlapDays).toBe(31);
    expect(w.factor).toBeCloseTo(31 / 181, 4);
  });

  it("reports a zero overlap when the range is outside coverage", () => {
    expect(prorationWindow("2026-01-01", "2026-01-31", "2026-03-01", "2026-03-31").overlapDays).toBe(0);
  });

  it("cannot prorate without coverage dates", () => {
    expect(prorationWindow(null, "2026-03-31").factor).toBeNull();
  });
});

const auth = (over: Record<string, unknown> = {}) => ({
  authorization_id: null,
  authorization_number: "A-1",
  client_name: "Client A",
  client_cr_id: "C1",
  payor: "Payor",
  state: "GA",
  service_codes: "97153",
  procedure_code: "97153",
  authorized_hours: 100,
  worked_hours: 40,
  start_date: "2026-03-01",
  end_date: "2026-03-31",
  ...over,
});

const bill = (over: Record<string, unknown> = {}) => ({
  date_of_service: "2026-03-10",
  hours: 4,
  client_name: "Client A",
  client_cr_id: "C1",
  procedure_code: "97153",
  ...over,
});

describe("billing allocation gives each row to at most one authorization", () => {
  it("uses an exact authorization id when present", () => {
    const a = allocateBillingToAuthorizations(
      [auth({ authorization_id: "AUTH-9" }), auth({ authorization_id: "AUTH-8" })],
      [bill({ authorization_id: "AUTH-9" })],
    );
    expect(a.counts.exact).toBe(1);
    expect([...a.bySlot.values()].reduce((s, v) => s + v.hours, 0)).toBe(4);
  });

  it("falls back only when a single candidate authorization remains", () => {
    const a = allocateBillingToAuthorizations([auth()], [bill()]);
    expect(a.counts.uniqueFallback).toBe(1);
  });

  it("does not duplicate hours across two authorizations for the same client", () => {
    const result = computeProratedUtilization(
      [auth({ authorization_number: "A-1" }), auth({ authorization_number: "A-2" })],
      [bill(), bill()],
    );
    const recomputedTotal = result.rows.reduce((s, r) => s + (r.recomputedUsedHours ?? 0), 0);
    expect(recomputedTotal).toBe(0); // ambiguous rows are held back, never copied
    expect(result.allocation.ambiguous).toBe(2);
    expect(result.totals.recomputedUsedHours).toBe(0);
  });

  it("keeps a legitimate recomputed zero as zero", () => {
    const result = computeProratedUtilization([auth()], [bill({ hours: 0 })]);
    expect(result.rows[0].recomputedUsedHours).toBe(0);
    expect(result.rows[0].utilizationPct).toBe(0);
  });

  it("never produces NaN or Infinity for zero or invalid hours", () => {
    const result = computeProratedUtilization(
      [auth({ authorized_hours: 0, start_date: null, end_date: null })],
      [],
    );
    const row = result.rows[0];
    expect(row.utilizationPct === null || Number.isFinite(row.utilizationPct)).toBe(true);
    expect(row.dataState).not.toBe("ok");
  });
});

describe("hour trends keep hours and percentages apart", () => {
  it("returns hour series and a separate pace series", () => {
    const trend = computeAuthorizationTrend(
      [{ startDate: "2026-03-01", endDate: "2026-03-31", authorizedHours: 310 }],
      [{ date: "2026-03-03", hours: 5 }],
      { from: "2026-03-01", to: "2026-03-31", grain: "month" },
    );
    expect(trend.points).toHaveLength(1);
    expect(trend.points[0].authorizedHours).toBe(310);
    expect(trend.points[0].usedHours).toBe(5);
    expect(trend.hours[0].value).toBe(5);
    expect(trend.hours[0].secondary).toBe(310);
    // Pace is a percentage and lives only on the pace series.
    expect(trend.pace[0].value).toBeCloseTo(1.6, 1);
    expect(trend.hours.every((h) => typeof h.secondary === "number")).toBe(true);
  });

  it("returns null pace instead of dividing by zero", () => {
    const trend = computeAuthorizationTrend([], [{ date: "2026-03-03", hours: 5 }], {
      from: "2026-03-01",
      to: "2026-03-31",
      grain: "month",
    });
    expect(trend.points[0].utilizationPct).toBeNull();
  });
});
