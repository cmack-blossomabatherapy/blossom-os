// Asserts the RBT-visible surfaces contain none of the operational
// sync/telemetry phrasing that was previously leaking into the RBT UI.
// Uses a recursive directory scan so any new RBT-facing file is covered.
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const read = (p: string) => readFileSync(p, "utf8");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "__tests__" || name.startsWith(".")) continue;
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.(tsx?|jsx?)$/.test(name)) out.push(full);
  }
  return out;
}

const RBT_ROOT = path.resolve(process.cwd(), "src/pages/rbt/app");
const RBT_FILES = walk(RBT_ROOT);

// Phrases that leak internal source-health / sync telemetry to RBTs.
// Comment lines (leading `//` or inside `/* */`) are excluded from the scan
// so implementation notes remain fine.
const FORBIDDEN_PHRASES = [
  "CentralReach is the source of truth",
  "No sync recorded",
  "Waiting on the first sync",
  "may be stale",
  "CentralReach Data Hub",
  "Ask an admin to link",
  "canonical rows",
  "v_cr_canonical_sessions",
  "billing export",
  "Source: v_cr",
  "source of truth",
  "one-to-one BCBA→RBT observation",
  "97155 supervision billed",
];

function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((l) => !/^\s*\/\//.test(l))
    .join("\n");
}

describe("RBT UI never shows operational sync telemetry", () => {
  for (const file of RBT_FILES) {
    const src = stripComments(read(file));
    for (const phrase of FORBIDDEN_PHRASES) {
      it(`${path.relative(process.cwd(), file)} does not contain "${phrase}"`, () => {
        expect(src.toLowerCase()).not.toContain(phrase.toLowerCase());
      });
    }
  }

  it("ActiveHome no longer renders FreshnessPill or useCrSync", () => {
    const src = read(path.resolve(process.cwd(), "src/pages/rbt/app/active/ActiveHome.tsx"));
    expect(src).not.toMatch(/FreshnessPill/);
    expect(src).not.toMatch(/useCrSync/);
  });

  it("ActiveSchedule no longer renders FreshnessPill or useCrSync", () => {
    const src = read(path.resolve(process.cwd(), "src/pages/rbt/app/active/ActiveSchedule.tsx"));
    expect(src).not.toMatch(/FreshnessPill/);
    expect(src).not.toMatch(/useCrSync/);
  });

  it("CrDataStatusCard renders null (kept as no-op)", () => {
    const src = read(path.resolve(process.cwd(), "src/pages/rbt/app/cards.tsx"));
    expect(src).toMatch(/CrDataStatusCard[\s\S]{0,400}return null/);
  });

  it("RBT Learn surfaces the Welcome to Blossom entry point", () => {
    const src = read(path.resolve(process.cwd(), "src/pages/rbt/app/pages.tsx"));
    expect(src).toMatch(/WelcomeToBlossomCard/);
  });

  it("Skill Passport no longer directs RBTs to admin CentralReach Data Hub", () => {
    const src = read(path.resolve(process.cwd(), "src/pages/rbt/app/training/RbtSkillPassport.tsx"));
    expect(src).not.toMatch(/CentralReach Data Hub/i);
    expect(src).not.toMatch(/Ask an admin to link/i);
  });

  it("ActiveSchedule no longer exposes a raw Source field on session detail", () => {
    const src = read(path.resolve(process.cwd(), "src/pages/rbt/app/active/ActiveSchedule.tsx"));
    expect(src).not.toMatch(/label="Source"/);
  });
});
