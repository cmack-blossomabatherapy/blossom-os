import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Shared data hook for the RBT workspace.
 * Resolves the logged-in RBT to an employee row, then loads self-scoped
 * assignments, sessions, supervision, messages, help requests, and
 * session-support logs. RLS on the rbt_* tables already enforces that
 * an RBT only sees their own rows — this hook just makes the queries.
 */

export interface RBTProfile {
  id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  email: string | null;
  phone: string | null;
  state: string | null;
  clinic: string | null;
  job_title: string | null;
  status: string | null;
  hire_date: string | null;
  manager_id: string | null;
}

export interface RBTClientAssignment {
  id: string;
  rbt_employee_id: string;
  client_id: string | null;
  client_name: string;
  state: string | null;
  clinic: string | null;
  assigned_bcba_id: string | null;
  case_manager_id: string | null;
  authorized_service_codes: string[] | null;
  safety_notes: string | null;
  family_preferences: string | null;
  schedule_summary: string | null;
  start_date: string | null;
  status: string | null;
  centralreach_client_id: string | null;
  centralreach_sync_status: string | null;
  centralreach_last_synced_at: string | null;
}

export interface RBTSession {
  id: string;
  rbt_employee_id: string;
  client_id: string | null;
  client_name: string;
  bcba_id: string | null;
  session_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  service_code: string | null;
  session_status: string | null;
  attendance_status: string | null;
  cancellation_reason: string | null;
  confirmed_by_rbt_at: string | null;
  acknowledged_by_rbt_at: string | null;
  centralreach_session_id: string | null;
  centralreach_sync_status: string | null;
  centralreach_last_synced_at: string | null;
  centralreach_sync_error: string | null;
}

export interface RBTSupervision {
  id: string;
  rbt_employee_id: string;
  bcba_id: string | null;
  supervision_date: string;
  supervision_type: string | null;
  client_id: string | null;
  notes: string | null;
  feedback: string | null;
  competency_area: string | null;
  status: string | null;
  signed_by_bcba_at: string | null;
  acknowledged_by_rbt_at: string | null;
}

export interface RBTMessage {
  id: string;
  recipient_employee_id: string;
  sender_employee_id: string | null;
  source_system: string | null;
  message_type: string | null;
  title: string;
  body: string | null;
  related_client_id: string | null;
  related_session_id: string | null;
  related_training_module_id: string | null;
  action_required: boolean;
  due_at: string | null;
  read_at: string | null;
  completed_at: string | null;
  priority: string | null;
  status: string | null;
  created_at: string;
}

export interface RBTHelpRequest {
  id: string;
  rbt_employee_id: string;
  category: string;
  urgency: string | null;
  related_client_id: string | null;
  related_session_id: string | null;
  description: string;
  preferred_contact_method: string | null;
  routed_to_role: string | null;
  routed_to_employee_id: string | null;
  status: string;
  first_response_at: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface RBTSessionSupportLog {
  id: string;
  session_id: string | null;
  rbt_employee_id: string;
  client_id: string | null;
  checklist_completed: boolean;
  prep_notes: string | null;
  issue_type: string | null;
  issue_description: string | null;
  escalation_level: string | null;
  routed_to_role: string | null;
  routed_to_employee_id: string | null;
  status: string | null;
  created_at: string;
  resolved_at: string | null;
}

export function useRBTWorkspace() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<RBTProfile | null>(null);
  const [assignments, setAssignments] = useState<RBTClientAssignment[]>([]);
  const [sessions, setSessions] = useState<RBTSession[]>([]);
  const [supervision, setSupervision] = useState<RBTSupervision[]>([]);
  const [messages, setMessages] = useState<RBTMessage[]>([]);
  const [helpRequests, setHelpRequests] = useState<RBTHelpRequest[]>([]);
  const [supportLogs, setSupportLogs] = useState<RBTSessionSupportLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      if (!user?.id) {
        setProfile(null);
        setAssignments([]); setSessions([]); setSupervision([]);
        setMessages([]); setHelpRequests([]); setSupportLogs([]);
        setLoading(false);
        return;
      }
      const { data: emp } = await supabase
        .from("employees")
        .select("id,user_id,first_name,last_name,preferred_name,email,phone,state,clinic,job_title,status,hire_date,manager_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (!emp) {
        setProfile(null);
        setLoading(false);
        return;
      }
      setProfile(emp as RBTProfile);
      const [aq, sq, spq, mq, hq, ssq] = await Promise.all([
        supabase.from("rbt_client_assignments").select("*").eq("rbt_employee_id", emp.id).order("client_name"),
        supabase.from("rbt_sessions").select("*").eq("rbt_employee_id", emp.id).order("session_date", { ascending: false }).limit(200),
        supabase.from("rbt_supervision").select("*").eq("rbt_employee_id", emp.id).order("supervision_date", { ascending: false }).limit(50),
        supabase.from("rbt_messages").select("*").eq("recipient_employee_id", emp.id).order("created_at", { ascending: false }).limit(100),
        supabase.from("rbt_help_requests").select("*").eq("rbt_employee_id", emp.id).order("created_at", { ascending: false }).limit(50),
        supabase.from("rbt_session_support_logs").select("*").eq("rbt_employee_id", emp.id).order("created_at", { ascending: false }).limit(50),
      ]);
      if (cancelled) return;
      setAssignments((aq.data ?? []) as RBTClientAssignment[]);
      setSessions((sq.data ?? []) as RBTSession[]);
      setSupervision((spq.data ?? []) as RBTSupervision[]);
      setMessages((mq.data ?? []) as RBTMessage[]);
      setHelpRequests((hq.data ?? []) as RBTHelpRequest[]);
      setSupportLogs((ssq.data ?? []) as RBTSessionSupportLog[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user?.id, reloadKey]);

  /* ---- mutations ---- */
  const confirmSession = useCallback(async (sessionId: string) => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("rbt_sessions")
      .update({ confirmed_by_rbt_at: now })
      .eq("id", sessionId);
    if (!error) reload();
    return { error };
  }, [reload]);

  const acknowledgeSession = useCallback(async (sessionId: string) => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("rbt_sessions")
      .update({ acknowledged_by_rbt_at: now })
      .eq("id", sessionId);
    if (!error) reload();
    return { error };
  }, [reload]);

  const markMessageRead = useCallback(async (messageId: string) => {
    const { error } = await supabase
      .from("rbt_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("id", messageId);
    if (!error) reload();
    return { error };
  }, [reload]);

  const markMessageComplete = useCallback(async (messageId: string) => {
    const { error } = await supabase
      .from("rbt_messages")
      .update({ completed_at: new Date().toISOString(), status: "completed" })
      .eq("id", messageId);
    if (!error) reload();
    return { error };
  }, [reload]);

  const acknowledgeSupervision = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("rbt_supervision")
      .update({ acknowledged_by_rbt_at: new Date().toISOString() })
      .eq("id", id);
    if (!error) reload();
    return { error };
  }, [reload]);

  const submitHelpRequest = useCallback(async (input: {
    category: string; description: string; urgency?: string;
    related_client_id?: string | null; related_session_id?: string | null;
    preferred_contact_method?: string | null; routed_to_role?: string | null;
  }) => {
    if (!profile) return { error: new Error("No RBT profile") };
    const { error, data } = await supabase
      .from("rbt_help_requests")
      .insert({
        rbt_employee_id: profile.id,
        category: input.category,
        description: input.description,
        urgency: input.urgency ?? "normal",
        related_client_id: input.related_client_id ?? null,
        related_session_id: input.related_session_id ?? null,
        preferred_contact_method: input.preferred_contact_method ?? null,
        routed_to_role: input.routed_to_role ?? "bcba",
        status: "open",
      })
      .select("id")
      .maybeSingle();
    if (!error) reload();
    return { error, id: data?.id ?? null };
  }, [profile, reload]);

  const submitSessionSupport = useCallback(async (input: {
    session_id?: string | null; client_id?: string | null;
    checklist_completed?: boolean; prep_notes?: string | null;
    issue_type?: string | null; issue_description?: string | null;
    escalation_level?: string | null; routed_to_role?: string | null;
  }) => {
    if (!profile) return { error: new Error("No RBT profile") };
    const { error, data } = await supabase
      .from("rbt_session_support_logs")
      .insert({
        rbt_employee_id: profile.id,
        session_id: input.session_id ?? null,
        client_id: input.client_id ?? null,
        checklist_completed: !!input.checklist_completed,
        prep_notes: input.prep_notes ?? null,
        issue_type: input.issue_type ?? null,
        issue_description: input.issue_description ?? null,
        escalation_level: input.escalation_level ?? "none",
        routed_to_role: input.routed_to_role ?? null,
        status: input.issue_type ? "open" : "logged",
      })
      .select("id")
      .maybeSingle();
    if (!error) reload();
    return { error, id: data?.id ?? null };
  }, [profile, reload]);

  /* ---- derived ---- */
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const todaySessions = useMemo(
    () => sessions.filter((s) => s.session_date === today),
    [sessions, today],
  );
  const upcomingSessions = useMemo(
    () => sessions.filter((s) => s.session_date >= today && (s.session_status ?? "") !== "canceled"),
    [sessions, today],
  );
  const unreadMessages = useMemo(() => messages.filter((m) => !m.read_at), [messages]);
  const openActionItems = useMemo(
    () => messages.filter((m) => m.action_required && !m.completed_at),
    [messages],
  );
  const openHelp = useMemo(
    () => helpRequests.filter((h) => h.status !== "resolved" && h.status !== "closed"),
    [helpRequests],
  );
  const upcomingSupervision = useMemo(
    () => supervision.filter((s) => s.supervision_date >= today),
    [supervision, today],
  );
  const pendingAckSupervision = useMemo(
    () => supervision.filter((s) => s.signed_by_bcba_at && !s.acknowledged_by_rbt_at),
    [supervision],
  );

  return {
    user, profile, loading,
    assignments, sessions, supervision, messages, helpRequests, supportLogs,
    todaySessions, upcomingSessions, unreadMessages, openActionItems,
    openHelp, upcomingSupervision, pendingAckSupervision,
    reload,
    confirmSession, acknowledgeSession,
    markMessageRead, markMessageComplete,
    acknowledgeSupervision,
    submitHelpRequest, submitSessionSupport,
  };
}
