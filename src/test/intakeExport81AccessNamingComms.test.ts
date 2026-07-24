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

  it.skip("/patient-journey allow-list is Marketing-only (Pass 100: BD removed)", () => {
    const app = read("src/App.tsx");
    const m = app.match(/path="\/patient-journey"[^]*?<\/PermissionRoute>/);
    expect(m).toBeTruthy();
    for (const role of [
      "admin",
      "marketing",
      "marketing_team",
      "marketing_growth_lead",
    ]) {
      expect(m![0]).toContain(`"${role}"`);
    }
    expect(m![0]).not.toContain(`"business_development"`);
  });

  /* ---------------- role menu cleanup ---------------- */
  it("Patient Lifetime Journey does not appear in restricted role menus", () => {
    const src = read("src/lib/os/roleMenus.ts");
    // Allow-list: only these role keys may include /patient-journey in their menu.
    const allowed = new Set([
      "marketing_team",
      "marketing_growth_lead",
    ]);
    // Slice the file at each top-level role key declaration (e.g. `intake_coordinator: {`).
    const headerRe = /^\s{2}([a-z_]+):\s*\{$/gm;
    const headers: { key: string; idx: number }[] = [];
    let m: RegExpExecArray | null;
    while ((m = headerRe.exec(src))) headers.push({ key: m[1], idx: m.index });
    expect(headers.length).toBeGreaterThan(10);
    for (let i = 0; i < headers.length; i++) {
      const { key, idx } = headers[i];
      const end = headers[i + 1]?.idx ?? src.length;
      const block = src.slice(idx, end);
      if (block.includes("/patient-journey") && !allowed.has(key)) {
        throw new Error(`Patient Lifetime Journey leaked into role menu: ${key}`);
      }
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
  it.skip("user-facing Intake labels use 'Lead to Ready-to-Start Pipeline'", () => {
    const files = [
      "src/lib/os/roleMenus.ts",
      "src/components/layout/AppSidebar.tsx",
      "src/pages/os/OSShell.tsx",
      "src/pages/os/intake/IntakeDashboard.tsx",
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