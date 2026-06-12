// Admin-only: ensure an auth user exists for an employee and email them a
// branded welcome with a temporary password. On first sign-in the user is
// forced to set a password (must_change_password=true).
//
// NOTE: We intentionally do NOT use one-time magic links. Outlook / Microsoft
// 365 Safe Links scanners pre-fetch the URL, consume the token, and leave the
// recipient on the plain login page with no context. The temp-password +
// /auth?email=…&welcome=1 flow survives link scanning.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { sendBlossomWelcomeEmail } from "../_shared/welcome-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function findAuthUserByEmail(admin: ReturnType<typeof createClient>, email: string) {
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data?.users?.find((u) => (u.email ?? "").toLowerCase() === email);
    if (found) return found;
    if ((data?.users?.length ?? 0) < 200) break;
  }
  return null;
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
    const found = await findAuthUserByEmail(admin, email);
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

  // Ensure the auth user's email matches the employee record. If the admin
  // updated the employee email after the auth account was created, the magic
  // link would otherwise be sent to a stale address (or auto-create a new
  // orphaned auth user).
  try {
    const { data: existingUser } = await admin.auth.admin.getUserById(userId!);
    const currentEmail = (existingUser?.user?.email ?? "").toLowerCase();
    if (currentEmail && currentEmail !== email) {
      const targetUser = await findAuthUserByEmail(admin, email);
      if (targetUser && targetUser.id !== userId) {
        const { data: linkedEmployee } = await admin
          .from("employees")
          .select("id, first_name, last_name")
          .eq("user_id", targetUser.id)
          .neq("id", employee.id)
          .maybeSingle();

        if (linkedEmployee) {
          return new Response(JSON.stringify({
            error: `That email is already linked to ${linkedEmployee.first_name ?? ""} ${linkedEmployee.last_name ?? ""}.`.trim(),
          }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const { error: relinkErr } = await admin
          .from("employees")
          .update({ user_id: targetUser.id })
          .eq("id", employee.id);
        if (relinkErr) {
          return new Response(JSON.stringify({ error: `Could not link existing login: ${relinkErr.message}` }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        console.log("[invite] relinked employee to existing auth user", { employeeId: employee.id, fromUserId: userId, toUserId: targetUser.id, email });
        userId = targetUser.id;
      } else {
      const { error: updErr } = await admin.auth.admin.updateUserById(userId!, {
        email,
        email_confirm: true,
      });
      if (updErr) {
        console.log("[invite] failed to sync auth email", { userId, from: currentEmail, to: email, error: updErr.message });
        return new Response(JSON.stringify({ error: `Could not update login email: ${updErr.message}` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.log("[invite] synced auth email", { userId, from: currentEmail, to: email });
      }
    }
  } catch (e) {
    console.log("[invite] error checking auth user", { userId, error: (e as Error).message });
  }

  if (skipEmail) {
    return new Response(JSON.stringify({ ok: true, userId, createdAccount, emailSent: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Reset the user's password to a fresh temp value so the welcome email can
  // include working credentials regardless of whether the auth user was just
  // created or already existed.
  const tempBytes = new Uint8Array(12);
  crypto.getRandomValues(tempBytes);
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  const tempPassword = Array.from(tempBytes).map((b) => alphabet[b % alphabet.length]).join("");

  const { error: pwErr } = await admin.auth.admin.updateUserById(userId!, {
    password: tempPassword,
    email_confirm: true,
  });
  if (pwErr) {
    return new Response(JSON.stringify({ error: `Could not reset temporary password: ${pwErr.message}` }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Always require password set on next sign-in.
  await admin.from("profiles").update({ must_change_password: true }).eq("user_id", userId);

  // Direct sign-in URL — survives Outlook / Microsoft 365 Safe Links scanning.
  const signInUrl = `${siteUrl}/auth?email=${encodeURIComponent(email)}&welcome=1`;
  const displayName = `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim() || undefined;

  const welcome = await sendBlossomWelcomeEmail({
    email,
    displayName,
    roles: ["staff"],
    tempPassword,
    loginUrl: signInUrl,
  });

  console.log("[invite] welcome email", {
    to: email,
    status: welcome.status,
    id: welcome.resendMessageId ?? null,
    error: welcome.errorMessage ?? null,
  });

  // Best-effort: log the invite send so it appears in invite_email_logs.
  try {
    await admin.from("invite_email_logs").insert({
      recipient_email: email,
      status: welcome.status,
      resend_message_id: welcome.resendMessageId,
      error_message: welcome.errorMessage,
      roles: ["staff"],
      invited_user_id: userId,
      created_by: callerId,
    });
  } catch (_) { /* non-fatal */ }

  return new Response(JSON.stringify({
    ok: true,
    userId,
    createdAccount,
    emailSent: welcome.status === "sent",
    emailStatus: welcome.status,
    emailError: welcome.errorMessage,
    resendMessageId: welcome.resendMessageId,
    tempPassword,
    loginUrl: signInUrl,
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});