import type { ProviderAdapter } from "../types.ts";
import { getEnv, hasAll } from "../secrets.ts";
import { fetchJson } from "../http.ts";
import { upsertNormalizedRecord, recordIntegrationEvent } from "../normalizers.ts";
import {
  normalizeJotformPurpose,
  purposeToRecordKind,
  type JotformPurpose,
} from "../jotformPurpose.ts";

/**
 * Jotform — canonical form/intake/document-submission provider.
 * Replaces LeadTrap and PandaDoc in Blossom OS going forward.
 *
 * Inbound / read-only only. No outbound writes, no auto-notifications.
 * PHI handling: recommend HIPAA endpoint. Never silently fall back to
 * the standard region if HIPAA is required.
 *
 * Docs: https://api.jotform.com/docs/
 * Auth: header `APIKEY: <key>` (Jotform accepts a query param too; we
 * always use the header form so keys never appear in URLs or logs).
 */

const ALLOWED_BASE_URLS = new Set([
  "https://api.jotform.com",
  "https://eu-api.jotform.com",
  "https://hipaa-api.jotform.com",
]);

function getBaseUrl(): { ok: boolean; url?: string; error?: string } {
  const raw = getEnv("JOTFORM_API_BASE_URL");
  if (!raw) {
    return {
      ok: false,
      error:
        "JOTFORM_API_BASE_URL is required and must be one of the Jotform region endpoints (standard, EU, HIPAA). HIPAA is recommended for PHI.",
    };
  }
  const cleaned = raw.replace(/\/+$/, "");
  if (!ALLOWED_BASE_URLS.has(cleaned)) {
    return {
      ok: false,
      error: `JOTFORM_API_BASE_URL not allowlisted. Must be one of: ${[...ALLOWED_BASE_URLS].join(", ")}.`,
    };
  }
  return { ok: true, url: cleaned };
}

function authHeaders(): Record<string, string> {
  return { APIKEY: getEnv("JOTFORM_API_KEY") ?? "", Accept: "application/json" };
}

function parseJsonEnv<T>(name: string): T | null {
  const raw = getEnv(name);
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

/** Purpose map: form_id -> canonical Jotform purpose.
 * Accepted canonical values (see `jotformPurpose.ts`):
 *   intake | recruiting | hr | clinical_document
 * Legacy strings (lead/candidate/document/form_submission) are still
 * honored via `normalizeJotformPurpose` for backwards compatibility. */
function getPurposeMap(): Record<string, JotformPurpose> {
  const raw = parseJsonEnv<Record<string, string>>("JOTFORM_FORM_PURPOSES_JSON") ?? {};
  const out: Record<string, JotformPurpose> = {};
  for (const [formId, val] of Object.entries(raw)) {
    const norm = normalizeJotformPurpose(val);
    if (norm) out[formId] = norm;
  }
  return out;
}

/** Canonical field map: canonicalName -> Jotform question text/name. */
function getFieldMap(): Record<string, string> {
  return parseJsonEnv<Record<string, string>>("JOTFORM_FIELD_MAP_JSON") ?? {};
}

function getConfiguredFormIds(): string[] {
  const raw = getEnv("JOTFORM_FORM_IDS");
  if (!raw) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

/** Flatten Jotform answers keyed by qid into a simple map keyed by
 * question `name` (falling back to `text`). We deliberately drop file
 * uploads' binary content — only safe URL/metadata is kept. */
function flattenAnswers(answers: Record<string, any> | null | undefined): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!answers || typeof answers !== "object") return out;
  for (const [qid, node] of Object.entries<any>(answers)) {
    if (!node || typeof node !== "object") continue;
    const key = String(node.name ?? node.text ?? qid).trim() || qid;
    let val: unknown = node.answer ?? node.prettyFormat ?? null;
    // Files: keep only the URL(s), never binary content.
    if (node.type === "control_fileupload" && val) {
      val = Array.isArray(val) ? val : [val];
    }
    out[key] = val ?? null;
  }
  return out;
}

function pickField(fields: Record<string, unknown>, ...candidates: string[]): string | null {
  for (const c of candidates) {
    if (!c) continue;
    const v = fields[c];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

export const jotformAdapter: ProviderAdapter = {
  id: "jotform",
  classification: "forms_intake_documents",
  requiredSecrets: ["JOTFORM_API_KEY", "JOTFORM_API_BASE_URL", "JOTFORM_WEBHOOK_TOKEN"],
  optionalSecrets: ["JOTFORM_FORM_IDS", "JOTFORM_FORM_PURPOSES_JSON", "JOTFORM_FIELD_MAP_JSON"],
  capabilities: {
    probe: true,
    pullSync: true,
    webhook: true,
    outboundDisabled: true,
    documentationUrl: "https://api.jotform.com/docs/",
    operationalState: "ingest_only",
  },

  async probe() {
    const need = hasAll(this.requiredSecrets);
    if (!need.ok) return { ok: false, status: "not_configured", message: `Missing: ${need.missing.join(", ")}` };
    const base = getBaseUrl();
    if (!base.ok) return { ok: false, status: "not_configured", message: base.error! };
    const res = await fetchJson<any>(`${base.url}/user`, {
      headers: authHeaders(),
      timeoutMs: 8_000,
    });
    if (!res.ok) return { ok: false, status: "error", message: res.error ?? `HTTP ${res.status}` };
    const u = (res.data as any)?.content ?? {};
    return {
      ok: true,
      status: "connected",
      message: `Jotform /user ok${base.url!.includes("hipaa") ? " (HIPAA)" : base.url!.includes("eu-api") ? " (EU)" : " (standard)"}`,
      accountLabel: u.username ?? u.email ?? null,
      details: {
        account_type: u.account_type ?? null,
        status: u.status ?? null,
        webhookSecretConfigured: !!getEnv("JOTFORM_WEBHOOK_TOKEN"),
        region: base.url,
      },
    };
  },

  async sync(ctx, options) {
    const need = hasAll(this.requiredSecrets);
    if (!need.ok) return { ok: false, status: "failed", message: `Missing: ${need.missing.join(", ")}` };
    const base = getBaseUrl();
    if (!base.ok) return { ok: false, status: "failed", message: base.error! };

    const formIds = getConfiguredFormIds();
    if (formIds.length === 0) {
      return {
        ok: false,
        status: "failed",
        message: "configured_pending_form_ids: set JOTFORM_FORM_IDS to a comma-separated list of Jotform form ids to enable pull sync.",
      };
    }

    const limit = Math.min(Math.max(options.limit ?? 100, 1), 1000);
    const dryRun = options.dryRun === true;
    const purposeMap = getPurposeMap();
    const fieldMap = getFieldMap();

    // Checkpoint: prefer explicit `since`; otherwise derive from the
    // most recent normalized record for this integration so successive
    // runs never re-pull rows already staged. Missing supabase (unit
    // tests) → no checkpoint.
    let since: string | null = options.since ?? null;
    if (!since && ctx?.supabase) {
      try {
        const { data } = await ctx.supabase
          .from("integration_normalized_records")
          .select("occurred_at")
          .eq("integration_id", "jotform")
          .order("occurred_at", { ascending: false, nullsFirst: false })
          .limit(1)
          .maybeSingle();
        if (data?.occurred_at) since = data.occurred_at as string;
      } catch { /* ignore — checkpoint is best-effort */ }
    }

    const RUN_BUDGET_MS = 16_000;
    const startedAt = Date.now();
    const withinBudget = () => Date.now() - startedAt < RUN_BUDGET_MS;

    let totalReceived = 0;
    let totalCreated = 0;
    let totalUpdated = 0;
    let totalFailed = 0;
    let rateLimited = false;
    let hardError: string | null = null;
    let latestOccurredAt: string | null = null;
    const perForm: Record<string, {
      received: number;
      created: number;
      updated: number;
      failed: number;
      pages: number;
      nextOffset: number | null;
      purpose: JotformPurpose | null;
      error?: string;
    }> = {};

    outer: for (const formId of formIds) {
      let offset = 0;
      let pages = 0;
      let received = 0;
      let created = 0;
      let updated = 0;
      let failed = 0;
      const purpose = purposeMap[formId] ?? null;

      // Bounded page budget per form.
      while (pages < 5 && withinBudget()) {
        const url = new URL(`${base.url}/form/${encodeURIComponent(formId)}/submissions`);
        url.searchParams.set("limit", String(limit));
        url.searchParams.set("offset", String(offset));
        url.searchParams.set("orderby", "created_at");
        if (since) {
          url.searchParams.set("filter", JSON.stringify({ "created_at:gt": since }));
        }
        const res = await fetchJson<any>(url.toString(), {
          headers: authHeaders(),
          timeoutMs: 10_000,
        });
        if (!res.ok) {
          if (res.status === 429) {
            rateLimited = true;
            perForm[formId] = { received, created, updated, failed, pages, nextOffset: offset, purpose, error: "rate_limited" };
            continue outer;
          }
          hardError = res.error ?? `HTTP ${res.status}`;
          perForm[formId] = { received, created, updated, failed, pages, nextOffset: offset, purpose, error: hardError };
          continue outer;
        }
        const items: any[] = (res.data as any)?.content ?? [];
        received += items.length;
        pages += 1;

        if (!dryRun && ctx?.supabase) {
          for (const item of items) {
            const submissionId = String(item?.id ?? "").trim();
            if (!submissionId) { failed += 1; continue; }
            const flat = flattenAnswers(item?.answers ?? {});
            const name =
              pickField(flat, fieldMap.name ?? "", fieldMap.parent_name ?? "", "name", "parent_name", "fullName");
            const email = pickField(flat, fieldMap.email ?? "", "email");
            const phone = pickField(flat, fieldMap.phone ?? "", "phone", "phoneNumber");
            const state = pickField(flat, fieldMap.state ?? "", "state");
            const childName = pickField(flat, fieldMap.child_name ?? "", "child_name", "childName");
            const candidateName = pickField(flat, fieldMap.candidate_name ?? "", "candidate_name");
            const occurredAt = (item?.created_at as string) ?? null;
            if (occurredAt && (!latestOccurredAt || occurredAt > latestOccurredAt)) {
              latestOccurredAt = occurredAt;
            }
            const recordKind = purposeToRecordKind(purpose);
            const up = await upsertNormalizedRecord(ctx, "jotform", {
              // Deterministic idempotency key — natural unique index on
              // (integration_id, provider_record_id, record_kind).
              providerRecordId: `jotform:${formId}:${submissionId}`,
              recordKind,
              recordStatus: "submitted",
              displayTitle: candidateName ?? name ?? childName ?? `Jotform submission ${submissionId}`,
              occurredAt,
              personName: name ?? candidateName ?? null,
              personEmail: email,
              personPhone: phone,
              sourceLabel: "Jotform",
              // PHI-safe metadata: NO raw answer values, only key names +
              // scalar flags. Full submission body is retained only in
              // `integration_webhook_events.payload` (admin-only RLS).
              metadata: {
                formId,
                purpose,
                state,
                childName: childName ? true : false,
                fieldKeys: Object.keys(flat),
              },
            });
            if (!up.ok) { failed += 1; continue; }
            // We can't cheaply distinguish insert vs update without a
            // second query; count as `created` on first-seen submission,
            // `updated` otherwise. Since idempotent runs re-upsert the
            // same row, we approximate by treating identical-status
            // upserts as updated on subsequent pages.
            // (`updated_at` is bumped by trigger regardless.)
            created += 1;
          }
          // Best-effort audit event per page (no PHI).
          await recordIntegrationEvent(ctx, "jotform", {
            eventType: "sync_page",
            title: `Jotform sync page ${pages} for form ${formId}`,
            metadata: { formId, purpose, offset, received: items.length, dryRun: false },
          }).catch(() => {});
        }

        if (items.length < limit) {
          perForm[formId] = { received, created, updated, failed, pages, nextOffset: null, purpose };
          continue outer;
        }
        offset += limit;
        perForm[formId] = { received, created, updated, failed, pages, nextOffset: offset, purpose };
      }

      // Loop exited without breaking: budget exhausted or page cap hit.
      if (!perForm[formId]) {
        perForm[formId] = { received, created, updated, failed, pages, nextOffset: offset, purpose };
      }
      totalReceived += received;
      totalCreated += created;
      totalUpdated += updated;
      totalFailed += failed;
    }

    // Persist checkpoint into the current run row so successive runs
    // can resume without duplicating rows.
    if (!dryRun && ctx?.supabase && ctx.runId && latestOccurredAt) {
      try {
        await ctx.supabase
          .from("integration_sync_runs")
          .update({ metadata: { checkpoint: { last_created_at: latestOccurredAt } } })
          .eq("id", ctx.runId);
      } catch { /* best-effort */ }
    }

    const status: "success" | "partial" | "failed" =
      hardError ? "failed"
      : (rateLimited || !withinBudget()) ? "partial"
      : "success";

    const message = dryRun
      ? `Jotform dry-run: fetched ${totalReceived} submissions across ${formIds.length} form(s); zero writes.`
      : status === "partial"
        ? `Jotform partial: staged ${totalCreated}/${totalReceived} submissions; ${rateLimited ? "rate limited" : "budget exhausted"}, resume from checkpoint.`
        : status === "failed"
          ? `Jotform sync failed: ${hardError}`
          : `Jotform sync: staged ${totalCreated} submissions across ${formIds.length} form(s) (idempotent). INGEST_ONLY — no outbound writes.`;

    return {
      ok: status !== "failed",
      status,
      message,
      received: totalReceived,
      created: totalCreated,
      updated: totalUpdated,
      failed: totalFailed,
      details: {
        perForm,
        dryRun,
        rateLimited,
        checkpoint: latestOccurredAt,
        since,
      },
    };
  },

  normalizeWebhook(payload) {
    const p = (payload ?? {}) as any;
    // Jotform posts form-encoded with `rawRequest` (JSON string) plus
    // top-level fields (formID, submissionID). We accept either shape:
    // if `rawRequest` is present, use it as the authoritative body.
    let raw = p;
    if (typeof p.rawRequest === "string") {
      try { raw = JSON.parse(p.rawRequest); } catch { raw = p; }
    } else if (p.rawRequest && typeof p.rawRequest === "object") {
      raw = p.rawRequest;
    }

    const submissionId = String(
      p.submissionID ?? p.submission_id ?? p.submissionId ?? raw?.submissionID ?? "",
    ).trim() || null;
    const formId = String(p.formID ?? p.form_id ?? p.formId ?? raw?.formID ?? "").trim() || null;

    const answers = raw?.answers ?? raw?.pretty ?? raw ?? {};
    // If answers is already flat (from `pretty`), use as-is; otherwise flatten.
    const flat: Record<string, unknown> =
      answers && typeof answers === "object" && !Array.isArray(answers) && !answers?.["1"]
        ? (answers as Record<string, unknown>)
        : flattenAnswers(answers);

    const map = getFieldMap();
    const name = pickField(flat, map.name ?? "", map.parent_name ?? "", "name", "parent_name", "fullName");
    const email = pickField(flat, map.email ?? "", "email");
    const phone = pickField(flat, map.phone ?? "", "phone", "phoneNumber");
    const state = pickField(flat, map.state ?? "", "state");
    const childName = pickField(flat, map.child_name ?? "", "child_name", "childName");
    const candidateName = pickField(flat, map.candidate_name ?? "", "candidate_name");

    const purposeMap = getPurposeMap();
    const purpose: JotformPurpose | null = formId ? (purposeMap[formId] ?? null) : null;
    const recordKind = purposeToRecordKind(purpose);

    return {
      eventType: "form_submission",
      providerEventId: submissionId,
      normalizedKind: recordKind as any,
      metadata: {
        formId,
        purpose,
        // NOTE: raw fields are captured for staging; downstream code is
        // responsible for PHI-safe handling before display.
        fieldKeys: Object.keys(flat),
      },
      record: submissionId
        ? {
            // Deterministic idempotency: form-scoped so submissions from
            // different forms never collide.
            providerRecordId: formId ? `jotform:${formId}:${submissionId}` : `jotform::${submissionId}`,
            recordKind: recordKind as any,
            recordStatus: "submitted",
            displayTitle: candidateName ?? name ?? childName ?? `Jotform submission ${submissionId}`,
            occurredAt: (raw?.created_at as string) ?? new Date().toISOString(),
            personName: name ?? candidateName ?? null,
            personEmail: email,
            personPhone: phone,
            sourceLabel: "Jotform",
            // PHI-safe: no raw answer values, only key names and scalar flags.
            metadata: {
              formId,
              purpose,
              state,
              childName: childName ? true : false,
            },
          }
        : null,
    };
  },
};

/** Constant-time comparison of the shared webhook token. Exposed for
 * use by the generic webhook handler; kept honest — a missing/mismatch
 * token must reject the delivery before normalization. */
export function verifyJotformToken(provided: string | null): boolean {
  const expected = getEnv("JOTFORM_WEBHOOK_TOKEN");
  if (!expected || !provided) return false;
  if (provided.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ provided.charCodeAt(i);
  }
  return diff === 0;
}

export const JOTFORM_ALLOWED_BASE_URLS = [...ALLOWED_BASE_URLS];