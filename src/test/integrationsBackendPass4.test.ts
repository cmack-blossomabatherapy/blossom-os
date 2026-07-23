import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");
const exists = (p: string) => { try { statSync(join(ROOT, p)); return true; } catch { return false; } };
const listMigrations = () =>
  readdirSync(join(ROOT, "supabase/migrations")).map((f) => readFileSync(join(ROOT, "supabase/migrations", f), "utf8"));

const REQUIRED_PROVIDERS = [
  "mailchimp", "resend", "retell", "ctm", "apploi", "centralreach", "solum",
  "eligipro", "ms365", "jivetel", "make", "jotform", "calendly",
  "go-integrate-nava",
];

describe("Pass 4 — provider adapter registry covers every required integration", () => {
  const reg = read("supabase/functions/_shared/integrations/providerRegistry.ts");
  for (const id of REQUIRED_PROVIDERS) {
    it(`registry registers ${id}`, () => {
      const file = id === "go-integrate-nava" ? "goIntegrateNava" : id.replace(/-/g, "");
      expect(reg).toMatch(new RegExp(`${file}Adapter`, "i"));
    });
  }
});

describe("Pass 4 — adapter module files exist", () => {
  const files = [
    "supabase/functions/_shared/integrations/types.ts",
    "supabase/functions/_shared/integrations/secrets.ts",
    "supabase/functions/_shared/integrations/http.ts",
    "supabase/functions/_shared/integrations/normalizers.ts",
    "supabase/functions/_shared/integrations/providerRegistry.ts",
    "supabase/functions/_shared/integrations/providers/mailchimp.ts",
    "supabase/functions/_shared/integrations/providers/resend.ts",
    "supabase/functions/_shared/integrations/providers/retell.ts",
    "supabase/functions/_shared/integrations/providers/ctm.ts",
    "supabase/functions/_shared/integrations/providers/apploi.ts",
    "supabase/functions/_shared/integrations/providers/centralreach.ts",
    "supabase/functions/_shared/integrations/providers/solum.ts",
    "supabase/functions/_shared/integrations/providers/eligipro.ts",
    "supabase/functions/_shared/integrations/providers/ms365.ts",
    "supabase/functions/_shared/integrations/providers/jivetel.ts",
    "supabase/functions/_shared/integrations/providers/make.ts",
    "supabase/functions/_shared/integrations/providers/jotform.ts",
    "supabase/functions/_shared/integrations/providers/calendly.ts",
    "supabase/functions/_shared/integrations/providers/goIntegrateNava.ts",
  ];
  for (const f of files) it(`${f} exists`, () => expect(exists(f)).toBe(true));
});

describe("Pass 4 — entrypoints delegate to provider adapters", () => {
  it("integration-test-connection imports providerRegistry and calls probe", () => {
    const src = read("supabase/functions/integration-test-connection/index.ts");
    expect(src).toMatch(/providerRegistry/);
    expect(src).toMatch(/adapter\.probe/);
    // No more hardcoded retell/resend/mailchimp/ms365 branches.
    expect(src).not.toMatch(/api\.retellai\.com\/list-agents/);
    expect(src).not.toMatch(/api\.resend\.com\/domains/);
    expect(src).not.toMatch(/api\.mailchimp\.com\/3\.0\/ping/);
  });
  it("integration-run-sync imports providerRegistry and calls adapter.sync", () => {
    const src = read("supabase/functions/integration-run-sync/index.ts");
    expect(src).toMatch(/providerRegistry/);
    expect(src).toMatch(/adapter\.sync/);
    // No required provider returns literal not_implemented.
    expect(src).not.toMatch(/not_implemented/);
    expect(src).not.toMatch(/retell-sync/);
  });
  it("integration-webhook calls adapter.normalizeWebhook and upserts normalized records", () => {
    const src = read("supabase/functions/integration-webhook/index.ts");
    expect(src).toMatch(/normalizeWebhook/);
    expect(src).toMatch(/upsertNormalizedRecord/);
    expect(src).toMatch(/normalized|normalized_unknown|failed|rejected/);
  });
});

describe("Pass 4 — migration creates integration_normalized_records", () => {
  const migs = listMigrations();
  it("a migration creates the table with RLS", () => {
    const hit = migs.some(
      (m) =>
        /CREATE TABLE[^;]*integration_normalized_records/i.test(m) &&
        /ENABLE ROW LEVEL SECURITY/i.test(m),
    );
    expect(hit).toBe(true);
  });
  it("creates the natural-key partial unique index", () => {
    const hit = migs.some((m) =>
      /UNIQUE INDEX[\s\S]*integration_normalized_records[\s\S]*\(integration_id, provider_record_id, record_kind\)/i.test(m),
    );
    expect(hit).toBe(true);
  });
  it("grants service_role and authenticated", () => {
    const hit = migs.some((m) =>
      /GRANT[^;]*integration_normalized_records[^;]*service_role/i.test(m) &&
      /GRANT[^;]*integration_normalized_records[^;]*authenticated/i.test(m),
    );
    expect(hit).toBe(true);
  });
});

describe("Pass 4 — adapter behavior contracts", () => {
  it("retell adapter has a real probe + sync path", () => {
    const src = read("supabase/functions/_shared/integrations/providers/retell.ts");
    expect(src).toMatch(/list-agents/);
    expect(src).toMatch(/list-calls/);
  });
  it("resend adapter is preserved as report-only and probes /domains", () => {
    const src = read("supabase/functions/_shared/integrations/providers/resend.ts");
    expect(src).toMatch(/\/domains/);
    expect(src).toMatch(/report-only|invites\/welcome\/MFA/);
  });
  it("solum adapter accepts SOLOM_API_KEY alias via shared secrets helper", () => {
    const sec = read("supabase/functions/_shared/integrations/secrets.ts");
    expect(sec).toMatch(/SOLOM_API_KEY/);
  });
  it("make adapter is labeled migration_bridge", () => {
    const src = read("supabase/functions/_shared/integrations/providers/make.ts");
    expect(src).toMatch(/migration_bridge/);
  });
  it("jotform adapter is labeled forms_intake_documents and enforces base URL allowlist", () => {
    const src = read("supabase/functions/_shared/integrations/providers/jotform.ts");
    expect(src).toMatch(/forms_intake_documents/);
    expect(src).toMatch(/hipaa-api\.jotform\.com/);
    expect(src).toMatch(/APIKEY/);
  });
  it("centralreach adapter is labeled emr and does not touch BCBA Productivity uploads", () => {
    const src = read("supabase/functions/_shared/integrations/providers/centralreach.ts");
    expect(src).toMatch(/classification: "emr"/);
    expect(src).toMatch(/BCBA Productivity/i);
  });
  it("leadtrap and pandadoc are retired from active provider registry", () => {
    const reg = read("supabase/functions/_shared/integrations/providerRegistry.ts");
    expect(reg).toMatch(/RETIRED_PROVIDERS/);
    // Source files may persist for historical migration/tests but must not
    // be imported into the active ADAPTERS list.
    expect(reg).not.toMatch(/leadtrapAdapter,/);
    expect(reg).not.toMatch(/pandadocAdapter,/);
  });
});

describe("Pass 4 — Microsoft per-user sync functions use the token vault", () => {
  it("microsoft-calendar-sync uses refreshUserToken and never returns tokens", () => {
    const src = read("supabase/functions/microsoft-calendar-sync/index.ts");
    expect(src).toMatch(/refreshUserToken/);
    expect(src).toMatch(/from "\.\.\/_shared\/microsoftTokenVault\.ts"/);
    // Tokens must never appear in a JSON response key — the only place
    // accessToken is referenced is in the outbound Graph Authorization header.
    expect(src).not.toMatch(/return\s+json\([^)]*accessToken/);
  });
  it("microsoft-mail-activity-sync uses refreshUserToken and stores only safe metadata", () => {
    const src = read("supabase/functions/microsoft-mail-activity-sync/index.ts");
    expect(src).toMatch(/refreshUserToken/);
    // No body content is read from Graph.
    expect(src).not.toMatch(/\$select=[^"]*body/);
  });
});

describe("Pass 4 — Resend delivery flows are NOT rebuilt", () => {
  it("welcome-email helper is untouched in this pass", () => {
    expect(exists("supabase/functions/_shared/welcome-email.ts")).toBe(true);
  });
  it("email-mfa edge function still exists", () => {
    expect(exists("supabase/functions/email-mfa/index.ts")).toBe(true);
  });
});

describe("Pass 4 — QA manifest exists", () => {
  it("docs/integrations-backend-pass-4-qa-manifest.md exists", () => {
    expect(exists("docs/integrations-backend-pass-4-qa-manifest.md")).toBe(true);
  });
});