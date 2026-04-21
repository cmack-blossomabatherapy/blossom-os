// Admin-only: create a new team member with a temporary password and pre-assigned role.
// The created user is flagged `must_change_password=true` so they're forced to set a new
// password on first sign-in.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Role = "admin" | "staff" | "viewer";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) {
    return new Response(JSON.stringify({ error: "Missing bearer token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Verify caller and check admin role using the anon client + user JWT
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
  const callerId = userData.user.id;

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: isAdminData, error: roleErr } = await admin.rpc("has_role", {
    _user_id: callerId,
    _role: "admin",
  });
  if (roleErr || !isAdminData) {
    return new Response(JSON.stringify({ error: "Admin access required" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const body = await req.json().catch(() => ({}));
  const email: string | undefined = body.email?.trim().toLowerCase();
  const displayName: string | undefined = body.displayName?.trim() || undefined;
  const role: Role = (["admin", "staff", "viewer"].includes(body.role) ? body.role : "staff") as Role;
  let tempPassword: string = body.tempPassword?.trim() || "";

  if (!email) {
    return new Response(JSON.stringify({ error: "Email is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!tempPassword) {
    // Generate a reasonable temp password (12 chars, letters/numbers/symbols)
    const bytes = new Uint8Array(12);
    crypto.getRandomValues(bytes);
    const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    tempPassword = Array.from(bytes).map((b) => alphabet[b % alphabet.length]).join("");
  }
  if (tempPassword.length < 8) {
    return new Response(JSON.stringify({ error: "Temporary password must be 8+ characters" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      display_name: displayName,
      invited_role: role,
      must_change_password: "true",
    },
  });

  if (createErr || !created.user) {
    return new Response(
      JSON.stringify({ error: createErr?.message ?? "Failed to create user" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({
      ok: true,
      userId: created.user.id,
      email,
      role,
      tempPassword,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
