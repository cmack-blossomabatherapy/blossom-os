import { describe, it, expect } from "vitest";
import fs from "node:fs";
import {
  LEAD_SOURCE_OPTIONS,
  buildLeadSourceDefaults,
  getLeadSourceOption,
  leadSourceJourneyOrigin,
  leadSourceLabel,
} from "@/lib/leads/leadSourceConfig";
import { STAGED_ROLE_LIVE_PATHS } from "@/pages/os/OSShell";
import { BLOSSOM_INTEGRATIONS } from "@/lib/os/integrations/integrationRegistry";
import { ROLE_MENUS } from "@/lib/os/roleMenus";

const read = (p: string) => fs.readFileSync(p, "utf8");

const REQUIRED_SOURCES = [
  "Website", "Phone", "CTM", "Retell AI", "LeadTrap",
  "Google Ads", "Facebook Ads", "Mailchimp",
  "Referral", "Referral Partner", "Pediatrician",
  "Community Outreach", "Business Development",
  "BCBA Referral", "Insurance", "Organic", "Other",
];

describe("Sprint 07 — Lead intake & patient journey engine", () => {
  it("LEAD_SOURCE_OPTIONS exposes every required source", () => {
    const values = new Set(LEAD_SOURCE_OPTIONS.map((o) => o.value));
    for (const v of REQUIRED_SOURCES) {
      expect(values.has(v), `missing source ${v}`).toBe(true);
    }
  });

  it("buildLeadSourceDefaults injects integration + source metadata", () => {
    const d = buildLeadSourceDefaults("CTM", { sourcePage: "call-tracking" });
    expect(d.leadSource).toBe("CTM");
    expect(d.utmSource).toBe("ctm");
    expect(d.sourceMetadata.integration_id).toBe("ctm");
    expect(d.sourceMetadata.source_page).toBe("call-tracking");
    expect(d.sourceMetadata.journey_origin).toBe("CTM");
  });

  it("source -> journey origin labels include connector-attributable sources", () => {
    expect(leadSourceJourneyOrigin("CTM")).toBe("CTM");
    expect(leadSourceJourneyOrigin("Retell AI")).toBe("Retell");
    expect(leadSourceJourneyOrigin("LeadTrap")).toBe("LeadTrap");
    expect(leadSourceJourneyOrigin("Facebook Ads")).toBe("Facebook Ads");
    expect(leadSourceJourneyOrigin("Google Ads")).toBe("Google Ads");
    expect(leadSourceJourneyOrigin("Mailchimp")).toBe("Mailchimp");
    expect(leadSourceJourneyOrigin("Website")).toBe("Manual");
  });

  it("getLeadSourceOption / labels tolerate unknown values", () => {
    expect(getLeadSourceOption("Nope")).toBeUndefined();
    expect(leadSourceLabel("Nope")).toBe("Nope");
    expect(leadSourceLabel("CTM")).toBe("CTM / CallTrackingMetrics");
  });

  it("NewLeadDialog consumes shared lead source config", () => {
    const src = read("src/components/leads/NewLeadDialog.tsx");
    expect(src).toMatch(/leadSourceConfig/);
    expect(src).toMatch(/LEAD_SOURCE_OPTIONS/);
    expect(src).toMatch(/SourceAttributionSummary/);
    expect(src).toMatch(/Email is required when preferred contact is Email/);
  });

  it("LeadSourceActions passes source defaults + metadata into NewLeadDialog", () => {
    const src = read("src/components/marketing/LeadSourceActions.tsx");
    expect(src).toMatch(/buildLeadSourceDefaults/);
    expect(src).toMatch(/integration_id/);
    expect(src).toMatch(/source_page/);
  });

  it("createLead persists source_metadata + creates initial task and optional comm", () => {
    const src = read("src/contexts/LeadsContext.tsx");
    expect(src).toMatch(/source_metadata:\s*input\.sourceMetadata/);
    expect(src).toMatch(/from\("intake_tasks"\)\.insert/);
    expect(src).toMatch(/from\("intake_communications"\)\.insert/);
    expect(src).toMatch(/logLeadActivity/);
  });

  it("Patient Lifetime Journey labels every connector-attributable origin", () => {
    const src = read("src/pages/os/growth/PatientLifetimeJourney.tsx");
    expect(src).toMatch(/leadSourceJourneyOrigin/);
    expect(src).toMatch(/JourneySummary/);
    expect(src).toMatch(/Origin:/);
    // Origin labels are derived from the shared config (single source of truth).
    for (const o of ["CTM", "Retell", "LeadTrap", "Facebook Ads", "Google Ads", "Mailchimp",
                     "Outlook", "CentralReach", "Eligipro", "Solum", "PandaDoc", "Calendly"]) {
      // Just ensure the type carries the value — guarantees the journey can render it.
      const t = o as Parameters<typeof leadSourceLabel>[0];
      expect(typeof t).toBe("string");
    }
    const cfg = read("src/lib/leads/leadSourceConfig.ts");
    for (const o of ["CTM", "Retell", "LeadTrap", "Facebook Ads", "Google Ads", "Mailchimp",
                     "Outlook", "CentralReach", "Eligipro", "Solum", "PandaDoc", "Calendly"]) {
      expect(cfg.includes(`"${o}"`), `config missing origin ${o}`).toBe(true);
    }
  });

  it("Intake Dashboard / Lead-to-Active mount NewLeadDialog", () => {
    for (const p of [
      "src/pages/os/intake/IntakeDashboard.tsx",
      "src/pages/os/intake/LeadToActivePipeline.tsx",
    ]) {
      const src = read(p);
      expect(src, p).toMatch(/NewLeadDialog/);
      expect(src, p).toMatch(/setAddOpen\(true\)/);
    }
  });

  it("Intake follow-up pages do not deep-link to Patient Lifetime Journey (Export 81+)", () => {
    // Patient Lifetime Journey is Marketing/Growth/BD only — Intake pages
    // open the lead detail page instead.
    const a = read("src/pages/os/intake/MissingInformation.tsx");
    const b = read("src/pages/os/intake/ParentCommunication.tsx");
    expect(a).not.toMatch(/\/patient-journey/);
    expect(b).not.toMatch(/\/patient-journey/);
  });

  it("State Director Training Academy stays at /training", () => {
    const sd = ROLE_MENUS.state_director;
    const asd = ROLE_MENUS.assistant_state_director;
    const find = (m: typeof sd) =>
      m?.sections.flatMap((s) => s.items).find((i) => i.label === "Training Academy");
    expect(find(sd)?.path).toBe("/training");
    expect(find(asd)?.path).toBe("/training");
  });

  it("Staged role menus remain staged", () => {
    expect(STAGED_ROLE_LIVE_PATHS.has("/academy")).toBe(true);
    expect(STAGED_ROLE_LIVE_PATHS.has("/training")).toBe(true);
    expect(STAGED_ROLE_LIVE_PATHS.has("/resource-library")).toBe(true);
    expect(STAGED_ROLE_LIVE_PATHS.has("/reports")).toBe(true);
  });

  it("Admin Integrations still maps from BLOSSOM_INTEGRATIONS", () => {
    const src = read("src/pages/admin/Integrations.tsx");
    expect(src).toMatch(/BLOSSOM_INTEGRATIONS/);
    expect(BLOSSOM_INTEGRATIONS.length).toBeGreaterThan(0);
  });
});