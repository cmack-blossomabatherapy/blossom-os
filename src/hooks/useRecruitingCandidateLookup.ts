import { useCallback, useEffect, useMemo, useState } from "react";
import { useRecruitingCandidates, type RecruitingCandidate } from "@/hooks/useRecruitingCandidates";
import {
  APPLOI_TAG_PREFIX,
  candidateKey,
  extractApploiExternalId,
  isCandidateUuid,
  resolveCandidateUuid,
} from "@/lib/recruiting/candidateIdentity";

/**
 * Page-facing candidate lookup that funnels every "what is this row?"
 * decision through `candidateIdentity` helpers.
 *
 * Pages that render Apploi-imported rows alongside owned candidates must
 * use `resolveUuid()` before invoking any `useRecruitingMutations` helper
 * — otherwise an `apploi:<id>` string will be passed straight to a
 * `.eq("id", ...)` filter and the mutation will silently no-op.
 */
export function useRecruitingCandidateLookup() {
  const { candidates, loading } = useRecruitingCandidates();

  const byUuid = useMemo(() => {
    const m = new Map<string, RecruitingCandidate>();
    for (const c of candidates) {
      if (isCandidateUuid(c.id)) m.set(c.id, c);
    }
    return m;
  }, [candidates]);

  const byApploiId = useMemo(() => {
    const m = new Map<string, RecruitingCandidate>();
    for (const c of candidates) {
      const external = extractApploiExternalId(c);
      if (external) m.set(external, c);
    }
    return m;
  }, [candidates]);

  const find = useCallback((identifier: string | null | undefined): RecruitingCandidate | null => {
    if (!identifier) return null;
    if (isCandidateUuid(identifier)) return byUuid.get(identifier) ?? null;
    if (identifier.startsWith(APPLOI_TAG_PREFIX)) {
      return byApploiId.get(identifier.slice(APPLOI_TAG_PREFIX.length)) ?? null;
    }
    return byApploiId.get(identifier) ?? null;
  }, [byUuid, byApploiId]);

  const resolveUuid = useCallback(async (identifier: string | null | undefined): Promise<string | null> => {
    if (!identifier) return null;
    const local = find(identifier);
    if (local && isCandidateUuid(local.id)) return local.id;
    return resolveCandidateUuid(identifier);
  }, [find]);

  const keyOf = useCallback((c: RecruitingCandidate | null | undefined) => candidateKey(c), []);

  return { candidates, loading, find, resolveUuid, keyOf, byUuid, byApploiId };
}

export function useResolvedCandidateUuid(identifier: string | null | undefined) {
  const { resolveUuid } = useRecruitingCandidateLookup();
  const [uuid, setUuid] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!identifier) { setUuid(null); return; }
    setResolving(true);
    resolveUuid(identifier).then((id) => {
      if (!cancelled) { setUuid(id); setResolving(false); }
    });
    return () => { cancelled = true; };
  }, [identifier, resolveUuid]);

  return { uuid, resolving };
}
