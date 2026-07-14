import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LeadReferralLinkRow {
  id: string;
  lead_id: string | null;
  referral_company_id: string | null;
  referral_contact_id: string | null;
  referral_date: string | null;
  referral_source_type: string | null;
  notes: string | null;
  company?: { id: string; company_name: string; main_phone: string | null; main_email: string | null; company_type: string | null } | null;
  contact?: { id: string; full_name: string | null; first_name: string | null; last_name: string | null; email: string | null; phone: string | null; title: string | null; company_id: string | null } | null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function useLeadReferralLink(leadId: string | null | undefined) {
  const [link, setLink] = useState<LeadReferralLinkRow | null>(null);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!leadId || !UUID_RE.test(leadId)) {
      setLink(null);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("referral_lead_links")
      .select(
        "*, company:referral_companies(id, company_name, main_phone, main_email, company_type), contact:referral_contacts(id, full_name, first_name, last_name, email, phone, title, company_id)",
      )
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setLink((data as unknown as LeadReferralLinkRow) ?? null);
    setLoading(false);
  }, [leadId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const linkReferral = useCallback(
    async (input: { companyId?: string | null; contactId?: string | null; notes?: string | null }) => {
      if (!leadId || !UUID_RE.test(leadId)) throw new Error("This lead isn't synced yet.");
      if (link) {
        const { error } = await supabase
          .from("referral_lead_links")
          .update({
            referral_company_id: input.companyId ?? null,
            referral_contact_id: input.contactId ?? null,
            notes: input.notes ?? null,
            referral_date: link.referral_date ?? new Date().toISOString().slice(0, 10),
          } as never)
          .eq("id", link.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("referral_lead_links").insert({
          lead_id: leadId,
          referral_company_id: input.companyId ?? null,
          referral_contact_id: input.contactId ?? null,
          notes: input.notes ?? null,
          referral_date: new Date().toISOString().slice(0, 10),
          referral_source_type: input.contactId ? "contact" : input.companyId ? "company" : null,
        } as never);
        if (error) throw error;
      }
      await refetch();
    },
    [leadId, link, refetch],
  );

  const unlink = useCallback(async () => {
    if (!link) return;
    await supabase.from("referral_lead_links").delete().eq("id", link.id);
    await refetch();
  }, [link, refetch]);

  return { link, loading, refetch, linkReferral, unlink };
}

/** Lightweight search over referral_companies and referral_contacts for the picker. */
export async function searchReferralSources(q: string): Promise<{
  companies: Array<{ id: string; company_name: string; company_type: string | null; state: string | null }>;
  contacts: Array<{ id: string; full_name: string | null; first_name: string | null; last_name: string | null; email: string | null; company_id: string | null; title: string | null }>;
}> {
  const term = q.trim();
  const like = term ? `%${term}%` : null;
  const compQ = like
    ? supabase
        .from("referral_companies")
        .select("id, company_name, company_type, state")
        .ilike("company_name", like)
        .limit(20)
    : supabase.from("referral_companies").select("id, company_name, company_type, state").order("last_referral_date", { ascending: false, nullsFirst: false }).limit(15);
  const contactQ = like
    ? supabase
        .from("referral_contacts")
        .select("id, full_name, first_name, last_name, email, company_id, title")
        .or(`full_name.ilike.${like},first_name.ilike.${like},last_name.ilike.${like},email.ilike.${like}`)
        .limit(20)
    : supabase.from("referral_contacts").select("id, full_name, first_name, last_name, email, company_id, title").order("last_activity_date", { ascending: false, nullsFirst: false }).limit(15);
  const [c, p] = await Promise.all([compQ, contactQ]);
  return { companies: (c.data ?? []) as never, contacts: (p.data ?? []) as never };
}