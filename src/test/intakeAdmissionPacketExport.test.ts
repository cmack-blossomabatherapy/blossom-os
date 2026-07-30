import { describe, it, expect } from "vitest";
import {
  buildPacketQueueCsv,
  buildPacketHandoffSheet,
  packetFileSlug,
  PACKET_CSV_HEADERS,
  type PacketExportRow,
} from "@/lib/intake/admissionPacketExport";
import { evaluateAdmissionReadiness, CENTRALREACH_BOUNDARY_NOTE, type AdmissionChecklistItem } from "@/lib/intake/admissionReadiness";

const checklist: AdmissionChecklistItem[] = [
  { key: "demographics", label: "Demographics", required: true, status: "complete" },
  { key: "insurance", label: "Insurance Cards", required: true, status: "missing", missing: ["Payer / plan"] },
  { key: "consents", label: "Consents, Forms", required: true, status: "waived", waivedReason: "Signed in office" },
  { key: "notes", label: "Notes", required: false, status: "missing" },
];

const row: PacketExportRow = {
  leadId: "11111111-2222-3333-4444-555555555555",
  childName: 'Ava "AJ" Smith',
  parentName: "Dana Smith",
  state: "GA",
  owner: "Coordinator One",
  insurance: "",
  stage: "Insurance Verification",
  status: "In prep",
  requiredComplete: 2,
  requiredTotal: 3,
  blockers: ["Insurance Cards: Payer / plan", "Director of Intake approval required"],
  approvedBy: null,
  approvedAt: null,
  handoffMarkedAt: null,
  handoffReference: null,
  checklist,
};

describe("admission packet exports", () => {
  it("emits a header row and escapes commas/quotes", () => {
    const csv = buildPacketQueueCsv([row]);
    const [header, line] = csv.split("\n");
    expect(header).toBe(PACKET_CSV_HEADERS.join(","));
    expect(line).toContain('"Ava ""AJ"" Smith"');
    expect(line).toContain('"Insurance Cards: Payer / plan | Director of Intake approval required"');
  });

  it("exports one line per packet", () => {
    expect(buildPacketQueueCsv([row, { ...row, leadId: "b" }]).split("\n")).toHaveLength(3);
  });

  it("builds a handoff sheet with checklist marks and blockers", () => {
    const readiness = evaluateAdmissionReadiness(checklist);
    const sheet = buildPacketHandoffSheet(row, readiness, CENTRALREACH_BOUNDARY_NOTE);
    expect(sheet).toContain("[x] Demographics");
    expect(sheet).toContain("missing: Payer / plan");
    expect(sheet).toContain("waived: Signed in office");
    expect(sheet).toContain("(optional)");
    expect(sheet).toContain("Director approval: not approved");
    expect(sheet).toContain("CentralReach handoff: not marked");
    expect(sheet).toContain(CENTRALREACH_BOUNDARY_NOTE);
  });

  it("reports approval and handoff details when present", () => {
    const approved: PacketExportRow = {
      ...row,
      approvedBy: "director-1",
      approvedAt: "2026-07-01T00:00:00Z",
      handoffMarkedAt: "2026-07-02T00:00:00Z",
      handoffReference: "CR-9931",
    };
    const readiness = evaluateAdmissionReadiness(checklist, {
      approvedBy: "director-1", approvedAt: "2026-07-01T00:00:00Z", exceptionReason: "Payer pending",
    });
    const sheet = buildPacketHandoffSheet(approved, readiness, CENTRALREACH_BOUNDARY_NOTE);
    expect(sheet).toContain("director-1 @ 2026-07-01T00:00:00Z");
    expect(sheet).toContain("Director exception: Payer pending");
    expect(sheet).toContain("ref CR-9931");
  });

  it("slugs file names safely", () => {
    expect(packetFileSlug('Ava "AJ" Smith', row.leadId)).toBe("ava-aj-smith-11111111");
    expect(packetFileSlug("", row.leadId)).toBe("packet-11111111");
  });
});
