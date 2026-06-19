// Per-user Microsoft Mail ACTIVITY sync. Captures only safe metadata —
// subject preview, from/to addresses, conversation id, date. Body content
// is intentionally NOT persisted. Tokens are NEVER returned to the client.
import { createClient } from "npm:@supabase/supabase-js@2";
import { refreshUserToken } from "../_shared/microsoftTokenVault.ts";
import { decryptToken } from "../_shared/oauthTokenCrypto.ts";
import { upsertNormalizedRecord } from "../_shared/integrations/normalizers.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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

  const refreshed = await refreshUserToken(supabase, user.id);
  if (!refreshed.ok) return json({ ok: false, error: refreshed.error });

  const { data: conn } = await supabase
    .from("integration_oauth_connections").select("id")
    .eq("integration_id", "ms365").eq("user_id", user.id).maybeSingle();
  if (!conn) return json({ ok: false, error: "no_connection" });
  const { data: vault } = await supabase
    .from("integration_oauth_token_vault").select("access_token_ciphertext")
    .eq("oauth_connection_id", conn.id).maybeSingle();
  if (!vault?.access_token_ciphertext) return json({ ok: false, error: "no_access_token" });

  let accessToken: string;
  try { accessToken = await decryptToken(vault.access_token_ciphertext); }
  catch (e) { return json({ ok: false, error: `decrypt_failed: ${e instanceof Error ? e.message : e}` }); }

  // Safe metadata only — no body content.
  const res = await fetch(
    "https://graph.microsoft.com/v1.0/me/messages?$top=25&$select=id,subject,from,toRecipients,receivedDateTime,conversationId,webLink",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return json({ ok: false, error: data?.error?.message ?? `HTTP ${res.status}` });

  const msgs: any[] = data?.value ?? [];
  let created = 0;
  for (const m of msgs) {
    const up = await upsertNormalizedRecord({ supabase }, "ms365", {
      providerRecordId: m.id,
      recordKind: "email_activity",
      displayTitle: (m.subject ?? "").slice(0, 120) || "(no subject)",
      occurredAt: m.receivedDateTime ?? null,
      personEmail: m.from?.emailAddress?.address ?? null,
      personName: m.from?.emailAddress?.name ?? null,
      externalUrl: m.webLink ?? null,
      sourceLabel: "Microsoft Outlook Mail",
      metadata: {
        user_id: user.id,
        conversation_id: m.conversationId,
        to_addresses: (m.toRecipients ?? []).map((r: any) => r?.emailAddress?.address).filter(Boolean),
      },
    });
    if (up.ok) created += 1;
  }
  return json({ ok: true, received: msgs.length, created });
});