/**
 * Post-normalization refresh of the shared CentralReach support tables.
 *
 * After facts land in the `cr_*` report tables we refresh the tables reports
 * and review queues read from:
 *  - `cr_report_data_freshness` (report freshness / coverage / row counts)
 *  - `cr_patient_match_links` and `cr_provider_match_links` (identity links)
 *  - `cr_client_provider_crosswalk` (client ↔ provider pairs seen)
 *  - `cr_identity_mapping_queue` (unmatched providers needing review)
 *
 * Everything here is additive and idempotent: re-running after a duplicate
 * upload never changes report totals.
 */

import { supabase } from "@/integrations/supabase/client";
import type { CRUploadKind } from "./detect";

/* eslint-disable @typescript-eslint/no-explicit-any */
const db = () => supabase as any;

const MAX_DISTINCT = 5000;
const CHUNK = 200;

export interface CrSupportRefreshInput {
  kind: Exclude<CRUploadKind, "unknown">;
  batchId: string | null;
  table: string;
  rowCount: number;
  coverageStart?: string | null;
  coverageEnd?: string | null;
  rows: Array<Record<string, unknown>>;
}

/** Injectable so tests can assert which support tables were refreshed. */
export interface CrSupportRefresher {
  refresh(input: CrSupportRefreshInput): Promise<string[]>;
}

export const noopCrSupportRefresher: CrSupportRefresher = {
  async refresh() { return []; },
};

function nameKey(value: unknown): string {
  return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function text(value: unknown): string | null {
  const out = String(value ?? "").trim();
  return out ? out : null;
}

/** Distinct client / provider identities present in a normalized row set. */
export function collectCrIdentities(rows: Array<Record<string, unknown>>) {
  const clients = new Map<string, { name: string; crId: string | null }>();
  const providers = new Map<string, { name: string; crId: string | null; role: string | null }>();
  const pairs = new Map<string, {
    clientName: string; providerName: string; providerRole: string | null;
    first: string | null; last: string | null; sessions: number; hours: number; state: string | null;
  }>();

  for (const row of rows) {
    const clientName = text(row.client_name);
    const providerName =
      text(row.rendering_provider_name) ?? text(row.provider_name) ?? text(row.staff_name);
    const role = text(row.provider_contact_labels) ?? text(row.procedure_code);
    const date = text(row.date_of_service) ?? text(row.event_date);
    const hours = Number(row.hours ?? 0) || 0;

    if (clientName && clients.size < MAX_DISTINCT) {
      const key = `${nameKey(clientName)}|${text(row.client_cr_id) ?? ""}`;
      if (!clients.has(key)) clients.set(key, { name: clientName, crId: text(row.client_cr_id) });
    }
    if (providerName && providers.size < MAX_DISTINCT) {
      const key = `${nameKey(providerName)}|${text(row.rendering_provider_cr_id) ?? ""}`;
      if (!providers.has(key)) {
        providers.set(key, {
          name: providerName,
          crId: text(row.rendering_provider_cr_id),
          role,
        });
      }
    }
    if (clientName && providerName && pairs.size < MAX_DISTINCT) {
      const key = `${nameKey(clientName)}|${nameKey(providerName)}`;
      const prev = pairs.get(key);
      if (prev) {
        prev.sessions += 1;
        prev.hours += hours;
        if (date && (!prev.first || date < prev.first)) prev.first = date;
        if (date && (!prev.last || date > prev.last)) prev.last = date;
      } else {
        pairs.set(key, {
          clientName, providerName, providerRole: null,
          first: date, last: date, sessions: 1, hours, state: text(row.state),
        });
      }
    }
  }
  return { clients: [...clients.values()], providers: [...providers.values()], pairs: [...pairs.values()] };
}

/** Report keys fed by each export kind, used for freshness rows. */
export const CR_FRESHNESS_KEYS: Record<Exclude<CRUploadKind, "unknown">, string[]> = {
  billing: ["bcba-productivity", "bcba-performance", "bcba-supervision", "parent-training"],
  scheduling: ["cancellation-command-center"],
  authorization: ["authorization-analysis"],
  utilization: ["authorization-utilization"],
  claims: ["authorization-claims"],
  contacts: ["identity-match-queues"],
};

export function createSupabaseCrSupportRefresher(): CrSupportRefresher {
  return {
    async refresh(input) {
      const warnings: string[] = [];
      const now = new Date().toISOString();

      // 1. Freshness — one row per report fed by this export type.
      for (const reportKey of CR_FRESHNESS_KEYS[input.kind] ?? []) {
        const { error } = await db()
          .from("cr_report_data_freshness")
          .upsert(
            {
              report_key: reportKey,
              export_type: input.kind,
              last_batch_id: input.batchId,
              last_uploaded_at: now,
              coverage_start: input.coverageStart ?? null,
              coverage_end: input.coverageEnd ?? null,
              row_count: input.rowCount,
              updated_at: now,
            },
            { onConflict: "report_key" },
          );
        if (error) warnings.push(`freshness(${reportKey}): ${error.message ?? String(error)}`);
      }

      if (input.kind !== "billing" && input.kind !== "scheduling") return warnings;

      const { clients, providers, pairs } = collectCrIdentities(input.rows);

      // 2. Patient match links — insert only names we have never seen.
      try {
        const existing = await loadKeys("cr_patient_match_links", "cr_client_name");
        const missing = clients
          .filter((c) => !existing.has(nameKey(c.name)))
          .map((c) => ({
            cr_client_name: c.name,
            cr_client_id: c.crId,
            match_status: "unmatched",
            match_method: "upload_scan",
          }));
        await insertChunks("cr_patient_match_links", missing);
      } catch (error) {
        warnings.push(`patient match links: ${message(error)}`);
      }

      // 3. Provider match links + identity review queue for unmatched providers.
      try {
        const existing = await loadKeys("cr_provider_match_links", "cr_provider_name");
        const missing = providers.filter((p) => !existing.has(nameKey(p.name)));
        await insertChunks(
          "cr_provider_match_links",
          missing.map((p) => ({
            cr_provider_name: p.name,
            cr_provider_id: p.crId,
            credential: p.role,
            match_status: "unmatched",
            match_method: "upload_scan",
          })),
        );
        await insertChunks(
          "cr_identity_mapping_queue",
          missing.map((p) => ({
            provider_id: p.crId ?? nameKey(p.name),
            provider_name: p.name,
            provider_name_key: nameKey(p.name),
            mapping_method: "upload_scan",
            mapping_status: "pending",
          })),
          { ignoreDuplicates: true },
        );
      } catch (error) {
        warnings.push(`provider match links: ${message(error)}`);
      }

      // 4. Client ↔ provider crosswalk.
      try {
        const { data } = await db()
          .from("cr_client_provider_crosswalk")
          .select("id, client_name, provider_name");
        const seen = new Map<string, string>();
        ((data ?? []) as any[]).forEach((r) => {
          seen.set(`${nameKey(r.client_name)}|${nameKey(r.provider_name)}`, r.id);
        });
        const inserts = pairs
          .filter((p) => !seen.has(`${nameKey(p.clientName)}|${nameKey(p.providerName)}`))
          .map((p) => ({
            client_name: p.clientName,
            provider_name: p.providerName,
            provider_role: p.providerRole,
            first_seen: p.first,
            last_seen: p.last,
            session_count: p.sessions,
            total_hours: p.hours,
            state: p.state,
          }));
        await insertChunks("cr_client_provider_crosswalk", inserts);
      } catch (error) {
        warnings.push(`client/provider crosswalk: ${message(error)}`);
      }

      return warnings;
    },
  };
}

function message(error: unknown): string {
  if (error instanceof Error) return error.message;
  const maybe = error as { message?: string };
  return maybe?.message ?? String(error);
}

async function loadKeys(table: string, column: string): Promise<Set<string>> {
  const keys = new Set<string>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db().from(table).select(column).range(from, from + 999);
    if (error) throw error;
    const rows = (data ?? []) as Array<Record<string, unknown>>;
    rows.forEach((r) => keys.add(nameKey(r[column])));
    if (rows.length < 1000) break;
  }
  return keys;
}

async function insertChunks(
  table: string,
  rows: Array<Record<string, unknown>>,
  options: { ignoreDuplicates?: boolean } = {},
): Promise<void> {
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    if (!chunk.length) continue;
    if (options.ignoreDuplicates) {
      await db().from(table).upsert(chunk, { ignoreDuplicates: true });
    } else {
      const { error } = await db().from(table).insert(chunk);
      if (error) throw error;
    }
  }
}