/**
 * State Director — Day-One Readiness tests.
 *
 * Confirms the learner panel renders, the welcome reflection action is
 * present, the welcome shell route is canonical, and Training Management
 * does not mark unverified day-one signals as Ready.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import fs from "node:fs";

import { SDDayOneReadinessPanel } from "@/components/training/SDDayOneReadinessPanel";
import { SDDayOneAdminPanel } from "@/components/training/SDDayOneAdminPanel";
import { SD_DAY_ONE_ITEMS } from "@/lib/training/sdDayOneReadiness";

vi.mock("@/hooks/useAdminResources", () => ({
  useAdminResources: () => ({ resources: [], loading: false, error: null }),
}));

function renderWithRouter(ui: React.ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("SDDayOneReadinessPanel (learner)", () => {
  it("renders all six day-one signals with helper copy", () => {
    renderWithRouter(<SDDayOneReadinessPanel />);
    expect(screen.getByTestId("sd-day-one-readiness-panel")).toBeInTheDocument();
    for (const item of SD_DAY_ONE_ITEMS) {
      expect(screen.getByText(item.label)).toBeInTheDocument();
    }
    // Key required labels from the spec.
    expect(screen.getByText(/Welcome to Blossom reviewed/i)).toBeInTheDocument();
    expect(screen.getByText(/Mission in my own words/i)).toBeInTheDocument();
    expect(screen.getByText(/One value I will model/i)).toBeInTheDocument();
    expect(screen.getByText(/Leadership-letter takeaway/i)).toBeInTheDocument();
    expect(screen.getByText(/Mentor check-in scheduled or completed/i)).toBeInTheDocument();
    expect(screen.getByText(/No access blockers/i)).toBeInTheDocument();
  });

  it("is honest that it is saved locally, not synced to the backend", () => {
    renderWithRouter(<SDDayOneReadinessPanel />);
    const note = screen.getByTestId("sd-day-one-local-only");
    expect(note.textContent).toMatch(/saved on this device/i);
    expect(note.textContent).not.toMatch(/synced to the database/i);
  });

  it("toggling an item persists to localStorage", () => {
    renderWithRouter(<SDDayOneReadinessPanel />);
    const btn = screen.getByTestId("sd-day-one-item-mentor-check-in");
    expect(btn.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(btn);
    expect(btn.getAttribute("aria-pressed")).toBe("true");
    expect(window.localStorage.getItem("blossom.sdDayOneReadiness.v1")).toMatch(
      /mentor-check-in.*true/,
    );
  });
});

describe("SDDayOneAdminPanel (Training Management)", () => {
  it("renders day-one columns and never marks unverified rows as Ready", () => {
    renderWithRouter(<SDDayOneAdminPanel />);
    const panel = screen.getByTestId("sd-day-one-admin-panel");
    [
      "Learner",
      "State",
      "Mentor",
      "Welcome reviewed",
      "First mentor check-in",
      "Access blockers",
      "Next action",
    ].forEach((col) => {
      expect(within(panel).getByText(col)).toBeInTheDocument();
    });
    // No hard-coded greens for the template row.
    expect(within(panel).queryByTestId("sd-day-one-chip-ready")).toBeNull();
    expect(within(panel).getAllByTestId("sd-day-one-chip-manual").length).toBeGreaterThan(0);
  });
});

describe("Welcome to Blossom shell + reflection handoff", () => {
  const APP = fs.readFileSync("src/App.tsx", "utf8");
  const WELCOME = fs.readFileSync("src/pages/os/OSWelcomeToBlossom.tsx", "utf8");
  const SD_HOME = fs.readFileSync(
    "src/components/training/SDLearnerHome.tsx",
    "utf8",
  );
  const TMC = fs.readFileSync(
    "src/pages/hr/TrainingManagementCenter.tsx",
    "utf8",
  );

  it("/training/welcome still renders inside the OS shell route", () => {
    expect(APP).toMatch(
      /path="\/training\/welcome"\s+element={<OSWelcomeToBlossom\s*\/>}/,
    );
  });

  it("welcome reflection panel surfaces day-one evidence framing and a continue action", () => {
    expect(WELCOME).toContain("data-testid=\"leadership-reflection-panel\"");
    expect(WELCOME).toMatch(/Day-One evidence/);
    expect(WELCOME).toContain("welcome-reflection-continue");
    expect(WELCOME).toContain('navigate("/training")');
  });

  it("pending welcome video is non-blocking (calm pending panel + continue still wired)", () => {
    // Calm "being prepared" copy still present.
    expect(WELCOME).toMatch(/being prepared/i);
    // Continue navigation does not require the video.
    expect(WELCOME).toContain('navigate("/training")');
    expect(WELCOME).not.toMatch(/disabled.*until.*video/i);
  });

  it("SDLearnerHome mounts the day-one readiness panel", () => {
    expect(SD_HOME).toContain("SDDayOneReadinessPanel");
  });

  it("Training Management mounts the day-one admin panel", () => {
    expect(TMC).toContain("SDDayOneAdminPanel");
  });

  it("does not use the old /onboarding/phase/welcome shell as the primary destination", () => {
    expect(SD_HOME).not.toContain('navigate("/onboarding/phase/welcome")');
    expect(WELCOME).not.toContain('navigate("/onboarding/phase/welcome")');
  });
});