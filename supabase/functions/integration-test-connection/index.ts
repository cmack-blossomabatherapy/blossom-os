// Generic integration connection tester.
// Admin-only. Returns a structured result; for providers without a real
// probe yet, returns `status: "not_implemented"` rather than fake success.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const REQUIRED_SECRETS: Record<string, string[]> = {
  mailchimp: ["MAILCHIMP_API_KEY", "MAILCHIMP_SERVER_PREFIX"],
  resend: ["RESEND_API_KEY"],
  retell: ["RETELL_API_KEY"],
  ctm: ["CTM_API_KEY", "CTM_WEBHOOK_SECRET"],
  apploi: ["APPLOI_API_KEY"],
  centralreach: ["CENTRALREACH_CLIENT_ID", "CENTRALREACH_CLIENT_SECRET", "CENTRALREACH_API_BASE_URL"],
  solum: ["SOLUM_API_KEY"],
  eligipro: ["ELIGIPRO_API_KEY"],
  ms365: [
    "MICROSOFT_CLIENT_ID",
    "MICROSOFT_CLIENT_SECRET",
    "MICROSOFT_TENANT_ID",
    "MICROSOFT_REDIRECT_URI",
    "OAUTH_TOKEN_ENCRYPTION_KEY",
  ],
  jivetel: ["JIVETEL_API_KEY"],
  make: ["MAKE_WEBHOOK_SECRET", "MAKE_OUTBOUND_WEBHOOK_URL"],
  pandadoc: ["PANDADOC_API_KEY", "PANDADOC_WEBHOOK_SECRET"],
  leadtrap: ["LEADTRAP_WEBHOOK_SECRET"],
  calendly: ["CALENDLY_CLIENT_ID", "CALENDLY_CLIENT_SECRET", "CALENDLY_WEBHOOK_SIGNING_KEY"],
  viventium: ["VIVENTIUM_API_KEY"],
  "google-ads": [
    "GOOGLE_ADS_DEVELOPER_TOKEN",
    "GOOGLE_ADS_CLIENT_ID",
    "GOOGLE_ADS_CLIENT_SECRET",
    "GOOGLE_ADS_REFRESH_TOKEN",
  ],
  "meta-ads": ["META_ADS_ACCESS_TOKEN", "META_ADS_AD_ACCOUNT_ID"],
  fathom: ["FATHOM_API_KEY"],
  bloomgrowth: ["BLOOMGROWTH_API_KEY"],
  "go-integrate-nava": ["GO_INTEGRATE_NAVA_API_KEY", "GO_INTEGRATE_NAVA_WEBHOOK_SECRET"],
};

// Some installations historically used SOLOM_API_KEY (typo). Accept either.
function readSecretWithAlias(name: string): string | undefined {
  const v = Deno.env.get(name);
  if (v) return v;
  if (name === "SOLUM_API_KEY") return Deno.env.get("SOLOM_API_KEY") ?? undefined;
  return undefined;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function isAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  const roles = (data ?? []).map((r: any) => r.role);
  return roles.some((r: string) =>
    ["super_admin", "admin", "systems_admin"].includes(r),
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader) return json({ error: "Unauthorized" }, 401);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
  const token = authHeader.replace(/^Bearer\s+/i, "");
  const { data: userData } = await supabase.auth.getUser(token);
  const user = userData?.user;
  if (!user) return json({ error: "Unauthorized" }, 401);
  if (!(await isAdmin(supabase, user.id))) return json({ error: "Forbidden" }, 403);

  let body: any = {};
  try {
    body = await req.json();
  } catch (_) {
    /* allow empty */
  }
  const integrationId: string | undefined = body?.integrationId;
  if (!integrationId) return json({ error: "integrationId required" }, 400);

  const required = REQUIRED_SECRETS[integrationId] ?? [];
  const missing = required.filter((name) => !readSecretWithAlias(name));

  const now = new Date().toISOString();

  async function persist(update: Record<string, unknown>) {
    await supabase
      .from("integration_connections")
      .update({ last_tested_at: now, ...update })
      .eq("integration_id", integrationId)
      .eq("environment", "production");
  }

  if (missing.length > 0) {
    await persist({
      status: "not_configured",
      last_error_at: now,
      last_error: `Missing required secret(s): ${missing.join(", ")}`,
    });
    return json({
      ok: false,
      integrationId,
      status: "not_configured",
      message: `Missing required secret(s): ${missing.join(", ")}`,
      details: { requiredSecrets: required, missing },
    });
  }

  // Real lightweight provider probes.
  try {
    if (integrationId === "retell") {
      const res = await fetch("https://api.retellai.com/list-agents", {
        headers: { Authorization: `Bearer ${Deno.env.get("RETELL_API_KEY")}` },
      });
      const ok = res.ok;
      await persist({
        status: ok ? "connected" : "error",
        last_success_at: ok ? now : null,
        last_error_at: ok ? null : now,
        last_error: ok ? null : `Retell API ${res.status}`,
      });
      return json({ ok, integrationId, status: ok ? "connected" : "error", message: ok ? "Retell API reachable" : `Retell API ${res.status}`, details: { httpStatus: res.status } });
    }
    if (integrationId === "resend") {
      const res = await fetch("https://api.resend.com/domains", {
        headers: { Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}` },
      });
      const ok = res.ok;
      await persist({
        status: ok ? "connected" : "error",
        last_success_at: ok ? now : null,
        last_error_at: ok ? null : now,
        last_error: ok ? null : `Resend API ${res.status}`,
      });
      return json({ ok, integrationId, status: ok ? "connected" : "error", message: ok ? "Resend API reachable" : `Resend API ${res.status}`, details: { httpStatus: res.status } });
    }
    if (integrationId === "mailchimp") {
      const prefix = Deno.env.get("MAILCHIMP_SERVER_PREFIX");
      const res = await fetch(`https://${prefix}.api.mailchimp.com/3.0/ping`, {
        headers: { Authorization: `Basic ${btoa(`anystring:${Deno.env.get("MAILCHIMP_API_KEY")}`)}` },
      });
      const ok = res.ok;
      await persist({
        status: ok ? "connected" : "error",
        last_success_at: ok ? now : null,
        last_error_at: ok ? null : now,
        last_error: ok ? null : `Mailchimp API ${res.status}`,
      });
      return json({ ok, integrationId, status: ok ? "connected" : "error", message: ok ? "Mailchimp API reachable" : `Mailchimp API ${res.status}`, details: { httpStatus: res.status } });
    }
    if (integrationId === "ms365") {
      // ms365 user-specific test is via microsoft-graph-probe; here just confirm config.
      await persist({ status: "configured", last_success_at: now, last_error: null, last_error_at: null });
      return json({ ok: true, integrationId, status: "configured", message: "Microsoft 365 config present. Each user connects via /microsoft-oauth-start, tested via /microsoft-graph-probe.", details: { requiredSecrets: required } });
    }
  } catch (e) {
    await persist({ status: "error", last_error_at: now, last_error: e instanceof Error ? e.message : String(e) });
    return json({ ok: false, integrationId, status: "error", message: e instanceof Error ? e.message : String(e) });
  }

  await persist({ status: "configured_pending_probe", last_success_at: null, last_error: null, last_error_at: null });
  return json({
    ok: true,
    integrationId,
    status: "configured_pending_probe",
    message: "Required secrets present. Deep provider probe not yet implemented.",
    details: { requiredSecrets: required },
  });
});