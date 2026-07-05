import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type {
  BSCase, BSEscalation, BSPlan, BSPlanTask, BSFollowup, BSActivityLog,
} from "./behavioralSupportTypes";

interface Data {
  cases: BSCase[];
  escalations: BSEscalation[];
  plans: BSPlan[];
  planTasks: BSPlanTask[];
  followups: BSFollowup[];
  activity: BSActivityLog[];
}

const EMPTY: Data = {
  cases: [], escalations: [], plans: [], planTasks: [], followups: [], activity: [],
};

function endOfToday() {
  const d = new Date(); d.setHours(23, 59, 59, 999); return d;
}
function startOfToday() {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d;
}
function startOfWeekAgo() {
  const d = new Date(); d.setDate(d.getDate() - 7); d.setHours(0, 0, 0, 0); return d;
}

export function useBehavioralSupportData() {
  const [data, setData] = useState<Data>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [c, e, p, t, f, a] = await Promise.all([
        supabase.from("behavioral_support_cases").select("*").order("updated_at", { ascending: false }),
        supabase.from("behavioral_support_escalations").select("*").order("updated_at", { ascending: false }),
        supabase.from("behavioral_support_plans").select("*").order("updated_at", { ascending: false }),
        supabase.from("behavioral_support_plan_tasks").select("*").order("updated_at", { ascending: false }),
        supabase.from("behavioral_support_followups").select("*").order("due_at", { ascending: true }),
        supabase.from("behavioral_support_activity_log").select("*").order("created_at", { ascending: false }).limit(100),
      ]);
      const firstErr = [c, e, p, t, f, a].find((r) => r.error)?.error;
      if (firstErr) throw firstErr;
      setData({
        cases: (c.data ?? []) as unknown as BSCase[],
        escalations: (e.data ?? []) as unknown as BSEscalation[],
        plans: (p.data ?? []) as unknown as BSPlan[],
        planTasks: (t.data ?? []) as unknown as BSPlanTask[],
        followups: (f.data ?? []) as unknown as BSFollowup[],
        activity: (a.data ?? []) as unknown as BSActivityLog[],
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load Behavioral Support data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const metrics = useMemo(() => {
    const activeCases = data.cases.filter((c) => !["resolved", "archived"].includes(c.status));
    const activeCrises = data.escalations.filter(
      (e) => e.severity === "crisis" && !["resolved", "archived"].includes(e.status),
    ).length;
    const highRiskFamilies = activeCases.filter((c) => c.severity === "high" || c.severity === "crisis").length;
    const openPlans = data.plans.filter((p) => ["draft", "active", "monitoring"].includes(p.plan_status)).length;
    const todayStart = startOfToday(), todayEnd = endOfToday();
    const dueToday = data.followups.filter((f) => {
      const d = new Date(f.due_at);
      return f.status !== "completed" && f.status !== "cancelled" && d >= todayStart && d <= todayEnd;
    }).length;
    const overdue = data.followups.filter((f) => {
      const d = new Date(f.due_at);
      return f.status !== "completed" && f.status !== "cancelled" && d < todayStart;
    }).length;
    const pendingBcbaHandoff = data.escalations.filter(
      (e) => e.status === "waiting_on_bcba",
    ).length + data.cases.filter((c) => c.status === "waiting_on_bcba").length;
    const escalationsOpen = data.escalations.filter(
      (e) => !["resolved", "archived"].includes(e.status),
    ).length;
    const weekAgo = startOfWeekAgo();
    const resolvedThisWeek = data.escalations.filter(
      (e) => e.resolved_at && new Date(e.resolved_at) >= weekAgo,
    ).length;
    return {
      activeCrises,
      highRiskFamilies,
      openPlans,
      dueToday,
      overdue,
      pendingBcbaHandoff,
      escalationsOpen,
      resolvedThisWeek,
      activeCaseCount: activeCases.length,
    };
  }, [data]);

  const logActivity = useCallback(
    async (entry: Partial<BSActivityLog> & { activity_type: string; title: string }) => {
      const user = (await supabase.auth.getUser()).data.user;
      await supabase.from("behavioral_support_activity_log").insert({
        ...entry,
        metadata: (entry.metadata ?? {}) as Record<string, unknown>,
        created_by: user?.id ?? null,
        created_by_name: user?.email ?? null,
      } as never);
    },
    [],
  );

  const createCase = useCallback(
    async (payload: Partial<BSCase>) => {
      try {
        const user = (await supabase.auth.getUser()).data.user;
        const { data: row, error: err } = await supabase
          .from("behavioral_support_cases")
          .insert({ ...payload, created_by: user?.id ?? null } as never)
          .select("*").single();
        if (err) throw err;
        await logActivity({
          case_id: row.id,
          activity_type: "case_created",
          title: `Case opened for ${row.client_name}`,
        });
        toast.success("Case created");
        await load();
        return row as unknown as BSCase;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to create case");
        return null;
      }
    },
    [load, logActivity],
  );

  const createEscalation = useCallback(
    async (payload: Partial<BSEscalation>) => {
      try {
        const user = (await supabase.auth.getUser()).data.user;
        const { data: row, error: err } = await supabase
          .from("behavioral_support_escalations")
          .insert({ ...payload, created_by: user?.id ?? null } as never)
          .select("*").single();
        if (err) throw err;
        await logActivity({
          escalation_id: row.id,
          case_id: row.case_id,
          activity_type: "escalation_created",
          title: `Escalation opened: ${row.client_name}`,
          body: row.description,
        });
        toast.success("Escalation logged");
        await load();
        return row as unknown as BSEscalation;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to log escalation");
        return null;
      }
    },
    [load, logActivity],
  );

  const updateEscalation = useCallback(
    async (id: string, patch: Partial<BSEscalation>) => {
      try {
        const { error: err } = await supabase
          .from("behavioral_support_escalations")
          .update(patch as never)
          .eq("id", id);
        if (err) throw err;
        await logActivity({
          escalation_id: id,
          activity_type: "status_change",
          title: `Escalation updated`,
          metadata: patch as Record<string, unknown>,
        });
        toast.success("Escalation updated");
        await load();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Update failed");
      }
    },
    [load, logActivity],
  );

  const createPlan = useCallback(
    async (payload: Partial<BSPlan>) => {
      try {
        const user = (await supabase.auth.getUser()).data.user;
        const { data: row, error: err } = await supabase
          .from("behavioral_support_plans")
          .insert({ ...payload, created_by: user?.id ?? null } as never)
          .select("*").single();
        if (err) throw err;
        await logActivity({
          plan_id: row.id,
          case_id: row.case_id,
          activity_type: "plan_created",
          title: `Support plan created: ${row.plan_title}`,
        });
        toast.success("Support plan created");
        await load();
        return row as unknown as BSPlan;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to create plan");
        return null;
      }
    },
    [load, logActivity],
  );

  const updatePlan = useCallback(
    async (id: string, patch: Partial<BSPlan>) => {
      try {
        const { error: err } = await supabase
          .from("behavioral_support_plans")
          .update(patch as never)
          .eq("id", id);
        if (err) throw err;
        const patchedFields = Object.keys(patch);
        const isStatusChange = Object.prototype.hasOwnProperty.call(patch, "plan_status");
        await logActivity({
          plan_id: id,
          activity_type: isStatusChange ? "plan_status_change" : "plan_updated",
          title: isStatusChange && patch.plan_status ? `Plan status → ${patch.plan_status}` : "Plan updated",
          metadata: { patch_fields: patchedFields, patch } as Record<string, unknown>,
        });
        toast.success("Plan updated");
        await load();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Update failed");
      }
    },
    [load, logActivity],
  );

  const createPlanTask = useCallback(
    async (payload: Partial<BSPlanTask>) => {
      try {
        const user = (await supabase.auth.getUser()).data.user;
        const { data: row, error: err } = await supabase
          .from("behavioral_support_plan_tasks")
          .insert({ ...payload, created_by: user?.id ?? null } as never)
          .select("*").single();
        if (err) throw err;
        await logActivity({
          plan_id: row.plan_id,
          case_id: row.case_id,
          activity_type: "task_created",
          title: `Task added: ${row.task_title}`,
        });
        toast.success("Task added");
        await load();
        return row as unknown as BSPlanTask;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to add task");
        return null;
      }
    },
    [load, logActivity],
  );

  const updatePlanTask = useCallback(
    async (id: string, patch: Partial<BSPlanTask>) => {
      try {
        // Read the current task row so we know old status, plan/case context,
        // and can log meaningful activity metadata (task_updated /
        // task_completed / task_reopened / task_blocked).
        const { data: prev } = await supabase
          .from("behavioral_support_plan_tasks")
          .select("id, plan_id, case_id, status, task_title")
          .eq("id", id)
          .maybeSingle();
        const oldStatus = (prev?.status ?? null) as BSPlanTask["status"] | null;
        const newStatus = (patch.status ?? null) as BSPlanTask["status"] | null;
        const { error: err } = await supabase
          .from("behavioral_support_plan_tasks")
          .update(patch as never)
          .eq("id", id);
        if (err) throw err;
        let activity_type = "task_updated";
        if (newStatus && newStatus !== oldStatus) {
          if (newStatus === "completed") activity_type = "task_completed";
          else if (newStatus === "blocked") activity_type = "task_blocked";
          else if (oldStatus === "completed" && newStatus !== "completed") activity_type = "task_reopened";
        }
        const title = prev?.task_title
          ? `Task ${activity_type.replace("task_", "").replace(/_/g, " ")}: ${prev.task_title}`
          : `Task ${activity_type.replace("task_", "").replace(/_/g, " ")}`;
        await logActivity({
          plan_id: prev?.plan_id ?? null,
          case_id: prev?.case_id ?? null,
          activity_type,
          title,
          metadata: {
            task_id: id,
            plan_id: prev?.plan_id ?? null,
            case_id: prev?.case_id ?? null,
            old_status: oldStatus,
            new_status: newStatus,
            patch_fields: Object.keys(patch),
          } as Record<string, unknown>,
        });
        await load();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Update failed");
      }
    },
    [load, logActivity],
  );

  const createFollowup = useCallback(
    async (payload: Partial<BSFollowup>) => {
      try {
        const user = (await supabase.auth.getUser()).data.user;
        const { data: row, error: err } = await supabase
          .from("behavioral_support_followups")
          .insert({ ...payload, created_by: user?.id ?? null } as never)
          .select("*").single();
        if (err) throw err;
        await logActivity({
          followup_id: row.id,
          case_id: row.case_id,
          escalation_id: row.escalation_id,
          activity_type: "followup_created",
          title: `Follow-up scheduled: ${row.client_name}`,
        });
        toast.success("Follow-up scheduled");
        await load();
        return row as unknown as BSFollowup;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to schedule follow-up");
        return null;
      }
    },
    [load, logActivity],
  );

  const completeFollowup = useCallback(
    async (
      id: string,
      arg:
        | string
        | {
            outcome: string;
            resolved?: boolean;
            nextFollowupDueAt?: string | null;
            note?: string | null;
          },
    ) => {
      const opts = typeof arg === "string" ? { outcome: arg } : arg;
      try {
        const { data: prev } = await supabase
          .from("behavioral_support_followups")
          .select("*")
          .eq("id", id)
          .maybeSingle();
        const { error: err } = await supabase
          .from("behavioral_support_followups")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            outcome: opts.outcome,
          } as never)
          .eq("id", id);
        if (err) throw err;
        await logActivity({
          followup_id: id,
          case_id: prev?.case_id ?? null,
          escalation_id: prev?.escalation_id ?? null,
          activity_type: "followup_completed",
          title: "Follow-up completed",
          body: opts.outcome,
          metadata: {
            resolved: opts.resolved ?? null,
            note: opts.note ?? null,
            next_followup_due_at: opts.nextFollowupDueAt ?? null,
          } as Record<string, unknown>,
        });
        if (opts.nextFollowupDueAt && prev) {
          const { data: nxt } = await supabase
            .from("behavioral_support_followups")
            .insert({
              client_name: prev.client_name,
              client_id: prev.client_id,
              case_id: prev.case_id,
              escalation_id: prev.escalation_id,
              followup_type: prev.followup_type,
              priority: prev.priority,
              status: "open",
              due_at: opts.nextFollowupDueAt,
            } as never)
            .select("id")
            .single();
          await logActivity({
            followup_id: nxt?.id ?? null,
            case_id: prev.case_id ?? null,
            escalation_id: prev.escalation_id ?? null,
            activity_type: "followup_created",
            title: `Next follow-up scheduled: ${prev.client_name}`,
            metadata: { from_followup_id: id } as Record<string, unknown>,
          });
        }
        toast.success("Follow-up completed");
        await load();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to complete");
      }
    },
    [load, logActivity],
  );

  const updateCase = useCallback(
    async (id: string, patch: Partial<BSCase>) => {
      try {
        const { error: err } = await supabase
          .from("behavioral_support_cases")
          .update(patch as never)
          .eq("id", id);
        if (err) throw err;
        const isStatusChange = Object.prototype.hasOwnProperty.call(patch, "status");
        await logActivity({
          case_id: id,
          activity_type: isStatusChange ? "case_status_change" : "case_updated",
          title: isStatusChange && patch.status ? `Case status → ${patch.status}` : "Case updated",
          metadata: { patch_fields: Object.keys(patch), patch } as Record<string, unknown>,
        });
        toast.success("Case updated");
        await load();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Update failed");
      }
    },
    [load, logActivity],
  );

  const archiveCase = useCallback(
    async (id: string) => {
      try {
        const { error: err } = await supabase
          .from("behavioral_support_cases")
          .update({ status: "archived" } as never)
          .eq("id", id);
        if (err) throw err;
        await logActivity({ case_id: id, activity_type: "case_archived", title: "Case archived" });
        toast.success("Case archived");
        await load();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to archive");
      }
    },
    [load, logActivity],
  );

  const addNote = useCallback(
    async (opts: { case_id?: string | null; escalation_id?: string | null; plan_id?: string | null; title: string; body?: string }) => {
      try {
        await logActivity({
          case_id: opts.case_id ?? null,
          escalation_id: opts.escalation_id ?? null,
          plan_id: opts.plan_id ?? null,
          activity_type: "note",
          title: opts.title,
          body: opts.body ?? null,
        });
        toast.success("Note added");
        await load();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to add note");
      }
    },
    [load, logActivity],
  );

  const resolveCase = useCallback(
    async (id: string) => {
      try {
        const { error: err } = await supabase
          .from("behavioral_support_cases")
          .update({ status: "resolved", resolved_at: new Date().toISOString() } as never)
          .eq("id", id);
        if (err) throw err;
        await logActivity({ case_id: id, activity_type: "resolution", title: "Case resolved" });
        toast.success("Case resolved");
        await load();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to resolve");
      }
    },
    [load, logActivity],
  );

  return {
    ...data,
    metrics,
    loading,
    error,
    refresh: load,
    createCase,
    updateCase,
    archiveCase,
    createEscalation,
    updateEscalation,
    createPlan,
    updatePlan,
    createPlanTask,
    updatePlanTask,
    createFollowup,
    completeFollowup,
    addNote,
    resolveCase,
  };
}

export type UseBehavioralSupportData = ReturnType<typeof useBehavioralSupportData>;