import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CheckpointCfg {
  key: string; label: string; supportive_intro: string | null;
  questionnaire_topics: string[]; is_celebration: boolean; order_index: number;
  due_within_days: number;
}
export interface JourneyInstance {
  id: string; employee_id: string; first_case_id: string | null;
  checkpoint_key: string; scheduled_date: string; due_date: string;
  status: "scheduled"|"open"|"completed"|"skipped"|"overdue";
  risk_level: "normal"|"watch"|"support_needed"|"urgent_review";
  opened_at: string | null; completed_at: string | null;
  owner_employee_id: string | null; owner_role: string | null;
  resolution_status: "none"|"in_progress"|"resolved";
}

export function useJourney(employeeId: string | null | undefined) {
  const [instances, setInstances] = useState<JourneyInstance[] | null>(null);
  const [checkpoints, setCheckpoints] = useState<CheckpointCfg[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    const [{ data: ins }, { data: cfg }] = await Promise.all([
      supabase.from("rbt_journey_instances" as any).select("*")
        .eq("employee_id", employeeId).order("scheduled_date"),
      supabase.from("rbt_journey_checkpoints" as any).select("*").eq("is_active", true).order("order_index"),
    ]);
    setInstances(((ins as any) ?? []) as JourneyInstance[]);
    setCheckpoints(((cfg as any) ?? []) as CheckpointCfg[]);
    setLoading(false);
  }, [employeeId]);
  useEffect(() => { void load(); }, [load]);

  const byKey = useMemo(() => {
    const m = new Map<string, CheckpointCfg>();
    checkpoints.forEach((c) => m.set(c.key, c));
    return m;
  }, [checkpoints]);

  const nextOpen = useMemo(() => {
    if (!instances) return null;
    return instances.find((i) => i.status === "open" || i.status === "overdue") ?? null;
  }, [instances]);

  return { instances: instances ?? [], checkpoints, byKey, nextOpen, loading, reload: load };
}