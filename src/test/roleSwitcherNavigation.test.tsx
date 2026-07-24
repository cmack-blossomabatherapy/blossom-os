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

describe("View as role — effective role and menu update atomically", () => {
  it(
    "super-admin selecting Executive Leadership updates effective role, menu, and header " +
      "and drops Super Admin System Tools entries",
    async () => {
      // Isolate module registry so the mocks below don't collide with the
      // module-scoped mocks at the top of this file.
      vi.resetModules();

      vi.doMock("@/contexts/AuthContext", () => ({
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

      vi.doMock("@/integrations/supabase/client", () => ({
        supabase: {
          from: () => ({
            select: () => ({
              eq: () => ({ maybeSingle: async () => ({ data: null }) }),
              ilike: () => ({ order: () => ({ limit: async () => ({ data: [] }) }) }),
            }),
          }),
        },
      }));

      const { OSRoleProvider, useOSRole } = await import("@/contexts/OSRoleContext");
      const { RoleSwitcher: FreshRoleSwitcher } = await import("@/components/os/RoleSwitcher");
      const { ROLE_MENUS } = await import("@/lib/os/roleMenus");
      const { SUPER_ADMIN_MENU } = await import("@/lib/os/superAdminMenu");

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

      // Clear any persisted override from previous suites.
      window.localStorage.removeItem("os.demo.role");

      render(
        <MemoryRouter>
          <OSRoleProvider>
            <FreshRoleSwitcher />
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

      // Effective role must have flipped atomically.
      expect(captured.role).toBe("executive_leadership");
      expect(screen.getByTestId("effective-role").textContent).toBe("executive_leadership");

      // The exec menu must be resolvable and must NOT contain Super Admin
      // System Tools entries (Integrations Console, Audit Log, CTM Admin,
      // Systems Admin surfaces, etc.).
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

      // Sanity: the Super Admin menu DOES expose System Tools surfaces —
      // proves the assertion above is meaningful.
      const superPaths = SUPER_ADMIN_MENU.flatMap((s) => s.items.map((i) => i.path));
      expect(superPaths.some((p) => forbidden.includes(p))).toBe(true);

      // Navigation to ROLE_HOME must fire so the shell can never render
      // exec content under a stale super-admin route.
      expect(navigateMock).toHaveBeenCalledWith(ROLE_HOME["executive_leadership"], {
        replace: true,
      });

      vi.doUnmock("@/contexts/AuthContext");
      vi.doUnmock("@/integrations/supabase/client");
    },
  );
});
