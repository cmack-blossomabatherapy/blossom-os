// Microsoft 365 / Outlook OAuth callback.
// Exchanges the auth code for tokens, encrypts them with AES-GCM using
// OAUTH_TOKEN_ENCRYPTION_KEY, and stores the ciphertext in the service-role-only
// `integration_oauth_token_vault`. Raw tokens never reach the browser or the
// `integration_oauth_connections` row.
import { createClient } from "npm:@supabase/supabase-js@2";
import { encryptToken } from "../_shared/oauthTokenCrypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CLIENT_ID = Deno.env.get("MICROSOFT_CLIENT_ID") ?? "";
const CLIENT_SECRET = Deno.env.get("MICROSOFT_CLIENT_SECRET") ?? "";
const TENANT = Deno.env.get("MICROSOFT_TENANT_ID") ?? "common";
const REDIRECT_URI = Deno.env.get("MICROSOFT_REDIRECT_URI") ?? "";

function html(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");
  if (!code || !stateParam) {
    return html("<h1>Outlook connection failed</h1><p>Missing code or state.</p>", 400);
  }

  let userId: string | undefined;
  try {
    const decoded = JSON.parse(atob(stateParam));
    userId = decoded?.u;
  } catch (_) {
    return html("<h1>Outlook connection failed</h1><p>Invalid state.</p>", 400);
  }
  if (!userId) return html("<h1>Outlook connection failed</h1><p>Invalid state.</p>", 400);

  if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
    return html(
      "<h1>Outlook OAuth not configured</h1><p>MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, and MICROSOFT_REDIRECT_URI must be set.</p>",
      500,
    );
  }

  // Exchange code for tokens.
  const tokenRes = await fetch(
    `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    },
  );
  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) {
    return html(
      `<h1>Outlook token exchange failed</h1><pre>${JSON.stringify(tokenData, null, 2)}</pre>`,
      502,
    );
  }

  // Probe user identity.
  let providerEmail: string | null = null;
  let providerName: string | null = null;
  let providerUserId: string | null = null;
  try {
    const meRes = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (meRes.ok) {
      const me = await meRes.json();
      providerEmail = me?.mail ?? me?.userPrincipalName ?? null;
      providerName = me?.displayName ?? null;
      providerUserId = me?.id ?? null;
    }
  } catch (_) {
    /* non-fatal */
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  // 1. Encrypt tokens BEFORE we touch the database. If this fails, do not
  //    mark the connection as connected — surface needs_attention instead.
  let accessCipher: string | null = null;
  let refreshCipher: string | null = null;
  let vaultError: string | null = null;
  try {
    if (tokenData.access_token) accessCipher = await encryptToken(tokenData.access_token);
    if (tokenData.refresh_token) refreshCipher = await encryptToken(tokenData.refresh_token);
  } catch (e) {
    vaultError = e instanceof Error ? e.message : String(e);
    console.error("[microsoft-oauth-callback] token encryption failed", vaultError);
  }

  const expiresAt = tokenData.expires_in
    ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
    : null;
  const scopes = (tokenData.scope ?? "").split(" ").filter(Boolean);
  const connectionStatus = vaultError ? "needs_attention" : "connected";

  const { data: connRow, error: connErr } = await supabase
    .from("integration_oauth_connections")
    .upsert(
    {
      integration_id: "ms365",
      user_id: userId,
      provider_email: providerEmail,
      provider_user_id: providerUserId,
      display_name: providerName,
        scopes,
        status: connectionStatus,
        expires_at: expiresAt,
      last_connected_at: new Date().toISOString(),
        last_error: vaultError ? `token_storage_failed: ${vaultError}` : null,
        // Raw tokens are NEVER stored on this row — only safe metadata.
      metadata: {
          token_persistence: vaultError ? "failed" : "vault",
        scope_granted: tokenData.scope ?? null,
          token_key_version: "v1",
      },
      },
      { onConflict: "integration_id,user_id" },
    )
    .select("id")
    .single();

  if (connErr || !connRow) {
    return html(
      `<h1>Outlook connection failed</h1><pre>${connErr?.message ?? "no row"}</pre>`,
      500,
    );
  }

  // 2. Upsert the encrypted token row into the vault (service-role-only table).
  if (!vaultError) {
    const { error: vaultErr } = await supabase
      .from("integration_oauth_token_vault")
      .upsert(
        {
          oauth_connection_id: connRow.id,
          integration_id: "ms365",
          user_id: userId,
          provider_user_id: providerUserId,
          access_token_ciphertext: accessCipher,
          refresh_token_ciphertext: refreshCipher,
          token_type: tokenData.token_type ?? "Bearer",
          scopes,
          expires_at: expiresAt,
          last_refresh_at: new Date().toISOString(),
          key_version: "v1",
        },
        { onConflict: "oauth_connection_id" },
      );
    if (vaultErr) {
      await supabase
        .from("integration_oauth_connections")
        .update({
          status: "needs_attention",
          last_error: `vault_write_failed: ${vaultErr.message}`,
          metadata: { token_persistence: "failed" },
        })
        .eq("id", connRow.id);
      return html(
        `<h1>Outlook connection partially completed</h1><p>Tokens could not be stored securely. Please try again.</p>`,
        500,
      );
    }
  }

  return html(
    `<!doctype html><html><body style="font-family: -apple-system, system-ui, sans-serif; max-width:480px; margin:80px auto; text-align:center;">
      <h1 style="font-size:20px;">Outlook connected</h1>
      <p>You can close this window and return to Blossom OS.</p>
      <script>setTimeout(()=>window.close(),1500);</script>
    </body></html>`,
  );
});