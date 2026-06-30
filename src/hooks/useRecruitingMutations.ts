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

  // Centralized activity logger so every helper writes to recruiting_activity_events.
  const logActivity = useCallback(async (
    candidateId: string | null,
    entityTable: string,
    entityId: string | null,
    eventType: string,
    fromValue?: string | null,
    toValue?: string | null,
    payload?: Record<string, unknown>,
  ) => {
    try {
      await supabase.from("recruiting_activity_events").insert({
        candidate_id: candidateId,
        entity_table: entityTable,
        entity_id: entityId,
        event_type: eventType,
        from_value: fromValue ?? null,
        to_value: toValue ?? null,
        payload: (payload ?? null) as any,
      } as any);
    } catch (e) { console.warn("activity log failed", e); }
  }, []);

  // ---- Candidates / stages ----
  const moveStage = useCallback(async (candidateId: string, stage: PipelineStage) => {
    const now = new Date().toISOString();
    const res = await wrap("Move stage", supabase
      .from("recruiting_candidates")
      .update({ pipeline_stage: stage, stage_entered_at: now })
      .eq("id", candidateId));
    if (res) await logActivity(candidateId, "recruiting_candidates", candidateId, "stage_changed", null, stage);
    return res;
  }, [logActivity]);

  const updateCandidateAndLog = useCallback(async (
    candidateId: string,
    patch: Record<string, unknown>,
    eventType: string,
    payload?: Record<string, unknown>,
  ) => {
    const res = await wrap("Update candidate", supabase
      .from("recruiting_candidates").update(patch as any).eq("id", candidateId));
    if (res) await logActivity(candidateId, "recruiting_candidates", candidateId, eventType, null, null, payload);
    return res;
  }, [logActivity]);

  const archiveCandidate = useCallback(async (candidateId: string, reason?: string) => {
    return updateCandidateAndLog(candidateId, { is_archived: true }, "archived", reason ? { reason } : undefined);
  }, [updateCandidateAndLog]);

  // ---- Interviews ----
  const upsertInterviewForCandidate = useCallback(async (candidateId: string, data: Record<string, unknown>) => {
    const res = await wrap("Upsert interview", supabase.from("recruiting_interviews")
      .upsert({ candidate_id: candidateId, ...data } as any));
    if (res) await logActivity(candidateId, "recruiting_interviews", null, "interview_upserted", null, null, data);
    return res;
  }, [logActivity]);
  const completeInterview = useCallback(async (candidateId: string, outcome: string, notes?: string) => {
    const res = await wrap("Complete interview", supabase.from("recruiting_interviews")
      .update({ status: "Completed", outcome, completed_at: new Date().toISOString(), ...(notes ? { notes } : {}) } as any)
      .eq("candidate_id", candidateId));
    if (res) await logActivity(candidateId, "recruiting_interviews", null, "interview_completed", null, outcome);
    return res;
  }, [logActivity]);
  const markInterviewNoShow = useCallback(async (candidateId: string, notes?: string) => {
    const res = await wrap("Mark no-show", supabase.from("recruiting_interviews")
      .update({ status: "No Show", outcome: "No Show", ...(notes ? { notes } : {}) } as any)
      .eq("candidate_id", candidateId));
    if (res) await logActivity(candidateId, "recruiting_interviews", null, "interview_no_show");
    return res;
  }, [logActivity]);

  // ---- Offers ----
  const updateOffer = useCallback(async (id: string, patch: Record<string, unknown>) => {
    return wrap("Update offer", supabase.from("recruiting_offers").update(patch as any).eq("id", id));
  }, []);
  const markOfferAccepted = useCallback((id: string) =>
    updateOffer(id, { status: "Accepted", accepted_at: new Date().toISOString() }), [updateOffer]);
  const markOfferDeclined = useCallback((id: string, notes?: string) =>
    updateOffer(id, { status: "Declined", declined_at: new Date().toISOString(), ...(notes ? { notes } : {}) }), [updateOffer]);
  const upsertOfferForCandidate = useCallback(async (candidateId: string, data: Record<string, unknown>) => {
    const res = await wrap("Upsert offer", supabase.from("recruiting_offers")
      .upsert({ candidate_id: candidateId, status: "Draft", ...data } as any));
    if (res) await logActivity(candidateId, "recruiting_offers", null, "offer_upserted", null, null, data);
    return res;
  }, [logActivity]);
  const sendOfferInternal = useCallback(async (candidateId: string, data: Record<string, unknown>) => {
    // No external send: persist as "Sent" with manual flag and log activity.
    const res = await wrap("Mark offer sent", supabase.from("recruiting_offers")
      .update({ status: "Sent", sent_at: new Date().toISOString(), ...data } as any)
      .eq("candidate_id", candidateId));
    if (res) await logActivity(candidateId, "recruiting_offers", null, "offer_marked_sent_manually", null, null, data);
    return res;
  }, [logActivity]);

  // ---- Background checks ----
  const updateBackground = useCallback(async (id: string, patch: Record<string, unknown>) => {
    return wrap("Update background", supabase.from("recruiting_background_checks").update(patch as any).eq("id", id));
  }, []);
  const markBackgroundCleared = useCallback((id: string) =>
    updateBackground(id, { status: "Cleared", cleared_at: new Date().toISOString(), blocker: null }), [updateBackground]);
  const flagBackgroundBlocker = useCallback((id: string, blocker: string) =>
    updateBackground(id, { status: "Blocked", blocker }), [updateBackground]);
  const upsertBackgroundForCandidate = useCallback(async (candidateId: string, data: Record<string, unknown>) => {
    const res = await wrap("Upsert background", supabase.from("recruiting_background_checks")
      .upsert({ candidate_id: candidateId, status: "Pending", ...data } as any));
    if (res) await logActivity(candidateId, "recruiting_background_checks", null, "background_upserted", null, null, data);
    return res;
  }, [logActivity]);
  const startBackgroundCheck = useCallback(async (candidateId: string, vendor?: string, notes?: string) => {
    const res = await wrap("Start background", supabase.from("recruiting_background_checks")
      .upsert({ candidate_id: candidateId, status: "Pending", initiated_at: new Date().toISOString(), vendor: vendor ?? null, notes: notes ?? null } as any));
    if (res) await logActivity(candidateId, "recruiting_background_checks", null, "background_started", null, vendor ?? "manual");
    return res;
  }, [logActivity]);

  // ---- Orientation ----
  const updateOrientation = useCallback(async (id: string, patch: Record<string, unknown>) => {
    return wrap("Update orientation", supabase.from("recruiting_orientation_slots").update(patch as any).eq("id", id));
  }, []);
  const scheduleOrientation = useCallback((id: string, date: string, time?: string, format?: string) =>
    updateOrientation(id, { scheduled_date: date, scheduled_time: time ?? null, format: format ?? null, status: "Scheduled" }),
    [updateOrientation]);
  const markOrientationCompleted = useCallback((id: string) =>
    updateOrientation(id, { status: "Completed" }), [updateOrientation]);
  const upsertOrientationForCandidate = useCallback(async (candidateId: string, data: Record<string, unknown>) => {
    const res = await wrap("Upsert orientation", supabase.from("recruiting_orientation_slots")
      .upsert({ candidate_id: candidateId, status: "Pending", ...data } as any));
    if (res) await logActivity(candidateId, "recruiting_orientation_slots", null, "orientation_upserted", null, null, data);
    return res;
  }, [logActivity]);
  const markOrientationMissed = useCallback(async (candidateId: string, notes?: string) => {
    const res = await wrap("Mark orientation missed", supabase.from("recruiting_orientation_slots")
      .update({ status: "No Show", ...(notes ? { notes } : {}) } as any)
      .eq("candidate_id", candidateId));
    if (res) await logActivity(candidateId, "recruiting_orientation_slots", null, "orientation_missed");
    return res;
  }, [logActivity]);

  // ---- Onboarding ----
  const setOnboardingTask = useCallback(async (id: string, completed: boolean) => {
    return wrap("Update onboarding task", supabase.from("recruiting_onboarding_tasks")
      .update({ completed, completed_at: completed ? new Date().toISOString() : null })
      .eq("id", id));
  }, []);
  const createOnboardingTask = useCallback(async (
    candidateId: string, label: string, owner?: string, dueDate?: string,
  ) => {
    const res = await wrap("Create onboarding task", supabase.from("recruiting_onboarding_tasks")
      .insert({ candidate_id: candidateId, title: label, task_key: label.toLowerCase().replace(/\s+/g, "_"),
        completed: false, owner: owner ?? null, due_date: dueDate ?? null } as any));
    if (res) await logActivity(candidateId, "recruiting_onboarding_tasks", null, "onboarding_task_created", null, label);
    return res;
  }, [logActivity]);
  const ensureDefaultOnboardingTasks = useCallback(async (candidateId: string) => {
    const defaults = [
      "Sign offer letter",
      "Background check submitted",
      "I-9 verified",
      "Direct deposit",
      "Compliance training assigned",
      "Orientation scheduled",
    ];
    const { data: existing } = await supabase.from("recruiting_onboarding_tasks")
      .select("title").eq("candidate_id", candidateId);
    const have = new Set((existing ?? []).map((r: any) => r.title));
    const rows = defaults.filter((t) => !have.has(t)).map((t, idx) => ({
      candidate_id: candidateId,
      task_key: t.toLowerCase().replace(/\s+/g, "_"),
      title: t,
      completed: false,
      position: idx,
    }));
    if (rows.length === 0) return null;
    const res = await wrap("Seed onboarding tasks", supabase.from("recruiting_onboarding_tasks").insert(rows as any));
    if (res) await logActivity(candidateId, "recruiting_onboarding_tasks", null, "onboarding_tasks_seeded", null, String(rows.length));
    return res;
  }, [logActivity]);

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
  const createFollowup = useCallback(async (candidateId: string, data: Record<string, unknown> & { title: string }) => {
    const res = await wrap("Create follow-up", supabase.from("recruiting_followups")
      .insert({ candidate_id: candidateId, status: "Open", ...data } as any));
    if (res) await logActivity(candidateId, "recruiting_followups", null, "followup_created", null, data.title);
    return res;
  }, [logActivity]);

  // ---- Escalations ----
  const resolveEscalation = useCallback(async (id: string, notes?: string) => {
    return wrap("Resolve escalation", supabase.from("recruiting_escalations")
      .update({ status: "Resolved", resolved_at: new Date().toISOString(), ...(notes ? { notes } : {}) })
      .eq("id", id));
  }, []);
  const createEscalation = useCallback(async (candidateId: string, data: Record<string, unknown> & { title: string }) => {
    const res = await wrap("Create escalation", supabase.from("recruiting_escalations")
      .insert({ candidate_id: candidateId, status: "Open", severity: "Medium", opened_at: new Date().toISOString(), ...data } as any));
    if (res) await logActivity(candidateId, "recruiting_escalations", null, "escalation_created", null, data.title);
    return res;
  }, [logActivity]);

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
  const updateMessage = useCallback(async (messageId: string, patch: Record<string, unknown>) => {
    return wrap("Update message", supabase.from("recruiting_messages").update(patch as any).eq("id", messageId));
  }, []);
  const markMessageRead = useCallback((messageId: string) => updateMessage(messageId, { status: "Read" }), [updateMessage]);
  const markMessageHandled = useCallback((messageId: string) => updateMessage(messageId, { status: "Handled" }), [updateMessage]);

  // ---- Staffing needs (Recruiting-owned) ----
  const createStaffingNeed = useCallback(async (data: Record<string, unknown> & { client_id?: string | null; role: string; state?: string | null }) => {
    const res = await wrap("Create staffing need", supabase.from("recruiting_staffing_needs")
      .insert({ status: "New", opened_at: new Date().toISOString(), ...data } as any));
    if (res) await logActivity(null, "recruiting_staffing_needs", null, "staffing_need_created", null, data.role);
    return res;
  }, [logActivity]);
  const updateStaffingNeed = useCallback(async (id: string, patch: Record<string, unknown>) => {
    return wrap("Update staffing need", supabase.from("recruiting_staffing_needs").update(patch as any).eq("id", id));
  }, []);
  const markStaffingNeedWorking = useCallback((id: string) =>
    updateStaffingNeed(id, { status: "Active" }), [updateStaffingNeed]);
  const closeStaffingNeed = useCallback(async (id: string, reason?: string) => {
    const res = await wrap("Close staffing need", supabase.from("recruiting_staffing_needs")
      .update({ status: "Closed", closed_at: new Date().toISOString(), ...(reason ? { closed_reason: reason } : {}) } as any)
      .eq("id", id));
    if (res) await logActivity(null, "recruiting_staffing_needs", id, "staffing_need_closed", null, reason ?? null);
    return res;
  }, [logActivity]);
  const linkCandidateToStaffingNeed = useCallback(async (needId: string, candidateId: string) => {
    const res = await wrap("Link candidate", supabase.from("recruiting_staffing_needs")
      .update({ matched_candidate_id: candidateId, status: "Match Pending" } as any).eq("id", needId));
    if (res) await logActivity(candidateId, "recruiting_staffing_needs", needId, "candidate_linked", null, candidateId);
    return res;
  }, [logActivity]);

  return {
    moveStage,
    updateCandidateAndLog,
    archiveCandidate,
    logActivity,
    upsertInterviewForCandidate, completeInterview, markInterviewNoShow,
    updateOffer, markOfferAccepted, markOfferDeclined,
    upsertOfferForCandidate, sendOfferInternal,
    updateBackground, markBackgroundCleared, flagBackgroundBlocker,
    upsertBackgroundForCandidate, startBackgroundCheck,
    updateOrientation, scheduleOrientation, markOrientationCompleted,
    upsertOrientationForCandidate, markOrientationMissed,
    setOnboardingTask,
    createOnboardingTask, ensureDefaultOnboardingTasks,
    resolveFollowup, snoozeFollowup,
    createFollowup,
    resolveEscalation,
    createEscalation,
    logMessage,
    updateMessage, markMessageRead, markMessageHandled,
    createStaffingNeed, updateStaffingNeed, markStaffingNeedWorking,
    closeStaffingNeed, linkCandidateToStaffingNeed,
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