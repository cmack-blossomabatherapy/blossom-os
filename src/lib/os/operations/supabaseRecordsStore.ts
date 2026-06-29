import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { OpsRecord } from "./recordsStore";

/**
 * Supabase-backed analogue of `useOpsRecords`. Keeps the same
 * `{ rows, create, update, remove }` shape so OpsRecordsWorkspace can switch
 * to a real database table without changing the UI surface.
 *
 * `writableFields` is the list of column names the workspace is allowed to
 * write to (everything else on the row, e.g. `id` or `created_at`, is read-only).
 */
export interface SupabaseRecordsHook {
  rows: OpsRecord[];
  loading: boolean;
  error: string | null;
  create: (row: Partial<OpsRecord>) => Promise<void>;
  update: (id: string, patch: Partial<OpsRecord>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

function rowToRecord(raw: Record<string, unknown>): OpsRecord {
  const rec: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v === null || v === undefined) rec[k] = "";
    else if (typeof v === "object") rec[k] = JSON.stringify(v);
    else rec[k] = String(v);
  }
  return {
    ...rec,
    id: String(raw.id ?? ""),
    createdAt: String(raw.created_at ?? ""),
    updatedAt: String(raw.updated_at ?? ""),
  } as OpsRecord;
}

function sanitize(
  patch: Partial<OpsRecord>,
  writableFields: string[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of writableFields) {
    if (key in patch) {
      const val = (patch as Record<string, unknown>)[key];
      out[key] = val === "" ? null : val;
    }
  }
  return out;
}

export function useSupabaseRecords(
  table: string,
  writableFields: string[],
  orderBy: string = "created_at",
  ascending: boolean = false,
): SupabaseRecordsHook {
  const [rows, setRows] = useState<OpsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Cast so we can hit arbitrary tables without rebuilding generated types.
      const client = supabase as unknown as {
        from: (t: string) => {
          select: (cols: string) => {
            order: (col: string, opts: { ascending: boolean }) => Promise<{
              data: Record<string, unknown>[] | null;
              error: { message: string } | null;
            }>;
          };
        };
      };
      const { data, error: err } = await client
        .from(table)
        .select("*")
        .order(orderBy, { ascending });
      if (err) throw new Error(err.message);
      setRows((data ?? []).map(rowToRecord));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load records");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [table, orderBy, ascending]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = useCallback(
    async (row: Partial<OpsRecord>) => {
      const payload = sanitize(row, writableFields);
      const client = supabase as unknown as {
        from: (t: string) => {
          insert: (p: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
        };
      };
      const { error: err } = await client.from(table).insert(payload);
      if (err) throw new Error(err.message);
      await load();
    },
    [table, writableFields, load],
  );

  const update = useCallback(
    async (id: string, patch: Partial<OpsRecord>) => {
      const payload = sanitize(patch, writableFields);
      const client = supabase as unknown as {
        from: (t: string) => {
          update: (p: Record<string, unknown>) => {
            eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
          };
        };
      };
      const { error: err } = await client.from(table).update(payload).eq("id", id);
      if (err) throw new Error(err.message);
      await load();
    },
    [table, writableFields, load],
  );

  const remove = useCallback(
    async (id: string) => {
      const client = supabase as unknown as {
        from: (t: string) => {
          delete: () => {
            eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
          };
        };
      };
      const { error: err } = await client.from(table).delete().eq("id", id);
      if (err) throw new Error(err.message);
      await load();
    },
    [table, load],
  );

  return useMemo(
    () => ({ rows, loading, error, create, update, remove, refresh: load }),
    [rows, loading, error, create, update, remove, load],
  );
}