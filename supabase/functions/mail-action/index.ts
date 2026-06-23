// Email Command Center — execute an approved action queue item.
// Every external send/forward/archive/calendar/Teams action goes through here.
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

// Outlook helpers --------------------------------------------------------
async function getAccess(supabase: any, userId: string) {
  const refreshed = await refreshUserToken(supabase, userId);
  if (!refreshed.ok) throw new Error(refreshed.error ?? "no_connection");
  const { data: conn } = await supabase
    .from("integration_oauth_connections").select("id")
    .eq("integration_id", "ms365").eq("user_id", userId).maybeSingle();
  if (!conn) throw new Error("no_connection");
  const { data: vault } = await supabase
    .from("integration_oauth_token_vault").select("access_token_ciphertext")
    .eq("oauth_connection_id", conn.id).maybeSingle();
  if (!vault?.access_token_ciphertext) throw new Error("no_access_token");
  return await decryptToken(vault.access_token_ciphertext);
}

async function graphCall(token: string, path: string, init: RequestInit) {
  const res = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Graph ${res.status}: ${txt.slice(0, 240)}`);
  }
  return res;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader) return json({ ok: false, error: "Unauthorized" }, 401);
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: userData } = await supabase.auth.getUser(authHeader.replace(/^Bearer\s+/i, ""));
  const user = userData?.user;
  if (!user) return json({ ok: false, error: "Unauthorized" }, 401);

  let body: any = {};
  try { body = await req.json(); } catch {}
  const queueId = String(body.queueId ?? "").trim();
  const edits = (body.edits ?? {}) as Record<string, any>;
  if (!queueId) return json({ ok: false, error: "queueId required" }, 400);

  const { data: queue } = await supabase
    .from("email_action_queue").select("*").eq("id", queueId).eq("user_id", user.id).maybeSingle();
  if (!queue) return json({ ok: false, error: "queue_not_found" }, 404);
  if (queue.status !== "pending_approval") {
    return json({ ok: false, error: `already_${queue.status}` }, 400);
  }

  const payload = { ...(queue.action_payload ?? {}), ...edits };
  const { data: item } = await supabase
    .from("email_command_items").select("*").eq("id", queue.email_command_item_id).maybeSingle();

  async function recordAudit(status: string, summary: string, errorMessage: string | null) {
    await supabase.from("email_action_audit").insert({
      email_command_item_id: queue.email_command_item_id,
      action_queue_id: queue.id,
      actor_user_id: user.id,
      action_type: queue.action_type,
      provider: queue.action_type.startsWith("teams") ? "teams"
        : queue.action_type.startsWith("calendar") ? "outlook_calendar"
        : queue.action_type.startsWith("outlook") ? "outlook" : "internal",
      status,
      payload_summary: summary,
      error_message: errorMessage,
    });
  }

  try {
    // Internal-only actions (no external API).
    if (queue.action_type === "internal_reminder" || queue.action_type === "escalation") {
      await supabase.from("email_action_queue").update({
        status: "completed",
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      }).eq("id", queue.id);
      await recordAudit("completed", `Internal action ${queue.action_type}`, null);
      return json({ ok: true, status: "completed" });
    }

    // Teams + calendar write support is opt-in via env flag.
    const teamsEnabled = (Deno.env.get("EMAIL_CC_TEAMS_WRITE") ?? "") === "1";
    const calendarEnabled = (Deno.env.get("EMAIL_CC_CALENDAR_WRITE") ?? "") === "1";

    if (queue.action_type.startsWith("teams") && !teamsEnabled) {
      await recordAudit("needs_configuration", "Teams write not configured", "EMAIL_CC_TEAMS_WRITE not set");
      return json({ ok: false, error: "Needs Teams configuration" });
    }
    if (queue.action_type.startsWith("calendar") && !calendarEnabled) {
      await recordAudit("needs_configuration", "Calendar write not configured", "EMAIL_CC_CALENDAR_WRITE not set");
      return json({ ok: false, error: "Needs Calendar configuration" });
    }

    const token = await getAccess(supabase, user.id);
    const msgId = item?.external_message_id;

    switch (queue.action_type) {
      case "outlook_reply": {
        if (!msgId) throw new Error("missing_message_id");
        await graphCall(token, `/me/messages/${encodeURIComponent(msgId)}/reply`, {
          method: "POST",
          body: JSON.stringify({ comment: payload.comment ?? payload.draft_text ?? "" }),
        });
        break;
      }
      case "outlook_forward": {
        if (!msgId) throw new Error("missing_message_id");
        await graphCall(token, `/me/messages/${encodeURIComponent(msgId)}/forward`, {
          method: "POST",
          body: JSON.stringify({
            comment: payload.comment ?? "",
            toRecipients: (payload.toRecipients ?? []).map((e: string) => ({ emailAddress: { address: e } })),
          }),
        });
        break;
      }
      case "outlook_archive": {
        if (!msgId) throw new Error("missing_message_id");
        await graphCall(token, `/me/messages/${encodeURIComponent(msgId)}/move`, {
          method: "POST",
          body: JSON.stringify({ destinationId: "archive" }),
        });
        break;
      }
      case "outlook_categorize": {
        if (!msgId) throw new Error("missing_message_id");
        await graphCall(token, `/me/messages/${encodeURIComponent(msgId)}`, {
          method: "PATCH",
          body: JSON.stringify({ categories: payload.categories ?? ["Blossom OS"] }),
        });
        break;
      }
      case "calendar_event":
      case "calendar_reminder": {
        await graphCall(token, "/me/events", {
          method: "POST",
          body: JSON.stringify({
            subject: payload.subject ?? item?.subject ?? "Follow up",
            body: { contentType: "Text", content: payload.body ?? "" },
            start: { dateTime: payload.startDateTime, timeZone: payload.timeZone ?? "Eastern Standard Time" },
            end: { dateTime: payload.endDateTime, timeZone: payload.timeZone ?? "Eastern Standard Time" },
            attendees: (payload.attendees ?? []).map((e: string) => ({ emailAddress: { address: e }, type: "required" })),
          }),
        });
        break;
      }
      case "teams_message": {
        if (!payload.teamId || !payload.channelId) throw new Error("teamId/channelId required");
        await graphCall(token, `/teams/${payload.teamId}/channels/${payload.channelId}/messages`, {
          method: "POST",
          body: JSON.stringify({ body: { contentType: "html", content: payload.content ?? "" } }),
        });
        break;
      }
      default:
        throw new Error(`unknown_action_type:${queue.action_type}`);
    }

    await supabase.from("email_action_queue").update({
      status: "completed",
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    }).eq("id", queue.id);
    await recordAudit("completed", `${queue.action_type} sent`, null);
    return json({ ok: true, status: "completed" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await supabase.from("email_action_queue").update({
      status: "failed",
      error_message: msg,
    }).eq("id", queue.id);
    await recordAudit("failed", `${queue.action_type} failed`, msg);
    return json({ ok: false, error: msg });
  }
});