import { describe, it, expect } from "vitest";
import {
  SD_MODULE_SOP_LINKS,
  getSopTitleForModule,
} from "@/lib/training/stateDirectorModuleSopMap";

describe("State Director module → SOP map", () => {
  it("uses real slugified module ids (no posN placeholders)", () => {
    for (const link of SD_MODULE_SOP_LINKS) {
      expect(link.moduleId).toMatch(/^sd-w\dd\d-[a-z0-9-]+$/);
      expect(link.moduleId).not.toMatch(/-pos\d+$/);
    }
  });

  it("Week 1 Day 2 modules map to the correct SOPs", () => {
    expect(getSopTitleForModule("sd-w1d2-company-structure"))
      .toBe("Understanding Blossom Organizational Structure SOP");
    expect(getSopTitleForModule("sd-w1d2-department-overview"))
      .toBe("Department Functions & Operational Ecosystem SOP");
    expect(getSopTitleForModule("sd-w1d2-state-director-role-overview"))
      .toBe("State Director Role & Responsibilities SOP");
    expect(getSopTitleForModule("sd-w1d2-leadership-expectations"))
      .toBe("Leadership Expectations for State Directors SOP");
  });

  it("welcome / W1D1 modules have no SOP mapping", () => {
    const w1d1 = SD_MODULE_SOP_LINKS.filter((l) => l.week === 1 && l.day === 1);
    expect(w1d1.length).toBeGreaterThan(0);
    for (const l of w1d1) expect(l.sopTitle).toBeNull();
  });

  it("links cover every SD journey module", () => {
    expect(SD_MODULE_SOP_LINKS.length).toBeGreaterThan(90);
  });
});