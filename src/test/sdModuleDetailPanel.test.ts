import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const src = fs.readFileSync(
  path.join(process.cwd(), "src/pages/os/OSTrainingDetail.tsx"),
  "utf8",
);

describe("State Director module detail panel", () => {
  it("renders SD panel only for SD modules (via early-return branch)", () => {
    expect(src).toMatch(/data-testid="sd-module-detail-panel"/);
    // The SD experience is rendered via an early `if (isSD)` return —
    // not stacked alongside the generic layout.
    expect(src).toMatch(/if \(isSD\) \{\s*return \(/);
    expect(src).toMatch(/<SDModuleDetailPanel training=\{training\} \/>/);
    expect(src).toMatch(/training\.id\.startsWith\("sd-"\)/);
  });

  it("contains required spec sections", () => {
    for (const id of [
      "sd-why-matters",
      "sd-what-to-do",
      "sd-workflow-content",
      "sd-knowledge-check",
      "sd-notes",
      "sd-resources",
      "sd-signoff",
    ]) {
      expect(src, `missing ${id}`).toMatch(new RegExp(`data-testid="${id}"`));
    }
  });

  it("wires DB-backed start and complete via shared learner-home APIs", () => {
    expect(src).toMatch(/startLearnerModule\(/);
    expect(src).toMatch(/completeLearnerModule\(/);
    expect(src).toMatch(/loadLearnerHome\(/);
    expect(src).toMatch(/upsertProgress\(/);
    expect(src).toMatch(/data-testid="sd-mark-complete"/);
  });

  it("blocks completion until mentor signoff when required", () => {
    expect(src).toMatch(/Mentor signoff required/);
    expect(src).toMatch(/requiresMentorSignoff\s*&&\s*!hasSignoff/);
  });

  it("renders calm pending copy for resources with no URL — never href=\"#\"", () => {
    expect(src).not.toMatch(/href="#"/);
    expect(src).toMatch(/Attachment pending/);
    expect(src).toMatch(/data-testid="resource-pending"/);
    expect(src).toMatch(/isPendingResource/);
  });

  it("knowledge check stores score and reflection uses academy_progress shape", () => {
    // score field
    expect(src).toMatch(/upsertProgress\([^)]*\{[^}]*score/s);
    // reflection field
    expect(src).toMatch(/upsertProgress\([^)]*\{[^}]*reflection/s);
  });
});