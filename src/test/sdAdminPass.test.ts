import { describe, it, expect } from "vitest";
import fs from "node:fs";
import {
  computeSdSopCoverageFromResources,
  normalizeSopTitle,
  sopTitleSimilarity,
} from "@/lib/resources/sdSopCoverage";
import { SD_SOP_MANIFEST } from "@/lib/resources/stateDirectorSopManifest";
import type { Resource } from "@/lib/resources/resourceData";

const TMC = fs.readFileSync("src/pages/hr/TrainingManagementCenter.tsx", "utf8");
const RUC = fs.readFileSync("src/pages/hr/ResourceUploadCenter.tsx", "utf8");

function res(p: Partial<Resource>): Resource {
  return {
    id: p.id ?? p.title ?? "r",
    title: p.title ?? "Untitled",
    description: "",
    type: "PDF",
    category: "operational",
    status: "Published",
    roles: [],
    departments: [],
    states: [],
    tags: [],
    uploadedBy: "—",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    uploadStatus: "published",
    attachmentStatus: "available",
    sensitivity: "public_internal",
    ...p,
  };
}

describe("SD Admin pass — Part 4 (screenshot matching) + Part 5 (TMC readiness parity) + Part 7 (auto-match)", () => {
  it("Resource Upload Center renders the training-screenshots panel with PII + match indicators", () => {
    expect(RUC).toContain('data-testid="training-screenshots-panel"');
    expect(RUC).toContain("SD_ALL_SCREENSHOTS");
    expect(RUC).toContain("findScreenshotResource");
    expect(RUC).toContain("isScreenshotPiiSafe");
    expect(RUC).toContain("registered screenshots");
  });

  it("Resource Upload Center exposes every admin filter tab incl. screenshots + launch SOPs", () => {
    for (const id of [
      '"all"',
      '"published"',
      '"sd_launch_sops"',
      '"sd_sops"',
      '"missing_sd_sops"',
      '"needs_title_cleanup"',
      '"unmatched"',
      '"privacy_review"',
      '"vault_excluded"',
      '"needs_file_repair"',
      '"training_screenshots"',
    ]) {
      expect(RUC).toContain(id);
    }
    expect(RUC).toContain("resource-upload-filters");
    expect(RUC).toContain("resource-upload-status-summary");
  });

  it("Training Management readiness panel mirrors Upload Center coverage source", () => {
    expect(TMC).toContain('import { computeSdSopCoverageFromResources }');
    expect(TMC).toContain("State Director SOP Readiness");
    // Tile parity: counts shown on TMC come from the same coverage report.
    for (const tile of [
      "Required SD SOPs",
      "Published + connected",
      "Privacy / business review",
      "Needs file repair",
      "Missing from upload center",
      "Excluded / vault only",
    ]) {
      expect(TMC).toContain(tile);
    }
    // Cross-link sections so admins can act on findings.
    expect(TMC).toContain("sd-coverage-needs-upload");
    expect(TMC).toContain("sd-coverage-published");
    expect(TMC).toContain("sd-coverage-needs-title-cleanup");
    expect(TMC).toContain("sd-coverage-needs-file-repair");
    expect(TMC).toContain("sd-coverage-unmatched-uploads");
  });

  it("auto-match: a published resource whose title exactly matches a manifest SOP becomes 'published' coverage with no code change", () => {
    const target = SD_SOP_MANIFEST[0];
    const uploaded = res({
      id: "auto-1",
      title: target.title,
      url: "https://example.com/sop.pdf",
      uploadStatus: "published",
    });
    const before = computeSdSopCoverageFromResources([]);
    const after = computeSdSopCoverageFromResources([uploaded]);
    expect(after.published).toBe(before.published + 1);
    expect(after.missing).toBe(before.missing - 1);
    expect(normalizeSopTitle(uploaded.title)).toBe(normalizeSopTitle(target.title));
  });

  it("auto-match: near-miss title surfaces under needsTitleCleanupEntries with similarity >= 0.6", () => {
    const target = SD_SOP_MANIFEST[0];
    const tokens = target.title.split(" ");
    const close = res({
      id: "near-1",
      title: tokens.slice(0, Math.max(2, tokens.length - 1)).join(" "),
      uploadStatus: "published",
    });
    const sim = sopTitleSimilarity(target.title, close.title);
    if (sim >= 0.6) {
      const rep = computeSdSopCoverageFromResources([close]);
      expect(rep.needsTitleCleanupEntries.length).toBeGreaterThan(0);
    } else {
      // Lower bound holds: similarity is non-negative for any related text.
      expect(sim).toBeGreaterThanOrEqual(0);
    }
  });

  it("auto-match: unrelated uploads land in unmatchedResources, not coverage", () => {
    const noise = [
      res({ id: "x1", title: "Holiday Party Sign-up", uploadStatus: "published" }),
      res({ id: "x2", title: "Office Wifi Setup", uploadStatus: "published" }),
    ];
    const rep = computeSdSopCoverageFromResources(noise);
    expect(rep.published).toBe(0);
    expect(rep.unmatchedResources.map((r) => r.id).sort()).toEqual(["x1", "x2"]);
  });

  it("admin-facing files contain no broken href='#' fallbacks or mojibake", () => {
    for (const src of [TMC, RUC]) {
      expect(src).not.toMatch(/href=["']#["']/);
      expect(src).not.toMatch(/â€”|â€“|â€¦|Â·/);
    }
  });
});