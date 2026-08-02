/**
 * Durable run tracking for CentralReach Data Hub uploads.
 *
 * Every upload attempt — success or failure — writes a `cr_sync_runs` row plus
 * `cr_sync_audit` entries. Failures also write `cr_sync_run_errors` so an
 * operator can see exactly why nothing landed instead of a silent no-op.
 */

import { supabase } from "@/integrations/supabase/client";
import type { CRUploadKind } from "./detect";

/* eslint-disable @typescript-eslint/no-explicit-any */
const db = () => supabase as any;

/** `cr_sync_types.key` enum value used for each detected export kind. */
export const CR_RUN_TYPE_FOR_KIND: Record<Exclude<CRUploadKind, "unknown">, string> = {
  billing: "billing",
  scheduling: "scheduling",
  authorization: "authorizations",
  utilization: "utilization",
  claims: "claims",
  contacts: "contacts",
};

export function crRunTypeForKind(kind: CRUploadKind): string {
  if (kind === "unknown") return "dashboard_audit";
  return CR_RUN_TYPE_FOR_KIND[kind];
}

export interface CrRunStartInput {
  fileName: string;
  fileHash: string;
  fileSizeBytes?: number | null;
  exportType: CRUploadKind;
  detectedHeaders?: string[];
  notes?: string | null;
}

export interface CrRunCounts {
  rowCountTotal: number;
  rowsAdded: number;
  rowsUnchanged: number;
  rowsRejected: number;
  rowsUpdated?: number;
  /** Plain-English explanation stored on the run (e.g. duplicate no-change). */
  notes?: string | null;
  /** Duplicate reuploads changed nothing, so no commit timestamp is recorded. */
  duplicateNoChange?: boolean;
}

export interface CrRunErrorRow {
  rowNumber?: number | null;
  externalId?: string | null;
  field?: string | null;
  errorCode?: string | null;
  errorMessage: string;
  rawRow?: Record<string, unknown> | null;
}

/** Persistence surface for run tracking — injectable so tests can observe it. */
export interface CrRunTracker {
  start(input: CrRunStartInput): Promise<string | null>;
  audit(runId: string | null, action: string, detail?: Record<string, unknown>): Promise<void>;
  commit(runId: string | null, counts: CrRunCounts): Promise<void>;
  fail(runId: string | null, message: string, rows?: CrRunErrorRow[]): Promise<void>;
}

/** Tracker that records nothing — used when run tracking itself is unavailable. */
export const noopCrRunTracker: CrRunTracker = {
  async start() { return null; },
  async audit() {},
  async commit() {},
  async fail() {},
};

export function createSupabaseCrRunTracker(): CrRunTracker {
  let actorId: string | null | undefined;

  async function actor(): Promise<string | null> {
    if (actorId !== undefined) return actorId ?? null;
    const { data } = await supabase.auth.getUser();
    actorId = data?.user?.id ?? null;
    return actorId;
  }

  return {
    async start(input) {
      const uploadedBy = await actor();
      const { data, error } = await db()
        .from("cr_sync_runs")
        .insert({
          type_key: crRunTypeForKind(input.exportType),
          status: "uploaded",
          file_name: input.fileName,
          file_sha256: input.fileHash,
          file_size_bytes: input.fileSizeBytes ?? null,
          detected_headers: input.detectedHeaders ?? [],
          notes: input.notes ?? null,
          uploaded_by: uploadedBy,
        })
        .select("id")
        .single();
      if (error) throw error;
      return (data?.id as string) ?? null;
    },

    async audit(runId, action, detail) {
      if (!runId) return;
      const actor_id = await actor();
      // Audit is observability: never let it break the import.
      await db().from("cr_sync_audit").insert({
        run_id: runId,
        actor_id,
        action,
        detail: detail ?? {},
      });
    },

    async commit(runId, counts) {
      if (!runId) return;
      const noChange = counts.duplicateNoChange === true;
      const { error } = await db()
        .from("cr_sync_runs")
        .update({
          status: "committed",
          row_count_total: counts.rowCountTotal,
          rows_added: counts.rowsAdded,
          rows_updated: counts.rowsUpdated ?? 0,
          rows_unchanged: counts.rowsUnchanged,
          rows_rejected: counts.rowsRejected,
          notes: counts.notes ?? null,
          committed_at: noChange ? null : new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", runId);
      if (error) throw error;
    },

    async fail(runId, message, rows) {
      if (!runId) return;
      await db()
        .from("cr_sync_runs")
        .update({
          status: "failed",
          notes: message.slice(0, 2000),
          updated_at: new Date().toISOString(),
        })
        .eq("id", runId);
      const errorRows = (rows?.length ? rows : [{ errorMessage: message }]).slice(0, 200);
      await db().from("cr_sync_run_errors").insert(
        errorRows.map((row) => ({
          run_id: runId,
          row_number: row.rowNumber ?? null,
          external_id: row.externalId ?? null,
          field: row.field ?? null,
          error_code: row.errorCode ?? "import_failed",
          error_message: row.errorMessage.slice(0, 2000),
          raw_row: row.rawRow ?? null,
        })),
      );
    },
  };
}

export interface CrSyncRunRecord {
  id: string;
  typeKey: string;
  status: string;
  fileName: string;
  rowCountTotal: number;
  rowsAdded: number;
  rowsUnchanged: number;
  rowsRejected: number;
  notes: string | null;
  committedAt: string | null;
  createdAt: string;
}

/**
 * Can the signed-in operator actually write to the CentralReach tables?
 *
 * Uploads used to look successful while every insert was rejected by grants or
 * RLS. Checking up front turns that class of silent no-op into a visible,
 * actionable message before any file is parsed.
 */
export interface CrUploadPreflight {
  canWrite: boolean;
  reason: string;
}

export async function crUploadPreflight(): Promise<CrUploadPreflight> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user?.id) {
    return { canWrite: false, reason: "You are not signed in, so uploads cannot be saved. Sign in and reload." };
  }
  const { data, error } = await db().rpc("cr_hub_can_manage");
  if (error) {
    return {
      canWrite: false,
      reason: `Could not verify CentralReach write access: ${error.message ?? String(error)}`,
    };
  }
  if (data !== true) {
    return {
      canWrite: false,
      reason:
        "Your account does not have CentralReach Data Hub write access, so uploads would be rejected by the database. Ask a Super Admin to grant it.",
    };
  }
  return { canWrite: true, reason: "Write access confirmed — uploads will be saved to the report tables." };
}

export async function listCrSyncRuns(limit = 25): Promise<CrSyncRunRecord[]> {
  const { data, error } = await db()
    .from("cr_sync_runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as any[]).map((r) => ({
    id: r.id,
    typeKey: r.type_key,
    status: r.status,
    fileName: r.file_name,
    rowCountTotal: r.row_count_total ?? 0,
    rowsAdded: r.rows_added ?? 0,
    rowsUnchanged: r.rows_unchanged ?? 0,
    rowsRejected: r.rows_rejected ?? 0,
    notes: r.notes ?? null,
    committedAt: r.committed_at ?? null,
    createdAt: r.created_at,
  }));
}