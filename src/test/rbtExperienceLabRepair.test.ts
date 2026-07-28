/**
 * RBT Experience Lab repair — demo-critical guarantees.
 *
 * Covers: exactly four approved pathways, stage projection + navigation
 * mapping, lab eligibility/storage, reset/exit, walkthrough replay while
 * the Lab is active, and real first-login persistence.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { renderHook, act } from "@testing-library/react";
import {
  LAB_PATHWAY_KEYS, LAB_PATHWAY_LABEL, LAB_STAGES, LAB_STAGE_META,
  normalizeLabPathwayKey, presetForStage, stageRoute, projectProgram,
  projectSkillPassport, useExperienceLabController, __lab_internal,
} from "@/lib/rbt/experienceLab";
import {
  useRbtWalkthroughController, TOUR_VERSION, readCompletion,
  clearLabDemoTourState, readLabDemoSeen,
} from "@/lib/rbt/walkthrough";

const read = (rel: string) => readFileSync(path.resolve(process.cwd(), rel), "utf8");

// Every stage route must exist as a real route in App.tsx.
const APP_SRC = read("src/App.tsx");

beforeEach(() => {
  window.sessionStorage.clear();
  window.localStorage.clear();
});

describe("four approved training pathways", () => {
  it("exposes exactly four canonical pathway keys", () => {
    expect([...LAB_PATHWAY_KEYS]).toEqual([
      "not_certified",
      "certified_no_experience",
      "certified_under_2yrs",
      "certified_2yrs_plus",
    ]);
  });

  it("labels match the approved program wording", () => {
    expect(LAB_PATHWAY_LABEL.not_certified).toBe("Not Certified");
    expect(LAB_PATHWAY_LABEL.certified_no_experience).toBe("Certified — No Experience");
    expect(LAB_PATHWAY_LABEL.certified_under_2yrs).toBe("Certified — Under 2 Years");
    expect(LAB_PATHWAY_LABEL.certified_2yrs_plus).toBe("Certified — 2+ Years");
  });

  it("every pathway begins with Welcome and has realistic modules", () => {
    const expected: Record<string, RegExp[]> = {
      not_certified: [
        /welcome/i, /classroom|role play/i, /client competency/i, /knowledge assessment/i,
        /shadowing/i, /full session/i, /bcba/i,
      ],
      certified_no_experience: [
        /welcome/i, /aba foundations/i, /documentation/i, /role play/i,
        /shadowing/i, /supported session/i, /bcba supervision/i,
      ],
      certified_under_2yrs: [
        /welcome/i, /initial evaluation/i, /coaching/i, /aba explained/i, /day 2 bcba/i,
      ],
      certified_2yrs_plus: [
        /welcome/i, /expedited readiness/i, /documentation calibration/i, /bcba observation/i,
      ],
    };
    for (const key of LAB_PATHWAY_KEYS) {
      const proj = projectProgram({ pathway: key, preset: "starting" });
      const titles = proj.rows.map((r) => r.step.title);
      expect(titles[0]).toMatch(/welcome/i);
      expected[key].forEach((rx, i) => expect(titles[i]).toMatch(rx));
      expect(titles.length).toBe(expected[key].length);
    }
  });

  it("normalizes legacy pathway keys", () => {
    expect(normalizeLabPathwayKey("new_rbt_certification")).toBe("not_certified");
    expect(normalizeLabPathwayKey("under_2_years")).toBe("certified_under_2yrs");
    expect(normalizeLabPathwayKey("experienced_rbt")).toBe("certified_2yrs_plus");
    expect(normalizeLabPathwayKey("garbage")).toBeNull();
  });
});

describe("lifecycle stage projection + navigation mapping", () => {
  it("covers the full lifecycle from brand-new sign-in through 30/60/90", () => {
    expect([...LAB_STAGES]).toEqual([
      "brand_new", "onboarding", "training", "competency",
      "cr_setup", "first_client", "first_two_weeks", "growth",
    ]);
  });

  it("each stage maps to an existing RBT route", () => {
    for (const stage of LAB_STAGES) {
      const route = stageRoute(stage);
      expect(route.startsWith("/rbt/app/")).toBe(true);
      expect(APP_SRC).toContain(`path="${route}"`);
    }
  });

  it("each stage derives a deterministic progress preset", () => {
    expect(presetForStage("brand_new")).toBe("starting");
    expect(presetForStage("training")).toBe("midway");
    expect(presetForStage("competency")).toBe("needs_support");
    expect(presetForStage("growth")).toBe("nearly_done");
    for (const s of LAB_STAGES) {
      expect(LAB_STAGE_META[s].blurb.length).toBeGreaterThan(10);
    }
  });

  it("brand-new stage projects zero completed steps for every pathway", () => {
    for (const pathway of LAB_PATHWAY_KEYS) {
      const proj = projectProgram({ pathway, preset: presetForStage("brand_new"), stage: "brand_new" });
      expect(proj.stats.complete).toBe(0);
      expect(proj.rows[0].progress.status).toBe("in_progress");
    }
  });

  it("skill passport projection follows the stage preset", () => {
    const early = projectSkillPassport({ pathway: "not_certified", preset: presetForStage("brand_new") });
    const late = projectSkillPassport({ pathway: "not_certified", preset: presetForStage("growth") });
    expect(early.status.session_note_quality.state).toBe("introduced");
    expect(late.status.session_note_quality.state).toBe("competent");
  });
});

describe("lab eligibility, storage, reset and exit", () => {
  it("opens for admin / super_admin / systems_admin only", () => {
    const admin = renderHook(() => useExperienceLabController(["super_admin"], "admin-1"));
    act(() => admin.result.current.enable());
    expect(admin.result.current.active).toBe(true);

    const rbt = renderHook(() => useExperienceLabController(["rbt"], "rbt-1"));
    act(() => rbt.result.current.enable());
    expect(rbt.result.current.eligible).toBe(false);
    expect(rbt.result.current.active).toBe(false);
  });

  it("setStage updates stage and preset together and persists per-tab", () => {
    const { result } = renderHook(() => useExperienceLabController(["super_admin"], "admin-1"));
    act(() => result.current.enable());
    act(() => result.current.setStage("first_client"));
    expect(result.current.state?.stage).toBe("first_client");
    expect(result.current.state?.preset).toBe(presetForStage("first_client"));
    const stored = __lab_internal.readSession(__lab_internal.storageKey("admin-1"));
    expect(stored?.stage).toBe("first_client");
  });

  it("reset returns to the brand-new starting state", () => {
    const { result } = renderHook(() => useExperienceLabController(["super_admin"], "admin-1"));
    act(() => result.current.enable());
    act(() => { result.current.setPathway("certified_2yrs_plus"); });
    act(() => { result.current.setStage("growth"); });
    act(() => result.current.reset());
    expect(result.current.state).toEqual({
      pathway: "not_certified", stage: "brand_new", preset: presetForStage("brand_new"),
    });
  });

  it("exit clears lab state without touching real progress storage", () => {
    const { result } = renderHook(() => useExperienceLabController(["super_admin"], "admin-1"));
    act(() => result.current.enable());
    act(() => result.current.exit());
    expect(result.current.active).toBe(false);
    expect(__lab_internal.readSession(__lab_internal.storageKey("admin-1"))).toBeNull();
    expect(readCompletion("real-rbt")).toBeNull();
  });
});

describe("walkthrough: lab replay vs real first-login persistence", () => {
  it("auto-opens the demo tour when the Lab is active, even with a stored completion", () => {
    // Real user already finished the tour.
    const { result: real } = renderHook(() =>
      useRbtWalkthroughController({ userId: "admin-1", previewActive: false, labActive: false }));
    act(() => real.current.finish());
    expect(readCompletion("admin-1")?.version).toBe(TOUR_VERSION);

    const { result: lab } = renderHook(() =>
      useRbtWalkthroughController({ userId: "admin-1", previewActive: false, labActive: true }));
    expect(lab.current.open).toBe(true);
    expect(lab.current.isDemo).toBe(true);
    expect(lab.current.canPersist).toBe(false);
    expect(readLabDemoSeen()).toBe(true);
  });

  it("lab finish/dismiss never writes completion for the underlying real user", () => {
    const { result } = renderHook(() =>
      useRbtWalkthroughController({ userId: "admin-1", previewActive: false, labActive: true }));
    act(() => result.current.finish());
    expect(readCompletion("admin-1")).toBeNull();
    act(() => result.current.dismiss());
    expect(readCompletion("admin-1")).toBeNull();
  });

  it("view-as preview never marks another person's tour complete", () => {
    const { result } = renderHook(() =>
      useRbtWalkthroughController({ userId: "admin-1", previewActive: true, labActive: false }));
    expect(result.current.open).toBe(false);
    act(() => result.current.finish());
    expect(readCompletion("admin-1")).toBeNull();
  });

  it("resetDemoTour clears only the lab marker so the tour can replay", () => {
    const { result } = renderHook(() =>
      useRbtWalkthroughController({ userId: "admin-1", previewActive: false, labActive: true }));
    expect(readLabDemoSeen()).toBe(true);
    act(() => result.current.resetDemoTour());
    expect(readLabDemoSeen()).toBe(false);
    act(() => result.current.start({ replay: false }));
    expect(result.current.open).toBe(true);
    expect(result.current.index).toBe(0);
  });

  it("real RBT first login auto-opens once per version and persists completion", () => {
    clearLabDemoTourState();
    const first = renderHook(() =>
      useRbtWalkthroughController({ userId: "rbt-real", previewActive: false, labActive: false }));
    expect(first.result.current.open).toBe(true);
    expect(first.result.current.canPersist).toBe(true);
    act(() => first.result.current.finish());
    expect(readCompletion("rbt-real")?.version).toBe(TOUR_VERSION);

    const second = renderHook(() =>
      useRbtWalkthroughController({ userId: "rbt-real", previewActive: false, labActive: false }));
    expect(second.result.current.open).toBe(false);
  });
});

describe("lab wiring stays mounted and read-only", () => {
  it("shell mounts the Lab bar inside the walkthrough provider on every /rbt/app route", () => {
    const shell = read("src/pages/rbt/app/shell.tsx");
    const providerIdx = shell.indexOf("<RbtWalkthroughProvider>");
    const barIdx = shell.indexOf("<RbtExperienceLabBar />");
    const outletIdx = shell.indexOf("<Outlet />");
    expect(providerIdx).toBeGreaterThan(-1);
    expect(barIdx).toBeGreaterThan(providerIdx);
    expect(outletIdx).toBeGreaterThan(barIdx);
  });

  it("lab bar navigates on stage change and offers tour + reset + exit controls", () => {
    const bar = read("src/pages/rbt/app/RbtExperienceLabBar.tsx");
    expect(bar).toMatch(/navigate\(stageRoute\(stage\)\)/);
    expect(bar).toMatch(/Play walkthrough/);
    expect(bar).toMatch(/Restart first-login tour/);
    expect(bar).toMatch(/Demo only — nothing saved/);
    expect(bar).toMatch(/aria-label="Training pathway"/);
    expect(bar).toMatch(/aria-label="Lifecycle stage"/);
    expect(bar).toMatch(/aria-live="polite"/);
    // No Supabase writes from the Lab surface.
    expect(bar).not.toMatch(/supabase\.(from|rpc)/);
  });

  it("lab-mode consumers disable write CTAs", () => {
    for (const rel of [
      "src/pages/rbt/app/training/RbtProgram.tsx",
      "src/pages/rbt/app/training/RbtSkillPassport.tsx",
    ]) {
      expect(read(rel)).toMatch(/canWrite=\{[^}]*!lab\.active[^}]*\}/);
    }
  });
});