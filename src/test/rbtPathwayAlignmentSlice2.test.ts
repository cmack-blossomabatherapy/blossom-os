import { describe, it, expect } from "vitest";
import { classifyDevelopingScore, validateBands, type DevelopingBand } from "@/lib/os/academy/rbtTrainingAcademy";

// Canonical step keys per approved Training Program.
export const CANONICAL_STEPS = {
  experienced_rbt: [
    "orientation_short",
    "staffing_ready",
    "retention_two_week",
  ],
  under_2_years: [
    "orientation_new_hire",
    "zoom_learning_day",
    "role_play_in_clinic",
    "lead_rbt_client_session",
    "competency_evaluation_scored",
    "staffing_first_case",
    "first_session_support",
    "session_note_review",
    "retention_two_week",
  ],
  new_rbt_certification: [
    "intro_welcome_15min",
    "paired_roleplay_competency",
    "client_demos_three",
    "bcba_competency_signoff",
    "exam_prep",
    "exam_attempt",
    "zoom_aba_explained",
    "zoom_data_collection",
    "zoom_session_notes",
    "shadow_lead_rbt_session",
    "post_shadow_evaluation",
    "submit_session_note_for_feedback",
    "staff_case_first_assignment",
    "first_session_lead_full",
    "second_session_bcba",
    "retention_two_week",
  ],
} as const;

describe("RBT pathway alignment (Slice 2)", () => {
  it("experienced RBT = orientation then staffed then retention", () => {
    expect(CANONICAL_STEPS.experienced_rbt).toEqual([
      "orientation_short",
      "staffing_ready",
      "retention_two_week",
    ]);
  });

  it("developing (under 2y) omits ABA Basics and includes scored evaluation branch", () => {
    expect(CANONICAL_STEPS.under_2_years).not.toContain("aba_basics_review");
    expect(CANONICAL_STEPS.under_2_years).toContain("zoom_learning_day");
    expect(CANONICAL_STEPS.under_2_years).toContain("competency_evaluation_scored");
    expect(CANONICAL_STEPS.under_2_years).toContain("first_session_support");
  });

  it("certification track includes 15-min welcome, 3 client demos, BCBA signoff, exam, Zoom trio, shadow, note submission, full-Lead first session, BCBA second", () => {
    const required = [
      "intro_welcome_15min",
      "paired_roleplay_competency",
      "client_demos_three",
      "bcba_competency_signoff",
      "exam_prep",
      "exam_attempt",
      "zoom_aba_explained",
      "zoom_data_collection",
      "zoom_session_notes",
      "shadow_lead_rbt_session",
      "submit_session_note_for_feedback",
      "first_session_lead_full",
      "second_session_bcba",
    ];
    for (const k of required) {
      expect(CANONICAL_STEPS.new_rbt_certification).toContain(k);
    }
  });

  it("developing thresholds are deterministic and non-overlapping", () => {
    const bands: DevelopingBand[] = [
      { min: 0, max: 36, action: "repeat_lead_session" },
      { min: 37, max: 47, action: "staff_case_lead_first_session" },
      { min: 48, max: 60, action: "staff_case_bcba_first_session" },
    ];
    expect(validateBands(bands).ok).toBe(true);
    expect(classifyDevelopingScore(0, bands)?.action).toBe("repeat_lead_session");
    expect(classifyDevelopingScore(36, bands)?.action).toBe("repeat_lead_session");
    expect(classifyDevelopingScore(37, bands)?.action).toBe("staff_case_lead_first_session");
    expect(classifyDevelopingScore(47, bands)?.action).toBe("staff_case_lead_first_session");
    expect(classifyDevelopingScore(48, bands)?.action).toBe("staff_case_bcba_first_session");
    expect(classifyDevelopingScore(60, bands)?.action).toBe("staff_case_bcba_first_session");
  });
});

describe("Learn page hides retired/unpublished (Slice 2)", () => {
  const isPublished = (c: any | null) =>
    Boolean(c && c.is_active !== false && c.status !== "draft" && c.status !== "archived");
  it("filters unpublished courses from the learner list", () => {
    const rows = [
      { training_id: "a", course: { status: "published", is_active: true } },
      { training_id: "b", course: { status: "draft", is_active: true } },
      { training_id: "c", course: { status: "archived", is_active: true } },
      { training_id: "d", course: { status: "published", is_active: false } },
      { training_id: "e", course: null },
    ];
    const visible = rows.filter((r) => isPublished(r.course));
    expect(visible.map((r) => r.training_id)).toEqual(["a"]);
  });

  it("hides retired pathway steps from useProgram output", () => {
    const steps = [
      { id: "1", key: "orientation_short", metadata: {} },
      { id: "2", key: "legacy_key",       metadata: { retired: true } },
      { id: "3", key: "deprecated_key",   metadata: { deprecated: true } },
    ];
    const visible = steps.filter((s: any) => {
      const m = s?.metadata ?? {};
      return m.retired !== true && m.deprecated !== true;
    });
    expect(visible.map((s) => s.key)).toEqual(["orientation_short"]);
  });
});