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

    // Fathom AI exposes summaries + action items as INCLUDES on the single
    // documented endpoint `GET /external/v1/meetings` (include_summary,
    // include_action_items). No separate summary or action-item endpoints
    // exist. Transcripts are intentionally never requested (PHI guardrail).
    // Cursor pagination via `response.next_cursor`. Bounded page cap + small
    // inter-page delay to stay well under vendor rate limits.
    const PAGE_LIMIT = 50;
    const MAX_PAGES = dryRun ? 1 : 20;
    const INTER_PAGE_DELAY_MS = 250;

    let cursor: string | null = null;
    let pages = 0;
    let meetingsSeen = 0;
    let summariesSeen = 0;
    let actionItemsSeen = 0;

    while (pages < MAX_PAGES) {
      const params = new URLSearchParams({
        limit: String(PAGE_LIMIT),
        include_summary: "true",
        include_action_items: "true",
        include_transcript: "false",
      });
      if (cursor) params.set("cursor", cursor);

      const res = await fetchJson<any>(`${FATHOM_BASE_URL}/meetings?${params.toString()}`, {
        headers: authHeaders(),
        timeoutMs: 10_000,
      });
      if (!res.ok) {
        return {
          ok: false,
          status: "failed",
          message: `Fathom /meetings pull failed: ${res.error ?? `HTTP ${res.status}`}`,
        };
      }
      const body: any = res.data ?? {};
      const items: any[] = Array.isArray(body.items)
        ? body.items
        : Array.isArray(body.data)
        ? body.data
        : Array.isArray(body.meetings)
        ? body.meetings
        : [];
      meetingsSeen += items.length;
      for (const m of items) {
        if (m && (m.summary || m.summary_text || m.ai_summary)) summariesSeen += 1;
        const ai = m?.action_items ?? m?.actionItems;
        if (Array.isArray(ai)) actionItemsSeen += ai.length;
      }
      pages += 1;

      const next = typeof body.next_cursor === "string" && body.next_cursor.length > 0
        ? body.next_cursor
        : null;
      if (!next || dryRun) break;
      cursor = next;
      if (INTER_PAGE_DELAY_MS > 0) {
        await new Promise((r) => setTimeout(r, INTER_PAGE_DELAY_MS));
      }
    }

    return {
      ok: true,
      status: "success",
      message: dryRun
        ? `Fathom dry-run: read 1 page of /meetings (include_summary,include_action_items; transcripts omitted).`
        : `Fathom read-only pull scaffold: ${pages} page(s) of /meetings (normalization not yet persisted).`,
      details: {
        endpoint: "/meetings",
        pages,
        pageLimit: PAGE_LIMIT,
        maxPages: MAX_PAGES,
        meetingsSeen,
        summariesSeen,
        actionItemsSeen,
        include_summary: true,
        include_action_items: true,
        include_transcript: false,
        persisted: false,
      },
    };
  },

  normalizeWebhook() {
    return { metadata: { note: "fathom_webhook_disabled_pending_signature_verification" } };
  },
};
