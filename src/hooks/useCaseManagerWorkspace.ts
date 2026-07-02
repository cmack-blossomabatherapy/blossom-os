import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * useCaseManagerWorkspace
 * -----------------------
 * Shared data + mutation layer for every Case Manager page.
 *
 * Reads Case Manager-owned workflow tables (case_manager_*) with RLS
 * enforcing that Case Managers only see records for families they are
 * assigned to or records they created. Ops leadership, State Directors,
 * and Super Admins get oversight visibility via the same policies.
 *
 * All mutation helpers return the created/updated row. Callers are
 * expected to surface toasts. Every mutation triggers `refresh()` so
 * the UI updates without a page reload.
 */

// ---------- Row types (mirror migration columns; kept loose so we don't
// have to regenerate Database types for this pass). ----------

export type CMAssignment = {
  id: string;
  case_manager_user_id: string;
  client_id: string | null;
  client_name: string | null;
  state: string | null;
  is_primary: boolean;
  active: boolean;
  centralreach_client_id: string | null;
  centralreach_patient_id: string | null;
  centralreach_sync_status: string | null;
  created_at: string;
  updated_at: string;
};

export type CMNote = {
  id: string;
  client_id: string | null;
  client_name: string | null;
  state: string | null;
  note_type: string;
  title: string | null;
  body: string;
  status: string;
  priority: string | null;
  due_at: string | null;
  resolved_at: string | null;
  resolution_note: string | null;
  created_at: string;
  updated_at: string;
};

export type CMFollowUp = {
  id: string;
  client_id: string | null;
  client_name: string | null;
  state: string | null;
  category: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  due_at: string | null;
  completed_at: string | null;
  completion_note: string | null;
  recurring_cadence: string | null;
  created_at: string;
  updated_at: string;
};

export type CMCommunication = {
  id: string;
  client_id: string | null;
  client_name: string | null;
  channel: string;
  direction: string;
  contact_name: string | null;
  subject: string | null;
  summary: string;
  outcome: string | null;
  sentiment: string | null;
  needs_followup: boolean;
  followup_at: string | null;
  source_system: string | null;
  occurred_at: string;
  created_at: string;
};

export type CMServiceIssue = {
  id: string;
  client_id: string | null;
  client_name: string | null;
  state: string | null;
  issue_type: string;
  severity: string;
  status: string;
  owner_department: string | null;
  title: string;
  description: string | null;
  parent_impact: string | null;
  action_plan: string | null;
  resolution_note: string | null;
  due_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CMEscalation = {
  id: string;
  client_id: string | null;
  client_name: string | null;
  state: string | null;
  escalation_type: string;
  severity: string;
  status: string;
  reason: string;
  summary: string | null;
  owner_department: string | null;
  escalated_to_role: string | null;
  parent_communication_needed: boolean;
  sla_due_at: string | null;
  resolved_at: string | null;
  resolution_note: string | null;
  created_at: string;
  updated_at: string;
};

export type CMHandoff = {
  id: string;
  client_id: string | null;
  client_name: string | null;
  handoff_type: string;
  to_department: string;
  priority: string;
  status: string;
  title: string;
  request_note: string | null;
  response_note: string | null;
  resolved_at: string | null;
  created_at: string;
};

export type CMCommunityResource = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  notes: string | null;
  state: string | null;
  city: string | null;
  county: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  tags: string[] | null;
  active: boolean;
  created_at: string;
};

// Loose supabase client to avoid stale Database types
const sb = supabase as unknown as {
  auth: typeof supabase.auth;
  from: (table: string) => any;
};

export function useCaseManagerWorkspace() {
  const [userId, setUserId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<CMAssignment[]>([]);
  const [notes, setNotes] = useState<CMNote[]>([]);
  const [followUps, setFollowUps] = useState<CMFollowUp[]>([]);
  const [communications, setCommunications] = useState<CMCommunication[]>([]);
  const [serviceIssues, setServiceIssues] = useState<CMServiceIssue[]>([]);
  const [escalations, setEscalations] = useState<CMEscalation[]>([]);
  const [handoffs, setHandoffs] = useState<CMHandoff[]>([]);
  const [communityResources, setCommunityResources] = useState<CMCommunityResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: user } = await sb.auth.getUser();
      setUserId(user?.user?.id ?? null);

      const [a, n, f, c, si, e, h, cr] = await Promise.all([
        sb.from("case_manager_assignments").select("*").eq("active", true).order("created_at", { ascending: false }),
        sb.from("case_manager_notes").select("*").order("created_at", { ascending: false }).limit(500),
        sb.from("case_manager_follow_ups").select("*").order("due_at", { ascending: true, nullsFirst: false }).limit(500),
        sb.from("case_manager_communications").select("*").order("occurred_at", { ascending: false }).limit(500),
        sb.from("case_manager_service_issues").select("*").order("created_at", { ascending: false }).limit(500),
        sb.from("case_manager_escalations").select("*").order("created_at", { ascending: false }).limit(500),
        sb.from("case_manager_handoffs").select("*").order("created_at", { ascending: false }).limit(500),
        sb.from("case_manager_community_resources").select("*").eq("active", true).order("name", { ascending: true }).limit(500),
      ]);

      setAssignments((a?.data ?? []) as CMAssignment[]);
      setNotes((n?.data ?? []) as CMNote[]);
      setFollowUps((f?.data ?? []) as CMFollowUp[]);
      setCommunications((c?.data ?? []) as CMCommunication[]);
      setServiceIssues((si?.data ?? []) as CMServiceIssue[]);
      setEscalations((e?.data ?? []) as CMEscalation[]);
      setHandoffs((h?.data ?? []) as CMHandoff[]);
      setCommunityResources((cr?.data ?? []) as CMCommunityResource[]);

      const firstError = [a, n, f, c, si, e, h, cr].find((r) => r?.error);
      if (firstError?.error) setError(firstError.error.message ?? "Failed to load Case Manager data");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Case Manager data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // ---------- Mutations ----------

  const withUser = useCallback(
    <T extends Record<string, any>>(row: T): T => ({
      ...row,
      case_manager_user_id: row.case_manager_user_id ?? userId ?? undefined,
      created_by: userId ?? undefined,
    }),
    [userId],
  );

  const createNote = useCallback(
    async (input: Partial<CMNote> & { body: string }) => {
      const { data, error } = await sb.from("case_manager_notes").insert(withUser(input)).select().single();
      if (error) throw error;
      await refresh();
      return data as CMNote;
    },
    [refresh, withUser],
  );

  const updateNote = useCallback(
    async (id: string, patch: Partial<CMNote>) => {
      const { error } = await sb.from("case_manager_notes").update({ ...patch, updated_by: userId }).eq("id", id);
      if (error) throw error;
      await refresh();
    },
    [refresh, userId],
  );

  const createFollowUp = useCallback(
    async (input: Partial<CMFollowUp> & { title: string }) => {
      const { data, error } = await sb.from("case_manager_follow_ups").insert(withUser(input)).select().single();
      if (error) throw error;
      await refresh();
      return data as CMFollowUp;
    },
    [refresh, withUser],
  );

  const completeFollowUp = useCallback(
    async (id: string, completion_note?: string) => {
      const { error } = await sb
        .from("case_manager_follow_ups")
        .update({ status: "completed", completed_at: new Date().toISOString(), completion_note: completion_note ?? null, updated_by: userId })
        .eq("id", id);
      if (error) throw error;
      await refresh();
    },
    [refresh, userId],
  );

  const rescheduleFollowUp = useCallback(
    async (id: string, due_at: string) => {
      const { error } = await sb.from("case_manager_follow_ups").update({ due_at, status: "open", updated_by: userId }).eq("id", id);
      if (error) throw error;
      await refresh();
    },
    [refresh, userId],
  );

  const logCommunication = useCallback(
    async (input: Partial<CMCommunication> & { summary: string }) => {
      const { data, error } = await sb
        .from("case_manager_communications")
        .insert(withUser({ occurred_at: input.occurred_at ?? new Date().toISOString(), ...input }))
        .select()
        .single();
      if (error) throw error;
      await refresh();
      return data as CMCommunication;
    },
    [refresh, withUser],
  );

  const createServiceIssue = useCallback(
    async (input: Partial<CMServiceIssue> & { title: string }) => {
      const { data, error } = await sb.from("case_manager_service_issues").insert(withUser(input)).select().single();
      if (error) throw error;
      await refresh();
      return data as CMServiceIssue;
    },
    [refresh, withUser],
  );

  const updateServiceIssue = useCallback(
    async (id: string, patch: Partial<CMServiceIssue>) => {
      const { error } = await sb.from("case_manager_service_issues").update({ ...patch, updated_by: userId }).eq("id", id);
      if (error) throw error;
      await refresh();
    },
    [refresh, userId],
  );

  const resolveServiceIssue = useCallback(
    async (id: string, resolution_note?: string) => {
      await updateServiceIssue(id, { status: "resolved", resolved_at: new Date().toISOString(), resolution_note: resolution_note ?? null });
    },
    [updateServiceIssue],
  );

  const createEscalation = useCallback(
    async (input: Partial<CMEscalation> & { reason: string }) => {
      const { data, error } = await sb.from("case_manager_escalations").insert(withUser(input)).select().single();
      if (error) throw error;
      await refresh();
      return data as CMEscalation;
    },
    [refresh, withUser],
  );

  const updateEscalation = useCallback(
    async (id: string, patch: Partial<CMEscalation>) => {
      const { error } = await sb.from("case_manager_escalations").update({ ...patch, updated_by: userId }).eq("id", id);
      if (error) throw error;
      await refresh();
    },
    [refresh, userId],
  );

  const resolveEscalation = useCallback(
    async (id: string, resolution_note?: string) => {
      await updateEscalation(id, { status: "resolved", resolved_at: new Date().toISOString(), resolution_note: resolution_note ?? null });
    },
    [updateEscalation],
  );

  const createHandoff = useCallback(
    async (input: Partial<CMHandoff> & { title: string; to_department: string }) => {
      const { data, error } = await sb.from("case_manager_handoffs").insert(withUser(input)).select().single();
      if (error) throw error;
      await refresh();
      return data as CMHandoff;
    },
    [refresh, withUser],
  );

  const createCommunityResource = useCallback(
    async (input: Partial<CMCommunityResource> & { name: string }) => {
      const { data, error } = await sb
        .from("case_manager_community_resources")
        .insert({ ...input, created_by: userId ?? undefined })
        .select()
        .single();
      if (error) throw error;
      await refresh();
      return data as CMCommunityResource;
    },
    [refresh, userId],
  );

  // ---------- Derived KPI helpers ----------

  const now = Date.now();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfDay);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const kpis = useMemo(() => {
    const openFollowUps = followUps.filter((f) => f.status === "open");
    const overdue = openFollowUps.filter((f) => f.due_at && new Date(f.due_at).getTime() < now).length;
    const dueThisWeek = openFollowUps.filter((f) => {
      if (!f.due_at) return false;
      const t = new Date(f.due_at).getTime();
      return t >= startOfDay.getTime() && t <= endOfWeek.getTime();
    }).length;
    const openIssues = serviceIssues.filter((i) => !["resolved", "closed"].includes(i.status)).length;
    const openEscalations = escalations.filter((e) => !["resolved", "closed"].includes(e.status)).length;
    const awaitingCommResponse = communications.filter((c) => c.needs_followup).length;
    const openHandoffs = handoffs.filter((h) => !["resolved", "closed"].includes(h.status)).length;

    return {
      assignedFamilies: assignments.length,
      overdueFollowUps: overdue,
      followUpsDueThisWeek: dueThisWeek,
      openServiceIssues: openIssues,
      openEscalations,
      awaitingCommResponse,
      openHandoffs,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignments, followUps, serviceIssues, escalations, communications, handoffs]);

  return {
    userId,
    loading,
    error,
    refresh,
    // data
    assignments,
    notes,
    followUps,
    communications,
    serviceIssues,
    escalations,
    handoffs,
    communityResources,
    kpis,
    // mutations
    createNote,
    updateNote,
    createFollowUp,
    completeFollowUp,
    rescheduleFollowUp,
    logCommunication,
    createServiceIssue,
    updateServiceIssue,
    resolveServiceIssue,
    createEscalation,
    updateEscalation,
    resolveEscalation,
    createHandoff,
    createCommunityResource,
  };
}