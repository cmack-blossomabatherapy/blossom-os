/**
 * Pass 1B — System Tools workspaces.
 *
 * Supabase-backed CRUD hooks for `system_workflows` and `system_issues`.
 * Any authenticated user can view; admin/super_admin write per RLS.
 * Issues additionally accept submissions from any signed-in user.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SystemWorkflow {
  id: string;
  name: string;
  department: string | null;
  owner_name: string | null;
  current_source: string | null;
  future_module: string | null;
  status: string;
  priority: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SystemIssue {
  id: string;
  title: string;
  area: string | null;
  description: string | null;
  reported_by_name: string | null;
  owner_name: string | null;
  priority: string;
  status: string;
  notes: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyClient = supabase as any;

function useTable<T extends { id: string }>(table: string) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await anyClient
      .from(table)
      .select("*")
      .order("created_at", { ascending: false });
    if (err) setError(err.message);
    setRows((data ?? []) as T[]);
    setLoading(false);
  }, [table]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = useCallback(
    async (patch: Partial<T>) => {
      const { error: err } = await anyClient.from(table).insert(patch);
      if (err) throw new Error(err.message);
      await load();
    },
    [table, load],
  );

  const update = useCallback(
    async (id: string, patch: Partial<T>) => {
      const { error: err } = await anyClient.from(table).update(patch).eq("id", id);
      if (err) throw new Error(err.message);
      await load();
    },
    [table, load],
  );

  const remove = useCallback(
    async (id: string) => {
      const { error: err } = await anyClient.from(table).delete().eq("id", id);
      if (err) throw new Error(err.message);
      await load();
    },
    [table, load],
  );

  return { rows, loading, error, create, update, remove, refresh: load };
}

export const useSystemWorkflows = () => useTable<SystemWorkflow>("system_workflows");
export const useSystemIssues = () => useTable<SystemIssue>("system_issues");