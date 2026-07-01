import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { ROLE_MENUS, MARKETING_ROLES } from "@/lib/os/roleMenus";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");
const exists = (p: string) => fs.existsSync(path.join(process.cwd(), p));

describe("Marketing Pass 101 — operating hook layer", () => {
  it("exposes useMarketingSources with CRUD", () => {
    const src = read("src/hooks/useMarketingSources.ts");
    expect(src).toMatch(/from\(["']marketing_sources["']\)/);
    for (const fn of ["createSource", "updateSource", "setActive"]) expect(src).toContain(fn);
  });
  it("exposes useMarketingCampaigns with CRUD + status actions", () => {
    const src = read("src/hooks/useMarketingCampaigns.ts");
    expect(src).toMatch(/from\(["']marketing_campaigns["']\)/);
    for (const s of ["draft", "active", "paused", "completed", "archived"]) expect(src).toContain(s);
    for (const fn of ["createCampaign", "updateCampaign", "setStatus", "archive"]) expect(src).toContain(fn);
  });
  it("exposes useMarketingCampaignMetrics with rollup + insert", () => {
    const src = read("src/hooks/useMarketingCampaignMetrics.ts");
    expect(src).toMatch(/from\(["']marketing_campaign_metrics["']\)/);
    expect(src).toContain("insertMetrics");
    expect(src).toContain("costPerLeadCents");
  });
});

describe("Marketing Pass 101 — campaign + source management", () => {
  it("Campaigns.tsx mounts the persisted CampaignManagerCard", () => {
    const src = read("src/pages/os/marketing/Campaigns.tsx");
    expect(src).toContain("CampaignManagerCard");
  });
  it("CampaignManagerCard uses marketing_campaigns hook + form dialog", () => {
    const src = read("src/components/marketing/CampaignManagerCard.tsx");
    expect(src).toContain("useMarketingCampaigns");
    expect(src).toContain("CampaignFormDialog");
  });
  it("LeadSources.tsx mounts SourceManagerCard and IntegrationReadinessPanel", () => {
    const src = read("src/pages/os/marketing/LeadSources.tsx");
    expect(src).toContain("SourceManagerCard");
    expect(src).toContain("IntegrationReadinessPanel");
  });
  it("SourceManagerCard uses marketing_sources hook", () => {
    const src = read("src/components/marketing/SourceManagerCard.tsx");
    expect(src).toContain("useMarketingSources");
  });
});

describe("Marketing Pass 101 — bulk import workflow", () => {
  it("BulkSourceEventImportDialog inserts into marketing_source_events", () => {
    const src = read("src/components/marketing/BulkSourceEventImportDialog.tsx");
    expect(src).toMatch(/from\(["']marketing_source_events["']\)/);
    expect(src).toContain("insert");
  });
  it("LeadSourceActions offers single + bulk import + inbox links", () => {
    const src = read("src/components/marketing/LeadSourceActions.tsx");
    expect(src).toContain("BulkSourceEventImportDialog");
    expect(src).toContain("Bulk Import Events");
    expect(src).toContain("ManualSourceEventDialog");
    expect(src).toContain("Open Lead Source Inbox");
  });
});

describe("Marketing Pass 101 — call tracking data model", () => {
  it("useMarketingData reads structured call fields", () => {
    const src = read("src/hooks/useMarketingData.ts");
    for (const f of ["direction", "call_category", "disposition", "reviewed_at"]) expect(src).toContain(f);
    expect(src).toContain("callCategory");
  });
});

describe("Marketing Pass 101 — reports rule preserved", () => {
  it("no MarketingReports page exists", () => {
    expect(exists("src/pages/os/marketing/MarketingReports.tsx")).toBe(false);
  });
  it("/marketing/reports stays redirect-only", () => {
    const app = read("src/App.tsx");
    expect(app).toMatch(/\/marketing\/reports/);
    expect(app).toMatch(/Navigate[^>]*to=["']\/reports/);
  });
});

describe("Marketing Pass 101 — role menu invariants", () => {
  it("Patient Lifetime Journey stays Marketing-only", () => {
    for (const role of Object.keys(ROLE_MENUS) as Array<keyof typeof ROLE_MENUS>) {
      const items = ROLE_MENUS[role] ?? [];
      const hasPLJ = items.some((i: any) =>
        (typeof i?.to === "string" && i.to.includes("/patient-journey")) ||
        (i?.children ?? []).some((c: any) => typeof c?.to === "string" && c.to.includes("/patient-journey")),
      );
      if (hasPLJ) expect(MARKETING_ROLES).toContain(role as any);
    }
  });
  it("Business Development role has no Patient Lifetime Journey menu link", () => {
    const bd = (ROLE_MENUS as any).business_development ?? [];
    const flat: any[] = bd.flatMap((i: any) => [i, ...(i.children ?? [])]);
    expect(flat.some((i: any) => typeof i?.to === "string" && i.to.includes("/patient-journey"))).toBe(false);
  });
});