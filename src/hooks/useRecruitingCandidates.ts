import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  checkAdvancementReadiness,
  type RbtCertificationStatus,
} from "@/lib/recruiting/rbtPathwayClassifier";

export type RecruitingRole = "RBT" | "BCBA" | "BT" | "Other";
export type RecruitingState = "GA" | "NC" | "TN" | "VA" | "MD" | "NJ" | "FL" | "TX" | "SC" | "Other";
export type PipelineStage =
  | "New Applicant"
  | "Phone Screen"
  | "Interview Scheduled"
  | "Interview Complete"
  | "Offer Sent"
  | "Offer Accepted"
  | "Background Check"
  | "Orientation Scheduled"
  | "Onboarding"
  | "Ready to Staff"
  | "Staffed"
  | "Withdrawn"
  | "Rejected"
  | "On Hold";

export interface RecruitingCandidate {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  role: RecruitingRole;
  state: RecruitingState;
  city: string | null;
  pipeline_stage: PipelineStage;
  source: string | null;
  recruiter: string | null;
  recruiter_user_id: string | null;
  applied_date: string;
  stage_entered_at: string;
  next_action: string | null;
  next_action_due: string | null;
  resume_url: string | null;
  notes: string | null;
  tags: string[] | null;
  rating: number | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  /**
   * Recruiter-owned RBT classification fields. Populated only for
   * role === 'RBT' | 'BT'; drive `rbt_pathway_assignments` via the
   * `sync_rbt_pathway_assignment` trigger.
   */
  rbt_certification_status?: RbtCertificationStatus | null;
  rbt_years_experience_direct?: number | null;
  linked_employee_id?: string | null;
}

export function fullName(c: Pick<RecruitingCandidate, "first_name" | "last_name">) {
  return `${c.first_name} ${c.last_name}`.trim();
}

export function daysInStage(c: Pick<RecruitingCandidate, "stage_entered_at">) {
  const ms = Date.now() - new Date(c.stage_entered_at).getTime();
  return Math.max(0, Math.floor(ms / 86400000));
}

export function useRecruitingCandidates() {
  const [candidates, setCandidates] = useState<RecruitingCandidate[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    const { data, error } = await supabase
      .from("recruiting_candidates")
      .select("*")
      .eq("is_archived", false)
      .order("stage_entered_at", { ascending: false });
    if (error) {
      console.error(error);
      toast.error("Failed to load candidates");
      setLoading(false);
      return;
    }
    setCandidates((data ?? []) as RecruitingCandidate[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
    const channel = supabase
      .channel("recruiting-candidates")
      .on("postgres_changes", { event: "*", schema: "public", table: "recruiting_candidates" }, () => {
        refetch();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const updateStage = useCallback(async (id: string, stage: PipelineStage) => {
    const prev = candidates;
    const current = prev.find((c) => c.id === id);
    const from = current?.pipeline_stage ?? null;
    if (current) {
      const check = checkAdvancementReadiness(
        {
          role: current.role,
          rbt_certification_status: current.rbt_certification_status ?? "unknown",
          rbt_years_experience_direct: current.rbt_years_experience_direct ?? null,
        },
        stage,
      );
      if (!check.ok) {
        toast.error(check.message ?? "Complete RBT classification before advancing.");
        return false;
      }
    }
    const now = new Date().toISOString();
    setCandidates((cs) => cs.map((c) => (c.id === id ? { ...c, pipeline_stage: stage, stage_entered_at: now } : c)));
    const { error } = await supabase
      .from("recruiting_candidates")
      .update({ pipeline_stage: stage, stage_entered_at: now })
      .eq("id", id);
    if (error) {
      console.error(error);
      toast.error("Failed to update stage");
      setCandidates(prev);
      return false;
    }
    // Best-effort activity log; ignore failures so UI stays responsive.
    try {
      await supabase.from("recruiting_activity_events").insert({
        candidate_id: id,
        entity_table: "recruiting_candidates",
        entity_id: id,
        event_type: "stage_changed",
        from_value: from,
        to_value: stage,
      } as any);
    } catch (e) {
      console.warn("activity log failed", e);
    }
    return true;
  }, [candidates]);

  const updateCandidate = useCallback(async (id: string, patch: Partial<RecruitingCandidate>) => {
    const { error } = await supabase
      .from("recruiting_candidates")
      .update(patch)
      .eq("id", id);
    if (error) {
      console.error(error);
      toast.error("Failed to update candidate");
      return false;
    }
    return true;
  }, []);

  const createCandidate = useCallback(async (input: Partial<RecruitingCandidate> & { first_name: string; last_name: string }) => {
    const { data, error } = await supabase
      .from("recruiting_candidates")
      .insert(input as any)
      .select()
      .single();
    if (error) {
      console.error(error);
      toast.error("Failed to create candidate");
      return null;
    }
    toast.success("Candidate added");
    return data as RecruitingCandidate;
  }, []);

  const byStage = useMemo(() => {
    const map = new Map<PipelineStage, RecruitingCandidate[]>();
    candidates.forEach((c) => {
      const arr = map.get(c.pipeline_stage) ?? [];
      arr.push(c);
      map.set(c.pipeline_stage, arr);
    });
    return map;
  }, [candidates]);

  return { candidates, loading, refetch, updateStage, updateCandidate, createCandidate, byStage };
}

// ============ Child hooks ============

export interface RecruitingInterview {
  id: string;
  candidate_id: string;
  interview_type: string;
  scheduled_at: string | null;
  completed_at: string | null;
  panel: string | null;
  outcome: string | null;
  notes: string | null;
  status: string;
}

export function useRecruitingInterviews(candidateId?: string) {
  const [items, setItems] = useState<RecruitingInterview[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    let q = supabase.from("recruiting_interviews").select("*").order("scheduled_at", { ascending: false });
    if (candidateId) q = q.eq("candidate_id", candidateId);
    const { data, error } = await q;
    if (error) { console.error(error); setLoading(false); return; }
    setItems((data ?? []) as RecruitingInterview[]);
    setLoading(false);
  }, [candidateId]);

  useEffect(() => {
    refetch();
    const ch = supabase
      .channel("recruiting-interviews-" + (candidateId ?? "all"))
      .on("postgres_changes", { event: "*", schema: "public", table: "recruiting_interviews" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refetch, candidateId]);

  return { items, loading, refetch };
}

export interface RecruitingOffer {
  id: string;
  candidate_id: string;
  status: string;
  hourly_rate: number | null;
  hours_per_week: number | null;
  start_date: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  declined_at: string | null;
  notes: string | null;
}

export function useRecruitingOffers() {
  const [items, setItems] = useState<RecruitingOffer[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    const { data, error } = await supabase
      .from("recruiting_offers")
      .select("*")
      .order("sent_at", { ascending: false });
    if (error) { console.error(error); setLoading(false); return; }
    setItems((data ?? []) as RecruitingOffer[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
    const ch = supabase
      .channel("recruiting-offers")
      .on("postgres_changes", { event: "*", schema: "public", table: "recruiting_offers" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refetch]);

  return { items, loading, refetch };
}

export interface RecruitingBackgroundCheck {
  id: string;
  candidate_id: string;
  vendor: string | null;
  status: string;
  initiated_at: string | null;
  cleared_at: string | null;
  blocker: string | null;
  notes: string | null;
}

export function useRecruitingBackgroundChecks() {
  const [items, setItems] = useState<RecruitingBackgroundCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const refetch = useCallback(async () => {
    const { data, error } = await supabase
      .from("recruiting_background_checks").select("*").order("initiated_at", { ascending: false });
    if (error) { console.error(error); setLoading(false); return; }
    setItems((data ?? []) as RecruitingBackgroundCheck[]);
    setLoading(false);
  }, []);
  useEffect(() => {
    refetch();
    const ch = supabase
      .channel("recruiting-bg")
      .on("postgres_changes", { event: "*", schema: "public", table: "recruiting_background_checks" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refetch]);
  return { items, loading, refetch };
}

export interface RecruitingOrientationSlot {
  id: string;
  candidate_id: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  format: string | null;
  status: string;
  notes: string | null;
}

export function useRecruitingOrientation() {
  const [items, setItems] = useState<RecruitingOrientationSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const refetch = useCallback(async () => {
    const { data, error } = await supabase
      .from("recruiting_orientation_slots").select("*").order("scheduled_date", { ascending: true });
    if (error) { console.error(error); setLoading(false); return; }
    setItems((data ?? []) as RecruitingOrientationSlot[]);
    setLoading(false);
  }, []);
  useEffect(() => {
    refetch();
    const ch = supabase
      .channel("recruiting-orient")
      .on("postgres_changes", { event: "*", schema: "public", table: "recruiting_orientation_slots" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refetch]);
  return { items, loading, refetch };
}

export interface RecruitingOnboardingTask {
  id: string;
  candidate_id: string;
  task_key: string;
  title: string;
  category: string | null;
  completed: boolean;
  completed_at: string | null;
  due_date: string | null;
  position: number | null;
  notes: string | null;
}

export function useRecruitingOnboarding() {
  const [items, setItems] = useState<RecruitingOnboardingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const refetch = useCallback(async () => {
    const { data, error } = await supabase
      .from("recruiting_onboarding_tasks").select("*").order("position", { ascending: true });
    if (error) { console.error(error); setLoading(false); return; }
    setItems((data ?? []) as RecruitingOnboardingTask[]);
    setLoading(false);
  }, []);
  const toggleTask = useCallback(async (id: string, completed: boolean) => {
    const { error } = await supabase
      .from("recruiting_onboarding_tasks")
      .update({ completed, completed_at: completed ? new Date().toISOString() : null })
      .eq("id", id);
    if (error) { console.error(error); toast.error("Failed to update task"); }
  }, []);
  useEffect(() => {
    refetch();
    const ch = supabase
      .channel("recruiting-onb")
      .on("postgres_changes", { event: "*", schema: "public", table: "recruiting_onboarding_tasks" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refetch]);
  return { items, loading, refetch, toggleTask };
}

export interface RecruitingStaffingNeed {
  id: string;
  client_label: string;
  state: RecruitingState;
  role_needed: RecruitingRole;
  hours_per_week: number | null;
  status: string;
  priority: string | null;
  matched_candidate_id: string | null;
  opened_at: string;
  filled_at: string | null;
  notes: string | null;
}

export function useRecruitingStaffingNeeds() {
  const [items, setItems] = useState<RecruitingStaffingNeed[]>([]);
  const [loading, setLoading] = useState(true);
  const refetch = useCallback(async () => {
    const { data, error } = await supabase
      .from("recruiting_staffing_needs").select("*").order("opened_at", { ascending: false });
    if (error) { console.error(error); setLoading(false); return; }
    setItems((data ?? []) as RecruitingStaffingNeed[]);
    setLoading(false);
  }, []);
  useEffect(() => {
    refetch();
    const ch = supabase
      .channel("recruiting-needs")
      .on("postgres_changes", { event: "*", schema: "public", table: "recruiting_staffing_needs" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refetch]);
  return { items, loading, refetch };
}

export interface RecruitingFollowup {
  id: string;
  candidate_id: string | null;
  title: string;
  category: string | null;
  owner: string | null;
  due_date: string | null;
  status: string;
  completed_at: string | null;
  notes: string | null;
}

export function useRecruitingFollowups() {
  const [items, setItems] = useState<RecruitingFollowup[]>([]);
  const [loading, setLoading] = useState(true);
  const refetch = useCallback(async () => {
    const { data, error } = await supabase
      .from("recruiting_followups").select("*").order("due_date", { ascending: true });
    if (error) { console.error(error); setLoading(false); return; }
    setItems((data ?? []) as RecruitingFollowup[]);
    setLoading(false);
  }, []);
  const resolve = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("recruiting_followups")
      .update({ status: "Done", completed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) toast.error("Failed to resolve follow-up");
  }, []);
  useEffect(() => {
    refetch();
    const ch = supabase
      .channel("recruiting-followups")
      .on("postgres_changes", { event: "*", schema: "public", table: "recruiting_followups" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refetch]);
  return { items, loading, refetch, resolve };
}

export interface RecruitingEscalation {
  id: string;
  candidate_id: string | null;
  title: string;
  reason: string | null;
  severity: string;
  status: string;
  owner: string | null;
  opened_at: string;
  resolved_at: string | null;
  notes: string | null;
}

export function useRecruitingEscalations() {
  const [items, setItems] = useState<RecruitingEscalation[]>([]);
  const [loading, setLoading] = useState(true);
  const refetch = useCallback(async () => {
    const { data, error } = await supabase
      .from("recruiting_escalations").select("*").order("opened_at", { ascending: false });
    if (error) { console.error(error); setLoading(false); return; }
    setItems((data ?? []) as RecruitingEscalation[]);
    setLoading(false);
  }, []);
  const resolve = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("recruiting_escalations")
      .update({ status: "Resolved", resolved_at: new Date().toISOString() })
      .eq("id", id);
    if (error) toast.error("Failed to resolve escalation");
  }, []);
  useEffect(() => {
    refetch();
    const ch = supabase
      .channel("recruiting-escalations")
      .on("postgres_changes", { event: "*", schema: "public", table: "recruiting_escalations" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refetch]);
  return { items, loading, refetch, resolve };
}

export interface RecruitingMessage {
  id: string;
  candidate_id: string;
  direction: string;
  channel: string;
  subject: string | null;
  body: string;
  sent_at: string;
  sender: string | null;
  status: string;
}

export function useRecruitingMessages(candidateId?: string) {
  const [items, setItems] = useState<RecruitingMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const refetch = useCallback(async () => {
    let q = supabase.from("recruiting_messages").select("*").order("sent_at", { ascending: false });
    if (candidateId) q = q.eq("candidate_id", candidateId);
    const { data, error } = await q;
    if (error) { console.error(error); setLoading(false); return; }
    setItems((data ?? []) as RecruitingMessage[]);
    setLoading(false);
  }, [candidateId]);
  const sendMessage = useCallback(async (msg: Partial<RecruitingMessage> & { candidate_id: string; body: string }) => {
    const { error } = await supabase.from("recruiting_messages").insert({
      direction: "outbound",
      channel: "email",
      ...msg,
    } as any);
    if (error) { console.error(error); toast.error("Failed to send message"); return false; }
    return true;
  }, []);
  useEffect(() => {
    refetch();
    const ch = supabase
      .channel("recruiting-messages-" + (candidateId ?? "all"))
      .on("postgres_changes", { event: "*", schema: "public", table: "recruiting_messages" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refetch, candidateId]);
  return { items, loading, refetch, sendMessage };
}