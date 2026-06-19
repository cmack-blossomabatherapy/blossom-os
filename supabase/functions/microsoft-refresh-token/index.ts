// Refresh a user's Microsoft OAuth access token using the encrypted refresh
// token stored in `integration_oauth_token_vault`. Never returns raw tokens
// to the caller — only safe expiry/status metadata.
import { createClient } from "npm:@supabase/supabase-js@2";
import { encryptToken, decryptToken } from "../_shared/oauthTokenCrypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CLIENT_ID = Deno.env.get("MICROSOFT_CLIENT_ID") ?? "";
const CLIENT_SECRET = Deno.env.get("MICROSOFT_CLIENT_SECRET") ?? "";
const TENANT = Deno.env.get("MICROSOFT_TENANT_ID") ?? "common";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export async function refreshUserToken(
  supabase: any,
  userId: string,
): Promise<{ ok: boolean; expires_at?: string | null; error?: string }> {
  const { data: conn } = await supabase
    .from("integration_oauth_connections")
    .select("id")
    .eq("integration_id", "ms365")
    .eq("user_id", userId)
    .maybeSingle();
  if (!conn) return { ok: false, error: "no_connection" };

  const { data: vault } = await supabase
    .from("integration_oauth_token_vault")
    .select("refresh_token_ciphertext")
    .eq("oauth_connection_id", conn.id)
    .maybeSingle();
  if (!vault?.refresh_token_ciphertext) return { ok: false, error: "no_refresh_token" };

  let refreshToken: string;
  try {
    refreshToken = await decryptToken(vault.refresh_token_ciphertext);
  } catch (e) {
    return { ok: false, error: `decrypt_failed: ${e instanceof Error ? e.message : e}` };
  }

  const res = await fetch(
    `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    },
  );
  const data = await res.json();
  if (!res.ok) {
    await supabase
      .from("integration_oauth_connections")
      .update({ status: "needs_attention", last_error: `refresh_failed: ${data?.error_description ?? data?.error ?? res.status}` })
      .eq("id", conn.id);
    return { ok: false, error: data?.error_description ?? data?.error ?? "refresh_failed" };
  }

  const accessCipher = data.access_token ? await encryptToken(data.access_token) : null;
  const newRefreshCipher = data.refresh_token
    ? await encryptToken(data.refresh_token)
    : vault.refresh_token_ciphertext;
  const expiresAt = data.expires_in
    ? new Date(Date.now() + data.expires_in * 1000).toISOString()
    : null;

  await supabase
    .from("integration_oauth_token_vault")
    .update({
      access_token_ciphertext: accessCipher,
      refresh_token_ciphertext: newRefreshCipher,
      expires_at: expiresAt,
      last_refresh_at: new Date().toISOString(),
    })
    .eq("oauth_connection_id", conn.id);

  await supabase
    .from("integration_oauth_connections")
    .update({
      status: "connected",
      expires_at: expiresAt,
      last_error: null,
      last_connected_at: new Date().toISOString(),
    })
    .eq("id", conn.id);

  return { ok: true, expires_at: expiresAt };
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

  const result = await refreshUserToken(supabase, user.id);
  return json(result, result.ok ? 200 : 400);
});