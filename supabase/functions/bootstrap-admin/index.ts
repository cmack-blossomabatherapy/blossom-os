// One-shot bootstrap: ensures cmack@blossomabatherapy.com exists as an admin.
// - If the user doesn't exist, creates them with a temp password and must_change_password=true.
// - If they do exist, just ensures they have the admin role.
// Safe to call multiple times. Public (no auth required) so it can be run before an admin exists.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TARGET_EMAIL = "cmack@blossomabatherapy.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  // Try to find the user by email by listing (auth admin listUsers paginates).
  let existing: { id: string; email?: string } | null = null;
  let page = 1;
  while (page < 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) break;
    const hit = data.users.find((u) => (u.email ?? "").toLowerCase() === TARGET_EMAIL);
    if (hit) {
      existing = { id: hit.id, email: hit.email ?? undefined };
      break;
    }
    if (data.users.length < 200) break;
    page++;
  }

  let tempPassword: string | null = null;
  let userId: string;

  if (!existing) {
    // Create with random temp password
    const bytes = new Uint8Array(14);
    crypto.getRandomValues(bytes);
    const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    tempPassword = Array.from(bytes).map((b) => alphabet[b % alphabet.length]).join("");

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: TARGET_EMAIL,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        display_name: "C Mack",
        invited_role: "admin",
        must_change_password: "true",
      },
    });
    if (createErr || !created.user) {
      return new Response(
        JSON.stringify({ error: createErr?.message ?? "Failed to create admin" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    userId = created.user.id;
  } else {
    userId = existing.id;
  }

  // Ensure admin role (idempotent)
  const { data: existingRole } = await admin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (!existingRole) {
    await admin.from("user_roles").insert({ user_id: userId, role: "admin" });
  }

  return new Response(
    JSON.stringify({
      ok: true,
      email: TARGET_EMAIL,
      userId,
      created: !existing,
      tempPassword, // only present when the user was just created
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
