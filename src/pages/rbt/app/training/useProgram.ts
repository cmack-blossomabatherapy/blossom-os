import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { PathwayStep, StepProgress, StepRow } from "./types";

export function useProgram(employeeId: string | null | undefined) {
  const [pathway, setPathway] = useState<any | null>(null);
  const [steps, setSteps] = useState<PathwayStep[] | null>(null);
  const [progress, setProgress] = useState<StepProgress[] | null>(null);
  const [remediation, setRemediation] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);

    const { data: assign } = await supabase
      .from("rbt_pathway_assignments" as any)
      .select("pathway_id, assigned_at, notes, active, pathway:rbt_pathways!inner(id,key,name,description)")
      .eq("employee_id", employeeId)
      .eq("active", true)
      .order("assigned_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!assign) {
      setPathway(null); setSteps([]); setProgress([]); setRemediation([]); setLoading(false); return;
    }
    const pathwayRow = (assign as any).pathway;
    setPathway(pathwayRow);

    const [stepsRes, progRes, remRes] = await Promise.all([
      supabase.from("rbt_pathway_steps" as any).select("*").eq("pathway_id", pathwayRow.id).order("order_index"),
      supabase.from("rbt_pathway_progress" as any).select("*").eq("employee_id", employeeId),
      supabase.from("rbt_remediation_assignments" as any).select("*").eq("employee_id", employeeId).neq("status", "complete").order("assigned_at", { ascending: false }),
    ]);
    const stepRows = ((stepsRes.data as any[]) ?? []).map((s) => ({
      ...s,
      capabilities: Array.isArray(s.capabilities) ? s.capabilities : [],
    })) as PathwayStep[];

    const progRows = ((progRes.data as any[]) ?? []) as StepProgress[];
    const existing = new Set(progRows.map((p) => p.pathway_step_id));
    const missing = stepRows.filter((s) => !existing.has(s.id));
    if (missing.length) {
      const { data: created } = await supabase.from("rbt_pathway_progress" as any).insert(
        missing.map((m) => ({ employee_id: employeeId, pathway_step_id: m.id, status: "not_started" }))
      ).select("*");
      progRows.push(...(((created as any[]) ?? []) as StepProgress[]));
    }

    setSteps(stepRows);
    setProgress(progRows);
    setRemediation((remRes.data as any[]) ?? []);
    setLoading(false);
  }, [employeeId]);

  useEffect(() => { void load(); }, [load]);

  const rows: StepRow[] = useMemo(() => {
    if (!steps || !progress) return [];
    const map = new Map(progress.map((p) => [p.pathway_step_id, p]));
    return steps.map((s) => ({ step: s, progress: map.get(s.id)! })).filter((r) => r.progress);
  }, [steps, progress]);

  const stats = useMemo(() => {
    const total = rows.length;
    const complete = rows.filter((r) => r.progress.status === "complete").length;
    const current = rows.find((r) => r.progress.status !== "complete") ?? null;
    const blocked = rows.find((r) => r.progress.status === "blocked" || r.progress.status === "needs_support") ?? null;
    const percent = total ? Math.round((complete / total) * 100) : 0;
    const totalDays = rows.reduce((n, r) => n + (r.step.estimated_days ?? 0), 0);
    return { total, complete, current, blocked, percent, totalDays };
  }, [rows]);

  return { pathway, rows, remediation, stats, loading, reload: load };
}