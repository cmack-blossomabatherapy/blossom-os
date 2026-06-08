/**
 * State Director — Asset Completion Pass tests.
 *
 * Covers welcome-video resource lookup, screenshot resource matching,
 * PII safety, learner-facing rendering, and Resource Upload Center
 * Training Screenshots view.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import {
  computeSdWelcomeVideoCheck,
  findWelcomeVideoCandidates,
  findWelcomeVideoResource,
} from "@/lib/training/sdRuntimeReadiness";
import {
  SD_ALL_SCREENSHOTS,
  findScreenshotResource,
  isScreenshotPiiSafe,
} from "@/lib/training/stateDirectorFullTraining";
import type { Resource } from "@/lib/resources/resourceData";
import { SDLaunchReadinessPanel } from "@/components/training/SDLaunchReadinessPanel";

vi.mock("@/hooks/useAdminResources", () => ({
  useAdminResources: () => ({ resources: [], loading: false, error: null }),
}));
vi.mock("@/hooks/useLibraryResources", () => ({
  useLibraryResources: () => ({ resources: [], loading: false, error: null }),
}));

function makeRes(overrides: Partial<Resource>): Resource {
  return {
    id: "r1",
    title: "Test",
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

describe("Welcome video resource lookup", () => {
  it("matches each accepted title variant", () => {
    for (const title of [
      "Welcome Video from Blossom",
      "Welcome to Blossom Video",
      "Blossom Welcome Video",
      "Welcome from Chad and Shira",
    ]) {
      const r = makeRes({
        title,
        url: "https://cdn.example.com/v.mp4",
      });
      expect(findWelcomeVideoResource([r])?.title).toBe(title);
    }
  });

  it("computeSdWelcomeVideoCheck returns ok with note when resource is openable", () => {
    const r = makeRes({
      title: "Blossom Welcome Video",
      url: "https://cdn.example.com/v.mp4",
    });
    const c = computeSdWelcomeVideoCheck([r]);
    expect(c.state).toBe("ok");
    expect(c.label).toBe("Welcome video linked");
    expect(c.note).toMatch(/Blossom Welcome Video/);
  });

  it("returns warn when a matching resource exists but is not openable", () => {
    const r = makeRes({ title: "Welcome from Chad and Shira", url: undefined, fileUrl: undefined });
    expect(findWelcomeVideoCandidates([r])).toHaveLength(1);
    expect(findWelcomeVideoResource([r])).toBeNull();
    expect(computeSdWelcomeVideoCheck([r]).state).toBe("warn");
  });

  it("returns manual when no matching resource exists", () => {
    expect(computeSdWelcomeVideoCheck([]).state).toBe("manual");
  });
});

describe("SD launch readiness panel — welcome video row is computed, not hard-coded manual", () => {
  it("renders the computed welcome video label + note when no resources are uploaded", () => {
    render(
      <MemoryRouter>
        <SDLaunchReadinessPanel />
      </MemoryRouter>,
    );
    const assets = screen.getByTestId("sd-launch-assets");
    expect(within(assets).getByText("Welcome video linked")).toBeInTheDocument();
    // manual state copy
    expect(within(assets).getByText(/Confirm a published Welcome video resource/i)).toBeInTheDocument();
  });
});

describe("Screenshot asset registry", () => {
  it("every registered screenshot has a human-readable resourceTitle", () => {
    expect(SD_ALL_SCREENSHOTS.length).toBeGreaterThan(0);
    for (const a of SD_ALL_SCREENSHOTS) {
      expect(a.resourceTitle, `asset ${a.id} missing resourceTitle`).toBeTruthy();
    }
  });

  it("findScreenshotResource matches a published library upload by resourceTitle", () => {
    const asset = SD_ALL_SCREENSHOTS[0];
    const r = makeRes({
      id: "up1",
      title: asset.resourceTitle!,
      type: "PDF",
      url: "https://cdn.example.com/shot.png",
    });
    const match = findScreenshotResource(asset, [r]);
    expect(match?.resource.id).toBe("up1");
    expect(match?.openable).toBe(true);
  });

  it("ignores held / vault / excluded screenshot resources", () => {
    const asset = SD_ALL_SCREENSHOTS[0];
    for (const uploadStatus of [
      "privacy_review",
      "business_review",
      "vault_only",
      "excluded",
    ] as const) {
      const r = makeRes({
        title: asset.resourceTitle!,
        uploadStatus,
        url: "https://cdn.example.com/shot.png",
      });
      expect(findScreenshotResource(asset, [r])).toBeNull();
    }
  });

  it("flags PII keywords as unsafe even when sensitivity says training_safe", () => {
    const asset = SD_ALL_SCREENSHOTS[0];
    expect(isScreenshotPiiSafe(asset)).toBe(true);
    const unsafe = { ...asset, description: `${asset.description} member id 12345` };
    expect(isScreenshotPiiSafe(unsafe)).toBe(false);
  });
});

describe("Resource Upload Center — Training screenshots view", () => {
  it("registers a tab and panel for training screenshots", async () => {
    const fs = await import("node:fs");
    const SRC = fs.readFileSync("src/pages/hr/ResourceUploadCenter.tsx", "utf8");
    expect(SRC).toMatch(/training_screenshots/);
    expect(SRC).toMatch(/TrainingScreenshotsPanel/);
    expect(SRC).toMatch(/Training screenshots/);
  });
});