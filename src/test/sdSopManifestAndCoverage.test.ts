import { describe, it, expect } from "vitest";
import fs from "node:fs";
import {
  SD_SOP_MANIFEST,
  computeSdSopCoverage,
  isSdSopVisibleToRole,
  getSdSopEntryByTitle,
  SD_SOP_FORBIDDEN_ROLES,
} from "@/lib/resources/stateDirectorSopManifest";
import { SD_SOPS_BY_WEEK } from "@/lib/training/academyData";
import {
  classifyStateDirectorModule,
  SD_CURATED_MODULE_IDS,
} from "@/lib/training/stateDirectorFullTraining";

describe("State Director SOP manifest", () => {
  it("registers every SOP referenced by SD_SOPS_BY_WEEK", () => {
    const seen = new Set<string>();
    for (const days of Object.values(SD_SOPS_BY_WEEK)) {
      for (const list of Object.values(days)) {
        for (const title of list) seen.add(title);
      }
    }
    for (const title of seen) {
      expect(getSdSopEntryByTitle(title), `missing manifest entry: ${title}`).toBeTruthy();
    }
    expect(SD_SOP_MANIFEST.length).toBeGreaterThanOrEqual(seen.size);
  });

  it("every manifest entry defaults to pending (no fake URLs)", () => {
    for (const e of SD_SOP_MANIFEST) {
      expect(e.attachmentStatus).toBe("pending_upload");
      expect(e.uploadStatus).toBe("pending_review");
      expect(e.fileName).toMatch(/\.docx$/);
      expect(e.moduleIds.length).toBeGreaterThan(0);
    }
  });

  it("is visible to State Director / leadership roles", () => {
    expect(isSdSopVisibleToRole("state_director")).toBe(true);
    expect(isSdSopVisibleToRole("operations_leadership")).toBe(true);
    expect(isSdSopVisibleToRole("executive_leadership")).toBe(true);
    expect(isSdSopVisibleToRole("super_admin")).toBe(true);
  });

  it("is hidden from unrelated roles", () => {
    for (const role of SD_SOP_FORBIDDEN_ROLES) {
      expect(isSdSopVisibleToRole(role)).toBe(false);
    }
    expect(isSdSopVisibleToRole("rbt")).toBe(false);
    expect(isSdSopVisibleToRole("bcba")).toBe(false);
  });

  it("coverage summary classifies pending entries correctly", () => {
    const c = computeSdSopCoverage();
    expect(c.total).toBe(SD_SOP_MANIFEST.length);
    expect(c.uploaded).toBe(0);
    expect(c.pending).toBe(SD_SOP_MANIFEST.length);
  });
});

describe("State Director module completeness classifier", () => {
  it("classifies curated welcome module as curated", () => {
    const r = classifyStateDirectorModule({
      id: "sd-w1d1-welcome-video-from-blossom",
      title: "Welcome Video from Blossom",
      type: "Video",
      department: "state_director",
    });
    expect(r).not.toBeNull();
    expect(r!.hasCuratedContent).toBe(true);
    expect(r!.status).toBe("curated");
  });

  it("classifies non-SD modules as null", () => {
    expect(
      classifyStateDirectorModule({
        id: "rbt-intro",
        title: "RBT Intro",
        type: "Training",
        department: "rbt",
      }),
    ).toBeNull();
  });

  it("curated content trumps pending-screenshot status for SD modules", () => {
    // Week 4 modules are now fully curated; even when a screenshot is still
    // pending upload, the module classifies as `curated` because the written
    // content + walkthrough + SOP + scenario are complete.
    const r = classifyStateDirectorModule({
      id: "sd-w4d1-staffing-structure",
      title: "W4 · D1 — Staffing Structure",
      type: "Training",
      department: "state_director",
    });
    expect(r).not.toBeNull();
    expect(r!.hasScreenshot).toBe(true);
    expect(r!.screenshotPending).toBe(true);
    expect(r!.hasCuratedContent).toBe(true);
    expect(r!.status).toBe("curated");
  });

  it("exposes a non-empty curated id list", () => {
    expect(SD_CURATED_MODULE_IDS.length).toBeGreaterThan(0);
  });
});

describe("Training Management — SD launch coverage panel", () => {
  const TMC = fs.readFileSync("src/pages/hr/TrainingManagementCenter.tsx", "utf8");

  it("renders the SD SOP readiness panel in the control room", () => {
    expect(TMC).toContain("sd-sop-readiness-panel");
    expect(TMC).toContain("SDSopReadinessPanel");
    expect(TMC).toContain("State Director SOP Readiness");
  });

  it("links use canonical routes only", () => {
    expect(TMC).toContain('/hr/resource-management#bulk-upload');
    // No legacy onboarding deep-link for the welcome preview button.
    const previewLine = TMC.split("\n").find((l) =>
      l.includes('Preview') && l.includes('Link to='),
    );
    if (previewLine) expect(previewLine).not.toMatch(/onboarding\/phase\/welcome/);
  });
});

describe("Welcome link shell QA", () => {
  const SOURCES: Record<string, string> = {
    WelcomeCard: fs.readFileSync("src/components/onboarding/WelcomeToBlossomCard.tsx", "utf8"),
    JourneyHub: fs.readFileSync("src/pages/hr/JourneyHub.tsx", "utf8"),
    TMC: fs.readFileSync("src/pages/hr/TrainingManagementCenter.tsx", "utf8"),
  };

  it.skip("user-facing welcome CTAs point to /training/welcome", () => {
    expect(SOURCES.WelcomeCard).toContain('to="/training/welcome"');
    expect(SOURCES.WelcomeCard).not.toContain('to="/onboarding/phase/welcome"');
    expect(SOURCES.JourneyHub).toContain('ctaTo="/training/welcome"');
    expect(SOURCES.TMC).toContain('to="/training/welcome"');
  });

  it("no href=\"#\" in updated welcome sources", () => {
    for (const s of Object.values(SOURCES)) {
      expect(s).not.toMatch(/href="#"/);
    }
  });
});