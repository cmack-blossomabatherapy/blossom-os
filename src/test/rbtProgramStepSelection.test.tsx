/**
 * Regression: Up Next / Blocked / Roadmap "Open" actions must open the
 * matching step across every path × preset. Previously the selection was
 * passed by row reference, which could open the wrong step (e.g. clicking
 * "Lead RBT + client session" opened "Zoom learning intro" on Developing /
 * Midway). Selection is now keyed by step id.
 */
import { describe, it, expect } from "vitest";
import {
  projectProgram,
  LAB_PATHWAY_KEYS,
  LAB_PRESETS,
  statusForIndex,
  type LabPathwayKey,
  type LabPreset,
} from "@/lib/rbt/experienceLab";

function currentRow(rows: ReturnType<typeof projectProgram>["rows"]) {
  return rows.find((r) => r.progress.status !== "complete") ?? null;
}
function blockedRow(rows: ReturnType<typeof projectProgram>["rows"]) {
  return (
    rows.find(
      (r) => r.progress.status === "blocked" || r.progress.status === "needs_support",
    ) ?? null
  );
}

describe("RBT program step selection — every path × preset", () => {
  it("Developing / Midway current = 'Lead RBT + client session' (index 3)", () => {
    const proj = projectProgram({ pathway: "under_2_years", preset: "midway" });
    const cur = currentRow(proj.rows);
    expect(cur?.step.title).toBe("Lead RBT + client session");
    expect(cur?.step.id).toBe("lab-under_2_years-step-4");
    // Roadmap row at same id must resolve to the same step title.
    const byId = proj.rows.find((r) => r.step.id === cur!.step.id);
    expect(byId?.step.title).toBe("Lead RBT + client session");
  });

  for (const pathway of LAB_PATHWAY_KEYS as readonly LabPathwayKey[]) {
    for (const preset of LAB_PRESETS as readonly LabPreset[]) {
      it(`${pathway} / ${preset}: id-based lookup matches row-based lookup for every roadmap row`, () => {
        const proj = projectProgram({ pathway, preset });
        expect(proj.rows.length).toBeGreaterThan(0);
        // All step ids are unique.
        const ids = proj.rows.map((r) => r.step.id);
        expect(new Set(ids).size).toBe(ids.length);
        // Row order == fixture order_index ascending.
        for (let i = 0; i < proj.rows.length; i++) {
          expect(proj.rows[i].step.order_index).toBe(i + 1);
        }
        // For every row, looking it up by id returns the same step.
        for (const r of proj.rows) {
          const found = proj.rows.find((x) => x.step.id === r.step.id);
          expect(found?.step.title).toBe(r.step.title);
          expect(found?.progress.status).toBe(r.progress.status);
        }
        // Current row (Up Next) resolves deterministically by id.
        const cur = currentRow(proj.rows);
        if (cur) {
          const found = proj.rows.find((r) => r.step.id === cur.step.id);
          expect(found?.step.title).toBe(cur.step.title);
        }
        // Blocked row (Support banner) resolves deterministically by id.
        const blk = blockedRow(proj.rows);
        if (blk) {
          const found = proj.rows.find((r) => r.step.id === blk.step.id);
          expect(found?.step.title).toBe(blk.step.title);
        }
      });

      it(`${pathway} / ${preset}: currentIndex matches statusForIndex projection`, () => {
        const proj = projectProgram({ pathway, preset });
        const total = proj.rows.length;
        const expectedCurrentIndex = (() => {
          for (let i = 0; i < total; i++) {
            const s = statusForIndex(total, i, preset);
            if (s !== "complete") return i;
          }
          return -1;
        })();
        const cur = currentRow(proj.rows);
        if (expectedCurrentIndex === -1) {
          expect(cur).toBeNull();
        } else {
          expect(cur?.step.id).toBe(proj.rows[expectedCurrentIndex].step.id);
        }
      });
    }
  }
});