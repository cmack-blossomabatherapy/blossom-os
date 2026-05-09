import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:alerts@example.com";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

type AlertRow = {
  id: string;
  category: string;
  title: string;
  message: string | null;
  deep_link: string;
  assignee_user_id: string | null;
  push_attempts: number;
};

type SubRow = { id: string; endpoint: string; p256dh: string; auth: string; user_id: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Find newly critical overdue alerts not yet pushed
  const { data: alerts, error: alertsErr } = await admin
    .from("critical_alerts")
    .select("id, category, title, message, deep_link, assignee_user_id, push_attempts")
    .eq("severity", "critical")
    .eq("status", "open")
    .lte("due_at", new Date().toISOString())
    .is("pushed_at", null)
    .lt("push_attempts", 5)
    .limit(100);

  if (alertsErr) {
    return new Response(JSON.stringify({ error: alertsErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  let pushed = 0;
  let failed = 0;
  const expiredEndpoints: string[] = [];

  for (const alert of (alerts ?? []) as AlertRow[]) {
    // Pick recipients: assignee if present, else all admins
    let recipientIds: string[] = [];
    if (alert.assignee_user_id) {
      recipientIds = [alert.assignee_user_id];
    } else {
      const { data: admins } = await admin.from("user_roles").select("user_id").eq("role", "admin");
      recipientIds = (admins ?? []).map((r: any) => r.user_id);
    }

    if (recipientIds.length === 0) {
      await admin.from("critical_alerts").update({ pushed_at: new Date().toISOString(), push_last_error: "No recipients" }).eq("id", alert.id);
      continue;
    }

    const { data: subs } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth, user_id")
      .in("user_id", recipientIds);

    const payload = JSON.stringify({
      title: alert.title,
      body: alert.message ?? "",
      url: alert.deep_link,
      alertId: alert.id,
      category: alert.category,
    });

    let lastError: string | null = null;
    let anySuccess = false;

    for (const sub of (subs ?? []) as SubRow[]) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        );
        anySuccess = true;
      } catch (err: any) {
        const status = err?.statusCode;
        if (status === 404 || status === 410) {
          expiredEndpoints.push(sub.endpoint);
        } else {
          lastError = `${status ?? ""} ${err?.body ?? err?.message ?? ""}`.trim();
        }
      }
    }

    if (anySuccess || (subs?.length ?? 0) === 0) {
      await admin.from("critical_alerts").update({
        pushed_at: new Date().toISOString(),
        push_attempts: alert.push_attempts + 1,
        push_last_error: (subs?.length ?? 0) === 0 ? "No subscribed devices" : null,
      }).eq("id", alert.id);
      pushed++;
    } else {
      await admin.from("critical_alerts").update({
        push_attempts: alert.push_attempts + 1,
        push_last_error: lastError,
      }).eq("id", alert.id);
      failed++;
    }
  }

  if (expiredEndpoints.length) {
    await admin.from("push_subscriptions").delete().in("endpoint", expiredEndpoints);
  }

  return new Response(JSON.stringify({ scanned: alerts?.length ?? 0, pushed, failed, expired: expiredEndpoints.length }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});