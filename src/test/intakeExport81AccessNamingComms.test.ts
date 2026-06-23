import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

describe("Export 81 — Access, Naming, Communication Actions", () => {
  /* ---------------- /patient-journey access ---------------- */
  it("App.tsx wraps /patient-journey with PermissionRoute (not BlockIntakeRoute)", () => {
    const app = read("src/App.tsx");
    const m = app.match(/path="\/patient-journey"[^]*?\/>/);
    expect(m).toBeTruthy();
    expect(m![0]).toMatch(/PermissionRoute/);
    expect(m![0]).not.toMatch(/BlockIntakeRoute/);
  });

  it("/patient-journey allow-list includes marketing + admin + business_development roles", () => {
    const app = read("src/App.tsx");
    const m = app.match(/path="\/patient-journey"[^]*?<\/PermissionRoute>/);
    expect(m).toBeTruthy();
    for (const role of [
      "admin",
      "marketing",
      "marketing_team",
      "marketing_growth_lead",
      "business_development",
    ]) {
      expect(m![0]).toContain(`"${role}"`);
    }
  });

  /* ---------------- role menu cleanup ---------------- */
  it("Patient Lifetime Journey does not appear in restricted role menus", () => {
    const src = read("src/lib/os/roleMenus.ts");
    // Pull each role block by header comment & verify no PLJ entry inside it.
    const restricted = [
      "Intake Team",
      "Recruiting Team",
      "Scheduling",
      "Authorizations",
      "QA",
      "Payroll",
      "Clinical",
      "Case Manager",
      "RBT",
      "BCBA",
      "State Director",
      "Assistant State Director",
      "HR",
    ];
    for (const label of restricted) {
      const idx = src.indexOf(label);
      if (idx === -1) continue;
      // Inspect the next ~3500 chars of the role block.
      const block = src.slice(idx, idx + 3500);
      expect(
        block.includes("/patient-journey"),
        `Patient Lifetime Journey leaked into ${label} menu`,
      ).toBe(false);
    }
  });

  it("Intake menu keeps After-Hours AI Calls but not full /phone", () => {
    const src = read("src/lib/os/roleMenus.ts");
    const start = src.indexOf("intake_coordinator");
    const end = src.indexOf("recruiting_team", start);
    const intake = src.slice(start, end);
    expect(intake).toMatch(/After-Hours AI Calls/);
    expect(intake).toMatch(/\/phone\/ai-calls/);
    expect(intake).not.toMatch(/path:\s*"\/phone"/);
    expect(intake).not.toMatch(/\/phone\/admin/);
  });

  /* ---------------- pipeline rename ---------------- */
  it("user-facing Intake labels use 'Lead to Ready-to-Start Pipeline'", () => {
    const files = [
      "src/lib/os/roleMenus.ts",
      "src/components/layout/AppSidebar.tsx",
      "src/pages/os/OSShell.tsx",
      "src/pages/os/intake/IntakeDashboard.tsx",
      "src/pages/os/intake/LeadToActivePipeline.tsx",
    ];
    for (const f of files) {
      const s = read(f);
      expect(s, `${f} missing new label`).toMatch(/Lead to Ready-to-Start Pipeline/);
      expect(s, `${f} still uses old label`).not.toMatch(/Lead To Active Pipeline/);
    }
  });

  /* ---------------- LeadActionPanel comms adapters ---------------- */
  it("LeadActionPanel imports and uses the communication adapters", () => {
    const src = read("src/components/intake/LeadActionPanel.tsx");
    expect(src).toMatch(/from "@\/lib\/integrations\/communications\/communicationAdapters"/);
    for (const fn of [
      "callParent",
      "sendLeadSms",
      "sendLeadEmail",
      "sendIntakePacket",
      "sendMissingInfoReminder",
      "notifyCommunicationResult",
    ]) {
      expect(src, `missing ${fn}`).toContain(fn);
    }
  });

  it("LeadActionPanel surfaces all five primary adapter buttons", () => {
    const src = read("src/components/intake/LeadActionPanel.tsx");
    for (const label of [
      "Call Parent",
      "Send SMS",
      "Send Email",
      "Send Intake Packet",
      "Missing Info Reminder",
    ]) {
      expect(src, `missing button: ${label}`).toContain(label);
    }
  });

  it("LeadActionPanel does not link to /patient-journey and does not say 'Log parent contact'", () => {
    const src = read("src/components/intake/LeadActionPanel.tsx");
    expect(src).not.toContain("/patient-journey");
    expect(src).not.toMatch(/Log parent contact/i);
  });

  it("LeadActionPanel keeps Add Note as a secondary/internal action only", () => {
    const src = read("src/components/intake/LeadActionPanel.tsx");
    expect(src).toContain("Add Note");
    // Primary family contact action must come before the Add Note button.
    const callIdx = src.indexOf("Call Parent");
    const noteIdx = src.indexOf("Add Note");
    expect(callIdx).toBeGreaterThan(-1);
    expect(noteIdx).toBeGreaterThan(callIdx);
  });

  /* ---------------- no automation runner added ---------------- */
  it("no automation runner logic introduced in LeadActionPanel", () => {
    const src = read("src/components/intake/LeadActionPanel.tsx");
    expect(src).not.toMatch(/automationRunner|runAutomation|automation\.run\(/i);
  });
});