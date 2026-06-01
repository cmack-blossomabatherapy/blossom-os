import type { CanonicalField } from "@/lib/os/reportEngine/types";
import type { DashboardType } from "./types";

/**
 * Pick the best dashboard type from a user prompt + the canonical fields
 * that were detected across the uploaded files. Pure heuristic — fast and
 * deterministic. The AI edge function may override later.
 */
export function classifyDashboardType(
  prompt: string,
  detectedFields: Set<CanonicalField>,
): DashboardType {
  const p = prompt.toLowerCase();

  // Strongest prompt cues first
  if (/supervis|97155|97153/.test(p)) return "supervision";
  if (/parent.?train|97156/.test(p)) return "parent_training";
  if (/auth(oriz)?|utiliz|expir/.test(p)) return "authorization";
  if (/cancel|no.?show/.test(p)) return "cancellation";
  if (/sched|stafff?ing|coverage/.test(p)) return "scheduling";
  if (/bill|revenue|payor|payer|claim/.test(p)) return "billing";
  if (/leadership|exec|state|company.?wide/.test(p)) return "leadership";
  if (/state|region|location/.test(p) && detectedFields.has("state")) return "state";
  if (/bcba|provider|therapist|rbt|staff perf/.test(p)) return "bcba";
  if (/operation|monthly|month.?ops|overview/.test(p)) return "operations";

  // Otherwise, infer from what's in the data
  if (detectedFields.has("authorized_hours") && detectedFields.has("worked_hours")) return "authorization";
  if (detectedFields.has("session_status")) return "cancellation";
  if (detectedFields.has("procedure_code") && detectedFields.has("worked_hours")) return "operations";
  return "custom";
}

/** Suggested prompts for the empty-state of the prompt box. */
export const PROMPT_SUGGESTIONS = [
  "Build a leadership dashboard",
  "Show supervision percentages",
  "Which clients are missing parent training?",
  "Show authorization utilization risks",
  "Show cancellation trends",
  "Which BCBAs are not supervising enough?",
  "Build a monthly operations dashboard",
];