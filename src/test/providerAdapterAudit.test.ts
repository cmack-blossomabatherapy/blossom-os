import { describe, it, expect } from "vitest";
import { listAdapters } from "../../supabase/functions/_shared/integrations/providerRegistry.ts";

describe("provider adapter audit — capability contract", () => {
  const adapters = listAdapters();

  it("registers the expected read-only ad/analytics/ops adapters", () => {
    const ids = adapters.map((a) => a.id);
    for (const id of ["google-ads", "meta-ads", "fathom", "bloomgrowth", "jotform"]) {
      expect(ids).toContain(id);
    }
  });

  it("every adapter declares capabilities + documentationUrl", () => {
    for (const a of adapters) {
      expect(a.capabilities, `${a.id} missing capabilities`).toBeDefined();
      expect(a.capabilities!.documentationUrl, `${a.id} missing documentationUrl`).toMatch(/^https?:\/\//);
      expect(typeof a.capabilities!.probe).toBe("boolean");
      expect(typeof a.capabilities!.pullSync).toBe("boolean");
      expect(typeof a.capabilities!.webhook).toBe("boolean");
      expect(typeof a.capabilities!.outboundDisabled).toBe("boolean");
    }
  });

  it("Solum/Eligipro stay honest — vendor_docs_required, never fake connected", () => {
    for (const id of ["solum", "eligipro"]) {
      const a = adapters.find((x) => x.id === id)!;
      expect(a.capabilities!.operationalState).toBe("vendor_docs_required");
      expect(a.capabilities!.pullSync).toBe(false);
    }
  });

  it("Bloom Growth uses documented bearer token; ingest_only, not vendor_docs_required", () => {
    const bg = adapters.find((a) => a.id === "bloomgrowth")!;
    expect(bg.capabilities!.operationalState).toBe("ingest_only");
    expect(bg.requiredSecrets).toContain("BLOOMGROWTH_ACCESS_TOKEN");
    expect(bg.capabilities!.documentationUrl).toBe(
      "https://help.bloomgrowth.com/en/all-about-the-bloom-growth-api",
    );
  });

  it("Fathom AI is meeting_intelligence (developers.fathom.ai), not usefathom analytics", () => {
    const f = adapters.find((a) => a.id === "fathom")!;
    expect(f.classification).toBe("meeting_intelligence");
    expect(f.capabilities!.documentationUrl).toBe("https://developers.fathom.ai/");
    expect(f.requiredSecrets).toEqual(["FATHOM_API_KEY"]);
    expect(f.optionalSecrets ?? []).not.toContain("FATHOM_SITE_ID");
    expect(f.capabilities!.webhook).toBe(false);
  });

  it("Fathom adapter calls only /meetings with documented include_* flags — no invented endpoints", async () => {
    const fs = await import("node:fs/promises");
    const src = await fs.readFile(
      "supabase/functions/_shared/integrations/providers/fathom.ts",
      "utf8",
    );
    // No invented endpoints.
    expect(src).not.toMatch(/\/summaries\b/);
    expect(src).not.toMatch(/\/action-items\b/);
    // Documented includes present.
    expect(src).toMatch(/include_summary/);
    expect(src).toMatch(/include_action_items/);
    // Transcripts never requested (must be false or omitted).
    expect(src).toMatch(/include_transcript.*false/);
    expect(src).not.toMatch(/include_transcript["'\s:=]+true/);
    // Cursor pagination on the documented field.
    expect(src).toMatch(/next_cursor/);
    // Probe uses documented shape.
    expect(src).toMatch(/\/meetings\?limit=1/);
  });

  it("Google Ads is ingest_only (public docs); credential/approval is the blocker, not docs", () => {
    const g = adapters.find((a) => a.id === "google-ads")!;
    expect(g.capabilities!.operationalState).toBe("ingest_only");
  });

  it("Apploi + CentralReach documentationUrls point at the official pages", () => {
    const apploi = adapters.find((a) => a.id === "apploi")!;
    const cr = adapters.find((a) => a.id === "centralreach")!;
    expect(apploi.capabilities!.documentationUrl).toBe("https://integrate.apploi.com/");
    expect(cr.capabilities!.documentationUrl).toBe(
      "https://centralreach.com/resources/api/requests/",
    );
  });

  it("Go Integrator Nava stays manual/local only", () => {
    const nava = adapters.find((a) => a.id === "go-integrate-nava");
    expect(nava).toBeDefined();
    expect(nava!.capabilities!.pullSync).toBe(false);
  });
});
