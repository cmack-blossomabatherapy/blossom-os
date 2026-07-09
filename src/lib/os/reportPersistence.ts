/**
 * reportPersistence.ts
 *
 * Shared Supabase-backed persistence for saved-report metadata and
 * report-row follow-ups. Uses `report_saved_snapshots` and
 * `report_followups`. Local (localStorage / IndexedDB) storage remains
 * a best-effort cache and holds the heavy uploaded payloads; the
 * canonical metadata for logged-in users lives here so it follows the
 * user across devices.
 *
 * The `client_id` column on `report_saved_snapshots` is used as the
 * per-row identifier (unique with user_id + scope), so we pass the
 * saved report's own local id there.
 */
import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyClient = supabase as any;

export type ReportSnapshotScope =
  | "bcba_productivity_v3"
  | "bcba_productivity_legacy"
  | "cancellation_command_center";

export type FollowupScope = "cancellation_command_center";

export interface RemoteSnapshot {
  clientKey: string;             // report's local id (unique per user+scope)
  name: string;
  primaryFileName: string | null;
  auxFileNames: string[];
  insights: string[];
  savedAt: number;               // ms since epoch
}

export interface RemoteFollowup {
  rowKey: string;
  status: string;
  notes: string | null;
  updatedAt: number;
}

async function currentUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

/* ---------- snapshots ---------- */

export async function listRemoteSnapshots(scope: ReportSnapshotScope): Promise<RemoteSnapshot[]> {
  const uid = await currentUserId();
  if (!uid) return [];
  const { data, error } = await anyClient
    .from("report_saved_snapshots")
    .select("client_id, name, primary_file_name, aux_file_names, insights, saved_at")
    .eq("user_id", uid)
    .eq("scope", scope)
    .order("saved_at", { ascending: false });
  if (error || !Array.isArray(data)) return [];
  return data.map((r: {
    client_id: string;
    name: string;
    primary_file_name: string | null;
    aux_file_names: unknown;
    insights: unknown;
    saved_at: string;
  }) => ({
    clientKey: r.client_id,
    name: r.name,
    primaryFileName: r.primary_file_name,
    auxFileNames: Array.isArray(r.aux_file_names) ? (r.aux_file_names as string[]) : [],
    insights: Array.isArray(r.insights) ? (r.insights as string[]) : [],
    savedAt: r.saved_at ? Date.parse(r.saved_at) : Date.now(),
  }));
}

export async function upsertRemoteSnapshot(
  scope: ReportSnapshotScope,
  snap: RemoteSnapshot,
): Promise<void> {
  const uid = await currentUserId();
  if (!uid) return;
  const { error } = await anyClient.from("report_saved_snapshots").upsert(
    {
      user_id: uid,
      scope,
      client_id: snap.clientKey,
      name: snap.name,
      primary_file_name: snap.primaryFileName ?? null,
      aux_file_names: snap.auxFileNames ?? [],
      insights: snap.insights ?? [],
      saved_at: new Date(snap.savedAt).toISOString(),
    },
    { onConflict: "user_id,scope,client_id" },
  );
  if (error) {
    throw new Error(`upsertRemoteSnapshot(${scope}) failed: ${error.message ?? String(error)}`);
  }
}

export async function deleteRemoteSnapshot(
  scope: ReportSnapshotScope,
  clientKey: string,
): Promise<void> {
  const uid = await currentUserId();
  if (!uid) return;
  const { error } = await anyClient
    .from("report_saved_snapshots")
    .delete()
    .eq("user_id", uid)
    .eq("scope", scope)
    .eq("client_id", clientKey);
  if (error) {
    throw new Error(`deleteRemoteSnapshot(${scope}) failed: ${error.message ?? String(error)}`);
  }
}

/* ---------- followups ---------- */

export async function listRemoteFollowups(scope: FollowupScope): Promise<RemoteFollowup[]> {
  const uid = await currentUserId();
  if (!uid) return [];
  const { data, error } = await anyClient
    .from("report_followups")
    .select("row_key, status, notes, updated_at")
    .eq("user_id", uid)
    .eq("scope", scope);
  if (error || !Array.isArray(data)) return [];
  return data.map((r: { row_key: string; status: string; notes: string | null; updated_at: string }) => ({
    rowKey: r.row_key,
    status: r.status,
    notes: r.notes,
    updatedAt: r.updated_at ? Date.parse(r.updated_at) : Date.now(),
  }));
}

export async function upsertRemoteFollowup(
  scope: FollowupScope,
  rowKey: string,
  status: string,
  notes?: string | null,
): Promise<void> {
  const uid = await currentUserId();
  if (!uid) return;
  const { error } = await anyClient.from("report_followups").upsert(
    {
      user_id: uid,
      scope,
      row_key: rowKey,
      status,
      notes: notes ?? null,
    },
    { onConflict: "user_id,scope,row_key" },
  );
  if (error) {
    throw new Error(`upsertRemoteFollowup(${scope}) failed: ${error.message ?? String(error)}`);
  }
}

/* ---------- one-time migration from legacy localStorage keys ---------- */

const MIGRATION_FLAG = "blossom-report-migration-v1";

export async function migrateLocalReportsIfNeeded(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(MIGRATION_FLAG)) return;
  } catch {
    return;
  }
  const uid = await currentUserId();
  if (!uid) return; // wait for a signed-in run; flag stays unset

  const safe = <T,>(key: string, fb: T): T => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fb;
      return JSON.parse(raw) as T;
    } catch {
      return fb;
    }
  };

  type LegacyBcba = { id: string; name: string; savedAt: number; billingFileName?: string; authFileNames?: string[]; insights?: string[] };
  type LegacyV3 = { id: string; name: string; savedAt: number; fileName?: string };
  type LegacyCancel = { id: string; name: string; savedAt: number; scheduleFileName?: string; billingFileName?: string; authFileNames?: string[]; insights?: string[] };

  const bcba = safe<LegacyBcba[]>("bcba-productivity-saved-reports", []);
  const v3 = safe<LegacyV3[]>("bcba-prod-v3-saved", []);
  const cancel = safe<LegacyCancel[]>("cancellation-cc-saved-reports", []);
  const fups = safe<Record<string, string>>("cancellation-cc-followups", {});

  try {
    for (const r of bcba) {
      await upsertRemoteSnapshot("bcba_productivity_legacy", {
        clientKey: r.id,
        name: r.name,
        primaryFileName: r.billingFileName ?? null,
        auxFileNames: r.authFileNames ?? [],
        insights: r.insights ?? [],
        savedAt: r.savedAt ?? Date.now(),
      });
    }
    for (const r of v3) {
      await upsertRemoteSnapshot("bcba_productivity_v3", {
        clientKey: r.id,
        name: r.name,
        primaryFileName: r.fileName ?? null,
        auxFileNames: [],
        insights: [],
        savedAt: r.savedAt ?? Date.now(),
      });
    }
    for (const r of cancel) {
      await upsertRemoteSnapshot("cancellation_command_center", {
        clientKey: r.id,
        name: r.name,
        primaryFileName: r.scheduleFileName ?? null,
        auxFileNames: [r.billingFileName, ...(r.authFileNames ?? [])].filter(Boolean) as string[],
        insights: r.insights ?? [],
        savedAt: r.savedAt ?? Date.now(),
      });
    }
    for (const [rowKey, status] of Object.entries(fups)) {
      if (!status) continue;
      await upsertRemoteFollowup("cancellation_command_center", rowKey, String(status));
    }
    localStorage.setItem(MIGRATION_FLAG, new Date().toISOString());
  } catch {
    // Silent: keep flag unset so a later signed-in run retries.
  }
}