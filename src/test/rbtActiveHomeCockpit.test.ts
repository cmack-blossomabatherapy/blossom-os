// Slice 4B — Active RBT Home cockpit contract tests.
//
// Covers:
//  - Pure derivation (`deriveCockpit`) across all 12 Experience Lab
//    combinations (3 pathways × 4 presets).
//  - Every Home CTA/route the cockpit exposes is a real /rbt/app path.
//  - The cockpit component contains no RBT-facing placeholders, fake
//    phone numbers, rickroll URLs, or raw sync/CentralReach language.
//  - Basic accessibility scaffolding (aria labels, motion-reduce fallback,
//    responsive grid classes) is present.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  deriveCockpit,
  COCKPIT_ROUTES,
} from "@/lib/rbt/homeCockpit";
import {
  LAB_PATHWAY_KEYS,
  LAB_PRESETS,
  projectProgram,
} from "@/lib/rbt/experienceLab";

const read = (rel: string) =>
  readFileSync(path.resolve(process.cwd(), rel), "utf8");

const HOME_SRC = "src/pages/rbt/app/active/ActiveHome.tsx";
const COCKPIT_SRC = "src/lib/rbt/homeCockpit.ts";
const PREBOARD_SRC = "src/pages/rbt/app/preboarding/PreboardingHomeCards.tsx";

describe("Slice 4B — RBT Home cockpit (pure logic)", () => {
  it("returns awaiting_setup with a Welcome CTA when there is no pathway", () => {
    const c = deriveCockpit(null, []);
    expect(c.nextAction.stage).toBe("awaiting_setup");
    expect(c.nextAction.to).toBe(COCKPIT_ROUTES.welcome);
    expect(c.stats.total).toBe(0);
    expect(c.timeline).toEqual([]);
  });

  // 12 lab combinations: 3 pathways × 4 presets
  for (const pathway of LAB_PATHWAY_KEYS) {
    for (const preset of LAB_PRESETS) {
      it(`derives a coherent cockpit for lab combo ${pathway} + ${preset}`, () => {
        const proj = projectProgram({ pathway, preset });
        const c = deriveCockpit(proj.pathway.name, proj.rows);

        // Stats mirror the projection.
        expect(c.stats.total).toBe(proj.stats.total);
        expect(c.stats.complete).toBe(proj.stats.complete);
        expect(c.stats.percent).toBe(proj.stats.percent);

        // Timeline is exactly the projected rows in order.
        expect(c.timeline).toHaveLength(proj.rows.length);
        c.timeline.forEach((t, i) => {
          expect(t.title).toBe(proj.rows[i].step.title);
          expect(t.status).toBe(proj.rows[i].progress.status);
          expect(t.to).toBe(COCKPIT_ROUTES.program);
        });

        // The next-action route must be a known cockpit route.
        const validRoutes = new Set(Object.values(COCKPIT_ROUTES));
        expect(validRoutes.has(c.nextAction.to as any)).toBe(true);

        // Preset expectations.
        if (preset === "needs_support") {
          expect(c.nextAction.stage).toBe("needs_support");
          expect(c.nextAction.to).toBe(COCKPIT_ROUTES.support);
        } else if (preset === "starting") {
          expect(["kickoff", "in_flight"]).toContain(c.nextAction.stage);
          expect(c.nextAction.to).toBe(COCKPIT_ROUTES.program);
        } else if (preset === "nearly_done") {
          expect(["final_stretch", "complete"]).toContain(c.nextAction.stage);
        } else if (preset === "midway") {
          expect(["in_flight", "final_stretch"]).toContain(c.nextAction.stage);
          expect(c.nextAction.to).toBe(COCKPIT_ROUTES.program);
        }

        // The CTA body/title must never leak technical language.
        const forbidden = /centralreach|sync|integration|source|stale/i;
        expect(c.nextAction.title).not.toMatch(forbidden);
        expect(c.nextAction.body).not.toMatch(forbidden);
      });
    }
  }

  it("all cockpit routes are real /rbt/app routes", () => {
    for (const [key, route] of Object.entries(COCKPIT_ROUTES)) {
      expect(route.startsWith("/rbt/app/"), `${key} route: ${route}`).toBe(true);
    }
  });
});

describe("Slice 4B — RBT Home cockpit component contract", () => {
  it("ActiveHome uses deriveCockpit and the shared route table", () => {
    const src = read(HOME_SRC);
    expect(src).toMatch(/from\s+"@\/lib\/rbt\/homeCockpit"/);
    expect(src).toMatch(/deriveCockpit\(/);
    expect(src).toMatch(/COCKPIT_ROUTES\./);
  });

  it("ActiveHome respects Experience Lab (skips Supabase writes when active)", () => {
    const src = read(HOME_SRC);
    expect(src).toMatch(/useExperienceLab/);
    expect(src).toMatch(/if\s*\(\s*lab\.active\s*\)/);
    // Sanity: the effect deps include lab.active so it re-runs on toggle.
    expect(src).toMatch(/lab\.active\s*\]/);
  });

  it("ActiveHome renders a single primary next-best-action CTA", () => {
    const src = read(HOME_SRC);
    const matches = src.match(/rbt-home-next-action-cta/g) ?? [];
    expect(matches.length).toBe(1);
  });

  it("ActiveHome exposes the Fellowship path CTA to BCBA", () => {
    const src = read(HOME_SRC);
    expect(src).toMatch(/rbt-home-fellowship-cta/);
    expect(src).toMatch(/\/rbt\/app\/growth\/fellowship/);
  });

  it("ActiveHome renders a milestone timeline with aria label", () => {
    const src = read(HOME_SRC);
    expect(src).toMatch(/data-testid="rbt-home-timeline"/);
    expect(src).toMatch(/aria-label="Training milestones"/);
  });

  it("ActiveHome is responsive (uses sm: grid utilities)", () => {
    const src = read(HOME_SRC);
    expect(src).toMatch(/grid\s+gap-3\s+sm:grid-cols-2/);
  });

  it("ActiveHome respects prefers-reduced-motion on progress bar", () => {
    const src = read(HOME_SRC);
    expect(src).toMatch(/motion-reduce:transition-none/);
  });

  it("ActiveHome & cockpit contain no placeholder/rickroll/fake-phone/sync language", () => {
    const forbidden = [
      /rickroll/i,
      /dQw4w9WgXcQ/,
      /\(\d{3}\)\s*555-\d{4}/,      // fake 555 phones
      /example\.com/i,
      /lorem ipsum/i,
      /centralreach/i,
      /source[-_ ]?health/i,
      /\bstale\b/i,
    ];
    for (const src of [read(HOME_SRC), read(COCKPIT_SRC)]) {
      for (const p of forbidden) expect(src).not.toMatch(p);
    }
  });

  it("PreboardingHomeCards no longer contains rickroll or fake phone", () => {
    const src = read(PREBOARD_SRC);
    expect(src).not.toMatch(/dQw4w9WgXcQ/);
    expect(src).not.toMatch(/\(\d{3}\)\s*555-\d{4}/);
  });
});