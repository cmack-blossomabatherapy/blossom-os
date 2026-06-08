import { describe, it, expect } from "vitest";
import fs from "node:fs";

const WELCOME = fs.readFileSync("src/pages/os/OSWelcomeToBlossom.tsx", "utf8");
const APP = fs.readFileSync("src/App.tsx", "utf8");

describe("Welcome to Blossom hotfix — video + bottom layout", () => {
  it("exposes configurable video URL constants", () => {
    expect(WELCOME).toMatch(/WELCOME_VIDEO_URL\s*=/);
    expect(WELCOME).toMatch(/WELCOME_VIDEO_POSTER_URL\s*=/);
  });

  it("welcome video URL is bound to the bundled CDN asset", () => {
    expect(WELCOME).toMatch(/WELCOME_VIDEO_URL\s*=\s*introVideoAsset\.url/);
    expect(WELCOME).toMatch(/intro-video-1\.1\.mp4\.asset\.json/);
  });

  it("renders Welcome Video from Blossom pending panel copy", () => {
    expect(WELCOME).toContain("Welcome Video from Blossom");
    expect(WELCOME).toMatch(/welcome video is being prepared[\s\S]*continue with the written/);
  });

  it("does not render a <video> element when no welcome video resource is found", () => {
    // <video> only appears inside the hasVideo branch
    expect(WELCOME).toMatch(/hasVideo \? \(/);
    expect(WELCOME).toMatch(/const hasVideo = Boolean\(resolvedVideoUrl\)/);
  });

  it("looks up the welcome video from Resource Library at runtime", () => {
    expect(WELCOME).toMatch(/computeSdWelcomeVideoState/);
    expect(WELCOME).toMatch(/useAdminResources/);
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

  it("keeps Chad and Shira leadership letters (via content module)", () => {
    const CONTENT = fs.readFileSync(
      "src/lib/training/welcomeToBlossomContent.ts",
      "utf8",
    );
    expect(CONTENT).toContain("Chad Kaufman");
    expect(CONTENT).toContain("Shira Lasry");
    expect(WELCOME).toMatch(/WELCOME_LEADERSHIP_LETTERS/);
  });

  it("includes completion handoff copy to the State Director Journey", () => {
    expect(WELCOME).toMatch(/You are ready for the State Director Journey/);
    expect(WELCOME).toMatch(/one day at a time/);
  });

  it("/training/welcome renders OSWelcomeToBlossom directly (no redirect to /onboarding)", () => {
    expect(APP).toMatch(/path="\/training\/welcome"\s+element={<OSWelcomeToBlossom/);
    expect(APP).not.toMatch(/path="\/training\/welcome"\s+element={<Navigate to="\/onboarding\/phase\/welcome"/);
  });
});
