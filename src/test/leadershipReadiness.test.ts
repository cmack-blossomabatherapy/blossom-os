import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  computeSDReadinessCategories,
  computeLaunchChecklist,
  computeRiskSignals,
  buildReadinessSummaryText,
  RISK_LABEL,
  SD_CATEGORY_LABELS,
} from "@/lib/academy/leadershipReadiness";
import type {
  AcademyModule,
  AcademyProgress,
  AcademyShadowSession,
  AcademyCheckin,
  AcademyEnrollment,
} from "@/lib/academy/types";

function mod(id: string, week: number, opts: Partial<AcademyModule> = {}): AcademyModule {
  return {
    id, week_id: `w${week}`, position: 0, title: `Module ${id}`, description: null,
    module_type: "training", duration_label: null, leader_name: null,
    department: null, is_required: true, applies_to: "either",
    applies_to_new_state_only: false, quiz: null,
    ...opts,
  };
}

function progress(id: string, status: AcademyProgress["status"] = "completed"): AcademyProgress {
  return {
    id: `p-${id}`, enrollment_id: "e1", module_id: id, status,
    score: null, reflection: null, verified_by_name: null, verified_at: null,
    started_at: new Date().toISOString(), completed_at: status === "completed" ? new Date().toISOString() : null,
  };
}

describe("leadershipReadiness — SD categories", () => {
  it("returns all 8 State Director-specific categories", () => {
    const cats = computeSDReadinessCategories({
      modules: [], progress: [], shadowSessions: [], checkins: [],
      weeksByModuleId: new Map(),
    });
    const labels = cats.map((c) => c.label);
    for (const wanted of Object.values(SD_CATEGORY_LABELS)) {
      expect(labels).toContain(wanted);
    }
  });

  it("derives completion from required modules per week", () => {
    const mods = [mod("a", 1), mod("b", 1), mod("c", 2)];
    const weeks = new Map([["a", 1], ["b", 1], ["c", 2]]);
    const cats = computeSDReadinessCategories({
      modules: mods,
      progress: [progress("a")],
      shadowSessions: [],
      checkins: [],
      weeksByModuleId: weeks,
    });
    const foundations = cats.find((c) => c.key === "foundations")!;
    expect(foundations.completion).toBe(50);
    expect(foundations.status).toBe("in_progress");
  });
});

describe("leadershipReadiness — launch checklist", () => {
  it("includes all required launch items", () => {
    const cats = computeSDReadinessCategories({
      modules: [], progress: [], shadowSessions: [], checkins: [],
      weeksByModuleId: new Map(),
    });
    const list = computeLaunchChecklist(cats, {
      welcomeComplete: false, readinessPct: 0, checkinCount: 0,
    });
    const labels = list.map((c) => c.label);
    expect(labels).toEqual(expect.arrayContaining([
      "Welcome to Blossom complete",
      "Week 1 foundations complete",
      "Systems / client flow complete",
      "Authorizations / utilization complete",
      "Staffing / recruiting / operations complete",
      "State ownership / leadership complete",
      "Required shadowing complete",
      "Required mentor check-ins complete",
      "Final knowledge review complete",
      "Readiness assessment complete",
      "Leadership sign-off complete",
      "State Director certification complete",
    ]));
  });
});

describe("leadershipReadiness — risk signals", () => {
  it("flags missing mentor check-in, signoff pending, low readiness, week behind", () => {
    const cats = computeSDReadinessCategories({
      modules: [], progress: [], shadowSessions: [], checkins: [],
      weeksByModuleId: new Map(),
    });
    const enrollment = { path: "new_state", assigned_state: "GA" } as unknown as AcademyEnrollment;
    const risks = computeRiskSignals({
      progress: [], shadowSessions: [], checkins: [], cats,
      readinessPct: 10,
      enrollment,
      weeksByModuleId: new Map(),
      expectedWeekNumber: 1,
    });
    expect(risks).toEqual(expect.arrayContaining([
      "missing_shadowing",
      "missing_mentor_checkin",
      "signoff_pending",
      "low_readiness",
    ]));
  });

  it("exposes friendly labels for every risk", () => {
    for (const k of [
      "no_activity_3d", "week_behind_schedule", "missing_shadowing",
      "missing_mentor_checkin", "signoff_pending", "low_readiness",
      "required_modules_incomplete",
    ] as const) {
      expect(RISK_LABEL[k]).toBeTruthy();
    }
  });
});

describe("leadershipReadiness — summary text", () => {
  it("includes trainee, readiness, categories, next action and decision line", () => {
    const cats = computeSDReadinessCategories({
      modules: [], progress: [], shadowSessions: [],
      checkins: [] as AcademyCheckin[], weeksByModuleId: new Map(),
    });
    const checklist = computeLaunchChecklist(cats, {
      welcomeComplete: false, readinessPct: 0, checkinCount: 0,
    });
    const text = buildReadinessSummaryText({
      traineeName: "Jane Director", state: "GA", readinessPct: 42,
      cats, checklist, risks: ["low_readiness"],
      nextAction: "Schedule shadow session",
    });
    expect(text).toMatch(/State Director Readiness — Jane Director/);
    expect(text).toMatch(/Readiness: 42%/);
    expect(text).toMatch(/Category completion:/);
    expect(text).toMatch(/Next action: Schedule shadow session/);
    expect(text).toMatch(/Leadership decision needed:/);
  });
});

describe("LeadershipDashboard — source content", () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), "src/pages/hr/academy/LeadershipDashboard.tsx"),
    "utf8",
  );

  it("uses State Director readiness language", () => {
    expect(src).toMatch(/State Director Readiness/);
  });

  it("references launch checklist", () => {
    expect(src).toMatch(/Launch Readiness checklist/);
  });

  it("surfaces current focus and next action", () => {
    expect(src).toMatch(/Current focus/);
    expect(src).toMatch(/Next action/);
  });

  it("exposes a copy readiness summary action", () => {
    expect(src).toMatch(/Copy readiness summary/);
  });

  it("renders at-risk signals section", () => {
    expect(src).toMatch(/At-risk signals/);
  });
});