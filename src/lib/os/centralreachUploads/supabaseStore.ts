/**
 * Supabase-backed persistence for CentralReach Data Hub imports.
 *
 * Writes `cr_import_batches` plus the normalized `cr_*` fact tables and
 * `cr_raw_rows` provenance. Append-only: nothing here deletes, archives, or
 * deactivates existing batches or rows.
 */

import { supabase } from "@/integrations/supabase/client";
import type { CRBatchDescriptor } from "./dataHub";
import { CR_TABLE_FOR_KIND } from "./normalize";
import type { CrImportStore } from "./importSession";

/* eslint-disable @typescript-eslint/no-explicit-any */
const db = () => supabase as any;

const PAGE = 1000;
const INSERT_CHUNK = 500;

const KIND_FOR_TABLE = Object.fromEntries(
  Object.entries(CR_TABLE_FOR_KIND).map(([kind, table]) => [table, kind]),
) as Record<string, string>;

/** `row_hash` values already stored map back to in-memory identities. */
export function rowHashToIdentity(hash: string): string {
  return hash.startsWith("id:") ? hash : `hash:${hash}`;
}

export interface CrSupabaseStoreOptions {
  /** Raw payload lookup keyed by persisted row_hash, used for `cr_raw_rows`. */
  rawByHash?: Map<string, Record<string, unknown>>;
  notes?: string | null;
}

export function createSupabaseCrImportStore(
  options: CrSupabaseStoreOptions = {},
): CrImportStore<Record<string, unknown>> {
  return {
    async loadExistingIdentities(table: string): Promise<string[]> {
      const identities: string[] = [];
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await db()
          .from(table)
          .select("row_hash")
          .range(from, from + PAGE - 1);
        if (error) throw error;
        const rows = (data ?? []) as { row_hash: string }[];
        rows.forEach((r) => r.row_hash && identities.push(rowHashToIdentity(r.row_hash)));
        if (rows.length < PAGE) break;
      }
      return identities;
    },

    async insertRows(table, rows) {
      if (!rows.length) return;
      for (let i = 0; i < rows.length; i += INSERT_CHUNK) {
        const chunk = rows.slice(i, i + INSERT_CHUNK);
        const { error } = await db().from(table).insert(chunk);
        if (error) throw error;
      }
    },

    async updateRows(table, rows) {
      if (!rows.length) return;
      // CURRENT tables: refresh the stored row matched by its stable identity.
      for (const row of rows) {
        const { row_hash: rowHash, ...values } = row as Record<string, unknown> & { row_hash: string };
        const { error } = await db().from(table).update(values).eq("row_hash", rowHash);
        if (error) throw error;
      }
    },

    async upsertRows(table, rows) {
      if (!rows.length) return;
      for (let i = 0; i < rows.length; i += INSERT_CHUNK) {
        const chunk = rows.slice(i, i + INSERT_CHUNK);
        const { error } = await db().from(table).upsert(chunk, { onConflict: "row_hash" });
        if (error) throw error;
      }
    },

    async saveRawRows(rows) {
      if (!rows.length) return;
      // Raw history is a hard requirement, not best-effort: every parsed row of
      // every batch is persisted, including snapshot updates and duplicates.
      for (let i = 0; i < rows.length; i += INSERT_CHUNK) {
        const chunk = rows.slice(i, i + INSERT_CHUNK).map((r) => ({
          batch_id: r.batch_id,
          export_type: r.export_type,
          row_hash: r.row_hash,
          cr_row_id: r.cr_row_id ?? null,
          payload: r.payload,
        }));
        const { error } = await db().from("cr_raw_rows").insert(chunk);
        if (error) throw error;
      }
    },

    async createBatch(batch: CRBatchDescriptor): Promise<string> {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await db()
        .from("cr_import_batches")
        .insert({
          file_name: batch.fileName,
          file_hash: batch.fileHash,
          export_type: batch.exportType,
          row_count: batch.rowCount ?? 0,
          parsed_row_count: batch.parsedRowCount ?? batch.rowCount ?? 0,
          appended_row_count: batch.appendedRowCount ?? 0,
          duplicate_row_count: batch.duplicateRowCount ?? 0,
          updated_row_count: batch.updatedRowCount ?? 0,
          unchanged_row_count: batch.unchangedRowCount ?? 0,
          import_strategy: batch.importStrategy ?? "append_fact",
          deduped_row_count: batch.appendedRowCount ?? 0,
          coverage_start: batch.coverageStart ?? null,
          coverage_end: batch.coverageEnd ?? null,
          uploaded_by: batch.uploadedBy ?? userData?.user?.id ?? null,
          status: "pending",
          is_active: true,
          warnings: batch.warnings ?? [],
          notes: options.notes ?? null,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },

    async finalizeBatch(batchId: string, batch: CRBatchDescriptor): Promise<void> {
      const { error } = await db()
        .from("cr_import_batches")
        .update({
          row_count: batch.rowCount ?? 0,
          parsed_row_count: batch.parsedRowCount ?? 0,
          appended_row_count: batch.appendedRowCount ?? 0,
          duplicate_row_count: batch.duplicateRowCount ?? 0,
          updated_row_count: batch.updatedRowCount ?? 0,
          unchanged_row_count: batch.unchangedRowCount ?? 0,
          import_strategy: batch.importStrategy ?? "append_fact",
          deduped_row_count: batch.appendedRowCount ?? 0,
          coverage_start: batch.coverageStart ?? null,
          coverage_end: batch.coverageEnd ?? null,
          status: batch.status ?? "active",
          is_active: batch.isActive !== false,
          warnings: batch.warnings ?? [],
          updated_at: new Date().toISOString(),
        })
        .eq("id", batchId);
      if (error) throw error;
    },
  };
}

export interface CrNormalizedCounts {
  batches: number;
  billing: number;
  scheduling: number;
  authorization: number;
  utilization: number;
  claims: number;
  contacts: number;
  rawRows: number;
}

/** True row counts for Data Hub readiness — never inferred from batch metadata. */
export async function fetchCrNormalizedCounts(): Promise<CrNormalizedCounts> {
  const tables: Array<[keyof CrNormalizedCounts, string]> = [
    ["batches", "cr_import_batches"],
    ["billing", "cr_billing_sessions"],
    ["scheduling", "cr_schedule_events"],
    ["authorization", "cr_authorizations"],
    ["utilization", "cr_authorization_utilization"],
    ["claims", "cr_claims"],
    ["contacts", "cr_contacts"],
    ["rawRows", "cr_raw_rows"],
  ];
  const counts: CrNormalizedCounts = {
    batches: 0, billing: 0, scheduling: 0, authorization: 0,
    utilization: 0, claims: 0, contacts: 0, rawRows: 0,
  };
  await Promise.all(
    tables.map(async ([key, table]) => {
      const { count } = await db().from(table).select("id", { count: "exact", head: true });
      counts[key] = count ?? 0;
    }),
  );
  return counts;
}

export interface CrBatchRecord {
  id: string;
  fileName: string;
  fileHash: string;
  exportType: string;
  parsedRowCount: number;
  appendedRowCount: number;
  duplicateRowCount: number;
  updatedRowCount: number;
  unchangedRowCount: number;
  importStrategy: string;
  coverageStart: string | null;
  coverageEnd: string | null;
  status: string | null;
  isActive: boolean;
  createdAt: string;
}

export async function listCrImportBatches(limit = 100): Promise<CrBatchRecord[]> {
  const { data, error } = await db()
    .from("cr_import_batches")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as any[]).map((r) => ({
    id: r.id,
    fileName: r.file_name,
    fileHash: r.file_hash,
    exportType: r.export_type,
    parsedRowCount: r.parsed_row_count ?? r.row_count ?? 0,
    appendedRowCount: r.appended_row_count ?? 0,
    duplicateRowCount: r.duplicate_row_count ?? 0,
    updatedRowCount: r.updated_row_count ?? 0,
    unchangedRowCount: r.unchanged_row_count ?? 0,
    importStrategy: r.import_strategy ?? "append_fact",
    coverageStart: r.coverage_start ?? null,
    coverageEnd: r.coverage_end ?? null,
    status: r.status ?? null,
    isActive: r.is_active !== false,
    createdAt: r.created_at,
  }));
}
