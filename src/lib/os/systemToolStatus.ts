/**
 * Super Admin Pass 5 — System Tools status vocabulary.
 *
 * Historically the Request Intake panel wrote lowercase snake_case statuses
 * (`open`, `triage`, `in_progress`, `blocked`, `resolved`) while the Issue
 * Tracker page wrote Title Case (`Open`, `Triage`, `In Progress`, ...). Since
 * both surfaces read from the same `system_issues` table, filters, badges and
 * quick-action comparisons could break when the two vocabularies mixed.
 *
 * This module defines a single canonical vocabulary — Title Case — and
 * exposes a `normalizeIssueStatus` helper that accepts either the canonical
 * form or any legacy lowercase / snake_case variant. Callers should:
 *   - Use `ISSUE_STATUSES` for pickers / filters.
 *   - Use `normalizeIssueStatus(row.status)` before display or comparison.
 *   - Write the canonical value on new inserts / updates.
 */

export const ISSUE_STATUSES = [
  "Open",
  "Triage",
  "In Progress",
  "Blocked",
  "Resolved",
] as const;

export type IssueStatus = (typeof ISSUE_STATUSES)[number];

/** Legacy lowercase / snake_case → canonical Title Case. */
const LEGACY_TO_CANONICAL: Record<string, IssueStatus> = {
  open: "Open",
  triage: "Triage",
  in_progress: "In Progress",
  "in progress": "In Progress",
  inprogress: "In Progress",
  blocked: "Blocked",
  resolved: "Resolved",
  closed: "Resolved",
  done: "Resolved",
};

/**
 * Normalize any historic status string to the canonical vocabulary.
 * Unknown values pass through unchanged so we never lose the original label.
 */
export function normalizeIssueStatus(value: string | null | undefined): string {
  if (!value) return "Open";
  const trimmed = String(value).trim();
  if ((ISSUE_STATUSES as readonly string[]).includes(trimmed)) return trimmed;
  const lower = trimmed.toLowerCase().replace(/[-\s]+/g, "_");
  return LEGACY_TO_CANONICAL[lower] ?? LEGACY_TO_CANONICAL[trimmed.toLowerCase()] ?? trimmed;
}

/** Convenience: canonical status label for badge/display. */
export function displayIssueStatus(value: string | null | undefined): string {
  return normalizeIssueStatus(value);
}

/** True when the given (possibly legacy) status equals the canonical target. */
export function isIssueStatus(value: string | null | undefined, target: IssueStatus): boolean {
  return normalizeIssueStatus(value) === target;
}