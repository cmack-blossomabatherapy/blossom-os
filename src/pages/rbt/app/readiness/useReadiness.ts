import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ReadinessGate, ReadinessRow, ReadinessState } from "./types";

export function useReadiness(employeeId: string | null | undefined) {
  const [gates, setGates] = useState<ReadinessGate[] | null>(null);
  const [states, setStates] = useState<ReadinessState[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    setError(null);
    const [g, s] = await Promise.all([
      supabase.from("rbt_readiness_gates" as any).select("*").eq("is_active", true).order("sort_order"),
      supabase.from("rbt_readiness_gate_state" as any).select("*").eq("employee_id", employeeId),
    ]);
    if (g.error || s.error) {
      setError(g.error?.message || s.error?.message || "Failed to load readiness");
      setLoading(false);
      return;
    }
    const gateRows = ((g.data as any[]) ?? []) as ReadinessGate[];
    const stateRows = ((s.data as any[]) ?? []) as ReadinessState[];

    // Auto-initialize any missing states for this employee
    const existing = new Set(stateRows.map((r) => r.gate_key));
    const missing = gateRows.filter((g0) => !existing.has(g0.key));
    if (missing.length) {
      const inserts = missing.map((g0) => ({
        employee_id: employeeId,
        gate_key: g0.key,
        status: "not_started",
      }));
      const { data: newRows } = await supabase.from("rbt_readiness_gate_state" as any).insert(inserts).select("*");
      stateRows.push(...(((newRows as any[]) ?? []) as ReadinessState[]));
    }

    setGates(gateRows);
    setStates(stateRows);
    setLoading(false);
  }, [employeeId]);

  useEffect(() => { void load(); }, [load]);

  const rows: ReadinessRow[] | null = useMemo(() => {
    if (!gates || !states) return null;
    const map = new Map(states.map((s) => [s.gate_key, s]));
    return gates
      .map((g) => ({ gate: g, state: map.get(g.key)! }))
      .filter((r) => r.state);
  }, [gates, states]);

  const stats = useMemo(() => {
    const list = rows ?? [];
    const total = list.length;
    const complete = list.filter((r) => r.state.status === "approved" || r.state.status === "waived").length;
    const percent = total ? Math.round((complete / total) * 100) : 0;
    const nextRow = list.find((r) => r.state.status !== "approved" && r.state.status !== "waived") ?? null;
    const blocker = list.find((r) => r.state.status === "blocked" || r.state.risk_flag === "escalation") ?? null;
    return { total, complete, percent, nextRow, blocker };
  }, [rows]);

  return { rows, loading, error, stats, reload: load };
}

export function useStaffingStatus(employeeId: string | null | undefined) {
  const [status, setStatus] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!employeeId) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("rbt_staffing_status" as any).select("*").eq("employee_id", employeeId).maybeSingle();
      setStatus(data);
      setLoading(false);
    })();
  }, [employeeId]);
  return { status, loading };
}