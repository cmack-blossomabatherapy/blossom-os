import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { cleanSdTitle, sdWeekDayChip } from "@/lib/training/sdDisplayTitle";

const DETAIL = fs.readFileSync(
  path.join(process.cwd(), "src/pages/os/OSTrainingDetail.tsx"),
  "utf8",
);
const LIB = fs.readFileSync(
  path.join(process.cwd(), "src/pages/os/OSResourceLibrary.tsx"),
  "utf8",
);

describe("Part 1 — SD module detail has no generic-layout duplication", () => {
  it("isSD branch returns before the generic 3-column layout", () => {
    // Early return for SD
    expect(DETAIL).toMatch(/if \(isSD\) \{\s*return \(/);
    // The generic layout grid is no longer rendered alongside the SD panel
    expect(DETAIL).not.toMatch(/\{isSD && <SDModuleDetailPanel/);
  });

  it("SD panel keeps a single action set (sticky-strip Mark complete only)", () => {
    // Exactly one occurrence of the test-id sd-mark-complete should remain
    const matches = DETAIL.match(/data-testid="sd-mark-complete"/g) ?? [];
    expect(matches.length).toBe(1);
    // The old secondary header summary action row is gone
    expect(DETAIL).not.toMatch(/Mark started/);
  });
});

describe("Part 2 — cleanSdTitle helper strips W#D# prefixes", () => {
  it("removes W1-D1 / W1 · D1 / W1D1 prefixes", () => {
    expect(cleanSdTitle("W1 - D1 — Mission & Vision")).toBe("Mission & Vision");
    expect(cleanSdTitle("W1-D1 — Welcome Video from Blossom")).toBe("Welcome Video from Blossom");
    expect(cleanSdTitle("W1 · D1 — Mission & Vision")).toBe("Mission & Vision");
    expect(cleanSdTitle("01 W1D2 Company Structure Understanding SOP")).toBe(
      "Company Structure Understanding SOP",
    );
  });
  it("leaves clean titles untouched", () => {
    expect(cleanSdTitle("Mission & Vision")).toBe("Mission & Vision");
    expect(cleanSdTitle("Welcome Video from Blossom")).toBe("Welcome Video from Blossom");
  });
  it("sdWeekDayChip returns a friendly chip from the internal id", () => {
    expect(sdWeekDayChip("sd-w1d1-mission-vision")).toBe("Week 1 · Day 1");
    expect(sdWeekDayChip(undefined)).toBeNull();
  });
});

describe("Part 3 — Resource Library drawer is learner-friendly", () => {
  it("uses the new ResourceDrawerBody and learner-facing sections", () => {
    expect(LIB).toMatch(/ResourceDrawerBody/);
    expect(LIB).toMatch(/data-testid="resource-drawer-learner"/);
    expect(LIB).toMatch(/What this is/);
    expect(LIB).toMatch(/When to use it/);
    expect(LIB).toMatch(/Who this helps/);
  });
  it("no longer renders admin metadata rows in the default drawer body", () => {
    // Old direct MetaRow calls for Uploaded by / Departments / States / Roles only
    // appear now inside the gated Admin details disclosure.
    expect(LIB).toMatch(/data-testid="resource-drawer-admin"/);
    expect(LIB).toMatch(/showAdmin && \(/);
  });
  it("does not call cleanSdTitle on raw admin metadata (admin gated)", () => {
    expect(LIB).toMatch(/canManage &&/);
  });
});

describe("Part 4 — no visible mojibake artifacts in learner-facing source", () => {
  const files = [
    "src/pages/os/OSTrainingDetail.tsx",
    "src/pages/os/OSResourceLibrary.tsx",
    "src/pages/os/OSWelcomeToBlossom.tsx",
    "src/components/training/SDLearnerHome.tsx",
    "src/lib/training/sdDisplayTitle.ts",
  ];
  it.each(files)("%s has no mojibake", (rel) => {
    const t = fs.readFileSync(path.join(process.cwd(), rel), "utf8");
    for (const bad of ["Â", "â€”", "â€¦", "â†’"]) {
      expect(t.includes(bad), `${rel} contains ${bad}`).toBe(false);
    }
  });
});

describe("Part 5 — W1D1 modules do not create uploaded SOP/resource records", () => {
  it("State Director SOP manifest contains no W1D1 entries", () => {
    const manifest = fs.readFileSync(
      path.join(process.cwd(), "src/lib/resources/stateDirectorSopManifest.ts"),
      "utf8",
    );
    expect(manifest).not.toMatch(/W1D1\b/i);
    expect(manifest).not.toMatch(/sd-w1d1-/);
  });
});

describe("Part 6 — SD generated titles are clean at source", () => {
  it("getTraining('sd-w1d1-mission-vision') returns a clean title", async () => {
    const { getTraining } = await import("@/lib/training/academyData");
    expect(getTraining("sd-w1d1-mission-vision")?.title).toBe("Mission & Vision");
  });
  it("no generated SD Training.title starts with W#", async () => {
    const { getTraining } = await import("@/lib/training/academyData");
    const { SD_MODULE_SOP_LINKS } = await import("@/lib/training/stateDirectorModuleSopMap");
    expect(SD_MODULE_SOP_LINKS.length).toBeGreaterThan(0);
    let checked = 0;
    for (const link of SD_MODULE_SOP_LINKS) {
      const t = getTraining(link.moduleId);
      if (!t) continue;
      checked++;
      expect(t.title, `bad title: ${t.title}`).not.toMatch(/^W\d/);
    }
    expect(checked).toBeGreaterThan(0);
  });
  it("OSTraining.tsx uses cleanSdTitle for learner-facing renders", () => {
    const t = fs.readFileSync(path.join(process.cwd(), "src/pages/os/OSTraining.tsx"), "utf8");
    expect(t).toMatch(/cleanSdTitle\(training\.title\)/);
    expect(t).toMatch(/cleanSdTitle\(nextModule\.title\)/);
    expect(t).toMatch(/cleanSdTitle\(m\.title\)/);
  });
  it("SDLearnerHome does not render the W#·D# token shape", () => {
    const t = fs.readFileSync(path.join(process.cwd(), "src/components/training/SDLearnerHome.tsx"), "utf8");
    expect(t).not.toMatch(/`W\$\{[^}]+\}\s*·\s*D\$\{/);
    expect(t).not.toMatch(/>\s*W\{[^}]+\}\s*·\s*D\{/);
  });
});

describe("Part 7 — Resource drawer has Open + Download for available resources", () => {
  it("renders both buttons (Download gated on !pending)", () => {
    expect(LIB).toMatch(/data-testid="resource-open-button"/);
    expect(LIB).toMatch(/data-testid="resource-download-button"/);
    expect(LIB).toMatch(/!pending &&/);
  });
});

describe("Part 8 — strict literal mojibake scan", () => {
  const files = [
    "src/pages/os/OSTrainingDetail.tsx",
    "src/pages/os/OSTraining.tsx",
    "src/pages/os/OSResourceLibrary.tsx",
    "src/components/training/SDLearnerHome.tsx",
    "src/lib/training/sdDisplayTitle.ts",
    "src/lib/training/academyData.ts",
    "src/lib/resources/stateDirectorSopManifest.ts",
  ];
  it.each(files)("%s has no literal mojibake bytes", (rel) => {
    const t = fs.readFileSync(path.join(process.cwd(), rel), "utf8");
    for (const bad of ["Â", "â€”", "â€“", "â€¦", "â†’", "â‰¥"]) {
      expect(t.includes(bad), `${rel} contains ${bad}`).toBe(false);
    }
  });
});
