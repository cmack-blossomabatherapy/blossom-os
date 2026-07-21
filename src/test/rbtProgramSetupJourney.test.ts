// Slice 1 contract: /rbt/app/program never dead-ends on "No pathway assigned yet".
// When there is no active pathway, RbtProgram renders the interactive
// ProgramSetupJourney with actionable links (Welcome, Skill Passport, Support)
// and a "Check again" retry that calls useProgram.reload().
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const read = (rel: string) => readFileSync(path.resolve(process.cwd(), rel), "utf8");

describe("Slice 1 — RBT Program setup journey", () => {
  it("ProgramSetupJourney file exists and exposes the expected props", () => {
    const src = read("src/pages/rbt/app/training/ProgramSetupJourney.tsx");
    expect(src).toMatch(/export\s+function\s+ProgramSetupJourney/);
    expect(src).toMatch(/employeeLinked:\s*boolean/);
    expect(src).toMatch(/onRetry:/);
  });

  it("ProgramSetupJourney links to Welcome, Skill Passport, and Support", () => {
    const src = read("src/pages/rbt/app/training/ProgramSetupJourney.tsx");
    expect(src).toMatch(/\/rbt\/app\/welcome/);
    expect(src).toMatch(/\/rbt\/app\/passport/);
    expect(src).toMatch(/\/rbt\/app\/support\/new\?category=training/);
  });

  it("ProgramSetupJourney uses RBT-appropriate copy (no technical/source-health language)", () => {
    const src = read("src/pages/rbt/app/training/ProgramSetupJourney.tsx");
    const forbidden = [
      /centralreach/i,
      /canonical/i,
      /\bsync\b/i,
      /\bstale\b/i,
      /source of truth/i,
      /pathway assigned yet/i, // the old dead-end phrasing
    ];
    for (const p of forbidden) expect(src).not.toMatch(p);
  });

  it("RbtProgram uses ProgramSetupJourney and no longer renders the dead-end empty state", () => {
    const src = read("src/pages/rbt/app/training/RbtProgram.tsx");
    expect(src).toMatch(/import\s+\{\s*ProgramSetupJourney\s*\}\s+from\s+"\.\/ProgramSetupJourney"/);
    expect(src).toMatch(/<ProgramSetupJourney[\s\S]*onRetry=/);
    expect(src).not.toMatch(/No pathway assigned yet/);
  });

  it("RbtProgram passes employeeLinked derived from useRbtIdentity.employeeId", () => {
    const src = read("src/pages/rbt/app/training/RbtProgram.tsx");
    expect(src).toMatch(/employeeLinked=\{Boolean\(employeeId\)\}/);
  });

  it("RbtProgram wires the retry button to useProgram.reload()", () => {
    const src = read("src/pages/rbt/app/training/RbtProgram.tsx");
    expect(src).toMatch(/onRetry=\{[\s\S]*await reload\(\)/);
  });
});