/**
 * Small pure presentation helpers for the Authorization Utilization report.
 *
 * Both exist to keep the report honest:
 *  - the reconciliation empty state may only claim agreement when there is at
 *    least one comparable CentralReach/recomputed hour pair;
 *  - a data-gap row must not print the same reason twice.
 */

/**
 * Empty-state copy for the reconciliation table.
 *
 * @param comparablePairs number of authorizations where both CentralReach used
 *   hours and recomputed billing hours exist (i.e. a variance is computable).
 */
export function reconciliationEmptyLabel(comparablePairs: number): string {
  const pairs = Number.isFinite(comparablePairs) ? Math.max(0, Math.trunc(comparablePairs)) : 0;
  if (pairs === 0) return "No comparable hour pairs are available to reconcile.";
  return "CentralReach used hours agree with recomputed billing hours for every authorization in view.";
}

const normalizeReason = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();

/**
 * Deduplicate gap reasons while preserving order and distinct wording.
 * Blank values are dropped; case/whitespace-only differences count as duplicates.
 */
export function dedupeGapReasons(reasons: (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of reasons) {
    if (typeof raw !== "string") continue;
    const text = raw.trim();
    if (!text) continue;
    const key = normalizeReason(text);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(text);
  }
  return out;
}
