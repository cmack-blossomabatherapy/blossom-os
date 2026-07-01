import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { MARKETING_INTEGRATION_LABELS } from "@/components/marketing/IntegrationReadinessPanel";
import { expandSourceSlugAliases } from "@/lib/marketing/sourceEventMapper";

const read = (p: string) => fs.readFileSync(path.resolve(process.cwd(), p), "utf8");

describe("Marketing Pass 109 - integration readiness health", () => {
  const src = read("src/hooks/useMarketingIntegrationHealth.ts");

  it("reads integration_webhook_events", () => {
    expect(src).toMatch(/listIntegrationWebhookEvents|integration_webhook_events/);
  });

  it("reads integration_normalized_records", () => {
    expect(src).toMatch(/listNormalizedRecords|integration_normalized_records/);
  });

  it("still reads integration_sync_runs", () => {
    expect(src).toMatch(/listIntegrationSyncRuns/);
  });

  it("still reads marketing source/call/email event tables", () => {
    expect(src).toContain("marketing_call_events");
    expect(src).toContain("marketing_email_events");
    expect(src).toMatch(/useMarketingSourceEvents|marketing_source_events/);
  });

  it("Nava aliases stay present", () => {
    const set = new Set(expandSourceSlugAliases(["nava"]));
    for (const v of ["nava", "go_integrate_nava", "go-integrate-nava"]) {
      expect(set.has(v)).toBe(true);
    }
  });

  it("MARKETING_INTEGRATION_LABELS covers required systems", () => {
    for (const l of [
      "CTM",
      "Jivetel",
      "RetellAI",
      "LeadTrap",
      "Google Ads",
      "Meta",
      "Mailchimp",
      "CentralReach",
      "Outlook",
      "MS365",
      "Go Integrate Nava",
    ]) {
      expect(MARKETING_INTEGRATION_LABELS).toContain(l);
    }
  });
});
