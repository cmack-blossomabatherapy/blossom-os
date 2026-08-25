/**
 * Shared, order-independent client identity resolution for report metrics.
 *
 * Building name→CR-id aliases while iterating rows makes the output depend on
 * input order: the first id seen for a name wins, and id-less rows encountered
 * before any id-bearing row split into their own group. This resolver scans
 * every relevant input up front, so grouping is deterministic:
 *
 * - a row that carries a CR id always resolves to `cr:<id>`;
 * - an id-less row adopts `cr:<id>` only when exactly one CR id is associated
 *   with its normalized name across the complete input;
 * - with zero associated ids the row resolves to `nm:<normalized name>`;
 * - with several associated ids the row resolves to an explicitly ambiguous
 *   name key, so the distinct CR ids are never merged.
 *
 * The resolver is pure and holds no PHI beyond the values already passed in.
 */

export interface ClientIdentityInput {
  client?: string | null;
  clientName?: string | null;
  client_name?: string | null;
  clientCrId?: string | null;
  client_cr_id?: string | null;
}

export interface ClientIdentityResolver {
  /** Deterministic normalized name (lowercase, collapsed whitespace). */
  normalizeName(name: string | null | undefined): string;
  /** Sorted unique CR ids associated with a name across the whole input. */
  idsForName(name: string | null | undefined): string[];
  /** Stable identity key for one row. */
  keyFor(crId: string | null | undefined, name: string | null | undefined): string;
  /** True when an id-less row of this name cannot be attributed to one id. */
  isAmbiguousName(name: string | null | undefined): boolean;
}

export const UNKNOWN_CLIENT_NAME = "Unknown client";

function normalize(name: string | null | undefined): string {
  const trimmed = String(name ?? "").trim().replace(/\s+/g, " ");
  return (trimmed || UNKNOWN_CLIENT_NAME).toLowerCase();
}

function readName(input: ClientIdentityInput): string {
  return String(input.client ?? input.clientName ?? input.client_name ?? "").trim();
}

function readId(input: ClientIdentityInput): string {
  return String(input.clientCrId ?? input.client_cr_id ?? "").trim();
}

/**
 * Scans every input group before grouping and returns a pure resolver.
 * Pass all sources that will later be grouped (authorizations, billed
 * sessions, scheduled sessions, active client lists, snapshots).
 */
export function buildClientIdentityResolver(
  ...inputGroups: (readonly ClientIdentityInput[] | undefined | null)[]
): ClientIdentityResolver {
  const idsByName = new Map<string, Set<string>>();
  for (const group of inputGroups) {
    for (const row of group ?? []) {
      if (!row) continue;
      const id = readId(row);
      if (!id) continue;
      const name = normalize(readName(row));
      if (!idsByName.has(name)) idsByName.set(name, new Set());
      idsByName.get(name)!.add(id);
    }
  }

  const idsForName = (name: string | null | undefined): string[] =>
    [...(idsByName.get(normalize(name)) ?? [])].sort();

  return {
    normalizeName: normalize,
    idsForName,
    isAmbiguousName: (name) => idsForName(name).length > 1,
    keyFor: (crId, name) => {
      const id = String(crId ?? "").trim();
      if (id) return `cr:${id}`;
      const normalized = normalize(name);
      const ids = idsForName(normalized);
      if (ids.length === 1) return `cr:${ids[0]}`;
      if (ids.length > 1) return `nm:${normalized}#ambiguous`;
      return `nm:${normalized}`;
    },
  };
}
