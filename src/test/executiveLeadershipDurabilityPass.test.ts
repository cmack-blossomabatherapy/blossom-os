/**
 * Executive Leadership final durability pass.
 *
 * Verifies:
 * - State Operations no longer surfaces seed fallback copy as
 *   operational truth for Executive-visible state health.
 * - Resource Library resource requests persist through system_issues
 *   (Super Admin intake) instead of localStorage.
 * - Phone admin settings no longer expose Monday/Make links to users.
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";

const read = (p: string) => fs.readFileSync(p, "utf8");
const stateOps = read("src/pages/os/stateDirector/StateDirectorPages.tsx");
const resLib = read("src/pages/os/OSResourceLibrary.tsx");
const phone = read("src/pages/phone/PhonePages.tsx");

describe("Executive Leadership durability pass", () => {
  it("State Operations removes seed fallback user-facing copy", () => {
    expect(stateOps).not.toMatch(/Seed fallback metrics/);
    expect(stateOps).not.toMatch(/sample fallback values/);
    expect(stateOps).not.toMatch(/Source: Seed fallback/);
  });

  it("State Operations only rolls up live/manual/integration metrics", () => {
    // Executive-visible rollup must exclude seed rows.
    expect(stateOps).toMatch(/liveMetrics/);
    expect(stateOps).toMatch(/"live"|'live'/);
    expect(stateOps).toMatch(/No live state metrics connected/);
  });

  it("Resource Library drops resource_requests localStorage", () => {
    expect(resLib).not.toMatch(/localStorage\.(get|set)Item\(\s*["']resource_requests["']/);
    expect(resLib).not.toMatch(/"resource_requests"/);
  });

  it("Resource Library submits requests through system_issues", () => {
    expect(resLib).toMatch(/useSystemIssues/);
    expect(resLib).toMatch(/request_type:\s*"resource_request"/);
    expect(resLib).toMatch(/affected_route:\s*"\/resource-library"/);
  });

  it("Phone admin no longer renders Monday/Make links to users", () => {
    expect(phone).not.toMatch(/Monday board link/);
    expect(phone).not.toMatch(/Make scenario link/);
    expect(phone).not.toMatch(/https:\/\/monday\.com/);
    expect(phone).not.toMatch(/https:\/\/make\.com/);
  });
});