/**
 * Shared HR readiness helpers used by both New Hires and Compliance
 * mark-ready flows. Keeps blocker rules consistent across the HR surface.
 *
 * `ready`, `synced`, and `not_applicable` count as OK. Everything else
 * (not_started, pending, in_progress, error, or missing) is a blocker.
 * CentralReach is only required for clinical roles.
 */

export type IntegrationStatus =
  | "ready" | "synced" | "not_applicable"
  | "not_started" | "pending" | "in_progress" | "error"
  | string | null | undefined;

const OK = new Set(["ready", "synced", "not_applicable"]);

export function isIntegrationReady(status: IntegrationStatus): boolean {
  return !!status && OK.has(String(status));
}

const CLINICAL_ROLE_RX = /bcba|rbt|bt\b|behavior technician|clinician|therapist|clinical/i;
export function isClinicalRole(role?: string | null): boolean {
  return !!role && CLINICAL_ROLE_RX.test(role);
}

export interface ReadinessOnboardingRow {
  blockers?: string[] | null;
  viventium_status?: IntegrationStatus;
  stellar_status?: IntegrationStatus;
  centralreach_status?: IntegrationStatus;
}

export interface ReadinessDoc {
  required: boolean;
  status: string;
  expires_on?: string | null;
}

export interface ReadinessTraining {
  status: string;
  due_date?: string | null;
}

export interface ReadinessInput {
  onboarding?: ReadinessOnboardingRow | null;
  documents?: ReadinessDoc[];
  trainings?: ReadinessTraining[];
  orientationRequired?: boolean;
  orientationCompleted?: boolean;
  employeeRole?: string | null;
}

function docExpired(d: ReadinessDoc): boolean {
  if (d.status === "expired") return true;
  if (!d.expires_on) return false;
  const t = new Date(d.expires_on + (d.expires_on.length === 10 ? "T00:00:00" : "")).getTime();
  return Number.isFinite(t) && t < Date.now();
}

export function getHrReadinessBlockers(input: ReadinessInput): string[] {
  const blockers: string[] = [];
  const onb = input.onboarding ?? null;
  const clinical = isClinicalRole(input.employeeRole);

  if (onb?.blockers?.length) blockers.push(...onb.blockers);

  // Viventium is always required unless explicitly not_applicable.
  if (!isIntegrationReady(onb?.viventium_status)) {
    blockers.push("Viventium not ready");
  }
  // Stellar Checks is always required unless explicitly not_applicable.
  if (!isIntegrationReady(onb?.stellar_status)) {
    blockers.push("Stellar Checks not ready");
  }
  // CentralReach is only a blocker for clinical roles.
  if (clinical && !isIntegrationReady(onb?.centralreach_status)) {
    blockers.push("CentralReach not ready");
  }

  const docs = input.documents ?? [];
  const missingReq = docs.filter((d) => d.required && (d.status === "missing" || d.status === "requested" || d.status === "pending"));
  if (missingReq.length) blockers.push(`${missingReq.length} required document(s) missing`);
  const expiredReq = docs.filter((d) => d.required && docExpired(d));
  if (expiredReq.length) blockers.push(`${expiredReq.length} required document(s) expired`);
  const unverifiedReq = docs.filter((d) => d.required && d.status !== "verified" && d.status !== "missing" && d.status !== "requested" && d.status !== "pending" && !docExpired(d));
  if (unverifiedReq.length) blockers.push(`${unverifiedReq.length} required document(s) not verified`);

  const trs = input.trainings ?? [];
  const trIncomplete = trs.filter((t) => t.status !== "completed");
  if (trIncomplete.length) blockers.push(`${trIncomplete.length} training(s) incomplete`);

  if (input.orientationRequired && !input.orientationCompleted) {
    blockers.push("Orientation not completed");
  }

  return blockers;
}

export function canMarkReadyForStart(input: ReadinessInput): boolean {
  return getHrReadinessBlockers(input).length === 0;
}
