import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("Apploi live integration — adapter contract", () => {
  const adapter = read("supabase/functions/_shared/integrations/providers/apploi.ts");

  it("uses only the verified Apploi Partner endpoints", () => {
    expect(adapter).toMatch(/https:\/\/partners\.apploi\.com/);
    // Job postings retired — applicants-only ingest.
    expect(adapter).not.toMatch(/"\/jobs\/search"/);
    expect(adapter).toMatch(/"\/applicants"/);
    expect(adapter).toMatch(/"\/applicants\/applicant-statuses"/);
    // No invented endpoints / no write-back.
    expect(adapter).not.toMatch(/method:\s*"POST"/);
  });

  it("authenticates with the team-scoped x-api-key header from a server secret", () => {
    expect(adapter).toMatch(/"x-api-key": key/);
    expect(adapter).toMatch(/getEnv\("APPLOI_API_KEY"\)/);
    expect(adapter).toMatch(/requiredSecrets: \["APPLOI_API_KEY", "APPLOI_TEAM_ID"\]/);
  });

  it("paginates, retries with backoff, and times out", () => {
    expect(adapter).toMatch(/offset: page \* PAGE_SIZE/);
    expect(adapter).toMatch(/attempt < 4/);
    expect(adapter).toMatch(/res\.status === 429/);
    expect(adapter).toMatch(/TIMEOUT_MS/);
  });

  it("redacts the API key from any operator-visible message", () => {
    expect(adapter).toMatch(/function sanitize/);
    expect(adapter).toMatch(/out\.split\(key\)\.join\("\*\*\*"\)/);
  });

  it("reports honestly when applicants are not exposed instead of faking success", () => {
    expect(adapter).toMatch(/applicants_exposed/);
    expect(adapter).toMatch(/status: applicants\.received === 0 \? "partial" : "success"/);
  });
});

describe("Apploi live integration — no secrets in frontend", () => {
  it("no src/ file embeds an Apploi credential or calls the provider directly", () => {
    const walk = (dir: string, acc: string[] = []) => {
      for (const entry of fs.readdirSync(dir)) {
        const p = path.join(dir, entry);
        if (fs.statSync(p).isDirectory()) walk(p, acc);
        else if (/\.(ts|tsx)$/.test(entry)) acc.push(p);
      }
      return acc;
    };
    for (const f of walk(path.join(process.cwd(), "src"))) {
      if (f.endsWith("apploiLiveIntegration.test.ts")) continue;
      if (f.endsWith("recruitingProductionCompletion.test.ts")) continue;
      const src = fs.readFileSync(f, "utf8");
      // No direct browser calls to the provider.
      expect(src, f).not.toMatch(/fetch\([^)]*partners\.apploi\.com/);
      // No literal credential value committed anywhere in the frontend.
      expect(src, f).not.toMatch(/x-api-key/i);
    }
  });
});

describe("Apploi live integration — recruiting surfaces", () => {
  it("hook exposes health + server-side manual sync only", () => {
    const src = read("src/hooks/useApploiIntegration.ts");
    expect(src).toMatch(/apploi_sync_health/);
    expect(src).toMatch(/export async function syncApploiNow/);
    // Manual sync now runs through the authorization-hardened cron function.
    expect(src).toMatch(/functions\.invoke\("apploi-sync-cron"/);
    // Import maps candidates to a canonical job family.
    expect(src).toMatch(/classifyJobFamily/);
  });

  it("pipeline page renders the honest sync health bar", () => {
    const src = read("src/pages/os/OSRecruitingPipeline.tsx");
    expect(src).toMatch(/ApploiSyncHealthBar/);
    const bar = read("src/components/recruiting/ApploiSyncHealthBar.tsx");
    expect(bar).toMatch(/Applicant records are not yet shared/);
    expect(bar).toMatch(/Sync now/);
  });

  it("normalized-record upsert avoids the unusable partial-index ON CONFLICT", () => {
    const src = read("supabase/functions/_shared/integrations/normalizers.ts");
    expect(src).not.toMatch(/onConflict: "integration_id,provider_record_id,record_kind"/);
    expect(src).toMatch(/action\?: "insert" \| "update"/);
  });

  it("scheduled sync is throttled and connection-gated", () => {
    const src = read("supabase/functions/apploi-sync-cron/index.ts");
    expect(src).toMatch(/MIN_INTERVAL_MINUTES/);
    expect(src).toMatch(/reason: "throttled"/);
    expect(src).toMatch(/reason: "not_connected"/);
  });
});
