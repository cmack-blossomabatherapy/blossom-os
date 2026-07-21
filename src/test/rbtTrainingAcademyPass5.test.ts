import { describe, it, expect, beforeEach } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p: string) => readFileSync(join(root, p), "utf8");

describe("RBT Training Academy Pass 5 — files and wiring", () => {
  it("data layer files exist", () => {
    expect(existsSync(join(root, "src/lib/training/rbtAcademy.ts"))).toBe(true);
    expect(existsSync(join(root, "src/lib/training/rbtReadiness.ts"))).toBe(true);
    expect(existsSync(join(root, "src/lib/training/rbtResources.ts"))).toBe(true);
    expect(existsSync(join(root, "src/lib/training/rbtCompetency.ts"))).toBe(true);
    expect(existsSync(join(root, "src/lib/training/rbtModuleContent.ts"))).toBe(true);
    expect(existsSync(join(root, "src/components/training/CompetencyPanel.tsx"))).toBe(true);
  });

  it("universal LMS routes are registered (academy + path + day + module + state-director + bcba)", () => {
    const src = read("src/App.tsx");
    expect(src).toMatch(/path="\/academy"/);
    expect(src).toMatch(/path="\/academy\/path\/:slug"/);
    expect(src).toMatch(/path="\/academy\/path\/:slug\/day\/:dayId"/);
    expect(src).toMatch(/path="\/academy\/path\/:slug\/module\/:moduleId"/);
    expect(src).toMatch(/\/training/); // state-director redirect target
    expect(src).toMatch(/BCBATrainingAcademy|\/academy\/path\/:slug/);
  });

  it("track query string is read and preserved across academy pages", () => {
    const detail  = read("src/pages/academy/TrainingPathDetail.tsx");
    const day     = read("src/pages/academy/TrainingPathDayDetail.tsx");
    const runtime = read("src/pages/academy/TrainingModuleRuntime.tsx");
    for (const src of [detail, day, runtime]) {
      expect(src).toMatch(/useSearchParams/);
      expect(src).toMatch(/track/);
    }
    expect(detail).toMatch(/buildPathJourney\(/);
    expect(day).toMatch(/trackSuffix/);
    expect(runtime).toMatch(/trackSuffix/);
  });

  it("OSRBTTrainingAcademy deep-links into the universal LMS with the selected track", () => {
    const src = read("src/pages/os/OSRBTTrainingAcademy.tsx");
    expect(src).toMatch(/\/academy\/path\/rbt\?track=\$\{assignedId\}/);
    expect(src).toMatch(/Open the full LMS journey/);
  });

  it("OSRBTReadinessBoard renders the competency panel + roll-up + per-track deep links", () => {
    const src = read("src/pages/os/OSRBTReadinessBoard.tsx");
    expect(src).toMatch(/CompetencyPanel/);
    expect(src).toMatch(/RBT roll-up/);
    expect(src).toMatch(/\/academy\/path\/rbt\?track=\$\{t\.pathId\}/);
  });
});

describe("RBT four tracks — meeting-notes phase coverage", () => {
  const rbtAcademy = read("src/lib/training/rbtAcademy.ts");

  it("all four track ids exist", () => {
    for (const id of ["not_certified", "certified_no_experience", "certified_under_2yrs", "certified_2yrs_plus"]) {
      expect(rbtAcademy).toMatch(new RegExp(`id:\\s*"${id}"`));
    }
  });

  it("Not Certified path includes the meeting-defined phases", () => {
    for (const phrase of [
      "Classroom and Role Play Training",
      "Client-Based Competency Training",
      "Knowledge Assessment",
      "Shadowing and Documentation Review",
      "Full Session Participation",
      "BCBA Oversight and Final Readiness",
      "Assistance Test",
      "Data Collection",
      "Session Notes Documentation",
    ]) {
      expect(rbtAcademy).toContain(phrase);
    }
  });

  it("Under-2-years path includes Implementation Evaluation, ABA Concept Check, conditional gap modules, and Day 2 BCBA Supervision", () => {
    expect(rbtAcademy).toContain("Implementation Evaluation");
    expect(rbtAcademy).toContain("ABA Concept Check");
    expect(rbtAcademy).toContain("Lead RBT Support Session");
    expect(rbtAcademy).toContain("ABA Explained Gap Module");
    expect(rbtAcademy).toContain("Day 2 BCBA Supervision");
    // Branching wired into u2-e1.
    expect(rbtAcademy).toMatch(/branching:\s*\{/);
  });

  it("Certified 2+ years path includes documentation, safety, parent comms, client-specific review, signoff, and mentor track", () => {
    for (const phrase of [
      "Blossom Documentation Standards",
      "Safety and Escalations",
      "Parent Communication and Boundaries",
      "Client-Specific Protocol Review",
      "Experienced RBT Readiness Signoff",
      "Mentoring newer RBTs",
    ]) {
      expect(rbtAcademy).toContain(phrase);
    }
  });
});

describe("RBT module runtime content", () => {
  const content = read("src/lib/training/rbtModuleContent.ts");

  it("includes every key RBT module id from the spec", () => {
    for (const id of [
      "welcome-1", "welcome-2", "welcome-3",
      "nc-c1", "nc-c2", "nc-c3", "nc-c4",
      "nc-cp1", "nc-cp2",
      "nc-k1", "nc-k2", "nc-k3",
      "nc-s1", "nc-s2", "nc-fs1", "nc-b1",
      "ne-p1", "ne-a1", "ne-f1", "ne-d1", "ne-r1", "ne-s1", "ne-fs1", "ne-b1",
      "u2-e1", "u2-c1", "u2-g1", "u2-g2", "u2-b1",
      "ex-d1", "ex-s1", "ex-p1", "ex-c1", "ex-r1", "ex-o1", "ex-o2", "ex-o3",
    ]) {
      expect(content).toMatch(new RegExp(`"${id}":\\s*\\{`));
    }
  });

  it("Assistance Test references Hannah / RBT Trainer in trainer notes", () => {
    expect(content).toMatch(/Assistance Test is administered by Hannah/);
  });

  it("Mock session note review references Anju", () => {
    expect(content).toMatch(/reviewed by Anju/);
  });

  it("runtime page resolves real RBT content (not just title + stub)", () => {
    const runtime = read("src/pages/academy/TrainingModuleRuntime.tsx");
    expect(runtime).toMatch(/getRbtModuleContent/);
    expect(runtime).toMatch(/trainerNotes/);
    expect(runtime).toMatch(/reflectionPrompt/);
    expect(runtime).toMatch(/signoffRequired/);
  });
});

describe("2026 RBT Initial Competency Assessment — model and rules", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("blossom.rbt.competency.v1");
    }
  });

  it("declares all 19 tasks with allowed assessment types", async () => {
    const { COMPETENCY_TASKS } = await import("@/lib/training/rbtCompetency");
    expect(COMPETENCY_TASKS).toHaveLength(19);
    const interview = COMPETENCY_TASKS.filter((t) => t.allowed.includes("Interview"));
    // Items 13, 15, 16, 17, 18, 19 permit interview.
    expect(interview.map((t) => t.number).sort((a, b) => a - b)).toEqual([13, 15, 16, 17, 18, 19]);
  });

  it("enforces ≥3 With-Client demonstrations in items 6–14 before final pass", async () => {
    const { emptyCompetencyRecord, validateCompetency } = await import("@/lib/training/rbtCompetency");
    const r = emptyCompetencyRecord("t-1", "not_certified");
    // mark every task competent in role-play (no with-client)
    r.tasks = r.tasks.map((t) => ({ ...t, status: "Competent", assessmentType: "Role-Play", dateAssessed: "2026-06-15" }));
    // Items 16-19 are interview-only — set them to Interview.
    for (const n of [16, 17, 18, 19]) {
      const i = r.tasks.findIndex((t) => t.number === n);
      r.tasks[i] = { ...r.tasks[i], assessmentType: "Interview" };
    }
    r.fortyHourCompletedAt = "2026-05-01";
    r.certificationApplicationTargetDate = "2026-07-01";
    r.responsible = { name: "Dr. Lin Chen", credential: "BCBA", supervisionTrainingComplete: true, organizationRelationship: "Direct employer / supervisor" };
    const v = validateCompetency(r);
    expect(v.ok).toBe(false);
    expect(v.blockers.join("\n")).toMatch(/With Client/);

    // Flip 3 of items 6-14 to With Client → passes the with-client rule.
    for (const n of [6, 7, 8]) {
      const i = r.tasks.findIndex((t) => t.number === n);
      r.tasks[i] = { ...r.tasks[i], assessmentType: "With Client" };
    }
    const v2 = validateCompetency(r);
    expect(v2.withClientCount).toBe(3);
    expect(v2.blockers.find((b) => /With Client/.test(b))).toBeUndefined();
  });

  it("requires 40-hour training and a valid 90-day window before final pass", async () => {
    const { emptyCompetencyRecord, validateCompetency, ASSESSMENT_WINDOW_DAYS } = await import("@/lib/training/rbtCompetency");
    expect(ASSESSMENT_WINDOW_DAYS).toBe(90);

    const r = emptyCompetencyRecord("t-2", "not_certified");
    const v = validateCompetency(r);
    expect(v.ok).toBe(false);
    expect(v.blockers.join("\n")).toMatch(/40-hour/);

    r.fortyHourCompletedAt = "2026-05-01";
    r.certificationApplicationTargetDate = "2026-07-01";
    r.tasks = r.tasks.map((t) => ({
      ...t,
      status: "Competent",
      assessmentType: t.number >= 16 ? "Interview" : (t.number >= 6 && t.number <= 8 ? "With Client" : "Role-Play"),
      // Outside the 90-day window.
      dateAssessed: "2026-01-01",
    }));
    r.responsible = { name: "Dr. Lin Chen", credential: "BCBA", supervisionTrainingComplete: true, organizationRelationship: "Direct employer / supervisor" };
    const v2 = validateCompetency(r);
    expect(v2.inWindow).toBe(false);
    expect(v2.blockers.join("\n")).toMatch(/90 days/);
  });
});

describe("Readiness gating", () => {
  it("Not Certified summary surfaces the competency blocker", async () => {
    if (typeof window !== "undefined") window.localStorage.clear();
    const { getTrainees, summarize } = await import("@/lib/training/rbtReadiness");
    const notCertified = getTrainees().find((t) => t.pathId === "not_certified");
    expect(notCertified).toBeDefined();
    const s = summarize(notCertified!);
    // Without a complete competency record, never independently ready.
    expect(s.independentReady).toBe(false);
    expect(s.missing.join("\n")).toMatch(/Initial Competency Assessment/);
  });
});

describe("Resources — 2026 RBT Initial Competency Assessment resources present", () => {
  it("rbtResources.ts exposes the 2026 Initial Competency Assessment resources in the certification category", () => {
    const src = read("src/lib/training/rbtResources.ts");
    // Contract: at least one certification resource whose title covers the 2026 ICA.
    expect(src).toMatch(/2026 RBT Initial Competency Assessment/);
    expect(src).toMatch(/category:\s*"certification"/);
  });
});