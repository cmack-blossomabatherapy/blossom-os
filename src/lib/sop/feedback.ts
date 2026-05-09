import { supabase } from "@/integrations/supabase/client";

export type SopFeedbackVote = "up" | "down" | "not_relevant";

/** Filters used at the time the search was made. Free-form, but stable. */
export type SopSearchFilters = Record<string, unknown>;

export interface SopFeedbackRow {
  id: string;
  section_id: string;
  query: string;
  query_norm: string;
  vote: SopFeedbackVote;
  updated_at: string;
  filters: SopSearchFilters;
  filters_norm: string;
}

export function normalizeQuery(q: string): string {
  return q.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean).sort().join(" ");
}

/**
 * Deterministic stringification of a filter object so the same logical filter
 * set always produces the same key (used for upsert + scoping re-rank boosts).
 * - Drops null/undefined/empty-array/empty-string values
 * - Sorts object keys alphabetically
 * - Sorts array values so order doesn't matter
 */
export function normalizeFilters(filters?: SopSearchFilters | null): string {
  if (!filters) return "";
  const clean = (val: unknown): unknown => {
    if (val === null || val === undefined) return undefined;
    if (Array.isArray(val)) {
      const arr = val.map(clean).filter((v) => v !== undefined);
      if (arr.length === 0) return undefined;
      return [...arr].sort((a, b) => String(a).localeCompare(String(b)));
    }
    if (typeof val === "object") {
      const out: Record<string, unknown> = {};
      const keys = Object.keys(val as Record<string, unknown>).sort();
      for (const k of keys) {
        const v = clean((val as Record<string, unknown>)[k]);
        if (v !== undefined) out[k] = v;
      }
      return Object.keys(out).length ? out : undefined;
    }
    if (typeof val === "string") {
      const trimmed = val.trim();
      return trimmed.length ? trimmed.toLowerCase() : undefined;
    }
    return val;
  };
  const cleaned = clean(filters);
  if (cleaned === undefined) return "";
  return JSON.stringify(cleaned);
}

export async function fetchAllFeedback(): Promise<SopFeedbackRow[]> {
  const { data, error } = await supabase
    .from("sop_search_feedback")
    .select("id, section_id, query, query_norm, vote, updated_at, filters, filters_norm");
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    ...r,
    filters: (r.filters ?? {}) as SopSearchFilters,
    filters_norm: r.filters_norm ?? "",
  })) as SopFeedbackRow[];
}

/** Toggle: clicking the same vote again removes it. */
export async function setFeedback(input: {
  sectionId: string;
  query: string;
  vote: SopFeedbackVote;
  /** Full filter object active when this search was issued. */
  filters?: SopSearchFilters;
  existing?: SopFeedbackRow | null;
}): Promise<SopFeedbackRow | null> {
  const { data: userData } = await supabase.auth.getUser();
  const user_id = userData.user?.id;
  if (!user_id) throw new Error("Not authenticated");

  const query_norm = normalizeQuery(input.query);
  const filters = input.filters ?? {};
  const filters_norm = normalizeFilters(filters);

  if (input.existing && input.existing.vote === input.vote) {
    const { error } = await supabase
      .from("sop_search_feedback")
      .delete()
      .eq("id", input.existing.id);
    if (error) throw error;
    return null;
  }

  const { data, error } = await supabase
    .from("sop_search_feedback")
    .upsert(
      {
        user_id,
        section_id: input.sectionId,
        query: input.query,
        query_norm,
        vote: input.vote,
        filters,
        filters_norm,
      },
      { onConflict: "user_id,section_id,query_norm,filters_norm" },
    )
    .select("id, section_id, query, query_norm, vote, updated_at, filters, filters_norm")
    .single();
  if (error) throw error;
  return {
    ...(data as any),
    filters: ((data as any).filters ?? {}) as SopSearchFilters,
    filters_norm: (data as any).filters_norm ?? "",
  } as SopFeedbackRow;
}

export interface FeedbackBoost {
  /** score multiplier, e.g. 1.25 for upvoted, 0.6 for downvoted, 0 to hide */
  multiplier: number;
  /** if true, the result should be filtered out entirely */
  hide: boolean;
}

/**
 * Boost a section's score based on prior feedback for the same query (exact)
 * and across all queries (general signal). When `filtersNorm` is provided,
 * feedback recorded under the same filter scope is weighted more heavily than
 * feedback recorded under a different filter scope.
 */
export function boostFor(
  feedback: SopFeedbackRow[],
  sectionId: string,
  queryNorm: string,
  filtersNorm: string = "",
): FeedbackBoost {
  let multiplier = 1;
  let hide = false;
  for (const f of feedback) {
    if (f.section_id !== sectionId) continue;
    const sameQuery = f.query_norm === queryNorm;
    const sameFilters = (f.filters_norm ?? "") === filtersNorm;
    // Hide only when the user explicitly marked this section not relevant for
    // the same query AND the same filter scope.
    if (f.vote === "not_relevant" && sameQuery && sameFilters) {
      hide = true;
    } else if (f.vote === "up") {
      // Strongest: same query + same filters. Weakest: different query+filters.
      const m = sameQuery && sameFilters ? 1.4
        : sameQuery ? 1.25
        : sameFilters ? 1.15
        : 1.08;
      multiplier *= m;
    } else if (f.vote === "down") {
      const m = sameQuery && sameFilters ? 0.55
        : sameQuery ? 0.7
        : sameFilters ? 0.8
        : 0.9;
      multiplier *= m;
    }
  }
  return { multiplier, hide };
}