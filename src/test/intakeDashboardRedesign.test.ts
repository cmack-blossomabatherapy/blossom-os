import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");
const src = read("src/pages/os/intake/IntakeDashboard.tsx");

describe("Intake dashboard redesign — role-scoped operator workspace", () => {
  it("uses useOSRole to key the experience off the ACTIVE view role", () => {
    expect(src).toMatch(/useOSRole\(\)/);
    expect(src).toMatch(/from ["']@\/contexts\/OSRoleContext["']/);
  });

  it("gates IntakeSystemHealthPanel behind an admin-only disclosure", () => {
    // Panel is still imported (so admin diagnostics work) but the render is
    // wrapped in an isAdminView guard — never renders for Intake roles.
    expect(src).toContain("IntakeSystemHealthPanel");
    const adminBlock = src.match(/isAdminView\s*&&[\s\S]{0,2500}IntakeSystemHealthPanel/);
    expect(adminBlock, "IntakeSystemHealthPanel must render only inside the isAdminView branch")
      .not.toBeNull();
    // isAdminView must include super_admin AND systems_admin (not the auth
    // AppRole "admin"), so admin visibility follows the active OS view role.
    expect(src).toMatch(/isAdminView\s*=\s*role\s*===\s*"super_admin"\s*\|\|\s*role\s*===\s*"systems_admin"/);
  });

  it("no longer mounts the wall-of-provider diagnostics at the top of the page", () => {
    // The old layout rendered <IntakeSystemHealthPanel /> unconditionally
    // before the pulse tiles. The redesign must NOT include that call.
    const bareUsages = src.match(/<IntakeSystemHealthPanel\s*\/>/g) ?? [];
    expect(bareUsages.length).toBeLessThanOrEqual(1);
    // The rainbow six-tile "Intake Pulse" and three-chart "Pipeline Insights"
    // block are retired.
    expect(src).not.toMatch(/Intake Pulse/);
    expect(src).not.toMatch(/Pipeline Insights/);
    expect(src).not.toMatch(/Readiness Funnel/);
    expect(src).not.toMatch(/Source Mix/);
    expect(src).not.toMatch(/from ["']recharts["']/);
  });

  it("keeps canonical intake data plumbing and primary actions", () => {
    // Canonical helpers stay wired — no fake data.
    expect(src).toMatch(/canonicalFamilyLeadStage/);
    expect(src).toMatch(/isReadyToStartStage/);
    expect(src).toMatch(/FAMILY_LEAD_PIPELINE_STAGES/);
    expect(src).toMatch(/getLeadWorkflowRisk/);
    expect(src).toMatch(/useLeads\(\)/);
    // Communications adapters remain usable from the priority queue rows.
    for (const fn of ["callParent", "sendLeadSms", "sendLeadEmail", "notifyCommunicationResult"]) {
      expect(src, `${fn} adapter must remain wired`).toContain(fn);
    }
    // Single primary action cluster lives in the welcome band — no duplicate
    // GrowthPageShell top actions. Add Lead opens the NewLeadDialog and
    // Open Leads links to /leads?view=pipeline.
    expect(src).not.toMatch(/actions=\{\[/);
    expect(src).toMatch(/onClick=\{\(\)\s*=>\s*setAddOpen\(true\)\}[\s\S]{0,200}Add Lead/);
    expect(src).toMatch(/to="\/leads\?view=pipeline"[\s\S]{0,120}Open Leads/);
    // NewLeadDialog is still mounted.
    expect(src).toMatch(/<NewLeadDialog/);
    // State filter toggle is still present.
    expect(src).toMatch(/IntakeStateFilterToggle/);
  });

  it("renders operator-first copy: welcome band, Today, At a glance, Family journey, Ready for handoff", () => {
    expect(src).toMatch(/Good morning|Good afternoon|Good evening/);
    expect(src).toMatch(/attention today/);
    expect(src).toMatch(/title="Today"/);
    expect(src).toMatch(/At a glance/);
    expect(src).toMatch(/Family journey/);
    expect(src).toMatch(/Ready for handoff/);
    // Metric strip retains the required "Ready to Start (30d)" label used
    // elsewhere and links to the ready-to-start stage view.
    expect(src).toMatch(/Ready to Start \(30d\)/);
  });

  it("keeps handoff and drilldown routes working", () => {
    expect(src).toContain("/authorizations");
    expect(src).toContain("/ops/scheduling");
    expect(src).toContain("/qa-team");
    expect(src).toContain("/intake/tasks");
    expect(src).toContain("/vob-decision-center");
    expect(src).toContain("/leads?view=pipeline");
  });
});
