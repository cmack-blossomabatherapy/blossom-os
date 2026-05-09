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

const MAX_ATTEMPTS = 5;
const INNER_RETRIES = 2; // per-send retries within a single invocation
const INNER_BACKOFF_MS = [250, 750]; // delay before each inner retry

function isTransient(statusCode: number | undefined): boolean {
  if (!statusCode) return true; // network/no response → assume transient
  if (statusCode === 429) return true;
  if (statusCode >= 500 && statusCode <= 599) return true;
  return false;
}

async function sendWithRetry(sub: { endpoint: string; p256dh: string; auth: string }, payload: string) {
  let lastErr: any;
  for (let i = 0; i <= INNER_RETRIES; i++) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
      );
      return { ok: true as const, attempts: i + 1 };
    } catch (err: any) {
      lastErr = err;
      const status = err?.statusCode;
      if (!isTransient(status)) break;
      if (i < INNER_RETRIES) await new Promise((r) => setTimeout(r, INNER_BACKOFF_MS[i] ?? 1000));
    }
  }
  return { ok: false as const, error: lastErr, attempts: INNER_RETRIES + 1 };
}

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
  let gaveUp = 0;
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

    // Filter recipients by per-category preferences (missing row = enabled)
    const { data: prefs } = await admin
      .from("push_notification_preferences")
      .select("user_id, enabled")
      .eq("category", alert.category)
      .in("user_id", recipientIds);
    const optedOut = new Set((prefs ?? []).filter((p: any) => p.enabled === false).map((p: any) => p.user_id));
    recipientIds = recipientIds.filter((id) => !optedOut.has(id));
    if (recipientIds.length === 0) {
      await admin.from("critical_alerts").update({ pushed_at: new Date().toISOString(), push_last_error: "All recipients opted out of category" }).eq("id", alert.id);
      continue;
    }

    const { data: subs } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth, user_id")
      .in("user_id", recipientIds);

    // Idempotency: skip (alert_id, user_id, endpoint) tuples already delivered successfully
    const { data: prior } = await admin
      .from("push_deliveries")
      .select("user_id, endpoint")
      .eq("alert_id", alert.id)
      .eq("status", "sent");
    const alreadySent = new Set((prior ?? []).map((d: any) => `${d.user_id}::${d.endpoint}`));
    const targetSubs = ((subs ?? []) as SubRow[]).filter(
      (s) => !alreadySent.has(`${s.user_id}::${s.endpoint}`),
    );

    const payload = JSON.stringify({
      title: alert.title,
      body: alert.message ?? "",
      url: alert.deep_link,
      alertId: alert.id,
      category: alert.category,
    });

    let lastError: string | null = null;
    let anySuccess = false;
    const attemptNumber = (alert.push_attempts ?? 0) + 1;
    const deliveryRows: Array<Record<string, unknown>> = [];

    for (const sub of targetSubs) {
      const result = await sendWithRetry(sub, payload);
      if (result.ok) {
        anySuccess = true;
        deliveryRows.push({
          alert_id: alert.id,
          user_id: sub.user_id,
          endpoint: sub.endpoint,
          status: "sent",
          attempt: attemptNumber,
          error: result.attempts > 1 ? `Recovered after ${result.attempts} tries` : null,
        });
      } else {
        const err: any = result.error;
        const status = err?.statusCode;
        const errMsg = `${status ?? "network"} ${err?.body ?? err?.message ?? ""}`.trim();
        if (status === 404 || status === 410) {
          expiredEndpoints.push(sub.endpoint);
          deliveryRows.push({
            alert_id: alert.id,
            user_id: sub.user_id,
            endpoint: sub.endpoint,
            status: "expired",
            attempt: attemptNumber,
            error: errMsg,
          });
        } else {
          lastError = errMsg;
          deliveryRows.push({
            alert_id: alert.id,
            user_id: sub.user_id,
            endpoint: sub.endpoint,
            status: "failed",
            attempt: attemptNumber,
            error: `${errMsg} (after ${result.attempts} inner tries)`,
          });
        }
      }
    }

    if (deliveryRows.length) {
      await admin.from("push_deliveries").insert(deliveryRows);
    }

    if (anySuccess || (subs?.length ?? 0) === 0) {
      await admin.from("critical_alerts").update({
        pushed_at: new Date().toISOString(),
        push_attempts: alert.push_attempts + 1,
        push_last_error: (subs?.length ?? 0) === 0 ? "No subscribed devices" : null,
      }).eq("id", alert.id);
      pushed++;
    } else if (attemptNumber >= MAX_ATTEMPTS) {
      // Stop the silent loop: mark as "gave up" so the dashboard surfaces it
      const giveUpMsg = `Gave up after ${MAX_ATTEMPTS} attempts. Last error: ${lastError ?? "unknown"}`;
      await admin.from("critical_alerts").update({
        pushed_at: new Date().toISOString(),
        push_attempts: alert.push_attempts + 1,
        push_last_error: giveUpMsg,
      }).eq("id", alert.id);
      await admin.from("push_deliveries").insert({
        alert_id: alert.id,
        user_id: alert.assignee_user_id ?? recipientIds[0],
        endpoint: "(none)",
        status: "failed",
        attempt: attemptNumber,
        error: giveUpMsg,
      });
      gaveUp++;
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

  return new Response(JSON.stringify({ scanned: alerts?.length ?? 0, pushed, failed, gaveUp, expired: expiredEndpoints.length }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});