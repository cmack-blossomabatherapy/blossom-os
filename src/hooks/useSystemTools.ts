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
  // Operations Leadership Pass — extended request intake fields.
  request_type?: string | null;
  affected_department?: string | null;
  affected_role?: string | null;
  affected_state?: string | null;
  affected_route?: string | null;
  impact?: string | null;
  desired_outcome?: string | null;
  due_date?: string | null;
  linked_work_item_id?: string | null;
  owner_id?: string | null;
  reported_by_id?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface SystemToolAuditLog {
  id: string;
  tool_area: string;
  entity_table: string | null;
  entity_id: string | null;
  action: string;
  actor_user_id: string | null;
  actor_email: string | null;
  previous_value: Record<string, unknown>;
  new_value: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type SystemToolArea =
  | "workflow_inventory"
  | "issue_tracker"
  | "request_intake"
  | "bcba_productivity_uploads"
  | "integrations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyClient = supabase as any;

/**
 * Best-effort audit writer. Failures are swallowed so a lost audit row can
 * never block a legitimate admin action, but they surface in console.warn
 * so ops can spot silent breakage.
 */
export async function logSystemToolAction(entry: {
  tool_area: SystemToolArea;
  action: string;
  entity_table?: string;
  entity_id?: string | null;
  previous_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}) {
  try {
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id ?? null;
    const email = userRes.user?.email ?? null;
    const { error } = await anyClient.from("system_tool_audit_logs").insert({
      tool_area: entry.tool_area,
      action: entry.action,
      entity_table: entry.entity_table ?? null,
      entity_id: entry.entity_id ?? null,
      actor_user_id: uid,
      actor_email: email,
      previous_value: entry.previous_value ?? {},
      new_value: entry.new_value ?? {},
      metadata: entry.metadata ?? {},
    });
    if (error) console.warn("[systemToolAudit] insert failed:", error.message);
  } catch (e) {
    console.warn("[systemToolAudit] threw:", e);
  }
}

/**
 * Load recent audit rows, optionally scoped by tool area and/or entity id.
 * Read is RLS-restricted to admins/super_admins.
 */
export function useSystemToolAuditLogs(options?: {
  toolArea?: SystemToolArea;
  entityId?: string | null;
  limit?: number;
}) {
  const [rows, setRows] = useState<SystemToolAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    let q = anyClient
      .from("system_tool_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(options?.limit ?? 50);
    if (options?.toolArea) q = q.eq("tool_area", options.toolArea);
    if (options?.entityId) q = q.eq("entity_id", options.entityId);
    const { data, error: err } = await q;
    if (err) setError(err.message);
    setRows((data ?? []) as SystemToolAuditLog[]);
    setLoading(false);
  }, [options?.toolArea, options?.entityId, options?.limit]);

  useEffect(() => {
    void load();
  }, [load]);

  return { rows, loading, error, refresh: load };
}

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
      const { data, error: err } = await anyClient
        .from(table)
        .insert(patch)
        .select("id")
        .single();
      if (err) throw new Error(err.message);
      void logSystemToolAction({
        tool_area:
          table === "system_workflows" ? "workflow_inventory" :
          table === "system_issues" ? "issue_tracker" : "workflow_inventory",
        action: "create",
        entity_table: table,
        entity_id: (data?.id ?? null) as string | null,
        new_value: patch as Record<string, unknown>,
      });
      await load();
    },
    [table, load],
  );

  const update = useCallback(
    async (id: string, patch: Partial<T>) => {
      const previous = rows.find((r) => r.id === id) as Record<string, unknown> | undefined;
      const { error: err } = await anyClient.from(table).update(patch).eq("id", id);
      if (err) throw new Error(err.message);
      const isStatusChange =
        "status" in (patch as Record<string, unknown>) &&
        previous &&
        previous.status !== (patch as Record<string, unknown>).status;
      void logSystemToolAction({
        tool_area:
          table === "system_workflows" ? "workflow_inventory" :
          table === "system_issues" ? "issue_tracker" : "workflow_inventory",
        action: isStatusChange ? "status_change" : "update",
        entity_table: table,
        entity_id: id,
        previous_value: previous ?? {},
        new_value: patch as Record<string, unknown>,
      });
      await load();
    },
    [table, load, rows],
  );

  const remove = useCallback(
    async (id: string) => {
      const previous = rows.find((r) => r.id === id) as Record<string, unknown> | undefined;
      const { error: err } = await anyClient.from(table).delete().eq("id", id);
      if (err) throw new Error(err.message);
      void logSystemToolAction({
        tool_area:
          table === "system_workflows" ? "workflow_inventory" :
          table === "system_issues" ? "issue_tracker" : "workflow_inventory",
        action: "delete",
        entity_table: table,
        entity_id: id,
        previous_value: previous ?? {},
      });
      await load();
    },
    [table, load, rows],
  );

  return { rows, loading, error, create, update, remove, refresh: load };
}

export const useSystemWorkflows = () => useTable<SystemWorkflow>("system_workflows");
export const useSystemIssues = () => useTable<SystemIssue>("system_issues");