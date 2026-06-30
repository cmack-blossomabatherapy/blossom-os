import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  qaWorkflowStore,
  type QAWorkItemRef,
} from "@/lib/os/qa/qaWorkflowStore";

interface OverrideRow {
  id: string;
  source_system: string;
  source_record_id: string;
  monday_item_id: string | null;
  client_id: string | null;
  assigned_qa_owner: string | null;
  qa_status: string | null;
  priority: string | null;
  next_action: string | null;
  blockers: string[] | null;
  alerts: string[] | null;
  notes: string | null;
  escalated: boolean;
  escalation_reason: string | null;
  last_action_at: string | null;
  updated_at: string;
}

/**
 * Live QA workflow overlay state + action helpers.
 *
 * Reads the `qa_work_item_overrides` table (Blossom OS workflow state for
 * imported source records) and exposes typed action helpers that route to
 * either `client_qa_reviews` or the overrides table depending on whether a
 * real client uuid is known.
 */
export function useQAWorkflow() {
  const { toast } = useToast();
  const [overrides, setOverrides] = useState<OverrideRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: e } = await supabase
      .from("qa_work_item_overrides")
      .select("*")
      .order("updated_at", { ascending: false });
    if (e) setError(e.message);
    else setOverrides((data ?? []) as OverrideRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const overrideBySource = useMemo(() => {
    const map = new Map<string, OverrideRow>();
    for (const row of overrides) map.set(row.source_record_id, row);
    return map;
  }, [overrides]);

  function withRefresh<Args extends unknown[], R>(
    fn: (...args: Args) => Promise<R>,
    okMessage: string,
    errMessage: string,
  ) {
    return async (...args: Args): Promise<R | null> => {
      try {
        const result = await fn(...args);
        await refresh();
        toast({ title: okMessage });
        return result;
      } catch (err) {
        toast({
          title: errMessage,
          description: err instanceof Error ? err.message : String(err),
          variant: "destructive",
        });
        return null;
      }
    };
  }

  return {
    loading,
    error,
    overrides,
    overrideBySource,
    refresh,
    startReview: withRefresh(
      (ref: QAWorkItemRef, owner?: string | null) =>
        qaWorkflowStore.startReview(ref, owner),
      "QA review started",
      "Failed to start QA review",
    ),
    markIssuesFound: withRefresh(
      (ref: QAWorkItemRef, blockers?: string[], notes?: string) =>
        qaWorkflowStore.markIssuesFound(ref, blockers ?? [], notes),
      "Issues recorded",
      "Failed to record issues",
    ),
    markReadyForSubmission: withRefresh(
      (ref: QAWorkItemRef) => qaWorkflowStore.markReadyForSubmission(ref),
      "Marked ready for submission",
      "Failed to update QA status",
    ),
    submitToAuth: withRefresh(
      (ref: QAWorkItemRef) => qaWorkflowStore.submitToAuth(ref),
      "Sent to Authorizations",
      "Failed to send to Authorizations",
    ),
    assignOwner: withRefresh(
      (ref: QAWorkItemRef, owner: string | null) =>
        qaWorkflowStore.assignOwner(ref, owner),
      "Owner updated",
      "Failed to assign owner",
    ),
    addNote: withRefresh(
      (ref: QAWorkItemRef, note: string) =>
        qaWorkflowStore.addNote(ref, note),
      "Note saved",
      "Failed to save note",
    ),
    sendFollowUp: withRefresh(
      (ref: QAWorkItemRef, text: string) =>
        qaWorkflowStore.sendFollowUp(ref, text),
      "Follow-up sent",
      "Failed to send follow-up",
    ),
    escalate: withRefresh(
      (ref: QAWorkItemRef, reason: string) =>
        qaWorkflowStore.escalate(ref, reason),
      "Escalation recorded",
      "Failed to escalate",
    ),
    resolveMissingInfo: withRefresh(
      (ref: QAWorkItemRef) => qaWorkflowStore.resolveMissingInfo(ref),
      "Missing info resolved",
      "Failed to resolve missing info",
    ),
    bulkAssign: withRefresh(
      (refs: QAWorkItemRef[], owner: string | null) =>
        qaWorkflowStore.bulk(refs, (r) =>
          qaWorkflowStore.assignOwner(r, owner),
        ),
      "Owners updated",
      "Bulk assign failed",
    ),
    bulkStartReview: withRefresh(
      (refs: QAWorkItemRef[], owner?: string | null) =>
        qaWorkflowStore.bulk(refs, (r) =>
          qaWorkflowStore.startReview(r, owner),
        ),
      "Reviews started",
      "Bulk start failed",
    ),
  };
}

export type UseQAWorkflow = ReturnType<typeof useQAWorkflow>;