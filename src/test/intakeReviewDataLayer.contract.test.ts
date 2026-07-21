/**
 * Contract tests for src/lib/intake/reviewDataLayer.ts.
 *
 * These lock in the Blossom OS Intake canonical data-layer guarantees so
 * the shipping surfaces cannot silently regress:
 *   1) One typed adapter is the single reader for every named Intake surface.
 *   2) CTM traffic is read through v_intake_ctm_calls_safe (PII-masked view),
 *      never raw ctm_call_events.
 *   3) Handoff-only / disabled providers are known and cannot be treated as
 *      inbound promotion sources.
 *   4) Promotion eligibility is provider-neutral and gates on record kind.
 *   5) Provider readiness classification is derived from live status +
 *      freshness, never from catalog display metadata.
 */
import { describe, it, expect } from "vitest";
import {
  classifyProviderReadiness,
  DISABLED_PROVIDER_KEYS,
  isPromotionEligible,
  PROMOTION_ELIGIBLE_RECORD_KINDS,
  intakeReviewKeys,
} from "@/lib/intake/reviewDataLayer";

describe("Intake canonical review data layer — contract", () => {
  it("exposes a stable query-key namespace for every review surface", () => {
    expect(intakeReviewKeys.stats).toEqual(["intake", "review", "stats"]);
    expect(intakeReviewKeys.leads({})[0]).toBe("intake");
    expect(intakeReviewKeys.ctmCalls({})[1]).toBe("review");
    expect(intakeReviewKeys.promotions({})[2]).toBe("promotions");
    expect(intakeReviewKeys.providerReadiness).toContain("provider-readiness");
  });

  it("marks handoff-only integrations as disabled inbound promotion sources", () => {
    for (const key of ["centralreach", "solum", "eligipro", "calendar", "outlook_calendar"]) {
      expect(DISABLED_PROVIDER_KEYS.has(key)).toBe(true);
    }
    // CTM is the primary inbound provider — must NOT be in the disabled set.
    expect(DISABLED_PROVIDER_KEYS.has("ctm")).toBe(false);
  });

  it("only promotes lead-shaped normalized records", () => {
    for (const kind of ["lead", "inquiry", "call", "form_submission", "referral", "webform"]) {
      expect(isPromotionEligible(kind)).toBe(true);
    }
    for (const kind of ["appointment", "note", "unknown", "session", null, undefined, ""]) {
      expect(isPromotionEligible(kind as string | null | undefined)).toBe(false);
    }
    expect(PROMOTION_ELIGIBLE_RECORD_KINDS.size).toBeGreaterThan(0);
  });

  it("classifies provider readiness from live signal, not display metadata", () => {
    const disabled = classifyProviderReadiness({
      integration_id: "x", display_name: "X", category: "phone", environment: "prod",
      status: "ok", enabled: false, last_success_at: new Date().toISOString(),
      last_error_at: null, last_error: null, freshness_seconds: 10,
    });
    expect(disabled.label).toBe("disabled");

    const unconfigured = classifyProviderReadiness({
      integration_id: "x", display_name: "X", category: "phone", environment: "prod",
      status: null, enabled: true, last_success_at: null,
      last_error_at: null, last_error: null, freshness_seconds: null,
    });
    expect(unconfigured.label).toBe("unconfigured");

    const stale = classifyProviderReadiness({
      integration_id: "x", display_name: "X", category: "phone", environment: "prod",
      status: "ok", enabled: true, last_success_at: "2020-01-01T00:00:00Z",
      last_error_at: null, last_error: null, freshness_seconds: 48 * 3600,
    });
    expect(stale.label).toBe("stale");

    const error = classifyProviderReadiness({
      integration_id: "x", display_name: "X", category: "phone", environment: "prod",
      status: "error", enabled: true, last_success_at: new Date().toISOString(),
      last_error_at: new Date().toISOString(), last_error: "boom", freshness_seconds: 60,
    });
    expect(error.label).toBe("error");

    const live = classifyProviderReadiness({
      integration_id: "x", display_name: "X", category: "phone", environment: "prod",
      status: "ok", enabled: true, last_success_at: new Date().toISOString(),
      last_error_at: null, last_error: null, freshness_seconds: 30,
    });
    expect(live.label).toBe("connected");
  });
});

describe("Intake canonical review data layer — source-of-truth invariants", () => {
  const src = () => import("fs").then((fs) =>
    fs.readFileSync("src/lib/intake/reviewDataLayer.ts", "utf8"),
  );

  it("reads CTM traffic through the safe view, not raw ctm_call_events", async () => {
    const text = await src();
    expect(text).toContain('.from("v_intake_ctm_calls_safe")');
    expect(text).not.toMatch(/\.from\("ctm_call_events"\)/);
  });

  it("routes stats/readiness/reprocess through RPCs (never client-side aggregation)", async () => {
    const text = await src();
    expect(text).toContain('supabase.rpc("intake_review_stats")');
    expect(text).toContain('supabase.rpc("intake_provider_readiness")');
    expect(text).toContain('supabase.rpc(\n    "intake_admin_reprocess_normalized_record"');
  });

  it("has no mock/seed/local fallback strings in the review data layer", async () => {
    const text = await src();
    expect(text).not.toMatch(/mock|seed|localStorage|Math\.random/i);
  });
});