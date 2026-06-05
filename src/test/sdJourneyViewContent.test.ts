import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const src = fs.readFileSync(
  path.join(process.cwd(), "src/components/training/SDJourneyView.tsx"),
  "utf8",
);

describe("SDJourneyView — learner content polish", () => {
  it("surfaces a Current focus card", () => {
    expect(src).toMatch(/Current focus/i);
  });

  it("surfaces a Next action affordance", () => {
    expect(src).toMatch(/Next action/i);
  });

  it("no longer labels day modules as 'placeholder'", () => {
    expect(src).not.toMatch(/placeholder/i);
  });
});