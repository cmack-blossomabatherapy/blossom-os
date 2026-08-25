/**
 * Canonical BCBA ownership adapter — the ONLY sanctioned way for reports
 * outside the V3 boundary to learn which BCBA owns a client's hours.
 *
 * HARD V3 BOUNDARY: this module *reads* `src/lib/os/bcbaProductivityV3/*`
 * (`buildOwnership`, the shared-row loader) and never modifies it. Ownership
 * inference — month anchors, splits, carry-forward, backfill — stays owned by
 * the V3 engine. Nothing here re-implements it; if the answer is unknown the
 * adapter returns `null` so the calling report says "Unassigned" instead of
 * guessing a different owner than the V3 report shows.
 *
 * Resolution order for a client is deliberate:
 *   1. CentralReach client id  (stable across name spellings and renames)
 *   2. normalized client name  (fallback for rows with no CR id)
 * A date narrows the answer to the ownership segment covering that date, so a
 * client who changed BCBAs mid-period is attributed honestly per session.
 */
import {
  buildOwnership,
  normalizeKeyName,
  type EngineBillingRow,
  type OwnedBillingRow,
  type OwnershipReason,
  type OwnershipResult,
} from "@/lib/os/bcbaProductivityV3/engine";
import {
  getBcbaProductivitySharedRows,
  getBcbaSharedLoadHealth,
  type BcbaSharedBillingRow,
  type BcbaSharedLoadHealth,
} from "@/lib/os/bcbaProductivityV3/adminUploadStore";

export interface CanonicalOwner {
  bcba: string | null;
  reason: OwnershipReason | "unknown";
  /** How the client was matched to the ownership index. */
  matchedBy: "client_cr_id" | "client_name" | "none";
}

export const UNKNOWN_OWNER: CanonicalOwner = {
  bcba: null,
  reason: "unknown",
  matchedBy: "none",
};

export interface OwnershipLookupKey {
  clientCrId?: string | null;
  clientName?: string | null;
  /** `YYYY-MM-DD`; when supplied the month-specific owner is preferred. */
  date?: string | null;
}

export interface CanonicalOwnershipIndex {
  /** Resolve the owning BCBA for one client (optionally at a point in time). */
  resolve(key: OwnershipLookupKey): CanonicalOwner;
  /** Distinct owning BCBA names, sorted. */
  bcbas: string[];
  /** Client count the index can answer for. */
  clientCount: number;
  /** Straight passthrough of the V3 ownership result, for provenance panels. */
  result: OwnershipResult;
  health: BcbaSharedLoadHealth | null;
}

const monthOf = (iso: string | null | undefined) => String(iso ?? "").slice(0, 7);

function idKey(clientCrId: string | null | undefined): string | null {
  const v = String(clientCrId ?? "").trim();
  return v ? `id:${v.toLowerCase()}` : null;
}

function nameKey(clientName: string | null | undefined): string | null {
  const v = normalizeKeyName(clientName ?? "");
  return v ? `name:${v}` : null;
}

/** Map shared V3 rows into the engine's input contract (no logic changes). */
export function toEngineRows(rows: BcbaSharedBillingRow[]): EngineBillingRow[] {
  return rows.map((r) => ({
    clientId: r.clientId,
    clientName: r.clientName,
    renderingProvider: r.renderingProvider,
    providerLabels: r.providerLabels,
    code: r.code,
    hours: r.hours,
    date: r.date,
    state: r.state,
    payor: r.payor,
    location: r.location,
  }));
}

/**
 * Build the lookup index from an already-computed V3 ownership result.
 * Pure — safe to unit test without touching the network.
 */
export function buildCanonicalOwnershipIndex(
  result: OwnershipResult,
  health: BcbaSharedLoadHealth | null = null,
): CanonicalOwnershipIndex {
  // key -> month -> owner, plus a whole-dataset fallback per key.
  const byKeyMonth = new Map<string, Map<string, CanonicalOwner>>();
  const byKeyAny = new Map<string, CanonicalOwner>();
  const hoursByKeyOwner = new Map<string, Map<string, number>>();
  const bcbas = new Set<string>();
  const clients = new Set<string>();

  const remember = (key: string | null, row: OwnedBillingRow, matchedBy: CanonicalOwner["matchedBy"]) => {
    if (!key || !row.owner) return;
    const month = row.monthKey || monthOf(row.date);
    if (!byKeyMonth.has(key)) byKeyMonth.set(key, new Map());
    const months = byKeyMonth.get(key)!;
    if (!months.has(month)) {
      months.set(month, { bcba: row.owner, reason: row.ownerReason, matchedBy });
    }
    // Whole-dataset fallback: the owner with the most attributed hours.
    if (!hoursByKeyOwner.has(key)) hoursByKeyOwner.set(key, new Map());
    const tally = hoursByKeyOwner.get(key)!;
    tally.set(row.owner, (tally.get(row.owner) ?? 0) + (Number(row.hours) || 0));
    const top = [...tally.entries()].sort((a, b) => b[1] - a[1])[0];
    byKeyAny.set(key, { bcba: top[0], reason: row.ownerReason, matchedBy });
  };

  for (const row of result.rows) {
    if (row.owner) bcbas.add(row.owner);
    const ik = idKey(row.clientId);
    const nk = nameKey(row.clientName);
    if (ik) clients.add(ik);
    else if (nk) clients.add(nk);
    remember(ik, row, "client_cr_id");
    remember(nk, row, "client_name");
  }

  const lookup = (key: string | null, date: string | null | undefined): CanonicalOwner | null => {
    if (!key) return null;
    const month = monthOf(date);
    if (month) {
      const hit = byKeyMonth.get(key)?.get(month);
      if (hit) return hit;
    }
    return byKeyAny.get(key) ?? null;
  };

  return {
    resolve({ clientCrId, clientName, date }) {
      // CR id first — the only identifier stable across name spellings.
      return (
        lookup(idKey(clientCrId), date) ??
        lookup(nameKey(clientName), date) ??
        UNKNOWN_OWNER
      );
    },
    bcbas: [...bcbas].sort((a, b) => a.localeCompare(b)),
    clientCount: clients.size,
    result,
    health,
  };
}

/**
 * Load the shared V3 dataset and return the canonical ownership index.
 * Reports call this once and reuse the index for every row they attribute.
 */
export async function loadCanonicalOwnershipIndex(
  opts: { force?: boolean } = {},
): Promise<CanonicalOwnershipIndex> {
  const shared = await getBcbaProductivitySharedRows({ force: opts.force });
  const result = buildOwnership(toEngineRows(shared));
  return buildCanonicalOwnershipIndex(result, getBcbaSharedLoadHealth());
}
