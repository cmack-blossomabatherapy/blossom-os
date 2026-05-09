import { supabase } from "@/integrations/supabase/client";

export type SlaCategory = "task" | "approval" | "overdue" | "compliance";
export type SlaSeverity = "info" | "warning" | "critical";

export interface SlaRule {
  id: string;
  alert_type: string;
  label: string | null;
  category: SlaCategory;
  payor: string | null;
  state: string | null;
  warning_offset_hours: number;
  critical_offset_hours: number;
  active: boolean;
  notes: string | null;
}

let cache: { at: number; rules: SlaRule[] } | null = null;
let inflight: Promise<SlaRule[]> | null = null;
const TTL_MS = 60_000;

async function load(): Promise<SlaRule[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.rules;
  if (inflight) return inflight;
  inflight = (async () => {
    const { data, error } = await supabase
      .from("alert_sla_rules")
      .select("id, alert_type, label, category, payor, state, warning_offset_hours, critical_offset_hours, active, notes")
      .eq("active", true);
    if (error || !data) return [];
    cache = { at: Date.now(), rules: data as SlaRule[] };
    return cache.rules;
  })();
  try { return await inflight; } finally { inflight = null; }
}

export function invalidateSlaCache() { cache = null; }

/** Pick the most specific active rule. */
export function pickRule(rules: SlaRule[], alertType: string, payor?: string | null, state?: string | null): SlaRule | null {
  const matches = rules.filter(
    (r) => r.alert_type === alertType
      && (r.payor == null || r.payor === payor)
      && (r.state == null || r.state === state),
  );
  if (matches.length === 0) return null;
  matches.sort((a, b) => specificity(b) - specificity(a));
  return matches[0];
}

function specificity(r: SlaRule): number {
  return (r.payor ? 2 : 0) + (r.state ? 1 : 0);
}

export interface ResolvedSeverity {
  severity: SlaSeverity;
  category: SlaCategory;
  ruleId: string | null;
  thresholdHit: "critical" | "warning" | "none";
}

export async function preloadSlaRules(): Promise<void> { await load(); }

/**
 * Compute severity + category for a given alert based on its SLA rule.
 * `dueIso` is the alert's due timestamp (anything Date can parse). Pass null
 * to skip threshold math (severity will be derived from the rule's hours-0 spec).
 */
export async function severityFor(
  alertType: string,
  dueIso: string | Date | null | undefined,
  payor?: string | null,
  state?: string | null,
  fallback: { severity: SlaSeverity; category: SlaCategory } = { severity: "info", category: "task" },
): Promise<ResolvedSeverity> {
  const rules = await load();
  const rule = pickRule(rules, alertType, payor, state);
  if (!rule) {
    return { severity: fallback.severity, category: fallback.category, ruleId: null, thresholdHit: "none" };
  }
  const due = dueIso ? new Date(dueIso).getTime() : Date.now();
  const ageHours = (Date.now() - due) / 3_600_000; // hours since due_at
  const sev: SlaSeverity =
    ageHours >= rule.critical_offset_hours ? "critical"
      : ageHours >= rule.warning_offset_hours ? "warning"
      : "info";
  const hit = sev === "critical" ? "critical" : sev === "warning" ? "warning" : "none";
  return { severity: sev, category: rule.category, ruleId: rule.id, thresholdHit: hit };
}

/** Synchronous variant for hot loops once rules are preloaded. */
export function severityForSync(
  rules: SlaRule[],
  alertType: string,
  dueIso: string | Date | null | undefined,
  payor?: string | null,
  state?: string | null,
  fallback: { severity: SlaSeverity; category: SlaCategory } = { severity: "info", category: "task" },
): ResolvedSeverity {
  const rule = pickRule(rules, alertType, payor, state);
  if (!rule) return { severity: fallback.severity, category: fallback.category, ruleId: null, thresholdHit: "none" };
  const due = dueIso ? new Date(dueIso).getTime() : Date.now();
  const ageHours = (Date.now() - due) / 3_600_000;
  const sev: SlaSeverity =
    ageHours >= rule.critical_offset_hours ? "critical"
      : ageHours >= rule.warning_offset_hours ? "warning"
      : "info";
  const hit = sev === "critical" ? "critical" : sev === "warning" ? "warning" : "none";
  return { severity: sev, category: rule.category, ruleId: rule.id, thresholdHit: hit };
}

/** Expose the cached rule list (loads if needed). Useful for the sync helper. */
export async function getSlaRules(): Promise<SlaRule[]> { return load(); }