/**
 * BCBA Action Queue — priority engine.
 *
 * Design principles (from the spec):
 *   1. No mysterious single score. Every action carries an explicit list of
 *      REASONS (typed codes + human text) explaining why it's here and where
 *      it landed in the ranking.
 *   2. Completed items drop out. Duplicates (same client × same reason) merge.
 *   3. Stale data cannot generate misleading urgency: any item derived from a
 *      data source flagged `stale` is capped at ESCALATION_LEVELS.info.
 *   4. Mobile-friendly: consumers can slice the top N and still get honest
 *      explanations.
 *
 * The engine is a pure function. Inputs are already-normalized rows; outputs
 * are ranked `ActionItem`s with a stable reason chain.
 */

/* -------------------------------------------------------------------------- */
/*  Reason vocabulary                                                          */
/* -------------------------------------------------------------------------- */

export type ReasonCode =
  | "due_today"
  | "overdue"
  | "due_soon"
  | "authorization_risk"
  | "safety"
  | "client_continuity"
  | "rbt_support"
  | "qa_return"
  | "missing_parent_signature"
  | "missing_supervision"
  | "new_assignment"
  | "repeated_cancellations"
  | "overdue_documentation"
  | "priority_flag";

/**
 * Base weights per reason. Higher = more urgent. These are visible to the
 * user — priority becomes explainable, not magical.
 */
export const REASON_WEIGHTS: Record<ReasonCode, number> = {
  safety:                     100,
  overdue:                     55,
  authorization_risk:          50,
  qa_return:                   45,
  missing_supervision:         40,
  overdue_documentation:       38,
  missing_parent_signature:    32,
  due_today:                   30,
  rbt_support:                 28,
  repeated_cancellations:      25,
  client_continuity:           22,
  new_assignment:              18,
  priority_flag:               12,
  due_soon:                    10,
};

export const REASON_LABELS: Record<ReasonCode, string> = {
  safety:                   "Safety concern",
  overdue:                  "Overdue",
  authorization_risk:       "Authorization at risk",
  qa_return:                "QA correction returned",
  missing_supervision:      "RBT supervision overdue",
  overdue_documentation:    "Documentation overdue",
  missing_parent_signature: "Parent signature missing",
  due_today:                "Due today",
  rbt_support:              "RBT requested support",
  repeated_cancellations:   "Cancellations trending",
  client_continuity:        "Client continuity risk",
  new_assignment:           "New assignment",
  priority_flag:            "Flagged priority",
  due_soon:                 "Due soon",
};

export type EscalationLevel = "info" | "attention" | "urgent" | "critical";

export const ESCALATION_THRESHOLDS: Record<EscalationLevel, number> = {
  info: 0, attention: 20, urgent: 45, critical: 80,
};

/* -------------------------------------------------------------------------- */
/*  Public types                                                              */
/* -------------------------------------------------------------------------- */

export type Owner = "bcba" | "rbt" | "credentialing" | "scheduling" | "clinical_leadership" | "systems" | "hr";

export interface RawSignal {
  /** Stable id for the underlying record. */
  sourceId: string;
  /** Logical bucket the item belongs to. */
  kind:
    | "action_task" | "treatment_plan" | "parent_training"
    | "supervision" | "authorization" | "qa" | "rbt_support"
    | "onboarding" | "schedule" | "assessment";
  title: string;
  subtitle?: string;
  clientId?: string;
  clientName?: string;
  rbtName?: string;
  dueDate?: string | null;     // ISO date
  reasons: ReasonCode[];       // one or more (empty = no urgency)
  owner?: Owner;
  deepLink?: string;
  /** Set true when the underlying data source is stale (e.g. CR sync). */
  stale?: boolean;
  /** Free-form context to help the user act. */
  context?: string;
}

export interface ActionItem extends RawSignal {
  score: number;
  escalation: EscalationLevel;
  explanations: string[];      // human-readable "why" chain
}

/* -------------------------------------------------------------------------- */
/*  Scoring helpers                                                           */
/* -------------------------------------------------------------------------- */

function daysUntil(iso?: string | null): number | null {
  if (!iso) return null;
  const now  = Date.now();
  const then = new Date(iso).getTime();
  return Math.floor((then - now) / (1000 * 60 * 60 * 24));
}

function reasonsForDueDate(iso?: string | null): ReasonCode[] {
  const d = daysUntil(iso);
  if (d === null) return [];
  if (d < 0)      return ["overdue"];
  if (d === 0)    return ["due_today"];
  if (d <= 3)     return ["due_soon"];
  return [];
}

function escalationFor(score: number): EscalationLevel {
  if (score >= ESCALATION_THRESHOLDS.critical)  return "critical";
  if (score >= ESCALATION_THRESHOLDS.urgent)    return "urgent";
  if (score >= ESCALATION_THRESHOLDS.attention) return "attention";
  return "info";
}

/* -------------------------------------------------------------------------- */
/*  Public: enrich + rank                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Enrich a signal: fold due-date reasons in, sum weights, cap stale items,
 * generate human explanations.
 */
export function scoreSignal(raw: RawSignal): ActionItem {
  const merged = Array.from(
    new Set<ReasonCode>([...raw.reasons, ...reasonsForDueDate(raw.dueDate)]),
  );

  const baseScore = merged.reduce((acc, r) => acc + (REASON_WEIGHTS[r] ?? 0), 0);

  // Stale data cannot manufacture urgency.
  const finalScore = raw.stale ? Math.min(baseScore, ESCALATION_THRESHOLDS.attention - 1) : baseScore;

  const explanations: string[] = merged.map((r) => {
    if (r === "overdue" && raw.dueDate) {
      const d = Math.abs(daysUntil(raw.dueDate) ?? 0);
      return `Overdue by ${d} day${d === 1 ? "" : "s"}`;
    }
    if (r === "due_soon" && raw.dueDate) {
      const d = daysUntil(raw.dueDate) ?? 0;
      return `Due in ${d} day${d === 1 ? "" : "s"}`;
    }
    return REASON_LABELS[r];
  });

  if (raw.stale) explanations.push("Source data is stale — urgency capped");

  return {
    ...raw,
    reasons: merged,
    score: finalScore,
    escalation: escalationFor(finalScore),
    explanations,
  };
}

/**
 * Consolidate duplicates: same clientId + same top reason → one item, reasons
 * merged, highest score wins.
 */
function dedupe(items: ActionItem[]): ActionItem[] {
  const map = new Map<string, ActionItem>();
  for (const it of items) {
    const key = `${it.clientId ?? it.sourceId}::${it.reasons[0] ?? "none"}::${it.kind}`;
    const existing = map.get(key);
    if (!existing) { map.set(key, it); continue; }
    const merged: ActionItem = {
      ...existing,
      reasons: Array.from(new Set([...existing.reasons, ...it.reasons])),
      score: Math.max(existing.score, it.score),
      escalation: escalationFor(Math.max(existing.score, it.score)),
      explanations: Array.from(new Set([...existing.explanations, ...it.explanations])),
    };
    map.set(key, merged);
  }
  return Array.from(map.values());
}

/**
 * Build the ranked action queue from a stream of raw signals.
 */
export function buildActionQueue(signals: RawSignal[]): ActionItem[] {
  const enriched = signals
    .map(scoreSignal)
    // Zero-weight items = nothing to do. Drop them silently.
    .filter((i) => i.reasons.length > 0 && i.score > 0);

  return dedupe(enriched).sort((a, b) => b.score - a.score);
}