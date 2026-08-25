import { describe, expect, it } from "vitest";
import { detectCentralReachUpload } from "@/lib/os/centralreachUploads/detect";
import { normalizeCrRow } from "@/lib/os/centralreachUploads/normalize";

const detect = (row: Record<string, unknown>) => detectCentralReachUpload(Object.keys(row));

describe("CentralReach live export headers", () => {
  it("maps billing split names, state, payor, and location", () => {
    const row = {
      DateOfService: "6/1/2026",
      TimeWorkedInHours: "2.5",
      ProcedureCode: "97153",
      ClientFirstName: "John",
      ClientLastName: "Smith",
      ProviderFirstName: "Jane",
      ProviderLastName: "BCBA",
      PayorName: "Aetna",
      ClientLocationStateProvince: "GA",
      ServiceLocationStateProvince: "GA",
      ClientLocationName: "Atlanta Clinic",
    };
    expect(detect(row).kind).toBe("billing");
    const out = normalizeCrRow("billing", row);
    expect(out.client_name).toBe("John Smith");
    expect(out.rendering_provider_name).toBe("Jane BCBA");
    expect(out.payor).toBe("Aetna");
    expect(out.state).toBe("GA");
    expect(out.location).toBe("Atlanta Clinic");
    expect(out.date_of_service).toBe("2026-06-01");
    expect(out.hours).toBe(2.5);
  });

  it("maps scheduling principals, segment hours, and cancelled reason", () => {
    const row = {
      Course: "ABA",
      Segment: "S1",
      Event: "E1",
      Cancelled: "Yes",
      EventDate: "2026-06-02",
      // Principal1 = provider, Principal2 = client (audited CR export).
      Principal1Name: "Jane BCBA",
      Principal2Name: "John Smith",
      SegmentHours: "3",
      CancelledReason: "Client illness",
      LocationStateProvince: "NC",
      PayorName: "BCBS",
      AuthNumber: "A-1",
      ProcedureCode: "97153",
    };
    expect(detect(row).kind).toBe("scheduling");
    const out = normalizeCrRow("scheduling", row);
    expect(out.client_name).toBe("John Smith");
    expect(out.provider_name).toBe("Jane BCBA");
    expect(out.scheduled_hours).toBe(3);
    expect(out.cancellation_reason).toBe("Client illness");
    expect(out.state).toBe("NC");
    expect(out.payor).toBe("BCBS");
  });

  it("maps authorization range hours and lowercase date casing", () => {
    const row = {
      AuthorizationNumber: "AUTH-9",
      AuthorizedHoursMonth: "40",
      AuthorizedHoursAll: "480",
      clientName: "John Smith",
      ClientFullName: "John Smith",
      Payor: "Aetna",
      startDate: "2026-01-01",
      endDate: "2026-06-30",
      WorkedHoursAuthRange: "120",
      RemainingHoursAuthRange: "360",
      ProcedureCode: "97155",
    };
    expect(detect(row).kind).toBe("authorization");
    const out = normalizeCrRow("authorization", row);
    expect(out.client_name).toBe("John Smith");
    expect(out.payor).toBe("Aetna");
    expect(out.start_date).toBe("2026-01-01");
    expect(out.end_date).toBe("2026-06-30");
    expect(out.worked_hours).toBe(120);
    expect(out.remaining_hours).toBe(360);
  });

  it("detects and maps live claims headers", () => {
    const row = {
      Id: "551122",
      ClientId: "9001",
      ClientName: "John Smith",
      InsuranceCompany: "Aetna",
      InsurancePlan: "PPO",
      TotalPaid: "$450.00",
      Amount: "$900.00",
      ResponsesStatus: "Paid",
      FirstService: "5/1/2026",
      LastService: "5/31/2026",
    };
    expect(detect(row).kind).toBe("claims");
    const out = normalizeCrRow("claims", row);
    expect(out.claim_number).toBe("551122");
    expect(out.client_name).toBe("John Smith");
    expect(out.payor).toBe("Aetna");
    expect(out.billed_amount).toBe(900);
    expect(out.paid_amount).toBe(450);
    expect(out.status).toBe("Paid");
    expect(out.date_of_service).toBe("2026-05-01");
  });

  it("detects and maps live contacts headers", () => {
    const row = {
      Id: "7788",
      FirstName: "Jane",
      LastName: "BCBA",
      Type: "Employee",
      Labels: "BCBA, Georgia",
      StateProvince: "GA",
      Email: "jane@example.com",
    };
    expect(detect(row).kind).toBe("contacts");
    const out = normalizeCrRow("contacts", row);
    expect(out.cr_contact_id).toBe("7788");
    expect(out.contact_name).toBe("Jane BCBA");
    expect(out.contact_type).toBe("Employee");
    expect(out.labels).toBe("BCBA, Georgia");
    expect(out.state).toBe("GA");
    expect(out.email).toBe("jane@example.com");
  });

  it("detects payor utilization summary without WeekStart", () => {
    const row = {
      PayorName: "Aetna",
      authHours: "480",
      authHoursWkd: "120",
      authHoursRem: "360",
    };
    const detection = detect(row);
    expect(detection.kind).toBe("utilization");
    const out = normalizeCrRow("utilization", row);
    expect(out.payor).toBe("Aetna");
    expect(out.authorized_hours).toBe(480);
    expect(out.used_hours).toBe(120);
    expect(out.utilization_percent).toBe(25);
  });
});
