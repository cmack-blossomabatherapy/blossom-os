/**
 * Shared helper used by every primary calculation hook (BCBA productivity,
 * supervision, parent training, caseload; RBT session/supervision KPIs;
 * billing reconciliation) to fold canonical CentralReach rows into their
 * return value when the role-specific table has no rows for the scoped
 * subject.
 *
 * Precedence — enforced in one place so every consumer behaves identically:
 *   1. role  — role table returned rows                → { source: "role" }
 *   2. canonical — canonical RPCs returned rows        → { source: "canonical" }
 *   3. missing — subject is unmapped or no data at all → { source: "missing" }
 *
 * When source === "canonical" the caller MUST render source/freshness labels
 * ("From CentralReach billing rows · newest row <date>") and MUST NOT emit
 * fields that the billing export does not carry (scheduled_time, location).
 * Those unavailable fields are surfaced as `unavailableFromCanonical`.
 */
import {
  fetchCanonicalProviderSummary,
  summarizeProviderRows,
  resolvePrecedence,
  type CanonicalScope,
  type CanonicalTotals,
  type CanonicalPrecedenceResult,
} from "./canonicalConsumer";

export type FallbackSource = "role" | "canonical" | "missing";

export interface CanonicalFallbackResult {
  source: FallbackSource;
  reason: CanonicalPrecedenceResult["reason"];
  totals: CanonicalTotals | null;
  freshness: {
    minServiceDate: string | null;
    maxServiceDate: string | null;
  };
  /**
   * Fields the canonical billing export cannot supply. Consumers must render
   * "unavailable from current export" for these instead of fabricating values.
   */
  unavailableFromCanonical: readonly string[];
  /** True when the subject is not reconciled to a CR provider id. */
  unmappedProvider: boolean;
}

export const CANONICAL_UNAVAILABLE_FIELDS = Object.freeze([
  "scheduled_start_time",
  "scheduled_end_time",
  "actual_start_time",
  "actual_end_time",
  "location",
  "cancellation_reason",
  "authorization_id",
] as const);

/**
 * Compute the canonical fallback for a given scope. Returns quickly with
 * `source: "role"` if the caller already has role rows — no RPC is called.
 */
export async function resolveCanonicalFallback(input: {
  roleRowCount: number;
  scope: CanonicalScope;
  requireScope?: boolean;
}): Promise<CanonicalFallbackResult> {
  // Fast-path: role table already answered.
  if (input.roleRowCount > 0) {
    return {
      source: "role",
      reason: "role_has_rows",
      totals: null,
      freshness: { minServiceDate: null, maxServiceDate: null },
      unavailableFromCanonical: CANONICAL_UNAVAILABLE_FIELDS,
      unmappedProvider: false,
    };
  }

  const requireScope = input.requireScope ?? true;
  const mapped = !!(input.scope.authUserId || input.scope.employeeId);
  if (requireScope && !mapped) {
    return {
      source: "missing",
      reason: "unmapped_provider",
      totals: null,
      freshness: { minServiceDate: null, maxServiceDate: null },
      unavailableFromCanonical: CANONICAL_UNAVAILABLE_FIELDS,
      unmappedProvider: true,
    };
  }

  let rows;
  try {
    rows = await fetchCanonicalProviderSummary(input.scope);
  } catch {
    // Canonical RPC unreachable — treat as missing rather than fabricating.
    return {
      source: "missing",
      reason: "no_data",
      totals: null,
      freshness: { minServiceDate: null, maxServiceDate: null },
      unavailableFromCanonical: CANONICAL_UNAVAILABLE_FIELDS,
      unmappedProvider: false,
    };
  }

  const totals = summarizeProviderRows(rows);
  const decision = resolvePrecedence({
    roleRowCount: 0,
    canonicalRowCount: totals.rowCount,
    scope: input.scope,
    requireScope,
  });

  if (decision.source === "canonical") {
    return {
      source: "canonical",
      reason: decision.reason,
      totals,
      freshness: {
        minServiceDate: totals.minServiceDate,
        maxServiceDate: totals.maxServiceDate,
      },
      unavailableFromCanonical: CANONICAL_UNAVAILABLE_FIELDS,
      unmappedProvider: false,
    };
  }

  return {
    source: "missing",
    reason: decision.source === "missing" ? decision.reason : "no_data",
    totals: null,
    freshness: { minServiceDate: null, maxServiceDate: null },
    unavailableFromCanonical: CANONICAL_UNAVAILABLE_FIELDS,
    unmappedProvider: false,
  };
}
