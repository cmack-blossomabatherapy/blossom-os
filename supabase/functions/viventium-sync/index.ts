import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// Viventium Integration API sync.
//
// Auth flow: POST /API/Integration/v1/auth/login with {Username,Password} -> cookies.
// For subsequent calls, read the VM-XT-89001 cookie value and send it as
// X-XSRF-TOKEN, and forward the VM-XT-89001 + VM-AT-89001 cookies.
// Employee export: /API/Integration/v1/export/companies/{co}/divisions/{div}/employees/
//
// Modes:
//   { "mode": "connection-test" }
//   { "mode": "employees-dry-run" }
//   { "mode": "employees-sync", "dryRun": true|false }   (default dryRun = true)
//
// Never log passwords, cookies, XSRF tokens, or full raw employee payloads.

type Mode = "connection-test" | "employees-dry-run" | "employees-sync";

const ADMIN_ROLES = ["admin", "super_admin", "hr_admin", "hr_manager", "systems_admin"] as const;

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const maskEmail = (email: string | null | undefined) => {
  if (!email) return null;
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const head = local.slice(0, 2);
  return `${head}${local.length > 2 ? "***" : ""}@${domain}`;
};

const maskName = (name: string | null | undefined) => {
  if (!name) return null;
  return name.length <= 2 ? name[0] + "*" : name[0] + "***" + name.slice(-1);
};

const pick = (obj: Record<string, unknown>, keys: string[]): unknown => {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k];
  }
  return null;
};

const toStr = (v: unknown) => (v == null ? null : String(v));

const VALID_STATUSES = new Set(["pending_start", "active", "on_leave", "on_hold", "terminated", "resigned"]);
const VALID_EMPLOYMENT_TYPES = new Set(["full_time", "part_time", "contractor", "prn"]);

function mapEmploymentType(raw: string | null): string | null {
  if (!raw) return null;
  const s = raw.toLowerCase().replace(/[\s-]+/g, "_");
  if (VALID_EMPLOYMENT_TYPES.has(s)) return s;
  if (/full/.test(s)) return "full_time";
  if (/part/.test(s)) return "part_time";
  if (/contract/.test(s)) return "contractor";
  if (/prn|per_diem|perdiem/.test(s)) return "prn";
  return null;
}

function mapStatus(rawStatus: string, termDate: string | null): string {
  if (termDate) return "terminated";
  const s = rawStatus.toLowerCase();
  if (VALID_STATUSES.has(s)) return s;
  if (/leave/.test(s)) return "on_leave";
  if (/hold|suspend/.test(s)) return "on_hold";
  if (/resign/.test(s)) return "resigned";
  if (/term|separat|inactive/.test(s)) return "terminated";
  if (/pend|new|prehire/.test(s)) return "pending_start";
  if (!s || /active|employed/.test(s)) return "active";
  return "active";
}

interface NormalizedEmployee {
  viventium_employee_id: string | null;
  employee_code: string | null;
  first_name: string | null;
  last_name: string | null;
  preferred_name: string | null;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  department: string | null;
  state: string | null;
  employment_type: string | null;
  hire_date: string | null;
  start_date: string | null;
  termination_date: string | null;
  status: string;
}

function normalize(v: Record<string, unknown>): NormalizedEmployee {
  const vId = toStr(pick(v, ["viventium_employee_id", "id", "employeeId", "EmployeeId", "EmployeeID", "employeeNumber", "EmployeeNumber"]));
  const rawStatus = String(pick(v, ["status", "Status", "employmentStatus", "EmploymentStatus"]) ?? "").toLowerCase();
  const termDate = toStr(pick(v, ["terminationDate", "TerminationDate", "termination_date", "endDate", "EndDate"]));
  return {
    viventium_employee_id: vId,
    employee_code: toStr(pick(v, ["employeeNumber", "EmployeeNumber", "employee_code", "employeeCode"])),
    first_name: toStr(pick(v, ["firstName", "FirstName", "first_name", "givenName", "GivenName"])),
    last_name: toStr(pick(v, ["lastName", "LastName", "last_name", "familyName", "FamilyName"])),
    preferred_name: toStr(pick(v, ["preferredName", "PreferredName", "preferred_name", "nickName", "NickName"])),
    email: (toStr(pick(v, ["workEmail", "WorkEmail", "email", "Email", "emailAddress", "EmailAddress"])) ?? "").toLowerCase() || null,
    phone: toStr(pick(v, ["homePhone", "HomePhone", "mobilePhone", "MobilePhone", "phone", "Phone", "phoneNumber", "PhoneNumber"])),
    job_title: toStr(pick(v, ["jobTitle", "JobTitle", "job_title", "title", "Title", "position", "Position"])),
    department: toStr(pick(v, ["department", "Department", "departmentName", "DepartmentName"])),
    state: toStr(pick(v, ["state", "State", "workState", "WorkState", "homeState", "HomeState"])),
    employment_type: toStr(pick(v, ["employmentType", "EmploymentType", "employment_type", "employeeType", "EmployeeType"])),
    hire_date: toStr(pick(v, ["hireDate", "HireDate", "hire_date", "dateOfHire", "DateOfHire", "originalHireDate", "OriginalHireDate"])),
    start_date: toStr(pick(v, ["startDate", "StartDate", "start_date"])),
    termination_date: termDate,
    status: mapStatus(rawStatus, termDate),
  };
}

function parseCookies(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  // Deno / undici expose multiple Set-Cookie via getSetCookie().
  const getSetCookie = (headers as unknown as { getSetCookie?: () => string[] }).getSetCookie;
  const list = typeof getSetCookie === "function" ? getSetCookie.call(headers) : [];
  const raws: string[] = list.length ? list : (headers.get("set-cookie")?.split(/,(?=[^;]+=)/) ?? []);
  for (const raw of raws) {
    const first = raw.split(";", 1)[0];
    const eq = first.indexOf("=");
    if (eq > 0) out[first.slice(0, eq).trim()] = first.slice(eq + 1).trim();
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ ok: false, error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // ---- authenticate caller ----
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
  const userId = userData.user.id;

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: roleRows } = await admin.from("user_roles").select("role").eq("user_id", userId);
  const roles = new Set((roleRows ?? []).map((r: { role: string }) => r.role));
  const isAdmin = ADMIN_ROLES.some((r) => roles.has(r));
  if (!isAdmin) return jsonResponse({ ok: false, error: "Forbidden" }, 403);

  // ---- parse body ----
  let body: { mode?: Mode; dryRun?: boolean } = {};
  try { body = await req.json(); } catch { /* empty body allowed */ }
  const mode: Mode = body.mode ?? "connection-test";
  const dryRun = mode === "employees-sync" ? body.dryRun !== false : true;

  // ---- required secrets ----
  const username = Deno.env.get("VIVENTIUM_USERNAME");
  const password = Deno.env.get("VIVENTIUM_PASSWORD");
  const companyCode = Deno.env.get("VIVENTIUM_COMPANY_CODE");
  const divisionCode = Deno.env.get("VIVENTIUM_DIVISION_CODE");
  const baseUrl = (Deno.env.get("VIVENTIUM_BASE_URL") ?? "https://hcm.viventium.com").replace(/\/+$/, "");

  const missing = [
    ["VIVENTIUM_USERNAME", username],
    ["VIVENTIUM_PASSWORD", password],
    ["VIVENTIUM_COMPANY_CODE", companyCode],
    ["VIVENTIUM_DIVISION_CODE", divisionCode],
  ].filter(([, v]) => !v).map(([k]) => k);

  if (missing.length) {
    return jsonResponse({
      ok: false,
      connected: false,
      mode, dryRun,
      error: `Missing required Viventium secrets: ${missing.join(", ")}`,
      received: 0, normalized: 0, created: 0, updated: 0, matched: 0, skipped: 0, samples: [],
    });
  }

  // ---- create sync run ----
  const { data: runRow } = await admin
    .from("viventium_sync_runs")
    .insert({ mode, dry_run: dryRun, status: "running", created_by: userId })
    .select("id")
    .single();
  const runId = runRow?.id ?? null;

  const finalize = async (patch: Record<string, unknown>) => {
    if (!runId) return;
    await admin.from("viventium_sync_runs").update({ ...patch, completed_at: new Date().toISOString() }).eq("id", runId);
  };

  let cookieHeader = "";
  let xsrf = "";

  try {
    // ---- login ----
    const loginRes = await fetch(`${baseUrl}/API/Integration/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ Username: username, Password: password }),
    });
    if (!loginRes.ok) {
      const preview = (await loginRes.text()).slice(0, 200).replace(/[A-Za-z0-9+/=._-]{20,}/g, "***");
      await finalize({ status: "failed", error_message: `Login failed ${loginRes.status}: ${preview}` });
      return jsonResponse({
        ok: false, connected: false, mode, dryRun, runId,
        error: `Viventium login failed (${loginRes.status})`,
        received: 0, normalized: 0, created: 0, updated: 0, matched: 0, skipped: 0, samples: [],
      });
    }
    const cookies = parseCookies(loginRes.headers);
    xsrf = cookies["VM-XT-89001"] ?? "";
    const authCookie = cookies["VM-AT-89001"] ?? "";
    if (!xsrf || !authCookie) {
      await finalize({ status: "failed", error_message: "Missing VM-XT-89001 or VM-AT-89001 cookie after login" });
      return jsonResponse({
        ok: false, connected: false, mode, dryRun, runId,
        error: "Viventium login did not return expected cookies",
        received: 0, normalized: 0, created: 0, updated: 0, matched: 0, skipped: 0, samples: [],
      });
    }
    cookieHeader = `VM-XT-89001=${xsrf}; VM-AT-89001=${authCookie}`;

    if (mode === "connection-test") {
      await finalize({ status: "success" });
      return jsonResponse({
        ok: true, connected: true, mode, dryRun, runId,
        received: 0, normalized: 0, created: 0, updated: 0, matched: 0, skipped: 0, samples: [],
      });
    }

    // ---- fetch employees ----
    const exportUrl = `${baseUrl}/API/Integration/v1/export/companies/${encodeURIComponent(companyCode!)}/divisions/${encodeURIComponent(divisionCode!)}/employees/`;
    const empRes = await fetch(exportUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip",
        "X-XSRF-TOKEN": xsrf,
        Cookie: cookieHeader,
      },
    });
    if (!empRes.ok) {
      const preview = (await empRes.text()).slice(0, 200).replace(/[A-Za-z0-9+/=._-]{20,}/g, "***");
      await finalize({ status: "failed", error_message: `Export failed ${empRes.status}: ${preview}` });
      return jsonResponse({
        ok: false, connected: true, mode, dryRun, runId,
        error: `Viventium export failed (${empRes.status})`,
        received: 0, normalized: 0, created: 0, updated: 0, matched: 0, skipped: 0, samples: [],
      });
    }
    const payload = await empRes.json();
    const rawList: Record<string, unknown>[] = Array.isArray(payload)
      ? payload
      : (payload?.data ?? payload?.employees ?? payload?.Employees ?? payload?.items ?? []);

    const normalized = rawList.map(normalize).filter((n) => n.viventium_employee_id || n.email || n.employee_code);
    const received = rawList.length;

    const sampleKeys = rawList[0] ? Object.keys(rawList[0]).slice(0, 40) : [];
    const samples = normalized.slice(0, 5).map((n) => ({
      viventium_employee_id: n.viventium_employee_id,
      first_name: maskName(n.first_name),
      last_name: maskName(n.last_name),
      email: maskEmail(n.email),
      job_title: n.job_title,
      state: n.state,
      hire_date: n.hire_date,
      status: n.status,
    }));

    // ---- dry run ----
    if (dryRun) {
      await finalize({
        status: "success",
        records_received: received,
        records_normalized: normalized.length,
        metadata: { sample_keys: sampleKeys },
      });
      return jsonResponse({
        ok: true, connected: true, mode, dryRun, runId,
        received, normalized: normalized.length,
        created: 0, updated: 0, matched: 0, skipped: rawList.length - normalized.length,
        samples, sampleKeys,
      });
    }

    // ---- upsert active employees ----
    let created = 0, updated = 0, matched = 0, skipped = 0, linked = 0;
    const now = new Date().toISOString();

    // Preload profiles email -> user_id map (bounded — same order of magnitude as workforce).
    const emailToUserId = new Map<string, string>();
    {
      const { data: profs } = await admin.from("profiles").select("user_id,email").not("email", "is", null);
      for (const p of (profs ?? []) as { user_id: string; email: string | null }[]) {
        if (p.email && p.user_id) emailToUserId.set(p.email.toLowerCase(), p.user_id);
      }
    }

    // Only sync ACTIVE employees per operator requirement. Terminated/resigned
    // rows are counted as skipped so numbers stay honest.
    const activeOnly = normalized.filter((n) => n.status === "active");
    const nonActiveCount = normalized.length - activeOnly.length;
    skipped += nonActiveCount;

    for (const n of activeOnly) {
      let existingId: string | null = null;
      if (n.viventium_employee_id) {
        const { data } = await admin
          .from("employees").select("id")
          .eq("viventium_employee_id", n.viventium_employee_id).maybeSingle();
        existingId = data?.id ?? null;
      }
      if (!existingId && n.email) {
        const { data } = await admin
          .from("employees").select("id")
          .ilike("email", n.email).maybeSingle();
        existingId = data?.id ?? null;
      }
      if (!existingId && n.employee_code) {
        const { data } = await admin
          .from("employees").select("id")
          .eq("employee_code", n.employee_code).maybeSingle();
        existingId = data?.id ?? null;
      }

      const empType = mapEmploymentType(n.employment_type);
      const linkedUserId = n.email ? emailToUserId.get(n.email) ?? null : null;

      const directoryPatch: Record<string, unknown> = {
        first_name: n.first_name ?? undefined,
        last_name: n.last_name ?? undefined,
        preferred_name: n.preferred_name ?? undefined,
        email: n.email ?? undefined,
        phone: n.phone ?? undefined,
        job_title: n.job_title ?? undefined,
        state: n.state ?? undefined,
        employment_type: empType ?? undefined,
        hire_date: n.hire_date ?? undefined,
        start_date: n.start_date ?? undefined,
        status: n.status,
        viventium_employee_id: n.viventium_employee_id ?? undefined,
        viventium_sync_status: "synced",
        viventium_last_sync: now,
      };
      if (linkedUserId) directoryPatch.user_id = linkedUserId;

      if (existingId) {
        matched++;
        const { error } = await admin.from("employees").update(directoryPatch).eq("id", existingId);
        if (error) { skipped++; console.error("update failed", error.message); }
        else { updated++; if (linkedUserId) linked++; }
      } else {
        // Inserts need required NOT NULL fields.
        if (!n.first_name || !n.last_name || !n.job_title) { skipped++; continue; }
        const { error } = await admin.from("employees").insert({
          ...directoryPatch,
          state: n.state ?? "unknown",
          job_title: n.job_title,
          employee_code: n.employee_code ?? undefined,
        });
        if (error) { skipped++; console.error("insert failed", error.message); }
        else { created++; if (linkedUserId) linked++; }
      }
    }

    await finalize({
      status: "success",
      records_received: received,
      records_normalized: normalized.length,
      records_created: created,
      records_updated: updated,
      records_matched: matched,
      records_skipped: skipped,
      metadata: { sample_keys: sampleKeys, linked_to_auth_users: linked, non_active_skipped: nonActiveCount },
    });

    return jsonResponse({
      ok: true, connected: true, mode, dryRun, runId,
      received, normalized: normalized.length,
      created, updated, matched, skipped, linked, nonActiveSkipped: nonActiveCount, samples, sampleKeys,
    });
  } catch (e) {
    await finalize({ status: "failed", error_message: (e as Error).message?.slice(0, 500) ?? "unknown error" });
    return jsonResponse({
      ok: false, connected: false, mode, dryRun, runId,
      error: "Viventium sync error",
      received: 0, normalized: 0, created: 0, updated: 0, matched: 0, skipped: 0, samples: [],
    }, 500);
  } finally {
    // Best-effort logout — never throw.
    if (cookieHeader && xsrf) {
      try {
        await fetch(`${baseUrl}/API/Integration/v1/auth/logout`, {
          method: "POST",
          headers: { "X-XSRF-TOKEN": xsrf, Cookie: cookieHeader, Accept: "application/json" },
        });
      } catch { /* ignore */ }
    }
  }
});