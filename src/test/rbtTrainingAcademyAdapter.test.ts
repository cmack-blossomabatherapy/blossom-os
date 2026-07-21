import { describe, expect, it } from "vitest";
import {
  classifyDevelopingScore,
  validateBands,
  type DevelopingBand,
} from "@/lib/os/academy/rbtTrainingAcademy";

const BANDS: DevelopingBand[] = [
  { min: 0, max: 36, action: "repeat_lead_session" },
  { min: 37, max: 47, action: "staff_case_lead_first_session" },
  { min: 48, max: 60, action: "staff_case_bcba_first_session" },
];

describe("rbtTrainingAcademy adapter — competency bands", () => {
  it("classifies scores deterministically at every band edge", () => {
    expect(classifyDevelopingScore(0, BANDS)?.action).toBe("repeat_lead_session");
    expect(classifyDevelopingScore(36, BANDS)?.action).toBe("repeat_lead_session");
    expect(classifyDevelopingScore(37, BANDS)?.action).toBe("staff_case_lead_first_session");
    expect(classifyDevelopingScore(47, BANDS)?.action).toBe("staff_case_lead_first_session");
    expect(classifyDevelopingScore(48, BANDS)?.action).toBe("staff_case_bcba_first_session");
    expect(classifyDevelopingScore(60, BANDS)?.action).toBe("staff_case_bcba_first_session");
  });

  it("returns null outside the covered range", () => {
    expect(classifyDevelopingScore(-1, BANDS)).toBeNull();
    expect(classifyDevelopingScore(61, BANDS)).toBeNull();
  });

  it("accepts contiguous bands and rejects overlaps or gaps", () => {
    expect(validateBands(BANDS).ok).toBe(true);
    expect(
      validateBands([
        { min: 0, max: 36, action: "repeat_lead_session" },
        { min: 36, max: 48, action: "staff_case_lead_first_session" }, // overlap on 36
      ]).ok,
    ).toBe(false);
    expect(
      validateBands([
        { min: 0, max: 36, action: "repeat_lead_session" },
        { min: 40, max: 60, action: "staff_case_bcba_first_session" }, // gap 37..39
      ]).ok,
    ).toBe(false);
  });
});