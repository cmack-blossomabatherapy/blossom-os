import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AdminRoute } from "./AdminRoute";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "@/contexts/AuthContext";
const mockedUseAuth = useAuth as unknown as ReturnType<typeof vi.fn>;

function renderWithAuth(authValue: Record<string, unknown>) {
  mockedUseAuth.mockReturnValue(authValue);
  return render(
    <MemoryRouter>
      <AdminRoute>
        <div>ADMIN_CONTENT</div>
      </AdminRoute>
    </MemoryRouter>,
  );
}

describe("AdminRoute", () => {
  it("blocks non-admin signed-in users", () => {
    renderWithAuth({ user: { id: "u1" }, loading: false, isAdmin: false });
    expect(screen.queryByText("ADMIN_CONTENT")).toBeNull();
    expect(screen.getByText(/Admins only/i)).toBeInTheDocument();
  });

  it("allows admin users", () => {
    renderWithAuth({ user: { id: "u1" }, loading: false, isAdmin: true });
    expect(screen.getByText("ADMIN_CONTENT")).toBeInTheDocument();
  });

  it("redirects unauthenticated users away from admin content", () => {
    renderWithAuth({ user: null, loading: false, isAdmin: false });
    expect(screen.queryByText("ADMIN_CONTENT")).toBeNull();
    expect(screen.queryByText(/Admins only/i)).toBeNull();
  });
});

describe("App.tsx admin route gating", () => {
  it("admin-only routes are wrapped with AdminRoute", async () => {
    const fs = await import("node:fs");
    const src = fs.readFileSync("src/App.tsx", "utf8");
    const adminPaths = [
      '"/admin"',
      '"/admin/access-requests"',
      '"/admin/login-vault"',
      '"/admin/onboarding-progress"',
      '"/admin/journey-editor"',
      '"/admin/device-inventory"',
      '"/permissions"',
      '"/integrations"',
    ];
    for (const p of adminPaths) {
      const re = new RegExp(
        `<Route path=${p.replace(/[/]/g, "\\/")} element=\\{<AdminRoute>`,
      );
      expect(src).toMatch(re);
    }
  });
});