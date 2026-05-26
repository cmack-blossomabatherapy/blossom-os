import { useMemo } from "react";
import { mockLeads, pipelineStages, type Lead, type LeadSource, type LeadStatus } from "@/data/leads";
import { mockPhoneCalls } from "@/data/calls";
import { mockCandidates } from "@/data/recruiting";

/**
 * Marketing intelligence — derived entirely from the same real data the rest
 * of Blossom OS consumes. No mock marketing numbers; no fake campaigns.
 * Empty fields render calm empty states downstream.
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

const isQualified = (l: Lead) => QUALIFIED_STATUSES.has(l.status);

export function useMarketingIntelligence() {
  return useMemo(() => {
    const leads = mockLeads;
    const calls = mockPhoneCalls;
    const candidates = mockCandidates;

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
    const within = (l: Lead, days: number) =>
      now - new Date(l.createdAt).getTime() <= days * 86_400_000;
    const leadsLast7 = leads.filter((l) => within(l, 7)).length;
    const leadsLast30 = leads.filter((l) => within(l, 30)).length;
    const qualifiedLast30 = leads.filter((l) => within(l, 30) && isQualified(l)).length;
    const qualifiedRate = leadsLast30 ? Math.round((qualifiedLast30 / leadsLast30) * 100) : 0;

    // ---- calls -------------------------------------------------------------
    const callsLast24h = calls.filter(
      (c) => now - new Date(c.callTime).getTime() <= 86_400_000,
    ).length;
    const missedCalls = calls.filter(
      (c) => c.direction === "Inbound" && (c.status === "New" || c.outcome === "No Answer"),
    ).length;
    const inboundCalls = calls.filter((c) => c.direction === "Inbound").length;

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
    const stageCounts = new Map<LeadStatus, number>();
    leads.forEach((l) => stageCounts.set(l.status, (stageCounts.get(l.status) ?? 0) + 1));
    const pipeline = pipelineStages.map((s) => ({
      stage: s.name,
      count: stageCounts.get(s.name) ?? 0,
    }));
    const stuckThreshold = 7;
    const stuck = leads.filter((l) => l.daysInStage >= stuckThreshold);
    const stuckByStage = new Map<LeadStatus, number>();
    stuck.forEach((l) => stuckByStage.set(l.status, (stuckByStage.get(l.status) ?? 0) + 1));
    const bottlenecks = Array.from(stuckByStage.entries())
      .map(([stage, count]) => ({ stage, count }))
      .sort((a, b) => b.count - a.count);

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
    };
  }, []);
}

export type MarketingIntelligence = ReturnType<typeof useMarketingIntelligence>;