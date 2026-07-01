import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  MARKETING_PAYLOAD_CONTRACTS,
  getPayloadContract,
  mapPayload,
} from "@/lib/marketing/integrationPayloadContracts";
import { expandSourceSlugAliases } from "@/lib/marketing/sourceEventMapper";

const read = (p: string) => fs.readFileSync(path.resolve(process.cwd(), p), "utf8");

describe("Marketing Pass 107 - integration readiness", () => {
  it("useMarketingIntegrationHealth.ts exists", () => {
    expect(fs.existsSync("src/hooks/useMarketingIntegrationHealth.ts")).toBe(true);
  });

  it("IntegrationReadinessPanel uses useMarketingIntegrationHealth", () => {
    expect(read("src/components/marketing/IntegrationReadinessPanel.tsx")).toContain(
      "useMarketingIntegrationHealth",
    );
  });

  it("Nava aliases include the required variants", () => {
    const set = new Set(expandSourceSlugAliases(["nava"]));
    for (const v of ["nava", "go_integrate_nava", "go-integrate-nava"]) {
      expect(set.has(v)).toBe(true);
    }
  });

  it("integrationPayloadContracts.ts exists", () => {
    expect(fs.existsSync("src/lib/marketing/integrationPayloadContracts.ts")).toBe(true);
  });

  it("payload contracts include every required system", () => {
    const ids = new Set(MARKETING_PAYLOAD_CONTRACTS.map((c) => c.id));
    for (const id of [
      "ctm", "jivetel", "retellai", "leadtrap",
      "google_ads", "meta_ads", "mailchimp", "ms365",
      "centralreach", "nava",
    ]) {
      expect(ids.has(id)).toBe(true);
    }
  });

  it("payload contracts preserve raw_payload and return normalized rows with target table", () => {
    for (const c of MARKETING_PAYLOAD_CONTRACTS) {
      const sample = { foo: "bar", timestamp: "2026-07-01T00:00:00Z", email: "a@b.co", phone: "+14045551212" };
      const out = mapPayload(c.id, sample);
      expect(out.length).toBeGreaterThan(0);
      for (const row of out) {
        expect(typeof row.table).toBe("string");
        expect(row.row.raw_payload).toEqual(sample);
      }
    }
  });

  it("CTM contract splits into call and source events", () => {
    const out = getPayloadContract("ctm")!.map({
      caller_number: "+14045551212",
      start_time: "2026-07-01T00:00:00Z",
    });
    const tables = out.map((r) => r.table);
    expect(tables).toContain("marketing_call_events");
    expect(tables).toContain("marketing_source_events");
  });

  it("web metrics hook supports date/source/state/campaign filters", () => {
    const src = read("src/hooks/useMarketingWebMetrics.ts");
    for (const k of ["dateFrom", "dateTo", "sourceSystem", "state", "campaignId", "pagePath", "query"]) {
      expect(src).toContain(k);
    }
  });

  it("reputation hook supports date/source/state/rating/sentiment/responseStatus filters", () => {
    const src = read("src/hooks/useMarketingReputationEvents.ts");
    for (const k of ["dateFrom", "dateTo", "sourceSystem", "state", "rating", "sentiment", "responseStatus"]) {
      expect(src).toContain(k);
    }
  });

  it("work items hook supports owner/status/priority/due/search filters", () => {
    const src = read("src/hooks/useMarketingWorkItems.ts");
    for (const k of ["ownerId", "status", "priority", "dueBefore", "dueAfter", "search"]) {
      expect(src).toContain(k);
    }
  });

  it("MarketingReports.tsx does not exist", () => {
    expect(fs.existsSync("src/pages/os/marketing/MarketingReports.tsx")).toBe(false);
  });

  it("/marketing/reports remains redirect-only", () => {
    const app = read("src/App.tsx");
    expect(app).toMatch(/path="\/marketing\/reports"\s+element=\{<Navigate to="\/reports\?category=marketing"/);
  });

  it("/patient-journey stays Marketing-only and BD does not link there", () => {
    const app = read("src/App.tsx");
    expect(app).toMatch(/path="\/patient-journey"[\s\S]{0,200}MARKETING_ROLES/);
    const bd = read("src/pages/os/OSShell.tsx");
    expect(bd).not.toContain("/patient-journey");
  });

  it("WebAnalytics contains no fake mobile share", () => {
    const s = read("src/pages/os/marketing/WebAnalytics.tsx");
    expect(s.toLowerCase()).not.toContain("est. mobile share");
  });

  it("IntegrationIngestPreviewPanel is wired on Lead Sources page", () => {
    expect(read("src/pages/os/marketing/LeadSources.tsx")).toContain("IntegrationIngestPreviewPanel");
  });
});
