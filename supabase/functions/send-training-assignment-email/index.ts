import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RESEND_GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const FROM_EMAIL = "Blossom Training <training@blossom.abacommandcenter.com>";

type TrainingEmailPayload = {
  recipientEmail?: string;
  employeeName?: string;
  courseTitle?: string;
  courseDescription?: string;
  dueDate?: string;
  required?: boolean;
  minutes?: number;
  trainingUrl?: string;
  logoUrl?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

  if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "Email sending is not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) {
    return new Response(JSON.stringify({ error: "Missing bearer token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userClient = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) {
    return new Response(JSON.stringify({ error: "Invalid session" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const body = (await req.json().catch(() => ({}))) as TrainingEmailPayload;
  const recipientEmail = body.recipientEmail?.trim().toLowerCase();
  const courseTitle = body.courseTitle?.trim();
  const trainingUrl = body.trainingUrl?.trim();
  if (!recipientEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(recipientEmail) || !courseTitle || !trainingUrl?.startsWith("http")) {
    return new Response(JSON.stringify({ error: "Recipient, course title, and training link are required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const html = renderTrainingEmail({ ...body, recipientEmail, courseTitle, trainingUrl });
  const response = await fetch(`${RESEND_GATEWAY_URL}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": RESEND_API_KEY,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [recipientEmail],
      subject: `New Blossom training assigned: ${courseTitle}`,
      html,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    console.error("Failed to send training assignment email", response.status, details);
    return new Response(JSON.stringify({ error: "Failed to send training email" }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

function escapeHtml(value = "") {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderTrainingEmail(payload: Required<Pick<TrainingEmailPayload, "recipientEmail" | "courseTitle" | "trainingUrl">> & TrainingEmailPayload) {
  const firstName = payload.employeeName?.split(" ").filter(Boolean)[0] ?? "there";
  const dueDate = payload.dueDate ? new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(new Date(`${payload.dueDate}T12:00:00`)) : "No due date set";
  const requirement = payload.required === false ? "Optional" : "Required";
  const minutes = payload.minutes ? `${payload.minutes} minutes` : "Self-paced";
  const logo = payload.logoUrl?.startsWith("http") ? payload.logoUrl : undefined;

  return `
+  <div style="margin:0;padding:0;background:#f6fbfc;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#18313a;">
+    <div style="max-width:660px;margin:0 auto;padding:34px 18px;">
+      <div style="background:#ffffff;border:1px solid #dcebed;border-radius:20px;overflow:hidden;box-shadow:0 20px 52px rgba(57,153,170,0.16);">
+        <div style="padding:26px 30px 18px;text-align:center;background:#ffffff;">${logo ? `<img src="${escapeHtml(logo)}" alt="Blossom ABA Therapy" style="max-width:220px;height:auto;margin:0 auto;display:block;" />` : `<div style="font-size:18px;font-weight:800;color:#3999AA;">Blossom ABA Therapy</div>`}</div>
+        <div style="background:linear-gradient(135deg,#3999AA,#5bb7c6);padding:30px;color:#ffffff;">
+          <div style="display:inline-block;border-radius:999px;background:rgba(255,255,255,0.18);padding:6px 10px;font-size:12px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;">New training assigned</div>
+          <h1 style="margin:16px 0 0;font-size:30px;line-height:1.15;font-weight:800;">Hi ${escapeHtml(firstName)}, your next training is ready.</h1>
+          <p style="margin:12px 0 0;font-size:15px;line-height:1.6;opacity:0.94;">You’ve been assigned a Blossom training to help you stay confident, aligned, and ready for the work ahead.</p>
+        </div>
+        <div style="padding:30px;">
+          <h2 style="margin:0 0 8px;font-size:22px;line-height:1.3;color:#18313a;">${escapeHtml(payload.courseTitle)}</h2>
+          <p style="margin:0 0 22px;font-size:15px;line-height:1.65;color:#55717a;">${escapeHtml(payload.courseDescription || "Open the Training Hub to review the materials and complete your assigned learning.")}</p>
+          <div style="display:grid;gap:10px;margin:0 0 24px;">
+            <div style="border:1px solid #dcebed;border-radius:14px;background:#f8fcfd;padding:14px 16px;"><span style="display:block;font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#6a858d;">Due date</span><strong style="display:block;margin-top:4px;font-size:15px;color:#18313a;">${escapeHtml(dueDate)}</strong></div>
+            <div style="border:1px solid #dcebed;border-radius:14px;background:#f8fcfd;padding:14px 16px;"><span style="display:block;font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#6a858d;">Training details</span><strong style="display:block;margin-top:4px;font-size:15px;color:#18313a;">${escapeHtml(requirement)} · ${escapeHtml(minutes)}</strong></div>
+          </div>
+          <a href="${escapeHtml(payload.trainingUrl)}" style="display:inline-block;background:#3999AA;color:#ffffff;text-decoration:none;border-radius:11px;padding:14px 20px;font-size:15px;font-weight:800;box-shadow:0 14px 28px rgba(57,153,170,0.26);">Start training</a>
+          <p style="margin:24px 0 0;font-size:14px;line-height:1.65;color:#667f87;">Thank you for taking the time to grow with Blossom. Your learning helps us deliver excellent care with consistency and heart.</p>
+          <p style="margin:20px 0 0;font-size:14px;color:#31505a;">The Blossom Training Team</p>
+        </div>
+      </div>
+    </div>
+  </div>`;
}
