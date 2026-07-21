import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { SD_JOURNEY_STRUCTURE } from "@/lib/training/academyData";

const APP_TSX = fs.readFileSync("src/App.tsx", "utf8");
const CONTROL_ROOM = fs.readFileSync(
  "src/components/training/TrainingControlRoom.tsx",
  "utf8",
);
const TMC = fs.readFileSync("src/pages/hr/TrainingManagementCenter.tsx", "utf8");
const MODULE_CARD = fs.readFileSync(
  "src/components/academy/ModuleCard.tsx",
  "utf8",
);
const SD = fs.readFileSync("src/lib/training/academyData.ts", "utf8");
const AUDIT = fs.readFileSync("docs/training-management-audit.md", "utf8");

describe("Training Management Pass 1 — routes preserved", () => {
  it("primary Training Management workspace route /hr/training-center exists", () => {
    expect(APP_TSX).toMatch(/<Route\s+path="\/hr\/training-center"/);
  });

  it("learner Academy route /training/academy exists", () => {
    expect(APP_TSX).toMatch(/<Route\s+path="\/training\/academy"/);
  });

  it("Leadership Dashboard route /training/academy/leadership exists", () => {
    expect(APP_TSX).toMatch(/<Route\s+path="\/training\/academy\/leadership"/);
  });

  it("learner training hub route /training exists", () => {
    expect(APP_TSX).toMatch(/<Route\s+path="\/training"/);
  });
});

describe("Training Management Pass 1 — State Director structure preserved", () => {
  it("State Director journey still describes 5 weeks", () => {
    expect(SD).toMatch(/5-week/);
  });

  it("State Director journey export has 5 weeks / 25 days", () => {
    expect(SD_JOURNEY_STRUCTURE).toHaveLength(5);
    const totalDays = SD_JOURNEY_STRUCTURE.reduce(
      (sum: number, w: any) => sum + w.days.length,
      0,
    );
    expect(totalDays).toBe(25);
  });
});

describe("Training Management Pass 1 — Control Room sections", () => {
  const required = [
    "Active Trainees",
    "Setup Needed",
    "Launch Readiness",
    "Resource / SOP Gaps",
    "Paths & Journeys",
    "Admin Actions",
  ];

  for (const section of required) {
    it(`renders section: ${section}`, () => {
      expect(CONTROL_ROOM).toContain(section);
    });
  }

  it("Control Room is mounted in Training Management Center", () => {
    expect(TMC).toContain("ControlRoomLaunchReadinessSection");
    expect(TMC).toContain("ControlRoomResourceAssetCoverageSection");
    expect(TMC).toContain("tmc-launch-readiness-section");
    expect(TMC).toContain("tmc-resource-asset-coverage-section");
    expect(TMC).toMatch(/control-room/);
  });

  it("Control Room is the default tab", () => {
    // Current contract: default nav falls back to "control-room" when no valid nav param.
    expect(TMC).toMatch(/useState<NavId>\(\s*validNav\s*\?\?\s*"control-room"\s*\)/);
  });
});

describe("Training Management Pass 1 — non-blocking pending content", () => {
  it("pending welcome videos are explicitly non-blocking in Control Room copy", () => {
    expect(CONTROL_ROOM).toMatch(/do not block/i);
  });

  it("ModuleCard does not gate Mark complete on video_url presence", () => {
    // Mark complete button must not be conditionally hidden when video_url is missing.
    expect(MODULE_CARD).not.toMatch(/video_url[^}]*&&\s*<[^>]*Mark complete/i);
  });

  it("Pending SOPs surface as admin action items, not blockers", () => {
    expect(CONTROL_ROOM).toContain("Resource / SOP Gaps");
    expect(CONTROL_ROOM).toMatch(/pendingSops/);
  });
});

describe("Training Management Pass 1 — no placeholder wording", () => {
  const forbidden = [
    /coming soon/i,
    /lorem ipsum/i,
    /placeholder content/i,
    /\bTBD\b/,
    /\bTODO\b/,
  ];

  for (const pat of forbidden) {
    it(`Control Room contains no placeholder match: ${pat}`, () => {
      expect(CONTROL_ROOM).not.toMatch(pat);
    });
  }
});

describe("Training Management Pass 1 — audit doc", () => {
  it("audit doc exists and references primary workspace", () => {
    expect(AUDIT).toContain("/hr/training-center");
    expect(AUDIT).toContain("Control Room");
  });
});