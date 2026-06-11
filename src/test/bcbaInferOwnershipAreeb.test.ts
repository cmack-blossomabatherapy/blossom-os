import { describe, it, expect } from "vitest";
import { inferAssignmentHistory, type InferBillingRow } from "@/lib/os/bcbaProductivityV3/inferAssignments";

function mk(date: string, bcba: string, code: string): InferBillingRow {
  return {
    clientId: "AREEB",
    clientName: "Areeb Hasan",
    renderingProvider: bcba,
    providerLabels: "BCBA",
    code,
    hours: 1,
    date,
  };
}

// Helper: which BCBA owns a given date according to inferred assignments.
function ownerOn(assignments: ReturnType<typeof inferAssignmentHistory>["assignments"], iso: string) {
  const owners = assignments.filter(a =>
    a.clientName === "Areeb Hasan" &&
    a.startDate <= iso &&
    (a.endDate === null || a.endDate >= iso),
  );
  return owners.map(a => a.bcbaName);
}

describe("inferAssignmentHistory — Areeb Hasan ownership (month-aware)", () => {
  const rows: InferBillingRow[] = [
    mk("2026-01-05", "Zestine Roberts", "97155"),
    mk("2026-02-06", "Zestine Roberts", "97155"),
    mk("2026-02-27", "Zestine Roberts", "97155"),
    mk("2026-03-21", "Brandy Roden", "97155"),
    mk("2026-03-30", "Brandy Roden", "97151"),
    mk("2026-03-30", "Brandy Roden", "97155"),
    mk("2026-03-31", "Brandy Roden", "97151"),
    mk("2026-04-01", "Brandy Roden", "97151"),
    mk("2026-04-02", "Brandy Roden", "97151"),
    mk("2026-04-03", "Brandy Roden", "97151"),
    mk("2026-04-10", "Zestine Roberts", "97155"),
    mk("2026-04-29", "Zestine Roberts", "97155"),
    mk("2026-05-06", "Zestine Roberts", "97155"),
    mk("2026-05-27", "Zestine Roberts", "97155"),
  ];

  const { assignments } = inferAssignmentHistory(rows);

  it("March 2026 belongs entirely to Brandy Roden (no Zestine)", () => {
    for (const day of ["2026-03-01", "2026-03-15", "2026-03-21", "2026-03-31"]) {
      const o = ownerOn(assignments, day);
      expect(o).toEqual(["Brandy Roden"]);
    }
  });

  it("April 1-9, 2026 belongs to Brandy Roden", () => {
    for (const day of ["2026-04-01", "2026-04-05", "2026-04-09"]) {
      expect(ownerOn(assignments, day)).toEqual(["Brandy Roden"]);
    }
  });

  it("April 10 onward belongs to Zestine Roberts", () => {
    for (const day of ["2026-04-10", "2026-04-30", "2026-05-27"]) {
      expect(ownerOn(assignments, day)).toEqual(["Zestine Roberts"]);
    }
  });

  it("Zestine Roberts owns January and February (her first run)", () => {
    expect(ownerOn(assignments, "2026-01-05")).toEqual(["Zestine Roberts"]);
    expect(ownerOn(assignments, "2026-02-27")).toEqual(["Zestine Roberts"]);
    expect(ownerOn(assignments, "2026-02-28")).toEqual(["Zestine Roberts"]);
  });
});