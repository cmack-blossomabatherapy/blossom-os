import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { linkToHref } from "@/components/escalation/EscalationLinkPicker";

const read = (rel: string) => readFileSync(resolve(__dirname, "../..", rel), "utf8");

/**
 * Regression guard: CTM call rows and escalation link chips must always deep-link
 * to the canonical `/leads?lead=<id>` route so the Leads workspace drawer opens.
 * Any drift back to `/intake/leads/<id>` or `?leadId=` would 404 or silently fail.
 */
describe("Lead deep-links resolve to the canonical Leads route + drawer", () => {
  const app = read("src/App.tsx");
  const leadsV2 = read("src/pages/os/OSLeadsV2.tsx");
  const ctm = read("src/pages/phone/CTMCalls.tsx");
  const linker = read("src/components/escalation/EscalationLinkPicker.tsx");

  it("linkToHref('lead', id) produces /leads?lead=<id>", () => {
    expect(linkToHref({ type: "lead", id: "abc-123", label: "Test" }))
      .toBe("/leads?lead=abc-123");
  });

  it("registers the /leads route and redirects legacy /intake/leads", () => {
    expect(app).toMatch(/path="\/leads"\s+element=\{<OSLeadsV2\s*\/>\}/);
    expect(app).toMatch(/path="\/intake\/leads"\s+element=\{<Navigate to="\/leads" replace\s*\/>\}/);
  });

  it("OSLeadsV2 reads ?lead=<id> and mounts the lead drawer for that id", () => {
    expect(leadsV2).toMatch(/searchParams\.get\("lead"\)/);
    expect(leadsV2).toMatch(/<LeadDetailDrawer\s+leadId=\{openLeadId\}/);
  });

  it("CTMCalls links matched leads via /leads?lead=<id> (not the 404 /intake/leads/ path)", () => {
    expect(ctm).toMatch(/`\/leads\?lead=\$\{r\.matched_lead_id\}`/);
    expect(ctm).not.toMatch(/`\/intake\/leads\/\$\{[^}]*matched_lead_id/);
    expect(ctm).not.toMatch(/\?leadId=/);
  });

  it("Escalation link picker uses ?lead= (never the stale ?leadId= param)", () => {
    expect(linker).toMatch(/`\/leads\?lead=\$\{v\.id\}`/);
    expect(linker).not.toMatch(/\?leadId=/);
  });

  it("every /leads?lead=<uuid> URL our link builders emit matches the registered route path", () => {
    const sampleId = "11111111-1111-1111-1111-111111111111";
    const urls = [
      linkToHref({ type: "lead", id: sampleId, label: "x" }),
      `/leads?lead=${sampleId}`, // CTM shape
    ];
    for (const url of urls) {
      const [pathname, search] = url.split("?");
      expect(pathname).toBe("/leads");
      const params = new URLSearchParams(search);
      expect(params.get("lead")).toBe(sampleId);
      // App.tsx must define exactly this pathname as a routed page.
      expect(app).toContain(`path="${pathname}"`);
    }
  });
});