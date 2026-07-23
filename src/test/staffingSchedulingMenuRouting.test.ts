import { describe, it, expect } from "vitest";
import { ROLE_MENUS } from "@/lib/os/roleMenus";
import { STAFFING_TABS } from "@/lib/os/staffing/types";

// Mirrors VIEW_TO_BUCKET in src/pages/os/OSSchedulingWorkspace.tsx.
const SCHEDULING_VIEW_ALIASES = new Set([
  "needs_rbt", "pairing_pending", "ready_to_schedule", "ready", "pending_start",
  "coverage_risk", "risks", "availability", "conflicts",
  "assessments", "readiness", "start-dates", "family-availability",
  "clinic", "field", "cr-entry",
]);

function menuPaths(roleId: string): string[] {
  const role = ROLE_MENUS[roleId as keyof typeof ROLE_MENUS];
  if (!role) return [];
  return role.sections.flatMap((s) => s.items.map((i) => i.path));
}

describe("staffing sidebar routing", () => {
  it("every /ops/staffing?tab=... value maps to a real StaffingTab", () => {
    for (const path of menuPaths("staffing_team")) {
      const [base, query] = path.split("?");
      if (base !== "/ops/staffing" || !query) continue;
      const tab = new URLSearchParams(query).get("tab");
      if (!tab) continue;
      expect(STAFFING_TABS as readonly string[]).toContain(tab);
    }
  });
});

describe("scheduling sidebar routing", () => {
  it("every /scheduling-workspace?view=... value has a VIEW_TO_BUCKET alias", () => {
    for (const path of menuPaths("scheduling_team")) {
      const [base, query] = path.split("?");
      if (base !== "/scheduling-workspace" || !query) continue;
      const view = new URLSearchParams(query).get("view");
      if (!view) continue;
      expect(SCHEDULING_VIEW_ALIASES.has(view)).toBe(true);
    }
  });
});