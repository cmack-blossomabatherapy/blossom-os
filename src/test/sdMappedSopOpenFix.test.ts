import { describe, it, expect } from "vitest";
import fs from "node:fs";
import {
  computeSdSopCoverageFromResources,
} from "@/lib/resources/sdSopCoverage";
import { SD_SOP_MANIFEST } from "@/lib/resources/stateDirectorSopManifest";
import type { Resource } from "@/lib/resources/resourceData";

const DETAIL = fs.readFileSync("src/pages/os/OSTrainingDetail.tsx", "utf8");
const TMC = fs.readFileSync("src/pages/hr/TrainingManagementCenter.tsx", "utf8");

function makeResource(overrides: Partial<Resource>): Resource {
  return {
    id: overrides.id ?? overrides.title ?? "r",
    title: overrides.title ?? "Untitled",
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
    ...overrides,
  };
}

describe("SdMappedSopCard open behavior", () => {
  it("imports resolveResourceOpenUrl and uses it for storage-backed opens", () => {
    expect(DETAIL).toMatch(/resolveResourceOpenUrl/);
    expect(DETAIL).toMatch(/from\s+"@\/lib\/resources\/resourceStorage"/);
    expect(DETAIL).toMatch(/await\s+resolveResourceOpenUrl\(resource\)/);
  });

  it("renders an onClick button for openable SOPs — not a static anchor", () => {
    expect(DETAIL).toMatch(/onClick=\{handleOpen\}/);
    expect(DETAIL).toMatch(/<button[\s\S]*?data-testid="sd-mapped-sop-open"/);
    expect(DETAIL).not.toMatch(/href=\{resource!\.url \|\| resource!\.fileUrl\}/);
  });

  it("opens external https URLs directly via window.open", () => {
    expect(DETAIL).toMatch(/window\.open\(resource\.url/);
    expect(DETAIL).toMatch(/\/\^https\?:\\\/\\\//);
  });

  it("shows a toast on signed-url failure", () => {
    expect(DETAIL).toMatch(/toast\.error\([^)]*Could not open SOP/);
  });

  it("renders the file-repair branch for published rows missing url and storagePath", () => {
    expect(DETAIL).toMatch(/data-testid="sd-mapped-sop-needs-repair"/);
    expect(DETAIL).toMatch(/SOP record exists, file link missing/);
  });

  it("never renders href=\"#\"", () => {
    expect(DETAIL).not.toMatch(/href="#"/);
  });
});

describe("sdSopCoverage classifies storagePath and file-repair correctly", () => {
  const sample = SD_SOP_MANIFEST.slice(0, 4);

  it("treats a resource with only storagePath as published", () => {
    const resources: Resource[] = [
      makeResource({ title: sample[0].title, storagePath: "sops/abc/file.pdf" }),
    ];
    const report = computeSdSopCoverageFromResources(resources, sample);
    expect(report.published).toBe(1);
    expect(report.needsFileRepair).toBe(0);
  });

  it("flags published rows missing both url and storagePath as needs_file_repair", () => {
    const resources: Resource[] = [
      makeResource({ title: sample[0].title }), // no url, no storagePath
    ];
    const report = computeSdSopCoverageFromResources(resources, sample);
    expect(report.published).toBe(0);
    expect(report.needsFileRepair).toBe(1);
    expect(report.needsFileRepairEntries[0].entry.title).toBe(sample[0].title);
  });

  it("still classifies external URL resources as published", () => {
    const resources: Resource[] = [
      makeResource({ title: sample[0].title, url: "https://example.com/x.pdf" }),
    ];
    const report = computeSdSopCoverageFromResources(resources, sample);
    expect(report.published).toBe(1);
  });
});

describe("Training Management SD coverage adds verification copy", () => {
  it("explains what Published means to admins", () => {
    expect(TMC).toMatch(/Published means the resource is visible to learners/);
  });
  it("renders the needs-file-repair panel", () => {
    expect(TMC).toMatch(/data-testid="sd-coverage-needs-file-repair"/);
    expect(TMC).toMatch(/Needs file repair/);
  });
  it("keeps published and needs-upload panels", () => {
    expect(TMC).toMatch(/data-testid="sd-coverage-published"/);
    expect(TMC).toMatch(/data-testid="sd-coverage-needs-upload"/);
  });
});