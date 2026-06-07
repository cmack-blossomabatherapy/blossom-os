import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const src = fs.readFileSync(
  path.join(process.cwd(), "src/components/training/SDLearnerHome.tsx"),
  "utf8",
);

describe("SD Learner Home — Start here today block", () => {
  it("renders the day-one anchor with calm guidance copy", () => {
    expect(src).toMatch(/data-testid="sd-start-here-today"/);
    expect(src).toMatch(/Start here today/);
    expect(src).toMatch(/Welcome to Blossom/);
    expect(src).toMatch(/Week 1 · Day 1/);
    expect(src).toMatch(/one short reflection/i);
    expect(src).toMatch(/Ask your mentor/);
    expect(src).toMatch(/Do not worry about future weeks/);
  });

  it("does not introduce broken hash links or harsh missing language", () => {
    expect(src).not.toMatch(/href="#"/);
    expect(src).not.toMatch(/coming soon/i);
    expect(src).not.toMatch(/\bbroken\b/i);
    expect(src).not.toMatch(/\blorem\b/i);
  });
});