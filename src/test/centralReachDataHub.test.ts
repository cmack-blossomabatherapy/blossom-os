import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { detectCentralReachUpload } from "@/lib/os/centralreachUploads/detect";
import {
  validateCrBatch,
  crRowHash,
  crRowIdentity,
  dedupeSnapshotRows,
  applySnapshotBatches,
  isDuplicateBatch,
  planCrReset,
  CR_RESET_CONFIRMATION_PHRASE,
  CR_RESETTABLE_TABLES,
  formatHours,
  formatCount,
  formatPercent,
  supervisionPercent,
  type CRBatchDescriptor,
} from "@/lib/os/centralreachUploads/dataHub";

describe("CentralReach export header detection", () => {
  it("detects billing exports", () => {
    expect(detectCentralReachUpload(["Date Of Service", "Time Worked In Hours", "Procedure Code"]).kind)
      .toBe("billing");
  });

  it("detects scheduling / cancellation exports", () => {
    expect(detectCentralReachUpload(["Course", "Segment", "Event", "Cancelled On"]).kind).toBe("scheduling");
  });

  it("detects authorization exports", () => {
    expect(detectCentralReachUpload(["Authorization Number", "AuthorizedHoursMonth", "WorkedHours"]).kind)
      .toBe("authorization");
  });

  it("detects utilization, claims, and contacts exports", () => {
    expect(detectCentralReachUpload(["Week Start", "Utilization %", "Authorization Number"]).kind).toBe("utilization");
    expect(detectCentralReachUpload(["Claim Number", "Billed Amount", "Paid Amount"]).kind).toBe("claims");
    expect(detectCentralReachUpload(["Contact Id", "Contact Type", "Labels"]).kind).toBe("contacts");
  });

  it("returns unknown for unrecognized headers", () => {
    expect(detectCentralReachUpload(["Foo", "Bar"]).kind).toBe("unknown");
  });
});

const baseBatch: CRBatchDescriptor = {
  fileName: "billing-2026-08-01.csv",
  fileHash: "abcdef1234567890",
  exportType: "billing",
  rowCount: 47533,
  coverageStart: "2026-01-01",
  coverageEnd: "2026-06-30",
  uploadedBy: "user-1",
};

describe("Data Hub batch validation", () => {
  it("accepts a well-formed batch", () => {
    const result = validateCrBatch(baseBatch);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects unknown export types, empty files, and bad coverage", () => {
    expect(validateCrBatch({ ...baseBatch, exportType: "unknown" }).errors.join(" ")).toMatch(/Export type/);
    expect(validateCrBatch({ ...baseBatch, rowCount: 0 }).errors.join(" ")).toMatch(/no data rows/);
    expect(validateCrBatch({ ...baseBatch, coverageStart: "2026-07-01" }).errors.join(" ")).toMatch(/after coverage end/);
    expect(validateCrBatch({ ...baseBatch, fileName: "notes.txt" }).errors.join(" ")).toMatch(/CSV and XLSX/);
    expect(validateCrBatch({ ...baseBatch, fileHash: "" }).errors.join(" ")).toMatch(/hash/);
  });

  it("warns when date coverage is missing", () => {
    const result = validateCrBatch({ ...baseBatch, coverageStart: null, coverageEnd: null });
    expect(result.valid).toBe(true);
    expect(result.warnings.join(" ")).toMatch(/coverage/i);
  });
});

describe("snapshot dedupe", () => {
  it("hashes rows deterministically regardless of key order", () => {
    expect(crRowHash({ a: "1", b: "2" })).toBe(crRowHash({ b: "2", a: "1" }));
    expect(crRowHash({ a: "1" })).not.toBe(crRowHash({ a: "2" }));
  });

  it("prefers the CentralReach row id for identity", () => {
    expect(crRowIdentity({ "CR Row Id": "998", Hours: "2" })).toBe("id:998");
    expect(crRowIdentity({ Hours: "2" }).startsWith("hash:")).toBe(true);
  });

  it("dedupes duplicate snapshot rows keeping the latest", () => {
    const rows = [
      { "CR Row Id": "1", Hours: "2" },
      { "CR Row Id": "1", Hours: "3" },
      { "CR Row Id": "2", Hours: "1" },
    ];
    const result = dedupeSnapshotRows(rows);
    expect(result.rows).toHaveLength(2);
    expect(result.duplicatesRemoved).toBe(1);
    expect(result.rows[0].Hours).toBe("3");
  });

  it("treats a new daily export as a full snapshot and archives prior batches", () => {
    const next = applySnapshotBatches([{ ...baseBatch, isActive: true, status: "active" }], {
      ...baseBatch,
      fileHash: "0000ffff0000ffff",
      fileName: "billing-2026-08-02.csv",
    });
    expect(next).toHaveLength(2);
    expect(next[0].isActive).toBe(false);
    expect(next[0].status).toBe("archived");
    expect(next[1].isActive).toBe(true);
  });

  it("flags an identical re-upload as a duplicate batch", () => {
    expect(isDuplicateBatch([baseBatch], baseBatch)).toBe(true);
    expect(isDuplicateBatch([baseBatch], { ...baseBatch, exportType: "scheduling" })).toBe(false);
  });
});

describe("guarded reset", () => {
  it("blocks resets without the exact confirmation phrase", () => {
    expect(planCrReset({ confirmationPhrase: "reset" }).allowed).toBe(false);
    expect(planCrReset({ confirmationPhrase: "" }).allowed).toBe(false);
  });

  it("allows a reset with the exact phrase and defaults to CR report tables only", () => {
    const plan = planCrReset({ confirmationPhrase: CR_RESET_CONFIRMATION_PHRASE });
    expect(plan.allowed).toBe(true);
    expect(plan.tables).toEqual([...CR_RESETTABLE_TABLES]);
    expect(plan.backupLabel).toMatch(/^cr-reset-/);
  });

  it("refuses to touch non-CentralReach tables", () => {
    const plan = planCrReset({ confirmationPhrase: CR_RESET_CONFIRMATION_PHRASE, tables: ["employees"] });
    expect(plan.allowed).toBe(false);
    expect(plan.errors.join(" ")).toMatch(/Not CentralReach report data/);
  });

  it("never lists people, HR, or auth tables as resettable", () => {
    const forbidden = ["employees", "clients", "user_roles", "profiles", "leads"];
    forbidden.forEach((t) => expect(CR_RESETTABLE_TABLES as readonly string[]).not.toContain(t));
  });
});

describe("executive presentation formatting", () => {
  it("formats hours with commas and one decimal", () => {
    expect(formatHours(1234.56)).toBe("1,234.6");
    expect(formatHours(null)).toBe("—");
  });
  it("formats counts with commas and no decimals", () => {
    expect(formatCount(47533)).toBe("47,533");
    expect(formatCount(12.6)).toBe("13");
  });
  it("formats percentages with one decimal", () => {
    expect(formatPercent(5.049)).toBe("5.0%");
  });
  it("computes supervision % and dashes when there are no 97153 hours", () => {
    expect(supervisionPercent(7.75, 139)).toBeCloseTo(5.5755, 3);
    expect(supervisionPercent(3, 0)).toBeNull();
    expect(formatPercent(supervisionPercent(3, 0))).toBe("—");
  });
});

describe("Data Hub routing and report-page separation", () => {
  const appSrc = fs.readFileSync("src/App.tsx", "utf8");

  it("exposes /system/centralreach plus both aliases", () => {
    expect(appSrc).toContain('path="/system/centralreach"');
    expect(appSrc).toMatch(/path="\/system\/centralreach-uploads"[\s\S]{0,160}\/system\/centralreach/);
    expect(appSrc).toMatch(/path="\/system\/centralreach-data-hub"[\s\S]{0,160}\/system\/centralreach/);
  });

  it("keeps upload controls out of the primary CentralReach report pages", () => {
    const primaryReportFiles = [
      "BcbaProductivityReportV3.tsx",
      "CancellationCommandCenter.tsx",
    ];
    primaryReportFiles.forEach((file) => {
      const src = fs.readFileSync(`src/pages/os/reports/${file}`, "utf8");
      expect(src, `${file} must not render an upload input`).not.toMatch(/type="file"/);
      expect(src, `${file} must not import upload helpers`).not.toMatch(/uploadSharedReportDataset|appendBcbaProductivityUpload/);
    });
  });
});