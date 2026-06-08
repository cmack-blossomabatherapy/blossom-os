/**
 * State Director Training Academy — end-to-end QA + Readiness Audit Pass.
 *
 * Consolidates the audit: full curriculum content, welcome page, SOP manifest,
 * mapped SOP module connections, and tracking surfaces.
 */
import { describe, it, expect } from "vitest";
import {
  SD_JOURNEY_STRUCTURE,
  SD_JOURNEY_MODULE_IDS,
  getTraining,
} from "@/lib/training/academyData";
import {
  getStateDirectorFullContent,
  classifyStateDirectorModule,
} from "@/lib/training/stateDirectorFullTraining";
import { SD_SOP_MANIFEST } from "@/lib/resources/stateDirectorSopManifest";
import { WELCOME_LEADERSHIP_LETTERS } from "@/lib/training/welcomeToBlossomContent";

const HARSH_BANNED = [
  "lorem",
  "todo",
  "tbd",
  "fixme",
  "placeholder",
  "coming soon",
  "broken",
];

function assertNoHarshLanguage(label: string, blob: string) {
  const lower = blob.toLowerCase();
  for (const word of HARSH_BANNED) {
    expect(lower, `${label} contains banned word "${word}"`).not.toContain(word);
  }
}

describe("SD Academy QA Audit — curriculum shape", () => {
  it("has 5 weeks and 25 training days", () => {
    expect(SD_JOURNEY_STRUCTURE).toHaveLength(5);
    const totalDays = SD_JOURNEY_STRUCTURE.reduce(
      (n, w) => n + w.days.length,
      0,
    );
    expect(totalDays).toBe(25);
  });

  it("every journey module id resolves to a Training", () => {
    for (const id of SD_JOURNEY_MODULE_IDS) {
      const t = getTraining(id);
      expect(t, `missing training for ${id}`).toBeDefined();
    }
  });
});

describe("SD Academy QA Audit — full content on every module", () => {
  it.each(SD_JOURNEY_MODULE_IDS)(
    "%s has complete content payload + spec fields",
    (id) => {
      const training = getTraining(id)!;
      expect(training).toBeDefined();

      // Spec-level fields surfaced to the learner UI.
      expect(training.whyItMatters, `${id} whyItMatters`).toBeTruthy();
      expect(training.whatToDo, `${id} whatToDo`).toBeTruthy();
      expect(
        training.completionEvidence,
        `${id} completionEvidence`,
      ).toBeTruthy();

      // Full content via the resolver — derived or curated.
      const full = getStateDirectorFullContent(training);
      expect(full, `${id} full content`).not.toBeNull();
      expect(full!.learningObjective.length).toBeGreaterThan(10);
      expect(full!.stateDirectorLens.length).toBeGreaterThan(10);
      expect(full!.stepByStep.length).toBeGreaterThan(0);
      expect(full!.scenario.situation.length).toBeGreaterThan(10);
      expect(full!.scenario.expectedResponse.length).toBeGreaterThan(10);
      expect(full!.knowledgeCheck.length).toBeGreaterThan(0);
      expect(full!.sop.process.length).toBeGreaterThan(0);

      // No harsh placeholder language anywhere visible.
      const blob = [
        training.overview ?? "",
        training.whyItMatters ?? "",
        training.whatToDo ?? "",
        training.completionEvidence ?? "",
        full!.learningObjective,
        full!.stateDirectorLens,
        full!.scenario.situation,
        full!.scenario.expectedResponse,
        ...full!.stepByStep.map((s) => `${s.action} ${s.lookFor}`),
        ...full!.knowledgeCheck.map((q) => q.question),
      ].join(" \n ");
      assertNoHarshLanguage(id, blob);
    },
  );

  it("every module classifies as curated or derived (no missing)", () => {
    for (const id of SD_JOURNEY_MODULE_IDS) {
      const training = getTraining(id)!;
      const readiness = classifyStateDirectorModule(training)!;
      expect(readiness.status, `${id} status`).not.toBe("missing");
    }
  });
});

describe("SD Academy QA Audit — SOP manifest", () => {
  it("contains exactly 97 required State Director SOPs", () => {
    expect(SD_SOP_MANIFEST).toHaveLength(97);
  });

  it("every manifest entry links to at least one journey module id", () => {
    const journeyIds = new Set(SD_JOURNEY_MODULE_IDS);
    for (const entry of SD_SOP_MANIFEST) {
      expect(
        entry.moduleIds.length,
        `${entry.title} has no module connections`,
      ).toBeGreaterThan(0);
      for (const mid of entry.moduleIds) {
        expect(
          journeyIds.has(mid),
          `${entry.title} maps to unknown module ${mid}`,
        ).toBe(true);
      }
    }
  });
});

describe("SD Academy QA Audit — Welcome to Blossom letters", () => {
  it("includes substantive Chad Kaufman and Shira Lasry letters", () => {
    const chad = WELCOME_LEADERSHIP_LETTERS.find((l) => l.id === "welcome-letter-chad");
    const shira = WELCOME_LEADERSHIP_LETTERS.find((l) => l.id === "welcome-letter-shira");
    expect(chad?.name).toBe("Chad Kaufman");
    expect(shira?.name).toBe("Shira Lasry");
    expect(chad!.paragraphs.length).toBeGreaterThanOrEqual(5);
    expect(shira!.paragraphs.length).toBeGreaterThanOrEqual(5);
    const combined = [...chad!.paragraphs, ...shira!.paragraphs].join(" ");
    expect(combined.length).toBeGreaterThan(1500);
    assertNoHarshLanguage("welcome letters", combined);
  });
});