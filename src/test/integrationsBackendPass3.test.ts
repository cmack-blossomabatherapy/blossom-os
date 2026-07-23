import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { BLOSSOM_INTEGRATIONS } from "@/lib/os/integrations/integrationRegistry";

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

function listMigrations(): string[] {
  const dir = join(ROOT, "supabase/migrations");
  return readdirSync(dir).map((f) => readFileSync(join(dir, f), "utf8"));
}

describe("Pass 3 — Go Integrate Nava is a first-class integration", () => {
  it("registry includes go-integrate-nava", () => {
    expect(BLOSSOM_INTEGRATIONS.some((i) => i.id === "go-integrate-nava")).toBe(true);
  });
  it("integration_catalog seed includes go-integrate-nava", () => {
    expect(listMigrations().some((m) => /'go-integrate-nava'/.test(m) && /integration_catalog/.test(m))).toBe(true);
  });
  it("integration_connections seed includes go-integrate-nava", () => {
    expect(
      listMigrations().some(
        (m) => /'go-integrate-nava'/.test(m) && /integration_connections/.test(m),
      ),
    ).toBe(true);
  });
  it("integration-test-connection requires GO_INTEGRATE_NAVA_API_KEY", () => {
    const src = read("supabase/functions/integration-test-connection/index.ts");
    expect(src).toMatch(/GO_INTEGRATE_NAVA_API_KEY/);
    expect(src).toMatch(/GO_INTEGRATE_NAVA_WEBHOOK_SECRET/);
  });
});

describe("Pass 3 — required secrets map covers every tracked integration", () => {
  const src = read("supabase/functions/integration-test-connection/index.ts");
  const required = [
    "mailchimp", "resend", "retell", "ctm", "apploi", "centralreach",
    "solum", "eligipro", "ms365", "jivetel", "make", "jotform",
    "calendly", "viventium", "google-ads", "meta-ads",
    "fathom", "bloomgrowth", "go-integrate-nava",
  ];
  for (const id of required) {
    it(`maps required secrets for ${id}`, () => {
      // The key in REQUIRED_SECRETS is either a bare identifier (e.g. `mailchimp:`)
      // or a quoted string (e.g. `"go-integrate-nava":`).
      const escaped = id.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
      const re = new RegExp(`(?:^|\\n)\\s*(?:["']${escaped}["']|${escaped})\\s*:`);
      expect(src).toMatch(re);
    });
  }
});

describe("Pass 3 — solom alias still accepted", () => {
  it("integration-test-connection still accepts SOLOM_API_KEY alias", () => {
    const src = read("supabase/functions/integration-test-connection/index.ts");
    expect(src).toMatch(/SOLOM_API_KEY/);
  });
});

describe("__pad__", () => {
  it("keeps the closing of the previous describe block balanced", () => {
    expect(true).toBe(true);
  });
});

describe("Pass 3 — Microsoft OAuth state hardening", () => {
  const start = read("supabase/functions/microsoft-oauth-start/index.ts");
  const cb = read("supabase/functions/microsoft-oauth-callback/index.ts");

  it("oauth-start does not build state from base64(JSON({u: userId}))", () => {
    expect(start).not.toMatch(/btoa\(JSON\.stringify\(\{\s*u:\s*user\.id/);
  });
  it("oauth-start persists a hashed state in integration_oauth_states", () => {
    expect(start).toMatch(/integration_oauth_states/);
    expect(start).toMatch(/state_hash/);
    expect(start).toMatch(/generateOauthStateNonce/);
  });
  it("oauth-callback validates state against integration_oauth_states", () => {
    expect(cb).toMatch(/integration_oauth_states/);
    expect(cb).toMatch(/state_hash/);
    expect(cb).toMatch(/used_at/);
  });
  it("oauth-callback does NOT decode user id from base64 state", () => {
    expect(cb).not.toMatch(/JSON\.parse\(atob\(stateParam\)\)/);
  });
  it("a migration creates integration_oauth_states with RLS", () => {
    const hit = listMigrations().some(
      (m) => /CREATE TABLE[^;]*integration_oauth_states/i.test(m) && /ENABLE ROW LEVEL SECURITY/i.test(m),
    );
    expect(hit).toBe(true);
  });
});

describe("Pass 3 — Graph /me gates `connected` status", () => {
  const cb = read("supabase/functions/microsoft-oauth-callback/index.ts");
  it("callback returns early/needs_attention when Graph /me fails", () => {
    expect(cb).toMatch(/graph_me_failed/);
  });
  it("callback only flips status to connected at the end (after vault write)", () => {
    // The explicit `connected` flip must come AFTER the vault upsert.
    const vaultIdx = cb.indexOf("integration_oauth_token_vault");
    const connectedIdx = cb.lastIndexOf('status: "connected"');
    expect(vaultIdx).toBeGreaterThan(-1);
    expect(connectedIdx).toBeGreaterThan(vaultIdx);
  });
});

describe("Pass 3 — shared Microsoft token vault helper", () => {
  it("_shared/microsoftTokenVault.ts exists and exports refreshUserToken", () => {
    const s = read("supabase/functions/_shared/microsoftTokenVault.ts");
    expect(s).toMatch(/export async function refreshUserToken/);
    expect(s).toMatch(/export function generateOauthStateNonce/);
    expect(s).toMatch(/export async function hashOauthState/);
  });
  it("microsoft-graph-probe imports from _shared, not from another function entrypoint", () => {
    const s = read("supabase/functions/microsoft-graph-probe/index.ts");
    expect(s).toMatch(/from "\.\.\/_shared\/microsoftTokenVault\.ts"/);
    expect(s).not.toMatch(/from "\.\.\/microsoft-refresh-token\/index\.ts"/);
  });
  it("microsoft-refresh-token imports from _shared, not duplicates logic", () => {
    const s = read("supabase/functions/microsoft-refresh-token/index.ts");
    expect(s).toMatch(/from "\.\.\/_shared\/microsoftTokenVault\.ts"/);
  });
});

describe("Pass 3 — no Edge Function index.ts imports another Edge Function index.ts", () => {
  it("scans every functions/*/index.ts", () => {
    const fnRoot = join(ROOT, "supabase/functions");
    const entries = readdirSync(fnRoot, { withFileTypes: true });
    for (const e of entries) {
      if (!e.isDirectory() || e.name.startsWith("_")) continue;
      const idx = join(fnRoot, e.name, "index.ts");
      let src = "";
      try {
        src = readFileSync(idx, "utf8");
      } catch {
        continue;
      }
      // Forbid imports like `from "../<other-function>/index.ts"`.
      const bad = /from\s+["']\.\.\/[^_/][^/"']*\/index\.ts["']/g;
      expect(src.match(bad)).toBeNull();
    }
  });
});

describe("Pass 3 — integration_connections natural key + idempotent seed", () => {
  const migs = listMigrations();
  it("a migration creates a unique index on (integration_id, connection_type, environment)", () => {
    const hit = migs.some((m) =>
      /UNIQUE INDEX[\s\S]*integration_connections[\s\S]*\(integration_id, connection_type, environment\)/i.test(m),
    );
    expect(hit).toBe(true);
  });
  it("a migration uses ON CONFLICT (integration_id, connection_type, environment) for the seed", () => {
    const hit = migs.some((m) =>
      /ON CONFLICT \(integration_id, connection_type, environment\)/i.test(m),
    );
    expect(hit).toBe(true);
  });
});