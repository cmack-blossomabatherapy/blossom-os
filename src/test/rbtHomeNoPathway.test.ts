/**
 * Regression: signed-in real RBT whose profile is linked but pathway is
 * still being assigned must see the polished Program Setup journey on
 * /rbt/app/home — NEVER the legacy dashboard with red credential/schedule
 * error cards. Preserves ActiveHome for assigned pathways and Experience
 * Lab overrides.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const read = (rel: string) => readFileSync(path.resolve(process.cwd(), rel), "utf8");
const PAGES = "src/pages/rbt/app/pages.tsx";

describe("RBT Home — no-pathway state", () => {
  const src = read(PAGES);

  it("imports and uses ProgramSetupJourney as the no-pathway fallback", () => {
    expect(src).toMatch(
      /import\s*\{\s*ProgramSetupJourney\s*\}\s*from\s*"\.\/training\/ProgramSetupJourney"/,
    );
    expect(src).toMatch(/<ProgramSetupJourney[\s\S]*employeeLinked=\{Boolean\(employeeId\)\}/);
    expect(src).toMatch(/<ProgramSetupJourney[\s\S]*onRetry=\{handleRetry\}/);
  });

  it("derives employeeId + pathway from useRbtIdentity + useProgram", () => {
    expect(src).toMatch(/useRbtIdentity\(\)/);
    expect(src).toMatch(/useProgram\(employeeId\)/);
  });

  it("renders the setup journey when there is no pathway OR the cards feed errored", () => {
    // Whole branch: error || programLoading || !pathway  → ProgramSetupJourney
    expect(src).toMatch(
      /if\s*\(\s*error\s*\|\|\s*programLoading\s*\|\|\s*!pathway\s*\)\s*\{[\s\S]*<ProgramSetupJourney/,
    );
  });

  it("never renders the raw 'could not load your home' error card", () => {
    expect(src).not.toMatch(/errorLabel="We could not load your home/);
  });

  it("preserves ActiveHome routing for lab preview and active lifecycle stages", () => {
    expect(src).toMatch(/if\s*\(\s*lab\.active\s*\)\s*return\s*<ActiveHome/);
    expect(src).toMatch(/ACTIVE_STAGES[\s\S]*<ActiveHome/);
  });

  it("preboarding stage still renders PreboardingHomeCards (not the setup journey)", () => {
    expect(src).toMatch(/isPreboardingStage\(context\.lifecycleStage\)[\s\S]*<PreboardingHomeCards/);
  });
});
