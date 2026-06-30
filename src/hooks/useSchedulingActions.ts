import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

/**
 * Persistent Scheduling workflow layer.
 *
 * Powers Add Adjustment / Log Cancellation / Add Coverage Note / Quick Pairing /
 * Assign / Contact / Find Coverage / Notify / Escalate buttons across the
 * Scheduling Team product surface.
 *
 * CentralReach is the EMR. Writes that eventually need to land there flag
 * `centralreach_sync_status = 'queued'` / `'not_ready'`; a future sync worker
 * is responsible for flipping them to `'synced'` / `'failed'`. Nothing here
 * pretends a live sync happened.
 */
export function useSchedulingActions() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  // ---- generic scheduling_actions -----------------------------------------
  const logAction = useCallback(
    async (params: {
      clientId?: string | null;
      actionType: string;
      title?: string;
      note?: string;
      state?: string | null;
      ownerRole?: string | null;
      assignedToUserId?: string | null;
      status?: "open" | "in_progress" | "waiting" | "completed" | "cancelled";
      priority?: "low" | "normal" | "high" | "urgent";
      dueAt?: string | null;
      metadata?: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase
        .from("scheduling_actions")
        .insert([{
          client_id: params.clientId ?? null,
          action_type: params.actionType,
          title: params.title ?? null,
          note: params.note ?? null,
          state: params.state ?? null,
          owner_role: params.ownerRole ?? null,
          owner_user_id: userId,
          assigned_to_user_id: params.assignedToUserId ?? null,
          status: params.status ?? "open",
          priority: params.priority ?? "normal",
          due_at: params.dueAt ?? null,
          metadata: (params.metadata ?? {}) as never,
          created_by: userId,
        }] as never)
        .select()
        .single();
      if (error) {
        toast.error(`Could not save action: ${error.message}`);
        throw error;
      }
      return data;
    },
    [userId],
  );

  // ---- coverage cases ------------------------------------------------------
  const createCoverageCase = useCallback(
    async (params: {
      clientId?: string | null;
      state?: string | null;
      caseType: string;
      riskLevel?: "low" | "medium" | "high" | "critical";
      rbtName?: string | null;
      bcbaName?: string | null;
      approvedHours?: number | null;
      scheduledHours?: number | null;
      deliveredHours?: number | null;
      gapHours?: number | null;
      reason?: string | null;
      nextAction?: string | null;
      metadata?: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase
        .from("scheduling_coverage_cases")
        .insert([{
          client_id: params.clientId ?? null,
          state: params.state ?? null,
          case_type: params.caseType,
          risk_level: params.riskLevel ?? "medium",
          status: "open",
          rbt_name: params.rbtName ?? null,
          bcba_name: params.bcbaName ?? null,
          approved_hours: params.approvedHours ?? null,
          scheduled_hours: params.scheduledHours ?? null,
          delivered_hours: params.deliveredHours ?? null,
          gap_hours: params.gapHours ?? null,
          reason: params.reason ?? null,
          next_action: params.nextAction ?? null,
          owner_user_id: userId,
          metadata: (params.metadata ?? {}) as never,
          created_by: userId,
        }] as never)
        .select()
        .single();
      if (error) {
        toast.error(`Could not open coverage case: ${error.message}`);
        throw error;
      }
      return data;
    },
    [userId],
  );

  const updateCoverageCase = useCallback(
    async (id: string, patch: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from("scheduling_coverage_cases")
        .update(patch as never)
        .eq("id", id)
        .select()
        .single();
      if (error) {
        toast.error(`Could not update coverage case: ${error.message}`);
        throw error;
      }
      return data;
    },
    [],
  );

  // ---- cancellations + make-ups -------------------------------------------
  const logCancellation = useCallback(
    async (params: {
      clientId?: string | null;
      sessionDate?: string | null;
      startTime?: string | null;
      endTime?: string | null;
      durationHours?: number | null;
      state?: string | null;
      location?: string | null;
      rbtName?: string | null;
      bcbaName?: string | null;
      cancelledBy: "family" | "rbt" | "bcba" | "clinic" | "weather" | "system" | "unknown";
      reason?: string | null;
      makeUpRequired?: boolean;
      metadata?: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase
        .from("scheduling_cancellations")
        .insert([{
          client_id: params.clientId ?? null,
          session_date: params.sessionDate ?? null,
          start_time: params.startTime ?? null,
          end_time: params.endTime ?? null,
          duration_hours: params.durationHours ?? null,
          state: params.state ?? null,
          location: params.location ?? null,
          rbt_name: params.rbtName ?? null,
          bcba_name: params.bcbaName ?? null,
          cancelled_by: params.cancelledBy,
          reason: params.reason ?? null,
          make_up_required: !!params.makeUpRequired,
          make_up_status: params.makeUpRequired ? "needed" : "not_required",
          centralreach_sync_status: "queued",
          created_by: userId,
          metadata: (params.metadata ?? {}) as never,
        }] as never)
        .select()
        .single();
      if (error) {
        toast.error(`Could not log cancellation: ${error.message}`);
        throw error;
      }
      return data;
    },
    [userId],
  );

  const updateMakeUp = useCallback(
    async (
      id: string,
      patch: {
        make_up_status?: "not_required" | "needed" | "offered" | "scheduled" | "completed" | "declined";
        make_up_date?: string | null;
        family_notified?: boolean;
        bcba_notified?: boolean;
        state_director_notified?: boolean;
      },
    ) => {
      const next: Record<string, unknown> = { ...patch };
      if (patch.make_up_date) next.centralreach_sync_status = "queued";
      const { data, error } = await supabase
        .from("scheduling_cancellations")
        .update(next as never)
        .eq("id", id)
        .select()
        .single();
      if (error) {
        toast.error(`Could not update make-up: ${error.message}`);
        throw error;
      }
      return data;
    },
    [],
  );

  // ---- schedule adjustments ------------------------------------------------
  const createAdjustment = useCallback(
    async (params: {
      clientId?: string | null;
      adjustmentType:
        | "add_session"
        | "remove_session"
        | "move_session"
        | "change_rbt"
        | "change_location"
        | "change_time";
      dayOfWeek?: string | null;
      sessionDate?: string | null;
      oldStartTime?: string | null;
      oldEndTime?: string | null;
      newStartTime?: string | null;
      newEndTime?: string | null;
      oldRbtName?: string | null;
      newRbtName?: string | null;
      oldLocation?: string | null;
      newLocation?: string | null;
      reason?: string | null;
      approvalStatus?: "draft" | "ready" | "approved" | "rejected" | "synced";
      metadata?: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase
        .from("scheduling_session_adjustments")
        .insert([{
          client_id: params.clientId ?? null,
          adjustment_type: params.adjustmentType,
          day_of_week: params.dayOfWeek ?? null,
          session_date: params.sessionDate ?? null,
          old_start_time: params.oldStartTime ?? null,
          old_end_time: params.oldEndTime ?? null,
          new_start_time: params.newStartTime ?? null,
          new_end_time: params.newEndTime ?? null,
          old_rbt_name: params.oldRbtName ?? null,
          new_rbt_name: params.newRbtName ?? null,
          old_location: params.oldLocation ?? null,
          new_location: params.newLocation ?? null,
          reason: params.reason ?? null,
          approval_status: params.approvalStatus ?? "draft",
          centralreach_sync_status: "not_ready",
          metadata: (params.metadata ?? {}) as never,
          created_by: userId,
        }] as never)
        .select()
        .single();
      if (error) {
        toast.error(`Could not save adjustment: ${error.message}`);
        throw error;
      }
      return data;
    },
    [userId],
  );

  // ---- CentralReach sync helpers ------------------------------------------
  const queueSchedulingChangeForCentralReach = useCallback(
    async (table: "scheduling_session_adjustments" | "scheduling_cancellations", id: string) => {
      const { error } = await supabase
        .from(table)
        .update({ centralreach_sync_status: "queued" })
        .eq("id", id);
      if (error) toast.error(`Could not queue CentralReach sync: ${error.message}`);
    },
    [],
  );

  const markSchedulingChangeSynced = useCallback(
    async (
      table: "scheduling_session_adjustments" | "scheduling_cancellations",
      id: string,
      referenceId?: string,
    ) => {
      const { error } = await supabase
        .from(table)
        .update({
          centralreach_sync_status: "synced",
          centralreach_reference_id: referenceId ?? null,
        })
        .eq("id", id);
      if (error) toast.error(`Could not mark synced: ${error.message}`);
    },
    [],
  );

  const markSchedulingChangeFailed = useCallback(
    async (table: "scheduling_session_adjustments" | "scheduling_cancellations", id: string) => {
      const { error } = await supabase
        .from(table)
        .update({ centralreach_sync_status: "failed" })
        .eq("id", id);
      if (error) toast.error(`Could not mark failed: ${error.message}`);
    },
    [],
  );

  // ---- contact attempts ----------------------------------------------------
  const logContactAttempt = useCallback(
    async (params: {
      clientId?: string | null;
      contactType: "family" | "rbt" | "bcba" | "state_director" | "assistant_state_director" | "internal";
      channel: "phone" | "sms" | "email" | "teams" | "internal_note";
      direction?: "outbound" | "inbound";
      subject?: string | null;
      body?: string | null;
      outcome?:
        | "left_message"
        | "connected"
        | "no_answer"
        | "confirmed"
        | "declined"
        | "needs_follow_up"
        | null;
      followUpAt?: string | null;
      state?: string | null;
      metadata?: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase
        .from("scheduling_contact_attempts")
        .insert([{
          client_id: params.clientId ?? null,
          contact_type: params.contactType,
          channel: params.channel,
          direction: params.direction ?? "outbound",
          subject: params.subject ?? null,
          body: params.body ?? null,
          outcome: params.outcome ?? null,
          follow_up_at: params.followUpAt ?? null,
          state: params.state ?? null,
          created_by: userId,
          metadata: (params.metadata ?? {}) as never,
        }] as never)
        .select()
        .single();
      if (error) {
        toast.error(`Could not log contact attempt: ${error.message}`);
        throw error;
      }
      return data;
    },
    [userId],
  );

  // ---- read helpers --------------------------------------------------------
  const listClientSchedulingActions = useCallback(async (clientId: string) => {
    const { data, error } = await supabase
      .from("scheduling_actions")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) { toast.error(error.message); return []; }
    return data ?? [];
  }, []);

  const listClientContactAttempts = useCallback(async (clientId: string) => {
    const { data, error } = await supabase
      .from("scheduling_contact_attempts")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) { toast.error(error.message); return []; }
    return data ?? [];
  }, []);

  const listOpenCoverageCases = useCallback(
    async (filters?: { state?: string | null; status?: string | null }) => {
      let q = supabase.from("scheduling_coverage_cases").select("*").order("created_at", { ascending: false });
      if (filters?.state) q = q.eq("state", filters.state);
      if (filters?.status) q = q.eq("status", filters.status);
      else q = q.neq("status", "resolved");
      const { data, error } = await q;
      if (error) { toast.error(error.message); return []; }
      return data ?? [];
    },
    [],
  );

  const listMakeUpCancellations = useCallback(
    async (filters?: { status?: string | null }) => {
      let q = supabase
        .from("scheduling_cancellations")
        .select("*")
        .eq("make_up_required", true)
        .order("session_date", { ascending: false, nullsFirst: false })
        .limit(200);
      if (filters?.status) q = q.eq("make_up_status", filters.status);
      const { data, error } = await q;
      if (error) { toast.error(error.message); return []; }
      return data ?? [];
    },
    [],
  );

  return {
    logAction,
    createCoverageCase,
    updateCoverageCase,
    logCancellation,
    updateMakeUp,
    createAdjustment,
    queueSchedulingChangeForCentralReach,
    markSchedulingChangeSynced,
    markSchedulingChangeFailed,
    logContactAttempt,
    listClientSchedulingActions,
    listClientContactAttempts,
    listOpenCoverageCases,
    listMakeUpCancellations,
  };
}