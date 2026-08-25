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
 * DATE-EXACT BY CONSTRUCTION: resolution reads the V3 `OwnershipSegment` list,
 * honoring each segment's `startDate`/`endDate`. A client whose BCBA changed
 * mid-month resolves differently before and after the split date. When a date
 * is supplied and no segment covers it, the answer is unknown — the adapter
 * never substitutes an all-time dominant owner, because that would disagree
 * with the V3 report for exactly the rows that matter most.
 *
 * Resolution order for a client is deliberate:
 *   1. CentralReach client id  (stable across name spellings and renames)
 *   2. normalized client name  (fallback for rows with no CR id)
 */
import {
  buildOwnership,
  normalizeKeyName,
  type EngineBillingRow,
  type OwnershipConflictRow,
  type OwnershipGapRow,
  type OwnershipReason,
  type OwnershipResult,
  type OwnershipSegment,
} from "@/lib/os/bcbaProductivityV3/engine";
import {
  getBcbaProductivityDatasetStatus,
  getBcbaProductivitySharedRows,
  getBcbaSharedLoadHealth,
  type BcbaDatasetStatus,
  type BcbaSharedBillingRow,
  type BcbaSharedLoadHealth,
} from "@/lib/os/bcbaProductivityV3/adminUploadStore";

export interface CanonicalOwner {
  bcba: string | null;
  reason: OwnershipReason | "unknown";
  /** How the client was matched to the ownership index. */
  matchedBy: "client_cr_id" | "client_name" | "none";
  /**
   * How the answer was reached. `segment` is a real V3 ownership segment
   * covering the requested date. `fallback_latest_segment` is only ever used
   * when the caller supplied no date, and is labeled so panels can say so.
   */
  basis: "segment" | "fallback_latest_segment" | "none";
}

export const UNKNOWN_OWNER: CanonicalOwner = {
  bcba: null,
  reason: "unknown",
  matchedBy: "none",
  basis: "none",
};

export interface OwnershipLookupKey {
  clientCrId?: string | null;
  clientName?: string | null;
  /** `YYYY-MM-DD`; when supplied only a segment covering it can answer. */
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
  /** V3 ownership provenance, surfaced so reports can disclose uncertainty. */
  conflicts: OwnershipConflictRow[];
  gaps: OwnershipGapRow[];
  clientsWithoutAnchors: OwnershipResult["clientsWithoutAnchors"];
  health: BcbaSharedLoadHealth | null;
  /** Dataset freshness/scale of the shared V3 billing rows. */
  datasetStatus: BcbaDatasetStatus | null;
}

const dayKey = (iso: string | null | undefined) => String(iso ?? "").slice(0, 10);

function idKey(clientCrId: string | null | undefined): string | null {
  const v = String(clientCrId ?? "").trim();
  return v ? `id:${v.toLowerCase()}` : null;
}

function nameKey(clientName: string | null | undefined): string | null {
  const v = normalizeKeyName(clientName ?? "");
  return v ? `name:${v}` : null;
}

/**
 * Map shared V3 rows into the engine's input contract. This mapping must stay
 * byte-for-byte equivalent to the V3 page's own mapping, including
 * `location: r.location ?? ""`, or ownership would diverge from the report.
 */
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
    location: r.location ?? "",
  }));
}

/** Sort segments so lookups and fallbacks are deterministic. */
function sortSegments(a: OwnershipSegment, b: OwnershipSegment): number {
  return (
    a.startDate.localeCompare(b.startDate) ||
    a.monthKey.localeCompare(b.monthKey) ||
    a.bcba.localeCompare(b.bcba)
  );
}

function covers(segment: OwnershipSegment, date: string): boolean {
  if (segment.startDate && date < segment.startDate) return false;
  if (segment.endDate && date > segment.endDate) return false;
  return true;
}

/**
 * Build the lookup index from an already-computed V3 ownership result.
 * Pure — safe to unit test without touching the network.
 */
export function buildCanonicalOwnershipIndex(
  result: OwnershipResult,
  health: BcbaSharedLoadHealth | null = null,
  datasetStatus: BcbaDatasetStatus | null = null,
): CanonicalOwnershipIndex {
  const byKey = new Map<string, OwnershipSegment[]>();
  const bcbas = new Set<string>();
  const clients = new Set<string>();

  const remember = (key: string | null, segment: OwnershipSegment) => {
    if (!key || !segment.bcba) return;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key)!.push(segment);
  };

  for (const segment of result.segments ?? []) {
    if (segment.bcba) bcbas.add(segment.bcba);
    const ik = idKey(segment.clientId);
    const nk = nameKey(segment.clientName);
    if (ik) clients.add(ik);
    else if (nk) clients.add(nk);
    remember(ik, segment);
    remember(nk, segment);
  }
  for (const list of byKey.values()) list.sort(sortSegments);

  const answer = (
    segment: OwnershipSegment,
    matchedBy: CanonicalOwner["matchedBy"],
    basis: CanonicalOwner["basis"],
  ): CanonicalOwner => ({
    bcba: segment.bcba,
    reason: segment.reason,
    matchedBy,
    basis,
  });

  return {
    resolve({ clientCrId, clientName, date }) {
      // CR id first — the only identifier stable across name spellings. Only
      // the first key that the index knows about is consulted, so a name
      // collision can never override an id-matched client.
      const candidates: [string | null, CanonicalOwner["matchedBy"]][] = [
        [idKey(clientCrId), "client_cr_id"],
        [nameKey(clientName), "client_name"],
      ];
      for (const [key, matchedBy] of candidates) {
        if (!key) continue;
        const segments = byKey.get(key);
        if (!segments || segments.length === 0) continue;

        const day = dayKey(date);
        if (day) {
          const hit = segments.find((s) => covers(s, day));
          // No covering segment: honestly unknown. Never fall back to the
          // all-time dominant owner — that is how misattribution happens.
          return hit ? answer(hit, matchedBy, "segment") : UNKNOWN_OWNER;
        }
        // No date supplied: deterministic latest-segment fallback, labeled.
        return answer(segments[segments.length - 1], matchedBy, "fallback_latest_segment");
      }
      return UNKNOWN_OWNER;
    },
    bcbas: [...bcbas].sort((a, b) => a.localeCompare(b)),
    clientCount: clients.size,
    result,
    conflicts: result.conflicts ?? [],
    gaps: result.gaps ?? [],
    clientsWithoutAnchors: result.clientsWithoutAnchors ?? [],
    health,
    datasetStatus,
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
  let datasetStatus: BcbaDatasetStatus | null = null;
  try {
    datasetStatus = await getBcbaProductivityDatasetStatus();
  } catch {
    datasetStatus = null;
  }
  return buildCanonicalOwnershipIndex(result, getBcbaSharedLoadHealth(), datasetStatus);
}
