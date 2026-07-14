import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type UserGoalStatus =
  | "draft_milestones"
  | "pending_approval"
  | "changes_requested"
  | "active"
  | "completed"
  | "archived";

export type MilestoneStatus =
  | "pending"
  | "approved"
  | "changes_requested"
  | "in_progress"
  | "done";

export interface UserGoal {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  owner_id: string;
  assigned_by_id: string;
  target_date: string | null;
  priority: "low" | "medium" | "high";
  status: UserGoalStatus;
  goal_type: GoalType;
  quarter: string | null;
  approval_notes: string | null;
  approved_by_id: string | null;
  approved_at: string | null;
  submitted_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserGoalMilestone {
  id: string;
  goal_id: string;
  title: string;
  success_criteria: string | null;
  target_date: string | null;
  status: MilestoneStatus;
  order_index: number;
  approval_notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoalActivity {
  id: string;
  goal_id: string;
  actor_id: string;
  action: string;
  note: string | null;
  created_at: string;
}

const LEADERSHIP_ROLES = new Set([
  "super_admin",
  "admin",
  "ceo",
  "coo",
  "director_of_operations",
  "exec",
  "executive",
  "executive_leadership",
  "operations_leadership",
]);

// Strict leadership = who can assign top-level quarterly goals AND approve
// milestones. Excludes operations_leadership + admin per product decision.
const STRICT_LEADERSHIP_ROLES = new Set([
  "super_admin",
  "ceo",
  "coo",
  "director_of_operations",
  "exec",
  "executive",
  "executive_leadership",
]);

export function useIsLeadership(): boolean {
  const { roles, isAdmin } = useAuth();
  return useMemo(
    () => isAdmin || (roles ?? []).some((r) => LEADERSHIP_ROLES.has(r as string)),
    [roles, isAdmin],
  );
}

export function useIsStrictLeadership(): boolean {
  const { roles, isAdmin } = useAuth();
  return useMemo(
    () => isAdmin || (roles ?? []).some((r) => STRICT_LEADERSHIP_ROLES.has(r as string)),
    [roles, isAdmin],
  );
}

/** True if the current user is flagged as a people manager on the employees table. */
export function useIsPeopleManager(): boolean {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["is_people_manager", user?.id ?? null],
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_people_manager", true)
        .maybeSingle();
      return !!data;
    },
  });
  return q.data ?? false;
}

export type GoalScope = "mine" | "assigned_by_me" | "approval_queue" | "all";
export type GoalType = "assigned" | "personal" | "team";

export function useUserGoals(scope: GoalScope = "mine") {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const isLeadership = useIsLeadership();
  const isStrictLeadership = useIsStrictLeadership();
  const isPeopleManager = useIsPeopleManager();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["user_goals", scope, userId],
    enabled: !!userId,
    staleTime: 30_000,
    queryFn: async (): Promise<UserGoal[]> => {
      if (!userId) return [];
      let q = supabase.from("user_goals").select("*");
      if (scope === "mine") q = q.eq("owner_id", userId);
      else if (scope === "assigned_by_me") q = q.eq("assigned_by_id", userId);
      else if (scope === "approval_queue") q = q.eq("status", "pending_approval");
      q = q.order("created_at", { ascending: false });
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as UserGoal[];
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["user_goals"] });
    qc.invalidateQueries({ queryKey: ["user_goal_milestones"] });
    qc.invalidateQueries({ queryKey: ["user_goal_activity"] });
  };

  const logActivity = async (goal_id: string, action: string, note?: string) => {
    if (!userId) return;
    await supabase.from("user_goal_activity").insert({
      goal_id,
      actor_id: userId,
      action,
      note: note ?? null,
    });
  };

  const assignGoal = useMutation({
    mutationFn: async (input: {
      owner_id: string;
      title: string;
      description?: string;
      category?: string;
      target_date?: string | null;
      priority?: "low" | "medium" | "high";
      goal_type?: GoalType;
      quarter?: string | null;
    }) => {
      if (!userId) throw new Error("Not authenticated");
      const goal_type: GoalType = input.goal_type ?? "assigned";
      if (goal_type === "assigned" && !isStrictLeadership) {
        throw new Error("Only Executive, CEO, COO, DOO, or Super Admin can create quarterly goals.");
      }
      if (goal_type === "team" && !isPeopleManager) {
        throw new Error("Only people managers can create team goals.");
      }
      const { data, error } = await supabase
        .from("user_goals")
        .insert({
          owner_id: input.owner_id,
          assigned_by_id: userId,
          title: input.title,
          description: input.description ?? null,
          category: input.category ?? null,
          target_date: input.target_date ?? null,
          priority: input.priority ?? "medium",
          status: "draft_milestones",
          goal_type,
          quarter: input.quarter ?? null,
        })
        .select("*")
        .single();
      if (error) throw error;
      await logActivity(
        data.id,
        "assigned",
        goal_type === "team"
          ? "Team goal created by manager"
          : goal_type === "assigned"
          ? "Quarterly goal created by leadership"
          : "Personal goal created",
      );
      return data as UserGoal;
    },
    onSuccess: invalidate,
  });

  /** Self-serve personal goal. Anyone can create one for themselves. */
  const createPersonalGoal = useMutation({
    mutationFn: async (input: {
      title: string;
      description?: string;
      category?: string;
      target_date?: string | null;
      priority?: "low" | "medium" | "high";
      quarter?: string | null;
    }) => {
      if (!userId) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("user_goals")
        .insert({
          owner_id: userId,
          assigned_by_id: userId,
          title: input.title,
          description: input.description ?? null,
          category: input.category ?? null,
          target_date: input.target_date ?? null,
          priority: input.priority ?? "medium",
          status: "active", // personal goals skip approval
          goal_type: "personal",
          quarter: input.quarter ?? null,
        })
        .select("*")
        .single();
      if (error) throw error;
      await logActivity(data.id, "personal_created", "Personal goal created");
      return data as UserGoal;
    },
    onSuccess: invalidate,
  });

  const submitForApproval = useMutation({
    mutationFn: async (goalId: string) => {
      const { error } = await supabase
        .from("user_goals")
        .update({ status: "pending_approval", submitted_at: new Date().toISOString() })
        .eq("id", goalId);
      if (error) throw error;
      await logActivity(goalId, "milestones_submitted", "Submitted milestones for approval");
    },
    onSuccess: invalidate,
  });

  const approveGoal = useMutation({
    mutationFn: async ({ goalId, note }: { goalId: string; note?: string }) => {
      if (!userId) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("user_goals")
        .update({
          status: "active",
          approved_by_id: userId,
          approved_at: new Date().toISOString(),
          approval_notes: note ?? null,
        })
        .eq("id", goalId);
      if (error) throw error;
      // approve all pending milestones
      await supabase
        .from("user_goal_milestones")
        .update({ status: "approved" })
        .eq("goal_id", goalId)
        .eq("status", "pending");
      await logActivity(goalId, "approved", note);
    },
    onSuccess: invalidate,
  });

  const requestChanges = useMutation({
    mutationFn: async ({ goalId, note }: { goalId: string; note: string }) => {
      const { error } = await supabase
        .from("user_goals")
        .update({ status: "changes_requested", approval_notes: note })
        .eq("id", goalId);
      if (error) throw error;
      await logActivity(goalId, "changes_requested", note);
    },
    onSuccess: invalidate,
  });

  const completeGoal = useMutation({
    mutationFn: async (goalId: string) => {
      const { error } = await supabase
        .from("user_goals")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", goalId);
      if (error) throw error;
      await logActivity(goalId, "goal_completed");
    },
    onSuccess: invalidate,
  });

  return {
    goals: query.data ?? [],
    loading: query.isLoading,
    isLeadership,
    isStrictLeadership,
    isPeopleManager,
    assignGoal,
    createPersonalGoal,
    submitForApproval,
    approveGoal,
    requestChanges,
    completeGoal,
    logActivity,
  };
}

export function useGoalMilestones(goalId: string | null) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["user_goal_milestones", goalId],
    enabled: !!goalId,
    staleTime: 30_000,
    queryFn: async (): Promise<UserGoalMilestone[]> => {
      if (!goalId) return [];
      const { data, error } = await supabase
        .from("user_goal_milestones")
        .select("*")
        .eq("goal_id", goalId)
        .order("order_index", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as UserGoalMilestone[];
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["user_goal_milestones", goalId] });
    qc.invalidateQueries({ queryKey: ["user_goals"] });
  };

  const addMilestone = useMutation({
    mutationFn: async (input: {
      title: string;
      success_criteria?: string;
      target_date?: string | null;
      order_index?: number;
    }) => {
      if (!goalId) throw new Error("No goal");
      const { error } = await supabase.from("user_goal_milestones").insert({
        goal_id: goalId,
        title: input.title,
        success_criteria: input.success_criteria ?? null,
        target_date: input.target_date ?? null,
        order_index: input.order_index ?? 0,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateMilestone = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<UserGoalMilestone> }) => {
      const { error } = await supabase.from("user_goal_milestones").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const completeMilestone = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("user_goal_milestones")
        .update({ status: "done", completed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteMilestone = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_goal_milestones").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const milestones = query.data ?? [];
  const progress = useMemo(() => {
    if (milestones.length === 0) return 0;
    const done = milestones.filter((m) => m.status === "done").length;
    return Math.round((done / milestones.length) * 100);
  }, [milestones]);

  return {
    milestones,
    progress,
    loading: query.isLoading,
    addMilestone,
    updateMilestone,
    completeMilestone,
    deleteMilestone,
  };
}

export function useGoalActivity(goalId: string | null) {
  return useQuery({
    queryKey: ["user_goal_activity", goalId],
    enabled: !!goalId,
    staleTime: 30_000,
    queryFn: async (): Promise<GoalActivity[]> => {
      if (!goalId) return [];
      const { data, error } = await supabase
        .from("user_goal_activity")
        .select("*")
        .eq("goal_id", goalId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as GoalActivity[];
    },
  });
}

// Fetch a list of assignable users (basic — from profiles). Used for goal owner picker.
export function useAssignableUsers() {
  return useQuery({
    queryKey: ["assignable_users"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id,display_name,email")
        .eq("active", true)
        .order("display_name", { ascending: true })
        .limit(500);
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.user_id as string,
        display_name: r.display_name as string | null,
        email: r.email as string | null,
      }));
    },
  });
}