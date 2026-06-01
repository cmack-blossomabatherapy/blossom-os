import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// Viventium hire-date sync.
// Pulls active employees from Viventium and updates `employees.hire_date` (matched
// by viventium_employee_id, then by email). Updates flow through the
// sync_employee_to_evaluation_staff trigger and regenerate evaluations as needed.
//
// Required secrets (set in Lovable Cloud):
//   - VIVENTIUM_API_KEY
//   - VIVENTIUM_COMPANY_ID
// Optional:
//   - VIVENTIUM_BASE_URL (defaults to https://api.viventium.com/v1)

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const apiKey = Deno.env.get("VIVENTIUM_API_KEY");
  const companyId = Deno.env.get("VIVENTIUM_COMPANY_ID");
  const baseUrl = Deno.env.get("VIVENTIUM_BASE_URL") ?? "https://api.viventium.com/v1";

  if (!apiKey || !companyId) {
    return new Response(
      JSON.stringify({
        ok: false,
        connected: false,
        error: "Viventium is not connected. Add VIVENTIUM_API_KEY and VIVENTIUM_COMPANY_ID secrets in Lovable Cloud.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const url = `${baseUrl}/companies/${companyId}/employees?status=active`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Viventium API ${res.status}: ${body.slice(0, 300)}`);
    }
    const payload = await res.json();
    const list: any[] = Array.isArray(payload) ? payload : (payload.data ?? payload.employees ?? []);

    let updated = 0;
    let matched = 0;
    const now = new Date().toISOString();

    for (const v of list) {
      const vId = String(v.id ?? v.employee_id ?? v.employeeId ?? "");
      const email = (v.email ?? v.workEmail ?? v.work_email ?? "").toString().toLowerCase();
      const hireDate = v.hire_date ?? v.hireDate ?? v.dateOfHire ?? null;
      if (!hireDate) continue;

      // Match by viventium_employee_id, then email
      let matchQuery = supabase.from("employees").select("id").limit(1);
      if (vId) {
        matchQuery = supabase.from("employees").select("id").eq("viventium_employee_id", vId).limit(1);
      }
      let { data: rows } = await matchQuery;
      if ((!rows || rows.length === 0) && email) {
        const r = await supabase.from("employees").select("id").ilike("email", email).limit(1);
        rows = r.data ?? [];
      }
      if (!rows || rows.length === 0) continue;
      matched++;

      const { error } = await supabase
        .from("employees")
        .update({
          hire_date: hireDate,
          viventium_employee_id: vId || null,
          viventium_sync_status: "synced",
          viventium_last_sync: now,
        })
        .eq("id", rows[0].id);
      if (!error) updated++;
    }

    return new Response(
      JSON.stringify({ ok: true, connected: true, received: list.length, matched, updated, at: now }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, connected: true, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});