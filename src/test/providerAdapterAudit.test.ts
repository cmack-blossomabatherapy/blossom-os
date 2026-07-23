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

  it("Solum/Eligipro/BloomGrowth stay honest — vendor_docs_required, never fake connected", () => {
    for (const id of ["solum", "eligipro", "bloomgrowth"]) {
      const a = adapters.find((x) => x.id === id)!;
      expect(a.capabilities!.operationalState).toBe("vendor_docs_required");
      expect(a.capabilities!.pullSync).toBe(false);
    }
  });

  it("Go Integrator Nava stays manual/local only", () => {
    const nava = adapters.find((a) => a.id === "go-integrate-nava");
    expect(nava).toBeDefined();
    expect(nava!.capabilities!.pullSync).toBe(false);
  });
});
