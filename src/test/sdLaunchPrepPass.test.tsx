/**
 * State Director — Final Launch Prep Pass tests.
 *
 * Verifies the launch readiness checklist, day-one admin guide, mentor
 * check-in guide, and the learner "Start here today" block all render and
 * contain the required copy.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import {
  SDLaunchReadinessPanel,
  SDDayOneAdminGuide,
  SDMentorCheckInGuide,
} from "@/components/training/SDLaunchReadinessPanel";

vi.mock("@/hooks/useAdminResources", () => ({
  useAdminResources: () => ({ resources: [], loading: false, error: null }),
}));

function renderWithRouter(ui: React.ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("SD Launch Readiness Panel", () => {
  it("renders all five checklist groups", () => {
    renderWithRouter(<SDLaunchReadinessPanel />);
    expect(screen.getByTestId("sd-launch-readiness-panel")).toBeInTheDocument();
    expect(screen.getByTestId("sd-launch-learner")).toBeInTheDocument();
    expect(screen.getByTestId("sd-launch-content")).toBeInTheDocument();
    expect(screen.getByTestId("sd-launch-resources")).toBeInTheDocument();
    expect(screen.getByTestId("sd-launch-tracking")).toBeInTheDocument();
    expect(screen.getByTestId("sd-launch-design")).toBeInTheDocument();
  });

  it("surfaces missing SOPs and unmatched uploads in the resource group", () => {
    renderWithRouter(<SDLaunchReadinessPanel />);
    const resources = screen.getByTestId("sd-launch-resources");
    // With empty live resources, manifest is fully missing.
    expect(within(resources).getByText(/required State Director SOPs counted/i)).toBeInTheDocument();
    expect(within(resources).getByText(/required SOPs still missing/i)).toBeInTheDocument();
    expect(within(resources).getByText(/unmatched uploads/i)).toBeInTheDocument();
    expect(within(resources).getByText(/file repair/i)).toBeInTheDocument();
    expect(within(resources).getByText(/Privacy \/ vault items excluded/i)).toBeInTheDocument();
  });

  it("learner setup group lists the six manual confirmation items", () => {
    renderWithRouter(<SDLaunchReadinessPanel />);
    const learner = screen.getByTestId("sd-launch-learner");
    [
      "Employee profile linked",
      "Auth user linked",
      "State assigned",
      "Mentor assigned",
      "State Director journey assigned",
      "Start date entered",
    ].forEach((label) => {
      expect(within(learner).getByText(label)).toBeInTheDocument();
    });
  });

  it("content setup confirms every required curriculum element", () => {
    renderWithRouter(<SDLaunchReadinessPanel />);
    const content = screen.getByTestId("sd-launch-content");
    [
      "Welcome to Blossom ready",
      "Week 1 content complete",
      /Weeks 2.{1,2}5 content complete/,
      "Knowledge checks present",
      "Reflection prompts present",
      "Shadowing modules present",
      "Final readiness modules present",
    ].forEach((label) => {
      expect(within(content).getByText(label)).toBeInTheDocument();
    });
  });
});

describe("SD Day-One Admin Guide", () => {
  it("renders ten ordered admin steps", () => {
    renderWithRouter(<SDDayOneAdminGuide />);
    const panel = screen.getByTestId("sd-day-one-admin-guide");
    expect(within(panel).getByText(/Day-One State Director Setup/i)).toBeInTheDocument();
    const items = within(panel).getAllByRole("listitem");
    expect(items).toHaveLength(10);
    expect(within(panel).getByText(/Send the learner their first-day instructions/i)).toBeInTheDocument();
  });
});

describe("SD Mentor Check-In Guide", () => {
  it("includes all required mentor sections", () => {
    renderWithRouter(<SDMentorCheckInGuide />);
    const panel = screen.getByTestId("sd-mentor-checkin-guide");
    [
      /After Day 1/i,
      /After Week 1/i,
      /Shadowing evidence/i,
      /Readiness signs/i,
      /When to escalate/i,
      /How to mark sign-off/i,
    ].forEach((re) => {
      expect(within(panel).getByText(re)).toBeInTheDocument();
    });
  });
});