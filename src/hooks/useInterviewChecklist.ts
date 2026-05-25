import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type ChecksByCandidate = Record<string, Record<string, boolean>>;

/**
 * Persists per-candidate interview outcome checklist progress.
 * Each ticked step is one row in `interview_outcome_checks`.
 */
export function useInterviewChecklist(stepKeys: string[]) {
  const [checks, setChecks] = useState<ChecksByCandidate>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("interview_outcome_checks")
        .select("candidate_id, step_key, completed");
      if (cancelled || error || !data) return;
      const next: ChecksByCandidate = {};
      data.forEach((r) => {
        if (!r.completed) return;
        (next[r.candidate_id] ??= {})[r.step_key] = true;
      });
      setChecks(next);
    })();

    const channel = supabase
      .channel("interview-outcome-checks")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "interview_outcome_checks" },
        (payload) => {
          const row: any = payload.new ?? payload.old;
          if (!row?.candidate_id || !row?.step_key) return;
          setChecks((prev) => {
            const candidate = { ...(prev[row.candidate_id] ?? {}) };
            if (payload.eventType === "DELETE" || row.completed === false) {
              delete candidate[row.step_key];
            } else {
              candidate[row.step_key] = true;
            }
            return { ...prev, [row.candidate_id]: candidate };
          });
        }
      )
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, []);

  const getArray = useCallback(
    (candidateId: string): boolean[] => {
      const map = checks[candidateId] ?? {};
      return stepKeys.map((k) => !!map[k]);
    },
    [checks, stepKeys]
  );

  const toggleStep = useCallback(
    async (candidateId: string, stepIndex: number) => {
      const stepKey = stepKeys[stepIndex];
      if (!stepKey) return;
      const currentlyChecked = !!checks[candidateId]?.[stepKey];
      const nextChecked = !currentlyChecked;

      // Optimistic
      setChecks((prev) => {
        const candidate = { ...(prev[candidateId] ?? {}) };
        if (nextChecked) candidate[stepKey] = true;
        else delete candidate[stepKey];
        return { ...prev, [candidateId]: candidate };
      });

      const { data: authData } = await supabase.auth.getUser();
      if (nextChecked) {
        const { error } = await supabase
          .from("interview_outcome_checks")
          .upsert(
            {
              candidate_id: candidateId,
              step_key: stepKey,
              completed: true,
              completed_by: authData.user?.id ?? null,
              completed_at: new Date().toISOString(),
            },
            { onConflict: "candidate_id,step_key" }
          );
        if (error) console.error("Failed to save checklist step", error);
      } else {
        const { error } = await supabase
          .from("interview_outcome_checks")
          .delete()
          .eq("candidate_id", candidateId)
          .eq("step_key", stepKey);
        if (error) console.error("Failed to clear checklist step", error);
      }
    },
    [checks, stepKeys]
  );

  return { getArray, toggleStep };
}