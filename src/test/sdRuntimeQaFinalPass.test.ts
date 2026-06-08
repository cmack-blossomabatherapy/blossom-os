import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  WELCOME_TO_BLOSSOM_MODULES,
  WELCOME_MODULE_IDS,
} from "@/lib/training/welcomeToBlossomContent";
import { SD_W1_SCREENSHOT_MODULE_IDS, SD_ALL_SCREENSHOTS, findScreenshotResource } from "@/lib/training/stateDirectorFullTraining";
import { computeSdScreenshotCoverage, computeSdWeek1LaunchStatus } from "@/lib/training/sdRuntimeReadiness";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

const APP = read("src/App.tsx");
const TRAINING = read("src/pages/os/OSTraining.tsx");
const WELCOME = read("src/pages/os/OSWelcomeToBlossom.tsx");
const DETAIL = read("src/pages/os/OSTrainingDetail.tsx");
const LEARNER = read("src/components/training/SDLearnerHome.tsx");
const JOURNEY = read("src/components/training/SDJourneyView.tsx");
const READINESS = read("src/components/training/SDLaunchReadinessPanel.tsx");
const UPLOAD = read("src/pages/hr/ResourceUploadCenter.tsx");
const TMC = read("src/pages/hr/TrainingManagementCenter.tsx");

describe("Runtime QA — app routes are wired for the SD launch flow", () => {
  it("mounts /training, /training/welcome, /training/:id, /hr/training-center, /hr/resource-management", () => {
    expect(APP).toMatch(/path="\/training"\s+element=\{<OSTraining/);
    expect(APP).toMatch(/path="\/training\/welcome"\s+element=\{<OSWelcomeToBlossom/);
    expect(APP).toMatch(/path="\/training\/:id"\s+element=\{<OSTrainingDetail/);
    expect(APP).toMatch(/path="\/hr\/training-center"\s+element=\{<TrainingManagementCenter/);
    expect(APP).toMatch(/path="\/hr\/resource-management"/);
  });
});

describe("Runtime QA — /training mounts SDLearnerHome for State Director only", () => {
  it("returns SDLearnerHome directly when isSD, with no duplicate hero grid below", () => {
    expect(TRAINING).toMatch(/isSD = role === "state_director"/);
    // Single SD branch returns just SDLearnerHome.
    expect(TRAINING).toMatch(/isSD \?\s*\(?\s*<SDLearnerHome/);
  });

  it("learner home links route only to current-system paths (no /onboarding or /resources legacy)", () => {
    expect(LEARNER).not.toMatch(/\/onboarding\//);
    expect(LEARNER).not.toMatch(/to="\/resources[\/"]/);
    expect(JOURNEY).not.toMatch(/\/onboarding\//);
    expect(JOURNEY).not.toMatch(/to="\/resources[\/"]/);
  });

  it("welcome CTA on learner home goes to /training/welcome", () => {
    expect(LEARNER).toMatch(/navigate\("\/training\/welcome"\)/);
    expect(LEARNER).toMatch(/data-testid="sd-welcome-cta"/);
  });

  it("module cards route to /training/:id", () => {
    expect(LEARNER).toMatch(/to=\{`\/training\/\$\{[^}]+\}`\}/);
    expect(JOURNEY).toMatch(/to=\{`\/training\/\$\{[^}]+\}`\}/);
  });

  it("no href=\"#\" or broken anchor in learner-side files", () => {
    for (const src of [LEARNER, JOURNEY, WELCOME, DETAIL]) {
      expect(src).not.toMatch(/href="#"/);
    }
  });
});

describe("Runtime QA — Welcome to Blossom is exactly 7 modules and direct", () => {
  it("has 7 modules in canonical order", () => {
    expect(WELCOME_TO_BLOSSOM_MODULES).toHaveLength(7);
    expect(WELCOME_MODULE_IDS).toEqual([
      "welcome-video-from-blossom",
      "welcome-mission-vision",
      "welcome-core-values",
      "welcome-meet-the-team",
      "welcome-how-blossom-works",
      "welcome-letter-chad",
      "welcome-letter-shira",
    ]);
  });

  it("Chad and Shira modules are letters, not video", () => {
    const chad = WELCOME_TO_BLOSSOM_MODULES.find((m) => m.id === "welcome-letter-chad")!;
    const shira = WELCOME_TO_BLOSSOM_MODULES.find((m) => m.id === "welcome-letter-shira")!;
    expect(chad.moduleType).toBe("letter");
    expect(shira.moduleType).toBe("letter");
  });

  it("no HIPAA module or quiz is rendered on /training/welcome", () => {
    expect(WELCOME).not.toMatch(/HIPAA|hipaa/);
  });

  it("welcome page wires Mark complete via markModuleComplete", () => {
    expect(WELCOME).toMatch(/markModuleComplete/);
  });

  it("welcome page has a calm video-pending fallback (no broken <video> when missing)", () => {
    expect(WELCOME).toMatch(/computeSdWelcomeVideoState|videoPending|being prepared/i);
  });
});

describe("Runtime QA — Module detail has one Mark complete and honest screenshot states", () => {
  it("has exactly one sd-mark-complete primary action", () => {
    const matches = DETAIL.match(/data-testid="sd-mark-complete"/g) ?? [];
    expect(matches.length).toBe(1);
  });

  it("renders calm pending state for unmatched screenshots and never href=\"#\"", () => {
    expect(DETAIL).toMatch(/Attachment pending|live-walkthrough|screenshot pending|live walkthrough/i);
    expect(DETAIL).not.toMatch(/href="#"/);
  });
});

describe("Runtime QA — Week 1 screenshot matching uses same helper across pages", () => {
  it("Resource Upload Center and Training Management both surface week1 screenshot counts via shared helpers", () => {
    // Both pages share computeSdScreenshotCoverage / SD_W1_SCREENSHOT_MODULE_IDS as their source of truth.
    expect(UPLOAD).toMatch(/computeSdScreenshotCoverage|SD_W1_SCREENSHOT_MODULE_IDS|findScreenshotResource/);
    expect(READINESS).toMatch(/computeSdScreenshotCoverage|computeSdWeek1LaunchStatus/);
    expect(TMC).toMatch(/SDLaunchReadinessPanel/);
  });

  it("matches by module-id filename for every Week 1 screenshot module", () => {
    for (const moduleId of SD_W1_SCREENSHOT_MODULE_IDS) {
      const asset = SD_ALL_SCREENSHOTS.find((s) => s.moduleId === moduleId);
      expect(asset, `missing screenshot asset for ${moduleId}`).toBeTruthy();
      const matched = findScreenshotResource(asset!, [
        {
          id: "u",
          title: "Some Upload",
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
          url: `https://cdn.example.com/${moduleId}.png`,
        } as any,
      ]);
      expect(matched, `no match for ${moduleId}.png`).not.toBeNull();
      expect(matched!.openable).toBe(true);
    }
  });

  it("coverage helper agrees: zero uploads = zero matched, all required uploads = ready", () => {
    const empty = computeSdScreenshotCoverage([]);
    expect(empty.week1.matched).toBe(0);
    expect(empty.week1.missing).toBe(SD_W1_SCREENSHOT_MODULE_IDS.length);

    const week1Assets = SD_ALL_SCREENSHOTS.filter((s) => s.moduleId.startsWith("sd-w1d"));
    const uploads = week1Assets.map((s, i) => ({
      id: `r-${i}`,
      title: s.resourceTitle!,
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
      url: "https://cdn.example.com/shot.png",
    })) as any;
    const ready = computeSdWeek1LaunchStatus(uploads, "https://cdn.example.com/welcome.mp4");
    expect(ready.ready).toBe(true);
    expect(ready.screenshots.matched).toBe(week1Assets.length);
  });
});

describe("Runtime QA — Training Management actions route to real destinations", () => {
  it("readiness/management surfaces link to learner, welcome, resource upload, resource library", () => {
    const combined = `${TMC}\n${READINESS}`;
    expect(combined).toMatch(/\/hr\/resource-management/);
    expect(combined).toMatch(/\/training\b/);
    expect(combined).toMatch(/\/training\/welcome/);
  });
});
