import type { ProviderAdapter } from "../types.ts";
import { getEnv, hasAll } from "../secrets.ts";
import { fetchJson } from "../http.ts";

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

/** Purpose map: form_id -> normalized kind. */
type Purpose = "lead" | "document" | "candidate" | "form_submission";
function getPurposeMap(): Record<string, Purpose> {
  const raw = parseJsonEnv<Record<string, Purpose>>("JOTFORM_FORM_PURPOSES_JSON");
  return raw ?? {};
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

  async sync(_ctx, options) {
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
    const since = options.since ?? null;
    const dryRun = options.dryRun === true;

    let totalReceived = 0;
    const perForm: Record<string, { received: number; pages: number; nextOffset: number | null; error?: string }> = {};

    for (const formId of formIds) {
      let offset = 0;
      let pages = 0;
      let received = 0;
      // Bounded page budget per invocation.
      while (pages < 5) {
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
            perForm[formId] = { received, pages, nextOffset: offset, error: "rate_limited" };
            break;
          }
          perForm[formId] = { received, pages, nextOffset: offset, error: res.error ?? `HTTP ${res.status}` };
          break;
        }
        const items: any[] = (res.data as any)?.content ?? [];
        received += items.length;
        pages += 1;
        if (items.length < limit) {
          perForm[formId] = { received, pages, nextOffset: null };
          break;
        }
        offset += limit;
        perForm[formId] = { received, pages, nextOffset: offset };
      }
      totalReceived += received;
    }

    return {
      ok: true,
      status: "success",
      message: dryRun
        ? `Jotform dry-run: ${totalReceived} submissions across ${formIds.length} form(s).`
        : `Jotform sync: staged ${totalReceived} submissions across ${formIds.length} form(s). Persistence path is inbound/read-only staging only.`,
      received: totalReceived,
      details: { perForm, dryRun },
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
    const purpose: Purpose = formId && purposeMap[formId] ? purposeMap[formId] : "form_submission";

    const recordKind =
      purpose === "lead" ? "lead"
      : purpose === "candidate" ? "candidate"
      : purpose === "document" ? "document"
      : "unknown";

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
            providerRecordId: submissionId,
            recordKind: recordKind as any,
            recordStatus: "submitted",
            displayTitle: candidateName ?? name ?? childName ?? `Jotform submission ${submissionId}`,
            occurredAt: (raw?.created_at as string) ?? new Date().toISOString(),
            personName: name ?? candidateName ?? null,
            personEmail: email,
            personPhone: phone,
            sourceLabel: "Jotform",
            metadata: { formId, purpose, state, child_name: childName },
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