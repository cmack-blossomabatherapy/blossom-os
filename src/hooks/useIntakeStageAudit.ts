/**
 * Blossom OS — Intake stage transition persistence + history.
 *
 * Every canonical Intake stage move (forward, revert, or Director
 * exception) is written server-side through `intake_record_stage_transition`,
 * which enforces Director-only exceptions and stores the reason.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface IntakeStageTransition {
  id: string;
  lead_id: string;
  from_stage: string | null;
  to_stage: string;
  direction: "forward" | "backward";
  reason: string | null;
  is_exception: boolean;
  missing_requirements: string[];
  actor_id: string | null;
  actor_is_director: boolean;
  created_at: string;
}

export interface RecordIntakeStageTransitionInput {
  leadId: string;
  toStage: string;
  direction: "forward" | "backward";
  reason?: string | null;
  isException?: boolean;
  missing?: string[];
}

export async function recordIntakeStageTransition(
  input: RecordIntakeStageTransitionInput,
): Promise<string | null> {
  const { data, error } = await (supabase as any).rpc("intake_record_stage_transition", {
    p_lead_id: input.leadId,
    p_to_stage: input.toStage,
    p_direction: input.direction,
    p_reason: input.reason ?? null,
    p_is_exception: !!input.isException,
    p_missing: input.missing ?? [],
  });
  if (error) throw error;
  return (data as string) ?? null;
}

/** Plain-English message for the server-side guard errors. */
export function intakeTransitionErrorMessage(error: unknown): string {
  const msg = String((error as { message?: string })?.message ?? error ?? "");
  if (msg.includes("director_approval_required")) return "Only the Director of Intake can approve this exception.";
  if (msg.includes("exception_reason_required")) return "Add a reason before approving this exception.";
  if (msg.includes("not_authorized_for_intake")) return "You do not have access to change Intake stages.";
  if (msg.includes("lead_not_found")) return "That lead could not be found.";
  return "The stage change could not be saved. Try again.";
}

export function useIntakeStageHistory(leadId: string | null | undefined) {
  return useQuery({
    queryKey: ["intake-stage-history", leadId],
    enabled: !!leadId,
    queryFn: async (): Promise<IntakeStageTransition[]> => {
      const { data, error } = await (supabase as any)
        .from("intake_stage_transitions")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as IntakeStageTransition[];
    },
  });
}

export function useRecordIntakeStageTransition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: recordIntakeStageTransition,
    onSuccess: (_id, vars) => {
      qc.invalidateQueries({ queryKey: ["intake-stage-history", vars.leadId] });
    },
  });
}
