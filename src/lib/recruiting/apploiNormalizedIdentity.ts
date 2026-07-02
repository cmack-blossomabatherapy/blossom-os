/**
 * Durable external-identity resolution for Apploi normalized records.
 *
 * Rows in `integration_normalized_records` are the ingestion path that
 * feeds the Apploi importer. Every downstream import must key on a
 * *durable* identifier so that a routine re-sync updates the existing
 * `recruiting_candidates` row instead of creating a duplicate.
 *
 * Resolution order (first hit wins):
 *   1. `provider_record_id` — the natural, provider-issued id. Enforced
 *      as unique per (integration_id, record_kind) in the DB.
 *   2. Metadata identity fields — Apploi payloads variously nest the id
 *      as `id`, `applicant_id`, `candidate_id`, `apploi_id`, or `uuid`.
 *   3. The normalized-record UUID itself, prefixed with
 *      `normalized_record:` so callers can tell it apart from a real
 *      provider id and open a review task.
 *
 * Callers should treat `source === "none"` as "skip this row and log a
 * review event" — never invent an id from email, because two Apploi
 * applicants can share (or lack) an email address.
 */

export type ApploiIdentitySource = "provider" | "metadata" | "normalized_record" | "none";

export interface ResolvedApploiIdentity {
  externalId: string | null;
  source: ApploiIdentitySource;
  /** Which metadata key produced the id, when source === "metadata". */
  metadataKey?: string;
}

const METADATA_ID_KEYS = ["id", "applicant_id", "candidate_id", "apploi_id", "uuid"] as const;

function asNonEmptyString(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") return v.trim() || null;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}

export interface NormalizedRecordShape {
  id?: string | null;
  provider_record_id?: string | null;
  metadata?: Record<string, unknown> | null;
}

export function resolveApploiIdentity(record: NormalizedRecordShape): ResolvedApploiIdentity {
  const provider = asNonEmptyString(record.provider_record_id);
  if (provider) return { externalId: provider, source: "provider" };

  const meta = (record.metadata ?? {}) as Record<string, unknown>;
  for (const key of METADATA_ID_KEYS) {
    const candidate = asNonEmptyString(meta[key]);
    if (candidate) return { externalId: candidate, source: "metadata", metadataKey: key };
  }

  const recordId = asNonEmptyString(record.id);
  if (recordId) {
    return { externalId: `normalized_record:${recordId}`, source: "normalized_record" };
  }

  return { externalId: null, source: "none" };
}

/** Human-readable label for activity events / toasts. */
export function describeIdentitySource(source: ApploiIdentitySource): string {
  switch (source) {
    case "provider": return "provider record id";
    case "metadata": return "metadata identity field";
    case "normalized_record": return "normalized record fallback";
    case "none": return "no durable id";
  }
}