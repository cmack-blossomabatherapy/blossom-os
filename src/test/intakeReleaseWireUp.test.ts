/**
 * Blossom OS — Intake release wire-up contract tests.
 *
 * Static source-level assertions that lock in the release gap the user
 * closed: every named Intake surface reads through the canonical
 * review data layer (v_intake_ctm_calls_safe + RPCs), never raw CTM
 * events; the promotion review queue mutates only through the admin
 * idempotent reprocess RPC; and the dashboard renders the canonical
 * IntakeSystemHealthPanel.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const read = (p: string) => readFileSync(p, "utf8");

describe("Intake release wire-up — surface consumption", () => {
  it("CTMCalls reads through the canonical safe view via reviewDataLayer", () => {
    const src = read("src/pages/phone/CTMCalls.tsx");
    expect(src).toContain("useCanonicalCtmCalls");
    expect(src).toContain("@/lib/intake/reviewDataLayer");
    expect(src).not.toMatch(/\.from\(["']ctm_call_events["']\)/);
    // Transcript & recording exposure removed from the non-admin surface —
    // no functional access (audio player, transcript field, DB select).
    expect(src).not.toMatch(/<audio\b/);
    expect(src).not.toMatch(/\br\.recording_url\b/);
    expect(src).not.toMatch(/\br\.transcript\b/);
    expect(src).not.toMatch(/select\([^)]*recording_url/);
    expect(src).not.toMatch(/select\([^)]*transcript/);
  });

  it("CTMAdmin recent-calls panel reads through the canonical safe view", () => {
    const src = read("src/pages/admin/CTMAdmin.tsx");
    expect(src).toContain("useCanonicalCtmCalls");
    expect(src).toContain("useProviderReadiness");
    // Recent-calls list no longer selects raw ctm_call_events directly.
    expect(src).not.toMatch(/from\(["']ctm_call_events["']\)\s*\.select/);
  });

  it("Promotion Review Queues consume reviewDataLayer and retry only via admin RPC", () => {
    const src = read("src/pages/os/intake/IntakePromotionReviewQueues.tsx");
    expect(src).toContain("useCanonicalPromotions");
    expect(src).toContain("reprocessNormalizedRecord");
    // Retry MUST route through the authorized idempotent admin RPC, not
    // the raw promote_normalized_record call.
    expect(src).not.toMatch(/supabase\.rpc\(\s*["']promote_normalized_record["']/);
    // Preview-only guard still in place.
    expect(src).toContain("INGEST_ONLY");
  });

  it("IntakeDashboard mounts the canonical IntakeSystemHealthPanel", () => {
    const src = read("src/pages/os/intake/IntakeDashboard.tsx");
    expect(src).toContain("IntakeSystemHealthPanel");
  });

  it("IntakeSystemHealthPanel reads only canonical RPC hooks", () => {
    const src = read("src/components/intake/IntakeSystemHealthPanel.tsx");
    expect(src).toContain("useIntakeReviewStats");
    expect(src).toContain("useProviderReadiness");
    expect(src).toContain("classifyProviderReadiness");
    expect(src).toContain("DISABLED_PROVIDER_KEYS");
    // No direct table reads — everything routes through the review data layer.
    expect(src).not.toMatch(/from\(["'](intake_|ctm_)/);
  });
});

describe("Intake release wire-up — routing & aliases", () => {
  const app = read("src/App.tsx");

  it("has canonical /intake/dashboard, /intake/lead-to-active, /intake/review-queues routes", () => {
    expect(app).toMatch(/path="\/intake\/dashboard"/);
    expect(app).toMatch(/path="\/intake\/lead-to-active"/);
    expect(app).toMatch(/path="\/intake\/review-queues"/);
  });

  it("redirects legacy /intake/leads and /intake/referral-queue aliases", () => {
    expect(app).toMatch(/path="\/intake\/leads"[^\n]*Navigate to="\/leads"/);
    expect(app).toMatch(/path="\/intake\/referral-queue"[^\n]*Navigate to="\/intake\/dashboard"/);
  });

  it("mounts CTM surfaces behind Phone/Admin route guards", () => {
    expect(app).toMatch(/path="\/phone\/calls"[^\n]*PhoneSystemRoute[^\n]*CTMCalls/);
    expect(app).toMatch(/path="\/admin\/ctm"[^\n]*AdminRoute[^\n]*CTMAdmin/);
  });
});