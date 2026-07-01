import { useEffect, useMemo, useState } from "react";
import { pipelineStages, type LeadSource, type LeadStatus } from "@/data/leads";
import { supabase } from "@/integrations/supabase/client";
import {
  useMarketingData,
  type MktLead,
  type MktCall,
  type MktCandidate,
} from "@/hooks/useMarketingData";

/**
 * Marketing intelligence — derived entirely from persisted Blossom OS data
 * (intake_leads, recruiting_candidates, marketing_* operating tables).
 * No mock arrays. When tables are empty, every field returns zeroed/empty
 * so pages render calm empty states downstream.
 */
export interface SourceShare {
  source: LeadSource;
  count: number;
  share: number; // 0-100
  qualified: number; // VOB Completed or further
  qualifiedRate: number; // 0-100
}

export interface StateGrowthSignal {
  state: string;
  leads: number;
  qualified: number;
  calls: number;
  candidates: number;
}

const QUALIFIED_STATUSES = new Set([
  "VOB Completed",
  "Form Received",
  "Sent to VOB",
]);

const isQualified = (l: MktLead) => QUALIFIED_STATUSES.has(l.status);

export interface MarketingLiveExtras {
  sources: number;
  activeSources: number;
  campaigns: number;
  activeCampaigns: number;
  sourceEvents: number;
  newSourceEvents: number;
  emailEvents: number;
  totalSpendCents: number;
  totalImpressions: number;
  totalClicks: number;
}

const EMPTY_EXTRAS: MarketingLiveExtras = {
  sources: 0,
  activeSources: 0,
  campaigns: 0,
  activeCampaigns: 0,
  sourceEvents: 0,
  newSourceEvents: 0,
  emailEvents: 0,
  totalSpendCents: 0,
  totalImpressions: 0,
  totalClicks: 0,
};

function useMarketingLiveExtras(): MarketingLiveExtras {
  const [extras, setExtras] = useState<MarketingLiveExtras>(EMPTY_EXTRAS);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [srcRes, campRes, evtRes, emailRes, metRes] = await Promise.all([
          supabase.from("marketing_sources").select("id, is_active"),
          supabase.from("marketing_campaigns").select("id, status"),
          supabase.from("marketing_source_events").select("id, status"),
          supabase.from("marketing_email_events").select("id"),
          supabase.from("marketing_campaign_metrics").select("impressions, clicks, spend_cents"),
        ]);
        if (cancelled) return;
        const sources = (srcRes.data ?? []) as Array<{ is_active: boolean | null }>;
        const campaigns = (campRes.data ?? []) as Array<{ status: string | null }>;
        const events = (evtRes.data ?? []) as Array<{ status: string | null }>;
        const emails = (emailRes.data ?? []) as Array<unknown>;
        const metrics = (metRes.data ?? []) as Array<{
          impressions: number | null;
          clicks: number | null;
          spend_cents: number | null;
        }>;
        setExtras({
          sources: sources.length,
          activeSources: sources.filter((s) => s.is_active).length,
          campaigns: campaigns.length,
          activeCampaigns: campaigns.filter((c) => c.status === "active").length,
          sourceEvents: events.length,
          newSourceEvents: events.filter((e) => e.status === "new").length,
          emailEvents: emails.length,
          totalImpressions: metrics.reduce((a, m) => a + (m.impressions ?? 0), 0),
          totalClicks: metrics.reduce((a, m) => a + (m.clicks ?? 0), 0),
          totalSpendCents: metrics.reduce((a, m) => a + (m.spend_cents ?? 0), 0),
        });
      } catch {
        /* leave extras empty — page shows empty state */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return extras;
}

export function useMarketingIntelligence() {
  const { leads, calls, candidates, loading, error } = useMarketingData();
  const extras = useMarketingLiveExtras();

  return useMemo(() => {
    // ---- by source ---------------------------------------------------------
    const sourceMap = new Map<LeadSource, { count: number; qualified: number }>();
    leads.forEach((l) => {
      const entry = sourceMap.get(l.source) ?? { count: 0, qualified: 0 };
      entry.count += 1;
      if (isQualified(l)) entry.qualified += 1;
      sourceMap.set(l.source, entry);
    });
    const totalLeads = leads.length || 1;
    const bySource: SourceShare[] = Array.from(sourceMap.entries())
      .map(([source, v]) => ({
        source,
        count: v.count,
        share: Math.round((v.count / totalLeads) * 100),
        qualified: v.qualified,
        qualifiedRate: v.count ? Math.round((v.qualified / v.count) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // ---- by state ----------------------------------------------------------
    const stateMap = new Map<string, StateGrowthSignal>();
    const ensure = (s: string): StateGrowthSignal => {
      const cur = stateMap.get(s) ?? { state: s, leads: 0, qualified: 0, calls: 0, candidates: 0 };
      stateMap.set(s, cur);
      return cur;
    };
    leads.forEach((l) => {
      const row = ensure(l.state);
      row.leads += 1;
      if (isQualified(l)) row.qualified += 1;
    });
    calls.forEach((c) => {
      if (!c.state) return;
      ensure(c.state).calls += 1;
    });
    candidates.forEach((c) => {
      if (!c.state) return;
      ensure(c.state).candidates += 1;
    });
    const byState = Array.from(stateMap.values()).sort((a, b) => b.leads - a.leads);

    // ---- velocity / momentum ----------------------------------------------
    const now = Date.now();
    const within = (l: MktLead, days: number) =>
      now - new Date(l.createdAt).getTime() <= days * 86_400_000;
    const leadsLast7 = leads.filter((l) => within(l, 7)).length;
    const leadsLast30 = leads.filter((l) => within(l, 30)).length;
    const qualifiedLast30 = leads.filter((l) => within(l, 30) && isQualified(l)).length;
    const qualifiedRate = leadsLast30 ? Math.round((qualifiedLast30 / leadsLast30) * 100) : 0;

    // ---- calls (from marketing_call_events) -------------------------------
    const callsLast24h = calls.filter(
      (c) => now - new Date(c.createdAt).getTime() <= 86_400_000,
    ).length;
    const isMissed = (s: string) => /new|missed|no.?answer/i.test(s);
    const missedCalls = calls.filter(
      (c) => isMissed(c.status),
    ).length;
    const inboundCalls = calls.length;

    // ---- recruiting marketing ---------------------------------------------
    const recruitingSourceMap = new Map<string, number>();
    candidates.forEach((c) => {
      recruitingSourceMap.set(c.source, (recruitingSourceMap.get(c.source) ?? 0) + 1);
    });
    const recruitingBySource = Array.from(recruitingSourceMap.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);

    // ---- referrals ---------------------------------------------------------
    const referralLeads = leads.filter((l) => l.source === "Referral");
    const referralByState = new Map<string, number>();
    referralLeads.forEach((l) => {
      referralByState.set(l.state, (referralByState.get(l.state) ?? 0) + 1);
    });

    // ---- pipeline ---------------------------------------------------------
    const stageCounts = new Map<string, number>();
    leads.forEach((l) => stageCounts.set(l.status, (stageCounts.get(l.status) ?? 0) + 1));
    const pipeline = pipelineStages.map((s) => ({
      stage: s.name,
      count: stageCounts.get(s.name as unknown as string) ?? 0,
    }));
    // Bottlenecks: fall back to top-heavy stage buckets since we don't yet
    // persist per-lead "days in stage" on the live schema.
    const bottlenecks = Array.from(stageCounts.entries())
      .map(([stage, count]) => ({ stage: stage as LeadStatus, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // ---- state momentum (7d vs prior 7d) ----------------------------------
    const stateMomentum = new Map<string, { recent: number; prior: number }>();
    leads.forEach((l) => {
      const ageDays = (now - new Date(l.createdAt).getTime()) / 86_400_000;
      const m = stateMomentum.get(l.state) ?? { recent: 0, prior: 0 };
      if (ageDays <= 7) m.recent += 1;
      else if (ageDays <= 14) m.prior += 1;
      stateMomentum.set(l.state, m);
    });
    const stateTrend = byState.map((s) => {
      const m = stateMomentum.get(s.state) ?? { recent: 0, prior: 0 };
      const delta = m.recent - m.prior;
      const pct = m.prior ? Math.round((delta / m.prior) * 100) : m.recent > 0 ? 100 : 0;
      return { ...s, recent: m.recent, prior: m.prior, delta, pct };
    });

    return {
      totals: {
        leads: leads.length,
        calls: calls.length,
        candidates: candidates.length,
      },
      bySource,
      byState,
      stateTrend,
      pipeline,
      bottlenecks,
      velocity: {
        leadsLast7,
        leadsLast30,
        qualifiedLast30,
        qualifiedRate,
      },
      calls: {
        last24h: callsLast24h,
        missed: missedCalls,
        inbound: inboundCalls,
      },
      recruitingBySource,
      referrals: {
        total: referralLeads.length,
        byState: Array.from(referralByState.entries())
          .map(([state, count]) => ({ state, count }))
          .sort((a, b) => b.count - a.count),
      },
      extras,
      loading,
      error,
    };
  }, [leads, calls, candidates, extras, loading, error]);
}

export type MarketingIntelligence = ReturnType<typeof useMarketingIntelligence>;