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
  type ID,
} from "./store";
import type {
  ReferralCompany,
  ReferralContact,
  ReferralActivity,
} from "@/lib/os/referrals/types";

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

/* ---------------- hydrate ---------------- */

export async function hydrateFromSupabase(): Promise<{
  contacts: number; companies: number; activities: number;
}> {
  const [comp, cont, act] = await Promise.all([
    supabase.from("referral_companies").select("*").order("company_name"),
    supabase.from("referral_contacts").select("*").order("updated_at", { ascending: false }),
    supabase.from("referral_activities").select("*").order("activity_date", { ascending: false }).limit(500),
  ]);
  if (comp.error) throw comp.error;
  if (cont.error) throw cont.error;
  // activities are optional — don't blow up the page if RLS hides them
  const companies = (comp.data ?? []).map(companyFromRow);
  const contacts = (cont.data ?? []).map(contactFromRow);
  const activities = act.error ? [] : (act.data ?? []).map(activityFromRow);
  replaceCrmData({ companies, contacts, activity: activities });
  return { contacts: contacts.length, companies: companies.length, activities: activities.length };
}

/* ---------------- sync (CRM → Supabase) ---------------- */

// Tracks IDs that originated in Supabase. Locally-generated IDs (random base36)
// will not match this set, so we know to insert vs update.
const knownIds = new Set<string>();

function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}
function isPersisted(id: ID): boolean {
  return knownIds.has(id) || isUuid(id);
}

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
    source: "CRM",
  };
}

function companyToRow(c: Company) {
  return {
    id: isPersisted(c.id) ? c.id : undefined,
    company_name: c.name,
    website_url: c.website || null,
    main_phone: c.mainPhone || null,
    main_email: c.generalEmail || null,
    full_address: c.address || null,
    state: c.state || null,
    company_type: c.companyType || null,
    relationship_stage: c.referralPartnerStatus || null,
    referral_count: c.referralCount ?? 0,
    last_referral_date: c.lastReferralDate || null,
    last_contacted_at: c.lastContactedDate || null,
    next_follow_up_at: c.nextFollowUpDate || null,
    status: c.deletedAt ? "Archived" : "Active",
    notes: c.notes || null,
    source: "CRM",
  };
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
      if (!isPersisted(id) || !full) return;
      const { id: _omit, ...payload } = contactToRow(full);
      const { error } = await supabase.from("referral_contacts").update(payload as never).eq("id", id);
      if (error) console.warn("[crm bridge] contact update failed", error);
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
      if (!isPersisted(id) || !full) return;
      const { id: _omit, ...payload } = companyToRow(full);
      const { error } = await supabase.from("referral_companies").update(payload as never).eq("id", id);
      if (error) console.warn("[crm bridge] company update failed", error);
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

// Track persisted IDs as they arrive from hydration so updates target the
// correct rows. Patch hydrateFromSupabase to mirror ids into the set.
const _origHydrate = hydrateFromSupabase;
export async function hydrateFromSupabaseTracked(): Promise<ReturnType<typeof hydrateFromSupabase>> {
  const out = await _origHydrate();
  // After replaceCrmData the store has the new rows; but we don't keep a
  // pointer here. Pull ids again cheaply from the same tables — caps at small
  // counts via select("id").
  const [{ data: comp }, { data: cont }] = await Promise.all([
    supabase.from("referral_companies").select("id"),
    supabase.from("referral_contacts").select("id"),
  ]);
  knownIds.clear();
  for (const r of comp ?? []) knownIds.add(r.id as string);
  for (const r of cont ?? []) knownIds.add(r.id as string);
  return out;
}