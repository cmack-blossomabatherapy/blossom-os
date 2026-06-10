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
  type Attachment,
  type AuditLogEntry,
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
type CrmAttachmentRow = Database["public"]["Tables"]["referral_crm_attachments"]["Row"];
type CrmAuditRow = Database["public"]["Tables"]["referral_crm_audit_log"]["Row"];

const REFERRAL_CRM_BUCKET = "referral-crm-files";

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

function attachmentFromRow(r: CrmAttachmentRow): Attachment {
  const ot = (["contact","company","referral","task","activity","general"].includes(r.object_type)
    ? r.object_type : "general") as Attachment["objectType"];
  return {
    id: r.id,
    fileName: r.file_name,
    fileType: r.file_type ?? undefined,
    mimeType: r.file_type ?? undefined,
    sizeBytes: r.file_size ?? undefined,
    objectType: ot,
    objectId: r.object_id,
    uploadedByUserId: r.uploaded_by ?? undefined,
    uploadedByName: r.uploaded_by_name ?? undefined,
    uploadedAt: r.uploaded_at ?? r.created_at ?? new Date().toISOString(),
    category: (r.category as Attachment["category"]) ?? undefined,
    notes: r.notes ?? undefined,
    storageBucket: r.storage_bucket ?? REFERRAL_CRM_BUCKET,
    storagePath: r.storage_path,
    archivedAt: r.archived_at ?? undefined,
  };
}

function auditFromRow(r: CrmAuditRow): AuditLogEntry {
  const allowedActions = new Set([
    "create","update","delete","restore","merge","import","export",
    "workflow_toggle","workflow_run","attachment_added","attachment_removed",
    "field_added","field_removed",
  ]);
  const allowedObjs = new Set([
    "contact","company","referral","task","workflow","attachment","field","system",
  ]);
  return {
    id: r.id,
    at: r.created_at,
    userId: r.actor_user_id ?? undefined,
    actor: r.actor_name ?? "System",
    action: (allowedActions.has(r.action) ? r.action : "update") as AuditLogEntry["action"],
    objectType: (allowedObjs.has(r.object_type) ? r.object_type : "system") as AuditLogEntry["objectType"],
    objectId: r.object_id ?? undefined,
    objectLabel: r.object_label ?? undefined,
    summary: r.summary ?? r.action,
    beforeData: (r.before_data as Record<string, unknown> | null) ?? null,
    afterData: (r.after_data as Record<string, unknown> | null) ?? null,
    metadata: (r.metadata as Record<string, unknown> | null) ?? null,
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
  attachments: number; auditEntries: number;
  missing: string[];
}> {
  const [comp, cont, act, batches, crmRefs, leadLinks, crmTasks, atts, auditRows] = await Promise.all([
    supabase.from("referral_companies").select("*").order("company_name"),
    supabase.from("referral_contacts").select("*").order("updated_at", { ascending: false }),
    supabase.from("referral_activities").select("*").order("activity_date", { ascending: false }).limit(500),
    supabase.from("referral_import_batches").select("*").order("uploaded_at", { ascending: false }).limit(200),
    supabase.from("referral_crm_referrals").select("*").order("referral_date", { ascending: false }).limit(1000),
    supabase.from("referral_lead_links").select("*").order("referral_date", { ascending: false }).limit(1000),
    supabase.from("referral_crm_tasks").select("*").order("created_at", { ascending: false }).limit(1000),
    supabase.from("referral_crm_attachments").select("*").order("uploaded_at", { ascending: false }).limit(1000),
    supabase.from("referral_crm_audit_log").select("*").order("created_at", { ascending: false }).limit(500),
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
  const attachments = atts.error ? [] : (atts.data ?? []).map(attachmentFromRow);
  const auditLog = auditRows.error ? [] : (auditRows.data ?? []).map(auditFromRow);
  const missing: string[] = [];
  if (crmRefs.error) { console.warn("[crm bridge] referral_crm_referrals unavailable", crmRefs.error); missing.push("referral_crm_referrals"); }
  if (crmTasks.error) { console.warn("[crm bridge] referral_crm_tasks unavailable", crmTasks.error); missing.push("referral_crm_tasks"); }
  if (atts.error) { console.warn("[crm bridge] referral_crm_attachments unavailable", atts.error); missing.push("referral_crm_attachments"); }
  if (auditRows.error) { console.warn("[crm bridge] referral_crm_audit_log unavailable", auditRows.error); missing.push("referral_crm_audit_log"); }
  knownIds.clear();
  for (const r of companies) knownIds.add(r.id);
  for (const r of contacts) knownIds.add(r.id);
  for (const r of crmReferrals) knownIds.add(r.id);
  for (const r of legacyReferrals) knownIds.add(r.id);
  for (const r of tasks) knownIds.add(r.id);
  for (const r of attachments) knownIds.add(r.id);
  for (const r of auditLog) knownIds.add(r.id);
  replaceCrmData({ companies, contacts, activity: activities, importBatches, referrals, tasks, attachments, auditLog });
  return {
    contacts: contacts.length,
    companies: companies.length,
    activities: activities.length,
    importBatches: importBatches.length,
    referrals: referrals.length,
    tasks: tasks.length,
    attachments: attachments.length,
    auditEntries: auditLog.length,
    missing,
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
    onReferralCreate: async (r) => {
      const payload = {
        name: r.name,
        patient_first_name: r.patientFirstName || null,
        patient_last_initial: r.patientLastInitial || null,
        referral_date: r.referralDate ? r.referralDate.slice(0, 10) : null,
        contact_id: r.contactId && isPersisted(r.contactId) ? r.contactId : null,
        company_id: r.companyId && isPersisted(r.companyId) ? r.companyId : null,
        state: r.state ?? null,
        service_type: r.serviceType ?? null,
        source_type: r.sourceType ?? null,
        referral_status: r.referralStatus,
        intake_status: r.intakeStatus ?? null,
        insurance_type: r.insuranceType ?? null,
        assigned_intake_owner_id: r.assignedIntakeOwnerId ?? null,
        attribution_confidence: r.attributionConfidence ?? null,
        lead_id: r.leadId ?? null,
        notes: r.notes ?? null,
      };
      const { error } = await supabase.from("referral_crm_referrals").insert(payload as never);
      if (error) { console.warn("[crm bridge] referral insert failed", error); return; }
      scheduleRehydrate();
    },
    onReferralUpdate: async (id, patch, full) => {
      if (!isPersisted(id)) return;
      if (full?.isLegacyLeadLink) return; // read-only mirror of referral_lead_links
      const out: Record<string, unknown> = {};
      if ("name" in patch) out.name = patch.name ?? null;
      if ("patientFirstName" in patch) out.patient_first_name = patch.patientFirstName ?? null;
      if ("patientLastInitial" in patch) out.patient_last_initial = patch.patientLastInitial ?? null;
      if ("referralDate" in patch) out.referral_date = patch.referralDate ? patch.referralDate.slice(0, 10) : null;
      if ("contactId" in patch) out.contact_id = patch.contactId && isPersisted(patch.contactId) ? patch.contactId : null;
      if ("companyId" in patch) out.company_id = patch.companyId && isPersisted(patch.companyId) ? patch.companyId : null;
      if ("state" in patch) out.state = patch.state ?? null;
      if ("serviceType" in patch) out.service_type = patch.serviceType ?? null;
      if ("sourceType" in patch) out.source_type = patch.sourceType ?? null;
      if ("referralStatus" in patch) out.referral_status = patch.referralStatus ?? "New";
      if ("intakeStatus" in patch) out.intake_status = patch.intakeStatus ?? null;
      if ("insuranceType" in patch) out.insurance_type = patch.insuranceType ?? null;
      if ("assignedIntakeOwnerId" in patch) out.assigned_intake_owner_id = patch.assignedIntakeOwnerId ?? null;
      if ("attributionConfidence" in patch) out.attribution_confidence = patch.attributionConfidence ?? null;
      if ("leadId" in patch) out.lead_id = patch.leadId ?? null;
      if ("notes" in patch) out.notes = patch.notes ?? null;
      if ("deletedAt" in patch) out.archived_at = patch.deletedAt ?? null;
      if (Object.keys(out).length === 0) return;
      const { error } = await supabase.from("referral_crm_referrals").update(out as never).eq("id", id);
      if (error) console.warn("[crm bridge] referral update failed", error);
      scheduleRehydrate();
    },
    onReferralDelete: async (id, hard) => {
      if (!isPersisted(id)) return;
      if (hard) {
        const { error } = await supabase.from("referral_crm_referrals").delete().eq("id", id);
        if (error) console.warn("[crm bridge] referral delete failed", error);
      } else {
        const { error } = await supabase.from("referral_crm_referrals").update({ archived_at: new Date().toISOString() } as never).eq("id", id);
        if (error) console.warn("[crm bridge] referral archive failed", error);
      }
      scheduleRehydrate();
    },
    onTaskCreate: async (t) => {
      const payload = {
        title: t.title,
        type: t.type ?? null,
        priority: t.priority ?? null,
        status: t.status ?? "Open",
        due_date: t.dueDate ? t.dueDate.slice(0, 10) : null,
        completed_at: t.completedAt ?? null,
        assigned_user_id: t.assignedUserId ?? null,
        contact_id: t.contactId && isPersisted(t.contactId) ? t.contactId : null,
        company_id: t.companyId && isPersisted(t.companyId) ? t.companyId : null,
        referral_id: t.referralId && isPersisted(t.referralId) ? t.referralId : null,
        notes: t.notes ?? null,
      };
      const { error } = await supabase.from("referral_crm_tasks").insert(payload as never);
      if (error) { console.warn("[crm bridge] task insert failed", error); return; }
      scheduleRehydrate();
    },
    onTaskUpdate: async (id, patch) => {
      if (!isPersisted(id)) return;
      const out: Record<string, unknown> = {};
      if ("title" in patch) out.title = patch.title;
      if ("type" in patch) out.type = patch.type ?? null;
      if ("priority" in patch) out.priority = patch.priority ?? null;
      if ("status" in patch) out.status = patch.status ?? "Open";
      if ("dueDate" in patch) out.due_date = patch.dueDate ? patch.dueDate.slice(0, 10) : null;
      if ("completedAt" in patch) out.completed_at = patch.completedAt ?? null;
      if ("assignedUserId" in patch) out.assigned_user_id = patch.assignedUserId ?? null;
      if ("contactId" in patch) out.contact_id = patch.contactId && isPersisted(patch.contactId) ? patch.contactId : null;
      if ("companyId" in patch) out.company_id = patch.companyId && isPersisted(patch.companyId) ? patch.companyId : null;
      if ("referralId" in patch) out.referral_id = patch.referralId && isPersisted(patch.referralId) ? patch.referralId : null;
      if ("notes" in patch) out.notes = patch.notes ?? null;
      if ("deletedAt" in patch) out.archived_at = patch.deletedAt ?? null;
      if (Object.keys(out).length === 0) return;
      const { error } = await supabase.from("referral_crm_tasks").update(out as never).eq("id", id);
      if (error) console.warn("[crm bridge] task update failed", error);
      scheduleRehydrate();
    },
    onTaskDelete: async (id, hard) => {
      if (!isPersisted(id)) return;
      if (hard) {
        const { error } = await supabase.from("referral_crm_tasks").delete().eq("id", id);
        if (error) console.warn("[crm bridge] task delete failed", error);
      } else {
        const { error } = await supabase.from("referral_crm_tasks").update({ archived_at: new Date().toISOString() } as never).eq("id", id);
        if (error) console.warn("[crm bridge] task archive failed", error);
      }
      scheduleRehydrate();
    },
    onAttachmentCreate: async (a) => {
      if (!a.storagePath) {
        // No backing storage path — can't persist meaningfully.
        return;
      }
      const payload = {
        id: isPersisted(a.id) ? a.id : undefined,
        object_type: a.objectType,
        object_id: a.objectId,
        file_name: a.fileName,
        file_type: a.fileType ?? a.mimeType ?? null,
        file_size: a.sizeBytes ?? null,
        category: a.category ?? null,
        storage_bucket: a.storageBucket ?? REFERRAL_CRM_BUCKET,
        storage_path: a.storagePath,
        uploaded_by_name: a.uploadedByName ?? null,
        uploaded_at: a.uploadedAt,
        notes: a.notes ?? null,
      };
      const { error } = await supabase.from("referral_crm_attachments").insert(payload as never);
      if (error) { console.warn("[crm bridge] attachment insert failed", error); return; }
      scheduleRehydrate();
    },
    onAttachmentUpdate: async (id, patch) => {
      if (!isPersisted(id)) return;
      const out: Record<string, unknown> = {};
      if ("fileName" in patch) out.file_name = patch.fileName;
      if ("category" in patch) out.category = patch.category ?? null;
      if ("notes" in patch) out.notes = patch.notes ?? null;
      if ("archivedAt" in patch) out.archived_at = patch.archivedAt ?? null;
      if (Object.keys(out).length === 0) return;
      const { error } = await supabase.from("referral_crm_attachments").update(out as never).eq("id", id);
      if (error) console.warn("[crm bridge] attachment update failed", error);
    },
    onAttachmentDelete: async (id, _hard, full) => {
      if (!isPersisted(id)) return;
      const { error } = await supabase.from("referral_crm_attachments").delete().eq("id", id);
      if (error) console.warn("[crm bridge] attachment delete failed", error);
      if (full?.storagePath) {
        const bucket = full.storageBucket ?? REFERRAL_CRM_BUCKET;
        const { error: sErr } = await supabase.storage.from(bucket).remove([full.storagePath]);
        if (sErr) console.warn("[crm bridge] attachment storage delete failed", sErr);
      }
    },
    onAuditCreate: async (e) => {
      // Don't echo entries that were just hydrated from Supabase (uuid ids).
      if (isUuid(e.id)) return;
      const payload = {
        actor_user_id: null,
        actor_name: e.actor ?? null,
        action: e.action,
        object_type: e.objectType,
        object_id: e.objectId ?? null,
        object_label: e.objectLabel ?? null,
        summary: e.summary ?? null,
        before_data: e.beforeData ?? null,
        after_data: e.afterData ?? null,
        metadata: e.metadata ?? null,
      };
      const { error } = await supabase.from("referral_crm_audit_log").insert(payload as never);
      if (error) console.warn("[crm bridge] audit insert failed", error);
    },
  });
}
