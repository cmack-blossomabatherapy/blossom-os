import type { ProviderAdapter } from "../types.ts";
import { getEnv, hasAll } from "../secrets.ts";
import { fetchJson } from "../http.ts";

/**
 * Resend is ALREADY in production for invites/welcome/MFA/evaluation emails.
 * This adapter is report-only — it does not rebuild the delivery path.
 *
 * Webhooks are signed with Svix. Verification uses headers
 * `svix-id`, `svix-timestamp`, `svix-signature` (`v1,<b64>` space-separated).
 * `svix-id` also doubles as the deterministic idempotency key.
 *
 * Docs:
 *   - https://resend.com/docs/dashboard/webhooks/introduction
 *   - https://docs.svix.com/receiving/verifying-payloads/how
 */

/** Verify a Resend/Svix webhook signature. */
export async function verifyResendWebhook(
  rawBody: string,
  headers: Record<string, string>,
  signingSecret: string,
  toleranceSec = 300,
): Promise<boolean> {
  const id = headers["svix-id"] ?? headers["Svix-Id"];
  const ts = headers["svix-timestamp"] ?? headers["Svix-Timestamp"];
  const sigHeader = headers["svix-signature"] ?? headers["Svix-Signature"];
  if (!id || !ts || !sigHeader || !signingSecret) return false;
  const skew = Math.abs(Date.now() / 1000 - Number(ts));
  if (!Number.isFinite(skew) || skew > toleranceSec) return false;

  // Svix secrets are prefixed `whsec_<base64>`; the raw key is the base64 part.
  const rawSecret = signingSecret.startsWith("whsec_")
    ? signingSecret.slice("whsec_".length)
    : signingSecret;
  // Copy key material into a fresh ArrayBuffer so the WebCrypto types
  // (ArrayBufferView<ArrayBuffer>) are satisfied — Uint8Array<ArrayBufferLike>
  // from atob/TextEncoder is not directly assignable to BufferSource.
  let source: Uint8Array;
  try {
    const bin = atob(rawSecret);
    source = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  } catch {
    source = new TextEncoder().encode(rawSecret);
  }
  const keyBuffer = new ArrayBuffer(source.byteLength);
  new Uint8Array(keyBuffer).set(source);
  const key = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const msg = new TextEncoder().encode(`${id}.${ts}.${rawBody}`);
  const msgBuffer = new ArrayBuffer(msg.byteLength);
  new Uint8Array(msgBuffer).set(msg);
  const buf = await crypto.subtle.sign("HMAC", key, msgBuffer);
  const expected = btoa(String.fromCharCode(...new Uint8Array(buf)));
  const provided = sigHeader
    .split(" ")
    .map((s) => s.split(",")[1])
    .filter(Boolean);
  return provided.some((sig) => {
    if (sig.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
    return diff === 0;
  });
}

/** Deterministic idempotency key from a Svix delivery. */
export function resendIdempotencyKey(headers: Record<string, string>): string | null {
  return headers["svix-id"] ?? headers["Svix-Id"] ?? null;
}

export const resendAdapter: ProviderAdapter = {
  id: "resend",
  classification: "transactional_email_preserved",
  requiredSecrets: ["RESEND_API_KEY"],
  optionalSecrets: ["RESEND_WEBHOOK_SIGNING_SECRET"],
  capabilities: {
    probe: true,
    pullSync: false,
    webhook: true,
    outboundDisabled: false, // in-production delivery is preserved (send only via existing paths)
    documentationUrl: "https://resend.com/docs/api-reference/introduction",
    operationalState: "report_only",
  },

  async probe() {
    const need = hasAll(this.requiredSecrets);
    if (!need.ok) return { ok: false, status: "needs_credentials", message: `Missing: ${need.missing.join(", ")}` };
    const res = await fetchJson(`https://api.resend.com/domains`, {
      headers: { Authorization: `Bearer ${getEnv("RESEND_API_KEY")}` },
    });
    if (!res.ok) return { ok: false, status: "error", message: res.error ?? `HTTP ${res.status}` };
    return { ok: true, status: "connected", message: "Resend /domains reachable", details: { httpStatus: res.status } };
  },

  async sync(_ctx, _options) {
    const need = hasAll(this.requiredSecrets);
    if (!need.ok) return { ok: false, status: "failed", message: `Missing: ${need.missing.join(", ")}` };
    return {
      ok: true,
      status: "success",
      message:
        "Resend has no pull API for delivery events; use Svix webhooks (verifyResendWebhook) with svix-id idempotency.",
    };
  },

  normalizeWebhook(payload, headers) {
    const p = (payload ?? {}) as any;
    const svixId =
      headers?.["svix-id"] ?? headers?.["Svix-Id"] ?? null;
    return {
      eventType: p.type ?? null,
      providerEventId: svixId ?? p.data?.email_id ?? p.id ?? null,
      normalizedKind: "email_activity",
      metadata: { raw: p, svix_id: svixId ?? null },
    };
  },
};
