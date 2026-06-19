import type { ProviderAdapter } from "../types.ts";
import { getEnv, hasAll } from "../secrets.ts";
import { fetchJson } from "../http.ts";
import { upsertNormalizedRecord } from "../normalizers.ts";

export const mailchimpAdapter: ProviderAdapter = {
  id: "mailchimp",
  classification: "marketing_email",
  requiredSecrets: ["MAILCHIMP_API_KEY", "MAILCHIMP_SERVER_PREFIX"],

  async probe() {
    const need = hasAll(this.requiredSecrets);
    if (!need.ok) {
      return { ok: false, status: "not_configured", message: `Missing: ${need.missing.join(", ")}` };
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
    const limit = Math.min(options.limit ?? 10, 50);
    const res = await fetchJson<any>(
      `https://${prefix}.api.mailchimp.com/3.0/campaigns?count=${limit}&sort_field=send_time&sort_dir=DESC`,
      { headers: { Authorization: `Basic ${btoa(`anystring:${key}`)}` } },
    );
    if (!res.ok) {
      return { ok: false, status: "failed", message: res.error ?? `HTTP ${res.status}` };
    }
    const campaigns: any[] = (res.data as any)?.campaigns ?? [];
    let created = 0;
    for (const c of campaigns) {
      const up = await upsertNormalizedRecord(ctx, this.id, {
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
    return { ok: true, status: "success", message: `Synced ${created} campaigns`, received: campaigns.length, created };
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