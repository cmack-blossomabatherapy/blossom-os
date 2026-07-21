import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRbtIdentity } from "../useRbtIdentity";

export type CareerStage = {
  key: string; name: string; order_index: number;
  description: string | null; employee_summary: string | null;
  is_fellowship: boolean; requires_application: boolean; active: boolean;
};

export type Requirement = {
  id: string; stage_key: string; requirement_key: string; label: string;
  category: string; description: string | null; order_index: number; active: boolean;
};

export type Evaluation = {
  id: string; employee_id: string; stage_key: string; requirement_key: string;
  status: "pending" | "met" | "not_met" | "waived";
  evidence: string | null; notes: string | null;
  evaluated_at: string | null; evaluated_by: string | null;
};

export type CareerInterests = {
  employee_id: string;
  primary_interest: string | null;
  secondary_interests: string[];
  mentor_requested: boolean;
  mentor_request_notes: string | null;
  open_to_internal_opportunities: boolean;
  notes: string | null;
};

export const PRIMARY_INTEREST_OPTIONS = [
  { value: "grow_current", label: "Grow in my current RBT role" },
  { value: "advanced_rbt", label: "Advanced RBT" },
  { value: "lead_rbt", label: "Lead RBT" },
  { value: "trainer", label: "Trainer" },
  { value: "bcba_fellowship", label: "BCBA Fellowship" },
  { value: "other_internal", label: "Other internal opportunity" },
  { value: "not_sure", label: "Not sure yet" },
] as const;

export function useGrowth() {
  const { employeeId, writableEmployeeId, authUserId } = useRbtIdentity();
  const eid = employeeId;
  const [loading, setLoading] = useState(true);
  const [stages, setStages] = useState<CareerStage[]>([]);
  const [currentStageKey, setCurrentStageKey] = useState<string | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [interests, setInterests] = useState<CareerInterests | null>(null);
  const [devPlan, setDevPlan] = useState<any | null>(null);
  const [fellowshipParticipant, setFellowshipParticipant] = useState<any | null>(null);

  const load = useCallback(async () => {
    if (!eid) { setLoading(false); return; }
    setLoading(true);
    const [stagesRes, reqsRes, evalsRes, interestsRes, lifecycleRes, devplanRes, participantRes] = await Promise.all([
      supabase.from("rbt_career_stages" as any).select("*").eq("active", true).order("order_index"),
      supabase.from("rbt_career_stage_requirements" as any).select("*").eq("active", true).order("order_index"),
      supabase.from("rbt_career_stage_evaluations" as any).select("*").eq("employee_id", eid),
      supabase.from("rbt_career_interests" as any).select("*").eq("employee_id", eid).maybeSingle(),
      supabase.from("rbt_lifecycle_state" as any).select("stage").eq("employee_id", eid).maybeSingle(),
      supabase.from("rbt_development_plans" as any).select("*").eq("employee_id", eid).eq("status", "active").maybeSingle(),
      supabase.from("rbt_fellowship_participants" as any).select("*, rbt_fellowship_stages(name,category)").eq("employee_id", eid).maybeSingle(),
    ]);
    setStages(((stagesRes.data as any[]) ?? []) as CareerStage[]);
    setRequirements(((reqsRes.data as any[]) ?? []) as Requirement[]);
    setEvaluations(((evalsRes.data as any[]) ?? []) as Evaluation[]);
    setInterests((interestsRes.data as any) ?? {
      employee_id: eid, primary_interest: null, secondary_interests: [],
      mentor_requested: false, mentor_request_notes: null,
      open_to_internal_opportunities: false, notes: null,
    });
    // Map lifecycle stage → career stage (best-effort by key match; fall back to new_rbt).
    const life = (lifecycleRes.data as any)?.stage as string | undefined;
    const map: Record<string, string> = {
      preboarding: "new_rbt", orientation_scheduled: "new_rbt",
      first_case: "new_rbt", first_90_days: "new_rbt", new_rbt: "new_rbt",
      active_rbt: "established_rbt", established_rbt: "established_rbt",
      advanced_rbt_candidate: "advanced_rbt", advanced_rbt: "advanced_rbt",
      lead_rbt: "lead_rbt", trainer_rbt: "trainer_floater_lead_rbt",
      fellowship_candidate: "fellowship_candidate",
      fellowship_participant: "fellowship_participant",
      bcba_transition: "bcba_transition",
    };
    setCurrentStageKey(life ? (map[life] ?? "new_rbt") : "new_rbt");
    setDevPlan(devplanRes.data ?? null);
    setFellowshipParticipant(participantRes.data ?? null);
    setLoading(false);
  }, [eid]);

  useEffect(() => { void load(); }, [load]);

  const saveInterests = async (patch: Partial<CareerInterests>) => {
    if (!writableEmployeeId) return { error: { message: "Preview mode — read-only" } as any };
    const next = { ...(interests ?? { employee_id: writableEmployeeId } as any), ...patch, employee_id: writableEmployeeId, updated_by: authUserId };
    const { error } = await supabase.from("rbt_career_interests" as any).upsert(next as any);
    if (!error) {
      setInterests(next as CareerInterests);
      await supabase.from("rbt_growth_audit" as any).insert({
        employee_id: writableEmployeeId, actor_id: authUserId, event_type: "career_interests.updated",
        entity_table: "rbt_career_interests", payload: patch,
      } as any);
    }
    return { error };
  };

  return {
    loading, stages, currentStageKey, requirements, evaluations,
    interests, devPlan, fellowshipParticipant, saveInterests, reload: load,
    employeeId: eid, writableEmployeeId,
  };
}

export function nextStage(stages: CareerStage[], currentKey: string | null): CareerStage | null {
  if (!currentKey) return stages[0] ?? null;
  const idx = stages.findIndex(s => s.key === currentKey);
  if (idx === -1) return null;
  return stages[idx + 1] ?? null;
}