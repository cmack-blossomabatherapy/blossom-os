import { describe, it, expect } from "vitest";
import {
  SD_JOURNEY_STRUCTURE,
  SD_JOURNEY_MODULE_IDS,
  getTrainings,
  getJourneys,
} from "@/lib/training/academyData";
import fs from "node:fs";
import path from "node:path";

describe("State Director journey — structure", () => {
  it("has exactly 5 weeks", () => {
    expect(SD_JOURNEY_STRUCTURE).toHaveLength(5);
    expect(SD_JOURNEY_STRUCTURE.map((w) => w.week)).toEqual([1, 2, 3, 4, 5]);
  });

  it("has exactly 25 days total (5 days per week)", () => {
    const totalDays = SD_JOURNEY_STRUCTURE.reduce((sum, w) => sum + w.days.length, 0);
    expect(totalDays).toBe(25);
    for (const w of SD_JOURNEY_STRUCTURE) {
      expect(w.days).toHaveLength(5);
    }
  });

  it("Week 1 Day 1 is 'Welcome to Blossom' with the canonical 7 modules", () => {
    const w1d1 = SD_JOURNEY_STRUCTURE[0].days[0];
    expect(w1d1.title).toBe("Welcome to Blossom");
    expect(w1d1.modules).toEqual([
      "Welcome Video from Blossom",
      "Mission & Vision",
      "Core Values",
      "Meet the Team",
      "How Blossom Works",
      "Welcome from Chad Kaufman",
      "A Note from Shira Lasry",
    ]);
  });
});

describe("State Director journey — content hardening", () => {
  const sdTrainings = getTrainings().filter((t) => SD_JOURNEY_MODULE_IDS.includes(t.id));

  it("includes every module from the structure (no missing builds)", () => {
    const expectedCount = SD_JOURNEY_STRUCTURE.reduce(
      (sum, w) => sum + w.days.reduce((s, d) => s + d.modules.length, 0),
      0,
    );
    expect(sdTrainings).toHaveLength(expectedCount);
    expect(SD_JOURNEY_MODULE_IDS).toHaveLength(expectedCount);
  });

  it("no module description still says 'Placeholder'", () => {
    const offenders = sdTrainings.filter((t) =>
      /placeholder/i.test(t.description) || /placeholder/i.test(t.overview ?? ""),
    );
    expect(offenders.map((t) => t.id)).toEqual([]);
  });

  it("every module has whyItMatters / whatToDo / completionEvidence", () => {
    for (const t of sdTrainings) {
      expect(t.whyItMatters, `whyItMatters missing on ${t.id}`).toBeTruthy();
      expect(t.whatToDo, `whatToDo missing on ${t.id}`).toBeTruthy();
      expect(t.completionEvidence, `completionEvidence missing on ${t.id}`).toBeTruthy();
    }
  });

  it("uses an expanded set of module types (SOP, Video, Training, Shadowing, Meeting, Quiz, Reflection, Task)", () => {
    const types = new Set(sdTrainings.map((t) => t.type));
    for (const expected of ["SOP", "Video", "Training", "Shadowing", "Meeting", "Quiz", "Reflection", "Task"]) {
      expect(types.has(expected as never), `expected type ${expected} present`).toBe(true);
    }
  });

  it("attaches key named SOP resources", () => {
    const allResourceTitles = sdTrainings.flatMap((t) => (t.resources ?? []).map((r) => r.title));
    const required = [
      "State Director Role & Responsibilities SOP",
      "Leadership Expectations for State Directors SOP",
      "Intake Department Operations SOP",
      "CentralReach System Overview SOP",
      "Authorization Lifecycle Management SOP",
      "Utilization Management & Recovery SOP",
      "Staffing Structure & Workforce Planning SOP",
      "Scheduling Shadow Program SOP",
      "Weekly State Operations Meetings SOP",
      "State Director Certification Process SOP",
    ];
    for (const sop of required) {
      expect(allResourceTitles, `missing SOP resource: ${sop}`).toContain(sop);
    }
  });

  it("State Director journey is registered with all 104 module ids", () => {
    const sdJourney = getJourneys().find((j) => j.role === "state_director");
    expect(sdJourney).toBeDefined();
    expect(sdJourney!.moduleIds).toEqual(SD_JOURNEY_MODULE_IDS);
  });
});

describe("Training Academy — routes & gating remain intact", () => {
  const appTsx = fs.readFileSync(path.join(process.cwd(), "src/App.tsx"), "utf8");

  it("learner route /training/academy is declared", () => {
    expect(appTsx).toMatch(/path="\/training\/academy"/);
  });

  it("admin academy editor route is permission-gated", () => {
    const m = appTsx.match(/path="\/training\/academy\/editor"[^>]*element=\{([^}]*)\}/);
    expect(m, "editor route declared").toBeTruthy();
    expect(m![1]).toMatch(/PermissionRoute/);
    expect(m![1]).toMatch(/hr\.training\.assign/);
  });

  it("leadership academy route is permission-gated", () => {
    const m = appTsx.match(/path="\/training\/academy\/leadership"[^>]*element=\{([^}]*)\}/);
    expect(m, "leadership route declared").toBeTruthy();
    expect(m![1]).toMatch(/PermissionRoute/);
    expect(m![1]).toMatch(/hr\.training\.view/);
  });
});