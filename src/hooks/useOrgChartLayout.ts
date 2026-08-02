/**
 * Live org-chart layout store (`org_chart_layout`).
 *
 * Holds per-employee manual overrides — dragged card position, manual
 * reporting line, collapsed branch — and persists them immediately so the
 * chart looks the same for everyone. Realtime-subscribed so concurrent
 * editors stay in sync.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { OrgLayoutOverride } from "@/lib/os/orgChart/tree";

interface LayoutRow {
  employee_id: string;
  parent_employee_id: string | null;
  parent_override: boolean;
  position_x: number | null;
  position_y: number | null;
  collapsed: boolean;
}

function toOverride(r: LayoutRow): OrgLayoutOverride {
  return {
    employeeId: r.employee_id,
    parentEmployeeId: r.parent_employee_id,
    parentOverride: r.parent_override,
    positionX: r.position_x === null ? null : Number(r.position_x),
    positionY: r.position_y === null ? null : Number(r.position_y),
    collapsed: r.collapsed,
  };
}

export interface OrgLayoutPatch {
  parentEmployeeId?: string | null;
  parentOverride?: boolean;
  positionX?: number | null;
  positionY?: number | null;
  collapsed?: boolean;
}

export interface UseOrgChartLayoutResult {
  overrides: OrgLayoutOverride[];
  loading: boolean;
  reload: () => Promise<void>;
  /** Upsert one employee's layout. Returns an error message when blocked. */
  save: (employeeId: string, patch: OrgLayoutPatch) => Promise<string | null>;
  /** Upsert many at once (drag of a whole subtree, auto-arrange reset). */
  saveMany: (
    entries: Array<{ employeeId: string; patch: OrgLayoutPatch }>,
  ) => Promise<string | null>;
  /** Drop all manual overrides — chart falls back to live Viventium data. */
  resetAll: () => Promise<string | null>;
}

export function useOrgChartLayout(): UseOrgChartLayoutResult {
  const [overrides, setOverrides] = useState<OrgLayoutOverride[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const { data, error } = await supabase
      .from("org_chart_layout")
      .select(
        "employee_id,parent_employee_id,parent_override,position_x,position_y,collapsed",
      );
    if (!error && data) setOverrides((data as LayoutRow[]).map(toOverride));
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
    const ch = supabase
      .channel(`org-chart-layout-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "org_chart_layout" },
        () => void reload(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [reload]);

  const applyLocal = useCallback(
    (entries: Array<{ employeeId: string; patch: OrgLayoutPatch }>) => {
      setOverrides((prev) => {
        const map = new Map(prev.map((o) => [o.employeeId, { ...o }]));
        for (const { employeeId, patch } of entries) {
          const existing = map.get(employeeId) ?? { employeeId };
          map.set(employeeId, {
            ...existing,
            ...(patch.parentEmployeeId !== undefined
              ? { parentEmployeeId: patch.parentEmployeeId }
              : {}),
            ...(patch.parentOverride !== undefined
              ? { parentOverride: patch.parentOverride }
              : {}),
            ...(patch.positionX !== undefined ? { positionX: patch.positionX } : {}),
            ...(patch.positionY !== undefined ? { positionY: patch.positionY } : {}),
            ...(patch.collapsed !== undefined ? { collapsed: patch.collapsed } : {}),
          });
        }
        return Array.from(map.values());
      });
    },
    [],
  );

  const saveMany = useCallback(
    async (entries: Array<{ employeeId: string; patch: OrgLayoutPatch }>) => {
      if (entries.length === 0) return null;
      applyLocal(entries);
      const { data: auth } = await supabase.auth.getUser();
      const rows = entries.map(({ employeeId, patch }) => ({
        employee_id: employeeId,
        ...(patch.parentEmployeeId !== undefined
          ? { parent_employee_id: patch.parentEmployeeId }
          : {}),
        ...(patch.parentOverride !== undefined
          ? { parent_override: patch.parentOverride }
          : {}),
        ...(patch.positionX !== undefined ? { position_x: patch.positionX } : {}),
        ...(patch.positionY !== undefined ? { position_y: patch.positionY } : {}),
        ...(patch.collapsed !== undefined ? { collapsed: patch.collapsed } : {}),
        updated_by: auth?.user?.id ?? null,
      }));
      const { error } = await supabase
        .from("org_chart_layout")
        .upsert(rows, { onConflict: "employee_id" });
      if (error) {
        await reload();
        return error.message;
      }
      return null;
    },
    [applyLocal, reload],
  );

  const save = useCallback(
    (employeeId: string, patch: OrgLayoutPatch) => saveMany([{ employeeId, patch }]),
    [saveMany],
  );

  const resetAll = useCallback(async () => {
    setOverrides([]);
    const { error } = await supabase
      .from("org_chart_layout")
      .delete()
      .not("employee_id", "is", null);
    if (error) {
      await reload();
      return error.message;
    }
    return null;
  }, [reload]);

  return { overrides, loading, reload, save, saveMany, resetAll };
}