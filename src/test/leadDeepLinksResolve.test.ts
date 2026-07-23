import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { linkToHref } from "@/components/escalation/EscalationLinkPicker";

const read = (rel: string) => readFileSync(resolve(__dirname, "../..", rel), "utf8");

/**
 * Lead deep-links now resolve to the canonical full-page record at
 * `/leads/:id`. The popout drawer has been retired — no CTM row, escalation
 * chip, or link builder may emit the legacy `/leads?lead=<id>` shape.
 */
describe("Lead deep-links resolve to the canonical /leads/:id record page", () => {
  const app = read("src/App.tsx");
  const ctm = read("src/pages/phone/CTMCalls.tsx");
  const linker = read("src/components/escalation/EscalationLinkPicker.tsx");

  it("linkToHref('lead', id) produces /leads/<id>", () => {
    expect(linkToHref({ type: "lead", id: "abc-123", label: "Test" }))
      .toBe("/leads/abc-123");
  });

  it("registers /leads/:id as a routed page and redirects legacy /intake/leads", () => {
    expect(app).toMatch(/path="\/leads\/:id"\s+element=\{<LeadDetail/);
    expect(app).toMatch(/path="\/intake\/leads"\s+element=\{<Navigate to="\/leads" replace\s*\/>\}/);
  });

  it("CTMCalls links matched leads via /leads/<id> (never ?lead= or ?leadId=)", () => {
    expect(ctm).toMatch(/`\/leads\/\$\{r\.matched_lead_id\}`/);
    expect(ctm).not.toMatch(/\/leads\?lead=/);
    expect(ctm).not.toMatch(/\?leadId=/);
  });

  it("Escalation link picker uses the canonical /leads/<id> shape", () => {
    expect(linker).toMatch(/`\/leads\/\$\{v\.id\}`/);
    expect(linker).not.toMatch(/\/leads\?lead=/);
    expect(linker).not.toMatch(/\?leadId=/);
  });
});