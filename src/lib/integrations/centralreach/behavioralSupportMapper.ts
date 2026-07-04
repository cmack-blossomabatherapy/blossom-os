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
    // Supervision ratio is defined as 97155 / 97153 (BCBA supervision hours
    // divided by RBT direct therapy hours). The current internal pairing
    // source (bcba_billable_sessions) does not carry per-procedure-code totals
    // yet, so we intentionally return null rather than surface a misleading
    // proxy such as cancellations / rbt hours. Once the CentralReach adapter
    // provides supervisionHours97155 / hours97153 this becomes:
    //   ratio = hours97153 > 0 ? supervisionHours97155 / hours97153 : null;
    const supervisionRatio: number | null = null;
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
      supervisionRatio,
      parentTrainingHoursLast30d: null,
      cancellationsLast30d: p.cancellationsLast30d,
      riskFlags: flags,
      centralreachClientId: null,
    };
  });
}

/**
 * Compute the true supervision ratio (97155 / 97153) from a CentralReach
 * Behavioral Support record once the live adapter is wired. Returns null when
 * either code total is missing or when 97153 hours are zero.
 */
export function computeSupervisionRatio(
  supervisionHours97155: number | null | undefined,
  hours97153: number | null | undefined,
): number | null {
  if (supervisionHours97155 == null || hours97153 == null) return null;
  if (hours97153 <= 0) return null;
  return Math.round((supervisionHours97155 / hours97153) * 100) / 100;
}