import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const USERS: { email: string; role: string; displayName: string }[] = [
  { email: "testqa@blossomabatherapy.com", role: "qa", displayName: "Test QA" },
  { email: "testrecruiting@blossomabatherapy.com", role: "recruiting_assistant", displayName: "Test Recruiting" },
  { email: "testpayroll@blossomabatherapy.com", role: "payroll_admin", displayName: "Test Payroll" },
  { email: "testoperations@blossomabatherapy.com", role: "ops_manager", displayName: "Test Operations" },
  { email: "testceo@blossomabatherapy.com", role: "exec", displayName: "Test CEO" },
  { email: "testmarketing@blossomabatherapy.com", role: "marketing", displayName: "Test Marketing" },
];

const PASSWORD = "Blossom@123";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  const results: any[] = [];

  for (const u of USERS) {
    let userId: string | null = null;
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: u.email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { display_name: u.displayName, seeded: true },
    });

    if (createErr) {
      // If already exists, look it up and reset the password
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const existing = list?.users?.find((x) => x.email?.toLowerCase() === u.email.toLowerCase());
      if (existing) {
        userId = existing.id;
        await admin.auth.admin.updateUserById(existing.id, {
          password: PASSWORD,
          email_confirm: true,
          user_metadata: { ...(existing.user_metadata ?? {}), display_name: u.displayName, seeded: true },
        });
      } else {
        results.push({ email: u.email, error: createErr.message });
        continue;
      }
    } else {
      userId = created.user!.id;
    }

    if (userId) {
      await admin.from("user_roles").upsert(
        { user_id: userId, role: u.role as any },
        { onConflict: "user_id,role" },
      );
      // Optional: ensure a profile row exists if a profiles table is present
      await admin
        .from("profiles")
        .upsert({ user_id: userId, display_name: u.displayName }, { onConflict: "user_id" })
        .then(() => {}, () => {});

      results.push({ email: u.email, user_id: userId, role: u.role, ok: true });
    }
  }

  return new Response(JSON.stringify({ ok: true, results }, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});