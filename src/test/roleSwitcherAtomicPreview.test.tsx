import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ROLE_HOME } from "@/lib/os/roleHome";
import { ROLE_MENUS } from "@/lib/os/roleMenus";
import { SUPER_ADMIN_MENU } from "@/lib/os/superAdminMenu";

// Real router hook must exist; we spy on useNavigate.
const navigateMock = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

// Full AuthContext mock — Corey is a super-admin (matches production shape).
vi.mock("@/contexts/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    user: { id: "corey", email: "corey@blossom.test" },
    roles: ["admin", "super_admin"],
    loading: false,
    isAdmin: true,
    activeAssignments: [],
    primaryAssignment: null,
    signOut: async () => {},
    avatarUrl: null,
    displayName: "Corey",
    permissions: new Set<string>(),
    ownedClientStages: new Set<string>(),
    ownedLeadStages: new Set<string>(),
    mustChangePassword: false,
    partOfLeadership: true,
    dashboardAccess: true,
    newStateEmployee: false,
    canEdit: true,
    hasPerm: () => true,
    ownsClientStage: () => true,
    ownsLeadStage: () => true,
    session: null,
  }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: null }) }),
        ilike: () => ({ order: () => ({ limit: async () => ({ data: [] }) }) }),
      }),
    }),
  },
}));

import { OSRoleProvider, useOSRole } from "@/contexts/OSRoleContext";
import { RoleSwitcher } from "@/components/os/RoleSwitcher";

let captured: { role: string; scope: string } = { role: "?", scope: "?" };
function Probe() {
  const { role, scope } = useOSRole();
  captured = { role, scope };
  return (
    <div>
      <span data-testid="effective-role">{role}</span>
      <span data-testid="effective-scope">{scope}</span>
    </div>
  );
}

describe("View as role — effective role, scope, and menu update atomically", () => {
  it("super-admin selecting Executive Leadership flips role + drops Super Admin System Tools", async () => {
    window.localStorage.removeItem("os.demo.role");

    render(
      <MemoryRouter>
        <OSRoleProvider>
          <RoleSwitcher />
          <Probe />
        </OSRoleProvider>
      </MemoryRouter>,
    );

    // Starts as super_admin (derived from auth roles).
    expect(captured.role).toBe("super_admin");

    // Open the switcher and pick "Executive Leadership".
    fireEvent.click(screen.getAllByRole("button")[0]);
    const execEntry = screen
      .getAllByText(/executive leadership/i)
      .find((el) => el.closest("button"))!
      .closest("button")!;
    await act(async () => {
      fireEvent.click(execEntry);
    });

    // Effective role must have flipped atomically — this is what the
    // shell, header, and sidebar all consume.
    expect(captured.role).toBe("executive_leadership");
    expect(screen.getByTestId("effective-role").textContent).toBe("executive_leadership");

    // Menu for the effective role must be resolvable AND must NOT expose
    // Super Admin System Tools surfaces.
    const execMenu = ROLE_MENUS["executive_leadership"];
    expect(execMenu).toBeDefined();
    const execPaths = execMenu!.sections.flatMap((s) => s.items.map((i) => i.path));
    const forbidden = [
      "/admin/integrations",
      "/admin/ctm",
      "/system/audit-log",
      "/system/tools",
      "/role-management",
    ];
    for (const p of forbidden) {
      expect(execPaths, `exec menu must not expose ${p}`).not.toContain(p);
    }

    // Sanity check: the Super Admin menu DOES expose these — proves the
    // assertion above is meaningful and not vacuously true.
    const superPaths = SUPER_ADMIN_MENU.flatMap((s) => s.items.map((i) => i.to));
    expect(superPaths.some((p) => forbidden.includes(p))).toBe(true);

    // Navigation to ROLE_HOME must also fire so the previous route can't
    // strand exec content under a stale super-admin URL.
    expect(navigateMock).toHaveBeenCalledWith(ROLE_HOME["executive_leadership"], {
      replace: true,
    });

    // And when we switch back to Super Admin, System Tools must return.
    fireEvent.click(screen.getAllByRole("button")[0]);
    const superEntry = screen
      .getAllByText(/^super admin$/i)
      .find((el) => el.closest("button"))!
      .closest("button")!;
    await act(async () => {
      fireEvent.click(superEntry);
    });
    expect(captured.role).toBe("super_admin");
  });
});
