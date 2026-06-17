import { describe, it, expect } from "vitest";
import {
  normalizeUsState,
  resolveRowState,
} from "@/lib/os/bcbaProductivityV3/stateNormalization";

describe("BCBA Productivity V3 - state normalization", () => {
  it("normalizes full state names and abbreviations to USPS codes", () => {
    expect(normalizeUsState("GA")).toBe("GA");
    expect(normalizeUsState("ga")).toBe("GA");
    expect(normalizeUsState("Georgia")).toBe("GA");
    expect(normalizeUsState("georgia")).toBe("GA");
    expect(normalizeUsState("Tennessee")).toBe("TN");
    expect(normalizeUsState("TN")).toBe("TN");
    expect(normalizeUsState("North Carolina")).toBe("NC");
    expect(normalizeUsState("Virginia")).toBe("VA");
    expect(normalizeUsState("Maryland")).toBe("MD");
  });

  it("returns empty string for blank, null, or unknown values", () => {
    expect(normalizeUsState("")).toBe("");
    expect(normalizeUsState(null)).toBe("");
    expect(normalizeUsState(undefined)).toBe("");
    expect(normalizeUsState("Atlantis")).toBe("");
  });

  it("falls back from blank ClientLocationStateProvince to ServiceLocationStateProvince", () => {
    const raw = {
      ClientLocationStateProvince: "",
      ServiceLocationStateProvince: "Georgia",
    };
    expect(resolveRowState(raw)).toBe("GA");
  });

  it("respects column priority order", () => {
    const raw = {
      ClientLocationStateProvince: "TN",
      ServiceLocationStateProvince: "Georgia",
      State: "VA",
    };
    expect(resolveRowState(raw)).toBe("TN");
  });

  it("falls back through ClientState / ServiceState / State", () => {
    expect(
      resolveRowState({ ClientState: "tennessee" }),
    ).toBe("TN");
    expect(
      resolveRowState({ ServiceState: "NC" }),
    ).toBe("NC");
    expect(
      resolveRowState({ State: "Maryland" }),
    ).toBe("MD");
  });
});

describe("BCBA Productivity V3 - state filter behavior", () => {
  const rows = [
    { state: "GA" },
    { state: "Georgia" },
    { state: "georgia" },
    { state: "TN" },
    { state: "Tennessee" },
    { state: "NC" },
    { state: "" },
  ];

  it("dropdown options are clean USPS codes with no duplicates", () => {
    const set = new Set<string>();
    for (const r of rows) {
      const c = normalizeUsState(r.state);
      if (c) set.add(c);
    }
    expect([...set].sort()).toEqual(["GA", "NC", "TN"]);
  });

  it("selecting GA includes GA, Georgia, and georgia rows", () => {
    const selected = "GA";
    const matched = rows.filter((r) => normalizeUsState(r.state) === selected);
    expect(matched).toHaveLength(3);
  });

  it("selecting TN includes TN and Tennessee rows", () => {
    const selected = "TN";
    const matched = rows.filter((r) => normalizeUsState(r.state) === selected);
    expect(matched).toHaveLength(2);
  });
});