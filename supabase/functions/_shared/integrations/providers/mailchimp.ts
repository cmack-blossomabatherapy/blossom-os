import type { ProviderAdapter } from "../types.ts";
import { getEnv, hasAll } from "../secrets.ts";
import { fetchJson } from "../http.ts";
import { upsertNormalizedRecord } from "../normalizers.ts";

/**
 * Mailchimp Marketing API — read-only, INGEST_ONLY.
 * Pagination via `count` + `offset` (max 1000/page). We loop until a
 * page returns fewer than `count` items, capped by a per-run budget.
 * Docs: https://mailchimp.com/developer/marketing/api/campaigns/
 */
export const mailchimpAdapter: ProviderAdapter = {
  id: "mailchimp",
  classification: "marketing_email",
  requiredSecrets: ["MAILCHIMP_API_KEY", "MAILCHIMP_SERVER_PREFIX"],
  capabilities: {
    probe: true,
    pullSync: true,
    webhook: true,
    outboundDisabled: true,
    documentationUrl: "https://mailchimp.com/developer/marketing/api/",
    operationalState: "ingest_only",
  },

  async probe() {
    const need = hasAll(this.requiredSecrets);
    if (!need.ok) {
      return { ok: false, status: "needs_credentials", message: `Missing: ${need.missing.join(", ")}` };
    }
    const prefix = getEnv("MAILCHIMP_SERVER_PREFIX")!;
    const key = getEnv("MAILCHIMP_API_KEY")!;
    const res = await fetchJson<any>(`https://${prefix}.api.mailchimp.com/3.0/ping`, {
      headers: { Authorization: `Basic ${btoa(`anystring:${key}`)}` },
    });
    if (!res.ok) return { ok: false, status: "error", message: res.error ?? `HTTP ${res.status}` };
    return {
      ok: true,
      status: "connected",
      message: "Mailchimp /ping ok",
      accountLabel: `dc=${prefix}`,
      details: { httpStatus: res.status, health_status: (res.data as any)?.health_status },
    };
  },

  async sync(ctx, options) {
    const need = hasAll(this.requiredSecrets);
    if (!need.ok) {
      return { ok: false, status: "failed", message: `Missing: ${need.missing.join(", ")}` };
    }
    const prefix = getEnv("MAILCHIMP_SERVER_PREFIX")!;
    const key = getEnv("MAILCHIMP_API_KEY")!;
    const pageSize = Math.min(Math.max(options.limit ?? 100, 1), 1000);
    const dryRun = options.dryRun === true;
    const RUN_BUDGET_MS = 16_000;
    const startedAt = Date.now();
    let offset = 0;
    let received = 0;
    let created = 0;
    let pages = 0;
    while (pages < 20 && Date.now() - startedAt < RUN_BUDGET_MS) {
      const res = await fetchJson<any>(
        `https://${prefix}.api.mailchimp.com/3.0/campaigns?count=${pageSize}&offset=${offset}&sort_field=send_time&sort_dir=DESC`,
        { headers: { Authorization: `Basic ${btoa(`anystring:${key}`)}` } },
      );
      if (!res.ok) {
        return { ok: false, status: "failed", message: res.error ?? `HTTP ${res.status}` };
      }
      const campaigns: any[] = (res.data as any)?.campaigns ?? [];
      received += campaigns.length;
      pages += 1;
      if (!dryRun && ctx?.supabase) {
        for (const c of campaigns) {
          const up = await upsertNormalizedRecord(ctx, "mailchimp", {
            providerRecordId: c.id,
            recordKind: "email_marketing",
            recordStatus: c.status,
            displayTitle: c.settings?.title ?? c.settings?.subject_line ?? c.id,
            occurredAt: c.send_time ?? c.create_time ?? null,
            sourceLabel: "Mailchimp campaign",
            externalUrl: c.archive_url ?? null,
            metadata: { type: c.type, emails_sent: c.emails_sent, recipients_count: c.recipients?.recipient_count },
          });
          if (up.ok) created += 1;
        }
      }
      if (campaigns.length < pageSize) break;
      offset += pageSize;
    }
    const status =
      pages >= 20 || Date.now() - startedAt >= RUN_BUDGET_MS ? "partial" : "success";
    return {
      ok: true,
      status,
      message: dryRun
        ? `Mailchimp dry-run: ${received} campaigns across ${pages} page(s); zero writes.`
        : `Mailchimp sync: staged ${created}/${received} campaigns across ${pages} page(s).`,
      received,
      created,
      details: { pages, offset, dryRun, budgetExhausted: status === "partial" },
    };
  },

  normalizeWebhook(payload) {
    const p = (payload ?? {}) as any;
    return {
      eventType: p.type ?? null,
      providerEventId: p.id ?? null,
      normalizedKind: "email_marketing",
      metadata: { raw: p },
    };
  },
};
