import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");
const exists = (p: string) => existsSync(join(ROOT, p));

function readAll(dir: string): string {
  let out = "";
  for (const f of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
    const p = join(dir, f.name);
    if (f.isDirectory()) out += readAll(p);
    else if (/\.(ts|tsx|js|jsx)$/.test(f.name)) out += "\n" + readFileSync(join(ROOT, p), "utf8");
  }
  return out;
}

describe("Pass 2 — no hardcoded Retell agent or Supabase project URL in source", () => {
  const srcDump = readAll("src");
  const fnDump = readAll("supabase/functions");

  it("src/ has no hardcoded historical Retell agent id", () => {
    expect(srcDump).not.toMatch(/agent_fb8aaca447d2a6c6703d40d77a/);
  });
  it("supabase/functions has no hardcoded historical Retell agent id", () => {
    expect(fnDump).not.toMatch(/agent_fb8aaca447d2a6c6703d40d77a/);
  });
  it("Admin Integrations does not hardcode the Supabase functions URL", () => {
    const src = read("src/pages/admin/Integrations.tsx");
    expect(src).not.toMatch(/uvkhjfjknnndunxcdbel\.functions\.supabase\.co/);
  });
});

describe("Pass 2 — Admin Integrations consumes backend helpers and is honest", () => {
  const src = read("src/pages/admin/Integrations.tsx");

  it("imports backend helpers", () => {
    expect(src).toMatch(/listIntegrationConnections/);
    expect(src).toMatch(/listIntegrationSyncRuns/);
    expect(src).toMatch(/listIntegrationWebhookEvents/);
    expect(src).toMatch(/listUserOAuthConnections/);
    expect(src).toMatch(/testIntegrationConnection/);
    expect(src).toMatch(/runIntegrationSync/);
  });
  it("does not render 'All systems operational' as static copy", () => {
    expect(src).not.toMatch(/>\s*All systems operational\s*</);
  });
  it("does not include fake static health values", () => {
    expect(src).not.toMatch(/Background jobs.*118 running/);
    expect(src).not.toMatch(/Webhook activity.*2\.3k \/ hr/);
    expect(src).not.toMatch(/API usage.*42% \/ month/);
    expect(src).not.toMatch(/Last full sync · 4 min ago/);
  });
});

describe("Pass 2 — Outlook OAuth uses encrypted token vault", () => {
  it("microsoft-oauth-callback writes to integration_oauth_token_vault", () => {
    const src = read("supabase/functions/microsoft-oauth-callback/index.ts");
    expect(src).toContain("integration_oauth_token_vault");
    expect(src).toContain("encryptToken");
  });
  it("microsoft-refresh-token edge function exists", () => {
    expect(exists("supabase/functions/microsoft-refresh-token/index.ts")).toBe(true);
  });
  it("microsoft-graph-probe edge function exists", () => {
    expect(exists("supabase/functions/microsoft-graph-probe/index.ts")).toBe(true);
  });
  it("shared crypto helper exists", () => {
    expect(exists("supabase/functions/_shared/oauthTokenCrypto.ts")).toBe(true);
  });
});

describe("Pass 2 — generic webhook hardening", () => {
  const src = read("supabase/functions/integration-webhook/index.ts");
  it("rejects unknown integration ids with 400", () => {
    expect(src).toMatch(/Unknown integration/);
    expect(src).toMatch(/integration_catalog/);
  });
  it("does not normalize failed-signature events into integration_events", () => {
    // After a `verification === 'failed'` check, the function returns 401 BEFORE
    // the integration_events insert.
    expect(src).toMatch(/verification === "failed"[\s\S]*?401/);
  });
});

describe("Pass 2 — retell-webhook uses local CORS, not invalid import", () => {
  const src = read("supabase/functions/retell-webhook/index.ts");
  it("does not import from @supabase/supabase-js/cors", () => {
    expect(src).not.toMatch(/@supabase\/supabase-js@2\/cors/);
  });
  it("declares a local corsHeaders constant", () => {
    expect(src).toMatch(/const corsHeaders = \{/);
  });
});

describe("Pass 2 — token vault migration exists", () => {
  it("a migration creates integration_oauth_token_vault with RLS", () => {
    const dir = "supabase/migrations";
    const files = readdirSync(join(ROOT, dir));
    const hit = files.some((f) => {
      const text = readFileSync(join(ROOT, dir, f), "utf8");
      return /integration_oauth_token_vault/.test(text) && /ENABLE ROW LEVEL SECURITY/i.test(text);
    });
    expect(hit).toBe(true);
  });
});