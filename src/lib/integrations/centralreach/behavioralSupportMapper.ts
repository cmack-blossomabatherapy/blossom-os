import type { ClientPairing, CoverageRiskRow } from "@/hooks/useCentralReachOps";
import type { BehavioralSupportSupervisionSignal } from "./behavioralSupportTypes";

/**
 * Map CentralReach-derived pairing + coverage-risk data into
 * Behavioral Support supervision visibility signals.
 *
 * When we wire the real CentralReach API these functions will accept
 * CentralReachBehavioralSupportRecord[] directly. Until then this reads from
 * the already-imported bcba_billable_sessions surface via useCentralReachOps.
 */
export function mapPairingsToSupervisionSignals(
  pairings: ClientPairing[],
  coverageRisks: CoverageRiskRow[],
): BehavioralSupportSupervisionSignal[] {
  const riskByClient = new Map(coverageRisks.map((r) => [r.clientName, r]));
  const now = Date.now();

  return pairings.map((p) => {
    const daysSinceBcba = p.lastBcbaSessionDate
      ? Math.floor((now - new Date(p.lastBcbaSessionDate).getTime()) / 86_400_000)
      : null;
    const ratio = p.rbtHoursLast30d > 0 ? Math.round(((p.cancellationsLast30d) / Math.max(p.rbtHoursLast30d, 1)) * 100) / 100 : null;
    const flags: string[] = [];
    if (daysSinceBcba === null || daysSinceBcba > 30) flags.push("no_recent_bcba_supervision");
    if (p.cancellationsLast30d >= 3) flags.push("service_instability");
    const risk = riskByClient.get(p.clientName);
    if (risk?.level === "uncovered") flags.push("uncovered");
    if (risk?.level === "at_risk") flags.push("at_risk_coverage");
    return {
      clientName: p.clientName,
      state: p.state,
      bcbaName: p.bcbaName,
      rbtName: p.rbtName,
      daysSinceLastBcbaSupervision: daysSinceBcba,
      supervisionRatio: ratio,
      parentTrainingHoursLast30d: null,
      cancellationsLast30d: p.cancellationsLast30d,
      riskFlags: flags,
      centralreachClientId: null,
    };
  });
}