import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOSRoleSafe } from "@/contexts/OSRoleContext";

/**
 * Central data hook for the RBT role. Loads self-scoped Supabase-backed
 * data (assigned clients, sessions, supervision, messages, help requests,
 * session support logs) and exposes mutation helpers. RLS on the underlying
 * tables scopes rows to the logged-in RBT's own employee record.
 *
 * If the logged-in user is not linked to an employee row (early setup /
 * demo / seed state), the hook resolves to empty arrays so pages can
 * safely render calm empty states rather than crashing.
 */

export interface RbtClientAssignment {
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
  status: string;
  centralreach_client_id: string | null;
  centralreach_sync_status: string | null;
  centralreach_last_synced_at: string | null;
}

export interface RbtSession {
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
  session_status: string;
  attendance_status: string | null;
  cancellation_reason: string | null;
  confirmed_by_rbt_at: string | null;
  acknowledged_by_rbt_at: string | null;
  centralreach_session_id: string | null;
  centralreach_sync_status: string | null;
  centralreach_last_synced_at: string | null;
}

export interface RbtSupervisionEntry {
  id: string;
  rbt_employee_id: string;
  bcba_id: string | null;
  supervision_date: string;
  supervision_type: string | null;
  client_id: string | null;
  notes: string | null;
  feedback: string | null;
  competency_area: string | null;
  status: string;
  signed_by_bcba_at: string | null;
  acknowledged_by_rbt_at: string | null;
}

export interface RbtMessage {
  id: string;
  recipient_employee_id: string;
  sender_employee_id: string | null;
  message_type: string;
  title: string;
  body: string | null;
  related_client_id: string | null;
  related_session_id: string | null;
  action_required: boolean;
  due_at: string | null;
  read_at: string | null;
  completed_at: string | null;
  priority: string | null;
  status: string;
  created_at: string;
}

export interface RbtHelpRequest {
  id: string;
  rbt_employee_id: string;
  category: string;
  urgency: string;
  related_client_id: string | null;
  related_session_id: string | null;
  description: string;
  preferred_contact_method: string | null;
  routed_to_role: string | null;
  status: string;
  created_at: string;
  first_response_at: string | null;
  resolved_at: string | null;
}

export interface RbtSessionSupportLog {
  id: string;
  session_id: string | null;
  rbt_employee_id: string;
  client_id: string | null;
  checklist_completed: Record<string, boolean> | null;
  prep_notes: string | null;
  issue_type: string | null;
  issue_description: string | null;
  escalation_level: string | null;
  routed_to_role: string | null;
  status: string;
  created_at: string;
  resolved_at: string | null;
}

export interface UseRbtWorkflowResult {
  loading: boolean;
  error: string | null;
  employeeId: string | null;
  clients: RbtClientAssignment[];
  sessions: RbtSession[];
  todaySessions: RbtSession[];
  upcomingSessions: RbtSession[];
  cancelledSessions: RbtSession[];
  supervision: RbtSupervisionEntry[];
  upcomingSupervision: RbtSupervisionEntry[];
  messages: RbtMessage[];
  openMessages: RbtMessage[];
  actionMessages: RbtMessage[];
  helpRequests: RbtHelpRequest[];
  openHelpRequests: RbtHelpRequest[];
  supportLogs: RbtSessionSupportLog[];
  latestSupportLogs: RbtSessionSupportLog[];
  refresh: () => Promise<void>;
  confirmSession: (sessionId: string) => Promise<void>;
  acknowledgeSession: (sessionId: string) => Promise<void>;
  markMessageRead: (messageId: string) => Promise<void>;
  markMessageComplete: (messageId: string) => Promise<void>;
  resolveHelpRequest: (id: string, resolutionNote?: string) => Promise<void>;
  metrics: {
    pendingAcknowledgements: number;
    unreadMessages: number;
    openHelpRequests: number;
    upcomingSupervisionCount: number;
    pendingCentralReachSync: number;
  };
  submitHelpRequest: (input: {
    category: string;
    urgency?: string;
    description: string;
    related_client_id?: string | null;
    related_session_id?: string | null;
    preferred_contact_method?: string | null;
    routed_to_role?: string | null;
  }) => Promise<RbtHelpRequest | null>;
  logSessionSupport: (input: {
    session_id?: string | null;
    client_id?: string | null;
    checklist_completed?: Record<string, boolean>;
    prep_notes?: string | null;
    issue_type?: string | null;
    issue_description?: string | null;
    escalation_level?: string | null;
    routed_to_role?: string | null;
  }) => Promise<RbtSessionSupportLog | null>;
  acknowledgeSupervision: (id: string) => Promise<void>;
}

function todayISODate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function useRbtWorkflow(): UseRbtWorkflowResult {
  const { user } = useAuth();
  const osRole = useOSRoleSafe();
  const previewSubjectId = osRole?.previewSubjectEmployeeId ?? null;
  const isPreviewing = Boolean(osRole?.isPreviewing);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [clients, setClients] = useState<RbtClientAssignment[]>([]);
  const [sessions, setSessions] = useState<RbtSession[]>([]);
  const [supervision, setSupervision] = useState<RbtSupervisionEntry[]>([]);
  const [messages, setMessages] = useState<RbtMessage[]>([]);
  const [helpRequests, setHelpRequests] = useState<RbtHelpRequest[]>([]);
  const [supportLogs, setSupportLogs] = useState<RbtSessionSupportLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!user?.id) {
        setEmployeeId(null);
        setClients([]); setSessions([]); setSupervision([]);
        setMessages([]); setHelpRequests([]); setSupportLogs([]);
        return;
      }
      let eid: string | null = null;
      if (previewSubjectId) {
        eid = previewSubjectId;
      } else {
        const { data: emp } = await supabase
          .from("employees")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        eid = (emp?.id as string | undefined) ?? null;
      }
      setEmployeeId(eid);
      if (!eid) {
        setClients([]); setSessions([]); setSupervision([]);
        setMessages([]); setHelpRequests([]); setSupportLogs([]);
        return;
      }

      const [c, s, sup, m, h, sl] = await Promise.all([
        supabase.from("rbt_client_assignments").select("*")
          .eq("rbt_employee_id", eid).order("client_name"),
        supabase.from("rbt_sessions").select("*")
          .eq("rbt_employee_id", eid).order("session_date", { ascending: true }),
        supabase.from("rbt_supervision").select("*")
          .eq("rbt_employee_id", eid).order("supervision_date", { ascending: false }),
        supabase.from("rbt_messages").select("*")
          .eq("recipient_employee_id", eid).order("created_at", { ascending: false }),
        supabase.from("rbt_help_requests").select("*")
          .eq("rbt_employee_id", eid).order("created_at", { ascending: false }),
        supabase.from("rbt_session_support_logs").select("*")
          .eq("rbt_employee_id", eid).order("created_at", { ascending: false }),
      ]);

      setClients((c.data ?? []) as RbtClientAssignment[]);
      setSessions((s.data ?? []) as RbtSession[]);
      setSupervision((sup.data ?? []) as RbtSupervisionEntry[]);
      setMessages((m.data ?? []) as RbtMessage[]);
      setHelpRequests((h.data ?? []) as RbtHelpRequest[]);
      setSupportLogs((sl.data ?? []) as RbtSessionSupportLog[]);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load RBT data");
    } finally {
      setLoading(false);
    }
  }, [user?.id, previewSubjectId]);

  useEffect(() => { void loadAll(); }, [loadAll]);

  const todaySessions = useMemo(() => {
    const today = todayISODate();
    return sessions.filter((row) => row.session_date === today);
  }, [sessions]);

  const upcomingSessions = useMemo(() => {
    const today = todayISODate();
    return sessions.filter((s) => s.session_date >= today && s.session_status !== "cancelled");
  }, [sessions]);
  const cancelledSessions = useMemo(
    () => sessions.filter((s) => s.session_status === "cancelled" || !!s.cancellation_reason),
    [sessions],
  );
  const upcomingSupervision = useMemo(() => {
    const today = todayISODate();
    return supervision.filter((s) => s.supervision_date >= today);
  }, [supervision]);
  const openMessages = useMemo(
    () => messages.filter((m) => !m.completed_at && m.status !== "complete"),
    [messages],
  );
  const actionMessages = useMemo(
    () => messages.filter((m) => m.action_required && !m.completed_at),
    [messages],
  );
  const openHelpRequests = useMemo(
    () => helpRequests.filter((h) => h.status !== "resolved" && h.status !== "closed"),
    [helpRequests],
  );
  const latestSupportLogs = useMemo(() => supportLogs.slice(0, 10), [supportLogs]);

  const confirmSession = useCallback(async (sessionId: string) => {
    if (isPreviewing) return;
    const nowIso = new Date().toISOString();
    await supabase.from("rbt_sessions")
      .update({ confirmed_by_rbt_at: nowIso })
      .eq("id", sessionId);
    setSessions((prev) => prev.map((s) => s.id === sessionId ? { ...s, confirmed_by_rbt_at: nowIso } : s));
  }, []);

  const acknowledgeSession = useCallback(async (sessionId: string) => {
    if (isPreviewing) return;
    const nowIso = new Date().toISOString();
    await supabase.from("rbt_sessions")
      .update({ acknowledged_by_rbt_at: nowIso })
      .eq("id", sessionId);
    setSessions((prev) => prev.map((s) => s.id === sessionId ? { ...s, acknowledged_by_rbt_at: nowIso } : s));
  }, []);

  const markMessageRead = useCallback(async (messageId: string) => {
    if (isPreviewing) return;
    const nowIso = new Date().toISOString();
    await supabase.from("rbt_messages")
      .update({ read_at: nowIso, status: "read" })
      .eq("id", messageId);
    setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, read_at: nowIso, status: "read" } : m));
  }, []);

  const markMessageComplete = useCallback(async (messageId: string) => {
    if (isPreviewing) return;
    const nowIso = new Date().toISOString();
    await supabase.from("rbt_messages")
      .update({ completed_at: nowIso, status: "complete" })
      .eq("id", messageId);
    setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, completed_at: nowIso, status: "complete" } : m));
  }, []);

  const submitHelpRequest = useCallback<UseRbtWorkflowResult["submitHelpRequest"]>(async (input) => {
    if (!employeeId || isPreviewing) return null;
    const { data, error: err } = await supabase.from("rbt_help_requests").insert({
      rbt_employee_id: employeeId,
      category: input.category,
      urgency: input.urgency ?? "normal",
      description: input.description,
      related_client_id: input.related_client_id ?? null,
      related_session_id: input.related_session_id ?? null,
      preferred_contact_method: input.preferred_contact_method ?? null,
      routed_to_role: input.routed_to_role ?? null,
    }).select("*").single();
    if (err || !data) return null;
    const row = data as RbtHelpRequest;
    setHelpRequests((prev) => [row, ...prev]);
    return row;
  }, [employeeId]);

  const logSessionSupport = useCallback<UseRbtWorkflowResult["logSessionSupport"]>(async (input) => {
    if (!employeeId || isPreviewing) return null;
    const { data, error: err } = await supabase.from("rbt_session_support_logs").insert({
      rbt_employee_id: employeeId,
      session_id: input.session_id ?? null,
      client_id: input.client_id ?? null,
      checklist_completed: input.checklist_completed ?? {},
      prep_notes: input.prep_notes ?? null,
      issue_type: input.issue_type ?? null,
      issue_description: input.issue_description ?? null,
      escalation_level: input.escalation_level ?? "normal",
      routed_to_role: input.routed_to_role ?? null,
    }).select("*").single();
    if (err || !data) return null;
    const row = data as RbtSessionSupportLog;
    setSupportLogs((prev) => [row, ...prev]);
    return row;
  }, [employeeId]);

  const acknowledgeSupervision = useCallback(async (id: string) => {
    if (isPreviewing) return;
    const nowIso = new Date().toISOString();
    await supabase.from("rbt_supervision")
      .update({ acknowledged_by_rbt_at: nowIso })
      .eq("id", id);
    setSupervision((prev) => prev.map((s) => s.id === id ? { ...s, acknowledged_by_rbt_at: nowIso } : s));
  }, []);

  const resolveHelpRequest = useCallback(async (id: string, resolutionNote?: string) => {
    if (isPreviewing) return;
    const nowIso = new Date().toISOString();
    const patch: any = { status: "resolved", resolved_at: nowIso };
    if (resolutionNote) patch.resolution_note = resolutionNote;
    await (supabase.from("rbt_help_requests") as any).update(patch).eq("id", id);
    setHelpRequests((prev) => prev.map((h) => h.id === id ? { ...h, ...patch } : h));
  }, []);

  // Pass 3: realtime — refresh when the RBT's own rows change from any source
  // (BCBA sends a message, supervisor logs supervision, CentralReach import).
  useEffect(() => {
    if (!employeeId) return;
    const channel = supabase
      .channel(`rbt-workflow-${employeeId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "rbt_client_assignments",   filter: `rbt_employee_id=eq.${employeeId}` }, () => { void loadAll(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "rbt_sessions",             filter: `rbt_employee_id=eq.${employeeId}` }, () => { void loadAll(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "rbt_supervision",          filter: `rbt_employee_id=eq.${employeeId}` }, () => { void loadAll(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "rbt_messages",             filter: `recipient_employee_id=eq.${employeeId}` }, () => { void loadAll(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "rbt_help_requests",        filter: `rbt_employee_id=eq.${employeeId}` }, () => { void loadAll(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "rbt_session_support_logs", filter: `rbt_employee_id=eq.${employeeId}` }, () => { void loadAll(); })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [employeeId, loadAll]);

  const metrics = useMemo(() => {
    const pendingAck = supervision.filter((s) => !s.acknowledged_by_rbt_at).length
      + sessions.filter((s) => !s.acknowledged_by_rbt_at && s.session_status !== "cancelled").length;
    const unread = messages.filter((m) => !m.read_at).length;
    const openHelp = helpRequests.filter((h) => h.status !== "resolved" && h.status !== "closed").length;
    const pendingCr =
      sessions.filter((s: any) => (s.centralreach_sync_status ?? "pending_import") !== "synced").length
      + supervision.filter((s: any) => (s.centralreach_sync_status ?? "pending_import") !== "synced").length
      + messages.filter((m: any) => (m.centralreach_sync_status ?? "pending_import") !== "synced").length
      + helpRequests.filter((h: any) => (h.centralreach_sync_status ?? "pending_import") !== "synced").length
      + supportLogs.filter((l: any) => (l.centralreach_sync_status ?? "pending_import") !== "synced").length;
    return {
      pendingAcknowledgements: pendingAck,
      unreadMessages: unread,
      openHelpRequests: openHelp,
      upcomingSupervisionCount: supervision.filter((s) => s.supervision_date >= todayISODate()).length,
      pendingCentralReachSync: pendingCr,
    };
  }, [supervision, sessions, messages, helpRequests, supportLogs]);

  return {
    loading, error, employeeId,
    clients, sessions, todaySessions, upcomingSessions, cancelledSessions,
    supervision, upcomingSupervision,
    messages, openMessages, actionMessages,
    helpRequests, openHelpRequests,
    supportLogs, latestSupportLogs,
    refresh: loadAll,
    confirmSession, acknowledgeSession,
    markMessageRead, markMessageComplete,
    submitHelpRequest, logSessionSupport,
    acknowledgeSupervision,
    resolveHelpRequest,
    metrics,
  };
}