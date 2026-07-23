import type { ProviderAdapter } from "../types.ts";
import { getEnv, hasAll } from "../secrets.ts";
import { fetchJson } from "../http.ts";

/**
 * CentralReach is the EMR. Blossom OS INTEGRATES with it; it is not replaced.
 * The BCBA Productivity admin upload flow remains the source for the
 * productivity report — this adapter does not touch it.
 *
 * Enhanced API: OAuth2 client_credentials against CentralReach's Enhanced
 * API tenant. Canonical endpoints (override with env if the tenant issues
 * different values):
 *   base   = https://enhanced-api.centralreach.com
 *   token  = https://login.centralreach.com/connect/token
 *
 * INGEST_ONLY: no writebacks to CentralReach through this adapter.
 */
export const centralreachAdapter: ProviderAdapter = {
  id: "centralreach",
  classification: "emr",
  requiredSecrets: ["CENTRALREACH_CLIENT_ID", "CENTRALREACH_CLIENT_SECRET", "CENTRALREACH_API_BASE_URL"],
  optionalSecrets: [
    "CENTRALREACH_TOKEN_URL",
    "CENTRALREACH_PROBE_PATH",
    "CENTRALREACH_SCOPE",
  ],
  capabilities: {
    probe: true,
    pullSync: true,
    webhook: false,
    outboundDisabled: true,
    documentationUrl: "https://developers.centralreach.com/",
    operationalState: "ingest_only",
  },

  async probe() {
    const need = hasAll(this.requiredSecrets);
    if (!need.ok) return { ok: false, status: "needs_credentials", message: `Missing: ${need.missing.join(", ")}` };
    // Enhanced API canonical token URL when tenant has not overridden.
    const tokenUrl =
      getEnv("CENTRALREACH_TOKEN_URL") ?? "https://login.centralreach.com/connect/token";
    const probePath = getEnv("CENTRALREACH_PROBE_PATH");
    if (tokenUrl) {
      const body = new URLSearchParams({
        grant_type: "client_credentials",
        client_id: getEnv("CENTRALREACH_CLIENT_ID")!,
        client_secret: getEnv("CENTRALREACH_CLIENT_SECRET")!,
      });
      const scope = getEnv("CENTRALREACH_SCOPE");
      if (scope) body.set("scope", scope);
      const res = await fetchJson<any>(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      if (!res.ok) return { ok: false, status: "error", message: res.error ?? `HTTP ${res.status}` };
      return {
        ok: true,
        status: "connected",
        message: "CentralReach Enhanced API OAuth (client_credentials) ok",
        details: { tokenUrl, hasScope: Boolean(scope) },
      };
    }
    if (probePath) {
      const baseUrl = getEnv("CENTRALREACH_API_BASE_URL")!.replace(/\/$/, "");
      const res = await fetchJson(`${baseUrl}${probePath}`);
      if (!res.ok) return { ok: false, status: "error", message: res.error ?? `HTTP ${res.status}` };
      return { ok: true, status: "connected", message: "CentralReach probe ok" };
    }
    return {
      ok: true,
      status: "configured_pending_probe_path",
      message:
        "CentralReach client creds present; supply CENTRALREACH_TOKEN_URL (Enhanced API) or CENTRALREACH_PROBE_PATH for a live probe.",
    };
  },

  async sync(_ctx, options) {
    const mode = options.mode ?? "clients";
    const allowed = ["clients", "schedules", "authorizations", "sessions", "billing_export"];
    if (!allowed.includes(mode)) {
      return { ok: false, status: "failed", message: `Unknown CentralReach sync mode: ${mode}` };
    }
    const baseUrl = getEnv("CENTRALREACH_API_BASE_URL");
    if (!baseUrl) {
      return {
        ok: false,
        status: "failed",
        message: "configured_pending_probe_path: CENTRALREACH_API_BASE_URL required. BCBA Productivity upload flow is unaffected.",
        details: { mode, file_import_ready: true },
      };
    }
    // No documented endpoint set yet — return honest pending status with file_import handoff metadata.
    return {
      ok: true,
      status: "partial",
      message: `CentralReach ${mode} sync pending vendor endpoint config; file import handoff remains available.`,
      details: { mode, file_import_ready: true },
    };
  },

  normalizeWebhook(payload) {
    const p = (payload ?? {}) as any;
    return {
      eventType: p.event ?? p.type ?? null,
      providerEventId: p.id ?? null,
      normalizedKind: "clinical_client",
      metadata: { raw: p },
    };
  },
};