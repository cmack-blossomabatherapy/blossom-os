import { describe, expect, it } from "vitest";
import { ROLE_MENUS } from "@/lib/os/roleMenus";
import { ROLE_HOME } from "@/lib/os/roleHome";
import { ROLE_SPECIFIC_LIVE_PATHS } from "@/pages/os/OSShell";

describe("Sprint 21 — HR Team menu + role mapping", () => {
  const hrTeam = ROLE_MENUS.hr_team!;
  const hrLead = ROLE_MENUS.hr_lead!;
  const hrTeamItems = hrTeam.sections.flatMap((s) => s.items);
  const hrLeadItems = hrLead.sections.flatMap((s) => s.items);

  it("hr_team menu does NOT include generic /dashboard", () => {
    expect(hrTeamItems.find((i) => i.path === "/dashboard")).toBeUndefined();
  });

  it("hr_team menu does NOT include standalone Login Vault or NFC Badge pages", () => {
    const banned = ["/user-logins-vault", "/admin/login-vault", "/nfc-badges"];
    for (const path of banned) {
      expect(hrTeamItems.find((i) => i.path === path)).toBeUndefined();
      expect(hrLeadItems.find((i) => i.path === path)).toBeUndefined();
    }
    expect(hrTeamItems.find((i) => /Login Vault|NFC/i.test(i.label))).toBeUndefined();
    expect(hrLeadItems.find((i) => /Login Vault|NFC/i.test(i.label))).toBeUndefined();
  });

  it("hr_team menu routes User Management to /user-management", () => {
    const um = hrTeamItems.find((i) => i.label === "User Management");
    expect(um?.path).toBe("/user-management");
  });

  it("hr_lead menu no longer exposes the legacy /user-management/admin page", () => {
    expect(hrLeadItems.find((i) => i.path === "/user-management/admin")).toBeUndefined();
    expect(hrLeadItems.find((i) => i.path === "/user-management")).toBeDefined();
  });

  it("hr_team and hr_lead home is /hr-team", () => {
    expect(ROLE_HOME.hr_team).toBe("/hr-team");
    expect(ROLE_HOME.hr_lead).toBe("/hr-team");
  });

  it("hr_team live paths cover the HR menu and exclude vault/nfc standalone paths", () => {
    const live = ROLE_SPECIFIC_LIVE_PATHS.hr_team!;
    for (const p of ["/hr-team", "/user-management", "/hr/requests", "/hr/compliance", "/hr/evaluations", "/device-requests", "/device-inventory", "/phone"]) {
      expect(live.has(p)).toBe(true);
    }
    expect(live.has("/user-logins-vault")).toBe(false);
    expect(live.has("/nfc-badges")).toBe(false);
  });

  it("hr_lead live paths drop the legacy /user-management/admin entry", () => {
    expect(ROLE_SPECIFIC_LIVE_PATHS.hr_lead!.has("/user-management/admin")).toBe(false);
    expect(ROLE_SPECIFIC_LIVE_PATHS.hr_lead!.has("/user-management")).toBe(true);
    expect(ROLE_SPECIFIC_LIVE_PATHS.hr_team!.has("/user-management/admin")).toBe(false);
  });
});