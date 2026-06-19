// Microsoft 365 / Outlook OAuth — per-user start.
// Builds the Microsoft authorize URL with `offline_access`, profile, mail
// and calendar scopes, and a signed state carrying the user id.
import { createClient } from "npm:@supabase/supabase-js@2";
import { generateOauthStateNonce, hashOauthState } from "../_shared/microsoftTokenVault.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CLIENT_ID = Deno.env.get("MICROSOFT_CLIENT_ID") ?? "";
const TENANT = Deno.env.get("MICROSOFT_TENANT_ID") ?? "common";
const REDIRECT_URI = Deno.env.get("MICROSOFT_REDIRECT_URI") ?? "";
const SCOPES = [
  "offline_access",
  "User.Read",
  "Mail.ReadWrite",
  "Calendars.ReadWrite",
];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
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

  if (!CLIENT_ID || !REDIRECT_URI) {
    return json({
      ok: false,
      status: "not_configured",
      message:
        "MICROSOFT_CLIENT_ID and MICROSOFT_REDIRECT_URI must be configured before per-user Outlook OAuth can begin.",
    });
  }

  // Upsert a pending OAuth row so the callback has somewhere to land.
  await supabase
    .from("integration_oauth_connections")
    .upsert(
      {
        integration_id: "ms365",
        user_id: user.id,
        scopes: SCOPES,
        status: "pending",
        metadata: { initiated_at: new Date().toISOString() },
      },
      { onConflict: "integration_id,user_id" },
    );

  // Generate a cryptographically random OAuth state nonce. We persist only
  // a SHA-256 hash of it, scoped to this user, so the callback can validate
  // the returned state server-side without trusting any user id encoded in
  // the browser redirect.
  const stateNonce = generateOauthStateNonce(32);
  const stateHash = await hashOauthState(stateNonce);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const { error: stateErr } = await supabase
    .from("integration_oauth_states")
    .insert({
      integration_id: "ms365",
      user_id: user.id,
      state_hash: stateHash,
      expires_at: expiresAt,
      metadata: { source: "microsoft-oauth-start" },
    });
  if (stateErr) {
    return json({ ok: false, error: `state_persist_failed: ${stateErr.message}` }, 500);
  }

  const authorizeUrl = new URL(
    `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/authorize`,
  );
  authorizeUrl.searchParams.set("client_id", CLIENT_ID);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authorizeUrl.searchParams.set("response_mode", "query");
  authorizeUrl.searchParams.set("scope", SCOPES.join(" "));
  authorizeUrl.searchParams.set("state", stateNonce);
  authorizeUrl.searchParams.set("prompt", "select_account");

  return json({ ok: true, authorizeUrl: authorizeUrl.toString() });
});