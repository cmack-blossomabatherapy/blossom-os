import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ROLE_HOME } from "@/lib/os/roleHome";

const navigateMock = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

const setRoleMock = vi.fn();
vi.mock("@/contexts/OSRoleContext", () => ({
  useOSRole: () => ({
    role: "super_admin",
    scope: "company",
    activeState: "GA",
    setRole: setRoleMock,
    setActiveState: vi.fn(),
    previewSubjectEmployeeId: null,
    setPreviewSubjectEmployeeId: vi.fn(),
    isPreviewing: false,
  }),
  OS_STATES: ["GA", "NC", "VA", "TN", "MD", "NJ"],
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ isAdmin: true, loading: false }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: () => ({ select: () => ({ ilike: () => ({ order: () => ({ limit: () => Promise.resolve({ data: [] }) }) }) }) }) },
}));

import { RoleSwitcher } from "@/components/os/RoleSwitcher";

describe("RoleSwitcher — role selection navigates to ROLE_HOME", () => {
  it("navigates to intake_coordinator's home when Intake is chosen", () => {
    render(<MemoryRouter><RoleSwitcher /></MemoryRouter>);
    fireEvent.click(screen.getAllByRole("button")[0]);
    const intake = screen.getAllByText(/intake/i).find(
      (el) => el.tagName === "SPAN" || el.closest("button"),
    )!;
    fireEvent.click(intake.closest("button")!);
    expect(setRoleMock).toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith(ROLE_HOME["intake_coordinator"], { replace: true });
  });
});

