import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { LeadSource } from "@/data/leads";
import type { Database } from "@/integrations/supabase/types";

const KNOWN_LEAD_SOURCES = new Set<LeadSource>([
  "Website",
  "Phone",
  "Facebook",
  "Referral",
  "Ads",
  "Organic",
  "Digital",
  "Insurance",
]);

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
  if (KNOWN_LEAD_SOURCES.has(trimmed as LeadSource)) return trimmed as LeadSource;
  const key = trimmed.toLowerCase();
  return LEAD_SOURCE_ALIASES[key] ?? "Referral";
}

const UNKNOWN_STATE = "Unknown";

/**
 * marketing_call_events does not yet carry a dedicated `direction` column, so
 * we infer inbound/outbound from the status text produced by CTM/Jivetel/
 * Retell webhooks. Unknown → null so downstream UIs stay honest.
 */
function inferDirection(status: string | null | undefined): "inbound" | "outbound" | null {
  if (!status) return null;
  const s = status.toLowerCase();
  if (s.includes("outbound") || s.includes("outgoing")) return "outbound";
  if (
    s.includes("inbound") ||
    s.includes("incoming") ||
    s.includes("missed") ||
    s.includes("no_answer") ||
    s.includes("no answer") ||
    s.includes("voicemail") ||
    s.includes("new")
  )
    return "inbound";
  return null;
}

type IntakeLeadRow = Pick<
  Database["public"]["Tables"]["intake_leads"]["Row"],
  "id" | "referral_source" | "state" | "pipeline_stage" | "created_at" | "last_contacted_at" | "last_contact_date"
>;
type RecruitingCandidateRow = Pick<
  Database["public"]["Tables"]["recruiting_candidates"]["Row"],
  "id" | "source" | "state" | "role" | "pipeline_stage" | "is_archived" | "applied_date"
>;
type MarketingCallEventRow = Pick<
  Database["public"]["Tables"]["marketing_call_events"]["Row"],
  "id" | "occurred_at" | "source_system" | "state" | "status" | "lead_id" | "duration_seconds"
> & {
  // Optional structured columns added by the Pass 101 migration; types may
  // lag until Supabase types regenerate, so treat as optional strings.
  direction?: string | null;
  call_category?: string | null;
  disposition?: string | null;
  assigned_owner_id?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
};

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
  /** Always present — null states are coerced to `"Unknown"` so map keys stay safe. */
  state: string;
  status: string;
  createdAt: string;
  /** Most recent contact timestamp; falls back to `createdAt` when never contacted. */
  lastContacted: string | null;
};
export type MktCandidate = {
  id: string;
  /** Recruiting sources include channels outside `LeadSource` (e.g. "Apploi", "Direct"). */
  source: string;
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
  /** "inbound" | "outbound" | null — mirrors marketing_call_events.direction. */
  direction: string | null;
  /** intake_leads.id when the call was linked to an intake lead. */
  leadId: string | null;
  /** call length in seconds; null when unknown. */
  durationSeconds: number | null;
  callCategory: string | null;
  disposition: string | null;
  reviewedAt: string | null;
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
          .select("id, referral_source, state, pipeline_stage, created_at, last_contacted_at, last_contact_date")
          .limit(2000),
        supabase
          .from("recruiting_candidates")
          .select("id, source, state, role, pipeline_stage, is_archived, applied_date")
          .limit(2000),
        supabase
          .from("marketing_call_events")
          .select("id, occurred_at, source_system, state, status, lead_id, duration_seconds, direction, call_category, disposition, assigned_owner_id, reviewed_by, reviewed_at")
          .limit(2000),
      ]);

      if (leadsRes.error) throw leadsRes.error;
      if (candRes.error) throw candRes.error;
      // call events table may be brand new; tolerate empty result
      if (callsRes.error && callsRes.error.code !== "PGRST116") {
        // ignore — show empty calls instead of breaking the page
      }

      setLeads(
        ((leadsRes.data ?? []) as IntakeLeadRow[]).map((l) => ({
          id: l.id,
          source: normalizeLeadSource(l.referral_source),
          state: l.state ?? UNKNOWN_STATE,
          status: l.pipeline_stage ?? "Lead Captured",
          createdAt: l.created_at,
          lastContacted: l.last_contacted_at ?? l.last_contact_date ?? null,
        })),
      );
      setCandidates(
        ((candRes.data ?? []) as RecruitingCandidateRow[]).map((c) => ({
          id: c.id,
          source: c.source ?? "Direct",
          state: c.state ?? null,
          role: c.role ?? "RBT",
          stage: c.pipeline_stage ?? "New Applicant",
          status: c.is_archived ? "Withdrawn" : "Active",
          appliedDate: c.applied_date ?? new Date().toISOString(),
        })),
      );
      setCalls(
        ((callsRes.data ?? []) as MarketingCallEventRow[]).map((c) => ({
          id: c.id,
          createdAt: c.occurred_at,
          source: normalizeLeadSource(c.source_system),
          state: c.state ?? null,
          status: c.status ?? "Unknown",
          direction: c.direction ?? inferDirection(c.status),
          leadId: c.lead_id ?? null,
          durationSeconds: c.duration_seconds ?? null,
          callCategory: c.call_category ?? null,
          disposition: c.disposition ?? null,
          reviewedAt: c.reviewed_at ?? null,
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