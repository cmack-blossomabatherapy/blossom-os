import { supabase } from "@/integrations/supabase/client";

export type SopFeedbackVote = "up" | "down" | "not_relevant";

export interface SopFeedbackRow {
  id: string;
  section_id: string;
  query: string;
  query_norm: string;
  vote: SopFeedbackVote;
  updated_at: string;
}

export function normalizeQuery(q: string): string {
  return q.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean).sort().join(" ");
}

export async function fetchAllFeedback(): Promise<SopFeedbackRow[]> {
  const { data, error } = await supabase
    .from("sop_search_feedback")
    .select("id, section_id, query, query_norm, vote, updated_at");
  if (error) throw error;
  return (data ?? []) as SopFeedbackRow[];
}

/** Toggle: clicking the same vote again removes it. */
export async function setFeedback(input: {
  sectionId: string;
  query: string;
  vote: SopFeedbackVote;
  existing?: SopFeedbackRow | null;
}): Promise<SopFeedbackRow | null> {
  const { data: userData } = await supabase.auth.getUser();
  const user_id = userData.user?.id;
  if (!user_id) throw new Error("Not authenticated");

  const query_norm = normalizeQuery(input.query);

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
      },
      { onConflict: "user_id,section_id,query_norm" },
    )
    .select("id, section_id, query, query_norm, vote, updated_at")
    .single();
  if (error) throw error;
  return data as SopFeedbackRow;
}

export interface FeedbackBoost {
  /** score multiplier, e.g. 1.25 for upvoted, 0.6 for downvoted, 0 to hide */
  multiplier: number;
  /** if true, the result should be filtered out entirely */
  hide: boolean;
}

/**
 * Boost a section's score based on prior feedback for the same query (exact)
 * and across all queries (general signal).
 */
export function boostFor(
  feedback: SopFeedbackRow[],
  sectionId: string,
  queryNorm: string,
): FeedbackBoost {
  let multiplier = 1;
  let hide = false;
  for (const f of feedback) {
    if (f.section_id !== sectionId) continue;
    const sameQuery = f.query_norm === queryNorm;
    if (f.vote === "not_relevant" && sameQuery) {
      hide = true;
    } else if (f.vote === "up") {
      multiplier *= sameQuery ? 1.4 : 1.12;
    } else if (f.vote === "down") {
      multiplier *= sameQuery ? 0.55 : 0.85;
    }
  }
  return { multiplier, hide };
}