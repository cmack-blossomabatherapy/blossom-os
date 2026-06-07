import { describe, it, expect } from "vitest";
import fs from "node:fs";

const APP = fs.readFileSync("src/App.tsx", "utf8");
const SD_HOME = fs.readFileSync("src/components/training/SDLearnerHome.tsx", "utf8");
const OS_TRAINING = fs.readFileSync("src/pages/os/OSTraining.tsx", "utf8");

describe("Welcome to Blossom shell fix", () => {
  it("/training/welcome renders OSWelcomeToBlossom directly", () => {
    expect(APP).toMatch(/path="\/training\/welcome"\s+element={<OSWelcomeToBlossom\s*\/>}/);
  });

  it("/training/welcome does NOT redirect to /onboarding/phase/welcome", () => {
    expect(APP).not.toMatch(/path="\/training\/welcome"\s+element={<Navigate to="\/onboarding\/phase\/welcome"/);
  });

  it("/onboarding/phase/welcome redirects to /training/welcome", () => {
    expect(APP).toMatch(/path="\/onboarding\/phase\/welcome"\s+element={<Navigate to="\/training\/welcome"/);
  });

  it("/onboarding/phase/welcome/legacy redirects to /training/welcome", () => {
    expect(APP).toMatch(/path="\/onboarding\/phase\/welcome\/legacy"\s+element={<Navigate to="\/training\/welcome"/);
  });

  it("OSWelcomeToBlossom is not declared inside the AppLayout route group", () => {
    // OSWelcomeToBlossom should only be rendered from the OS route group (before AppLayout).
    const appLayoutStart = APP.indexOf("<ProtectedRoute><AppLayout />");
    expect(appLayoutStart).toBeGreaterThan(-1);
    const appLayoutSection = APP.slice(appLayoutStart);
    expect(appLayoutSection).not.toMatch(/element={<OSWelcomeToBlossom/);
  });

  it("SDLearnerHome Welcome CTA navigates to /training/welcome (not /onboarding)", () => {
    expect(SD_HOME).toContain('navigate("/training/welcome")');
    expect(SD_HOME).not.toContain('navigate("/onboarding/phase/welcome")');
  });

  it("OSTraining Welcome CTAs navigate to /training/welcome", () => {
    expect(OS_TRAINING).toContain('navigate("/training/welcome")');
    expect(OS_TRAINING).not.toContain('navigate("/onboarding/phase/welcome")');
  });
});