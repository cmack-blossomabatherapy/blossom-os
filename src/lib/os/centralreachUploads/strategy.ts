/**
 * CentralReach import strategies.
 *
 * CentralReach exports fall into two very different shapes:
 *
 * - `append_fact` — immutable historical facts. A billing session that already
 *   exists must never be rewritten; re-seeing it is a duplicate. This preserves
 *   the exact `cr_billing_sessions` behaviour BCBA Productivity V3 depends on.
 * - `upsert_snapshot` — mutable CURRENT state. Scheduling, authorizations,
 *   utilization and claims change after they are first exported (hours worked,
 *   remaining hours, cancellations, claim responses). Re-seeing the same source
 *   row means the newer values must REPLACE the stored ones, otherwise current
 *   facts go stale.
 */

import type { CRUploadKind } from "./detect";

export type CrImportStrategy = "append_fact" | "upsert_snapshot";

export const CR_IMPORT_STRATEGY: Record<Exclude<CRUploadKind, "unknown">, CrImportStrategy> = {
  billing: "append_fact",
  // Contacts have no safe snapshot key in the current schema, so they stay append-only.
  contacts: "append_fact",
  scheduling: "upsert_snapshot",
  authorization: "upsert_snapshot",
  utilization: "upsert_snapshot",
  claims: "upsert_snapshot",
  // Payments, ERA remittances and timesheet documentation all change after
  // first export (application, reconcile status, locks, signatures, tasks), so
  // re-seeing a source Id must REPLACE the stored current values.
  payments: "upsert_snapshot",
  era_payments: "upsert_snapshot",
  timesheet: "upsert_snapshot",
};

export function crImportStrategyFor(kind: CRUploadKind): CrImportStrategy {
  if (kind === "unknown") return "append_fact";
  return CR_IMPORT_STRATEGY[kind] ?? "append_fact";
}

/** Mutable CURRENT tables that carry `last_seen_*` / `source_row_id` tracking. */
export const CR_CURRENT_TABLES = [
  "cr_schedule_events",
  "cr_authorizations",
  "cr_authorization_utilization",
  "cr_claims",
  "cr_billing_session_status",
  "cr_payments",
  "cr_era_payments",
  "cr_timesheet_status",
] as const;

/** Side table written alongside the immutable fact for a given kind. */
export const CR_SIDE_TABLE_FOR_KIND: Partial<Record<Exclude<CRUploadKind, "unknown">, string>> = {
  billing: "cr_billing_session_status",
};
