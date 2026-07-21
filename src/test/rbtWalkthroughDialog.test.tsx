/**
 * Component-level tests for the walkthrough dialog: rendering, focus
 * management, keyboard navigation, and reduced-motion marking.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { RbtWalkthroughProvider } from "@/pages/rbt/app/RbtWalkthrough";
import { useRbtWalkthrough } from "@/pages/rbt/app/useRbtWalkthrough";
import { TOUR_STEPS } from "@/lib/rbt/walkthrough";

const USER = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: USER, email: "rbt@example.com" }, roles: ["rbt"] }),
}));

vi.mock("@/contexts/OSRoleContext", () => ({
  useOSRoleSafe: () => ({ isPreviewing: false, previewSubjectEmployeeId: null }),
}));

vi.mock("@/pages/rbt/app/useExperienceLab", () => ({
  useExperienceLab: () => ({
    eligible: false, active: false, state: null,
    setPathway: () => {}, setPreset: () => {},
    enable: () => {}, exit: () => {}, reset: () => {},
  }),
}));

function Harness() {
  const { openTour } = useRbtWalkthrough();
  return (
    <button type="button" data-testid="open" onClick={openTour}>
      open
    </button>
  );
}

beforeEach(() => {
  window.localStorage.clear();
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false, media: query, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {},
    addListener: () => {}, removeListener: () => {},
    dispatchEvent: () => false,
  })) as any;
});

function renderWithProvider() {
  return render(
    <MemoryRouter>
      <RbtWalkthroughProvider>
        <Harness />
      </RbtWalkthroughProvider>
    </MemoryRouter>
  );
}

describe("RbtWalkthroughDialog", () => {
  it("auto-opens on first login and renders step 1 with accessible progress", async () => {
    renderWithProvider();
    const dialog = await screen.findByTestId("rbt-walkthrough");
    expect(dialog).toBeTruthy();
    // ProgressBar has the right ARIA
    const pb = dialog.querySelector('[role="progressbar"]');
    expect(pb?.getAttribute("aria-valuenow")).toBe("1");
    expect(pb?.getAttribute("aria-valuemax")).toBe(String(TOUR_STEPS.length));
  });

  it("ArrowRight advances and ArrowLeft goes back", async () => {
    renderWithProvider();
    const dialog = await screen.findByTestId("rbt-walkthrough");
    fireEvent.keyDown(dialog, { key: "ArrowRight" });
    await waitFor(() =>
      expect(dialog.querySelector('[role="progressbar"]')?.getAttribute("aria-valuenow")).toBe("2")
    );
    fireEvent.keyDown(dialog, { key: "ArrowLeft" });
    await waitFor(() =>
      expect(dialog.querySelector('[role="progressbar"]')?.getAttribute("aria-valuenow")).toBe("1")
    );
  });

  it("primary Next button is focused after opening (keyboard-first flow)", async () => {
    renderWithProvider();
    await screen.findByTestId("rbt-walkthrough");
    // The focus setTimeout runs on the next microtask (~40ms in normal mode).
    await act(async () => { await new Promise((r) => setTimeout(r, 60)); });
    const nextBtn = screen.getByLabelText(/Next step/i);
    expect(document.activeElement).toBe(nextBtn);
  });

  it("marks reduced motion when the media query matches", async () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query, onchange: null,
      addEventListener: () => {}, removeEventListener: () => {},
      addListener: () => {}, removeListener: () => {},
      dispatchEvent: () => false,
    })) as any;
    renderWithProvider();
    const dialog = await screen.findByTestId("rbt-walkthrough");
    expect(dialog.getAttribute("data-reduced-motion")).toBe("true");
  });

  it("Skip persists completion so the tour does not auto-open again", async () => {
    renderWithProvider();
    await screen.findByTestId("rbt-walkthrough");
    fireEvent.click(screen.getByRole("button", { name: /Skip tour/i }));
    await waitFor(() => expect(screen.queryByTestId("rbt-walkthrough")).toBeNull());
    expect(window.localStorage.getItem(`rbt.walkthrough.v1:${USER}`)).not.toBeNull();
  });
});
