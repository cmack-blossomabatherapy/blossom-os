import { supabase } from "@/integrations/supabase/client";
import type { RecruitingCandidate } from "@/hooks/useRecruitingCandidates";

/**
 * Canonical candidate-identity helpers for the Recruiting domain.
 *
 * Recruiting pages render rows that arrive from two distinct identity
 * spaces:
 *
 *  1. `recruiting_candidates.id` — a UUID we own.
 *  2. Apploi external IDs — strings imported through
 *     `useApploiIntegration.importApploiNormalizedRecords`, which stamps
 *     them onto the candidate row as a `apploi:<external_id>` tag entry.
 *
 * Page-level workflow code MUST funnel every "who is this row?" decision
 * through this module so that:
 *
 *  - We never write a non-UUID into `recruiting_candidates.id` based
 *    filters (`mutations.moveStage(uuid, ...)` would silently no-op).
 *  - Apploi-imported rows can be resolved back to their canonical
 *    candidate UUID before any mutation runs.
 *  - Identity logic stays in one place rather than being re-derived in
 *    every operational page.
 */

export const APPLOI_TAG_PREFIX = "apploi:";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isCandidateUuid(value: string | null | undefined): boolean {
  return !!value && UUID_RE.test(value);
}

export function apploiTagFor(externalId: string): string {
  return `${APPLOI_TAG_PREFIX}${externalId}`;
}

export function extractApploiExternalId(
  candidate: Pick<RecruitingCandidate, "tags"> | null | undefined,
): string | null {
  const tags = candidate?.tags ?? [];
  for (const t of tags) {
    if (typeof t === "string" && t.startsWith(APPLOI_TAG_PREFIX)) {
      return t.slice(APPLOI_TAG_PREFIX.length) || null;
    }
  }
  return null;
}

export function candidateKey(
  candidate: Pick<RecruitingCandidate, "id" | "tags"> | null | undefined,
): string | null {
  if (!candidate) return null;
  if (isCandidateUuid(candidate.id)) return candidate.id;
  const apploi = extractApploiExternalId(candidate);
  return apploi ? apploiTagFor(apploi) : null;
}

/**
 * Resolve a UI row identifier into the canonical `recruiting_candidates.id`
 * UUID. Accepts either a UUID (returned as-is after a presence check) or an
 * `apploi:<id>` tag string (looked up via the `tags` column).
 *
 * Returns `null` when no matching candidate exists — callers should treat
 * that as "do not mutate" rather than silently filtering on a missing id.
 */
export async function resolveCandidateUuid(
  identifier: string | null | undefined,
): Promise<string | null> {
  if (!identifier) return null;

  if (isCandidateUuid(identifier)) {
    const { data } = await supabase
      .from("recruiting_candidates")
      .select("id")
      .eq("id", identifier)
      .maybeSingle();
    return (data as { id?: string } | null)?.id ?? null;
  }

  if (identifier.startsWith(APPLOI_TAG_PREFIX)) {
    const { data } = await supabase
      .from("recruiting_candidates")
      .select("id,tags")
      .contains("tags", [identifier])
      .limit(1)
      .maybeSingle();
    return (data as { id?: string } | null)?.id ?? null;
  }

  return null;
}
