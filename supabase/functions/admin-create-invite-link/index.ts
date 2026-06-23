// Admin-only: generate a fresh temporary password for a user and return a
// copy-able sign-in link. Used by the User Management panel so admins can
// hand-deliver credentials when the welcome email never arrives (Outlook
// suppression, typo, deleted message, etc.). Mirrors the credential rotation
// that admin-employee-magic-link / admin-resend-welcome-email perform, but
// does NOT send an email — the admin shares the link/password directly.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function generateTempPassword(len = 14) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  return Array.from(bytes).map((b) => alphabet[b % alphabet.length]).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Missing bearer token" }, 401);

  const userClient = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: "Invalid session" }, 401);
  const callerId = userData.user.id;

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: isAdmin } = await admin.rpc("has_role", { _user_id: callerId, _role: "admin" });
  const { data: isHrAdmin } = await admin.rpc("has_role", { _user_id: callerId, _role: "hr_admin" });
  if (!isAdmin && !isHrAdmin) return json({ error: "Admin access required" }, 403);

  const body = await req.json().catch(() => ({}));
  const userId: string = typeof body.userId === "string" ? body.userId : "";
  const emailIn: string = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const siteUrl: string = typeof body.siteUrl === "string" && body.siteUrl.startsWith("http")
    ? body.siteUrl.replace(/\/$/, "")
    : "https://blossom.abacommandcenter.com";

  if (!userId && !emailIn) {
    return json({ error: "userId or email is required" }, 400);
  }

  // Try to resolve an existing auth user by id, then by email. If neither
  // exists (employee record was created without ever provisioning a login),
  // mint a fresh auth user so the admin still gets a working invite link.
  let resolvedUserId: string | null = null;
  let resolvedEmail = emailIn;

  if (userId) {
    const { data: existing } = await admin.auth.admin.getUserById(userId);
    if (existing?.user) {
      resolvedUserId = existing.user.id;
      if (!resolvedEmail) resolvedEmail = (existing.user.email ?? "").toLowerCase();
    }
  }

  if (!resolvedUserId && resolvedEmail) {
    // Fallback: lookup by email across paginated admin list.
    for (let page = 1; page <= 20 && !resolvedUserId; page++) {
      const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (listErr) break;
      const match = list?.users?.find((u) => (u.email ?? "").toLowerCase() === resolvedEmail);
      if (match) resolvedUserId = match.id;
      if (!list || (list.users?.length ?? 0) < 200) break;
    }
  }

  if (!resolvedEmail) return json({ error: "User has no email on file" }, 400);

  const tempPassword = generateTempPassword();

  if (!resolvedUserId) {
    // No auth account yet — create one so the invite link works on first use.
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: resolvedEmail,
      password: tempPassword,
      email_confirm: true,
    });
    if (createErr || !created?.user) {
      return json({ error: `Could not create auth user: ${createErr?.message ?? "unknown"}` }, 400);
    }
    resolvedUserId = created.user.id;
    // Link this fresh auth user back to the employee profile row if the
    // original userId pointed at a stale/missing profile.
    if (userId && userId !== resolvedUserId) {
      await admin.from("profiles").update({ user_id: resolvedUserId }).eq("user_id", userId);
      await admin.from("employees").update({ user_id: resolvedUserId }).eq("user_id", userId);
    }
  } else {
    // Sync email if admin passed a different one, then rotate password.
    const { data: current } = await admin.auth.admin.getUserById(resolvedUserId);
    const currentEmail = (current?.user?.email ?? "").toLowerCase();
    if (emailIn && emailIn !== currentEmail) {
      const { error: emailErr } = await admin.auth.admin.updateUserById(resolvedUserId, {
        email: resolvedEmail,
        email_confirm: true,
      });
      if (emailErr) return json({ error: `Could not sync login email: ${emailErr.message}` }, 400);
    }
    const { error: pwErr } = await admin.auth.admin.updateUserById(resolvedUserId, {
      password: tempPassword,
      email_confirm: true,
    });
    if (pwErr) return json({ error: `Could not reset password: ${pwErr.message}` }, 400);
  }

  const email = resolvedEmail;

  // Force a password reset on first sign-in.
  await admin.from("profiles").update({ must_change_password: true }).eq("user_id", resolvedUserId);

  const loginUrl = `${siteUrl}/auth?email=${encodeURIComponent(email)}&welcome=1`;

  // Audit trail so we can see who minted an invite link and when.
  try {
    await admin.from("invite_email_logs").insert({
      recipient_email: email,
      status: "manual_link",
      error_message: "Invite link generated by admin (no email sent)",
      roles: [],
      invited_user_id: resolvedUserId,
      created_by: callerId,
    });
  } catch (_) { /* non-fatal */ }

  console.log("[invite-link] generated", { userId: resolvedUserId, email, by: callerId });

  return json({ ok: true, loginUrl, email, tempPassword });
});