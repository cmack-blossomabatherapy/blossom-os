// Authenticated user probe: confirms the current user's Microsoft Outlook
// connection works by decrypting their access token server-side, refreshing
// it if expired, and calling Microsoft Graph /me. Returns ONLY safe metadata
// (provider email, display name, scopes, expiry, status). Never returns tokens.
import { createClient } from "npm:@supabase/supabase-js@2";
import { decryptToken } from "../_shared/oauthTokenCrypto.ts";
import { refreshUserToken } from "../_shared/microsoftTokenVault.ts";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader) return json({ ok: false, error: "Unauthorized" }, 401);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
  const token = authHeader.replace(/^Bearer\s+/i, "");
  const { data: userData } = await supabase.auth.getUser(token);
  const user = userData?.user;
  if (!user) return json({ ok: false, error: "Unauthorized" }, 401);

  const { data: conn } = await supabase
    .from("integration_oauth_connections")
    .select("id, provider_email, display_name, scopes, expires_at, status, last_error")
    .eq("integration_id", "ms365")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!conn) return json({ ok: false, status: "not_connected", error: "Outlook not connected" }, 404);

  const { data: vault } = await supabase
    .from("integration_oauth_token_vault")
    .select("access_token_ciphertext, expires_at")
    .eq("oauth_connection_id", conn.id)
    .maybeSingle();

  if (!vault?.access_token_ciphertext) {
    return json({ ok: false, status: "needs_attention", error: "no_token_in_vault" }, 400);
  }

  // Refresh if expired (or within 60s).
  const expMs = vault.expires_at ? new Date(vault.expires_at).getTime() : 0;
  let accessToken: string;
  if (expMs - Date.now() < 60_000) {
    const r = await refreshUserToken(supabase, user.id);
    if (!r.ok) return json({ ok: false, status: "needs_attention", error: r.error }, 400);
    const { data: fresh } = await supabase
      .from("integration_oauth_token_vault")
      .select("access_token_ciphertext")
      .eq("oauth_connection_id", conn.id)
      .maybeSingle();
    if (!fresh?.access_token_ciphertext) {
      return json({ ok: false, status: "needs_attention", error: "post_refresh_token_missing" }, 400);
    }
    accessToken = await decryptToken(fresh.access_token_ciphertext);
  } else {
    accessToken = await decryptToken(vault.access_token_ciphertext);
  }

  const meRes = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!meRes.ok) {
    await supabase
      .from("integration_oauth_connections")
      .update({ status: "needs_attention", last_error: `graph_probe_${meRes.status}` })
      .eq("id", conn.id);
    return json({ ok: false, status: "needs_attention", error: `graph_${meRes.status}` }, 400);
  }
  const me = await meRes.json();

  return json({
    ok: true,
    status: "connected",
    provider_email: me?.mail ?? me?.userPrincipalName ?? conn.provider_email,
    display_name: me?.displayName ?? conn.display_name,
    scopes: conn.scopes,
    expires_at: conn.expires_at,
  });
});