/**
 * Bridges the in-memory Referral CRM store to the Supabase referral tables.
 *
 * - hydrateFromSupabase(): pulls referral_companies / referral_contacts /
 *   referral_activities and replaces the matching CRM collections so the
 *   existing rich CRM UI renders real, persisted data.
 * - installSupabaseSync(): registers async write handlers so creates / updates
 *   / deletes in the CRM are mirrored back to Supabase. After each write the
 *   bridge re-hydrates so the store stays the source of truth.
 *
 * The store keeps using its own ID generator for fresh records; on the next
 * hydration those local rows are replaced by the persisted Supabase rows
 * (whose ids are real UUIDs).
 */
import { supabase } from "@/integrations/supabase/client";
import {
  replaceCrmData,
  setCrmSideEffects,
  type Contact,
  type Company,
  type ActivityEvent,
  type ImportBatch,
  type Referral,
  type Task,
  type ID,
} from "./store";
import type {
  ReferralCompany,
  ReferralContact,
  ReferralActivity,
  ReferralImportBatch,
} from "@/lib/os/referrals/types";
import type { Database } from "@/integrations/supabase/types";

type CrmReferralRow = Database["public"]["Tables"]["referral_crm_referrals"]["Row"];
type CrmTaskRow = Database["public"]["Tables"]["referral_crm_tasks"]["Row"];
type LeadLinkRow = Database["public"]["Tables"]["referral_lead_links"]["Row"];

/* ---------------- mapping: Supabase → CRM ---------------- */

function companyFromRow(r: ReferralCompany): Company {
  return {
    id: r.id,
    name: r.company_name,
    website: r.website_url ?? undefined,
    mainPhone: r.main_phone ?? undefined,
    generalEmail: r.main_email ?? undefined,
    address: r.full_address ?? undefined,
    state: r.state ?? undefined,
    companyType: r.company_type ?? undefined,
    referralPartnerStatus: r.relationship_stage ?? undefined,
    referralCount: r.referral_count ?? 0,
    referralsYTD: r.referral_count ?? 0,
    lastReferralDate: r.last_referral_date ?? undefined,
    lastContactedDate: r.last_contacted_at ?? undefined,
    nextFollowUpDate: r.next_follow_up_at ?? undefined,
    notes: r.notes ?? undefined,
    tags: [],
    createdAt: r.created_at ?? new Date().toISOString(),
    updatedAt: r.updated_at ?? new Date().toISOString(),
    deletedAt: r.status === "Archived" ? (r.updated_at ?? new Date().toISOString()) : undefined,
    // preserved Supabase-only fields
    domain: r.domain ?? undefined,
    serviceArea: (r as { service_area?: string | null }).service_area ?? undefined,
    relationshipOwner: r.relationship_owner ?? undefined,
    importBatchId: r.import_batch_id ?? undefined,
    source: r.source ?? undefined,
    normalizedName: (r as { normalized_name?: string | null }).normalized_name ?? undefined,
    fullAddress: r.full_address ?? undefined,
    websiteUrl: r.website_url ?? undefined,
    mainEmail: r.main_email ?? undefined,
  };
}

function contactFromRow(r: ReferralContact): Contact {
  return {
    id: r.id,
    firstName: r.first_name ?? (r.full_name ? r.full_name.split(" ")[0] : "") ?? "",
    lastName: r.last_name ?? (r.full_name ? r.full_name.split(" ").slice(1).join(" ") : "") ?? "",
    email: r.email ?? undefined,
    phone: r.phone ?? undefined,
    mobilePhone: r.mobile_phone ?? undefined,
    jobTitle: r.title ?? undefined,
    companyId: r.company_id ?? undefined,
    state: r.state ?? undefined,
    leadStatus: r.status ?? undefined,
    referralPartnerStatus: r.relationship_stage ?? undefined,
    referralSourceType: r.role_type ?? undefined,
    lastContactedDate: r.last_contacted_at ?? undefined,
    nextFollowUpDate: r.next_follow_up_at ?? undefined,
    lastReferralDate: r.last_activity_date ?? undefined,
    referralCount: r.number_of_referrals_sent ?? 0,
    notes: r.notes ?? undefined,
    tags: [],
    createdAt: r.created_at ?? new Date().toISOString(),
    updatedAt: r.updated_at ?? new Date().toISOString(),
    deletedAt: r.status === "Archived" ? (r.updated_at ?? new Date().toISOString()) : undefined,
    // preserved Supabase-only fields
    directPhone: (r as { direct_phone?: string | null }).direct_phone ?? undefined,
    contactOwner: (r as { contact_owner?: string[] | null }).contact_owner ?? undefined,
    numberOfSalesActivities: (r as { number_of_sales_activities?: number | null }).number_of_sales_activities ?? undefined,
    numberOfTimesContacted: (r as { number_of_times_contacted?: number | null }).number_of_times_contacted ?? undefined,
    originalRecordId: (r as { original_record_id?: string | null }).original_record_id ?? undefined,
    importBatchId: r.import_batch_id ?? undefined,
    recentEmailOpenedAt: (r as { recent_email_opened_at?: string | null }).recent_email_opened_at ?? undefined,
    lastMeetingBookedAt: (r as { last_meeting_booked_at?: string | null }).last_meeting_booked_at ?? undefined,
    source: r.source ?? undefined,
    fullAddress: (r as { full_address?: string | null }).full_address ?? undefined,
    websiteUrl: (r as { website_url?: string | null }).website_url ?? undefined,
  };
}

function activityTypeFromRow(t: string | null): ActivityEvent["type"] {
  const s = (t ?? "").toLowerCase();
  if (s.includes("call")) return "call";
  if (s.includes("email")) return "email";
  if (s.includes("meeting") || s.includes("visit") || s.includes("event")) return "meeting";
  if (s.includes("referral")) return "referral_received";
  if (s.includes("task") || s.includes("follow")) return "task";
  return "note";
}

function activityFromRow(r: ReferralActivity): ActivityEvent {
  const subj = (r as { subject?: string | null }).subject ?? null;
  const note = (r as { notes?: string | null }).notes ?? null;
  return {
    id: r.id,
    type: activityTypeFromRow(r.activity_type),
    message: subj || note || r.activity_type || "(activity)",
    contactId: r.contact_id ?? undefined,
    companyId: r.company_id ?? undefined,
    createdAt: r.activity_date ?? r.created_at ?? new Date().toISOString(),
  };
}

function batchFromRow(r: ReferralImportBatch): ImportBatch {
  return {
    id: r.id,
    fileName: r.file_name,
    uploadedAt: r.uploaded_at ?? r.created_at ?? new Date().toISOString(),
    uploadedBy: r.uploaded_by ?? undefined,
    totalRows: r.total_rows ?? 0,
    successfulRows: r.successful_rows ?? 0,
    failedRows: r.failed_rows ?? 0,
    duplicateContacts: r.duplicate_contacts ?? 0,
    duplicateCompanies: r.duplicate_companies ?? 0,
    status: r.status ?? "Completed",
  };
}

/* ---- referrals + tasks mappers ---- */

function normReferralStatus(s: string | null | undefined): Referral["referralStatus"] {
  const allowed: Referral["referralStatus"][] = ["New","In Review","Intake Form Sent","Scheduled","Active","Closed","Lost"];
  return (allowed as string[]).includes(s ?? "") ? (s as Referral["referralStatus"]) : "New";
}

function referralFromCrmRow(r: CrmReferralRow): Referral {
  const fn = r.patient_first_name ?? "";
  const li = r.patient_last_initial ?? "";
  return {
    id: r.id,
    name: r.name ?? (fn || li ? `${fn} ${li}.`.trim() : "(Referral)"),
    patientFirstName: fn,
    patientLastInitial: li,
    referralDate: r.referral_date ?? r.created_at ?? new Date().toISOString(),
    contactId: r.contact_id ?? undefined,
    companyId: r.company_id ?? undefined,
    state: r.state ?? undefined,
    serviceType: r.service_type ?? undefined,
    sourceType: r.source_type ?? undefined,
    referralStatus: normReferralStatus(r.referral_status),
    intakeStatus: r.intake_status ?? undefined,
    insuranceType: r.insurance_type ?? undefined,
    assignedIntakeOwnerId: r.assigned_intake_owner_id ?? undefined,
    attributionConfidence: r.attribution_confidence ?? undefined,
    leadId: r.lead_id ?? undefined,
    notes: r.notes ?? undefined,
    createdAt: r.created_at ?? new Date().toISOString(),
    updatedAt: r.updated_at ?? new Date().toISOString(),
    deletedAt: r.archived_at ?? undefined,
    isLegacyLeadLink: false,
  };
}

function referralFromLeadLinkRow(r: LeadLinkRow): Referral {
  return {
    id: r.id,
    name: "(Lead Link Referral)",
    patientFirstName: "",
    patientLastInitial: "",
    referralDate: (r.referral_date as string | null) ?? r.created_at ?? new Date().toISOString(),
    contactId: r.referral_contact_id ?? undefined,
    companyId: r.referral_company_id ?? undefined,
    serviceType: r.referral_source_type ?? undefined,
    sourceType: r.referral_source_type ?? undefined,
    referralStatus: "New",
    attributionConfidence: r.attribution_confidence ?? undefined,
    leadId: r.lead_id ?? undefined,
    notes: r.notes ?? undefined,
    createdAt: r.created_at ?? new Date().toISOString(),
    updatedAt: r.updated_at ?? new Date().toISOString(),
    isLegacyLeadLink: true,
  };
}

function taskFromRow(r: CrmTaskRow): Task {
  const t = (r.type ?? "Other") as Task["type"];
  const p = (r.priority ?? "Medium") as Task["priority"];
  const s = (r.status ?? "Open") as Task["status"];
  return {
    id: r.id,
    title: r.title,
    type: t,
    priority: p,
    status: s,
    assignedUserId: r.assigned_user_id ?? undefined,
    contactId: r.contact_id ?? undefined,
    companyId: r.company_id ?? undefined,
    referralId: r.referral_id ?? undefined,
    dueDate: r.due_date ?? undefined,
    notes: r.notes ?? undefined,
    createdAt: r.created_at ?? new Date().toISOString(),
    updatedAt: r.updated_at ?? new Date().toISOString(),
    completedAt: r.completed_at ?? undefined,
    deletedAt: r.archived_at ?? undefined,
  };
}

/* ---------------- hydrate ---------------- */

// Tracks IDs that originated in Supabase. Locally-generated IDs (random base36)
// will not match this set, so we know to insert vs update.
const knownIds = new Set<string>();

function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}
function isPersisted(id: ID): boolean {
  return knownIds.has(id) || isUuid(id);
}

export async function hydrateFromSupabase(): Promise<{
  contacts: number; companies: number; activities: number; importBatches: number; referrals: number; tasks: number;
}> {
  const [comp, cont, act, batches, crmRefs, leadLinks, crmTasks] = await Promise.all([
    supabase.from("referral_companies").select("*").order("company_name"),
    supabase.from("referral_contacts").select("*").order("updated_at", { ascending: false }),
    supabase.from("referral_activities").select("*").order("activity_date", { ascending: false }).limit(500),
    supabase.from("referral_import_batches").select("*").order("uploaded_at", { ascending: false }).limit(200),
    supabase.from("referral_crm_referrals").select("*").order("referral_date", { ascending: false }).limit(1000),
    supabase.from("referral_lead_links").select("*").order("referral_date", { ascending: false }).limit(1000),
    supabase.from("referral_crm_tasks").select("*").order("created_at", { ascending: false }).limit(1000),
  ]);
  if (comp.error) throw comp.error;
  if (cont.error) throw cont.error;
  // activities are optional — don't blow up the page if RLS hides them
  const companies = (comp.data ?? []).map(companyFromRow);
  const contacts = (cont.data ?? []).map(contactFromRow);
  const activities = act.error ? [] : (act.data ?? []).map(activityFromRow);
  const importBatches = batches.error ? [] : (batches.data ?? []).map(batchFromRow);
  const crmReferrals = crmRefs.error ? [] : (crmRefs.data ?? []).map(referralFromCrmRow);
  const legacyReferrals = leadLinks.error ? [] : (leadLinks.data ?? []).map(referralFromLeadLinkRow);
  const referrals = [...crmReferrals, ...legacyReferrals];
  const tasks = crmTasks.error ? [] : (crmTasks.data ?? []).map(taskFromRow);
  knownIds.clear();
  for (const r of companies) knownIds.add(r.id);
  for (const r of contacts) knownIds.add(r.id);
  for (const r of crmReferrals) knownIds.add(r.id);
  for (const r of tasks) knownIds.add(r.id);
  replaceCrmData({ companies, contacts, activity: activities, importBatches, referrals, tasks });
  return {
    contacts: contacts.length,
    companies: companies.length,
    activities: activities.length,
    importBatches: importBatches.length,
    referrals: referrals.length,
    tasks: tasks.length,
  };
}

/* ---------------- sync (CRM → Supabase) ---------------- */

/**
 * Full create payload. Includes every preserved field so a fresh insert
 * doesn't lose data. Updates use a narrower patch builder so we never
 * wipe original imported fields with null.
 */
function contactToRow(c: Contact) {
  return {
    id: isPersisted(c.id) ? c.id : undefined,
    first_name: c.firstName || null,
    last_name: c.lastName || null,
    full_name: [c.firstName, c.lastName].filter(Boolean).join(" ").trim() || null,
    email: c.email || null,
    phone: c.phone || null,
    mobile_phone: c.mobilePhone || null,
    title: c.jobTitle || null,
    company_id: c.companyId && isPersisted(c.companyId) ? c.companyId : null,
    state: c.state || null,
    status: c.deletedAt ? "Archived" : (c.leadStatus || "New"),
    relationship_stage: c.referralPartnerStatus || null,
    role_type: c.referralSourceType || null,
    last_contacted_at: c.lastContactedDate || null,
    next_follow_up_at: c.nextFollowUpDate || null,
    last_activity_date: c.lastReferralDate || null,
    number_of_referrals_sent: c.referralCount ?? 0,
    notes: c.notes || null,
    source: c.source ?? "CRM",
    direct_phone: c.directPhone ?? null,
    contact_owner: c.contactOwner ?? null,
    number_of_sales_activities: c.numberOfSalesActivities ?? null,
    number_of_times_contacted: c.numberOfTimesContacted ?? null,
    original_record_id: c.originalRecordId ?? null,
    import_batch_id: c.importBatchId ?? null,
    recent_email_opened_at: c.recentEmailOpenedAt ?? null,
    last_meeting_booked_at: c.lastMeetingBookedAt ?? null,
    full_address: c.fullAddress ?? null,
    website_url: c.websiteUrl ?? null,
  };
}

function companyToRow(c: Company) {
  return {
    id: isPersisted(c.id) ? c.id : undefined,
    company_name: c.name,
    website_url: c.websiteUrl ?? c.website ?? null,
    main_phone: c.mainPhone || null,
    main_email: c.mainEmail ?? c.generalEmail ?? null,
    full_address: c.fullAddress ?? c.address ?? null,
    state: c.state || null,
    company_type: c.companyType || null,
    relationship_stage: c.referralPartnerStatus || null,
    referral_count: c.referralCount ?? 0,
    last_referral_date: c.lastReferralDate || null,
    last_contacted_at: c.lastContactedDate || null,
    next_follow_up_at: c.nextFollowUpDate || null,
    status: c.deletedAt ? "Archived" : "Active",
    notes: c.notes || null,
    source: c.source ?? "CRM",
    domain: c.domain ?? null,
    service_area: c.serviceArea ?? null,
    relationship_owner: c.relationshipOwner ?? null,
    import_batch_id: c.importBatchId ?? null,
    normalized_name: c.normalizedName ?? null,
  };
}

/**
 * Narrow update payload — only the keys the user actually changed are
 * mapped to Supabase columns. This prevents accidentally wiping original
 * imported fields (direct_phone, original_record_id, etc.) with null
 * during a routine edit from the CRM UI.
 */
function contactPatchToRow(patch: Partial<Contact>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const set = <K extends keyof Contact>(k: K, col: string, v?: unknown) => {
    if (k in patch) out[col] = v === undefined ? (patch[k] ?? null) : v;
  };
  set("firstName", "first_name");
  set("lastName", "last_name");
  if ("firstName" in patch || "lastName" in patch) {
    const fn = (patch.firstName ?? "") as string;
    const ln = (patch.lastName ?? "") as string;
    out.full_name = [fn, ln].filter(Boolean).join(" ").trim() || null;
  }
  set("email", "email");
  set("phone", "phone");
  set("mobilePhone", "mobile_phone");
  set("jobTitle", "title");
  if ("companyId" in patch) {
    out.company_id = patch.companyId && isPersisted(patch.companyId) ? patch.companyId : null;
  }
  set("state", "state");
  if ("leadStatus" in patch || "deletedAt" in patch) {
    out.status = patch.deletedAt ? "Archived" : (patch.leadStatus ?? "New");
  }
  set("referralPartnerStatus", "relationship_stage");
  set("referralSourceType", "role_type");
  set("lastContactedDate", "last_contacted_at");
  set("nextFollowUpDate", "next_follow_up_at");
  set("lastReferralDate", "last_activity_date");
  if ("referralCount" in patch) out.number_of_referrals_sent = patch.referralCount ?? 0;
  set("notes", "notes");
  set("directPhone", "direct_phone");
  set("contactOwner", "contact_owner");
  set("numberOfSalesActivities", "number_of_sales_activities");
  set("numberOfTimesContacted", "number_of_times_contacted");
  set("originalRecordId", "original_record_id");
  set("importBatchId", "import_batch_id");
  set("recentEmailOpenedAt", "recent_email_opened_at");
  set("lastMeetingBookedAt", "last_meeting_booked_at");
  set("source", "source");
  set("fullAddress", "full_address");
  set("websiteUrl", "website_url");
  return out;
}

function companyPatchToRow(patch: Partial<Company>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const set = <K extends keyof Company>(k: K, col: string) => {
    if (k in patch) out[col] = patch[k] ?? null;
  };
  if ("name" in patch) out.company_name = patch.name;
  if ("website" in patch || "websiteUrl" in patch) {
    out.website_url = patch.websiteUrl ?? patch.website ?? null;
  }
  set("mainPhone", "main_phone");
  if ("generalEmail" in patch || "mainEmail" in patch) {
    out.main_email = patch.mainEmail ?? patch.generalEmail ?? null;
  }
  if ("address" in patch || "fullAddress" in patch) {
    out.full_address = patch.fullAddress ?? patch.address ?? null;
  }
  set("state", "state");
  set("companyType", "company_type");
  set("referralPartnerStatus", "relationship_stage");
  if ("referralCount" in patch) out.referral_count = patch.referralCount ?? 0;
  set("lastReferralDate", "last_referral_date");
  set("lastContactedDate", "last_contacted_at");
  set("nextFollowUpDate", "next_follow_up_at");
  if ("deletedAt" in patch) out.status = patch.deletedAt ? "Archived" : "Active";
  set("notes", "notes");
  set("domain", "domain");
  set("serviceArea", "service_area");
  set("relationshipOwner", "relationship_owner");
  set("importBatchId", "import_batch_id");
  set("source", "source");
  set("normalizedName", "normalized_name");
  return out;
}

// Debounced rehydrate so a burst of mutations only triggers one reload.
let rehydrateTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleRehydrate() {
  if (rehydrateTimer) clearTimeout(rehydrateTimer);
  rehydrateTimer = setTimeout(() => {
    rehydrateTimer = null;
    hydrateFromSupabase().catch((e) => console.warn("[crm bridge] rehydrate failed", e));
  }, 350);
}

export function installSupabaseSync() {
  setCrmSideEffects({
    onContactCreate: async (c) => {
      const row = contactToRow(c);
      const { id: _omit, ...payload } = row;
      const { error } = await supabase.from("referral_contacts").insert(payload as never);
      if (error) { console.warn("[crm bridge] contact insert failed", error); return; }
      scheduleRehydrate();
    },
    onContactUpdate: async (id, _patch, full) => {
      if (!isPersisted(id)) return;
      const payload = contactPatchToRow(_patch);
      if (Object.keys(payload).length === 0) return;
      const { error } = await supabase.from("referral_contacts").update(payload as never).eq("id", id);
      if (error) console.warn("[crm bridge] contact update failed", error);
      void full;
    },
    onContactDelete: async (id, hard) => {
      if (!isPersisted(id)) return;
      if (hard) {
        const { error } = await supabase.from("referral_contacts").delete().eq("id", id);
        if (error) console.warn("[crm bridge] contact delete failed", error);
      } else {
        const { error } = await supabase.from("referral_contacts").update({ status: "Archived" } as never).eq("id", id);
        if (error) console.warn("[crm bridge] contact archive failed", error);
      }
      scheduleRehydrate();
    },
    onCompanyCreate: async (c) => {
      const { id: _omit, ...payload } = companyToRow(c);
      const { error } = await supabase.from("referral_companies").insert(payload as never);
      if (error) { console.warn("[crm bridge] company insert failed", error); return; }
      scheduleRehydrate();
    },
    onCompanyUpdate: async (id, _patch, full) => {
      if (!isPersisted(id)) return;
      const payload = companyPatchToRow(_patch);
      if (Object.keys(payload).length === 0) return;
      const { error } = await supabase.from("referral_companies").update(payload as never).eq("id", id);
      if (error) console.warn("[crm bridge] company update failed", error);
      void full;
    },
    onCompanyDelete: async (id, hard) => {
      if (!isPersisted(id)) return;
      if (hard) {
        const { error } = await supabase.from("referral_companies").delete().eq("id", id);
        if (error) console.warn("[crm bridge] company delete failed", error);
      } else {
        const { error } = await supabase.from("referral_companies").update({ status: "Archived" } as never).eq("id", id);
        if (error) console.warn("[crm bridge] company archive failed", error);
      }
      scheduleRehydrate();
    },
    onActivityCreate: async (a) => {
      // Only persist if attached to a Supabase-backed contact or company.
      const cid = a.contactId && isPersisted(a.contactId) ? a.contactId : null;
      const coid = a.companyId && isPersisted(a.companyId) ? a.companyId : null;
      if (!cid && !coid) return;
      const payload = {
        contact_id: cid,
        company_id: coid,
        activity_type: ({
          call: "Call", email: "Email", meeting: "Meeting",
          referral_received: "Referral Received", task: "Task", note: "Note",
        } as Record<ActivityEvent["type"], string>)[a.type] ?? "Note",
        activity_date: a.createdAt,
        notes: a.message,
      };
      const { error } = await supabase.from("referral_activities").insert(payload as never);
      if (error) console.warn("[crm bridge] activity insert failed", error);
    },
  });
}
