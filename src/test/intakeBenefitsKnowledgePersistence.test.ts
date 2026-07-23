import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("Benefits Knowledge persistence + AI wiring", () => {
  it("exposes a live persistence layer with a safe fallback to the 48-row seed", () => {
    const src = read("src/lib/intake/leadBenefitsCheatSheets.ts");
    expect(src).toMatch(/fetchBenefitsKnowledge/);
    expect(src).toMatch(/useBenefitsKnowledge/);
    // Supabase-backed table read
    expect(src).toMatch(/from\("benefits_knowledge"\)/);
    // Fallback to the static 48-row array
    expect(src).toMatch(/leadBenefitsCheatSheets\.map/);
  });

  it("admin manager exists and is mounted under an admin guard at /admin/benefits-knowledge", () => {
    const app = read("src/App.tsx");
    expect(app).toMatch(/BenefitsKnowledgeManager/);
    expect(app).toMatch(
      /path="\/admin\/benefits-knowledge"\s+element=\{<AdminRoute><BenefitsKnowledgeManager \/><\/AdminRoute>\}/,
    );
  });

  it("lead drawer no longer links to the retired cheat-sheet page and offers Ask Blossom AI instead", () => {
    const src = read("src/components/leads/LeadDetailDrawer.tsx");
    expect(src).not.toMatch(/Open full cheat sheet/);
    expect(src).not.toMatch(/\/intake\/benefits-cheat-sheets/);
    expect(src).toMatch(/Ask Blossom AI/);
    expect(src).toMatch(/useBlossomAI/);
    // Panel label renamed away from "Cheat Sheet"
    expect(src).toMatch(/Benefits Knowledge Match/);
  });

  it("VOB workspace consumes findBenefitsCheatSheetForLead and hides the mock PAYOR_INTEL list", () => {
    const src = read("src/components/vob/VobAiPanel.tsx");
    expect(src).toMatch(/findBenefitsCheatSheetForLead/);
    expect(src).toMatch(/useBenefitsKnowledge/);
    expect(src).not.toMatch(/PAYOR_INTEL/);
    // Contextual Ask Blossom AI action for the selected review
    expect(src).toMatch(/Ask Blossom AI/);
  });

  it("blossom-ai-chat retrieves persisted Benefits Knowledge and Intake Templates when relevant", () => {
    const src = read("supabase/functions/blossom-ai-chat/index.ts");
    expect(src).toMatch(/from\("benefits_knowledge"\)/);
    expect(src).toMatch(/from\("intake_communication_templates"\)/);
    expect(src).toMatch(/BENEFITS KNOWLEDGE/);
    expect(src).toMatch(/INTAKE TEMPLATES/);
  });

  it("Super Admin nav exposes both admin backend surfaces (not the retired intake page)", () => {
    const src = read("src/lib/os/superAdminMenu.ts");
    expect(src).toMatch(/\/admin\/benefits-knowledge/);
    expect(src).toMatch(/\/admin\/intake-templates/);
    expect(src).not.toMatch(/\/intake\/benefits-cheat-sheets/);
  });
});