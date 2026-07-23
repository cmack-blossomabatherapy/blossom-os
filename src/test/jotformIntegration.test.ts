import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

describe("Jotform replaces LeadTrap + PandaDoc as the canonical form/intake provider", () => {
  it("provider registry imports jotformAdapter and no longer imports leadtrap/pandadoc adapters", () => {
    const src = read("supabase/functions/_shared/integrations/providerRegistry.ts");
    expect(src).toMatch(/jotformAdapter/);
    expect(src).not.toMatch(/^import\s*\{\s*leadtrapAdapter/m);
    expect(src).not.toMatch(/^import\s*\{\s*pandadocAdapter/m);
    expect(src).toMatch(/RETIRED_PROVIDERS/);
  });

  it("jotform adapter uses APIKEY header, allowlists only jotform endpoints, and recommends HIPAA", () => {
    const src = read("supabase/functions/_shared/integrations/providers/jotform.ts");
    expect(src).toMatch(/APIKEY/);
    expect(src).toMatch(/api\.jotform\.com/);
    expect(src).toMatch(/eu-api\.jotform\.com/);
    expect(src).toMatch(/hipaa-api\.jotform\.com/);
    // Base URL allowlist must be enforced.
    expect(src).toMatch(/ALLOWED_BASE_URLS/);
    // Pull sync must be bounded and read-only (offset/limit paging).
    expect(src).toMatch(/orderby/);
    expect(src).toMatch(/offset/);
  });

  it("jotform adapter declares honest capabilities (probe/pullSync/webhook, outboundDisabled)", () => {
    const src = read("supabase/functions/_shared/integrations/providers/jotform.ts");
    expect(src).toMatch(/outboundDisabled:\s*true/);
    expect(src).toMatch(/documentationUrl/);
  });

  it("integration-webhook parses form-encoded/multipart payloads and rejects missing Jotform tokens", () => {
    const src = read("supabase/functions/integration-webhook/index.ts");
    expect(src).toMatch(/multipart\/form-data/);
    expect(src).toMatch(/verifyJotformToken/);
    // No PandaDoc/LeadTrap-specific signature header lookups remain.
    expect(src).not.toMatch(/x-pandadoc-signature/);
    expect(src).not.toMatch(/x-leadtrap-signature/);
  });

  it("integration-test-connection maps jotform required secrets and drops leadtrap/pandadoc entries", () => {
    const src = read("supabase/functions/integration-test-connection/index.ts");
    expect(src).toMatch(/jotform:\s*\[/);
    expect(src).toMatch(/JOTFORM_API_KEY/);
    expect(src).toMatch(/JOTFORM_API_BASE_URL/);
    expect(src).toMatch(/JOTFORM_WEBHOOK_TOKEN/);
    expect(src).not.toMatch(/\n\s*pandadoc:\s*\[/);
    expect(src).not.toMatch(/\n\s*leadtrap:\s*\[/);
  });

  it("frontend integration registry lists jotform and marks leadtrap/pandadoc disabled", () => {
    const src = read("src/lib/os/integrations/integrationRegistry.ts");
    expect(src).toMatch(/id:\s*"jotform"/);
    // Both retired integrations still exist for historical rows but are
    // disabled + internalOnly so they no longer appear in active pickers.
    const leadtrapBlock = src.split('id: "leadtrap"')[1]?.split("},")[0] ?? "";
    const pandadocBlock = src.split('id: "pandadoc"')[1]?.split("},")[0] ?? "";
    expect(leadtrapBlock).toMatch(/status:\s*"disabled"/);
    expect(leadtrapBlock).toMatch(/internalOnly:\s*true/);
    expect(pandadocBlock).toMatch(/status:\s*"disabled"/);
    expect(pandadocBlock).toMatch(/internalOnly:\s*true/);
  });

  it("Go Integrator Nava is reclassified as local desktop CTI, not eligibility, and Run Sync is unsupported", () => {
    const src = read("supabase/functions/_shared/integrations/providers/goIntegrateNava.ts");
    expect(src).toMatch(/communications_desktop_cti/);
    expect(src).toMatch(/localOnly:\s*true/);
    expect(src).toMatch(/manual_local_setup/);
    expect(src).toMatch(/not_cloud_testable/);
  });

  it("Provider adapter type exposes a capabilities matrix", () => {
    const src = read("supabase/functions/_shared/integrations/types.ts");
    expect(src).toMatch(/capabilities\?:/);
    expect(src).toMatch(/documentationUrl\?/);
    expect(src).toMatch(/outboundDisabled\?/);
  });
});