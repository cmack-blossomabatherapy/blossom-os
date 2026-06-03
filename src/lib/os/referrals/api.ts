import { supabase } from "@/integrations/supabase/client";
import type { ReferralCompany, ReferralContact, ReferralActivity, ReferralImportBatch } from "./types";
import { normalizeCompanyName, extractDomain } from "./utils";

export async function listContacts(): Promise<ReferralContact[]> {
  const { data, error } = await supabase
    .from("referral_contacts")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listCompanies(): Promise<ReferralCompany[]> {
  const { data, error } = await supabase
    .from("referral_companies")
    .select("*")
    .order("company_name");
  if (error) throw error;
  return data ?? [];
}

export async function listActivities(filter: { contactId?: string; companyId?: string } = {}): Promise<ReferralActivity[]> {
  let q = supabase.from("referral_activities").select("*").order("activity_date", { ascending: false });
  if (filter.contactId) q = q.eq("contact_id", filter.contactId);
  if (filter.companyId) q = q.eq("company_id", filter.companyId);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function listBatches(): Promise<ReferralImportBatch[]> {
  const { data, error } = await supabase
    .from("referral_import_batches")
    .select("*")
    .order("uploaded_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Find or create a company by name+domain+state. Returns company id. */
export async function findOrCreateCompany(input: {
  company_name: string;
  domain?: string | null;
  state?: string | null;
  company_type?: string | null;
  website_url?: string | null;
  main_phone?: string | null;
  full_address?: string | null;
  relationship_owner?: string | null;
  source?: string | null;
  import_batch_id?: string | null;
}): Promise<string> {
  const normalized = normalizeCompanyName(input.company_name);
  if (!normalized) throw new Error("Company name required");

  // Try match by normalized_name first
  let existing: { id: string; domain: string | null } | null = null;
  const { data: byName } = await supabase
    .from("referral_companies")
    .select("id, domain")
    .eq("normalized_name", normalized)
    .limit(5);
  if (byName && byName.length) {
    if (input.domain) {
      const dm = byName.find((c) => c.domain && c.domain.toLowerCase() === input.domain!.toLowerCase());
      existing = dm ?? byName[0];
    } else {
      existing = byName[0];
    }
  } else if (input.domain) {
    const { data: byDomain } = await supabase
      .from("referral_companies")
      .select("id, domain")
      .eq("domain", input.domain.toLowerCase())
      .limit(1);
    if (byDomain && byDomain.length) existing = byDomain[0];
  }

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("referral_companies")
    .insert({
      company_name: input.company_name,
      company_type: input.company_type ?? null,
      website_url: input.website_url ?? null,
      domain: input.domain ?? null,
      main_phone: input.main_phone ?? null,
      state: input.state ?? null,
      full_address: input.full_address ?? null,
      relationship_owner: input.relationship_owner ?? null,
      source: input.source ?? "Manual",
      import_batch_id: input.import_batch_id ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return created.id;
}

export async function createContact(input: Partial<ReferralContact> & { first_name?: string | null; last_name?: string | null }): Promise<ReferralContact> {
  const full_name = [input.first_name, input.last_name].filter(Boolean).join(" ").trim() || null;
  const { data, error } = await supabase
    .from("referral_contacts")
    .insert({ ...input, full_name })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateContact(id: string, patch: Partial<ReferralContact>): Promise<void> {
  const full_name =
    patch.first_name !== undefined || patch.last_name !== undefined
      ? [patch.first_name, patch.last_name].filter(Boolean).join(" ").trim() || null
      : undefined;
  const body = full_name !== undefined ? { ...patch, full_name } : patch;
  const { error } = await supabase.from("referral_contacts").update(body).eq("id", id);
  if (error) throw error;
}

export async function archiveContact(id: string): Promise<void> {
  const { error } = await supabase.from("referral_contacts").update({ status: "Archived" }).eq("id", id);
  if (error) throw error;
}

export async function createCompany(input: Partial<ReferralCompany> & { company_name: string }): Promise<ReferralCompany> {
  const { data, error } = await supabase.from("referral_companies").insert(input).select("*").single();
  if (error) throw error;
  return data;
}

export async function updateCompany(id: string, patch: Partial<ReferralCompany>): Promise<void> {
  const { error } = await supabase.from("referral_companies").update(patch).eq("id", id);
  if (error) throw error;
}

export async function createActivity(input: Partial<ReferralActivity> & { activity_type: string }): Promise<void> {
  const { error } = await supabase.from("referral_activities").insert(input);
  if (error) throw error;
  // bump contact last_contacted_at + activity counter
  if (input.contact_id) {
    await supabase.rpc; // noop guard for ts
    await supabase
      .from("referral_contacts")
      .update({
        last_contacted_at: (input.activity_date as string) ?? new Date().toISOString(),
        last_activity_date: (input.activity_date as string) ?? new Date().toISOString(),
        next_follow_up_at: (input.next_follow_up_at as string) ?? undefined,
      })
      .eq("id", input.contact_id);
  }
}

export { extractDomain };