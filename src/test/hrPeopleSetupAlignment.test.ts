import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROLE_MENUS } from "@/lib/os/roleMenus";
import { ROLE_SPECIFIC_LIVE_PATHS } from "@/pages/os/OSShell";

const root = process.cwd();
const read = (p: string) => readFileSync(join(root, p), "utf8");

const HR_TEAM = read("src/pages/os/OSHRTeam.tsx");
const HR_WORKSPACE = read("src/pages/os/OSHRWorkspace.tsx");
const NEW_HIRES = read("src/pages/os/OSHRNewHires.tsx");
const USERS_HOME = read("src/pages/os/users/UsersHome.tsx");
const ADD_EMPLOYEE = read("src/components/hr/AddEmployeeDialog.tsx");
const ORIENTATION = read("src/pages/os/OSHROrientationQueue.tsx");

describe("HR people setup alignment", () => {
  it("routes Add new hire actions to canonical User Management setup", () => {
    for (const [name, src] of [
      ["OSHRTeam", HR_TEAM],
      ["OSHRWorkspace", HR_WORKSPACE],
      ["OSHRNewHires", NEW_HIRES],
    ] as const) {
      expect(src, `${name} should deep-link to the add employee flow`).toMatch(/to="\/user-management\?add=1"/);
      expect(src, `${name} must not send Add new hire to Orientation Queue`).not.toMatch(/Add new hire<\/Link>[\s\S]{0,120}\/hr\/orientation-queue|\/hr\/orientation-queue[\s\S]{0,120}Add new hire/);
    }
  });

  it("User Management opens the add dialog from ?add=1 and returns to employee profiles", () => {
    expect(USERS_HOME).toContain("useSearchParams");
    expect(USERS_HOME).toContain('searchParams.get("add") === "1"');
    expect(USERS_HOME).toContain("setOpenAdd(true)");
    expect(USERS_HOME).toMatch(/navigate\(`\/user-management\/\$\{employeeId\}`\)/);
  });

  it("employee creation prepares onboarding and software access from User Management", () => {
    expect(ADD_EMPLOYEE).toContain('from("employee_onboarding")');
    expect(ADD_EMPLOYEE).toMatch(/status:\s*"new_hire_pending"/);
    expect(ADD_EMPLOYEE).toContain("admin-employee-magic-link");
    expect(ADD_EMPLOYEE).toMatch(/Finish access from the employee profile|software login was not prepared/);
  });
});

describe("Orientation Queue is scheduling-aligned", () => {
  it("Scheduling roles can navigate to Orientation Queue", () => {
    const schedulingItems = ROLE_MENUS.scheduling_team!.sections.flatMap((s) => s.items);
    expect(schedulingItems.some((item) => item.path === "/hr/orientation-queue" && item.label === "Orientation Scheduling")).toBe(true);
    for (const role of ["scheduling_team", "scheduling_lead", "scheduling_coordinator"] as const) {
      expect(ROLE_SPECIFIC_LIVE_PATHS[role]!.has("/hr/orientation-queue")).toBe(true);
    }
  });

  it("Orientation Queue stays focused on scheduling, not employee creation", () => {
    expect(ORIENTATION).toMatch(/Schedule new-hire orientations/);
    expect(ORIENTATION).toContain("Scheduling Workspace");
    expect(ORIENTATION).not.toMatch(/Add new hire/);
    expect(ORIENTATION).not.toMatch(/to="\/user-management\?add=1"/);
  });
});