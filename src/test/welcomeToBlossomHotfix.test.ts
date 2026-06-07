import { describe, it, expect } from "vitest";
import fs from "node:fs";

const WELCOME = fs.readFileSync("src/pages/os/OSWelcomeToBlossom.tsx", "utf8");
const APP = fs.readFileSync("src/App.tsx", "utf8");

describe("Welcome to Blossom hotfix — video + bottom layout", () => {
  it("exposes configurable video URL constants", () => {
    expect(WELCOME).toMatch(/WELCOME_VIDEO_URL\s*=/);
    expect(WELCOME).toMatch(/WELCOME_VIDEO_POSTER_URL\s*=/);
  });

  it("defaults video constants to empty so pending panel renders", () => {
    expect(WELCOME).toMatch(/WELCOME_VIDEO_URL\s*=\s*""/);
  });

  it("renders 'Welcome video coming soon' pending panel copy", () => {
    expect(WELCOME).toContain("Welcome video coming soon");
    expect(WELCOME).toMatch(/can be added later[\s\S]*without blocking your training/);
  });

  it("does not render a <video> element when URL is empty", () => {
    // <video> only appears inside the hasVideo branch
    expect(WELCOME).toMatch(/hasVideo \? \(/);
    expect(WELCOME).toMatch(/const hasVideo = Boolean\(WELCOME_VIDEO_URL\)/);
  });

  it("offers Mark welcome reviewed + Continue to State Director Journey", () => {
    expect(WELCOME).toContain("Mark welcome reviewed");
    expect(WELCOME).toContain("Continue to State Director Journey");
  });

  it("bottom CTA navigates to /training, not legacy onboarding/week/1", () => {
    expect(WELCOME).not.toMatch(/\/onboarding\/week\/1/);
    expect(WELCOME).toMatch(/navigate\("\/training"\)/);
  });

  it("secondary CTA opens Resource Library", () => {
    expect(WELCOME).toContain("Open Resource Library");
    expect(WELCOME).toMatch(/\/resource-library/);
  });

  it("keeps Chad and Shira leadership letters", () => {
    expect(WELCOME).toContain("Chad Kaufman");
    expect(WELCOME).toContain("Shira Lasry");
  });

  it("includes revisit note", () => {
    expect(WELCOME).toMatch(/revisit Welcome to Blossom anytime/);
  });

  it("/training/welcome renders OSWelcomeToBlossom directly (no redirect to /onboarding)", () => {
    expect(APP).toMatch(/path="\/training\/welcome"\s+element={<OSWelcomeToBlossom/);
    expect(APP).not.toMatch(/path="\/training\/welcome"\s+element={<Navigate to="\/onboarding\/phase\/welcome"/);
  });
});
