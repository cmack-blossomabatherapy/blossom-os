// Email Command Center — sync recent Outlook metadata and classify each
// item with a rule-based routing engine. No raw bodies are persisted.
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

// Inline routing rules — mirror of src/lib/os/emailCommand/routingRules.ts.
// Kept inline to avoid cross-runtime imports (Deno vs Vite/TS).
const RULES = [
  { match: /\b(escalat|complaint|urgent|asap|attorney|legal|lawsuit|fraud|abuse)\b/i, tag: "Risk / Escalation", owner: "Corey / Operations Leadership", channel: "outlook_email", action: "Escalate to Corey immediately", weight: 0.95, reason: "Risk language detected" },
  { match: /\b(auth(orization)?|prior auth|pa request|cpt|appeal|denial)\b/i, tag: "Authorization", owner: "Devorah / Auth Team", channel: "outlook_email", action: "Forward to Devorah / Auth Team", weight: 0.85, reason: "Authorization keywords" },
  { match: /\b(vob|benefits?|eligibility|insurance|copay|deductible|coverage)\b/i, tag: "Benefits / VOB", owner: "Gabi / Finance Benefits", channel: "outlook_email", action: "Forward to Gabi for benefits review", weight: 0.82, reason: "Benefits / VOB language" },
  { match: /\b(applicant|candidate|interview|resume|cv|recruit|onboard(ing)?|new hire)\b/i, tag: "Recruiting", owner: "Nikki / Recruiting", channel: "outlook_email", action: "Forward to Nikki / Recruiting", weight: 0.8, reason: "Recruiting keywords" },
  { match: /\b(intake|new lead|inquiry|interested in services|sign up|parent inquiry|lead form)\b/i, tag: "Intake", owner: "Intake Team", channel: "outlook_email", action: "Route to Intake Team", weight: 0.78, reason: "Intake language" },
  { match: /\b(schedul(ing|e)|cancel(led|lation)?|reschedule|coverage|call[- ]out|cover session)\b/i, tag: "Scheduling", owner: "Scheduling Team", channel: "outlook_email", action: "Forward to Scheduling Team", weight: 0.78, reason: "Scheduling language" },
  { match: /\b(bcba|treatment plan|supervis(ion|or)|session note|clinical|behavior plan)\b/i, tag: "Clinical", owner: "Clinical Leadership", channel: "outlook_email", action: "Route to Clinical Leadership / assigned BCBA", weight: 0.75, reason: "Clinical keywords" },
  { match: /\b(payroll|viventium|paystub|paycheck|w-?2|direct deposit)\b/i, tag: "Payroll", owner: "Payroll / HR", channel: "outlook_email", action: "Forward to Payroll / HR", weight: 0.85, reason: "Payroll keywords" },
  { match: /\b(invoice|billing|claim|reimbursement|payment plan)\b/i, tag: "Billing", owner: "Finance / Billing Team", channel: "outlook_email", action: "Forward to Billing", weight: 0.7, reason: "Billing keywords" },
  { match: /\b(ctm|leadtrap|facebook ads?|google ads?|campaign|seo|referral source|marketing)\b/i, tag: "Marketing", owner: "Marketing Team", channel: "outlook_email", action: "Route to Marketing Team", weight: 0.75, reason: "Marketing keywords" },
  { match: /\b(pto|time off|hr|benefits enrollment|handbook|policy)\b/i, tag: "HR", owner: "HR Team", channel: "outlook_email", action: "Forward to HR", weight: 0.7, reason: "HR keywords" },
  { match: /\b(can we meet|schedule a (call|meeting)|what time works|move the meeting|follow up next week|calendar invite|availability)\b/i, tag: "Calendar / Meeting", owner: "Corey", channel: "outlook_calendar", action: "Create approved Outlook calendar event", weight: 0.82, reason: "Scheduling request" },
  { match: /\b(parent|family|caregiver|my child|my son|my daughter)\b/i, tag: "Parent Communication", owner: "Intake Team", channel: "outlook_email", action: "Route to Intake / Parent Communication", weight: 0.65, reason: "Parent language" },
  { match: /\b(vendor|partner|contract|proposal|invoice from)\b/i, tag: "Vendor / External Partner", owner: "Operations", channel: "outlook_email", action: "Route to Operations", weight: 0.6, reason: "Vendor/partner language" },
];

function classify(text: string) {
  let best: typeof RULES[number] | null = null;
  for (const r of RULES) {
    if (r.match.test(text) && (!best || r.weight > best.weight)) best = r;
  }
  if (!best) {
    return { tag: "Operations", owner: "Corey / Operations Leadership", channel: "outlook_email",
      action: "Review and route manually", weight: 0.35, reason: "No high-confidence keywords matched" };
  }
  return best;
}

function buildDraft(senderName: string, tag: string): string {
  return `Hi ${senderName?.split(" ")[0] || "there"},\n\nThanks for reaching out — I'm routing this to our ${tag} team to follow up with you directly. You should hear back shortly.\n\nBest,\nCorey`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader) return json({ ok: false, error: "Unauthorized" }, 401);
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: userData } = await supabase.auth.getUser(authHeader.replace(/^Bearer\s+/i, ""));
  const user = userData?.user;
  if (!user) return json({ ok: false, error: "Unauthorized" }, 401);

  const refreshed = await refreshUserToken(supabase, user.id);
  if (!refreshed.ok) return json({ ok: false, error: refreshed.error ?? "no_connection" });

  const { data: conn } = await supabase
    .from("integration_oauth_connections").select("id")
    .eq("integration_id", "ms365").eq("user_id", user.id).maybeSingle();
  if (!conn) return json({ ok: false, error: "no_connection" });
  const { data: vault } = await supabase
    .from("integration_oauth_token_vault").select("access_token_ciphertext")
    .eq("oauth_connection_id", conn.id).maybeSingle();
  if (!vault?.access_token_ciphertext) return json({ ok: false, error: "no_access_token" });
  const accessToken = await decryptToken(vault.access_token_ciphertext);

  const res = await fetch(
    "https://graph.microsoft.com/v1.0/me/messages?$top=50&$select=id,subject,from,toRecipients,receivedDateTime,conversationId,webLink,bodyPreview,importance,isRead,categories",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return json({ ok: false, error: data?.error?.message ?? `HTTP ${res.status}` });

  const msgs: any[] = data?.value ?? [];
  let received = 0;
  let analyzed = 0;

  for (const m of msgs) {
    received += 1;
    const senderEmail = m.from?.emailAddress?.address ?? null;
    const senderName = m.from?.emailAddress?.name ?? null;
    const subject = m.subject ?? "(no subject)";
    const preview = m.bodyPreview ?? "";
    const text = `${subject}\n${preview}\n${senderEmail ?? ""}`;
    const rule = classify(text);
    const isRisk = rule.tag === "Risk / Escalation";
    const urgency = isRisk ? "critical" : rule.weight >= 0.8 ? "high" : "normal";
    const riskLevel = isRisk ? "high" : rule.weight >= 0.8 ? "medium" : "low";
    const needsCorey = rule.weight < 0.7 || rule.owner.toLowerCase().includes("corey") || isRisk;

    // Upsert item
    const { data: itemRow, error: itemErr } = await supabase
      .from("email_command_items")
      .upsert({
        user_id: user.id,
        external_message_id: m.id,
        conversation_id: m.conversationId ?? null,
        provider: "outlook",
        sender_name: senderName,
        sender_email: senderEmail,
        subject,
        received_at: m.receivedDateTime ?? null,
        is_unread: m.isRead === false,
        importance: m.importance ?? null,
        category: (m.categories ?? [])[0] ?? null,
        status: needsCorey ? "needs_corey" : "ready",
        workflow_tag: rule.tag,
        suggested_owner: rule.owner,
        urgency,
        risk_level: riskLevel,
        web_link: m.webLink ?? null,
      }, { onConflict: "user_id,external_message_id" })
      .select()
      .single();
    if (itemErr || !itemRow) continue;

    // Has a recommendation already?
    const { data: existing } = await supabase
      .from("email_recommendations").select("id")
      .eq("email_command_item_id", itemRow.id).maybeSingle();
    if (existing) continue;

    const draft = rule.channel === "outlook_email" ? buildDraft(senderName ?? "", rule.tag) : null;

    await supabase.from("email_recommendations").insert({
      email_command_item_id: itemRow.id,
      user_id: user.id,
      ai_summary: preview.slice(0, 280),
      recommended_action: rule.action,
      recommended_channel: rule.channel,
      suggested_owner: rule.owner,
      confidence: rule.weight,
      reason: rule.reason,
      workflow_tag: rule.tag,
      draft_text: draft,
    });
    analyzed += 1;
  }

  return json({ ok: true, received, analyzed });
});