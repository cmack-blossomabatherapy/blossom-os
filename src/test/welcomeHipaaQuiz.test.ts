import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { WELCOME_HIPAA_QUIZ } from "@/lib/training/welcomeToBlossomContent";

const PAGE = fs.readFileSync("src/pages/os/OSWelcomeToBlossom.tsx", "utf8");
const QUIZ = fs.readFileSync("src/components/training/WelcomeHipaaQuiz.tsx", "utf8");

describe("Welcome to Blossom — HIPAA knowledge check", () => {
  it("defines at least 5 questions with a sane passing threshold", () => {
    expect(WELCOME_HIPAA_QUIZ.questions.length).toBeGreaterThanOrEqual(5);
    expect(WELCOME_HIPAA_QUIZ.passingScore).toBeGreaterThanOrEqual(4);
    expect(WELCOME_HIPAA_QUIZ.passingScore).toBeLessThanOrEqual(WELCOME_HIPAA_QUIZ.questions.length);
    expect(WELCOME_HIPAA_QUIZ.moduleKey).toBe("welcome-hipaa-quiz-passed");
  });

  it("every question has a valid correctIndex, distinct options, and an explanation", () => {
    for (const q of WELCOME_HIPAA_QUIZ.questions) {
      expect(q.options.length).toBeGreaterThanOrEqual(3);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(q.options.length);
      expect(new Set(q.options).size).toBe(q.options.length);
      expect(q.explanation.length).toBeGreaterThan(20);
      expect(q.prompt.length).toBeGreaterThan(10);
    }
  });

  it("Welcome page mounts the quiz and gates the launch-path buttons on it", () => {
    expect(PAGE).toMatch(/WelcomeHipaaQuiz/);
    expect(PAGE).toMatch(/hipaaQuizPassed/);
    // Both continue buttons are disabled when the quiz has not been passed.
    expect(PAGE).toMatch(/data-testid="welcome-reflection-continue"[\s\S]{0,200}disabled=\{!hipaaQuizPassed\}/);
    expect(PAGE).toMatch(/data-testid="welcome-continue-launch-path"[\s\S]{0,200}disabled=\{!hipaaQuizPassed\}/);
  });

  it("quiz component persists pass state via the onboarding module key and supports retake", () => {
    expect(QUIZ).toMatch(/markModuleComplete\(\s*(?:quiz\.moduleKey|WELCOME_HIPAA_QUIZ\.moduleKey)/);
    expect(QUIZ).toMatch(/unmarkModule/);
    expect(QUIZ).toMatch(/data-testid="hipaa-quiz-submit"/);
    expect(QUIZ).toMatch(/data-testid="hipaa-quiz-retake"/);
  });
});