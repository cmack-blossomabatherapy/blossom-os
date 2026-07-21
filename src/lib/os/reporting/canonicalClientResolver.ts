/**
 * Canonical CentralReach client resolver (Phase 1a P0-1).
 *
 * `public.clients` is the authoritative CRM client table. `centralreach_id`
 * is the deterministic bridge to the CentralReach export data surfaced in
 * `v_cr_canonical_sessions`.
 *
 * This module gives every Clinical / BCBA / RBT surface one function to
 * translate a route param — which may be either the internal client UUID or a
 * CentralReach id — into the internal client UUID that the rest of the app
 * expects. It intentionally never fabricates records; it only reads.
 */
import { supabase } from "@/integrations/supabase/client";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string | null | undefined): value is string {
  return typeof value === "string" && UUID_RE.test(value.trim());
}

/** Look up a client UUID by its CentralReach id. Returns null when missing. */
export async function resolveClientByCentralReachId(
  crId: string | null | undefined,
): Promise<string | null> {
  const trimmed = (crId ?? "").trim();
  if (!trimmed) return null;
  const { data, error } = await supabase
    .from("clients")
    .select("id")
    .eq("centralreach_id", trimmed)
    .maybeSingle();
  if (error || !data) return null;
  return data.id;
}

/**
 * Resolve either an internal UUID or a CentralReach id to an internal UUID.
 * UUIDs are returned as-is (no round trip). Anything else is treated as a
 * CentralReach id and looked up. Returns null on miss.
 */
export async function resolveClientRef(
  idOrCrId: string | null | undefined,
): Promise<string | null> {
  const trimmed = (idOrCrId ?? "").trim();
  if (!trimmed) return null;
  if (isUuid(trimmed)) return trimmed;
  return resolveClientByCentralReachId(trimmed);
}