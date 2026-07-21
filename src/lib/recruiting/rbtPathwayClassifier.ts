/**
 * Recruiting-owned RBT pathway classifier.
 *
 * Mirrors the SQL `public.resolve_rbt_pathway_key()` mapping so client code
 * (and unit tests) can reason about assignment without hitting the database.
 *
 * The RBT/BT pathway is derived from two structured recruiter fields:
 *   - `rbt_certification_status`: 'not_certified' | 'certified' | 'unknown'
 *   - `rbt_years_experience_direct`: number of years of direct RBT experience
 *
 * Mapping:
 *   not_certified               -> 'new_rbt_certification'
 *   certified + years < 2       -> 'under_2_years'
 *   certified + years >= 2      -> 'experienced_rbt'
 *   unknown / certified w/o yrs -> null (blocks advancement)
 */

export type RbtCertificationStatus = "not_certified" | "certified" | "unknown";
export type RbtPathwayKey =
  | "new_rbt_certification"
  | "under_2_years"
  | "experienced_rbt";

export interface RbtPathwayInput {
  role?: string | null;
  rbt_certification_status?: RbtCertificationStatus | null;
  rbt_years_experience_direct?: number | null;
}

export function isRbtLikeRole(role: string | null | undefined): boolean {
  return role === "RBT" || role === "BT";
}

export function classifyRbtPathway(input: RbtPathwayInput): RbtPathwayKey | null {
  if (!isRbtLikeRole(input.role ?? null)) return null;
  const status = input.rbt_certification_status ?? "unknown";
  const years = input.rbt_years_experience_direct;
  if (status === "not_certified") return "new_rbt_certification";
  if (status === "certified") {
    if (years == null || Number.isNaN(years) || years < 0) return null;
    return years < 2 ? "under_2_years" : "experienced_rbt";
  }
  return null;
}

/**
 * Stages that require complete recruiter classification data before an
 * RBT/BT candidate is allowed to advance. Matches the operational rule:
 * "before advancing to orientation/onboarding/ready-to-staff".
 */
export const GATED_ADVANCEMENT_STAGES = [
  "Orientation Scheduled",
  "Onboarding",
  "Ready to Staff",
] as const;
export type GatedAdvancementStage = (typeof GATED_ADVANCEMENT_STAGES)[number];

export function isGatedAdvancementStage(stage: string): stage is GatedAdvancementStage {
  return (GATED_ADVANCEMENT_STAGES as readonly string[]).includes(stage);
}

export interface AdvancementCheck {
  ok: boolean;
  reason?:
    | "cert_status_missing"
    | "years_missing_when_certified"
    | "years_invalid";
  message?: string;
}

export function checkAdvancementReadiness(
  input: RbtPathwayInput,
  targetStage: string,
): AdvancementCheck {
  if (!isRbtLikeRole(input.role ?? null)) return { ok: true };
  if (!isGatedAdvancementStage(targetStage)) return { ok: true };
  const status = input.rbt_certification_status ?? "unknown";
  if (status === "unknown") {
    return {
      ok: false,
      reason: "cert_status_missing",
      message: "Set RBT certification status before advancing this candidate.",
    };
  }
  if (status === "certified") {
    const y = input.rbt_years_experience_direct;
    if (y == null || Number.isNaN(y)) {
      return {
        ok: false,
        reason: "years_missing_when_certified",
        message: "Enter years of direct RBT experience before advancing.",
      };
    }
    if (y < 0) {
      return {
        ok: false,
        reason: "years_invalid",
        message: "Years of RBT experience must be zero or greater.",
      };
    }
  }
  return { ok: true };
}