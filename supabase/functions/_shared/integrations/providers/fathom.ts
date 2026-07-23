import type { ProviderAdapter } from "../types.ts";
import { getEnv, hasAll } from "../secrets.ts";
import { fetchJson } from "../http.ts";

/**
 * Fathom AI — meeting intelligence (meetings, summaries, action items).
 * INGEST_ONLY, read-only. Not to be confused with usefathom.com web
 * analytics, which is a different vendor.
 *
 * Docs:  https://developers.fathom.ai/
 * Base:  https://api.fathom.ai/external/v1
 * Auth:  header `X-Api-Key: <FATHOM_API_KEY>`
 *
 * Guardrails:
 *  - Never request transcripts by default (PHI risk). Only meeting
 *    metadata, summaries, and action items are pulled.
 *  - No outbound writes; no webhook subscription creation.
 *  - Webhook capability is FALSE — the shared inbound handler in
 *    `integration-webhook/index.ts` does not yet verify Fathom's
 *    documented signature scheme, so we do not claim webhook support.
 */

const FATHOM_BASE_URL = "https://api.fathom.ai/external/v1";

function authHeaders(): Record<string, string> {
  return {
    "X-Api-Key": getEnv("FATHOM_API_KEY") ?? "",
    Accept: "application/json",
  };
}

export const fathomAdapter: ProviderAdapter = {
  id: "fathom",
  classification: "meeting_intelligence",
  requiredSecrets: ["FATHOM_API_KEY"],
  optionalSecrets: [],
  capabilities: {
    probe: true,
    pullSync: true,
    // Webhook stays false until the shared handler can verify Fathom's
    // signature. Flipping this true without verification would violate
    // the INGEST_ONLY / signed-webhook contract.
    webhook: false,
    outboundDisabled: true,
    documentationUrl: "https://developers.fathom.ai/",
    operationalState: "ingest_only",
  },

  async probe() {
    const need = hasAll(this.requiredSecrets);
    if (!need.ok) {
      return { ok: false, status: "needs_credentials", message: `Missing: ${need.missing.join(", ")}` };
    }
    // Minimal read: list a single meeting to prove auth + tenant access.
    const res = await fetchJson<any>(`${FATHOM_BASE_URL}/meetings?limit=1`, {
      headers: authHeaders(),
      timeoutMs: 8_000,
    });
    if (!res.ok) {
      return { ok: false, status: "error", message: res.error ?? `HTTP ${res.status}` };
    }
    const items = (res.data as any)?.items ?? (res.data as any)?.data ?? [];
    return {
      ok: true,
      status: "connected",
      message: `Fathom /external/v1/meetings ok (returned ${Array.isArray(items) ? items.length : 0} sample record).`,
      details: {
        transcriptsRequested: false,
        base: FATHOM_BASE_URL,
      },
    };
  },

  async sync(_ctx, options) {
    const need = hasAll(this.requiredSecrets);
    if (!need.ok) {
      return { ok: false, status: "failed", message: `Missing: ${need.missing.join(", ")}` };
    }
    const dryRun = options.dryRun === true;
    // Read-only paginated scaffold: meetings + summaries + action items.
    // We deliberately do NOT hit /transcripts to avoid pulling PHI unless
    // an explicit override is ever added by the operator.
    const surfaces = ["/meetings", "/summaries", "/action-items"] as const;
    const sampled: Record<string, number> = {};
    let totalPagesProbed = 0;
    for (const path of surfaces) {
      const res = await fetchJson<any>(`${FATHOM_BASE_URL}${path}?limit=25`, {
        headers: authHeaders(),
        timeoutMs: 10_000,
      });
      if (!res.ok) {
        return {
          ok: false,
          status: "failed",
          message: `Fathom pull failed at ${path}: ${res.error ?? `HTTP ${res.status}`}`,
        };
      }
      const items = (res.data as any)?.items ?? (res.data as any)?.data ?? [];
      sampled[path] = Array.isArray(items) ? items.length : 0;
      totalPagesProbed += 1;
      // Dry-run: only probe first page per surface; do not paginate.
      if (dryRun) continue;
      // Non-dry-run: still read-only. Real writes to `integration_normalized_records`
      // will land once the meeting-normalizer contract is finalized.
    }
    return {
      ok: true,
      status: dryRun ? "success" : "partial",
      message: dryRun
        ? `Fathom dry-run: probed ${totalPagesProbed} surface(s) read-only; transcripts skipped by design.`
        : `Fathom read-only pull scaffold complete (transcripts intentionally skipped).`,
      details: { sampled, transcriptsRequested: false },
    };
  },

  normalizeWebhook() {
    return { metadata: { note: "fathom_webhook_disabled_pending_signature_verification" } };
  },
};
