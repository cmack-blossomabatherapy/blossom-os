import { describe, it, expect } from "vitest";
import { listAdapters } from "../../supabase/functions/_shared/integrations/providerRegistry.ts";
import {
  PROVIDER_READINESS_MANIFEST,
  READINESS_LABELS,
  deriveReadiness,
  type ProviderReadinessEntry,
} from "@/lib/os/integrations/readinessManifest";

describe("provider readiness manifest — Slice 3", () => {
  const adapters = listAdapters();
  const manifestById = new Map(PROVIDER_READINESS_MANIFEST.map((m) => [m.id, m]));

  it("covers every active adapter (parity with registry)", () => {
    for (const a of adapters) {
      const entry = manifestById.get(a.id);
      expect(entry, `manifest missing entry for adapter ${a.id}`).toBeDefined();
      expect(entry!.retired ?? false).toBe(false);
    }
  });

  it("mirrors adapter capability flags exactly", () => {
    for (const a of adapters) {
      const entry = manifestById.get(a.id)!;
      const cap = a.capabilities ?? {};
      expect(entry.capabilities.probe, `${a.id}.probe`).toBe(Boolean(cap.probe));
      expect(entry.capabilities.pullSync, `${a.id}.pullSync`).toBe(Boolean(cap.pullSync));
      expect(entry.capabilities.webhook, `${a.id}.webhook`).toBe(Boolean(cap.webhook));
      expect(entry.capabilities.outboundDisabled, `${a.id}.outboundDisabled`).toBe(Boolean(cap.outboundDisabled));
      expect(entry.capabilities.documentationUrl).toBe(cap.documentationUrl);
      expect(entry.requiredSecrets.sort()).toEqual([...a.requiredSecrets].sort());
      expect((entry.optionalSecrets ?? []).sort()).toEqual([...(a.optionalSecrets ?? [])].sort());
    }
  });

  it("exposes only truthful readiness labels", () => {
    const allowed: (keyof typeof READINESS_LABELS)[] = [
      "connected",
      "ingest_only",
      "ready_to_configure",
      "needs_credentials",
      "vendor_docs_required",
      "manual_local",
      "retired",
    ];
    for (const entry of PROVIDER_READINESS_MANIFEST) {
      const { label } = deriveReadiness(entry, {});
      expect(allowed).toContain(label);
    }
  });

  it("retired providers always resolve to `retired`", () => {
    for (const id of ["leadtrap", "pandadoc"]) {
      const entry = manifestById.get(id)!;
      expect(entry.retired).toBe(true);
      const { label } = deriveReadiness(entry, { lastSuccessAt: new Date().toISOString() });
      expect(label).toBe("retired");
    }
  });

  it("Go Integrator Nava is manual_local (no cloud probe/sync)", () => {
    const nava = manifestById.get("go-integrate-nava")!;
    expect(nava.capabilities.localOnly).toBe(true);
    expect(nava.capabilities.pullSync).toBe(false);
    expect(nava.capabilities.probe).toBe(false);
    expect(deriveReadiness(nava, {}).label).toBe("manual_local");
  });

  it("Solum / Eligipro / Bloomgrowth report vendor_docs_required honestly", () => {
    for (const id of ["solum", "eligipro", "bloomgrowth"]) {
      const entry = manifestById.get(id)!;
      expect(entry.capabilities.operationalState).toBe("vendor_docs_required");
      const { label, nextAction } = deriveReadiness(entry, {});
      expect(label).toBe("vendor_docs_required");
      expect(nextAction.toLowerCase()).toContain("vendor");
    }
  });

  it("CTM remains registered as ingest_only (live behavior preserved)", () => {
    const ctm = manifestById.get("ctm")!;
    expect(ctm.capabilities.operationalState).toBe("ingest_only");
    expect(ctm.capabilities.webhook).toBe(true);
    expect(ctm.capabilities.outboundDisabled).toBe(true);
  });

  it("no active provider surfaces outbound writeback in manifest", () => {
    for (const entry of PROVIDER_READINESS_MANIFEST) {
      if (entry.retired) continue;
      if (entry.id === "make") continue; // migration_bridge documented exception
      expect(entry.capabilities.outboundDisabled, `${entry.id} must have outboundDisabled=true`).toBe(true);
    }
  });

  it("needs_credentials fires when required secrets are visibly absent", () => {
    const jotform: ProviderReadinessEntry = manifestById.get("jotform")!;
    const { label, nextAction } = deriveReadiness(jotform, { presentRequiredSecrets: [] });
    expect(label).toBe("needs_credentials");
    expect(nextAction).toContain("JOTFORM_API_KEY");
  });

  it("connected + ingest_only adapters produce `ingest_only` label when successful", () => {
    const ctm = manifestById.get("ctm")!;
    const { label } = deriveReadiness(ctm, {
      connectionStatus: "connected",
      lastSuccessAt: new Date().toISOString(),
      presentRequiredSecrets: ctm.requiredSecrets,
    });
    expect(label).toBe("ingest_only");
  });
});
