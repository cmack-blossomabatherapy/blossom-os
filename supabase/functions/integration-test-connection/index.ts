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
  ctm: ["CTM_API_KEY"],
  apploi: ["APPLOI_API_KEY"],
  centralreach: ["CENTRALREACH_CLIENT_ID", "CENTRALREACH_CLIENT_SECRET"],
  solum: ["SOLUM_API_KEY"],
  eligipro: ["ELIGIPRO_API_KEY"],
  ms365: ["MICROSOFT_CLIENT_ID", "MICROSOFT_CLIENT_SECRET", "MICROSOFT_TENANT_ID"],
  jivetel: ["JIVETEL_API_KEY"],
  make: ["MAKE_WEBHOOK_SECRET"],
  pandadoc: ["PANDADOC_API_KEY"],
  leadtrap: ["LEADTRAP_WEBHOOK_SECRET"],
  calendly: ["CALENDLY_CLIENT_ID", "CALENDLY_CLIENT_SECRET"],
};

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
  const missing = required.filter((name) => !Deno.env.get(name));

  const now = new Date().toISOString();
  const baseUpdate = {
    last_tested_at: now,
  };

  if (missing.length > 0) {
    return json({
      ok: false,
      integrationId,
      status: "not_configured",
      message: `Missing required secret(s): ${missing.join(", ")}`,
      details: { requiredSecrets: required, missing },
    });
  }

  // For Retell we can do a real lightweight ping.
  if (integrationId === "retell") {
    try {
      const res = await fetch("https://api.retellai.com/list-agents", {
        headers: { Authorization: `Bearer ${Deno.env.get("RETELL_API_KEY")}` },
      });
      return json({
        ok: res.ok,
        integrationId,
        status: res.ok ? "connected" : "error",
        message: res.ok ? "Retell API reachable" : `Retell API ${res.status}`,
        details: { httpStatus: res.status },
      });
    } catch (e) {
      return json({
        ok: false,
        integrationId,
        status: "error",
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return json({
    ok: true,
    integrationId,
    status: required.length > 0 ? "configured" : "not_implemented",
    message:
      required.length > 0
        ? "Required secrets present. Deep provider probe not yet implemented."
        : "No provider probe implemented for this integration yet.",
    details: { requiredSecrets: required, ...baseUpdate },
  });
});