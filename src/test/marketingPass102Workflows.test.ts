import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { ROLE_MENUS } from "@/lib/os/roleMenus";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");
const exists = (p: string) => fs.existsSync(path.join(process.cwd(), p));

const MARKETING_PROD_PAGES = [
  "src/pages/os/marketing/EmailMarketing.tsx",
  "src/pages/os/marketing/CallTracking.tsx",
  "src/pages/os/marketing/Campaigns.tsx",
  "src/pages/os/marketing/LeadSources.tsx",
  "src/pages/os/marketing/MarketingDashboard.tsx",
  "src/pages/os/growth/LeadSourceInbox.tsx",
  "src/pages/os/growth/LeadTrap.tsx",
  "src/pages/os/growth/FacebookAds.tsx",
  "src/pages/os/growth/GoogleAds.tsx",
];

describe("Marketing Pass 102 — reports rule preserved", () => {
  it("no MarketingReports page exists", () => {
    expect(exists("src/pages/os/marketing/MarketingReports.tsx")).toBe(false);
  });
  it("/marketing/reports is only a Navigate redirect to /reports", () => {
    const app = read("src/App.tsx");
    expect(app).toMatch(/path=["']\/marketing\/reports["'][^>]*element=\{[^}]*Navigate[^}]*to=["']\/reports/);
  });
});

describe("Marketing Pass 102 — Patient Lifetime Journey scoping", () => {
  it("/patient-journey route uses MARKETING_ROLES (not the BD superset)", () => {
    const app = read("src/App.tsx");
    const idx = app.indexOf('path="/patient-journey"');
    expect(idx).toBeGreaterThan(-1);
    const block = app.slice(idx, idx + 400);
    expect(block).toContain("MARKETING_ROLES");
    expect(block).not.toContain("MARKETING_ROLES_WITH_BD");
  });
  it("Business Development role menu does not link /patient-journey", () => {
    const bd = (ROLE_MENUS as any).business_development;
    const items: any[] = Array.isArray(bd) ? bd : (bd?.groups ?? []).flatMap((g: any) => g.items ?? []);
    const flat: any[] = items.flatMap((i: any) => [i, ...(i.children ?? [])]);
    expect(flat.some((i: any) => typeof i?.to === "string" && i.to.includes("/patient-journey"))).toBe(false);
  });
  it("Marketing role menu does include /patient-journey", () => {
    const mkt = (ROLE_MENUS as any).marketing_team ?? (ROLE_MENUS as any).marketing;
    const items: any[] = Array.isArray(mkt) ? mkt : (mkt?.groups ?? []).flatMap((g: any) => g.items ?? []);
    const flat: any[] = items.flatMap((i: any) => [i, ...(i.children ?? [])]);
    expect(flat.some((i: any) => typeof i?.to === "string" && i.to.includes("/patient-journey"))).toBe(true);
  });
});

describe("Marketing Pass 102 — Lead Source Inbox edit workflow", () => {
  it("LeadSourceInbox uses useMarketingSourceEvents and supports updateFields", () => {
    const src = read("src/pages/os/growth/LeadSourceInbox.tsx");
    expect(src).toContain("useMarketingSourceEvents");
    expect(src).toContain("updateFields");
    expect(src).toContain("EditSourceEventDialog");
  });
  it("useMarketingSourceEvents exposes updateFields", () => {
    const src = read("src/hooks/useMarketingSourceEvents.ts");
    expect(src).toContain("updateFields");
  });
});

describe("Marketing Pass 102 — Email Marketing writes to marketing_email_events", () => {
  it("EmailEventLogDialog inserts into marketing_email_events", () => {
    const src = read("src/components/marketing/EmailEventLogDialog.tsx");
    expect(src).toMatch(/from\(["']marketing_email_events["']\)/);
    expect(src).toContain("insert");
  });
  it("BulkEmailEventImportDialog inserts into marketing_email_events", () => {
    const src = read("src/components/marketing/BulkEmailEventImportDialog.tsx");
    expect(src).toMatch(/from\(["']marketing_email_events["']\)/);
  });
  it("EmailMarketing page mounts EmailEventLogDialog (not ManualSourceEventDialog)", () => {
    const src = read("src/pages/os/marketing/EmailMarketing.tsx");
    expect(src).toContain("EmailEventLogDialog");
    expect(src).not.toContain("ManualSourceEventDialog");
  });
});

describe("Marketing Pass 102 — Call Tracking queue", () => {
  it("CallTracking mounts CallQueueSection", () => {
    const src = read("src/pages/os/marketing/CallTracking.tsx");
    expect(src).toContain("CallQueueSection");
  });
  it("useMarketingCallEvents supports the required call workflow verbs", () => {
    const src = read("src/hooks/useMarketingCallEvents.ts");
    for (const fn of [
      "updateCallEvent",
      "linkLead",
      "setDisposition",
      "setCategory",
      "assignOwner",
      "markReviewed",
      "createManualCallEvent",
      "bulkImportCallEvents",
    ]) {
      expect(src).toContain(fn);
    }
    expect(src).toMatch(/from\(["']marketing_call_events["']\)/);
  });
});

describe("Marketing Pass 102 — Campaigns bulk metrics import", () => {
  it("BulkCampaignMetricsImportDialog inserts into marketing_campaign_metrics", () => {
    const src = read("src/components/marketing/BulkCampaignMetricsImportDialog.tsx");
    expect(src).toMatch(/from\(["']marketing_campaign_metrics["']\)/);
  });
  it("Campaigns page mounts the metrics import dialog and persisted CampaignManagerCard", () => {
    const src = read("src/pages/os/marketing/Campaigns.tsx");
    expect(src).toContain("BulkCampaignMetricsImportDialog");
    expect(src).toContain("CampaignManagerCard");
  });
});

describe("Marketing Pass 102 — source-specific pages surface campaign metrics", () => {
  it("Google Ads mounts SourceOpsPanel", () => {
    expect(read("src/pages/os/growth/GoogleAds.tsx")).toContain("SourceOpsPanel");
  });
  it("Facebook Ads mounts SourceOpsPanel", () => {
    expect(read("src/pages/os/growth/FacebookAds.tsx")).toContain("SourceOpsPanel");
  });
  it("LeadTrap mounts SourceOpsPanel", () => {
    expect(read("src/pages/os/growth/LeadTrap.tsx")).toContain("SourceOpsPanel");
  });
  it("SourceOpsPanel reads campaign metrics rollups", () => {
    const src = read("src/components/marketing/SourceOpsPanel.tsx");
    expect(src).toContain("useMarketingCampaignMetrics");
    expect(src).toContain("useMarketingCampaigns");
    expect(src).toContain("useMarketingSources");
  });
});

describe("Marketing Pass 102 — integration readiness coverage", () => {
  it("includes CTM, Jivetel, RetellAI, LeadTrap, Google/Meta Ads, Mailchimp, CentralReach, Outlook/MS365", () => {
    const src = read("src/components/marketing/IntegrationReadinessPanel.tsx");
    for (const s of ["CTM", "Jivetel", "RetellAI", "LeadTrap", "Google Ads", "Meta", "Mailchimp", "CentralReach", "ms365"]) {
      expect(src).toContain(s);
    }
  });
});

describe("Marketing Pass 102 — no local mock/shim data on production Marketing pages", () => {
  it.each(MARKETING_PROD_PAGES)("%s does not import mock/shim data", (p) => {
    const src = read(p);
    for (const bad of ["mockLeads", "mockPhoneCalls", "mockCandidates", "leadSourceEventsStore", "shimLeads", "shimCalls"]) {
      expect(src).not.toContain(bad);
    }
  });
});