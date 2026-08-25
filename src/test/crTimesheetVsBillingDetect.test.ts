import { describe, expect, it } from "vitest";
import { detectCentralReachUpload } from "@/lib/os/centralreachUploads/detect";

const FULL_BILLING_HEADERS = [
  "Id",
  "DateOfService",
  "CreationDate",
  "ClientId",
  "ClientFirstName",
  "ClientLastName",
  "ProviderId",
  "ProviderFirstName",
  "ProviderLastName",
  "ProcedureCode",
  "TimeWorkedInHours",
  "AmountOwed",
  "Claims",
  "Exported",
  "SignedByProvider",
  "SignedByClient",
  "IsLocked",
  "IsVoid",
  "Tasks",
  "TasksCompleted",
  "PayorName",
];

const TRUE_TIMESHEET_HEADERS = [
  "Id",
  "DateOfService",
  "DateTimeFrom",
  "DateTimeTo",
  "ClientId",
  "ProviderId",
  "AuthorizationId",
  "ProcedureCode",
  "TimeWorkedInHours",
  "BillingLabels",
  "ClientSignature",
  "ProviderSignature",
  "IsVoid",
  "IsLocked",
  "Tasks",
  "TasksCompleted",
];

describe("timesheet vs billing detection", () => {
  it("detects the full billing export as billing", () => {
    expect(detectCentralReachUpload(FULL_BILLING_HEADERS).kind).toBe("billing");
  });

  it("detects the true timesheet export as timesheet", () => {
    expect(detectCentralReachUpload(TRUE_TIMESHEET_HEADERS).kind).toBe("timesheet");
  });

  it("does not treat shared lock/task columns alone as timesheet evidence", () => {
    const headers = ["Id", "DateOfService", "ProcedureCode", "TimeWorkedInHours", "IsLocked", "IsVoid", "Tasks", "TasksCompleted", "ClientFirstName", "ClientLastName"];
    expect(detectCentralReachUpload(headers).kind).not.toBe("timesheet");
  });

  it("requires both session window columns plus a signature column", () => {
    const headers = ["Id", "DateOfService", "DateTimeFrom", "ProcedureCode", "TimeWorkedInHours", "ClientSignature"];
    expect(detectCentralReachUpload(headers).kind).not.toBe("timesheet");
  });
});
