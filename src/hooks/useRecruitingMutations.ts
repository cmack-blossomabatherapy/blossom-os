import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { PipelineStage } from "@/hooks/useRecruitingCandidates";

/**
 * Centralized mutation helpers for recruiting workflow tables.
 *
 * These intentionally live outside the per-table hooks so pages that are
 * read-mostly (Offers, Background, Orientation, Onboarding, Followups,
 * Messages, Escalations) can wire actions without each page reaching
 * into a different mutation surface.
 *
 * The database trigger `trg_recruiting_candidate_stage` will lazily create
 * the matching child row when a candidate transitions into a stage that
 * needs one, so `moveStage` does not need to insert children client-side.
 */
export function useRecruitingMutations() {
  const wrap = async <T,>(label: string, p: PromiseLike<T> | Promise<T>): Promise<T | null> => {
    try {
      const res = await p;
      // supabase returns { data, error } envelope; if so, surface error
      const env = res as unknown as { error?: { message?: string } };
      if (env && env.error) {
        console.error(label, env.error);
        toast.error(`${label}: ${env.error.message ?? "failed"}`);
        return null;
      }
      return res;
    } catch (e: any) {
      console.error(label, e);
      toast.error(`${label}: ${e?.message ?? "failed"}`);
      return null;
    }
  };

  // ---- Candidates / stages ----
  const moveStage = useCallback(async (candidateId: string, stage: PipelineStage) => {
    const now = new Date().toISOString();
    const res = await wrap("Move stage", supabase
      .from("recruiting_candidates")
      .update({ pipeline_stage: stage, stage_entered_at: now })
      .eq("id", candidateId));
    if (res) {
      try {
        await supabase.from("recruiting_activity_events").insert({
          candidate_id: candidateId,
          entity_table: "recruiting_candidates",
          entity_id: candidateId,
          event_type: "stage_changed",
          to_value: stage,
        } as any);
      } catch (e) { console.warn("activity log failed", e); }
    }
    return res;
  }, []);

  // ---- Offers ----
  const updateOffer = useCallback(async (id: string, patch: Record<string, unknown>) => {
    return wrap("Update offer", supabase.from("recruiting_offers").update(patch as any).eq("id", id));
  }, []);
  const markOfferAccepted = useCallback((id: string) =>
    updateOffer(id, { status: "Accepted", accepted_at: new Date().toISOString() }), [updateOffer]);
  const markOfferDeclined = useCallback((id: string, notes?: string) =>
    updateOffer(id, { status: "Declined", declined_at: new Date().toISOString(), ...(notes ? { notes } : {}) }), [updateOffer]);

  // ---- Background checks ----
  const updateBackground = useCallback(async (id: string, patch: Record<string, unknown>) => {
    return wrap("Update background", supabase.from("recruiting_background_checks").update(patch as any).eq("id", id));
  }, []);
  const markBackgroundCleared = useCallback((id: string) =>
    updateBackground(id, { status: "Cleared", cleared_at: new Date().toISOString(), blocker: null }), [updateBackground]);
  const flagBackgroundBlocker = useCallback((id: string, blocker: string) =>
    updateBackground(id, { status: "Blocked", blocker }), [updateBackground]);

  // ---- Orientation ----
  const updateOrientation = useCallback(async (id: string, patch: Record<string, unknown>) => {
    return wrap("Update orientation", supabase.from("recruiting_orientation_slots").update(patch as any).eq("id", id));
  }, []);
  const scheduleOrientation = useCallback((id: string, date: string, time?: string, format?: string) =>
    updateOrientation(id, { scheduled_date: date, scheduled_time: time ?? null, format: format ?? null, status: "Scheduled" }),
    [updateOrientation]);
  const markOrientationCompleted = useCallback((id: string) =>
    updateOrientation(id, { status: "Completed" }), [updateOrientation]);

  // ---- Onboarding ----
  const setOnboardingTask = useCallback(async (id: string, completed: boolean) => {
    return wrap("Update onboarding task", supabase.from("recruiting_onboarding_tasks")
      .update({ completed, completed_at: completed ? new Date().toISOString() : null })
      .eq("id", id));
  }, []);

  // ---- Follow-ups ----
  const resolveFollowup = useCallback(async (id: string, notes?: string) => {
    return wrap("Resolve follow-up", supabase.from("recruiting_followups")
      .update({ status: "Done", completed_at: new Date().toISOString(), ...(notes ? { notes } : {}) })
      .eq("id", id));
  }, []);
  const snoozeFollowup = useCallback(async (id: string, dueDate: string) => {
    return wrap("Snooze follow-up", supabase.from("recruiting_followups")
      .update({ due_date: dueDate, status: "Open" }).eq("id", id));
  }, []);

  // ---- Escalations ----
  const resolveEscalation = useCallback(async (id: string, notes?: string) => {
    return wrap("Resolve escalation", supabase.from("recruiting_escalations")
      .update({ status: "Resolved", resolved_at: new Date().toISOString(), ...(notes ? { notes } : {}) })
      .eq("id", id));
  }, []);

  // ---- Messages ----
  const logMessage = useCallback(async (msg: {
    candidate_id: string;
    body: string;
    channel?: string;
    direction?: string;
    subject?: string | null;
    sender?: string | null;
  }) => {
    return wrap("Log message", supabase.from("recruiting_messages").insert({
      direction: msg.direction ?? "outbound",
      channel: msg.channel ?? "email",
      sent_at: new Date().toISOString(),
      status: "Sent",
      ...msg,
    } as any));
  }, []);

  return {
    moveStage,
    updateOffer, markOfferAccepted, markOfferDeclined,
    updateBackground, markBackgroundCleared, flagBackgroundBlocker,
    updateOrientation, scheduleOrientation, markOrientationCompleted,
    setOnboardingTask,
    resolveFollowup, snoozeFollowup,
    resolveEscalation,
    logMessage,
  };
}

// ---------- Activity feed ----------
export interface RecruitingActivityEvent {
  id: string;
  candidate_id: string | null;
  entity_table: string;
  entity_id: string | null;
  event_type: string;
  from_value: string | null;
  to_value: string | null;
  payload: unknown;
  actor_user_id: string | null;
  actor_label: string | null;
  created_at: string;
}

export function useRecruitingActivity(candidateId?: string, limit = 100) {
  const [items, setItems] = useState<RecruitingActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    let q = supabase
      .from("recruiting_activity_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (candidateId) q = q.eq("candidate_id", candidateId);
    const { data, error } = await q;
    if (error) { console.error(error); setLoading(false); return; }
    setItems((data ?? []) as RecruitingActivityEvent[]);
    setLoading(false);
  }, [candidateId, limit]);

  useEffect(() => {
    refetch();
    const ch = supabase
      .channel("recruiting-activity-" + (candidateId ?? "all"))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "recruiting_activity_events" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refetch, candidateId]);

  return { items, loading, refetch };
}