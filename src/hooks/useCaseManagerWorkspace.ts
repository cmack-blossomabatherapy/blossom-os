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

  // ---------- Shared patient/family operating timeline ----------
  //
  // Best-effort writer that appends to `public.client_timeline` when the
  // Case Manager action is tied to a real client (uuid). Never throws — a
  // failed timeline write must not roll back the main mutation. All Case
  // Manager actions call this after the primary write succeeds.
  //
  // The `client_timeline` enum currently accepts: system | auth | staffing |
  // schedule | qa | note | stage. Callers pass one of these.
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const writeClientTimelineEvent = useCallback(
    async (input: {
      client_id: string | null | undefined;
      event_type: "note" | "auth" | "staffing" | "schedule" | "qa" | "system" | "stage";
      title: string;
      body?: string | null;
    }): Promise<void> => {
      if (!input.client_id || !UUID_RE.test(input.client_id)) return;
      try {
        const description = input.body
          ? `${input.title} - ${input.body}`
          : input.title;
        await sb.from("client_timeline").insert({
          client_id: input.client_id,
          event_type: input.event_type,
          description: description.slice(0, 2000),
          user_name: "Case Manager - Blossom OS",
          created_by: userId ?? undefined,
        } as any);
      } catch (err) {
        // Non-blocking: main action already succeeded.
        // eslint-disable-next-line no-console
        console.warn("[case-manager] client_timeline write failed", err);
      }
    },
    [userId],
  );

  const createNote = useCallback(
    async (input: Partial<CMNote> & { body: string }) => {
      const { data, error } = await sb.from("case_manager_notes").insert(withUser(input)).select().single();
      if (error) throw error;
      await writeClientTimelineEvent({
        client_id: (data as any)?.client_id ?? input.client_id ?? null,
        event_type: "note",
        title: (input as any).title ?? "Case Manager note",
        body: input.body,
      });
      await refresh();
      return data as CMNote;
    },
    [refresh, withUser, writeClientTimelineEvent],
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
      await writeClientTimelineEvent({
        client_id: (data as any)?.client_id ?? input.client_id ?? null,
        event_type: "note",
        title: `Follow-up created: ${input.title}`,
        body: (input as any).notes ?? null,
      });
      await refresh();
      return data as CMFollowUp;
    },
    [refresh, withUser, writeClientTimelineEvent],
  );

  const completeFollowUp = useCallback(
    async (id: string, completion_note?: string) => {
      const { data, error } = await sb
        .from("case_manager_follow_ups")
        .update({ status: "completed", completed_at: new Date().toISOString(), completion_note: completion_note ?? null, updated_by: userId })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      await writeClientTimelineEvent({
        client_id: (data as any)?.client_id ?? null,
        event_type: "note",
        title: `Follow-up completed: ${(data as any)?.title ?? "follow-up"}`,
        body: completion_note ?? null,
      });
      await refresh();
    },
    [refresh, userId, writeClientTimelineEvent],
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
      await writeClientTimelineEvent({
        client_id: (data as any)?.client_id ?? input.client_id ?? null,
        event_type: "note",
        title: `Parent communication (${(input as any).channel ?? "logged"})`,
        body: input.summary,
      });
      await refresh();
      return data as CMCommunication;
    },
    [refresh, withUser, writeClientTimelineEvent],
  );

  const createServiceIssue = useCallback(
    async (input: Partial<CMServiceIssue> & { title: string }) => {
      const { data, error } = await sb.from("case_manager_service_issues").insert(withUser(input)).select().single();
      if (error) throw error;
      await writeClientTimelineEvent({
        client_id: (data as any)?.client_id ?? input.client_id ?? null,
        event_type: "note",
        title: `Service issue: ${input.title}`,
        body: (input as any).description ?? null,
      });
      await refresh();
      return data as CMServiceIssue;
    },
    [refresh, withUser, writeClientTimelineEvent],
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
      const issue = serviceIssues.find((i) => i.id === id);
      await writeClientTimelineEvent({
        client_id: issue?.client_id ?? null,
        event_type: "note",
        title: `Service issue resolved: ${issue?.title ?? id}`,
        body: resolution_note ?? null,
      });
    },
    [updateServiceIssue, serviceIssues, writeClientTimelineEvent],
  );

  const createEscalation = useCallback(
    async (input: Partial<CMEscalation> & { reason: string }) => {
      const { data, error } = await sb.from("case_manager_escalations").insert(withUser(input)).select().single();
      if (error) throw error;
      await writeClientTimelineEvent({
        client_id: (data as any)?.client_id ?? input.client_id ?? null,
        event_type: "note",
        title: "Case Manager escalation",
        body: input.reason,
      });
      await refresh();
      return data as CMEscalation;
    },
    [refresh, withUser, writeClientTimelineEvent],
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
      const esc = escalations.find((e) => e.id === id);
      await writeClientTimelineEvent({
        client_id: esc?.client_id ?? null,
        event_type: "note",
        title: "Escalation resolved",
        body: resolution_note ?? null,
      });
    },
    [updateEscalation, escalations, writeClientTimelineEvent],
  );

  const createHandoff = useCallback(
    async (input: Partial<CMHandoff> & { title: string; to_department: string }) => {
      const { data, error } = await sb.from("case_manager_handoffs").insert(withUser(input)).select().single();
      if (error) throw error;
      const dept = (input.to_department ?? "").toLowerCase();
      const evType: "auth" | "staffing" | "schedule" | "qa" | "note" =
          dept.includes("auth")     ? "auth"
        : dept.includes("staff")    ? "staffing"
        : dept.includes("schedul")  ? "schedule"
        : dept.includes("qa")       ? "qa"
        : "note";
      await writeClientTimelineEvent({
        client_id: (data as any)?.client_id ?? input.client_id ?? null,
        event_type: evType,
        title: `Handoff -> ${input.to_department}: ${input.title}`,
        body: (input as any).request_note ?? null,
      });
      await refresh();
      return data as CMHandoff;
    },
    [refresh, withUser, writeClientTimelineEvent],
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

  const updateCommunication = useCallback(
    async (id: string, patch: Partial<CMCommunication>) => {
      const { error } = await sb.from("case_manager_communications").update(patch).eq("id", id);
      if (error) throw error;
      await refresh();
    },
    [refresh],
  );

  /**
   * Log a parent communication and, when the caller asks for a follow-up
   * task, create it AND link the two rows together. The link lives in
   * two columns added by the Pass 4 migration:
   *   - case_manager_communications.follow_up_id
   *   - case_manager_follow_ups.source_communication_id
   *
   * This makes resolveCommunicationFollowUp() below able to close the
   * linked follow-up in the same click, so the two states never drift.
   */
  const logCommunicationWithFollowUp = useCallback(
    async (input: Partial<CMCommunication> & {
      summary: string;
      create_followup?: boolean;
    }): Promise<CMCommunication> => {
      const { create_followup, ...commInput } = input;
      const comm = await logCommunication(commInput);
      if (input.needs_followup && create_followup) {
        const fu = await createFollowUp({
          client_id: comm.client_id ?? null,
          client_name: comm.client_name ?? null,
          title: comm.subject || `Follow up with ${comm.client_name ?? "family"}`,
          category: "family_check_in",
          priority: "normal",
          status: "open",
          due_at: comm.followup_at ?? null,
          description: comm.summary,
          // Durable link back to the communication that spawned the follow-up.
          source_communication_id: comm.id,
        } as any);
        // Link forward: stamp the communication with the follow-up id.
        await sb.from("case_manager_communications")
          .update({ follow_up_id: (fu as any).id })
          .eq("id", comm.id);
        await refresh();
      }
      return comm;
    },
    [logCommunication, createFollowUp, refresh],
  );

  /**
   * Resolve a communication's "needs follow-up" flag AND close the linked
   * follow-up (if there is one) in a single click. Writes a timeline event
   * so the client history reflects both sides of the resolution.
   */
  const resolveCommunicationFollowUp = useCallback(
    async (communicationId: string, resolution_note?: string): Promise<void> => {
      const comm = communications.find((c) => c.id === communicationId);
      const linkedFollowUpId = (comm as any)?.follow_up_id as string | null | undefined;
      // 1) Flip needs_followup off (source of truth on the comm row).
      const { error: commErr } = await sb
        .from("case_manager_communications")
        .update({ needs_followup: false })
        .eq("id", communicationId);
      if (commErr) throw commErr;
      // 2) Close the linked follow-up if still open.
      if (linkedFollowUpId) {
        const linked = followUps.find((f) => f.id === linkedFollowUpId);
        if (linked && !["completed", "resolved", "closed"].includes(linked.status)) {
          await sb.from("case_manager_follow_ups")
            .update({
              status: "completed",
              completed_at: new Date().toISOString(),
              completion_note: resolution_note ?? "Resolved via linked parent communication",
              updated_by: userId,
            })
            .eq("id", linkedFollowUpId);
        }
      }
      await writeClientTimelineEvent({
        client_id: comm?.client_id ?? null,
        event_type: "note",
        title: "Parent communication follow-up resolved",
        body: resolution_note ?? comm?.subject ?? null,
      });
      await refresh();
    },
    [communications, followUps, userId, writeClientTimelineEvent, refresh],
  );

  const createAssignment = useCallback(
    async (input: Partial<CMAssignment> & { client_name: string }) => {
      const { data, error } = await sb
        .from("case_manager_assignments")
        .insert(withUser({ active: true, is_primary: true, ...input }))
        .select()
        .single();
      if (error) throw error;
      await refresh();
      return data as CMAssignment;
    },
    [refresh, withUser],
  );

  const updateAssignment = useCallback(
    async (id: string, patch: Partial<CMAssignment>) => {
      const { error } = await sb.from("case_manager_assignments").update(patch).eq("id", id);
      if (error) throw error;
      await refresh();
    },
    [refresh],
  );

  const updateFollowUp = useCallback(
    async (id: string, patch: Partial<CMFollowUp>) => {
      const { error } = await sb.from("case_manager_follow_ups").update({ ...patch, updated_by: userId }).eq("id", id);
      if (error) throw error;
      await refresh();
    },
    [refresh, userId],
  );

  const updateHandoff = useCallback(
    async (id: string, patch: Partial<CMHandoff>) => {
      const { error } = await sb.from("case_manager_handoffs").update(patch).eq("id", id);
      if (error) throw error;
      await refresh();
    },
    [refresh],
  );

  const resolveHandoff = useCallback(
    async (id: string, response_note?: string) => {
      await updateHandoff(id, {
        status: "resolved",
        resolved_at: new Date().toISOString(),
        response_note: response_note ?? null,
      });
    },
    [updateHandoff],
  );

  const updateCommunityResource = useCallback(
    async (id: string, patch: Partial<CMCommunityResource>) => {
      const { error } = await sb.from("case_manager_community_resources").update(patch).eq("id", id);
      if (error) throw error;
      await refresh();
    },
    [refresh],
  );

  const archiveCommunityResource = useCallback(
    async (id: string) => {
      await updateCommunityResource(id, { active: false });
    },
    [updateCommunityResource],
  );

  const makeDeptRequestHelper = useCallback(
    (to_department: string, handoff_type: string, defaultTitle: string) =>
      async (input: Partial<CMHandoff> & { title?: string; request_note?: string; client_id?: string | null; client_name?: string | null; state?: string | null; priority?: string }) => {
        return createHandoff({
          to_department,
          handoff_type,
          title: input.title ?? defaultTitle,
          priority: input.priority ?? "normal",
          status: "open",
          ...input,
        } as any);
      },
    [createHandoff],
  );

  const requestSchedulingUpdate = useMemo(
    () => makeDeptRequestHelper("scheduling", "scheduling_update", "Scheduling update requested"),
    [makeDeptRequestHelper],
  );
  const requestStaffingUpdate = useMemo(
    () => makeDeptRequestHelper("staffing", "staffing_update", "Staffing update requested"),
    [makeDeptRequestHelper],
  );
  const requestAuthorizationUpdate = useMemo(
    () => makeDeptRequestHelper("authorizations", "authorization_update", "Authorization update requested"),
    [makeDeptRequestHelper],
  );
  const requestClinicalUpdate = useMemo(
    () => makeDeptRequestHelper("clinical", "clinical_update", "Clinical update requested"),
    [makeDeptRequestHelper],
  );
  const requestQaReview = useMemo(
    () => makeDeptRequestHelper("qa", "qa_review", "QA review requested"),
    [makeDeptRequestHelper],
  );

  // ---------- Derived KPI helpers ----------

  const now = Date.now();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfDay);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const collections = useMemo(() => {
    const openFollowUps = followUps.filter((f) => f.status === "open");
    const overdueFollowUps = openFollowUps.filter((f) => f.due_at && new Date(f.due_at).getTime() < now);
    const dueThisWeekFollowUps = openFollowUps.filter((f) => {
      if (!f.due_at) return false;
      const t = new Date(f.due_at).getTime();
      return t >= startOfDay.getTime() && t <= endOfWeek.getTime();
    });
    const openServiceIssues = serviceIssues.filter((i) => !["resolved", "closed"].includes(i.status));
    const openEscalations = escalations.filter((e) => !["resolved", "closed"].includes(e.status));
    const openHandoffs = handoffs.filter((h) => !["resolved", "closed"].includes(h.status));
    const recentCommunications = communications.slice(0, 25);
    const familiesByClientId = new Map<string, CMAssignment>();
    assignments.forEach((a) => { if (a.client_id) familiesByClientId.set(a.client_id, a); });
    const recordsByClientId = (clientId: string | null | undefined) => {
      if (!clientId) return { notes: [], followUps: [], communications: [], serviceIssues: [], escalations: [], handoffs: [] };
      return {
        notes: notes.filter((n) => n.client_id === clientId),
        followUps: followUps.filter((f) => f.client_id === clientId),
        communications: communications.filter((c) => c.client_id === clientId),
        serviceIssues: serviceIssues.filter((s) => s.client_id === clientId),
        escalations: escalations.filter((e) => e.client_id === clientId),
        handoffs: handoffs.filter((h) => h.client_id === clientId),
      };
    };
    return {
      openFollowUps, overdueFollowUps, dueThisWeekFollowUps,
      openServiceIssues, openEscalations, openHandoffs,
      recentCommunications, familiesByClientId, recordsByClientId,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignments, notes, followUps, communications, serviceIssues, escalations, handoffs]);

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
    // derived collections
    ...collections,
    // mutations
    createNote,
    updateNote,
    createFollowUp,
    completeFollowUp,
    rescheduleFollowUp,
    updateFollowUp,
    logCommunication,
    updateCommunication,
    logCommunicationWithFollowUp,
    resolveCommunicationFollowUp,
    createServiceIssue,
    updateServiceIssue,
    resolveServiceIssue,
    createEscalation,
    updateEscalation,
    resolveEscalation,
    createHandoff,
    updateHandoff,
    resolveHandoff,
    createAssignment,
    updateAssignment,
    createCommunityResource,
    updateCommunityResource,
    archiveCommunityResource,
    // cross-department handoff helpers
    requestSchedulingUpdate,
    requestStaffingUpdate,
    requestAuthorizationUpdate,
    requestClinicalUpdate,
    requestQaReview,
    // shared patient/family operating timeline
    writeClientTimelineEvent,
  };
}