import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { computeCaseHealth, type CaseHealth } from "./caseHealth";

export interface CaseloadRow {
  clientId: string;
  approvedIdentifier: string;        // child_name — approved display name
  serviceStatus: string | null;
  assignedRbts: { id?: string; name?: string; startDate?: string | null }[];
  assignmentStartDate: string | null;
  serviceSetting: string | null;
  weeklyScheduledHours: number | null;
  deliveredHours: number | null;
  cancelledHours: number | null;
  authStart: string | null;
  authEnd: string | null;
  authorizedUnits: number | null;
  usedUnits: number | null;
  remainingUnits: number | null;
  utilizationPct: number | null;
  assessmentStatus: string | null;
  treatmentPlanStatus: string | null;
  progressReportDueAt: string | null;
  parentTrainingStatus: string | null;
  parentTrainingNextDueAt: string | null;
  staffingStatus: string | null;
  cancellationTrend: number;         // last-4-week count
  openSupportConcerns: number;
  health: CaseHealth;
  lastCrSync: string | null;
  // freshness bookkeeping — used by the UI badge
  sourceStale: boolean;
  fields: {
    // field-level source + freshness for the acceptance criteria
    [k: string]: { source: string; freshAt?: string | null; stale?: boolean };
  };
}

/* -------------------------------------------------------------------------- */

async function fetchCaseload(userId: string): Promise<CaseloadRow[]> {
  // Scope: any client where the current user is the assigned BCBA via
  // rbt_client_assignments. Unassigned clients are never returned here —
  // RLS + this filter protect them.
  const { data: assignments, error: aErr } = await supabase
    .from("rbt_client_assignments")
    .select("client_id,client_name,start_date,status,rbt_employee_id,centralreach_last_synced_at,assigned_bcba_id")
    .eq("assigned_bcba_id", userId);
  if (aErr) throw aErr;

  const clientIds = Array.from(new Set((assignments ?? []).map((a) => a.client_id).filter(Boolean)));
  if (clientIds.length === 0) return [];

  const [clientsR, authR, cancelR, ptR, tpR, supportR] = await Promise.all([
    supabase.from("clients")
      .select("id,child_name,state,clinic,active_service_status,active_staffing_status,approved_weekly_hours,scheduled_weekly_hours,delivered_weekly_hours,service_location,notes_compliance_status,next_reauth_date,centralreach_sync_status,start_date")
      .in("id", clientIds),
    supabase.from("client_authorizations")
      .select("id,client_id,status,approved_date,expiration_date,approved_hours,hours,progress_report_status")
      .in("client_id", clientIds),
    supabase.from("scheduling_cancellations")
      .select("client_id,session_date,duration_hours")
      .in("client_id", clientIds)
      .gte("session_date", new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)),
    supabase.from("bcba_parent_training_logs")
      .select("client_id,next_due_date,occurred_at")
      .in("client_id", clientIds)
      .order("occurred_at", { ascending: false }),
    supabase.from("bcba_treatment_plan_items")
      .select("client_id,status,due_date,missing_items")
      .in("client_id", clientIds),
    supabase.from("rbt_help_requests")
      .select("related_client_id,status")
      .in("related_client_id", clientIds)
      .not("status", "in", "(resolved,closed)"),
  ]);

  const clientsById = new Map((clientsR.data ?? []).map((c) => [c.id, c]));

  // Aggregate helpers
  const authByClient = new Map<string, any[]>();
  for (const a of authR.data ?? []) {
    const list = authByClient.get(a.client_id!) ?? [];
    list.push(a); authByClient.set(a.client_id!, list);
  }
  const cancelHoursByClient = new Map<string, number>();
  const cancelCountByClient = new Map<string, number>();
  for (const c of cancelR.data ?? []) {
    cancelHoursByClient.set(c.client_id!, (cancelHoursByClient.get(c.client_id!) ?? 0) + Number(c.duration_hours ?? 0));
    cancelCountByClient.set(c.client_id!, (cancelCountByClient.get(c.client_id!) ?? 0) + 1);
  }
  const latestPtByClient = new Map<string, any>();
  for (const p of ptR.data ?? []) {
    if (p.client_id && !latestPtByClient.has(p.client_id)) latestPtByClient.set(p.client_id, p);
  }
  const tpByClient = new Map<string, any>();
  for (const t of tpR.data ?? []) {
    if (t.client_id && !tpByClient.has(t.client_id)) tpByClient.set(t.client_id, t);
  }
  const supportByClient = new Map<string, number>();
  for (const s of supportR.data ?? []) {
    if (!s.related_client_id) continue;
    supportByClient.set(s.related_client_id, (supportByClient.get(s.related_client_id) ?? 0) + 1);
  }
  const assignmentsByClient = new Map<string, any[]>();
  for (const a of assignments ?? []) {
    const list = assignmentsByClient.get(a.client_id!) ?? [];
    list.push(a); assignmentsByClient.set(a.client_id!, list);
  }

  const rows: CaseloadRow[] = clientIds.map((cid) => {
    const client = clientsById.get(cid) as any;
    const asns = assignmentsByClient.get(cid) ?? [];
    const auths = (authByClient.get(cid) ?? []).sort((a, b) =>
      (b.expiration_date ?? "").localeCompare(a.expiration_date ?? ""));
    const activeAuth = auths[0];

    const authorizedUnits = activeAuth?.approved_hours ?? activeAuth?.hours ?? null;
    const usedUnits       = client?.delivered_weekly_hours != null && authorizedUnits != null
      ? Math.round(Number(client.delivered_weekly_hours) * 4) : null; // rough monthly proxy
    const remainingUnits  = authorizedUnits != null && usedUnits != null ? Math.max(0, authorizedUnits - usedUnits) : null;
    const utilPct         = authorizedUnits && usedUnits != null
      ? Math.round((usedUnits / authorizedUnits) * 100) : null;

    const pt = latestPtByClient.get(cid);
    const tp = tpByClient.get(cid);

    const cancellationTrend = cancelCountByClient.get(cid) ?? 0;
    const openSupport = supportByClient.get(cid) ?? 0;

    const lastCrSync = asns[0]?.centralreach_last_synced_at ?? null;
    const stale = lastCrSync ? (Date.now() - new Date(lastCrSync).getTime()) > 72 * 60 * 60 * 1000 : false;

    const health = computeCaseHealth({
      serviceStatus: client?.active_service_status,
      authExpiresAt: activeAuth?.expiration_date,
      usedUnits, authorizedUnits,
      scheduledWeeklyHours: client?.scheduled_weekly_hours,
      deliveredWeeklyHours: client?.delivered_weekly_hours,
      staffingStatus: client?.active_staffing_status,
      progressReportDueAt: activeAuth?.expiration_date
        ? new Date(new Date(activeAuth.expiration_date).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
        : null,
      parentTrainingNextDueAt: pt?.next_due_date,
      documentationCompliance: client?.notes_compliance_status,
      openSupportConcerns: openSupport,
      cancelledLast4wk: cancellationTrend,
      sourceStale: stale,
    });

    return {
      clientId: cid,
      approvedIdentifier: client?.child_name ?? cid,
      serviceStatus: client?.active_service_status ?? null,
      assignedRbts: asns.map((a) => ({ id: a.rbt_employee_id, name: a.client_name, startDate: a.start_date })),
      assignmentStartDate: asns[0]?.start_date ?? client?.start_date ?? null,
      serviceSetting: client?.service_location ?? null,
      weeklyScheduledHours: client?.scheduled_weekly_hours ?? null,
      deliveredHours: client?.delivered_weekly_hours ?? null,
      cancelledHours: cancelHoursByClient.get(cid) ?? 0,
      authStart: activeAuth?.approved_date ?? null,
      authEnd: activeAuth?.expiration_date ?? null,
      authorizedUnits, usedUnits, remainingUnits, utilizationPct: utilPct,
      assessmentStatus: tp?.status === "assessment" ? "in_progress" : null,
      treatmentPlanStatus: tp?.status ?? null,
      progressReportDueAt: activeAuth?.expiration_date
        ? new Date(new Date(activeAuth.expiration_date).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
        : null,
      parentTrainingStatus: pt ? (pt.next_due_date && new Date(pt.next_due_date) < new Date() ? "overdue" : "on_track") : "not_started",
      parentTrainingNextDueAt: pt?.next_due_date ?? null,
      staffingStatus: client?.active_staffing_status ?? null,
      cancellationTrend, openSupportConcerns: openSupport,
      health,
      lastCrSync,
      sourceStale: stale,
      fields: {
        approvedIdentifier:    { source: "clients.child_name" },
        serviceStatus:         { source: "clients.active_service_status" },
        weeklyScheduledHours:  { source: "clients.scheduled_weekly_hours" },
        deliveredHours:        { source: "clients.delivered_weekly_hours" },
        cancelledHours:        { source: "scheduling_cancellations" },
        authStart:             { source: "client_authorizations.approved_date" },
        authEnd:               { source: "client_authorizations.expiration_date" },
        authorizedUnits:       { source: "client_authorizations.approved_hours" },
        staffingStatus:        { source: "clients.active_staffing_status" },
        lastCrSync:            { source: "CentralReach", freshAt: lastCrSync, stale },
      },
    };
  });

  return rows.sort((a, b) => a.approvedIdentifier.localeCompare(b.approvedIdentifier));
}

export function useCaseload(scopedAuthUserId: string | null = null) {
  return useQuery({
    queryKey: ["bcba-caseload", scopedAuthUserId],
    enabled: !!scopedAuthUserId,
    staleTime: 60_000,
    queryFn: async () => fetchCaseload(scopedAuthUserId!),
  });
}