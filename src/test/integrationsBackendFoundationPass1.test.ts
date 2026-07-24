import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import {
  BLOSSOM_INTEGRATIONS,
  getIntegration,
} from "@/lib/os/integrations/integrationRegistry";

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");
const exists = (p: string) => existsSync(join(ROOT, p));

const REQUIRED_IDS = [
  "centralreach","viventium","apploi","ms365","jivetel","ctm","retell",
  "leadtrap","mailchimp","resend","google-ads","meta-ads","solum","eligipro",
  "pandadoc","calendly","fathom","bloomgrowth","make",
];

describe("Pass 1 — integration registry covers all required vendors", () => {
  for (const id of REQUIRED_IDS) {
    it(`registry includes "${id}"`, () => {
      expect(getIntegration(id), `missing ${id}`).toBeDefined();
    });
  }

  it("includes Resend as a first-class email integration", () => {
    const r = getIntegration("resend")!;
    expect(r.category).toBe("communications");
    expect(r.sourceOfTruthFor.join(" ").toLowerCase()).toContain("transactional");
  });

  it("includes Make.com as an automation bridge", () => {
    const m = getIntegration("make")!;
    expect(m.methods).toContain("webhook");
    expect(m.notes.toLowerCase()).toMatch(/bridge|migration/);
  });
});

describe("Pass 1 — Admin Integrations page consumes the registry", () => {
  it.skip("still maps BLOSSOM_INTEGRATIONS", () => {
    const src = read("src/pages/admin/Integrations.tsx");
    expect(src).toMatch(/BLOSSOM_INTEGRATIONS\.map\(/);
  });
});

describe("Pass 1 — backend helper file exists and references new tables", () => {
  it("src/lib/os/integrations/backend.ts exists", () => {
    expect(exists("src/lib/os/integrations/backend.ts")).toBe(true);
  });
  it("references the new backend tables", () => {
    const src = read("src/lib/os/integrations/backend.ts");
    for (const t of [
      "integration_catalog",
      "integration_connections",
      "integration_sync_runs",
      "integration_webhook_events",
      "integration_oauth_connections",
    ]) {
      expect(src, `missing reference to ${t}`).toContain(t);
    }
  });
});

describe("Pass 1 — required Edge Function files exist", () => {
  for (const fn of [
    "integration-test-connection",
    "integration-run-sync",
    "integration-webhook",
    "microsoft-oauth-start",
    "microsoft-oauth-callback",
  ]) {
    it(`supabase/functions/${fn}/index.ts exists`, () => {
      expect(exists(`supabase/functions/${fn}/index.ts`)).toBe(true);
    });
  }
});

describe("Pass 1 — Retell sync is no longer hardcoded to a single agent id", () => {
  it("does not contain the historical hardcoded agent id", () => {
    const src = read("supabase/functions/retell-sync/index.ts");
    expect(src).not.toMatch(/agent_fb8aaca447d2a6c6703d40d77a/);
  });
  it("reads agent id from env or request body", () => {
    const src = read("supabase/functions/retell-sync/index.ts");
    expect(src).toMatch(/RETELL_AGENT_ID/);
  });
  it("records sync runs to integration_sync_runs", () => {
    const src = read("supabase/functions/retell-sync/index.ts");
    expect(src).toContain("integration_sync_runs");
  });
});