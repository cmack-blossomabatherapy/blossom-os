import { describe, it, expect } from "vitest";
import {
  computeSdSopCoverageFromResources,
  findResourceForSopTitle,
  normalizeSopTitle,
} from "@/lib/resources/sdSopCoverage";
import { SD_SOP_MANIFEST } from "@/lib/resources/stateDirectorSopManifest";
import type { Resource } from "@/lib/resources/resourceData";

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

describe("normalizeSopTitle", () => {
  it("ignores case, the word SOP, and punctuation", () => {
    const a = normalizeSopTitle("  State Director Role & Responsibilities SOP  ");
    const b = normalizeSopTitle("state director role responsibilities");
    expect(a).toBe(b);
  });
});

describe("computeSdSopCoverageFromResources", () => {
  const sample = SD_SOP_MANIFEST.slice(0, 6);

  it("classifies published, pending, held, missing, excluded correctly", () => {
    const resources: Resource[] = [
      makeResource({
        title: sample[0].title,
        url: "https://example.com/a.pdf",
        uploadStatus: "published",
        attachmentStatus: "available",
      }),
      makeResource({
        title: sample[1].title,
        uploadStatus: "pending_review",
      }),
      makeResource({
        title: sample[2].title,
        uploadStatus: "privacy_review",
      }),
      makeResource({
        title: sample[3].title,
        uploadStatus: "vault_only",
      }),
      makeResource({
        title: sample[4].title,
        sensitivity: "excluded",
      }),
      // sample[5] intentionally absent — missing
    ];
    const report = computeSdSopCoverageFromResources(resources, sample);
    expect(report.total).toBe(sample.length);
    expect(report.published).toBe(1);
    expect(report.pending).toBe(1);
    expect(report.held).toBe(1);
    expect(report.excluded).toBe(2);
    expect(report.missing).toBe(1);
    expect(report.publishedEntries[0].entry.title).toBe(sample[0].title);
    expect(report.missingEntries[0].entry.title).toBe(sample[5].title);
  });

  it("findResourceForSopTitle matches on normalized title", () => {
    const r = makeResource({ title: "  state director role & RESPONSIBILITIES sop  " });
    expect(
      findResourceForSopTitle([r], "State Director Role & Responsibilities SOP"),
    ).toBe(r);
  });
});