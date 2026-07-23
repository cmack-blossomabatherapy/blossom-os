import type { ProviderAdapter } from "../types.ts";
import { getEnv, hasAll } from "../secrets.ts";
import { fetchJson } from "../http.ts";
import { upsertNormalizedRecord } from "../normalizers.ts";

/**
 * Calendly — scheduling. Read-only. INGEST_ONLY.
 *
 * Auth: OAuth2 (personal access token accepted for tenant-owned installs).
 * Pull sync uses cursor pagination via `next_page_token` on
 * `/scheduled_events`.
 * Webhook signatures are HMAC-SHA256; header
 * `Calendly-Webhook-Signature: t=<ts>,v1=<hex>` verified with
 * `CALENDLY_WEBHOOK_SIGNING_KEY`.
 *
 * Docs:
 *   - https://developer.calendly.com/api-docs/
 *   - https://developer.calendly.com/api-docs/ZG9jOjE2OTc5NDQ2-webhook-signatures
 */

/**
 * Verify a Calendly webhook signature. Returns true only when the
 * signing key produces the expected v1 hex digest over
 * `<timestamp>.<rawBody>`. Uses timing-safe comparison.
 */
export async function verifyCalendlyWebhook(
  rawBody: string,
  signatureHeader: string | null,
  signingKey: string,
  toleranceSec = 300,
): Promise<boolean> {
  if (!signatureHeader || !signingKey) return false;
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((s) => {
      const [k, v] = s.split("=");
      return [k?.trim(), v?.trim()];
    }),
  ) as Record<string, string>;
  const ts = parts.t;
  const sig = parts.v1;
  if (!ts || !sig) return false;
  const skew = Math.abs(Date.now() / 1000 - Number(ts));
  if (!Number.isFinite(skew) || skew > toleranceSec) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(signingKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const buf = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${ts}.${rawBody}`),
  );
  const hex = Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  if (hex.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}

export const calendlyAdapter: ProviderAdapter = {
  id: "calendly",
  classification: "scheduling",
  requiredSecrets: ["CALENDLY_CLIENT_ID", "CALENDLY_CLIENT_SECRET", "CALENDLY_WEBHOOK_SIGNING_KEY"],
  optionalSecrets: [
    "CALENDLY_ACCESS_TOKEN",
    "CALENDLY_API_BASE_URL",
    "CALENDLY_PROBE_PATH",
    "CALENDLY_ORGANIZATION_URI",
  ],
  capabilities: {
    probe: true,
    pullSync: true,
    webhook: true,
    oauth: true,
    outboundDisabled: true,
    documentationUrl: "https://developer.calendly.com/api-docs/",
    operationalState: "ingest_only",
  },

  async probe() {
    const need = hasAll(this.requiredSecrets);
    if (!need.ok) return { ok: false, status: "needs_credentials", message: `Missing: ${need.missing.join(", ")}` };
    const token = getEnv("CALENDLY_ACCESS_TOKEN");
    if (!token) {
      return {
        ok: true,
        status: "configured_pending_probe_path",
        message: "Calendly OAuth config present; provide CALENDLY_ACCESS_TOKEN to enable live probe (or run OAuth flow).",
      };
    }
    const base = (getEnv("CALENDLY_API_BASE_URL") ?? "https://api.calendly.com").replace(/\/$/, "");
    const probePath = getEnv("CALENDLY_PROBE_PATH") ?? "/users/me";
    const res = await fetchJson<any>(`${base}${probePath}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!res.ok) return { ok: false, status: "error", message: res.error ?? `HTTP ${res.status}` };
    return {
      ok: true,
      status: "connected",
      message: "Calendly /users/me ok",
      accountLabel: (res.data as any)?.resource?.email ?? null,
    };
  },

  async sync(ctx, options) {
    const token = getEnv("CALENDLY_ACCESS_TOKEN");
    if (!token) {
      return {
        ok: false,
        status: "failed",
        message: "needs_credentials: CALENDLY_ACCESS_TOKEN required for pull sync (webhook path still works).",
      };
    }
    const orgUri = getEnv("CALENDLY_ORGANIZATION_URI");
    if (!orgUri) {
      return {
        ok: false,
        status: "failed",
        message:
          "vendor_docs_required: CALENDLY_ORGANIZATION_URI required for /scheduled_events (from GET /users/me → current_organization).",
      };
    }
    const base = (getEnv("CALENDLY_API_BASE_URL") ?? "https://api.calendly.com").replace(/\/$/, "");
    const pageSize = Math.min(options.limit ?? 100, 100);
    const dryRun = options.dryRun === true;
    let next: string | null =
      `${base}/scheduled_events?organization=${encodeURIComponent(orgUri)}&count=${pageSize}${
        options.since ? `&min_start_time=${encodeURIComponent(options.since)}` : ""
      }`;
    let received = 0;
    let created = 0;
    let pages = 0;
    const RUN_BUDGET_MS = 16_000;
    const startedAt = Date.now();
    while (next && pages < 10 && Date.now() - startedAt < RUN_BUDGET_MS) {
      const res = await fetchJson<any>(next, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (!res.ok) {
        return { ok: false, status: "failed", message: res.error ?? `HTTP ${res.status}` };
      }
      const collection: any[] = (res.data as any)?.collection ?? [];
      received += collection.length;
      pages += 1;
      if (!dryRun && ctx?.supabase) {
        for (const ev of collection) {
          const up = await upsertNormalizedRecord(ctx, "calendly", {
            providerRecordId: String(ev.uri ?? ev.uuid),
            recordKind: "calendar_event",
            recordStatus: ev.status ?? null,
            displayTitle: ev.name ?? ev.event_type ?? "Calendly event",
            occurredAt: ev.start_time ?? null,
            sourceLabel: "Calendly",
            metadata: { event_type: ev.event_type, end_time: ev.end_time },
          });
          if (up.ok) created += 1;
        }
      }
      const nextPageToken = (res.data as any)?.pagination?.next_page ?? null;
      next = nextPageToken;
    }
    const status = pages >= 10 || Date.now() - startedAt >= RUN_BUDGET_MS ? "partial" : "success";
    return {
      ok: true,
      status,
      message: dryRun
        ? `Calendly dry-run: ${received} scheduled events across ${pages} page(s); zero writes.`
        : `Calendly sync: staged ${created}/${received} events across ${pages} page(s).`,
      received,
      created,
      details: { pages, dryRun, budgetExhausted: status === "partial" },
    };
  },

  normalizeWebhook(payload) {
    const p = (payload ?? {}) as any;
    const inv = p.payload ?? p;
    return {
      eventType: p.event ?? null,
      providerEventId: inv?.uri ?? inv?.uuid ?? null,
      normalizedKind: "calendar_event",
      metadata: { raw: p },
      record: inv?.uri || inv?.uuid
        ? {
            providerRecordId: String(inv.uri ?? inv.uuid),
            recordKind: "calendar_event",
            recordStatus: inv.status ?? p.event ?? null,
            displayTitle: inv.event_type?.name ?? inv.name ?? "Calendly event",
            occurredAt: inv.scheduled_event?.start_time ?? inv.start_time ?? null,
            personName: inv.name ?? null,
            personEmail: inv.email ?? null,
            personPhone: inv.text_reminder_number ?? null,
            sourceLabel: "Calendly",
            metadata: { event_type_uri: inv.event_type?.uri, scheduled_event: inv.scheduled_event },
          }
        : null,
    };
  },
};
