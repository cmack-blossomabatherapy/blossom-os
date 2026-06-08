import { describe, it, expect } from "vitest";
import fs from "node:fs";
import {
  SD_ALL_SCREENSHOTS,
  SD_PRIORITY_SCREENSHOT_MODULES,
  SD_W1_SCREENSHOT_MODULE_IDS,
  getStateDirectorScreenshots,
  findScreenshotResource,
  isScreenshotPiiSafe,
} from "@/lib/training/stateDirectorFullTraining";
import {
  computeSdScreenshotCoverage,
  computeSdWeek1LaunchStatus,
} from "@/lib/training/sdRuntimeReadiness";
import type { Resource } from "@/lib/resources/resourceData";

const WEEK1_OPERATIONAL_MODULES = [
  "sd-w1d1-welcome-video-from-blossom",
  "sd-w1d1-meet-the-team",
  "sd-w1d1-how-blossom-works",
  "sd-w1d2-company-structure",
  "sd-w1d2-department-overview",
  "sd-w1d2-state-director-role-overview",
  "sd-w1d2-leadership-expectations",
  "sd-w1d3-intake-department",
  "sd-w1d3-authorizations-department",
  "sd-w1d3-scheduling-department",
  "sd-w1d3-recruiting-department",
  "sd-w1d3-qa-department",
  "sd-w1d3-billing-department",
  "sd-w1d4-communication-standards",
  "sd-w1d4-escalation-structure",
  "sd-w1d4-accountability-expectations",
  "sd-w1d4-operational-ownership",
  "sd-w1d5-data-integrity",
  "sd-w1d5-utilization-mindset",
  "sd-w1d5-state-ownership",
  "sd-w1d5-operational-leadership-philosophy",
];

// Values/letters modules that intentionally have no screenshot.
const WEEK1_LETTER_VALUE_MODULES = [
  "sd-w1d1-mission-vision",
  "sd-w1d1-core-values",
  "sd-w1d1-welcome-from-chad-kaufman",
  "sd-w1d1-a-note-from-shira-lasry",
];

function makeRes(p: Partial<Resource>): Resource {
  return {
    id: p.id ?? p.title ?? "r",
    title: p.title ?? "Untitled",
    description: "",
    type: "Image",
    category: "training",
    status: "Published",
    roles: [],
    departments: [],
    states: [],
    tags: [],
    uploadedBy: "test",
    createdAt: "",
    updatedAt: "",
    uploadStatus: "published",
    ...p,
  } as Resource;
}

describe("Week 1 screenshot registration", () => {
  it("registers a screenshot for every operational/system Week 1 module", () => {
    for (const id of WEEK1_OPERATIONAL_MODULES) {
      const shots = getStateDirectorScreenshots(id);
      expect(shots.length, `missing Week 1 screenshot for ${id}`).toBeGreaterThanOrEqual(1);
      expect(SD_PRIORITY_SCREENSHOT_MODULES).toContain(id);
      expect(SD_W1_SCREENSHOT_MODULE_IDS).toContain(id);
    }
    expect(SD_W1_SCREENSHOT_MODULE_IDS.length).toBeGreaterThanOrEqual(WEEK1_OPERATIONAL_MODULES.length);
  });

  it("does not register screenshots for letter / value-only Week 1 modules", () => {
    for (const id of WEEK1_LETTER_VALUE_MODULES) {
      expect(getStateDirectorScreenshots(id)).toHaveLength(0);
      expect(SD_W1_SCREENSHOT_MODULE_IDS).not.toContain(id);
    }
  });

  it("every Week 1 screenshot has resourceTitle, alt, 2-4 callouts, pending_upload, no imageUrl", () => {
    const week1 = SD_ALL_SCREENSHOTS.filter((s) => s.moduleId.startsWith("sd-w1d"));
    expect(week1.length).toBeGreaterThan(0);
    for (const s of week1) {
      expect(s.resourceTitle, `${s.id} missing resourceTitle`).toBeTruthy();
      expect(s.resourceTitle!.startsWith("State Director Walkthrough - ")).toBe(true);
      expect(s.alt.length).toBeGreaterThan(10);
      expect(s.callouts?.length ?? 0).toBeGreaterThanOrEqual(2);
      expect(s.callouts?.length ?? 0).toBeLessThanOrEqual(4);
      expect(s.resourceStatus).toBe("pending_upload");
      expect(s.imageUrl).toBeUndefined();
      expect(isScreenshotPiiSafe(s)).toBe(true);
    }
  });
});

describe("findScreenshotResource — tolerant matching", () => {
  const asset = getStateDirectorScreenshots("sd-w1d3-intake-department")[0];

  it("matches by exact resourceTitle (title)", () => {
    const r = makeRes({
      id: "u1",
      title: "State Director Walkthrough - Intake workspace",
      url: "https://cdn.example.com/shot.png",
    });
    const m = findScreenshotResource(asset, [r]);
    expect(m?.matchedBy).toBe("title");
    expect(m?.openable).toBe(true);
  });

  it("matches by slugified resourceTitle filename (filename)", () => {
    const r = makeRes({
      id: "u2",
      title: "Random Library Title",
      url: "https://cdn.example.com/state-director-walkthrough-intake-workspace.png",
    });
    const m = findScreenshotResource(asset, [r]);
    expect(m?.matchedBy).toBe("filename");
  });

  it("matches by module id filename (module_id)", () => {
    const r = makeRes({
      id: "u3",
      title: "Misnamed Upload",
      url: "https://cdn.example.com/sd-w1d3-intake-department.png",
    });
    const m = findScreenshotResource(asset, [r]);
    expect(m?.matchedBy).toBe("module_id");
  });

  it("matches by module id inside a storage path segment", () => {
    const r = makeRes({
      id: "u4",
      title: "Misnamed Upload",
      storagePath: "training/sd-w1d3-intake-department/intake-workspace.png",
    });
    const m = findScreenshotResource(asset, [r]);
    expect(m).not.toBeNull();
    expect(["module_id", "asset_id"]).toContain(m!.matchedBy);
    expect(m!.openable).toBe(true);
  });

  it("matches by asset id filename (asset_id)", () => {
    const r = makeRes({
      id: "u5",
      title: "Misnamed Upload",
      url: `https://cdn.example.com/${asset.id}.png`,
    });
    const m = findScreenshotResource(asset, [r]);
    expect(m?.matchedBy).toBe("asset_id");
  });

  it("ignores archived, held, vault, and excluded resources even with matching names", () => {
    for (const overrides of [
      { status: "Archived" as const },
      { uploadStatus: "privacy_review" as const },
      { uploadStatus: "vault_only" as const },
      { uploadStatus: "excluded" as const },
      { sensitivity: "excluded" as const },
    ]) {
      const r = makeRes({
        title: asset.resourceTitle!,
        url: "https://cdn.example.com/shot.png",
        ...overrides,
      });
      expect(findScreenshotResource(asset, [r])).toBeNull();
    }
  });

  it("does not match unrelated uploads", () => {
    const r = makeRes({
      id: "u6",
      title: "Holiday Party Sign-up",
      url: "https://cdn.example.com/holiday.png",
    });
    expect(findScreenshotResource(asset, [r])).toBeNull();
  });
});

describe("Week 1 launch status + screenshot coverage", () => {
  it("computeSdScreenshotCoverage reports a Week 1 breakdown", () => {
    const c = computeSdScreenshotCoverage([]);
    expect(c.week1.total).toBe(SD_W1_SCREENSHOT_MODULE_IDS.length);
    expect(c.week1.matched).toBe(0);
    expect(c.week1.missing).toBe(c.week1.total);
    expect(c.all.total).toBeGreaterThanOrEqual(c.week1.total);
  });

  it("computeSdWeek1LaunchStatus is blocked when no screenshots or video are present", () => {
    const s = computeSdWeek1LaunchStatus([]);
    expect(s.ready).toBe(false);
    expect(s.reasons.length).toBeGreaterThan(0);
  });

  it("computeSdWeek1LaunchStatus becomes ready when all Week 1 screenshots match and welcome video is bundled", () => {
    const week1 = SD_ALL_SCREENSHOTS.filter((s) => s.moduleId.startsWith("sd-w1d"));
    const uploads = week1.map((s, i) =>
      makeRes({
        id: `auto-${i}`,
        title: s.resourceTitle!,
        url: "https://cdn.example.com/shot.png",
      }),
    );
    const s = computeSdWeek1LaunchStatus(uploads, "https://cdn.example.com/welcome.mp4");
    expect(s.ready).toBe(true);
    expect(s.state).toBe("ready");
    expect(s.reasons).toEqual([]);
    expect(s.screenshots.matched).toBe(week1.length);
  });
});

describe("Touched files use ASCII punctuation (no mojibake or em dashes in resource titles)", () => {
  const SRC = fs.readFileSync("src/lib/training/stateDirectorFullTraining.ts", "utf8");
  const RUC = fs.readFileSync("src/pages/hr/ResourceUploadCenter.tsx", "utf8");
  const DET = fs.readFileSync("src/pages/os/OSTrainingDetail.tsx", "utf8");
  const RDY = fs.readFileSync("src/components/training/SDLaunchReadinessPanel.tsx", "utf8");

  it("mkShot now emits ASCII-hyphen resource titles", () => {
    expect(SRC).toContain('resourceTitle: `State Director Walkthrough - ${title}`');
    for (const s of SD_ALL_SCREENSHOTS) {
      expect(s.resourceTitle!.includes(" - ")).toBe(true);
      expect(s.resourceTitle!.includes(" — ")).toBe(false);
    }
  });

  it("no mojibake in touched files", () => {
    for (const txt of [SRC, RUC, DET, RDY]) {
      expect(txt).not.toMatch(/â€”|â€“|â€¦|Â·|â†'/);
    }
  });
});