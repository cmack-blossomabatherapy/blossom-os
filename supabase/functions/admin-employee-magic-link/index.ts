// Admin-only: ensure an auth user exists for an employee and email them a
// magic link. On first sign-in the user is forced to set a password
// (must_change_password=true is set when we create the user).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RESEND_GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const FROM_EMAIL = "Blossom ABA Therapy <welcome@blossom.abacommandcenter.com>";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) {
    return new Response(JSON.stringify({ error: "Missing bearer token" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userClient = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) {
    return new Response(JSON.stringify({ error: "Invalid session" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const callerId = userData.user.id;

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: isAdmin } = await admin.rpc("has_role", { _user_id: callerId, _role: "admin" });
  const { data: hasHrAdmin } = await admin.rpc("has_role", { _user_id: callerId, _role: "hr_admin" });
  if (!isAdmin && !hasHrAdmin) {
    return new Response(JSON.stringify({ error: "Admin or HR Admin access required" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const body = await req.json().catch(() => ({}));
  const employeeId: string | undefined = body.employeeId;
  const skipEmail: boolean = body.skipEmail === true;
  const siteUrl: string = typeof body.siteUrl === "string" && body.siteUrl.startsWith("http")
    ? body.siteUrl.replace(/\/$/, "")
    : "https://blossom-os.lovable.app";

  if (!employeeId) {
    return new Response(JSON.stringify({ error: "employeeId is required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: employee, error: empErr } = await admin
    .from("employees")
    .select("id, email, first_name, last_name, user_id")
    .eq("id", employeeId)
    .maybeSingle();
  if (empErr || !employee) {
    return new Response(JSON.stringify({ error: empErr?.message ?? "Employee not found" }), {
      status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const email = (employee.email ?? "").trim().toLowerCase();
  if (!email) {
    return new Response(JSON.stringify({ error: "This employee has no email on file." }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let userId: string | null = employee.user_id ?? null;
  let createdAccount = false;

  if (!userId) {
    // Try to find an existing auth user with that email first.
    const { data: existing } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const found = existing?.users?.find((u) => (u.email ?? "").toLowerCase() === email);
    if (found) {
      userId = found.id;
    } else {
      const tempBytes = new Uint8Array(16);
      crypto.getRandomValues(tempBytes);
      const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
      const tempPassword = Array.from(tempBytes).map((b) => alphabet[b % alphabet.length]).join("");

      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          display_name: `${employee.first_name} ${employee.last_name}`.trim(),
          invited_role: "staff",
          must_change_password: "true",
        },
      });
      if (createErr || !created.user) {
        return new Response(JSON.stringify({ error: createErr?.message ?? "Failed to create auth user" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = created.user.id;
      createdAccount = true;
    }

    await admin.from("employees").update({ user_id: userId }).eq("id", employee.id);
  }

  if (skipEmail) {
    return new Response(JSON.stringify({ ok: true, userId, createdAccount, emailSent: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Generate a magic link the user can click to sign in.
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${siteUrl}/auth` },
  });
  if (linkErr || !linkData?.properties?.action_link) {
    return new Response(JSON.stringify({ error: linkErr?.message ?? "Failed to generate magic link" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const magicLink = linkData.properties.action_link;

  // Always require password set on next sign-in.
  await admin.from("profiles").update({ must_change_password: true }).eq("user_id", userId);

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
    return new Response(JSON.stringify({
      ok: true, userId, createdAccount, magicLink,
      emailSent: false, emailError: "Email service is not configured",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const firstName = employee.first_name?.split(" ")[0] ?? "";
  const greeting = firstName ? `Welcome to Blossom, ${escapeHtml(firstName)}!` : "Welcome to Blossom!";
  const html = `
    <div style="margin:0;padding:0;background:#f6fbfc;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#18313a;">
      <div style="max-width:640px;margin:0 auto;padding:32px 18px;">
        <div style="background:#ffffff;border:1px solid #dcebed;border-radius:18px;overflow:hidden;box-shadow:0 18px 44px rgba(57,153,170,0.14);">
          <div style="background:linear-gradient(135deg,#3999AA,#5bb7c6);padding:28px 30px;color:#ffffff;">
            <div style="font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;opacity:0.86;">Blossom ABA Therapy</div>
            <h1 style="margin:12px 0 0;font-size:28px;line-height:1.2;font-weight:750;">${greeting}</h1>
            <p style="margin:10px 0 0;font-size:15px;line-height:1.55;opacity:0.92;">Click the button below to sign in. After your first sign-in you'll be asked to create your password.</p>
          </div>
          <div style="padding:28px 30px;">
            <a href="${escapeHtml(magicLink)}" style="display:inline-block;background:#3999AA;color:#ffffff;text-decoration:none;border-radius:10px;padding:13px 18px;font-size:14px;font-weight:750;box-shadow:0 12px 26px rgba(57,153,170,0.25);">Sign in to Blossom</a>
            <p style="margin:22px 0 0;font-size:13px;line-height:1.6;color:#667f87;">This sign-in link will expire shortly. If it expires, ask an admin to send another one.</p>
            <p style="margin:18px 0 0;font-size:14px;line-height:1.6;color:#31505a;">Welcome aboard,<br /><strong>The Blossom team</strong></p>
          </div>
        </div>
      </div>
    </div>`;

  const response = await fetch(`${RESEND_GATEWAY_URL}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": RESEND_API_KEY,
    },
    body: JSON.stringify({
      from: FROM_EMAIL, to: [email],
      subject: "Your Blossom sign-in link",
      html,
    }),
  });
  const text = await response.text();
  let json: { id?: string; message?: string; error?: string } | null = null;
  try { json = text ? JSON.parse(text) : null; } catch (_) { json = null; }

  if (!response.ok) {
    return new Response(JSON.stringify({
      ok: true, userId, createdAccount, magicLink,
      emailSent: false, emailError: json?.message ?? json?.error ?? text ?? `Resend ${response.status}`,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({
    ok: true, userId, createdAccount, magicLink,
    emailSent: true, resendMessageId: json?.id ?? null,
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});