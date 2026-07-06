/**
 * Durable linked-reference helper for State Operations rows.
 *
 * The `state_operational_*` tables have UUID columns (`lead_id`,
 * `client_id`, `candidate_id`, `authorization_id`, `scheduling_item_id`)
 * plus companion TEXT columns (`lead_ref`, `client_ref`, `candidate_ref`,
 * `authorization_ref`, `scheduling_item_ref`) added in pass 4.
 *
 * Blossom OS often passes local/mock/imported IDs that are NOT valid
 * UUIDs (e.g. "lead-42", monday.com item IDs, CentralReach numeric IDs).
 * Writing those into UUID columns causes a Postgres 22P02 error and the
 * whole insert silently disappears.
 *
 * `normalizeLinkedRef` splits an incoming ID into the value the UUID
 * column can safely receive and the raw string preserved in the ref
 * column so nothing is ever lost.
 */

const UUID_RX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RX.test(value.trim());
}

export interface NormalizedLinkedRef {
  /** Value safe to write into a UUID column. `null` when the input is not a valid UUID. */
  uuid: string | null;
  /** Original raw ID preserved for the companion `*_ref` text column. */
  ref: string | null;
}

export function normalizeLinkedRef(value: unknown): NormalizedLinkedRef {
  if (value == null) return { uuid: null, ref: null };
  const s = String(value).trim();
  if (!s) return { uuid: null, ref: null };
  if (isUuid(s)) return { uuid: s, ref: s };
  return { uuid: null, ref: s };
}

/** Convenience: prefer a ref column value, then fall back to the UUID column. */
export function pickLinkedRef(
  refValue: string | null | undefined,
  uuidValue: string | null | undefined,
): string | undefined {
  if (refValue) return refValue;
  if (uuidValue) return uuidValue;
  return undefined;
}