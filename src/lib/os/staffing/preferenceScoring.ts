import type {
  FamilyStaffingPreferenceRow,
  StaffingMatchRow,
} from "./types";

/**
 * Adjust a base match score using a client's family preferences.
 *
 *  - must-have match  → +12
 *  - must-have miss   → -25 (and `blocked = true`)
 *  - nice-to-have match → +4
 *  - avoid conflict (preference_detail starts with "AVOID:") → -40 (block)
 */
export interface PreferenceScoringContext {
  rbtName: string;
  rbtState?: string | null;
  rbtTags?: string[];
}

export interface PreferenceScoringResult {
  score: number;
  blocked: boolean;
  applied: Array<{
    preference: FamilyStaffingPreferenceRow;
    impact: number;
    matched: boolean;
  }>;
}

function detailMatches(detail: string, ctx: PreferenceScoringContext): boolean {
  const d = detail.toLowerCase();
  if (ctx.rbtName && d.includes(ctx.rbtName.toLowerCase())) return true;
  if (ctx.rbtState && d.includes(ctx.rbtState.toLowerCase())) return true;
  if (ctx.rbtTags?.some((t) => d.includes(t.toLowerCase()))) return true;
  return false;
}

export function applyPreferenceScoring(
  baseScore: number,
  preferences: FamilyStaffingPreferenceRow[],
  ctx: PreferenceScoringContext,
): PreferenceScoringResult {
  let score = baseScore;
  let blocked = false;
  const applied: PreferenceScoringResult["applied"] = [];

  for (const p of preferences) {
    if (p.status !== "active") continue;
    const isAvoid =
      p.importance === "avoid" ||
      p.preference_detail.trim().toUpperCase().startsWith("AVOID:");
    const matched = detailMatches(p.preference_detail, ctx);
    let impact = 0;
    if (isAvoid && matched) {
      impact = -40;
      blocked = true;
    } else if (p.importance === "must_have") {
      impact = matched ? 12 : -25;
      if (!matched) blocked = true;
    } else {
      impact = matched ? 4 : 0;
    }
    score += impact;
    applied.push({ preference: p, impact, matched });
  }

  return { score: Math.max(0, score), blocked, applied };
}

/** Score-affecting summary for a match, given the active client preferences. */
export function scoreMatchWithPreferences(
  match: StaffingMatchRow,
  preferences: FamilyStaffingPreferenceRow[],
): PreferenceScoringResult {
  const relevant = preferences.filter(
    (p) => p.client_id === match.client_id || p.client_name.toLowerCase() === match.rbt_name.toLowerCase(),
  );
  return applyPreferenceScoring(match.match_score, relevant, { rbtName: match.rbt_name });
}