import { describe, expect, it } from "vitest";
import {
  classifyAuthKind,
  classifyAuthStatus,
} from "@/lib/os/reports/crPrimary/metrics/authorizationAnalysis";
import { computeAuthTrackerWeeks, totalTrackerCounts } from "@/lib/os/reports/crPrimary/metrics/authorizationTracker";
import { deriveNoRaPauses } from "@/lib/os/reports/crPrimary/metrics/authorizationPauses";
import { deriveAuthorizationStatus } from "@/lib/os/centralreachUploads/normalize";
import type {
  AuthorizationWeeklyEventRow,
  CrAuthorizationRow,
  CrBillingSessionRow,
} from "@/lib/os/reports/crPrimary/types";

function auth(partial: Partial<CrAuthorizationRow>): CrAuthorizationRow {
  return {
    id: "a", batch_id: null, authorization_number: null, client_name: null,
    client_cr_id: null, payor: null, state: null, procedure_code: null,
    start_date: null, end_date: null, authorized_hours: null, worked_hours: null,
    remaining_hours: null, status: null, ...partial,
  };
}

function billing(partial: Partial<CrBillingSessionRow>): CrBillingSessionRow {
  return {
    id: "b", batch_id: null, date_of_service: null, procedure_code: "97153",
    hours: 2, client_name: null, client_cr_id: null, rendering_provider_name: null,
    rendering_provider_cr_id: null, provider_contact_labels: null, payor: null,
    state: null, location: null, status: null, ...partial,
  };
}

function event(partial: Partial<AuthorizationWeeklyEventRow>): AuthorizationWeeklyEventRow {
  return {
    id: "e", event_type: "ra_submitted", event_date: "2026-03-04", client_name: null,
    client_cr_id: null, authorization_number: null, payor: null, state: null,
    pause_reason: null, pause_reason_detail: null, notes: null, logged_by: null,
    created_at: "2026-03-04T00:00:00Z", ...partial,
  };
}

describe("authorization label classification", () => {
  it("uses CentralReach client labels as the authoritative work type", () => {
    expect(classifyAuthKind(auth({ client_labels: "Client |Initial Assessment Approved |GA" })))
      .toBe("initial_assessment");
    expect(classifyAuthKind(auth({ client_labels: "Client |Initial Treatment Approved " })))
      .toBe("initial_treatment");
    expect(classifyAuthKind(auth({ client_labels: "Client |Concurrent Treatment Approved" })))
      .toBe("reauthorization");
  });

  it("falls back to service codes when labels carry no workflow signal", () => {
    expect(classifyAuthKind(auth({ client_labels: "Client |Needs Verification", service_codes: "97151" })))
      .toBe("initial_assessment");
  });

  it("reads approved and denied straight from labels", () => {
    expect(classifyAuthStatus(auth({ client_labels: "Client |Initial Treatment Approved " }))).toBe("approved");
    expect(classifyAuthStatus(auth({ client_labels: "Client |DENIED" }))).toBe("denied");
  });

  it("marks lapsed coverage expired and active coverage approved", () => {
    expect(classifyAuthStatus(auth({ actual_end_date: "2020-01-01" }))).toBe("expired");
    expect(classifyAuthStatus(auth({ is_active: true }))).toBe("approved");
  });

  it("derives an import status when the export has no status column", () => {
    expect(deriveAuthorizationStatus({ clientLabels: "x |DENIED", isActive: true, endDate: null })).toBe("Denied");
    expect(deriveAuthorizationStatus({ clientLabels: "Initial Assessment Approved", isActive: null, endDate: null })).toBe("Approved");
    expect(deriveAuthorizationStatus({ clientLabels: "", isActive: true, endDate: null })).toBe("Active");
    expect(deriveAuthorizationStatus({ clientLabels: "", isActive: true, endDate: "2019-01-01" })).toBe("Expired");
  });
});

describe("weekly authorization tracker", () => {
  it("counts every tracked event type by ISO week", () => {
    const weeks = computeAuthTrackerWeeks([
      event({ event_type: "initial_assessment_submitted", event_date: "2026-03-03" }),
      event({ event_type: "initial_assessment_approved", event_date: "2026-03-05" }),
      event({ event_type: "progress_report_denied", event_date: "2026-03-05" }),
      event({ event_type: "services_paused_late_pr", event_date: "2026-03-10" }),
      event({ event_type: "not_a_real_event", event_date: "2026-03-10" }),
    ]);
    expect(weeks.map((w) => w.weekStart)).toEqual(["2026-03-02", "2026-03-09"]);
    expect(weeks[0].initial_assessment_submitted).toBe(1);
    expect(weeks[0].initial_assessment_approved).toBe(1);
    expect(weeks[0].progress_report_denied).toBe(1);
    expect(weeks[1].services_paused_late_pr).toBe(1);
    const totals = totalTrackerCounts(weeks);
    expect(totals.progress_report_denied).toBe(1);
    expect(totals.ra_submitted).toBe(0);
  });

  it("merges derived no-RA pauses without double counting a logged client week", () => {
    const weeks = computeAuthTrackerWeeks(
      [event({ event_type: "services_paused_no_ra", event_date: "2026-03-03", client_name: "Areeb Hasan" })],
      [
        { weekStart: "2026-03-02", clientKey: "areeb hasan" },
        { weekStart: "2026-03-02", clientKey: "other client" },
      ],
    );
    expect(weeks[0].services_paused_no_ra).toBe(2);
  });
});

describe("derived no-RA pauses", () => {
  it("flags gap weeks with no covering authorization", () => {
    const pauses = deriveNoRaPauses(
      [
        billing({ client_name: "Kid A", date_of_service: "2026-03-02", state: "GA" }),
        billing({ client_name: "Kid A", date_of_service: "2026-03-23" }),
      ],
      [auth({ client_name: "Kid A", actual_start_date: "2026-03-01", actual_end_date: "2026-03-08" })],
    );
    expect(pauses.map((p) => p.weekStart)).toEqual(["2026-03-09", "2026-03-16"]);
    expect(pauses[0].lastAuthEnd).toBe("2026-03-08");
  });

  it("does not flag gap weeks that an authorization still covers", () => {
    const pauses = deriveNoRaPauses(
      [
        billing({ client_name: "Kid B", date_of_service: "2026-03-02" }),
        billing({ client_name: "Kid B", date_of_service: "2026-03-23" }),
      ],
      [auth({ client_name: "Kid B", actual_start_date: "2026-01-01", followup_end_date: "2026-06-30" })],
    );
    expect(pauses).toEqual([]);
  });
});