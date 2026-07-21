import { describe, it, expect } from "vitest";

// Mirrors src/pages/rbt/app/active/ActiveSchedule.tsx status filter logic.
function matchesFilter(row: { status?: string | null }, f: "all" | "active" | "cancelled"): boolean {
  const s = String(row.status ?? "").toLowerCase();
  if (f === "all") return true;
  if (f === "cancelled") return /cancel/.test(s);
  return !/cancel/.test(s);
}

// Mirrors src/pages/rbt/app/pages.tsx#RbtLearn isPublished gate for Continue CTA.
function isPublished(c: { is_active?: boolean; status?: string } | null): boolean {
  return Boolean(c && c.is_active !== false && c.status !== "draft" && c.status !== "archived");
}

describe("ActiveSchedule status filter", () => {
  const rows = [
    { status: "scheduled" },
    { status: "confirmed" },
    { status: "cancelled" },
    { status: "cancelled_late" },
    { status: null },
  ];

  it("returns every session for 'all'", () => {
    expect(rows.filter((r) => matchesFilter(r, "all"))).toHaveLength(rows.length);
  });

  it("excludes cancellations for 'active'", () => {
    expect(rows.filter((r) => matchesFilter(r, "active")).map((r) => r.status))
      .toEqual(["scheduled", "confirmed", null]);
  });

  it("only returns cancellations for 'cancelled'", () => {
    expect(rows.filter((r) => matchesFilter(r, "cancelled")).map((r) => r.status))
      .toEqual(["cancelled", "cancelled_late"]);
  });
});

describe("RbtLearn course publish gate", () => {
  it("hides Continue for missing course metadata", () => {
    expect(isPublished(null)).toBe(false);
  });
  it("hides Continue for draft or archived courses", () => {
    expect(isPublished({ status: "draft" })).toBe(false);
    expect(isPublished({ status: "archived" })).toBe(false);
  });
  it("hides Continue when course is deactivated", () => {
    expect(isPublished({ is_active: false, status: "published" })).toBe(false);
  });
  it("shows Continue only for active, published courses", () => {
    expect(isPublished({ is_active: true, status: "published" })).toBe(true);
    expect(isPublished({ status: "published" })).toBe(true);
  });
});

describe("Skill Passport acknowledgment gating", () => {
  // Mirrors canWrite = writableEmployeeId && !isPreviewing propagated to SkillSheet.
  function canWrite(writableEmployeeId: string | null, isPreviewing: boolean): boolean {
    return Boolean(writableEmployeeId) && !isPreviewing;
  }
  it("blocks writes when previewing another clinician", () => {
    expect(canWrite("emp-1", true)).toBe(false);
  });
  it("blocks writes with no writable identity", () => {
    expect(canWrite(null, false)).toBe(false);
  });
  it("allows writes for the authenticated clinician", () => {
    expect(canWrite("emp-1", false)).toBe(true);
  });
});