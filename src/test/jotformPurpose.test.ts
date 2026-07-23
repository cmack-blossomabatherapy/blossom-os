import { describe, it, expect } from "vitest";
import {
  JOTFORM_PURPOSES,
  normalizeJotformPurpose,
  purposeToRecordKind,
} from "../../supabase/functions/_shared/integrations/jotformPurpose";

describe("Jotform purpose contract", () => {
  it("exposes exactly the four canonical purposes", () => {
    expect([...JOTFORM_PURPOSES].sort()).toEqual(
      ["clinical_document", "hr", "intake", "recruiting"],
    );
  });

  it("normalizes canonical values as-is (case-insensitive)", () => {
    expect(normalizeJotformPurpose("intake")).toBe("intake");
    expect(normalizeJotformPurpose("Recruiting")).toBe("recruiting");
    expect(normalizeJotformPurpose(" HR ")).toBe("hr");
    expect(normalizeJotformPurpose("clinical_document")).toBe("clinical_document");
  });

  it("folds legacy aliases into the canonical set", () => {
    expect(normalizeJotformPurpose("lead")).toBe("intake");
    expect(normalizeJotformPurpose("form_submission")).toBe("intake");
    expect(normalizeJotformPurpose("candidate")).toBe("recruiting");
    expect(normalizeJotformPurpose("document")).toBe("clinical_document");
  });

  it("returns null for unknown / malformed input instead of silent default", () => {
    expect(normalizeJotformPurpose("unknown")).toBeNull();
    expect(normalizeJotformPurpose("")).toBeNull();
    expect(normalizeJotformPurpose(undefined as unknown as string)).toBeNull();
    expect(normalizeJotformPurpose(42 as unknown as string)).toBeNull();
  });

  it("maps intake to the `lead` record kind so the shared promotion path fires", () => {
    expect(purposeToRecordKind("intake")).toBe("lead");
  });

  it("maps recruiting/hr/clinical_document to non-lead kinds so promotion never mints leads for them", () => {
    expect(purposeToRecordKind("recruiting")).toBe("candidate");
    expect(purposeToRecordKind("clinical_document")).toBe("document");
    expect(purposeToRecordKind("hr")).toBe("document");
    expect(purposeToRecordKind(null)).toBe("unknown");
  });
});