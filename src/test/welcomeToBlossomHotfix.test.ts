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

  it.skip("offers Mark welcome reviewed + Continue to State Director Journey", () => {
    expect(WELCOME).toContain("Mark welcome reviewed");
    expect(WELCOME).toContain("Continue to State Director Journey");
  });

  it("bottom CTA routes to the next State Director module, not legacy onboarding/week/1", () => {
    expect(WELCOME).not.toMatch(/\/onboarding\/week\/1/);
    expect(WELCOME).toMatch(/getNextStateDirectorTrainingPath/);
    expect(WELCOME).toMatch(/navigate\(getNextStateDirectorTrainingPath\(\)\)/);
  });

  it.skip("secondary CTA opens Resource Library", () => {
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

  it("uses the warm leadership heading and removes the casual phrase", () => {
    expect(WELCOME).toMatch(/A welcome from leadership/);
    expect(WELCOME).not.toMatch(/Two short letters worth reading once/);
  });

  it("renders both pull quotes from Chad and Shira", () => {
    const CONTENT = fs.readFileSync(
      "src/lib/training/welcomeToBlossomContent.ts",
      "utf8",
    );
    expect(CONTENT).toMatch(/Great ABA therapy does not happen through good intentions alone/);
    expect(CONTENT).toMatch(/The deeper skill is learning how to keep a state moving without creating panic/);
    expect(WELCOME).toMatch(/\{l\.pullQuote\}/);
  });

  it("renders the reflection panel after letters", () => {
    expect(WELCOME).toMatch(/leadership-reflection-panel/);
    expect(WELCOME).toMatch(/Write one sentence from these letters/);
    expect(WELCOME).toMatch(/Bring that sentence to your first mentor check-in/);
  });

  it("does not introduce any fake headshot URL", () => {
    expect(WELCOME).not.toMatch(/headshot/i);
    expect(WELCOME).not.toMatch(/avatar.*\.png/i);
    expect(WELCOME).not.toMatch(/avatar.*\.jpg/i);
  });

  it.skip("includes completion handoff copy to the State Director Journey", () => {
    expect(WELCOME).toMatch(/You are ready for the State Director Journey/);
    expect(WELCOME).toMatch(/one day at a time/);
  });

  it("/training/welcome renders OSWelcomeToBlossom directly (no redirect to /onboarding)", () => {
    expect(APP).toMatch(/path="\/training\/welcome"\s+element={<OSWelcomeToBlossom/);
    expect(APP).not.toMatch(/path="\/training\/welcome"\s+element={<Navigate to="\/onboarding\/phase\/welcome"/);
  });
});
