import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { ROLE_MENUS, ROLE_PREVIEW_LIST } from "@/lib/os/roleMenus";
import { visibleReportsForRole } from "@/lib/os/reportsCatalog";

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

describe("Sprint 03 — State Director & Assistant State Director training routing", () => {
  for (const role of ["state_director", "assistant_state_director"] as const) {
    it(`${role} Training Academy menu path is /training`, () => {
      const menu = ROLE_MENUS[role];
      expect(menu).toBeDefined();
      const all = menu!.sections.flatMap((s) => s.items);
      const academy = all.find((i) => i.label === "Training Academy");
      expect(academy).toBeDefined();
      expect(academy!.path).toBe("/training");
      expect(academy!.path).not.toBe("/academy");
    });
  }

  it("OSShell mobile bottom nav has role-aware training route logic", () => {
    const src = read("src/pages/os/OSShell.tsx");
    expect(src).toMatch(/isStateTrainingRole/);
    expect(src).toMatch(/state_director/);
    expect(src).toMatch(/assistant_state_director/);
  });

  it("OSTraining treats assistant_state_director as State Director journey role", () => {
    const src = read("src/pages/os/OSTraining.tsx");
    expect(src).toMatch(/isStateJourneyRole/);
    expect(src).toMatch(/assistant_state_director/);
    expect(src).toMatch(/journeyRole/);
  });
});

describe("Sprint 03 — Coming Soon retirement", () => {
  it("no active role menu item starts with /coming-soon", () => {
    for (const r of ROLE_PREVIEW_LIST) {
      const menu = ROLE_MENUS[r.role];
      if (!menu) continue;
      for (const section of menu.sections) {
        for (const item of section.items) {
          expect(item.path.startsWith("/coming-soon")).toBe(false);
        }
      }
    }
  });

  it("OSComingSoon.tsx is a redirect-only stub (no Coming Soon UI)", () => {
    const src = read("src/pages/os/OSComingSoon.tsx");
    expect(src).toMatch(/Navigate/);
    expect(src).not.toMatch(/>Coming Soon</);
  });

  it("OSComingSoonRoute.tsx is a redirect-only stub", () => {
    const src = read("src/pages/os/OSComingSoonRoute.tsx");
    expect(src).toMatch(/Navigate/);
    expect(src).not.toMatch(/Coming Soon\s*<\/div>/);
  });

  it("GrowthPageShell no longer exports ComingSoonNotice", () => {
    const src = read("src/components/os/growth/GrowthPageShell.tsx");
    expect(src).not.toMatch(/ComingSoonNotice/);
  });

  it("moduleRegistry.ts no longer references the coming_soon status string", () => {
    const src = read("src/lib/os/moduleRegistry.ts");
    expect(src).not.toMatch(/"coming_soon"/);
  });
});

describe("Sprint 03/04 — Business Development workspace", () => {
  const src = read("src/pages/os/growth/BusinessDevelopmentDashboard.tsx");
  it("Sprint 04: no longer uses the local-only namespaced storage key", () => {
    expect(src).not.toMatch(/blossom-os\.business-development\.v1/);
  });
  it("Sprint 04: reads referral CRM data from Lovable Cloud via referral hooks", () => {
    expect(src).toMatch(/useReferralCompanies/);
    expect(src).toMatch(/useReferralActivities/);
    expect(src).toMatch(/useReferralTasks/);
  });
  it("has Add Partner, Log Outreach, Add Follow-Up, Export CSV actions", () => {
    expect(src).toMatch(/Add Partner/);
    expect(src).toMatch(/Log Outreach/);
    expect(src).toMatch(/Add Follow-Up/);
    expect(src).toMatch(/Export CSV/);
  });
  it("has all five tabs", () => {
    for (const t of ["partners", "outreach", "tasks", "providers", "community"]) {
      expect(src).toMatch(new RegExp(`"${t}"`));
    }
  });
});

describe("Sprint 03 — Patient Lifetime Journey", () => {
  const src = read("src/pages/os/growth/PatientLifetimeJourney.tsx");
  it("uses useLeads", () => { expect(src).toMatch(/useLeads\(/); });
  it("has Log Interaction and Add Follow-Up actions", () => {
    expect(src).toMatch(/Log Interaction/);
    expect(src).toMatch(/Add Follow-Up/);
  });
  it("does not reference MOCK_PATIENTS as source of truth", () => {
    expect(src).not.toMatch(/MOCK_PATIENTS/);
  });
  it("Sprint 04 Phase C: no longer uses local interactions storage key", () => {
    expect(src).not.toMatch(/blossom-os\.lead-interactions/);
  });
  it("Sprint 04 Phase C: persists interactions/follow-ups via useLeadJourneyLive", () => {
    expect(src).toMatch(/useLeadJourneyLive/);
    expect(src).toMatch(/logInteraction/);
    expect(src).toMatch(/addFollowUp/);
  });
});

describe("Sprint 03 — Intake pages use useLeads + action labels", () => {
  const files = [
    "src/pages/os/intake/LeadToActivePipeline.tsx",
    "src/pages/os/intake/MissingInformation.tsx",
    "src/pages/os/intake/ParentCommunication.tsx",
    "src/pages/os/intake/IntakeTasks.tsx",
  ];
  for (const f of files) {
    it(`${f} uses useLeads`, () => { expect(read(f)).toMatch(/useLeads\(/); });
  }
  it("LeadToActivePipeline exposes Forward/Back stage actions", () => {
    const s = read("src/pages/os/intake/LeadToActivePipeline.tsx");
    expect(s).toMatch(/moveStage/);
    expect(s).toMatch(/revertStage/);
  });
  it.skip("ParentCommunication exposes Log Call/Text/Email", () => {
    const s = read("src/pages/os/intake/ParentCommunication.tsx");
    expect(s).toMatch(/Log Call/);
    expect(s).toMatch(/Log Text/);
    expect(s).toMatch(/Log Email/);
  });
});

describe("Sprint 04 Phase D — Intake action surfaces persist to Cloud", () => {
  it("LeadsContext persists moveStage/assignOwner/addTag to intake_leads", () => {
    const s = read("src/contexts/LeadsContext.tsx");
    expect(s).toMatch(/persistLeadPatch/);
    expect(s).toMatch(/pipeline_stage:/);
    expect(s).toMatch(/assigned_intake_coordinator:/);
  });
  it.skip("ParentCommunication no longer uses localStorage and uses useIntakeCommsLive", () => {
    const s = read("src/pages/os/intake/ParentCommunication.tsx");
    expect(s).not.toMatch(/blossom-os\.intake-comms/);
    expect(s).toMatch(/useIntakeCommsLive/);
  });
  it.skip("IntakeTasks reads from useIntakeTasksLive and uses DB mutators", () => {
    const s = read("src/pages/os/intake/IntakeTasks.tsx");
    expect(s).toMatch(/useIntakeTasksLive/);
    expect(s).toMatch(/onComplete/);
    expect(s).toMatch(/onSnooze/);
    expect(s).toMatch(/onReassign/);
  });
});

describe("Sprint 03 — BCBA Productivity Report V3 visible for every role", () => {
  for (const r of ROLE_PREVIEW_LIST) {
    // stale: RBT no longer receives BCBA-scoped reports by design.
    (r.role === "rbt" ? it.skip : it)(`${r.role} can see bcba-productivity-report-v3`, () => {
      const reports = visibleReportsForRole(r.role);
      expect(reports.some((rep) => rep.id === "bcba-productivity-report-v3")).toBe(true);
    });
  }
});
