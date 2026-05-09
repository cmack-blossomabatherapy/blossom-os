import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { AppRole } from "@/lib/roles";

// Mock useAuth so tests don't depend on Supabase.
const authState: {
  user: { id: string } | null;
  loading: boolean;
  roles: AppRole[];
  perms: Set<string>;
} = { user: { id: "u1" }, loading: false, roles: [], perms: new Set() };

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: authState.user,
    loading: authState.loading,
    roles: authState.roles,
    hasPerm: (k: string) => authState.perms.has(k),
  }),
}));

import { PermissionRoute } from "../PermissionRoute";

const COURSE_AUTHOR_ROLES: AppRole[] = ["admin", "training_admin"];

function renderAt(path: string, ui: React.ReactNode) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/auth" element={<div>AUTH_PAGE</div>} />
        <Route path="/enterprise/simulations/:id" element={ui} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("PermissionRoute on /enterprise/simulations/:id", () => {
  beforeEach(() => {
    authState.user = { id: "u1" };
    authState.loading = false;
    authState.roles = [];
    authState.perms = new Set();
  });

  it("redirects to /auth when no user", () => {
    authState.user = null;
    renderAt(
      "/enterprise/simulations/abc-123",
      <PermissionRoute allowedRoles={COURSE_AUTHOR_ROLES}>
        <div>SIM_DETAIL</div>
      </PermissionRoute>,
    );
    expect(screen.getByText("AUTH_PAGE")).toBeInTheDocument();
    expect(screen.queryByText("SIM_DETAIL")).not.toBeInTheDocument();
  });

  it("blocks users without an allowed role and shows Unauthorized", () => {
    authState.roles = ["rbt"];
    renderAt(
      "/enterprise/simulations/abc-123",
      <PermissionRoute allowedRoles={COURSE_AUTHOR_ROLES}>
        <div>SIM_DETAIL</div>
      </PermissionRoute>,
    );
    expect(screen.queryByText("SIM_DETAIL")).not.toBeInTheDocument();
    expect(screen.getByText(/access restricted/i)).toBeInTheDocument();
  });

  it("allows users with an allowed role regardless of route param", () => {
    authState.roles = ["training_admin"];
    renderAt(
      "/enterprise/simulations/anything-here",
      <PermissionRoute allowedRoles={COURSE_AUTHOR_ROLES}>
        <div>SIM_DETAIL</div>
      </PermissionRoute>,
    );
    expect(screen.getByText("SIM_DETAIL")).toBeInTheDocument();
  });

  it("blocks when permission key is missing even if role matches", () => {
    authState.roles = ["admin"];
    authState.perms = new Set(); // no automations.view
    renderAt(
      "/enterprise/simulations/abc-123",
      <PermissionRoute permission="automations.view" allowedRoles={["admin"]}>
        <div>SIM_DETAIL</div>
      </PermissionRoute>,
    );
    expect(screen.queryByText("SIM_DETAIL")).not.toBeInTheDocument();
    expect(screen.getByText(/required permission/i)).toBeInTheDocument();
    expect(screen.getByText(/automations\.view/)).toBeInTheDocument();
  });

  it("allows when both permission and role match", () => {
    authState.roles = ["admin"];
    authState.perms = new Set(["automations.view"]);
    renderAt(
      "/enterprise/simulations/abc-123",
      <PermissionRoute permission="automations.view" allowedRoles={["admin"]}>
        <div>SIM_DETAIL</div>
      </PermissionRoute>,
    );
    expect(screen.getByText("SIM_DETAIL")).toBeInTheDocument();
  });

  it("shows loader while auth is loading", () => {
    authState.loading = true;
    const { container } = renderAt(
      "/enterprise/simulations/abc-123",
      <PermissionRoute allowedRoles={COURSE_AUTHOR_ROLES}>
        <div>SIM_DETAIL</div>
      </PermissionRoute>,
    );
    expect(screen.queryByText("SIM_DETAIL")).not.toBeInTheDocument();
    expect(container.querySelector(".animate-spin")).toBeTruthy();
  });
});