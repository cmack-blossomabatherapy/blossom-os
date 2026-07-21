/**
 * Regression: with the RBT Experience Lab active on /rbt/app/home, the
 * page must render the synthesised ActiveHome cockpit — NOT the generic
 * lifecycle-cards home, and NOT any "could not load" / "temporarily
 * unavailable" error surface. The walkthrough's "Take me there" must
 * navigate AND close the dialog so the destination page is visible
 * without a bounce/remount back to Home.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const read = (rel: string) =>
  readFileSync(path.resolve(process.cwd(), rel), "utf8");

const PAGES_SRC = "src/pages/rbt/app/pages.tsx";
const WALK_SRC = "src/pages/rbt/app/RbtWalkthrough.tsx";
const PROGRAM_SRC = "src/pages/rbt/app/training/RbtProgram.tsx";
const USE_PROGRAM_SRC = "src/pages/rbt/app/training/useProgram.ts";
const ACTIVE_HOME_SRC = "src/pages/rbt/app/active/ActiveHome.tsx";

describe("Experience Lab overrides RBT Home routing", () => {
  it("RbtHome short-circuits to ActiveHome when lab.active — before loading/setup branches", () => {
    const src = read(PAGES_SRC);
    expect(src).toMatch(/useExperienceLab/);
    // The lab.active guard exists and returns ActiveHome.
    const guard = /if\s*\(\s*lab\.active\s*\)\s*return\s*<ActiveHome\s*\/>/;
    expect(src).toMatch(guard);
    // The guard must appear BEFORE the loading/setup render paths so the
    // preview never falls through into the ProgramSetupJourney fallback.
    const guardIdx = src.search(guard);
    const loadingIdx = src.indexOf("animate-pulse");
    const setupIdx = src.indexOf("<ProgramSetupJourney");
    expect(guardIdx).toBeGreaterThan(-1);
    expect(loadingIdx).toBeGreaterThan(guardIdx);
    expect(setupIdx).toBeGreaterThan(guardIdx);
    // The raw "could not load your home" red error card is gone entirely.
    expect(src).not.toMatch(/We could not load your home/);
  });

  it("useProgram synthesises the selected pathway+stage without touching Supabase", () => {
    const src = read(USE_PROGRAM_SRC);
    // Lab short-circuit must be at the very top of load(), before any
    // supabase.from(...) call. We check ordering of the two literals.
    const labIdx = src.indexOf("lab.active && lab.state");
    const firstDb = src.indexOf("supabase.from");
    expect(labIdx).toBeGreaterThan(-1);
    expect(firstDb).toBeGreaterThan(labIdx);
  });

  it("Program step drilldown is disabled in lab preview (canWrite blocks writes)", () => {
    const src = read(PROGRAM_SRC);
    // Sheet uses canWrite = ... && !lab.active so mutation buttons are
    // guaranteed disabled during preview.
    expect(src).toMatch(/canWrite=\{[^}]*!lab\.active[^}]*\}/);
  });

  it("ActiveHome never issues Supabase reads while lab.active", () => {
    const src = read(ACTIVE_HOME_SRC);
    // The effect body starts with an `if (lab.active)` early return before
    // any supabase.from call.
    const labGuard = src.indexOf("if (lab.active)");
    const firstDb = src.indexOf("supabase.from");
    expect(labGuard).toBeGreaterThan(-1);
    expect(firstDb).toBeGreaterThan(labGuard);
  });
});

describe("Walkthrough 'Take me there' preserves the target route", () => {
  it("handleGo navigates AND dismisses so the target page is visible", () => {
    const src = read(WALK_SRC);
    // handleGo must call both navigate(step.route) and controller.dismiss().
    const handleGoBlock = src.match(/handleGo\s*=\s*useCallback\([\s\S]*?\},\s*\[[^\]]*\]\);/);
    expect(handleGoBlock).not.toBeNull();
    expect(handleGoBlock![0]).toMatch(/navigate\(step\.route\)/);
    expect(handleGoBlock![0]).toMatch(/controller\.dismiss\(\)/);
  });

  it("walkthrough auto-open never fires while preview/lab is active (canPersist=false)", () => {
    const src = read("src/lib/rbt/walkthrough.ts");
    // canPersist is derived from !previewActive, and the auto-open effect
    // early-returns when canPersist is false — the lab preview cannot
    // trigger a reopen after a route change.
    expect(src).toMatch(/canPersist\s*=\s*Boolean\(userId\)\s*&&\s*!previewActive/);
    expect(src).toMatch(/if\s*\(\s*!canPersist\s*\)\s*return;/);
  });

  it("provider treats lab.active OR OSRole preview as preview mode", () => {
    const src = read(WALK_SRC);
    expect(src).toMatch(/previewActive\s*=\s*Boolean\(\s*lab\.active\s*\|\|\s*osRole\?\.isPreviewing\s*\)/);
  });
});

describe("Direct /rbt/app/home admin entry -> Lab -> path/stage changes -> My Program stays put", () => {
  it("RbtHome only checks lab.active — no path/stage props leak into route decisions", () => {
    const src = read(PAGES_SRC);
    // The lab guard is unconditional on lab state contents; changing
    // pathway/preset must not re-route away from Home. We assert the
    // guard is a boolean check on `lab.active` only, not on lab.state.
    expect(src).toMatch(/if\s*\(\s*lab\.active\s*\)\s*return\s*<ActiveHome/);
    expect(src).not.toMatch(/if\s*\(\s*lab\.state/);
  });

  it("My Program route (/rbt/app/program) renders RbtProgram directly — not via lifecycle branching", () => {
    const app = read("src/App.tsx");
    expect(app).toMatch(/path="\/rbt\/app\/program"\s+element=\{<RbtProgramPage\s*\/>\}/);
  });
});