/**
 * Shared client-detail route builder.
 *
 * Every Clinical / Reports / BCBA / RBT surface that surfaces a "Open client
 * record" affordance for a CentralReach-derived identifier must go through
 * this helper. It preserves the two Phase 1b routing modes:
 *
 *   - real internal UUIDs  → `/clients/<uuid>`  (rendered by ClientDetailRouter)
 *   - CentralReach ids     → `/clients/cr/<crId>` (resolved by CrClientRedirect)
 *
 * Anything else — empty strings, `null`, or the synthetic `canon:...` id we
 * use for rows that have no CR mapping — returns `null` so the caller can
 * suppress the link. That keeps unresolvable rows from becoming dead click
 * targets that route into a not-found page.
 *
 * Consolidating this logic here also removes the divergent inline regexes
 * that Phase 1b left in `CaseDetailDrawer.tsx` (strict UUID shape) and
 * `MyClients.tsx` (loose `[0-9a-f-]{36}`, which happily matched pathological
 * strings like 36 dashes).
 */
import { isUuid } from "./canonicalClientResolver";

/** Prefixes we've used for synthetic, unresolvable client identifiers. */
const SYNTHETIC_PREFIXES = ["canon:", "name:"] as const;

/** Route to the canonical client detail if a real identifier is available. */
export function buildClientDetailHref(
  idOrCrId: string | null | undefined,
): string | null {
  const raw = (idOrCrId ?? "").trim();
  if (!raw) return null;
  if (SYNTHETIC_PREFIXES.some((p) => raw.toLowerCase().startsWith(p))) {
    return null;
  }
  if (isUuid(raw)) return `/clients/${raw}`;
  return `/clients/cr/${encodeURIComponent(raw)}`;
}

/**
 * Convenience: pick the first defined identifier from a set of candidates
 * (e.g. `uuid ?? cr_id ?? name`) and build a href from it. Returns `null`
 * when nothing resolvable is found.
 */
export function buildClientDetailHrefFromCandidates(
  ...candidates: Array<string | null | undefined>
): string | null {
  for (const c of candidates) {
    const href = buildClientDetailHref(c);
    if (href) return href;
  }
  return null;
}