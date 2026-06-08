import { describe, it, expect } from "vitest";
import fs from "node:fs";
import {
  computeSdContentReadiness,
  computeSdScreenshotReadiness,
  computeSdWelcomeVideoState,
  findWelcomeVideoResource,
} from "@/lib/training/sdRuntimeReadiness";
import { SD_SOP_MANIFEST } from "@/lib/resources/stateDirectorSopManifest";
import { computeSdSopCoverageFromResources } from "@/lib/resources/sdSopCoverage";
import { SD_JOURNEY_MODULE_IDS } from "@/lib/training/academyData";
import type { Resource } from "@/lib/resources/resourceData";

const PANEL = fs.readFileSync(
  "src/components/training/SDLaunchReadinessPanel.tsx",
  "utf8",
);
const WELCOME = fs.readFileSync("src/pages/os/OSWelcomeToBlossom.tsx", "utf8");
const LEARNER = fs.readFileSync(
  "src/components/training/SDLearnerHome.tsx",
  "utf8",
);
const APP = fs.readFileSync("src/App.tsx", "utf8");
const TRAINING_MGMT = fs.readFileSync(
  "src/pages/hr/TrainingManagementCenter.tsx",
  "utf8",
);

function makeRes(overrides: Partial<Resource>): Resource {
  return {
    id: overrides.id ?? "r1",
    title: overrides.title ?? "Test",
    description: "",
    type: "Video",
    category: "training",
    status: "Published",
    roles: [],
    departments: [],
    states: [],
    tags: [],
    uploadedBy: "—",
    createdAt: "",
    updatedAt: "",
    uploadStatus: "published",
    ...overrides,
  } as Resource;
}

describe("SD content readiness", () => {
  it("every SD module has the required learner-facing fields", () => {
    const r = computeSdContentReadiness();
    expect(r.total).toBe(SD_JOURNEY_MODULE_IDS.length);
    expect(r.complete).toBe(r.total);
    expect(r.missing).toHaveLength(0);
    expect(r.ok).toBe(true);
  });
});

describe("SD welcome video lookup", () => {
  it("returns ok=false when no resource exists", () => {
    expect(computeSdWelcomeVideoState([]).ok).toBe(false);
  });

  it("matches by normalized title and requires openable URL", () => {
    const noUrl = makeRes({ title: "Welcome Video from Blossom", url: undefined });
    expect(findWelcomeVideoResource([noUrl])).toBeNull();

    const withUrl = makeRes({
      id: "wv",
      title: "Welcome Video from Blossom",
      url: "https://cdn.example.com/welcome.mp4",
    });
    const found = findWelcomeVideoResource([withUrl]);
    expect(found?.id).toBe("wv");
    expect(computeSdWelcomeVideoState([withUrl]).ok).toBe(true);
  });

  it("ignores held / vault / excluded resources", () => {
    for (const status of ["privacy_review", "business_review", "vault_only", "excluded"] as const) {
      const r = makeRes({
        title: "Welcome Video from Blossom",
        url: "https://cdn.example.com/welcome.mp4",
        uploadStatus: status,
      });
      expect(findWelcomeVideoResource([r])).toBeNull();
    }
    const archived = makeRes({
      title: "Welcome Video from Blossom",
      url: "https://cdn.example.com/welcome.mp4",
      status: "Archived",
    });
    expect(findWelcomeVideoResource([archived])).toBeNull();
  });
});

describe("SD screenshot readiness", () => {
  it("starts with every priority screenshot pending (no broken images)", () => {
    const r = computeSdScreenshotReadiness();
    expect(r.totalRegistered).toBeGreaterThan(0);
    expect(r.available).toBe(0);
    expect(r.pending).toBe(r.totalRegistered);
    expect(r.ok).toBe(false);
  });
});

describe("SD SOP coverage uses manifest total", () => {
  it("counts manifest entries (97 SOPs)", () => {
    const cov = computeSdSopCoverageFromResources([]);
    expect(cov.total).toBe(SD_SOP_MANIFEST.length);
    expect(cov.published).toBe(0);
    expect(cov.missing).toBe(cov.total);
  });

  it("only counts published+openable resources as published", () => {
    const r1 = makeRes({
      id: "a",
      title: SD_SOP_MANIFEST[0].title,
      uploadStatus: "published",
      url: "https://example.com/sop.pdf",
    });
    const r2 = makeRes({
      id: "b",
      title: SD_SOP_MANIFEST[1].title,
      uploadStatus: "published",
      url: undefined,
    });
    const cov = computeSdSopCoverageFromResources([r1, r2]);
    expect(cov.published).toBe(1);
    expect(cov.needsFileRepair).toBe(1);
  });
});

describe("SDLaunchReadinessPanel runtime checks (no hard-coded greens for assets)", () => {
  it("uses computed readiness helpers", () => {
    expect(PANEL).toMatch(/computeSdContentReadiness/);
    expect(PANEL).toMatch(/computeSdScreenshotReadiness/);
    expect(PANEL).toMatch(/computeSdWelcomeVideoState/);
  });

  it("welcome-video and screenshot rows are not hard-coded ok", () => {
    // The new content items should branch on welcomeVideo.ok and screenshots.ok.
    expect(PANEL).toMatch(/welcomeVideo\.ok\s*\?/);
    expect(PANEL).toMatch(/screenshots\.ok/);
  });

  it("resource publish count compares to manifest length, not a magic number", () => {
    expect(PANEL).toMatch(/SD_SOP_MANIFEST\.length/);
  });

  it("exports a screenshot readiness panel mounted in Training Management", () => {
    expect(PANEL).toMatch(/SDScreenshotReadinessPanel/);
    expect(TRAINING_MGMT).toMatch(/SDScreenshotReadinessPanel/);
  });
});

describe("Welcome page does not render broken video when no URL exists", () => {
  it("only renders <video> inside the hasVideo branch", () => {
    // Find the JSX block; ensure <video src= appears only after `hasVideo ? (`.
    const hasVideoIdx = WELCOME.indexOf("hasVideo ? (");
    expect(hasVideoIdx).toBeGreaterThan(-1);
    const videoIdx = WELCOME.indexOf("<video");
    expect(videoIdx).toBeGreaterThan(hasVideoIdx);
  });

  it("hasVideo is derived from the resolved URL, not the empty constant", () => {
    expect(WELCOME).toMatch(/const hasVideo = Boolean\(resolvedVideoUrl\)/);
  });

  it("pending panel copy stays visually present (no empty slot)", () => {
    expect(WELCOME).toContain("Welcome Video from Blossom");
    expect(WELCOME).toMatch(/welcome video is being prepared/);
  });
});

describe("Learner page launch checklist + safe resource visibility", () => {
  it("renders the small Launch checklist card", () => {
    expect(LEARNER).toMatch(/sd-launch-checklist-card/);
    expect(LEARNER).toMatch(/Launch checklist/);
    [
      "Welcome",
      "Today's modules",
      "SOPs connected",
      "Mentor check-in",
      "Reflection",
    ].forEach((label) => {
      // Use simple includes — label appears in source.
      expect(LEARNER).toContain(label);
    });
  });
});

describe("Learner cannot see held / vault / excluded resources", () => {
  it("SOP coverage classifies vault/excluded outside of published", () => {
    const r = makeRes({
      title: SD_SOP_MANIFEST[0].title,
      uploadStatus: "vault_only",
      url: "https://example.com/x.pdf",
    });
    const cov = computeSdSopCoverageFromResources([r]);
    expect(cov.published).toBe(0);
    expect(cov.excluded).toBeGreaterThanOrEqual(1);
  });

  it("held privacy/business review SOPs never count as published", () => {
    const r = makeRes({
      title: SD_SOP_MANIFEST[0].title,
      uploadStatus: "privacy_review",
      url: "https://example.com/x.pdf",
    });
    const cov = computeSdSopCoverageFromResources([r]);
    expect(cov.published).toBe(0);
    expect(cov.held).toBeGreaterThanOrEqual(1);
  });
});

describe("/training/welcome stays outside the legacy AppLayout group", () => {
  it("renders OSWelcomeToBlossom on the dedicated route", () => {
    expect(APP).toMatch(/path="\/training\/welcome"\s+element={<OSWelcomeToBlossom/);
  });

  it("OSWelcomeToBlossom is not mounted under AppLayout", () => {
    const appLayoutStart = APP.indexOf("<ProtectedRoute><AppLayout />");
    expect(appLayoutStart).toBeGreaterThan(-1);
    expect(APP.slice(appLayoutStart)).not.toMatch(/<OSWelcomeToBlossom/);
  });
});

describe("/hr/training-center Control Room stays wide", () => {
  it("uses the wide grid template when nav is control-room", () => {
    expect(TRAINING_MGMT).toMatch(/nav === "control-room"\s*\?\s*"xl:grid-cols-\[220px_1fr\]"/);
    expect(TRAINING_MGMT).toMatch(/data-testid="training-control-room-wide"/);
  });
});