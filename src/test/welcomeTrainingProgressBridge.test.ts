import { describe, expect, it } from "vitest";
import { getProgress } from "@/lib/training/academyData";
import { WELCOME_TO_BLOSSOM_MODULES } from "@/lib/training/welcomeToBlossomContent";
import {
  completeWelcomeModuleEverywhere,
  getNextStateDirectorTrainingPath,
  isWelcomeModuleComplete,
  WELCOME_TO_SD_TRAINING_ID,
} from "@/lib/training/welcomeProgressBridge";

describe("Welcome to Blossom → State Director training progress bridge", () => {
  it("maps every Welcome module to its Week 1 Day 1 State Director training module", () => {
    expect(Object.keys(WELCOME_TO_SD_TRAINING_ID)).toEqual(
      WELCOME_TO_BLOSSOM_MODULES.map((module) => module.id),
    );
    expect(WELCOME_TO_SD_TRAINING_ID["welcome-video-from-blossom"]).toBe(
      "sd-w1d1-welcome-video-from-blossom",
    );
  });

  it("marking the Welcome video complete updates the learner progress source and advances continue navigation", () => {
    completeWelcomeModuleEverywhere("welcome-video-from-blossom");

    expect(isWelcomeModuleComplete("welcome-video-from-blossom", [])).toBe(true);
    expect(getProgress("sd-w1d1-welcome-video-from-blossom").status).toBe("completed");
    expect(getNextStateDirectorTrainingPath()).toBe("/training/sd-w1d1-mission-vision");
  });
});