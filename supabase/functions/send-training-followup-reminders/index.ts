// Daily reminder dispatcher for training follow-ups.
// Sends email to trainee + cc coordinator when today matches a reminder offset.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

interface Followup {
  id: string;
  user_id: string;
  module_id: string;
  module_title: string;
  due_date: string;
  reminder_offsets_days: number[];
  status: string;
  coordinator_name: string | null;
  coordinator_email: string | null;
  reminder_log: Array<{ offset: number; sent_at: string }>;
  notes: string | null;
}

function daysBetween(fromIso: string, toIso: string) {
  const from = new Date(fromIso + "T00:00:00Z");
  const to = new Date(toIso + "T00:00:00Z");
  return Math.round((to.getTime() - from.getTime()) / 86400000);
}

function emailHtml(opts: { name: string; module: string; due: string; daysOut: number; notes: string | null }) {
  const when =
    opts.daysOut === 0 ? "is due <strong>today</strong>"
    : opts.daysOut === 1 ? "is due <strong>tomorrow</strong>"
    : opts.daysOut > 0 ? `is due in <strong>${opts.daysOut} days</strong>`
    : `was due ${Math.abs(opts.daysOut)} day${Math.abs(opts.daysOut) === 1 ? "" : "s"} ago`;
  return `<!doctype html><html><body style="font-family:Inter,Arial,sans-serif;background:#fff;color:#111;padding:24px;max-width:560px;margin:auto">
    <h2 style="margin:0 0 8px;font-size:18px">Training reminder</h2>
    <p style="margin:0 0 16px;color:#444">Hi ${opts.name || "there"}, your training module <strong>${opts.module}</strong> ${when} (${opts.due}).</p>
    ${opts.notes ? `<p style="margin:0 0 16px;color:#666;font-style:italic">Note: ${opts.notes}</p>` : ""}
    <p style="margin:0 0 16px;color:#444">Open the Training Hub to mark it complete or reschedule.</p>
    <p style="margin:24px 0 0;font-size:12px;color:#999">Blossom ABA Therapy · Training</p>
  </body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "Resend connector not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const today = new Date().toISOString().slice(0, 10);

    // Get all pending follow-ups due in the next 30 days or overdue last 7
    const { data: followups, error } = await admin
      .from("training_followups")
      .select("*")
      .eq("status", "pending")
      .gte("due_date", new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10))
      .lte("due_date", new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));

    if (error) throw error;

    let sent = 0;
    const errors: any[] = [];

    for (const f of (followups ?? []) as Followup[]) {
      const daysOut = daysBetween(today, f.due_date); // positive = future
      const offsetMatches = f.reminder_offsets_days.includes(daysOut);
      // Also send overdue reminder on day 0 of overdue (already covered by daysOut === 0)
      if (!offsetMatches) continue;

      // De-dupe: did we already send for this offset?
      const log = Array.isArray(f.reminder_log) ? f.reminder_log : [];
      if (log.some((l) => l.offset === daysOut && l.sent_at?.slice(0, 10) === today)) continue;

      // Look up trainee email + name
      const { data: emp } = await admin
        .from("employees")
        .select("first_name,last_name,email")
        .eq("user_id", f.user_id)
        .maybeSingle();
      const traineeEmail = emp?.email;
      const traineeName = emp ? `${emp.first_name} ${emp.last_name}`.trim() : "";
      if (!traineeEmail) continue;

      const recipients = [traineeEmail];
      const cc = f.coordinator_email ? [f.coordinator_email] : undefined;

      try {
        const res = await fetch(`${GATEWAY_URL}/emails`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": RESEND_API_KEY,
          },
          body: JSON.stringify({
            from: "Blossom Training <onboarding@resend.dev>",
            to: recipients,
            cc,
            subject: `Training reminder: ${f.module_title} (${daysOut <= 0 ? "due now" : `${daysOut}d`})`,
            html: emailHtml({ name: traineeName, module: f.module_title, due: f.due_date, daysOut, notes: f.notes }),
          }),
        });
        if (!res.ok) {
          const body = await res.text();
          errors.push({ id: f.id, status: res.status, body });
          continue;
        }
        sent++;
        await admin
          .from("training_followups")
          .update({
            last_reminder_sent_at: new Date().toISOString(),
            reminder_log: [...log, { offset: daysOut, sent_at: new Date().toISOString() }],
          })
          .eq("id", f.id);
      } catch (e: any) {
        errors.push({ id: f.id, error: e.message });
      }
    }

    return new Response(JSON.stringify({ ok: true, processed: followups?.length ?? 0, sent, errors }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});