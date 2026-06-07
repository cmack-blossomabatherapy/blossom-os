import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("OSTraining is wired to the DB-backed learner home", () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), "src/pages/os/OSTraining.tsx"),
    "utf8",
  );

  it("imports loadLearnerHome, startLearnerModule, completeLearnerModule", () => {
    expect(src).toMatch(/loadLearnerHome/);
    expect(src).toMatch(/startLearnerModule/);
    expect(src).toMatch(/completeLearnerModule/);
    expect(src).toMatch(/from "@\/lib\/academy\/learnerHome"/);
  });

  it("renders the live launch tracker driven by learner home", () => {
    expect(src).toMatch(/data-testid="sd-db-launch-tracker"/);
    expect(src).toMatch(/data-testid="sd-db-start-next"/);
    expect(src).toMatch(/data-testid="sd-db-complete-next"/);
  });

  it("uses launch-scoped progress (no hard-coded /133 totals)", () => {
    expect(src).not.toMatch(/\/133/);
    expect(src).toMatch(/launchProgress\.pct/);
    expect(src).toMatch(/launchProgress\.requiredCompleted/);
    expect(src).toMatch(/launchProgress\.requiredTotal/);
  });
});