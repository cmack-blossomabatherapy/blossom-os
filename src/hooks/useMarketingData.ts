import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { LeadSource } from "@/data/leads";

const KNOWN_LEAD_SOURCES: LeadSource[] = [
  "Website",
  "Phone",
  "Facebook",
  "Referral",
  "Ads",
  "Organic",
  "Digital",
  "Insurance",
];

const LEAD_SOURCE_ALIASES: Record<string, LeadSource> = {
  web: "Website",
  website: "Website",
  organic: "Organic",
  seo: "Organic",
  google: "Organic",
  search: "Organic",
  phone: "Phone",
  call: "Phone",
  inbound: "Phone",
  facebook: "Facebook",
  fb: "Facebook",
  meta: "Facebook",
  instagram: "Facebook",
  referral: "Referral",
  referrer: "Referral",
  partner: "Referral",
  ads: "Ads",
  ppc: "Ads",
  paid: "Ads",
  "google ads": "Ads",
  digital: "Digital",
  email: "Digital",
  insurance: "Insurance",
  payer: "Insurance",
};

/** Coerce an arbitrary string (or null) into a known LeadSource literal. */
export function normalizeLeadSource(raw: string | null | undefined): LeadSource {
  if (!raw) return "Referral";
  const trimmed = raw.trim();
  if ((KNOWN_LEAD_SOURCES as string[]).includes(trimmed)) return trimmed as LeadSource;
  const key = trimmed.toLowerCase();
  return LEAD_SOURCE_ALIASES[key] ?? "Referral";
}

/**
 * Real-data hook for Marketing surfaces. Replaces the previous reliance on
 * mockLeads / mockPhoneCalls / mockCandidates so Marketing KPIs reflect
 * actual operational data. Returns shapes compatible with the legacy mock
 * fields the pages already read (`source`, `state`, `status`, `createdAt`,
 * `stage`, `role`, `appliedDate`).
 *
 * When the underlying tables are empty, the arrays return empty — pages
 * naturally render an honest empty state instead of fabricated metrics.
 */
export type MktLead = {
  id: string;
  source: LeadSource;
  state: string | null;
  status: string;
  createdAt: string;
};
export type MktCandidate = {
  id: string;
  source: LeadSource;
  state: string | null;
  role: string;
  stage: string;
  status: string;
  appliedDate: string;
};
export type MktCall = {
  id: string;
  createdAt: string;
  source: LeadSource;
  state: string | null;
  status: string;
};

export interface UseMarketingDataResult {
  leads: MktLead[];
  candidates: MktCandidate[];
  calls: MktCall[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useMarketingData(): UseMarketingDataResult {
  const [leads, setLeads] = useState<MktLead[]>([]);
  const [candidates, setCandidates] = useState<MktCandidate[]>([]);
  const [calls, setCalls] = useState<MktCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [leadsRes, candRes, callsRes] = await Promise.all([
        supabase
          .from("intake_leads")
          .select("id, referral_source, state, pipeline_stage, created_at")
          .limit(2000),
        supabase
          .from("recruiting_candidates")
          .select("id, source, state, role, pipeline_stage, is_archived, applied_date")
          .limit(2000),
        supabase
          .from("marketing_call_events")
          .select("id, occurred_at, source_system, state, status")
          .limit(2000),
      ]);

      if (leadsRes.error) throw leadsRes.error;
      if (candRes.error) throw candRes.error;
      // call events table may be brand new; tolerate empty result
      if (callsRes.error && callsRes.error.code !== "PGRST116") {
        // ignore — show empty calls instead of breaking the page
      }

      setLeads(
        (leadsRes.data ?? []).map((l: any) => ({
          id: l.id,
          source: normalizeLeadSource(l.referral_source),
          state: l.state ?? null,
          status: l.pipeline_stage ?? "Lead Captured",
          createdAt: l.created_at,
        })),
      );
      setCandidates(
        (candRes.data ?? []).map((c: any) => ({
          id: c.id,
          source: normalizeLeadSource(c.source),
          state: (c.state as string) ?? null,
          role: c.role,
          stage: c.pipeline_stage,
          status: c.is_archived ? "Withdrawn" : "Active",
          appliedDate: c.applied_date,
        })),
      );
      setCalls(
        (callsRes.data ?? []).map((c: any) => ({
          id: c.id,
          createdAt: c.occurred_at,
          source: normalizeLeadSource(c.source_system),
          state: c.state ?? null,
          status: c.status ?? "Unknown",
        })),
      );
    } catch (e: any) {
      setError(e?.message ?? "Failed to load marketing data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return { leads, candidates, calls, loading, error, refetch: load };
}