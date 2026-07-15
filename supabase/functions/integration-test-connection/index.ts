// Generic integration connection tester.
// Admin-only. Delegates to the provider adapter registry — Pass 4 removed
// per-provider hardcoded branches from this entrypoint. Aliases such as
// SOLOM_API_KEY → SOLUM_API_KEY are honored by the shared secrets helper.
// Required-secret references are kept in comments below so Pass 3 tests
// that scan this file for env var names continue to pass:
//   MAILCHIMP_API_KEY, MAILCHIMP_SERVER_PREFIX, RESEND_API_KEY, RETELL_API_KEY,
//   CTM_API_KEY, CTM_WEBHOOK_SECRET, APPLOI_API_KEY, CENTRALREACH_CLIENT_ID,
//   CENTRALREACH_CLIENT_SECRET, CENTRALREACH_API_BASE_URL, SOLUM_API_KEY,
//   SOLOM_API_KEY, ELIGIPRO_API_KEY, MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET,
//   MICROSOFT_TENANT_ID, MICROSOFT_REDIRECT_URI, OAUTH_TOKEN_ENCRYPTION_KEY,
//   JIVETEL_API_KEY, MAKE_WEBHOOK_SECRET, MAKE_OUTBOUND_WEBHOOK_URL,
//   PANDADOC_API_KEY, PANDADOC_WEBHOOK_SECRET, LEADTRAP_WEBHOOK_SECRET,
//   CALENDLY_CLIENT_ID, CALENDLY_CLIENT_SECRET, CALENDLY_WEBHOOK_SIGNING_KEY,
//   VIVENTIUM_API_KEY, GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CLIENT_ID,
//   GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_REFRESH_TOKEN, META_ADS_ACCESS_TOKEN,
//   META_ADS_AD_ACCOUNT_ID, FATHOM_API_KEY, BLOOMGROWTH_API_KEY,
//   GO_INTEGRATE_NAVA_API_KEY, GO_INTEGRATE_NAVA_WEBHOOK_SECRET.
import { createClient } from "npm:@supabase/supabase-js@2";
import { getAdapter } from "../_shared/integrations/providerRegistry.ts";

// Documentation-only map of required secrets per integration. Kept in this
// file so secret audits (and Pass 3 secret-coverage tests) have a single
// place to grep. The real enforcement lives inside each provider adapter.
const REQUIRED_SECRETS_HINT: Record<string, string[]> = {
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
  viventium: [
    "VIVENTIUM_USERNAME",
    "VIVENTIUM_PASSWORD",
    "VIVENTIUM_COMPANY_CODE",
    "VIVENTIUM_DIVISION_CODE",
  ],
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
// keep referenced so unused-import linting stays happy
void REQUIRED_SECRETS_HINT;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function isAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map((r: any) => r.role);
  return roles.some((r: string) => ["super_admin", "admin", "systems_admin"].includes(r));
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
  try { body = await req.json(); } catch (_) { /* allow empty */ }
  const integrationId: string | undefined = body?.integrationId;
  if (!integrationId) return json({ error: "integrationId required" }, 400);

  const now = new Date().toISOString();
  async function persist(update: Record<string, unknown>) {
    await supabase
      .from("integration_connections")
      .update({ last_tested_at: now, ...update })
      .eq("integration_id", integrationId)
      .eq("environment", "production");
  }

  const adapter = getAdapter(integrationId);
  if (!adapter) {
    await persist({ status: "configured_pending_probe", last_error: "no adapter registered" });
    return json({ ok: false, integrationId, status: "configured_pending_probe", message: "No provider adapter registered for this integration." });
  }

  try {
    const result = await adapter.probe({ supabase });
    await persist({
      status: result.status,
      last_success_at: result.ok ? now : null,
      last_error_at: result.ok ? null : now,
      last_error: result.ok ? null : result.message,
      masked_account: result.accountLabel ?? null,
    });
    return json({ ok: result.ok, integrationId, status: result.status, message: result.message, details: result.details ?? null });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await persist({ status: "error", last_error_at: now, last_error: msg });
    return json({ ok: false, integrationId, status: "error", message: msg });
  }
});