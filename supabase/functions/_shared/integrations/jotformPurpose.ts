/**
 * Jotform purpose contract — the single source of truth for how a
 * configured Jotform form (`JOTFORM_FORM_PURPOSES_JSON`) maps to a
 * Blossom OS normalized record kind.
 *
 * This module is **pure TypeScript** (no Deno APIs). Both the Deno
 * edge adapter (`providers/jotform.ts`) and the Node/vitest test suite
 * import from here so docs, runtime, and tests agree on the exact
 * accepted values: `intake` / `recruiting` / `hr` / `clinical_document`.
 *
 * Legacy purpose strings (`lead`, `candidate`, `document`,
 * `form_submission`) still parse for backwards compatibility with any
 * existing `JOTFORM_FORM_PURPOSES_JSON` configuration but are folded
 * into the canonical four.
 */

import type { NormalizedKind } from "./types.ts";

export type JotformPurpose =
  | "intake"
  | "recruiting"
  | "hr"
  | "clinical_document";

export const JOTFORM_PURPOSES: readonly JotformPurpose[] = [
  "intake",
  "recruiting",
  "hr",
  "clinical_document",
] as const;

/** Map a purpose value from `JOTFORM_FORM_PURPOSES_JSON` — including
 * legacy aliases — to the canonical Blossom purpose. Unknown strings
 * return `null` so the caller can flag configuration drift instead of
 * silently defaulting. */
export function normalizeJotformPurpose(raw: unknown): JotformPurpose | null {
  if (typeof raw !== "string") return null;
  const v = raw.trim().toLowerCase();
  switch (v) {
    case "intake":
    case "lead":
    case "inquiry":
    case "form_submission":
      return "intake";
    case "recruiting":
    case "candidate":
    case "applicant":
      return "recruiting";
    case "hr":
    case "employee":
    case "hr_document":
      return "hr";
    case "clinical_document":
    case "document":
    case "clinical":
    case "assessment":
      return "clinical_document";
    default:
      return null;
  }
}

/** Purpose → normalized record kind consumed by the shared spine
 * (`integration_normalized_records.record_kind`). Intake submissions
 * intentionally map to `"lead"` so the existing promotion path in
 * `integration-webhook/index.ts` (`promote_normalized_record`) mints a
 * Lead Captured record without any Jotform-specific branch. */
export function purposeToRecordKind(purpose: JotformPurpose | null): NormalizedKind {
  switch (purpose) {
    case "intake":
      return "lead";
    case "recruiting":
      return "candidate";
    case "clinical_document":
      return "document";
    case "hr":
      // HR employee-form submissions do not promote to leads/clients;
      // they stay as `document` for staging + review.
      return "document";
    default:
      return "unknown";
  }
}