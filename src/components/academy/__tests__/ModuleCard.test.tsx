import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ModuleCard } from "../ModuleCard";
import type { AcademyModule } from "@/lib/academy/types";

function baseModule(overrides: Partial<AcademyModule> = {}): AcademyModule {
  return {
    id: "m1",
    week_id: "w1",
    position: 1,
    title: "Welcome Video from Blossom",
    description: "Short welcome video.",
    module_type: "video",
    duration_label: "8 min",
    leader_name: "Chad Kaufman",
    department: "Leadership",
    is_required: true,
    applies_to: "either",
    applies_to_new_state_only: false,
    quiz: null,
    link_url: null,
    cover_image_url: null,
    video_url: null,
    ...overrides,
  };
}

const noop = () => {};

describe("ModuleCard", () => {
  it("renders the pending-video helper when a video module has no link", () => {
    render(
      <ModuleCard
        module={baseModule({ module_type: "video", video_url: null, link_url: null })}
        enrollmentId="e1"
        onShadow={noop}
        onCheckin={noop}
        onChange={noop}
      />,
    );
    const pending = screen.getByTestId("video-pending");
    expect(pending.textContent).toMatch(/Video link pending/i);
    expect(pending.textContent).toMatch(/mentor/i);
  });

  it("renders SOP resources without URLs as pending attachments rather than broken state", () => {
    render(
      <ModuleCard
        module={baseModule({ module_type: "sop", title: "Auth Lifecycle SOP" })}
        enrollmentId="e1"
        onShadow={noop}
        onCheckin={noop}
        onChange={noop}
        resources={[{ id: "r1", label: "Authorization Lifecycle Management SOP", url: null, kind: "pdf" }]}
      />,
    );
    expect(screen.getByText("Authorization Lifecycle Management SOP")).toBeInTheDocument();
    // No anchor with empty href should be rendered for pending SOPs
    const anchors = document.querySelectorAll("a[href='']");
    expect(anchors.length).toBe(0);
  });

  it("renders whyItMatters / whatToDo / completionEvidence guidance when provided", () => {
    render(
      <ModuleCard
        module={baseModule({ module_type: "sop" })}
        enrollmentId="e1"
        onShadow={noop}
        onCheckin={noop}
        onChange={noop}
        whyItMatters="Foundation for every later week."
        whatToDo="Read the SOP and note 1 strength + 1 gap."
        completionEvidence="Mentor check-in confirms understanding."
      />,
    );
    expect(screen.getByText(/Why this matters/i)).toBeInTheDocument();
    expect(screen.getByText(/Foundation for every later week/i)).toBeInTheDocument();
    expect(screen.getByText(/What to do/i)).toBeInTheDocument();
    expect(screen.getByText(/1 strength \+ 1 gap/i)).toBeInTheDocument();
    expect(screen.getByText(/How to complete/i)).toBeInTheDocument();
    expect(screen.getByText(/Mentor check-in/i)).toBeInTheDocument();
  });

  it("shows the module type chip and duration", () => {
    render(
      <ModuleCard
        module={baseModule({ module_type: "sop", duration_label: "20 min" })}
        enrollmentId="e1"
        onShadow={noop}
        onCheckin={noop}
        onChange={noop}
      />,
    );
    expect(screen.getAllByText(/SOP/i).length).toBeGreaterThan(0);
    expect(screen.getByText("20 min")).toBeInTheDocument();
  });
});

// Silence the toast import side effects in test env.
vi.mock("sonner", () => ({ toast: { success: () => {}, error: () => {} } }));