import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  resolveApploiIdentity,
  describeIdentitySource,
} from "@/lib/recruiting/apploiNormalizedIdentity";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("resolveApploiIdentity — durable identity from integration_normalized_records", () => {
  it("prefers provider_record_id when present", () => {
    const r = resolveApploiIdentity({
      id: "11111111-1111-1111-1111-111111111111",
      provider_record_id: "apploi-abc",
      metadata: { id: "meta-xyz" },
    });
    expect(r).toEqual({ externalId: "apploi-abc", source: "provider" });
  });

  it("falls back to metadata.id when provider_record_id is missing", () => {
    const r = resolveApploiIdentity({
      id: "11111111-1111-1111-1111-111111111111",
      provider_record_id: null,
      metadata: { id: "meta-xyz" },
    });
    expect(r.externalId).toBe("meta-xyz");
    expect(r.source).toBe("metadata");
    expect(r.metadataKey).toBe("id");
  });

  it("recognizes alternate metadata identity keys used by Apploi payloads", () => {
    for (const key of ["applicant_id", "candidate_id", "apploi_id", "uuid"]) {
      const r = resolveApploiIdentity({
        id: "n-1",
        provider_record_id: null,
        metadata: { [key]: `val-${key}` },
      });
      expect(r.externalId).toBe(`val-${key}`);
      expect(r.source).toBe("metadata");
      expect(r.metadataKey).toBe(key);
    }
  });

  it("coerces numeric metadata ids to string", () => {
    const r = resolveApploiIdentity({
      id: "n-1",
      provider_record_id: null,
      metadata: { id: 42 },
    });
    expect(r.externalId).toBe("42");
    expect(r.source).toBe("metadata");
  });

  it("uses the normalized-record uuid as durable fallback", () => {
    const r = resolveApploiIdentity({
      id: "22222222-2222-2222-2222-222222222222",
      provider_record_id: null,
      metadata: {},
    });
    expect(r.externalId).toBe("normalized_record:22222222-2222-2222-2222-222222222222");
    expect(r.source).toBe("normalized_record");
  });

  it("returns none when nothing durable is available", () => {
    const r = resolveApploiIdentity({
      id: null,
      provider_record_id: null,
      metadata: {},
    });
    expect(r.externalId).toBeNull();
    expect(r.source).toBe("none");
  });

  it("treats empty/whitespace strings as absent", () => {
    const r = resolveApploiIdentity({
      id: "n-1",
      provider_record_id: "   ",
      metadata: { id: "" },
    });
    expect(r.source).toBe("normalized_record");
  });

  it("describeIdentitySource covers every source", () => {
    expect(describeIdentitySource("provider")).toMatch(/provider/);
    expect(describeIdentitySource("metadata")).toMatch(/metadata/);
    expect(describeIdentitySource("normalized_record")).toMatch(/normalized/);
    expect(describeIdentitySource("none")).toMatch(/no durable/);
  });
});

describe("Apploi importer wiring — normalized-record identity path", () => {
  it("useApploiIntegration imports the shared resolver", () => {
    const src = read("src/hooks/useApploiIntegration.ts");
    expect(src).toMatch(/from "@\/lib\/recruiting\/apploiNormalizedIdentity"/);
    expect(src).toMatch(/resolveApploiIdentity\(/);
  });

  it("importer logs the identity source on both success and skip events", () => {
    const src = read("src/hooks/useApploiIntegration.ts");
    expect(src).toMatch(/external_id_source:\s*externalIdSource/);
    expect(src).toMatch(/reason:\s*"no_durable_external_id"/);
    expect(src).toMatch(/normalized_record_id/);
  });

  it("preview hook uses the same resolver so ops see what will be imported", () => {
    const src = read("src/hooks/useApploiIntegration.ts");
    // Ensure the preview mapper no longer falls back to raw provider_record_id/p.id inline.
    expect(src).not.toMatch(/String\(r\.provider_record_id \?\? p\.id \?\? ""\)/);
  });
});