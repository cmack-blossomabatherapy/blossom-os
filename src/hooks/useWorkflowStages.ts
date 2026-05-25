import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type StageMap = Record<string, string>;

/**
 * Persists recruiting drag-and-drop stage assignments to the backend.
 * Each row in `recruiting_workflow_stages` represents one card's current
 * column on a given board (e.g. "follow-ups", "escalations").
 */
export function useWorkflowStages(board: string, defaults: StageMap) {
  const [stageMap, setStageMap] = useState<StageMap>(defaults);
  const [loaded, setLoaded] = useState(false);

  // Initial load + realtime sync
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from("recruiting_workflow_stages")
        .select("item_id, stage")
        .eq("board", board);

      if (!cancelled && !error && data) {
        const overrides: StageMap = {};
        data.forEach((r) => { overrides[r.item_id] = r.stage; });
        setStageMap((prev) => ({ ...prev, ...overrides }));
      }
      if (!cancelled) setLoaded(true);
    })();

    const channel = supabase
      .channel(`workflow-stages-${board}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "recruiting_workflow_stages", filter: `board=eq.${board}` },
        (payload) => {
          const row: any = payload.new ?? payload.old;
          if (!row?.item_id) return;
          setStageMap((prev) => {
            const next = { ...prev };
            if (payload.eventType === "DELETE") delete next[row.item_id];
            else next[row.item_id] = row.stage;
            return next;
          });
        }
      )
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [board]);

  const moveStage = useCallback(
    async (itemId: string, stage: string, candidateId?: string) => {
      // Optimistic update
      setStageMap((prev) => ({ ...prev, [itemId]: stage }));
      const { data: authData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("recruiting_workflow_stages")
        .upsert(
          {
            board,
            item_id: itemId,
            stage,
            candidate_id: candidateId ?? null,
            updated_by: authData.user?.id ?? null,
          },
          { onConflict: "board,item_id" }
        );
      if (error) console.error("Failed to persist workflow stage", error);
    },
    [board]
  );

  return { stageMap, moveStage, loaded };
}