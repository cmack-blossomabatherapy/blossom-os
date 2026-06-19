// Microsoft 365 / Outlook OAuth callback.
// Exchanges the auth code for tokens and stores ONLY metadata + secret
// references in `integration_oauth_connections`. Raw tokens are not
// persisted in this Pass 1 — token persistence is gated on the secure
// per-user secret pattern being finalized (see QA manifest).
import { createClient } from "npm:@supabase/supabase-js@2";

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
  await supabase.from("integration_oauth_connections").upsert(
    {
      integration_id: "ms365",
      user_id: userId,
      provider_email: providerEmail,
      provider_user_id: providerUserId,
      display_name: providerName,
      scopes: (tokenData.scope ?? "").split(" ").filter(Boolean),
      status: "connected",
      expires_at: tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null,
      last_connected_at: new Date().toISOString(),
      // NOTE: raw tokens are intentionally NOT stored in this table.
      // Token persistence is gated on the per-user secret pattern decision.
      metadata: {
        token_persistence: "pending",
        scope_granted: tokenData.scope ?? null,
      },
    },
    { onConflict: "integration_id,user_id" },
  );

  return html(
    `<!doctype html><html><body style="font-family: -apple-system, system-ui, sans-serif; max-width:480px; margin:80px auto; text-align:center;">
      <h1 style="font-size:20px;">Outlook connected</h1>
      <p>You can close this window and return to Blossom OS.</p>
      <script>setTimeout(()=>window.close(),1500);</script>
    </body></html>`,
  );
});