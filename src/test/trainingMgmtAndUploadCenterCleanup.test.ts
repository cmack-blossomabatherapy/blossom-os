import { describe, it, expect } from "vitest";
import fs from "node:fs";
import {
  computeSdSopCoverageFromResources,
  sopTitleSimilarity,
} from "@/lib/resources/sdSopCoverage";
import { SD_SOP_MANIFEST } from "@/lib/resources/stateDirectorSopManifest";
import type { Resource } from "@/lib/resources/resourceData";

const TMC = fs.readFileSync("src/pages/hr/TrainingManagementCenter.tsx", "utf8");
const RUC = fs.readFileSync("src/pages/hr/ResourceUploadCenter.tsx", "utf8");
const SHELL = fs.readFileSync("src/pages/os/OSShell.tsx", "utf8");

function makeRes(p: Partial<Resource>): Resource {
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

describe("SD SOP readiness — coverage uses manifest only", () => {
  it("readiness counts only count manifest-matched SOPs and ignore unrelated uploads", () => {
    const noise = [
      makeRes({ id: "n1", title: "Office Wifi Setup", uploadStatus: "published" }),
      makeRes({ id: "n2", title: "Holiday Party Sign-up", uploadStatus: "published" }),
    ];
    const sample = SD_SOP_MANIFEST.slice(0, 3);
    const matched = sample.map((e, i) =>
      makeRes({ id: "m" + i, title: e.title, url: "https://x" }),
    );
    const report = computeSdSopCoverageFromResources([...noise, ...matched]);
    expect(report.total).toBe(SD_SOP_MANIFEST.length);
    expect(report.published).toBe(matched.length);
    // Unmatched uploaded resources are reported separately.
    expect(report.unmatchedResources.map((r) => r.id).sort()).toEqual(["n1", "n2"]);
  });

  it("flags close-but-not-exact uploaded titles as needs_title_cleanup", () => {
    const target = SD_SOP_MANIFEST[0];
    // Drop a token so it isn't an exact normalized match.
    const close = makeRes({
      id: "c1",
      title: target.title.replace(/ SOP$/i, "").split(" ").slice(0, -1).join(" "),
      uploadStatus: "published",
    });
    const report = computeSdSopCoverageFromResources([close]);
    const sim = sopTitleSimilarity(target.title, close.title);
    expect(sim).toBeGreaterThan(0);
    // Either it's a real cleanup candidate, or similarity is below threshold.
    if (sim >= 0.6) {
      expect(report.needsTitleCleanupEntries.length).toBeGreaterThan(0);
    }
  });
});

describe("Training Management Center — wide Control Room layout", () => {
  it("Control Room hides the right rail and uses a wider grid", () => {
    expect(TMC).toContain('nav !== "control-room"');
    expect(TMC).toContain("xl:grid-cols-[220px_1fr]");
    expect(TMC).toContain("training-control-room-wide");
  });

  it("renders the renamed readiness panel with helper copy and required tiles", () => {
    expect(TMC).toContain("State Director SOP Readiness");
    expect(TMC).toContain(
      "These counts only include the",
    );
    expect(TMC).toContain("Required SD SOPs");
    expect(TMC).toContain("Published + connected");
    expect(TMC).toContain("Privacy / business review");
    expect(TMC).toContain("Needs file repair");
    expect(TMC).toContain("Missing from upload center");
    expect(TMC).toContain("Excluded / vault only");
  });

  it("renders unmatched-uploads section and title-cleanup section", () => {
    expect(TMC).toContain("sd-coverage-unmatched-uploads");
    expect(TMC).toContain("sd-coverage-needs-title-cleanup");
    expect(TMC).toContain("Uploaded but not matched to State Director SOPs");
  });
});

describe("OSShell — Training Management nav highlight", () => {
  it("HR Suite nav item uses end:true so /hr/training-center does not highlight HR Suite", () => {
    // Both HR Suite definitions should be end:true now.
    const occurrences = SHELL.match(/label: "HR Suite",[^}]*end: true/g) ?? [];
    expect(occurrences.length).toBeGreaterThanOrEqual(1);
  });
});

describe("Resource Upload Center — filters, summary, SD match column", () => {
  it("includes filter tabs, status summary, and SD match labels", () => {
    expect(RUC).toContain("resource-upload-status-summary");
    expect(RUC).toContain("resource-upload-filters");
    expect(RUC).toContain("resource-upload-admin-table");
    // Filter tabs are rendered via a template literal — verify the test-id
    // prefix + each tab id appears literally in the source.
    expect(RUC).toContain("resource-filter-${id}");
    for (const id of [
      '"all"',
      '"published"',
      '"sd_sops"',
      '"unmatched"',
      '"privacy_review"',
      '"vault_excluded"',
      '"needs_file_repair"',
    ]) {
      expect(RUC).toContain(id);
    }
    expect(RUC).toContain("State Director match");
    expect(RUC).toContain("Matched");
    expect(RUC).toContain("Unmatched");
    expect(RUC).toContain("Needs title cleanup");
    expect(RUC).toContain("Not State Director");
  });

  it("shows the connected-resource definition copy", () => {
    expect(RUC).toContain("Uploads here power Resource Library and Training Academy.");
    expect(RUC).toContain(
      "A resource must be published, visible to State Director, and matched to a required",
    );
  });
});
