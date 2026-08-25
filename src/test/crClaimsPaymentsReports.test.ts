import { describe, expect, it } from "vitest";
import { detectCentralReachUpload } from "@/lib/os/centralreachUploads/detect";
import { crImportStrategyFor, CR_CURRENT_TABLES } from "@/lib/os/centralreachUploads/strategy";
import { normalizeCrRow } from "@/lib/os/centralreachUploads/normalize";
import {
  computeClaimsQueue,
  CLAIMS_AMOUNT_SUPPRESSION_NOTE,
  NOT_DOCUMENTED,
} from "@/lib/os/reports/crPrimary/metrics/claimsQueue";
import {
  computePaymentReconciliation,
  normalizeEraStatus,
  PAYMENT_AMOUNT_SUPPRESSION_NOTE,
} from "@/lib/os/reports/crPrimary/metrics/paymentReconciliation";
import type {
  CrClaimsStatusRow,
  CrEraReconciliationRow,
  CrPaymentCurrentRow,
} from "@/lib/os/reports/crPrimary/types";

const PAYMENTS_HEADERS = [
  "Id", "BillingEntryId", "RecordDate", "CreationDate", "DateOfService", "Client Name",
  "Department", "PayorName", "PaymentType", "Reference", "Notes", "ResourceId", "Amount",
  "IsCopay", "AppliedByContactId", "AppliedByFullName", "VoidedBy", "VoidedDate",
  "VoidedReason", "PaymentLabels", "PrimaryLocation", "Invoice#", "FirstBilled",
  "ProcedureCodeString", "claims", "ClaimAdjustments", "PayorNickname",
];

const ERA_HEADERS = [
  "Id", "ERA Labels", "Received", "Payor", "Check Number", "# of Claims", "# of Clients",
  "Est. Total Claim Charges", "Agreed Charges", "Claim Adj. Amount", "Provider Adj. Amount",
  "Contractual Obligations", "Correction & Reversals", "Other Adj.", "Payor Initiated Red",
  "Total Adjustments", "Patient Responsibility", "Insurance Paid Amount", "Total Adj. Amount",
  "Paid Amount", "Reconcile Status", "Files",
];

const TIMESHEET_HEADERS = [
  "Id", "DateOfService", "DateTimeFrom", "DateTimeTo", "ClientId", "ProviderId",
  "AuthorizationId", "ProcedureCode", "TimeWorkedInHours", "BillingLabels",
  "ClientSignature", "ProviderSignature", "IsVoid", "IsLocked", "Tasks", "TasksCompleted",
];

const claim = (over: Partial<CrClaimsStatusRow> = {}): CrClaimsStatusRow => ({
  id: "c1",
  claim_number: "CLM-1",
  client_name: "Client A",
  payor: "Aetna",
  state: "GA",
  date_of_service: "2026-05-01",
  procedure_code: "97153",
  status: "Submitted",
  responses_status: "Accepted",
  action_date: "2026-05-10",
  action_by: "Biller",
  submit_reason: "Initial",
  error_count: 0,
  exported: true,
  amount_unit: "unknown",
  source_row_id: "row-1",
  last_seen_at: null,
  ...over,
});

const payment = (over: Partial<CrPaymentCurrentRow> = {}): CrPaymentCurrentRow => ({
  id: "p1",
  record_date: "2026-05-02",
  creation_date: "2026-05-02",
  date_of_service: "2026-04-30",
  first_billed: null,
  client_name: "Client A",
  client_cr_id: "9001",
  department: "Billing",
  payor: "Aetna",
  payment_type: "Insurance",
  is_copay: false,
  payment_labels: null,
  primary_location: "Atlanta",
  applied_to_billing_entry: true,
  is_voided: false,
  amount_unit: "unknown",
  source_row_id: "prow-1",
  last_seen_at: null,
  ...over,
});

const era = (over: Partial<CrEraReconciliationRow> = {}): CrEraReconciliationRow => ({
  id: "e1",
  era_labels: "Batch 1",
  received_date: "2026-05-05",
  payor: "Aetna",
  claim_count: 12,
  client_count: 8,
  reconcile_status: "Fully Reconciled",
  amount_unit: "unknown",
  source_row_id: "erow-1",
  last_seen_at: null,
  ...over,
});

describe("CentralReach payments / ERA / timesheet detection", () => {
  it("detects the payments export", () => {
    const d = detectCentralReachUpload(PAYMENTS_HEADERS);
    expect(d.kind).toBe("payments");
    expect(d.confidence).toBeGreaterThan(0.8);
  });

  it("detects the ERA payment detail export", () => {
    const d = detectCentralReachUpload(ERA_HEADERS);
    expect(d.kind).toBe("era_payments");
    expect(d.confidence).toBeGreaterThan(0.8);
  });

  it("detects the timesheet export as timesheet, never as billing", () => {
    const d = detectCentralReachUpload(TIMESHEET_HEADERS);
    expect(d.kind).toBe("timesheet");
  });

  it("keeps the plain billing export detecting as billing", () => {
    const d = detectCentralReachUpload([
      "DateOfService", "TimeWorkedInHours", "ProcedureCode", "ClientFirstName",
      "ClientLastName", "ProviderFirstName", "ProviderLastName", "PayorName",
    ]);
    expect(d.kind).toBe("billing");
  });

  it("treats payments, ERA and timesheets as mutable snapshots", () => {
    expect(crImportStrategyFor("payments")).toBe("upsert_snapshot");
    expect(crImportStrategyFor("era_payments")).toBe("upsert_snapshot");
    expect(crImportStrategyFor("timesheet")).toBe("upsert_snapshot");
    // Billing stays append-only so BCBA Productivity V3 facts are never rewritten.
    expect(crImportStrategyFor("billing")).toBe("append_fact");
  });

  it("registers the new current tables and never routes timesheets to billing sessions", () => {
    expect(CR_CURRENT_TABLES).toContain("cr_payments");
    expect(CR_CURRENT_TABLES).toContain("cr_era_payments");
    expect(CR_CURRENT_TABLES).toContain("cr_timesheet_status");
    const row = normalizeCrRow("timesheet", {
      Id: "77", DateOfService: "5/1/2026", ProcedureCode: "97153",
      TimeWorkedInHours: "2", IsLocked: "true", IsVoid: "false",
      ClientSignature: "true", ProviderSignature: "false", Tasks: "4", TasksCompleted: "3",
    });
    // A timesheet row carries documentation status, not a billing fact identity.
    expect(row).not.toHaveProperty("rendering_provider_name");
    expect(row.is_locked).toBe(true);
    expect(row.tasks_completed).toBe(3);
  });
});

describe("Claims Submission & Error Queue", () => {
  it("suppresses dollar amounts and says so", () => {
    const m = computeClaimsQueue([claim()]);
    expect(m.dataQualityWarnings[0]).toBe(CLAIMS_AMOUNT_SUPPRESSION_NOTE);
    const serialized = JSON.stringify(m);
    expect(serialized).not.toMatch(/amount_raw|paid_amount_raw/);
    for (const row of m.rows) {
      expect(Object.keys(row)).not.toContain("amount");
    }
  });

  it("counts only source-reported errors and unexported claims", () => {
    const m = computeClaimsQueue([
      claim({ id: "a", error_count: 2, exported: true }),
      claim({ id: "b", error_count: 0, exported: false }),
      claim({ id: "c", error_count: null, exported: null }),
    ]);
    expect(m.withErrors).toBe(1);
    expect(m.totalErrors).toBe(2);
    expect(m.notExported).toBe(1);
    expect(m.exportStateNotDocumented).toBe(1);
    expect(m.rows[2].exportState).toBe(NOT_DOCUMENTED);
    expect(m.followUpQueue.map((r) => r.key)).toEqual(["a", "b"]);
  });

  it("never turns a missing or malformed action date into zero age", () => {
    const m = computeClaimsQueue(
      [
        claim({ id: "a", action_date: null }),
        claim({ id: "b", action_date: "not-a-date" }),
        claim({ id: "c", action_date: "2026-05-01" }),
      ],
      { today: new Date("2026-05-11T00:00:00Z") },
    );
    expect(m.rows[0].actionAgeDays).toBeNull();
    expect(m.rows[1].actionAgeDays).toBeNull();
    expect(m.rows[2].actionAgeDays).toBe(10);
    expect(m.avgActionAgeDays).toBe(10);
    expect(m.actionDateNotDocumented).toBe(2);
  });

  it("groups response mix, payor and submit reason from the source values only", () => {
    const m = computeClaimsQueue([
      claim({ id: "a", responses_status: "Denied", payor: "Aetna", submit_reason: "Initial" }),
      claim({ id: "b", responses_status: "Denied", payor: "BCBS", submit_reason: null }),
    ]);
    expect(m.responseMix[0]).toMatchObject({ name: "Denied", claims: 2 });
    expect(m.payors).toHaveLength(2);
    expect(m.submitReasons.some((b) => b.name === NOT_DOCUMENTED)).toBe(true);
  });
});

describe("Payment Reconciliation", () => {
  it("suppresses amounts, references, check numbers and notes", () => {
    const m = computePaymentReconciliation([payment()], [era()]);
    expect(m.dataQualityWarnings[0]).toBe(PAYMENT_AMOUNT_SUPPRESSION_NOTE);
    const serialized = JSON.stringify(m);
    expect(serialized).not.toMatch(/check_number|reference|notes|Notes/i);
    for (const row of m.paymentRows) {
      expect(Object.keys(row)).not.toContain("amount");
    }
  });

  it("only counts application status the source proves", () => {
    const m = computePaymentReconciliation(
      [
        payment({ id: "a", applied_to_billing_entry: true }),
        payment({ id: "b", applied_to_billing_entry: false }),
        payment({ id: "c", applied_to_billing_entry: null }),
      ],
      [],
    );
    expect(m.appliedPayments).toBe(1);
    expect(m.unappliedPayments).toBe(1);
    expect(m.applicationNotDocumented).toBe(1);
    expect(m.unappliedQueue.map((r) => r.key)).toEqual(["b"]);
  });

  it("reports payment date coverage and excludes unusable dates", () => {
    const m = computePaymentReconciliation(
      [
        payment({ id: "a", record_date: "2026-05-02", creation_date: null }),
        payment({ id: "b", record_date: "2026-04-01", creation_date: null }),
        payment({ id: "c", record_date: "garbage", creation_date: null }),
      ],
      [],
    );
    expect(m.paymentsCoverageStart).toBe("2026-04-01");
    expect(m.paymentsCoverageEnd).toBe("2026-05-02");
    expect(m.paymentDateNotDocumented).toBe(1);
  });

  it("maps the four ERA reconcile states and never guesses an unknown one", () => {
    expect(normalizeEraStatus("Fully Reconciled")).toBe("Fully reconciled");
    expect(normalizeEraStatus("Partially Reconciled")).toBe("Partially reconciled");
    expect(normalizeEraStatus("None")).toBe("Not reconciled");
    expect(normalizeEraStatus("Over Reconciled")).toBe("Over reconciled");
    expect(normalizeEraStatus("weird value")).toBe("Not documented");
    expect(normalizeEraStatus(null)).toBe("Not documented");
  });

  it("builds the ERA exception queue only from proven statuses", () => {
    const m = computePaymentReconciliation([], [
      era({ id: "a", reconcile_status: "Fully Reconciled" }),
      era({ id: "b", reconcile_status: "None" }),
      era({ id: "c", reconcile_status: "Partially Reconciled" }),
      era({ id: "d", reconcile_status: "mystery" }),
    ]);
    expect(m.eraExceptionQueue.map((r) => r.key)).toEqual(["b", "c"]);
    expect(m.eraNotDocumented).toBe(1);
    expect(m.eraFully).toBe(1);
  });

  it("leaves ERA claim coverage null when the source documents no claim counts", () => {
    const m = computePaymentReconciliation([], [era({ claim_count: null })]);
    expect(m.eraClaimsCovered).toBeNull();
    expect(m.eraRows[0].claimCount).toBeNull();
  });
});

describe("Cancellation conversion queue exclusions", () => {
  const event = (over: Record<string, unknown> = {}) =>
    ({
      id: "s1",
      event_date: "2026-05-01",
      start_time: null,
      end_time: null,
      service_code: "97153",
      procedure_code: "97153",
      billing_code: null,
      billing_code_name: null,
      scheduled_hours: 2,
      client_name: "Client A",
      provider_name: "Prov A",
      status: "Completed",
      attendance: null,
      cancelled: false,
      deleted: false,
      converted_to_timesheet: true,
      cancellation_reason: null,
      cancelled_by: null,
      state: "GA",
      location: null,
      payor: "Aetna",
      billing_creation_date: null,
      last_seen_at: null,
      ...over,
    }) as never;

  it("excludes deleted events and unknown conversion flags from the unconverted queue", async () => {
    const { isActiveScheduleEvent } = await import(
      "@/lib/os/reports/crPrimary/scheduleTruth"
    );
    const rows = [
      event({ id: "a", converted_to_timesheet: false }),
      event({ id: "b", converted_to_timesheet: null }),
      event({ id: "c", converted_to_timesheet: true }),
      event({ id: "d", converted_to_timesheet: false, deleted: true }),
    ];
    const queue = (rows as unknown as { id: string; converted_to_timesheet: boolean | null }[]).filter(
      (r) => isActiveScheduleEvent(r as never) && r.converted_to_timesheet === false,
    );
    expect(queue.map((r) => r.id)).toEqual(["a"]);
  });

  it("never exposes a converted-late concept", async () => {
    const mod = await import("@/lib/os/reports/crPrimary/metrics/cancellationCenter");
    expect(JSON.stringify(Object.keys(mod))).not.toMatch(/late/i);
    expect(mod.CONVERSION_TIMING_NOTE).toMatch(/not when/i);
  });
});
