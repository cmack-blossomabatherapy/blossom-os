import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const docPath = path.join(
  process.cwd(),
  "docs/state-director-training-launch-checklist.md",
);

describe("State Director Training launch checklist doc", () => {
  it("exists", () => {
    expect(fs.existsSync(docPath)).toBe(true);
  });

  const md = fs.existsSync(docPath) ? fs.readFileSync(docPath, "utf8") : "";

  it("covers employee link, enrollment, path, state, mentor", () => {
    expect(md).toMatch(/Employee record is linked to the auth user/i);
    expect(md).toMatch(/State Director Academy enrollment/i);
    expect(md).toMatch(/Choose path: `existing_state` or `new_state`/i);
    expect(md).toMatch(/assigned_state/);
    expect(md).toMatch(/mentor_employee_id/);
  });

  it("covers welcome videos (Chad, Shira) and SOP resources", () => {
    expect(md).toMatch(/Welcome from Chad Kaufman/);
    expect(md).toMatch(/A Note from Shira Lasry/);
    expect(md).toMatch(/SOP resources from the Resource Library/i);
  });

  it("verifies Week 1 Day 1 starts with Welcome to Blossom", () => {
    expect(md).toMatch(/Week 1 Day 1[^\n]*Welcome to Blossom/i);
  });

  it("verifies leadership dashboard and readiness summary", () => {
    expect(md).toMatch(/training\/academy\/leadership/);
    expect(md).toMatch(/Copy readiness summary/);
    expect(md).toMatch(/Launch Readiness checklist/);
  });

  it("includes a day-one walkthrough script", () => {
    expect(md).toMatch(/Day-one walkthrough script/i);
  });

  it("states that pending videos do not block training or launch", () => {
    expect(md).toMatch(/Pending videos \*\*do not block\*\*/);
  });
});