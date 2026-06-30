import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("Staffing Pass 4 - canonical routing and menu cleanup", () => {
  it("OSShell visible Family Staffing Preferences uses canonical tab URL", () => {
    const src = read("src/pages/os/OSShell.tsx");
    expect(src).toContain('"/ops/staffing?tab=preferences"');
    expect(src).not.toMatch(/to:\s*"\/ops\/family-staffing-preferences"/);
  });

  it("AppSidebar visible Family Staffing Preferences uses canonical tab URL", () => {
    const src = read("src/components/layout/AppSidebar.tsx");
    expect(src).toContain('"/ops/staffing?tab=preferences"');
    expect(src).not.toMatch(/path:\s*"\/ops\/family-staffing-preferences"/);
  });

  it("QuickActions Assign BCBA/RBT point to canonical Staffing tabs", () => {
    const src = read("src/components/dashboard/QuickActions.tsx");
    expect(src).toContain("/ops/staffing?tab=open-cases");
    expect(src).toContain("/ops/staffing?tab=match-queue");
    expect(src).not.toMatch(/href:\s*"\/staffing"/);
  });

  it("sanitizeDeepLink resolves staffing to canonical workspace", () => {
    const src = read("src/lib/push/sanitizeDeepLink.ts");
    expect(src).toMatch(/staffing:\s*"\/ops\/staffing\?tab=open-cases"/);
  });

  it("legacyRoutes /staffing-dashboard redirects to canonical tab", () => {
    const src = read("src/routes/legacyRoutes.tsx");
    expect(src).toMatch(/\/staffing-dashboard.*Navigate to="\/ops\/staffing\?tab=open-cases"/s);
  });
});

describe("Staffing Pass 4 - database-backed workflow", () => {
  it("staffingStore drops `as never` for canonical staffing tables", () => {
    const src = read("src/lib/os/staffing/staffingStore.ts");
    expect(src).not.toMatch(/"family_staffing_preferences" as never/);
    expect(src).not.toMatch(/"staffing_case_activity" as never/);
    expect(src).not.toMatch(/"staffing_integration_handoffs" as never/);
  });

  it("CaseDetailDrawer exposes quick workflow actions and edit/delete", () => {
    const src = read("src/components/staffing/CaseDetailDrawer.tsx");
    expect(src).toContain("Mark blocked");
    expect(src).toContain("Escalate");
    expect(src).toContain("Watch");
    expect(src).toContain("Resolve");
    expect(src).toContain("removeActivity");
    expect(src).toContain("Suggested RBTs");
  });

  it("Apploi handoff is honest about pool integration", () => {
    const src = read("src/pages/os/OSStaffingWorkspace.tsx");
    expect(src).toContain("Mark ready for Staffing pool");
    expect(src).toContain("assigned_owner");
    expect(src).not.toMatch(/"Add to staffing pool"/);
  });
});