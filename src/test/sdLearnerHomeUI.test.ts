import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const src = fs.readFileSync(
  path.join(process.cwd(), "src/components/training/SDLearnerHome.tsx"),
  "utf8",
);
const page = fs.readFileSync(
  path.join(process.cwd(), "src/pages/os/OSTraining.tsx"),
  "utf8",
);

describe("State Director learner home — spec sections present", () => {
  it("renders the warm header with copy and stats", () => {
    expect(src).toMatch(/data-testid="sd-warm-header"/);
    expect(src).toMatch(/Training Academy · State Director/);
    expect(src).toMatch(/Welcome back/);
    expect(src).toMatch(/Launch/);
    expect(src).toMatch(/Readiness/);
    expect(src).toMatch(/Mentor/);
  });

  it("renders the Welcome to Blossom anchor before the roadmap", () => {
    const anchorIdx = src.indexOf('data-testid="sd-welcome-anchor"');
    const roadmapIdx = src.indexOf('data-testid="sd-roadmap"');
    expect(anchorIdx).toBeGreaterThan(0);
    expect(roadmapIdx).toBeGreaterThan(anchorIdx);
    expect(src).toMatch(/Welcome Video from Chad/);
    expect(src).toMatch(/Welcome from Shira/);
    expect(src).toMatch(/data-testid="sd-welcome-cta"/);
  });

  it("renders Today in your state with a primary next action before full module lists", () => {
    const todayIdx = src.indexOf('data-testid="sd-today"');
    const modulesIdx = src.indexOf('data-testid="sd-current-day-modules"');
    const roadmapIdx = src.indexOf('data-testid="sd-roadmap"');
    expect(todayIdx).toBeGreaterThan(0);
    expect(modulesIdx).toBeGreaterThan(todayIdx);
    expect(roadmapIdx).toBeGreaterThan(modulesIdx);
    expect(src).toMatch(/data-testid="sd-today-next-action"/);
  });

  it("renders an operating simulation flow card", () => {
    expect(src).toMatch(/data-testid="sd-operating-sim"/);
    expect(src).toMatch(/Lead.*Intake.*VOB/s);
    expect(src).toMatch(/Candidate.*Apploi/s);
    expect(src).toMatch(/Awaiting Submission.*Approved/s);
  });

  it("right sidebar shows launch progress + Need help?, not Required Due", () => {
    expect(src).toMatch(/data-testid="sd-launch-progress"/);
    expect(src).toMatch(/<NeedHelpPanel/);
    expect(src).not.toMatch(/Required Due/);
    expect(src).toMatch(/Shadow hours/);
    expect(src).toMatch(/Check-ins/);
    expect(src).toMatch(/Certification/);
  });

  it("uses calm 'Opens after prior day' copy, not 'Locked' badges", () => {
    const sdJourney = fs.readFileSync(
      path.join(process.cwd(), "src/components/training/SDJourneyView.tsx"),
      "utf8",
    );
    expect(sdJourney).toMatch(/Opens after prior day/);
  });

  it("OSTraining renders SDLearnerHome for state directors", () => {
    expect(page).toMatch(/SDLearnerHome/);
    expect(page).toMatch(/isSD \?\s*\(?\s*<SDLearnerHome/);
  });
});