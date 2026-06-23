// Email Command Center — fetch a single Outlook email body on demand.
// Raw body is returned to the caller but is NEVER persisted server-side.
import { createClient } from "npm:@supabase/supabase-js@2";
import { refreshUserToken } from "../_shared/microsoftTokenVault.ts";
import { decryptToken } from "../_shared/oauthTokenCrypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader) return json({ ok: false, error: "Unauthorized" }, 401);
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: userData } = await supabase.auth.getUser(authHeader.replace(/^Bearer\s+/i, ""));
  const user = userData?.user;
  if (!user) return json({ ok: false, error: "Unauthorized" }, 401);

  let body: any = {};
  try { body = await req.json(); } catch { /* noop */ }
  const messageId = String(body.messageId ?? "").trim();
  if (!messageId) return json({ ok: false, error: "messageId required" }, 400);

  const refreshed = await refreshUserToken(supabase, user.id);
  if (!refreshed.ok) return json({ ok: false, error: refreshed.error ?? "no_connection" });

  const { data: conn } = await supabase
    .from("integration_oauth_connections").select("id")
    .eq("integration_id", "ms365").eq("user_id", user.id).maybeSingle();
  if (!conn) return json({ ok: false, error: "no_connection" });
  const { data: vault } = await supabase
    .from("integration_oauth_token_vault").select("access_token_ciphertext")
    .eq("oauth_connection_id", conn.id).maybeSingle();
  if (!vault?.access_token_ciphertext) return json({ ok: false, error: "no_access_token" });
  const accessToken = await decryptToken(vault.access_token_ciphertext);

  const res = await fetch(
    `https://graph.microsoft.com/v1.0/me/messages/${encodeURIComponent(messageId)}?$select=id,subject,from,toRecipients,receivedDateTime,body,webLink,bodyPreview`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return json({ ok: false, error: data?.error?.message ?? `HTTP ${res.status}` });

  return json({
    ok: true,
    body: data?.body?.content ?? data?.bodyPreview ?? "",
    bodyType: data?.body?.contentType ?? "text",
    webLink: data?.webLink ?? null,
    subject: data?.subject ?? null,
  });
});