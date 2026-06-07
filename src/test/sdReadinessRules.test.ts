import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  computeSDReadinessCategories,
  computeLaunchChecklist,
  computeReadinessBlockers,
  isCertificationReady,
  buildReadinessSummaryText,
  type LaunchChecklistContext,
} from "@/lib/academy/leadershipReadiness";
import type { AcademyModule, AcademyProgress } from "@/lib/academy/types";

/* ---- fixture helpers ---- */

function mod(id: string, week: number, opts: Partial<AcademyModule> = {}): AcademyModule {
  return {
    id,
    week_id: `w${week}`,
    title: id,
    module_type: "sop",
    is_required: true,
    estimated_minutes: 20,
    position: 0,
    ...opts,
  } as any;
}

function prog(module_id: string, status: AcademyProgress["status"], score?: number): AcademyProgress {
  return {
    id: `p-${module_id}`,
    enrollment_id: "e1",
    module_id,
    status,
    score: score ?? null,
    started_at: null, completed_at: null, verified_at: null,
    notes: null, reflection: null,
  } as any;
}

function buildAllComplete() {
  const modules: AcademyModule[] = [];
  const weeksByModuleId = new Map<string, number>();
  for (let w = 1; w <= 5; w++) {
    for (let i = 0; i < 2; i++) {
      const m = mod(`w${w}m${i}`, w);
      modules.push(m);
      weeksByModuleId.set(m.id, w);
    }
  }
  // Shadow modules in week 4
  const shadowA = mod("shadowA", 4, { module_type: "shadowing" });
  const shadowB = mod("shadowB", 4, { module_type: "shadowing" });
  modules.push(shadowA, shadowB);
  weeksByModuleId.set(shadowA.id, 4);
  weeksByModuleId.set(shadowB.id, 4);

  // Quiz module in week 5
  const quiz = mod("quizFinal", 5, { module_type: "quiz" });
  modules.push(quiz);
  weeksByModuleId.set(quiz.id, 5);

  const progress: AcademyProgress[] = modules.map((m) => prog(m.id, "completed"));
  // give the quiz a high score
  const quizProg = progress.find((p) => p.module_id === "quizFinal")!;
  quizProg.score = 95 as any;

  return { modules, weeksByModuleId, progress, quiz, shadowA, shadowB };
}

/* ---- tests ---- */

describe("State Director strict certification rules", () => {
  it("certification is NOT ready when required quiz score is below 80%", () => {
    const fx = buildAllComplete();
    const cats = computeSDReadinessCategories({
      modules: fx.modules, progress: fx.progress,
      shadowSessions: [{ hours: 10, mentor_signoff: true } as any],
      checkins: [{} as any, {} as any, {} as any],
      weeksByModuleId: fx.weeksByModuleId,
    });
    const ctx: LaunchChecklistContext = {
      welcomeComplete: true, readinessPct: 90, checkinCount: 3,
      quizScores: [60], requiredQuizCount: 1,
      shadowSignoffComplete: true,
      finalKnowledgeReviewComplete: true,
      readinessAssessmentComplete: true,
      leadershipSignoffComplete: true,
      certificationModuleComplete: true,
    };
    const checklist = computeLaunchChecklist(cats, ctx);
    expect(isCertificationReady(checklist)).toBe(false);
    const blockers = computeReadinessBlockers(checklist);
    expect(blockers.some((b) => /Knowledge checks/i.test(b.label))).toBe(true);
  });

  it("certification is NOT ready when required shadow sign-offs are missing", () => {
    const fx = buildAllComplete();
    const cats = computeSDReadinessCategories({
      modules: fx.modules, progress: fx.progress,
      shadowSessions: [{ hours: 10, mentor_signoff: false } as any],
      checkins: [{} as any, {} as any, {} as any],
      weeksByModuleId: fx.weeksByModuleId,
    });
    const checklist = computeLaunchChecklist(cats, {
      welcomeComplete: true, readinessPct: 90, checkinCount: 3,
      quizScores: [90], requiredQuizCount: 1,
      shadowSignoffComplete: false,
      finalKnowledgeReviewComplete: true,
      readinessAssessmentComplete: true,
      leadershipSignoffComplete: true,
      certificationModuleComplete: true,
    });
    expect(isCertificationReady(checklist)).toBe(false);
    const blockers = computeReadinessBlockers(checklist);
    expect(blockers.some((b) => /sign-off/i.test(b.label))).toBe(true);
  });

  it("certification is NOT ready when mentor check-ins are missing", () => {
    const fx = buildAllComplete();
    const cats = computeSDReadinessCategories({
      modules: fx.modules, progress: fx.progress,
      shadowSessions: [{ hours: 10, mentor_signoff: true } as any],
      checkins: [{} as any],
      weeksByModuleId: fx.weeksByModuleId,
    });
    const checklist = computeLaunchChecklist(cats, {
      welcomeComplete: true, readinessPct: 90, checkinCount: 1,
      quizScores: [90], requiredQuizCount: 1,
      shadowSignoffComplete: true,
      finalKnowledgeReviewComplete: true,
      readinessAssessmentComplete: true,
      leadershipSignoffComplete: true,
      certificationModuleComplete: true,
    });
    expect(isCertificationReady(checklist)).toBe(false);
    expect(computeReadinessBlockers(checklist).some((b) => /Mentor check-ins/i.test(b.label))).toBe(true);
  });

  it("certification is NOT ready when the certification module is not complete", () => {
    const fx = buildAllComplete();
    const cats = computeSDReadinessCategories({
      modules: fx.modules, progress: fx.progress,
      shadowSessions: [{ hours: 10, mentor_signoff: true } as any],
      checkins: [{} as any, {} as any, {} as any],
      weeksByModuleId: fx.weeksByModuleId,
    });
    const checklist = computeLaunchChecklist(cats, {
      welcomeComplete: true, readinessPct: 90, checkinCount: 3,
      quizScores: [95], requiredQuizCount: 1,
      shadowSignoffComplete: true,
      finalKnowledgeReviewComplete: true,
      readinessAssessmentComplete: true,
      leadershipSignoffComplete: true,
      certificationModuleComplete: false,
    });
    expect(isCertificationReady(checklist)).toBe(false);
    expect(computeReadinessBlockers(checklist).some((b) => /Certification module/i.test(b.label))).toBe(true);
  });

  it("certification BECOMES ready when ALL gates are satisfied", () => {
    const fx = buildAllComplete();
    const cats = computeSDReadinessCategories({
      modules: fx.modules, progress: fx.progress,
      shadowSessions: [{ hours: 10, mentor_signoff: true } as any],
      checkins: [{} as any, {} as any, {} as any],
      weeksByModuleId: fx.weeksByModuleId,
    });
    const checklist = computeLaunchChecklist(cats, {
      welcomeComplete: true, readinessPct: 95, checkinCount: 3,
      quizScores: [95], requiredQuizCount: 1,
      shadowSignoffComplete: true,
      finalKnowledgeReviewComplete: true,
      readinessAssessmentComplete: true,
      leadershipSignoffComplete: true,
      certificationModuleComplete: true,
    });
    expect(isCertificationReady(checklist)).toBe(true);
    expect(computeReadinessBlockers(checklist).length).toBe(0);
  });

  it("readiness summary text includes blockers section", () => {
    const fx = buildAllComplete();
    const cats = computeSDReadinessCategories({
      modules: fx.modules, progress: fx.progress,
      shadowSessions: [], checkins: [],
      weeksByModuleId: fx.weeksByModuleId,
    });
    const checklist = computeLaunchChecklist(cats, {
      welcomeComplete: false, readinessPct: 40, checkinCount: 0,
      quizScores: [60], requiredQuizCount: 1,
      shadowSignoffComplete: false,
      finalKnowledgeReviewComplete: false,
      readinessAssessmentComplete: false,
      leadershipSignoffComplete: false,
      certificationModuleComplete: false,
    });
    const text = buildReadinessSummaryText({
      traineeName: "Test Trainee", state: "NC",
      readinessPct: 40, cats, checklist, risks: [],
      nextAction: "Complete welcome module",
    });
    expect(text).toMatch(/Not ready because/);
    expect(text).toMatch(/Knowledge checks/);
    expect(text).toMatch(/Welcome to Blossom/);
  });
});

/* ---- dashboard wiring ---- */

const dashboardSrc = fs.readFileSync(
  path.join(process.cwd(), "src/pages/hr/academy/LeadershipDashboard.tsx"),
  "utf8",
);

describe("Leadership dashboard wiring", () => {
  it("imports the strict readiness helpers", () => {
    expect(dashboardSrc).toMatch(/computeReadinessBlockers/);
    expect(dashboardSrc).toMatch(/isCertificationReady/);
  });
  it("passes strict gating fields into computeLaunchChecklist", () => {
    for (const field of [
      "quizScores",
      "quizPassThreshold",
      "requiredCheckinCount",
      "shadowSignoffComplete",
      "finalKnowledgeReviewComplete",
      "readinessAssessmentComplete",
      "leadershipSignoffComplete",
      "certificationModuleComplete",
    ]) {
      expect(dashboardSrc, `missing ${field}`).toContain(field);
    }
  });
  it("renders the 'Not ready because…' blockers panel", () => {
    expect(dashboardSrc).toMatch(/data-testid="sd-not-ready-because"/);
    expect(dashboardSrc).toMatch(/Not ready because/);
  });
});