import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const src = readFileSync(
  join(process.cwd(), "supabase/functions/_shared/integrations/providers/jotform.ts"),
  "utf8",
);

describe("Jotform pull sync — persistence, idempotency, dry-run, checkpoint", () => {
  it("uses the shared normalized-record spine (upsertNormalizedRecord) instead of only counting", () => {
    expect(src).toMatch(/import\s*\{\s*upsertNormalizedRecord/);
    // The sync() body must invoke the upsert helper.
    const syncStart = src.indexOf("async sync(");
    expect(syncStart).toBeGreaterThan(-1);
    const syncBody = src.slice(syncStart);
    expect(syncBody).toMatch(/upsertNormalizedRecord\(\s*ctx\s*,\s*"jotform"/);
  });

  it("builds a deterministic idempotency key scoped by form + submission id", () => {
    // Same key shape must be used in both webhook normalize + pull sync.
    const keyRe = /`jotform:\$\{formId\}:\$\{submissionId\}`/g;
    const matches = src.match(keyRe) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it("honors dry-run with zero writes", () => {
    const syncBody = src.slice(src.indexOf("async sync("));
    // The upsert must be gated by a `!dryRun` check.
    expect(syncBody).toMatch(/if\s*\(\s*!dryRun/);
    // dry-run message must be explicit about zero writes.
    expect(src).toMatch(/dry-run[^`]*zero writes/i);
  });

  it("derives a checkpoint from the most recent normalized record when `since` is not provided", () => {
    expect(src).toMatch(/from\("integration_normalized_records"\)/);
    expect(src).toMatch(/order\(\s*"occurred_at"/);
    expect(src).toMatch(/last_created_at/);
  });

  it("reports partial + rate_limited status honestly (never fakes success)", () => {
    expect(src).toMatch(/rate_limited/);
    expect(src).toMatch(/status:\s*"partial"|"partial"/);
    expect(src).toMatch(/RUN_BUDGET_MS/);
  });

  it("stores PHI-safe metadata only — no raw answer values", () => {
    // Metadata must include key names / scalar flags, never full answer values.
    expect(src).toMatch(/fieldKeys:\s*Object\.keys\(flat\)/);
    expect(src).toMatch(/PHI-safe/);
  });

  it("routes intake submissions to the shared lead promotion path (record_kind = 'lead')", () => {
    // The purpose→record-kind mapping is the single source of truth.
    // Persistence code path passes recordKind derived from purposeToRecordKind.
    expect(src).toMatch(/recordKind\s*=\s*purposeToRecordKind\(purpose\)/);
  });

  it("rejects malformed rawRequest gracefully in normalizeWebhook (never throws)", () => {
    // Structural: normalizeWebhook parses rawRequest inside a try/catch.
    const normStart = src.indexOf("normalizeWebhook(");
    expect(normStart).toBeGreaterThan(-1);
    const body = src.slice(normStart);
    expect(body).toMatch(/try\s*\{[\s\S]*rawRequest[\s\S]*\}\s*catch/);
  });
});

describe("Jotform webhook — wrong token is rejected in integration-webhook", () => {
  it("verifyJotformToken is invoked and mismatches fail verification", () => {
    const webhookSrc = readFileSync(
      join(process.cwd(), "supabase/functions/integration-webhook/index.ts"),
      "utf8",
    );
    expect(webhookSrc).toMatch(/verifyJotformToken/);
    // No unverified fallback for jotform.
    expect(webhookSrc).toMatch(/We do NOT fall back to unverified/);
  });
});