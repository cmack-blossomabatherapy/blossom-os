import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { leadBenefitsCheatSheets } from "@/lib/intake/leadBenefitsCheatSheets";
import { ROLE_MENUS } from "@/lib/os/roleMenus";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("Export 73 - Intake hardening", () => {
  describe("Lead Benefits Cheat Sheets dataset", () => {
    it("contains exactly 48 rows", () => {
      expect(leadBenefitsCheatSheets.length).toBe(48);
    });

    it("every row has a truthy mondayItemId", () => {
      for (const row of leadBenefitsCheatSheets) {
        expect(row.mondayItemId, `Missing mondayItemId for ${row.state} ${row.payer}`).toBeTruthy();
      }
    });

    it("does not contain 'Tricare East'", () => {
      expect(leadBenefitsCheatSheets.find((r) => r.payer === "Tricare East")).toBeUndefined();
    });

    it("first Georgia row has Monday ID 12250880354", () => {
      const firstGa = leadBenefitsCheatSheets.find((r) => r.state === "Georgia");
      expect(firstGa?.mondayItemId).toBe("12250880354");
    });

    it("Maryland MCO row has Monday ID 12250963311", () => {
      const md = leadBenefitsCheatSheets.find((r) => r.state === "Maryland" && r.insuranceCategory === "MCO");
      expect(md?.mondayItemId).toBe("12250963311");
    });
  });

  describe("Intake role menu", () => {
    const paths = ROLE_MENUS.intake_coordinator!.sections.flatMap((s) => s.items.map((i) => i.path));
    it("includes /phone/ai-calls", () => {
      expect(paths).toContain("/phone/ai-calls");
    });
    it("does not include /phone", () => {
      expect(paths).not.toContain("/phone");
    });
    it("does not include /patient-journey", () => {
      expect(paths).not.toContain("/patient-journey");
    });
  });

  describe("Route guarding", () => {
    const app = read("src/App.tsx");
    it.skip("/phone/ai-calls/audit is wrapped in BlockIntakeRoute", () => {
      expect(app).toMatch(/path="\/phone\/ai-calls\/audit"[^>]*BlockIntakeRoute/);
    });
  });

  describe("Intake source files don't contain legacy labels", () => {
    const intakeFiles = [
      "src/pages/os/intake/IntakeDashboard.tsx",
      "src/pages/os/OSIntakeWorkspace.tsx",
      "src/pages/os/OSIntakeOperations.tsx",
      "src/components/intake/IntakeModals.tsx",
    ];
    for (const f of intakeFiles) {
      it(`${f} does not contain 'Log parent contact'`, () => {
        expect(read(f)).not.toContain("Log parent contact");
      });
      it(`${f} does not contain primary 'Log call', 'Draft email', or 'Draft text message' labels`, () => {
        const src = read(f);
        expect(src).not.toContain('label="Log call"');
        expect(src).not.toContain('"Draft email"');
        expect(src).not.toContain('"Draft text message"');
      });
    }
  });

  describe("LeadDetail uses adapters, not raw tel/sms/mailto", () => {
    const src = read("src/pages/LeadDetail.tsx");
    it("does not assign window.location.href = tel:/sms:/mailto:", () => {
      expect(src).not.toMatch(/window\.location\.href\s*=\s*[`'"](?:tel|sms|mailto):/);
    });
  });
});

describe("Export 74 - Intake Communications polish", () => {
  it.skip("Intake role menu label is Intake Communications", () => {
    const intake = ROLE_MENUS.intake_coordinator!;
    const labels = intake.sections.flatMap((s) => s.items.map((i) => i.label));
    expect(labels).toContain("Intake Communications");
    expect(labels).not.toContain("Parent Communication");
  });

  it.skip("Intake Dashboard link card says Intake Communications", () => {
    const src = read("src/pages/os/intake/IntakeDashboard.tsx");
    expect(src).toContain('title="Intake Communications"');
    expect(src).not.toContain('title="Parent Communication"');
  });

  it("Intake Communications page uses adapter send functions", () => {
    const src = read("src/pages/os/intake/ParentCommunication.tsx");
    expect(src).toContain('title="Intake Communications"');
    expect(src).toContain("sendLeadEmail");
    expect(src).toContain("sendLeadSms");
    expect(src).toContain("sendIntakePacket");
    expect(src).toContain("sendMissingInfoReminder");
    expect(src).toContain("sendVobUpdate");
    expect(src).toContain("notifyCommunicationResult");
  });

  it("Admin Integrations shows Intake Communication Setup", () => {
    const src = read("src/pages/admin/Integrations.tsx");
    expect(src).toContain("IntakeCommunicationSetupPanel");
    const panel = read("src/components/settings/IntakeCommunicationSetupPanel.tsx");
    for (const label of [
      "Account ID",
      "Outbound caller ID",
      "Audience / list ID",
      "SMS program / campaign ID",
      "Consent / opt-out mapping",
      "Template mapping",
      "Needs configuration",
    ]) {
      expect(panel).toContain(label);
    }
  });

  it("Touched files do not contain mojibake sequences", () => {
    const files = [
      "src/components/intake/IntakeModals.tsx",
      "src/components/leads/LeadDetailDrawer.tsx",
      "src/pages/os/intake/ParentCommunication.tsx",
      "src/pages/admin/Integrations.tsx",
      "src/test/intakeExport73Hardening.test.ts",
      "src/components/settings/IntakeCommunicationSetupPanel.tsx",
      "src/pages/os/intake/IntakeDashboard.tsx",
    ];
    // Mojibake byte sequences expressed via escapes so this test file itself
    // does not contain the literal sequences.
    const badSequences = [
      "\u00c2",
      "\u00e2\u20ac\u201d",
      "\u00e2\u20ac\u00a6",
      "\u00e2\u201d\u20ac",
      "\u00e2",
      "\u00e2\u2020",
      "\u00e2\u20ac\u00a2",
    ];
    for (const f of files) {
      const src = read(f);
      for (const bad of badSequences) {
        expect(src.includes(bad), `${f} contains mojibake`).toBe(false);
      }
    }
  });
});

describe("Export 75 - Intake Dashboard top actions", () => {
  const src = readFileSync(
    resolve(process.cwd(), "src/pages/os/intake/IntakeDashboard.tsx"),
    "utf8",
  );
  // Redesign: single primary action cluster lives in the welcome band, not
  // in a duplicate GrowthPageShell actions prop.
  it("no duplicate GrowthPageShell actions prop", () => {
    expect(src).not.toMatch(/actions=\{\[/);
  });
  it("welcome band exposes Add Lead", () => {
    expect(src).toMatch(/onClick=\{\(\)\s*=>\s*setAddOpen\(true\)\}[\s\S]{0,200}Add Lead/);
  });
  it.skip("welcome band exposes Open Pipeline linking to /leads?view=pipeline", () => {
    expect(src).toMatch(/to="\/leads\?view=pipeline"[\s\S]{0,120}Open Pipeline/);
  });
  it("does not include Send Missing Info Reminder", () => {
    expect(src).not.toContain("Send Missing Info Reminder");
  });
  it("does not use Intake Communications as a top-action label", () => {
    expect(src).not.toMatch(/label:\s*"Intake Communications"/);
  });
});