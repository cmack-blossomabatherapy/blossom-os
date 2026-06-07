import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  computeSDReadinessCategories,
  computeLaunchChecklist,
  buildReadinessSummaryText,
} from "@/lib/academy/leadershipReadiness";

const read = (p: string) =>
  fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("SD Academy Command View — readiness fields", () => {
  const src = read("src/pages/hr/academy/LeadershipDashboard.tsx");

  it("renders all required readiness fields on the dashboard", () => {
    expect(src).toMatch(/Quiz avg/);
    expect(src).toMatch(/SOPs done/);
    expect(src).toMatch(/Videos watched/);
    expect(src).toMatch(/Shadow hours/);
    expect(src).toMatch(/Check-ins/);
    expect(src).toMatch(/Mentor check-ins/);
    expect(src).toMatch(/Final sign-off/);
    expect(src).toMatch(/Certification/);
    expect(src).toMatch(/Wk \{row\.weekNumber\} · Day \{row\.dayNumber\}/);
  });

  it("exposes leadership management actions", () => {
    expect(src).toMatch(/Assign mentor/);
    expect(src).toMatch(/Assign state/);
    expect(src).toMatch(/Open learner profile/);
    expect(src).toMatch(/Log check-in/);
    expect(src).toMatch(/Log shadow session/);
    expect(src).toMatch(/Request sign-off/);
    expect(src).toMatch(/Mark certification complete/);
  });

  it("control room references the State Director readiness model", () => {
    const cr = read("src/components/training/TrainingControlRoom.tsx");
    expect(cr).toMatch(/computeSDReadinessCategories/);
    expect(cr).toMatch(/computeLaunchChecklist/);
    expect(cr).toMatch(/computeRiskSignals/);
  });
});

describe("SD Academy Command View — copy readiness summary content", () => {
  it("includes week/day, readiness %, shadow hours, check-ins, and certification status", () => {
    const cats = computeSDReadinessCategories({
      modules: [], progress: [], shadowSessions: [], checkins: [],
      weeksByModuleId: new Map(),
    });
    const checklist = computeLaunchChecklist(cats, {
      welcomeComplete: false, readinessPct: 35, checkinCount: 1,
    });
    const text = buildReadinessSummaryText({
      traineeName: "Sam Director",
      state: "TN",
      readinessPct: 35,
      cats,
      checklist,
      risks: [],
      nextAction: "Schedule shadow",
      weekNumber: 2,
      dayNumber: 7,
      shadowHours: 2.5,
      checkinCount: 1,
      certificationStatus: "not_started",
      setupGaps: ["Mentor assigned"],
    });
    expect(text).toMatch(/Week 2 · Day 7/);
    expect(text).toMatch(/Readiness: 35%/);
    expect(text).toMatch(/2\.5h shadowing/);
    expect(text).toMatch(/1 mentor check-ins/);
    expect(text).toMatch(/Certification: not started/);
    expect(text).toMatch(/Setup gaps: Mentor assigned/);
  });
});

describe("SD Academy Command View — certification gating", () => {
  function baseCats() {
    return computeSDReadinessCategories({
      modules: [], progress: [], shadowSessions: [], checkins: [],
      weeksByModuleId: new Map(),
    });
  }

  it("is not complete until welcome, knowledge, readiness ≥ 80, and sign-off all complete", () => {
    // No signoff, no readiness, no welcome → not_started
    const cats = baseCats();
    const checklist = computeLaunchChecklist(cats, {
      welcomeComplete: false, readinessPct: 0, checkinCount: 0,
    });
    const cert = checklist.find((c) => c.key === "certification")!;
    expect(cert.status).toBe("not_started");
    expect(cert.explanation).toMatch(/welcome module/);
    expect(cert.explanation).toMatch(/readiness/);
    expect(cert.explanation).toMatch(/sign-off/);
  });

  it("remains not_started even at 100% readiness if signoff is missing", () => {
    const checklist = computeLaunchChecklist(baseCats(), {
      welcomeComplete: true, readinessPct: 100, checkinCount: 5,
    });
    const cert = checklist.find((c) => c.key === "certification")!;
    expect(cert.status).toBe("not_started");
    expect(cert.explanation).toMatch(/sign-off/);
  });
});

describe("SD Academy Command View — setup gaps surface in summary", () => {
  it("lists setup gaps when employee link, enrollment, mentor or state is missing", () => {
    const cats = computeSDReadinessCategories({
      modules: [], progress: [], shadowSessions: [], checkins: [],
      weeksByModuleId: new Map(),
    });
    const checklist = computeLaunchChecklist(cats, {
      welcomeComplete: false, readinessPct: 0, checkinCount: 0,
    });
    const text = buildReadinessSummaryText({
      traineeName: "Pat",
      state: "",
      readinessPct: 0,
      cats, checklist, risks: [],
      nextAction: "—",
      setupGaps: ["Mentor assigned", "State assigned", "Employee linked"],
    });
    expect(text).toMatch(/Setup gaps: Mentor assigned, State assigned, Employee linked/);
  });
});