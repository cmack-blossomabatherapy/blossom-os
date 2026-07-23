import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ROLE_MENUS } from "@/lib/os/roleMenus";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("Intake menu simplification pass", () => {
  it("Intake role menu is ordered: Dashboard → Tasks → Leads → Missing Info → After-Hours AI → CR Packet Prep", () => {
    const intake = ROLE_MENUS.intake_coordinator!;
    const paths = intake.sections
      .find((s) => s.id === "intake")!
      .items.map((i) => i.path);
    expect(paths).toEqual([
      "/intake/dashboard",
      "/intake/tasks",
      "/leads",
      "/intake/missing-information",
      "/phone/ai-calls",
      "/intake/cr-packet-prep",
    ]);
  });

  it("Intake Communications is removed from shared Training & Resources definitions", () => {
    const src = read("src/lib/os/roleMenus.ts");
    const training = src.slice(
      src.indexOf("const TRAINING_AND_RESOURCES:"),
      src.indexOf("const DASHBOARD_ITEM"),
    );
    expect(training).not.toMatch(/Intake Communications/);
    expect(training).not.toMatch(/\/intake\/parent-communication/);
  });

  it("Retired staff-facing intake destinations redirect to safe operator surfaces", () => {
    const app = read("src/App.tsx");
    // /intake/lead-to-active → /intake/dashboard
    expect(app).toMatch(
      /path="\/intake\/lead-to-active"\s+element=\{<Navigate to="\/intake\/dashboard"/,
    );
    // /intake/parent-communication → /admin/intake-templates
    expect(app).toMatch(
      /path="\/intake\/parent-communication"\s+element=\{<Navigate to="\/admin\/intake-templates"/,
    );
    // /intake/benefits-cheat-sheets → /admin/benefits-knowledge
    expect(app).toMatch(
      /path="\/intake\/benefits-cheat-sheets"\s+element=\{<Navigate to="\/admin\/benefits-knowledge"/,
    );
  });

  it("Admin backend surfaces are mounted with AdminRoute gating", () => {
    const app = read("src/App.tsx");
    expect(app).toMatch(
      /path="\/admin\/benefits-knowledge"\s+element=\{<AdminRoute>/,
    );
    expect(app).toMatch(
      /path="\/admin\/intake-templates"\s+element=\{<AdminRoute>/,
    );
  });

  it("48 payer benefit guidance rows remain intact for Blossom AI retrieval", async () => {
    const mod = await import("@/lib/intake/leadBenefitsCheatSheets");
    expect(mod.leadBenefitsCheatSheets.length).toBe(48);
    // Retrieval helper still works.
    const match = mod.findBenefitsCheatSheetForLead({
      insurance: "Aetna",
      state: "Georgia",
    });
    expect(match.sheet).not.toBeNull();
    expect(match.sheet?.state).toBe("Georgia");
  });
});

describe("Intake Dashboard cleanup", () => {
  const src = readFileSync(
    resolve(process.cwd(), "src/pages/os/intake/IntakeDashboard.tsx"),
    "utf8",
  );

  it("removes duplicate quick-link pills for Intake Communications and Ready-to-Start pipeline", () => {
    expect(src).not.toMatch(/Intake Communications/);
    expect(src).not.toMatch(/Lead to Ready-to-Start Pipeline/);
  });

  it("welcome-band CTA routes to /leads (Open Leads), not /leads?view=pipeline", () => {
    expect(src).toMatch(/Open Leads/);
    // The Family Journey top-right link is now "View all leads" → /leads
    expect(src).toMatch(/View all leads/);
    expect(src).not.toMatch(/leads\?view=pipeline/);
  });
});