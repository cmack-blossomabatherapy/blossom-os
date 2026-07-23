// Read-only credential validation for CalltrackingMetrics.
// Hits GET /api/v1/accounts/{id}.json which requires valid Basic-auth
// credentials and returns account metadata. Never returns secret values;
// the response only exposes account name/id/status flags plus a public
// health verdict. Requires an authenticated Blossom user (any role) —
// gate is on the caller's JWT, not the CTM key.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const CTM_KEY = Deno.env.get("CTM_API_KEY") ?? "";
const CTM_SECRET = Deno.env.get("CTM_API_SECRET") ?? "";
const CTM_ACCOUNT_ID = Deno.env.get("CTM_ACCOUNT_ID") ?? "";
const CTM_WEBHOOK_TOKEN = Deno.env.get("CTM_WEBHOOK_TOKEN") ?? "";

function ok(v: string | undefined | null): boolean { return Boolean(v && v.length > 0); }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Require an authenticated user; we don't expose remote health anonymously.
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: claims, error: claimsErr } = await userClient.auth.getClaims(authHeader.slice(7));
  if (claimsErr || !claims?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const secrets = {
    CTM_API_KEY: ok(CTM_KEY),
    CTM_API_SECRET: ok(CTM_SECRET),
    CTM_ACCOUNT_ID: ok(CTM_ACCOUNT_ID),
    CTM_WEBHOOK_TOKEN: ok(CTM_WEBHOOK_TOKEN),
  };
  const missing = Object.entries(secrets).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) {
    return new Response(JSON.stringify({
      status: "disconnected",
      reason: "missing_secrets",
      missing,
      secrets,
      checked_at: new Date().toISOString(),
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const started = Date.now();
  const url = `https://api.calltrackingmetrics.com/api/v1/accounts/${CTM_ACCOUNT_ID}.json`;
  let status: "connected" | "degraded" | "disconnected" = "disconnected";
  let httpStatus = 0;
  let reason: string | null = null;
  let account: Record<string, unknown> | null = null;
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 8000);
    const resp = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: "Basic " + btoa(`${CTM_KEY}:${CTM_SECRET}`),
        Accept: "application/json",
      },
      signal: controller.signal,
    });
    clearTimeout(t);
    httpStatus = resp.status;
    if (resp.ok) {
      const body = await resp.json().catch(() => ({}));
      const acc = (body as any).account ?? body;
      // Only expose non-sensitive identifiers.
      account = {
        id: acc?.id ?? CTM_ACCOUNT_ID,
        name: acc?.name ?? null,
        status: acc?.status ?? null,
        timezone: acc?.timezone ?? acc?.time_zone ?? null,
      };
      status = "connected";
    } else if (resp.status === 401 || resp.status === 403) {
      status = "disconnected";
      reason = "auth_rejected";
    } else {
      status = "degraded";
      reason = `http_${resp.status}`;
    }
  } catch (e) {
    status = "disconnected";
    reason = e instanceof Error ? e.message : String(e);
  }

  return new Response(JSON.stringify({
    status,
    reason,
    http_status: httpStatus,
    latency_ms: Date.now() - started,
    account,
    secrets,
    checked_at: new Date().toISOString(),
  }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});