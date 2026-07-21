// Asserts the RBT-visible surfaces contain none of the operational
// sync/telemetry phrasing that was previously leaking into the RBT UI.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const read = (p: string) => readFileSync(path.resolve(process.cwd(), p), "utf8");

const RBT_FILES = [
  "src/pages/rbt/app/active/ActiveHome.tsx",
  "src/pages/rbt/app/active/ActiveSchedule.tsx",
  "src/pages/rbt/app/cards.tsx",
  "src/pages/rbt/app/pages.tsx",
];

const FORBIDDEN_PHRASES = [
  "CentralReach is the source of truth",
  "No sync recorded",
  "Waiting on the first sync",
  "may be stale",
  "CentralReach Data Hub",
  "Ask an admin to link",
];

describe("RBT UI never shows operational sync telemetry", () => {
  for (const file of RBT_FILES) {
    const src = read(file);
    for (const phrase of FORBIDDEN_PHRASES) {
      it(`${file} does not contain "${phrase}"`, () => {
        expect(src.toLowerCase()).not.toContain(phrase.toLowerCase());
      });
    }
  }

  it("ActiveHome no longer renders FreshnessPill or useCrSync", () => {
    const src = read("src/pages/rbt/app/active/ActiveHome.tsx");
    expect(src).not.toMatch(/FreshnessPill/);
    expect(src).not.toMatch(/useCrSync/);
  });

  it("ActiveSchedule no longer renders FreshnessPill or useCrSync", () => {
    const src = read("src/pages/rbt/app/active/ActiveSchedule.tsx");
    expect(src).not.toMatch(/FreshnessPill/);
    expect(src).not.toMatch(/useCrSync/);
  });

  it("CrDataStatusCard renders null (kept as no-op)", () => {
    const src = read("src/pages/rbt/app/cards.tsx");
    expect(src).toMatch(/CrDataStatusCard[\s\S]{0,400}return null/);
  });

  it("RBT Learn surfaces the Welcome to Blossom entry point", () => {
    const src = read("src/pages/rbt/app/pages.tsx");
    expect(src).toMatch(/WelcomeToBlossomCard/);
  });
});
