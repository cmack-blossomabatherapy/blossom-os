import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Client, ClientStage, ClientTask, ClientTimelineEvent, AuthorizationRecord, mockClients,
  ScheduleSlot, AuthStatus, StaffingStatus, QAStatus, ClientSchedulingStatus,
  ActiveServiceStatus, ActiveStaffingStatus, NotesComplianceStatus, BillingClaimStatus,
  ReauthCycle, ReauthCycleStatus, ReauthQAStatus, ReauthSubmissionStatus,
} from "@/data/clients";
import { canAdvanceToStage, canonicalPipelineStage } from "@/data/pipeline";
import { useAuth } from "@/contexts/AuthContext";

type Row<T> = T & Record<string, unknown>;

interface ClientsContextValue {
  clients: Client[];
  loading: boolean;
  getClient: (id: string) => Client | undefined;
  addClient: (client: Omit<Client, "id"> & { id?: string }) => Promise<Client | null>;
  updateClient: (id: string, patch: Partial<Client>) => Promise<void>;
  bulkUpdate: (ids: string[], patch: Partial<Client>) => Promise<void>;
  moveStage: (ids: string[], stage: ClientStage) => Promise<void>;
  revertStage: (clientId: string, previousStage: ClientStage, previousStageEnteredAt: string, automationLogEntry: string) => Promise<void>;
  assignBcba: (ids: string[], bcba: string) => Promise<void>;
  assignRbt: (ids: string[], rbt: string) => Promise<void>;
  setStartDate: (ids: string[], date: string) => Promise<void>;
  toggleTask: (clientId: string, taskId: string) => Promise<void>;
  addTask: (clientId: string, task: ClientTask) => Promise<void>;
  appendTimeline: (clientId: string, description: string, type?: ClientTimelineEvent["type"]) => Promise<void>;
  appendAutomation: (clientId: string, message: string) => Promise<void>;
  deleteClients: (ids: string[]) => Promise<void>;
  // Document & schedule helpers (DB-backed)
  addDocument: (clientId: string, name: string, type: string) => Promise<void>;
  removeDocument: (clientId: string, documentId: string) => Promise<void>;
  addScheduleSlot: (clientId: string, slot: ScheduleSlot) => Promise<void>;
  removeScheduleSlot: (clientId: string, day: ScheduleSlot["day"]) => Promise<void>;
  setSchedule: (clientId: string, slots: ScheduleSlot[]) => Promise<void>;
}

const ClientsContext = createContext<ClientsContextValue | null>(null);

const daysBetween = (iso?: string | null): number => {
  if (!iso) return 0;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
};
const daysUntil = (iso?: string | null): number | null => {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
};

/* ──────────────────────── DB ↔ Client mapping ──────────────────────── */
interface DbClient {
  id: string;
  lead_id?: string | null;
  child_name: string;
  parent_name: string;
  phone?: string | null;
  email?: string | null;
  child_age: string | null;
  state: string;
  clinic: string;
  stage: ClientStage;
  bcba: string | null;
  rbt: string | null;
  intake_owner: string | null;
  auth_status: AuthStatus;
  staffing_status: StaffingStatus;
  qa_status: QAStatus;
  payor: string;
  next_action: string | null;
  next_task_due: string | null;
  assessment_date: string | null;
  start_date: string | null;
  scheduling_status?: ClientSchedulingStatus;
  case_coordination_document_generated?: boolean;
  pairing_email_sent?: boolean;
  scheduling_notes?: string | null;
  centralreach_sync_status?: string;
  active_service_status?: ActiveServiceStatus;
  active_staffing_status?: ActiveStaffingStatus;
  approved_weekly_hours?: number;
  scheduled_weekly_hours?: number;
  delivered_weekly_hours?: number;
  service_location?: string;
  notes_compliance_status?: NotesComplianceStatus;
  noteguard_flags?: number;
  amerigroup_status?: string;
  sessions_logged?: number;
  claims_submitted?: number;
  claims_issues?: number;
  billing_status?: BillingClaimStatus;
  new_rbt_start_date?: string | null;
  rbt_check_in_status?: string;
  early_rbt_issues?: string[];
  next_reauth_date?: string | null;
  active_alerts?: string[];
  active_notes?: string | null;
  stage_entered_at: string;
  vob_completed_at: string | null;
  blockers: string[];
  automation_log: string[];
  staffing_history: { date: string; event: string }[];
  created_at: string;
  updated_at: string;
}

interface DbTask { id: string; client_id: string; title: string; completed: boolean; due_date: string | null; position: number; }
interface DbDocument { id: string; client_id: string; name: string; type: string; }
interface DbTimeline { id: string; client_id: string; event_type: ClientTimelineEvent["type"]; description: string; user_name: string | null; created_at: string; }
interface DbAuth { id: string; client_id: string; kind: "Initial" | "Treatment" | "Reauth"; status: AuthStatus; submitted_date: string | null; approved_date: string | null; expiration_date: string | null; hours: string | null; notes: string | null; stage_entered_at?: string | null; }
interface DbSlot { id: string; client_id: string; day: ScheduleSlot["day"]; start_time: string; end_time: string; rbt: string | null; }
interface DbReauth { id: string; client_id: string; linked_authorization_id: string | null; payor: string; current_auth_expiration_date: string; reauth_trigger_date: string; bcba_9_week_notification_date: string | null; bcba_6_week_notification_date: string | null; progress_report_due_date: string | null; progress_report_received_date: string | null; qa_review_started_date: string | null; qa_completed_date: string | null; submission_date: string | null; approval_date: string | null; status: ReauthCycleStatus; qa_status: ReauthQAStatus; submission_status: ReauthSubmissionStatus; assigned_bcba: string | null; qa_owner: string | null; authorization_coordinator: string | null; state_director: string | null; blockers: string[]; alerts: string[]; notes: string | null; stage_entered_at?: string | null; }

const buildClient = (
  c: DbClient,
  tasks: DbTask[],
  docs: DbDocument[],
  timeline: DbTimeline[],
  auths: DbAuth[],
  slots: DbSlot[],
  reauths: DbReauth[] = [],
): Client => ({
  id: c.id,
  childName: c.child_name,
  parentName: c.parent_name,
  childAge: c.child_age ?? "",
  state: c.state,
  clinic: c.clinic,
  stage: c.stage,
  bcba: c.bcba,
  rbt: c.rbt,
  intakeOwner: c.intake_owner ?? "",
  authStatus: c.auth_status,
  staffingStatus: c.staffing_status,
  qaStatus: c.qa_status,
  daysInStage: daysBetween(c.stage_entered_at),
  daysSinceVOB: daysBetween(c.vob_completed_at ?? c.created_at),
  daysSinceAssessment: c.assessment_date ? daysBetween(c.assessment_date) : null,
  daysToStart: c.start_date ? daysUntil(c.start_date) : null,
  assessmentDate: c.assessment_date,
  startDate: c.start_date,
  schedulingStatus: ((c as Row<DbClient>).scheduling_status as ClientSchedulingStatus | undefined) ?? "Pending Schedule",
  caseCoordinationDocumentGenerated: Boolean((c as Row<DbClient>).case_coordination_document_generated),
  pairingEmailSent: Boolean((c as Row<DbClient>).pairing_email_sent),
  schedulingNotes: ((c as Row<DbClient>).scheduling_notes as string | null | undefined) ?? null,
  centralReachSyncStatus: ((c as Row<DbClient>).centralreach_sync_status as string | undefined) ?? "Not Synced",
  activeServiceStatus: ((c as Row<DbClient>).active_service_status as ActiveServiceStatus | undefined) ?? (c.stage === "Services on Pause" || c.stage === "Flaked" || c.stage === "Discharged" ? c.stage : "Active"),
  activeStaffingStatus: ((c as Row<DbClient>).active_staffing_status as ActiveStaffingStatus | undefined) ?? (c.rbt ? "Stable" : "Needs Restaffing"),
  approvedWeeklyHours: Number(((c as Row<DbClient>).approved_weekly_hours as number | undefined) ?? (((auths.find((a) => a.kind === "Treatment" || a.kind === "Reauth") as Row<DbAuth> | undefined)?.approved_hours as number | undefined) ?? 0)),
  scheduledWeeklyHours: Number(((c as Row<DbClient>).scheduled_weekly_hours as number | undefined) ?? 0),
  deliveredWeeklyHours: Number(((c as Row<DbClient>).delivered_weekly_hours as number | undefined) ?? 0),
  serviceLocation: ((c as Row<DbClient>).service_location as string | undefined) ?? "Clinic",
  notesComplianceStatus: ((c as Row<DbClient>).notes_compliance_status as NotesComplianceStatus | undefined) ?? "Compliant",
  noteguardFlags: Number(((c as Row<DbClient>).noteguard_flags as number | undefined) ?? 0),
  amerigroupStatus: ((c as Row<DbClient>).amerigroup_status as string | undefined) ?? "Current",
  sessionsLogged: Number(((c as Row<DbClient>).sessions_logged as number | undefined) ?? 0),
  claimsSubmitted: Number(((c as Row<DbClient>).claims_submitted as number | undefined) ?? 0),
  claimsIssues: Number(((c as Row<DbClient>).claims_issues as number | undefined) ?? 0),
  billingStatus: ((c as Row<DbClient>).billing_status as BillingClaimStatus | undefined) ?? "Current",
  newRbtStartDate: ((c as Row<DbClient>).new_rbt_start_date as string | null | undefined) ?? null,
  rbtCheckInStatus: ((c as Row<DbClient>).rbt_check_in_status as string | undefined) ?? "Not Required",
  earlyRbtIssues: (((c as Row<DbClient>).early_rbt_issues as string[] | undefined) ?? []),
  nextReauthDate: ((c as Row<DbClient>).next_reauth_date as string | null | undefined) ?? null,
  activeAlerts: (((c as Row<DbClient>).active_alerts as string[] | undefined) ?? []),
  activeNotes: ((c as Row<DbClient>).active_notes as string | null | undefined) ?? null,
  nextAction: c.next_action ?? "",
  nextTaskDue: c.next_task_due,
  lastActivity: timeline[0]?.description ?? "—",
  payor: c.payor,
  leadId: c.lead_id ?? undefined,
  phone: c.phone ?? undefined,
  email: c.email ?? undefined,
  insurance: (c as Row<DbClient>).insurance as string | undefined,
  paymentPlanStatus: ((c as Row<DbClient>).payment_plan_status as string | undefined) ?? "Not Required",
  paymentPlanRequired: Boolean((c as Row<DbClient>).payment_plan_required),
  paymentPlanSigned: Boolean((c as Row<DbClient>).payment_plan_signed),
  readyForAuth: Boolean((c as Row<DbClient>).ready_for_auth),
  consentRequired: ((c as Row<DbClient>).consent_required as boolean | undefined) ?? true,
  consentComplete: Boolean((c as Row<DbClient>).consent_complete),
  blockers: c.blockers ?? [],
  authorizations: auths.map((a) => ({
    id: a.id,
    type: a.kind, status: a.status,
    submittedDate: a.submitted_date ?? undefined,
    approvedDate: a.approved_date ?? undefined,
    expirationDate: a.expiration_date ?? undefined,
    hours: a.hours ?? undefined,
    approvedHours: ((a as Row<DbAuth>).approved_hours as number | null | undefined) ?? null,
    frequency: ((a as Row<DbAuth>).frequency as string | null | undefined) ?? null,
    serviceType: ((a as Row<DbAuth>).service_type as string | null | undefined) ?? null,
    authorizationPeriod: ((a as Row<DbAuth>).authorization_period as string | null | undefined) ?? null,
    notes: a.notes ?? undefined,
    payor: ((a as Row<DbAuth>).payor as string | undefined) ?? c.payor,
    state: ((a as Row<DbAuth>).state as string | undefined) ?? c.state,
    assignedAuthCoordinator: (a as Row<DbAuth>).assigned_auth_coordinator as string | undefined,
    qaOwner: ((a as Row<DbAuth>).qa_owner as string | null | undefined) ?? null,
    qaStatus: (((a as Row<DbAuth>).qa_status as QAStatus | undefined) ?? "Not Started"),
    treatmentPlanReceived: Boolean((a as Row<DbAuth>).treatment_plan_received),
    treatmentPlanLinked: Boolean((a as Row<DbAuth>).treatment_plan_linked),
    requiredDocsReceived: ((a as Row<DbAuth>).required_docs_received as boolean | undefined) ?? true,
    approvalLetterReceived: Boolean((a as Row<DbAuth>).approval_letter_received),
    partialApproval: Boolean((a as Row<DbAuth>).partial_approval),
    missingDocs: (((a as Row<DbAuth>).missing_docs as string[] | undefined) ?? []),
    nextAction: (((a as Row<DbAuth>).next_action as string | undefined) ?? "Submit Authorization"),
    blockers: (((a as Row<DbAuth>).blockers as string[] | undefined) ?? []),
    qaNotes: ((a as Row<DbAuth>).qa_notes as string | null | undefined) ?? null,
    escalationOwner: ((a as Row<DbAuth>).escalation_owner as string | null | undefined) ?? null,
    submissionHistory: (((a as Row<DbAuth>).submission_history as { status?: string; date?: string; note?: string }[] | undefined) ?? []),
    reauthSourceId: ((a as Row<DbAuth>).reauth_source_id as string | null | undefined) ?? null,
    daysInStage: daysBetween(a.stage_entered_at),
    progressReportStatus: (((a as Row<DbAuth>).progress_report_status as "Not Started" | "In Progress" | "Received" | undefined) ?? "Not Started"),
  })) as AuthorizationRecord[],
  reauthCycles: reauths.map((r): ReauthCycle => ({
    id: r.id,
    clientId: r.client_id,
    linkedAuthorizationId: r.linked_authorization_id,
    payor: r.payor,
    currentAuthExpirationDate: r.current_auth_expiration_date,
    reauthTriggerDate: r.reauth_trigger_date,
    bcba9WeekNotificationDate: r.bcba_9_week_notification_date,
    bcba6WeekNotificationDate: r.bcba_6_week_notification_date,
    progressReportDueDate: r.progress_report_due_date,
    progressReportReceivedDate: r.progress_report_received_date,
    qaReviewStartedDate: r.qa_review_started_date,
    qaCompletedDate: r.qa_completed_date,
    submissionDate: r.submission_date,
    approvalDate: r.approval_date,
    status: r.status,
    qaStatus: r.qa_status,
    submissionStatus: r.submission_status,
    assignedBcba: r.assigned_bcba,
    qaOwner: r.qa_owner,
    authorizationCoordinator: r.authorization_coordinator,
    stateDirector: r.state_director,
    blockers: r.blockers ?? [],
    alerts: r.alerts ?? [],
    notes: r.notes,
    daysInStage: daysBetween(r.stage_entered_at),
  })),
  schedule: slots.map((s) => ({ day: s.day, start: s.start_time, end: s.end_time, rbt: s.rbt ?? undefined, location: ((s as Row<typeof s>).location as ScheduleSlot["location"] | undefined) ?? "Clinic", notes: ((s as Row<typeof s>).notes as string | undefined) })),
  tasks: tasks.map((t) => ({ id: t.id, title: t.title, completed: t.completed, dueDate: t.due_date ?? undefined })),
  timeline: timeline.map((t) => ({ id: t.id, type: t.event_type, description: t.description, timestamp: t.created_at, user: t.user_name ?? undefined })),
  documents: docs.map((d) => ({ name: d.name, type: d.type })),
  automationLog: c.automation_log ?? [],
  staffingHistory: c.staffing_history ?? [],
});

const clientPatchToDb = (patch: Partial<Client>): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  if (patch.childName !== undefined) out.child_name = patch.childName;
  if (patch.leadId !== undefined) out.lead_id = patch.leadId;
  if (patch.parentName !== undefined) out.parent_name = patch.parentName;
  if (patch.phone !== undefined) out.phone = patch.phone;
  if (patch.email !== undefined) out.email = patch.email;
  if (patch.childAge !== undefined) out.child_age = patch.childAge;
  if (patch.state !== undefined) out.state = patch.state;
  if (patch.clinic !== undefined) out.clinic = patch.clinic;
  if (patch.stage !== undefined) { out.stage = patch.stage; out.stage_entered_at = new Date().toISOString(); }
  if (patch.bcba !== undefined) out.bcba = patch.bcba;
  if (patch.rbt !== undefined) out.rbt = patch.rbt;
  if (patch.intakeOwner !== undefined) out.intake_owner = patch.intakeOwner;
  if (patch.authStatus !== undefined) out.auth_status = patch.authStatus;
  if (patch.staffingStatus !== undefined) out.staffing_status = patch.staffingStatus;
  if (patch.qaStatus !== undefined) out.qa_status = patch.qaStatus;
  if (patch.payor !== undefined) out.payor = patch.payor;
  if (patch.insurance !== undefined) out.insurance = patch.insurance;
  if (patch.paymentPlanStatus !== undefined) out.payment_plan_status = patch.paymentPlanStatus;
  if (patch.paymentPlanRequired !== undefined) out.payment_plan_required = patch.paymentPlanRequired;
  if (patch.paymentPlanSigned !== undefined) out.payment_plan_signed = patch.paymentPlanSigned;
  if (patch.readyForAuth !== undefined) out.ready_for_auth = patch.readyForAuth;
  if (patch.consentRequired !== undefined) out.consent_required = patch.consentRequired;
  if (patch.consentComplete !== undefined) out.consent_complete = patch.consentComplete;
  if (patch.nextAction !== undefined) out.next_action = patch.nextAction;
  if (patch.nextTaskDue !== undefined) out.next_task_due = patch.nextTaskDue;
  if (patch.assessmentDate !== undefined) out.assessment_date = patch.assessmentDate;
  if (patch.startDate !== undefined) out.start_date = patch.startDate;
  if (patch.schedulingStatus !== undefined) out.scheduling_status = patch.schedulingStatus;
  if (patch.caseCoordinationDocumentGenerated !== undefined) out.case_coordination_document_generated = patch.caseCoordinationDocumentGenerated;
  if (patch.pairingEmailSent !== undefined) out.pairing_email_sent = patch.pairingEmailSent;
  if (patch.schedulingNotes !== undefined) out.scheduling_notes = patch.schedulingNotes;
  if (patch.centralReachSyncStatus !== undefined) out.centralreach_sync_status = patch.centralReachSyncStatus;
  if (patch.activeServiceStatus !== undefined) out.active_service_status = patch.activeServiceStatus;
  if (patch.activeStaffingStatus !== undefined) out.active_staffing_status = patch.activeStaffingStatus;
  if (patch.approvedWeeklyHours !== undefined) out.approved_weekly_hours = patch.approvedWeeklyHours;
  if (patch.scheduledWeeklyHours !== undefined) out.scheduled_weekly_hours = patch.scheduledWeeklyHours;
  if (patch.deliveredWeeklyHours !== undefined) out.delivered_weekly_hours = patch.deliveredWeeklyHours;
  if (patch.serviceLocation !== undefined) out.service_location = patch.serviceLocation;
  if (patch.notesComplianceStatus !== undefined) out.notes_compliance_status = patch.notesComplianceStatus;
  if (patch.noteguardFlags !== undefined) out.noteguard_flags = patch.noteguardFlags;
  if (patch.amerigroupStatus !== undefined) out.amerigroup_status = patch.amerigroupStatus;
  if (patch.sessionsLogged !== undefined) out.sessions_logged = patch.sessionsLogged;
  if (patch.claimsSubmitted !== undefined) out.claims_submitted = patch.claimsSubmitted;
  if (patch.claimsIssues !== undefined) out.claims_issues = patch.claimsIssues;
  if (patch.billingStatus !== undefined) out.billing_status = patch.billingStatus;
  if (patch.newRbtStartDate !== undefined) out.new_rbt_start_date = patch.newRbtStartDate;
  if (patch.rbtCheckInStatus !== undefined) out.rbt_check_in_status = patch.rbtCheckInStatus;
  if (patch.earlyRbtIssues !== undefined) out.early_rbt_issues = patch.earlyRbtIssues;
  if (patch.nextReauthDate !== undefined) out.next_reauth_date = patch.nextReauthDate;
  if (patch.activeAlerts !== undefined) out.active_alerts = patch.activeAlerts;
  if (patch.activeNotes !== undefined) out.active_notes = patch.activeNotes;
  if (patch.blockers !== undefined) out.blockers = patch.blockers;
  if (patch.automationLog !== undefined) out.automation_log = patch.automationLog;
  if (patch.staffingHistory !== undefined) out.staffing_history = patch.staffingHistory;
  return out;
};

/* ──────────────────────────── Provider ──────────────────────────── */

export function ClientsProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) { setClients(mockClients); setLoading(false); return; }
    setLoading(true);
    const [c, t, d, tl, a, s, r] = await Promise.all([
      supabase.from("clients").select("*").order("created_at", { ascending: false }),
      supabase.from("client_tasks").select("*").order("position", { ascending: true }),
      supabase.from("client_documents").select("*").order("created_at", { ascending: false }),
      supabase.from("client_timeline").select("*").order("created_at", { ascending: false }),
      supabase.from("client_authorizations").select("*").order("created_at", { ascending: true }),
      supabase.from("client_schedule_slots").select("*").order("day", { ascending: true }),
      supabase.from("client_reauth_cycles" as never).select("*").order("current_auth_expiration_date", { ascending: true }),
    ]);
    if (c.error || t.error || d.error || tl.error || a.error || s.error || r.error) {
      console.error("Clients fetch error", { c: c.error, t: t.error, d: d.error, tl: tl.error, a: a.error, s: s.error, r: r.error });
      setClients(mockClients);
      setLoading(false);
      return;
    }
    const dbClients = (c.data ?? []) as unknown as DbClient[];
    if (dbClients.length === 0) {
      setClients(mockClients);
      setLoading(false);
      return;
    }
    const tasks = (t.data ?? []) as unknown as DbTask[];
    const docs = (d.data ?? []) as unknown as DbDocument[];
    const timeline = (tl.data ?? []) as unknown as DbTimeline[];
    const auths = (a.data ?? []) as unknown as DbAuth[];
    const slots = (s.data ?? []) as unknown as DbSlot[];
    const reauths = (r.data ?? []) as unknown as DbReauth[];

    const built = dbClients.map((row) =>
      buildClient(
        row,
        tasks.filter((x) => x.client_id === row.id),
        docs.filter((x) => x.client_id === row.id),
        timeline.filter((x) => x.client_id === row.id),
        auths.filter((x) => x.client_id === row.id),
        slots.filter((x) => x.client_id === row.id),
        reauths.filter((x) => x.client_id === row.id),
      ),
    );
    setClients(built);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    void refetch();
  }, [authLoading, refetch]);

  // Realtime — refetch on any change to any client table
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("clients-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "clients" }, () => void refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "client_tasks" }, () => void refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "client_documents" }, () => void refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "client_timeline" }, () => void refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "client_authorizations" }, () => void refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "client_schedule_slots" }, () => void refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "client_reauth_cycles" }, () => void refetch())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user, refetch]);

  /* ──────────────── Mutations ──────────────── */

  const getClient = useCallback((id: string) => clients.find((c) => c.id === id), [clients]);

  const insertTimeline = async (clientId: string, description: string, type: ClientTimelineEvent["type"] = "note") => {
    await supabase.from("client_timeline").insert({
      client_id: clientId, event_type: type, description, user_name: "You", created_by: user?.id,
    });
  };

  const appendAutomationLog = async (clientId: string, message: string) => {
    const c = clients.find((x) => x.id === clientId);
    const next = [...(c?.automationLog ?? []), message];
    await supabase.from("clients").update({ automation_log: next } as never).eq("id", clientId);
  };

  const addClient = useCallback(async (client: Omit<Client, "id"> & { id?: string }) => {
    if (!user) return null;
    const insertPayload = {
      ...clientPatchToDb(client as Partial<Client>),
      vob_completed_at: new Date().toISOString(),
      created_by: user.id,
    };
    const { data, error } = await supabase.from("clients").insert(insertPayload as never).select("*").single();
    if (error || !data) { console.error(error); return null; }
    const newId = (data as unknown as DbClient).id;

    // Seed tasks / docs / timeline / auths / schedule
    if (client.tasks?.length) {
      await supabase.from("client_tasks").insert(
        client.tasks.map((t, i) => ({
          client_id: newId, title: t.title, completed: t.completed, due_date: t.dueDate ?? null, position: i,
        })) as never,
      );
    }
    if (client.documents?.length) {
      await supabase.from("client_documents").insert(
        client.documents.map((d) => ({ client_id: newId, name: d.name, type: d.type })) as never,
      );
    }
    if (client.authorizations?.length) {
      await supabase.from("client_authorizations").insert(
        client.authorizations.map((a) => ({
          client_id: newId, kind: a.type, status: a.status,
          submitted_date: a.submittedDate ?? null, approved_date: a.approvedDate ?? null,
          expiration_date: a.expirationDate ?? null, hours: a.hours ?? null, notes: a.notes ?? null,
          approved_hours: a.approvedHours ?? null,
          frequency: a.frequency ?? null,
          service_type: a.serviceType ?? null,
          authorization_period: a.authorizationPeriod ?? null,
          payor: a.payor ?? client.payor,
          state: a.state ?? client.state,
          assigned_auth_coordinator: a.assignedAuthCoordinator ?? null,
          qa_owner: a.qaOwner ?? null,
          qa_status: a.qaStatus ?? "Not Started",
          treatment_plan_received: a.treatmentPlanReceived ?? false,
          treatment_plan_linked: a.treatmentPlanLinked ?? false,
          required_docs_received: a.requiredDocsReceived ?? true,
          approval_letter_received: a.approvalLetterReceived ?? false,
          partial_approval: a.partialApproval ?? false,
          missing_docs: a.missingDocs ?? [],
          next_action: a.nextAction ?? "Submit Authorization",
          blockers: a.blockers ?? [],
          qa_notes: a.qaNotes ?? null,
          escalation_owner: a.escalationOwner ?? null,
          submission_history: a.submissionHistory ?? [],
          reauth_source_id: a.reauthSourceId ?? null,
          progress_report_status: a.progressReportStatus ?? "Not Started",
        })) as never,
      );
    }
    if (client.schedule?.length) {
      await supabase.from("client_schedule_slots").insert(
        client.schedule.map((s) => ({
          client_id: newId, day: s.day, start_time: s.start, end_time: s.end, rbt: s.rbt ?? null, location: s.location ?? "Clinic", notes: s.notes ?? null,
        })) as never,
      );
    }
    if (client.timeline?.length) {
      await supabase.from("client_timeline").insert(
        client.timeline.map((t) => ({
          client_id: newId, event_type: t.type, description: t.description, user_name: t.user ?? null, created_by: user.id,
        })) as never,
      );
    } else {
      await insertTimeline(newId, "Client created from lead", "system");
    }
    // Realtime will trigger refetch; return optimistic shape
    return { ...(client as Client), id: newId };
  }, [user, clients]);

  const updateClient = useCallback(async (id: string, patch: Partial<Client>) => {
    const dbPatch = clientPatchToDb(patch);
    if (Object.keys(dbPatch).length === 0) return;
    await supabase.from("clients").update(dbPatch as never).eq("id", id);
  }, []);

  const bulkUpdate = useCallback(async (ids: string[], patch: Partial<Client>) => {
    const dbPatch = clientPatchToDb(patch);
    if (Object.keys(dbPatch).length === 0 || !ids.length) return;
    await supabase.from("clients").update(dbPatch as never).in("id", ids);
  }, []);

  const moveStage = useCallback(async (ids: string[], stage: ClientStage) => {
    if (!ids.length) return;
    for (const id of ids) {
      const c = clients.find((x) => x.id === id);
      if (c && !canAdvanceToStage(c.stage, stage)) {
        throw new Error(`Pipeline stages must advance in order. Move from ${canonicalPipelineStage(c.stage)} to the next stage before ${stage}.`);
      }
      const nextLog = [...(c?.automationLog ?? []), `Stage moved to ${stage} (manual)`];
      await supabase.from("clients").update({
        stage, stage_entered_at: new Date().toISOString(), automation_log: nextLog,
      } as never).eq("id", id);
      await insertTimeline(id, `Moved to ${stage}`, "stage");
    }
  }, [clients, user]);

  const revertStage = useCallback(async (
    clientId: string,
    previousStage: ClientStage,
    previousStageEnteredAt: string,
    automationLogEntry: string,
  ) => {
    const c = clients.find((x) => x.id === clientId);
    if (!c) return;
    // Strip the most recent occurrence of the original automation log entry
    const log = [...(c.automationLog ?? [])];
    const idx = log.lastIndexOf(automationLogEntry);
    if (idx >= 0) log.splice(idx, 1);
    log.push(`Stage move undone — restored to ${previousStage}`);
    await supabase.from("clients").update({
      stage: previousStage,
      stage_entered_at: previousStageEnteredAt,
      automation_log: log,
    } as never).eq("id", clientId);
    await insertTimeline(clientId, `Move undone — restored to ${previousStage}`, "stage");
  }, [clients, user]);

  const assignBcba = useCallback(async (ids: string[], bcba: string) => {
    for (const id of ids) {
      const c = clients.find((x) => x.id === id);
      const advance = canonicalPipelineStage(c?.stage ?? "") === "BCBA Assignment";
      const blocked = Boolean(c?.paymentPlanRequired && !c.paymentPlanSigned);
      const nextLog = [...(c?.automationLog ?? []), `BCBA assigned: ${bcba}`, ...(blocked ? ["Progression blocked: payment plan not signed"] : ["Moved to Pending Initial Authorization"] )];
      await supabase.from("clients").update({
        bcba,
        ready_for_auth: !blocked,
        blockers: blocked ? Array.from(new Set([...(c?.blockers ?? []), "Payment plan not signed"])) : (c?.blockers ?? []).filter((blocker) => blocker !== "No BCBA assigned"),
        automation_log: nextLog,
        ...(advance && !blocked ? { stage: "Pending Initial Authorization" as ClientStage, stage_entered_at: new Date().toISOString(), auth_status: "Not Submitted" as AuthStatus, next_action: "Submit Initial Auth" } : {}),
      } as never).eq("id", id);
      await insertTimeline(id, blocked ? `BCBA ${bcba} assigned — payment plan blocks auth handoff` : `BCBA ${bcba} assigned — moved to Pending Initial Authorization`, "staffing");
    }
  }, [clients, user]);

  const assignRbt = useCallback(async (ids: string[], rbt: string) => {
    for (const id of ids) {
      const c = clients.find((x) => x.id === id);
      const advance = ["Staffing Needed", "Matching in Progress", "Restaffing Needed", "RBT Assigned"].includes(canonicalPipelineStage(c?.stage ?? ""));
      const nextLog = [...(c?.automationLog ?? []), `RBT assigned: ${rbt}`, ...(advance ? ["Moved to Pending Start Date"] : [])];
      await supabase.from("clients").update({
        rbt, staffing_status: "Assigned" as StaffingStatus, automation_log: nextLog, next_action: "Confirm schedule",
        ...(advance ? { stage: "Pending Start Date" as ClientStage, stage_entered_at: new Date().toISOString() } : {}),
      } as never).eq("id", id);
      await insertTimeline(id, `${rbt} assigned as RBT`, "staffing");
    }
  }, [clients, user]);

  const setStartDate = useCallback(async (ids: string[], date: string) => {
    for (const id of ids) {
      const c = clients.find((x) => x.id === id);
      const nextLog = [...(c?.automationLog ?? []), `Start date set to ${date}`];
      await supabase.from("clients").update({ start_date: date, automation_log: nextLog } as never).eq("id", id);
      await insertTimeline(id, `Start date set to ${date}`, "schedule");
    }
  }, [clients, user]);

  const toggleTask = useCallback(async (clientId: string, taskId: string) => {
    const c = clients.find((x) => x.id === clientId);
    const t = c?.tasks.find((x) => x.id === taskId);
    if (!t) return;
    await supabase.from("client_tasks").update({ completed: !t.completed } as never).eq("id", taskId);
  }, [clients]);

  const addTask = useCallback(async (clientId: string, task: ClientTask) => {
    const c = clients.find((x) => x.id === clientId);
    const position = (c?.tasks.length ?? 0);
    await supabase.from("client_tasks").insert({
      client_id: clientId, title: task.title, completed: task.completed,
      due_date: task.dueDate ?? null, position,
    } as never);
  }, [clients]);

  const appendTimeline = useCallback(async (
    clientId: string, description: string, type: ClientTimelineEvent["type"] = "note",
  ) => {
    await insertTimeline(clientId, description, type);
  }, [user]);

  const appendAutomation = useCallback(async (clientId: string, message: string) => {
    await appendAutomationLog(clientId, message);
  }, [clients]);

  const deleteClients = useCallback(async (ids: string[]) => {
    if (!ids.length) return;
    await supabase.from("clients").delete().in("id", ids);
  }, []);

  const addDocument = useCallback(async (clientId: string, name: string, type: string) => {
    await supabase.from("client_documents").insert({
      client_id: clientId, name, type, uploaded_by: user?.id,
    } as never);
  }, [user]);

  const removeDocument = useCallback(async (clientId: string, documentId: string) => {
    await supabase.from("client_documents").delete().eq("id", documentId);
  }, []);

  const addScheduleSlot = useCallback(async (clientId: string, slot: ScheduleSlot) => {
    await supabase.from("client_schedule_slots").insert({
      client_id: clientId, day: slot.day, start_time: slot.start, end_time: slot.end, rbt: slot.rbt ?? null, location: slot.location ?? "Clinic", notes: slot.notes ?? null,
    } as never);
  }, []);

  const removeScheduleSlot = useCallback(async (clientId: string, day: ScheduleSlot["day"]) => {
    await supabase.from("client_schedule_slots").delete().eq("client_id", clientId).eq("day", day);
  }, []);

  const setSchedule = useCallback(async (clientId: string, slots: ScheduleSlot[]) => {
    await supabase.from("client_schedule_slots").delete().eq("client_id", clientId);
    if (slots.length) {
      await supabase.from("client_schedule_slots").insert(
        slots.map((s) => ({
          client_id: clientId, day: s.day, start_time: s.start, end_time: s.end, rbt: s.rbt ?? null, location: s.location ?? "Clinic", notes: s.notes ?? null,
        })) as never,
      );
    }
  }, []);

  const value = useMemo<ClientsContextValue>(() => ({
    clients, loading, getClient,
    addClient, updateClient, bulkUpdate, moveStage, revertStage,
    assignBcba, assignRbt, setStartDate,
    toggleTask, addTask, appendTimeline, appendAutomation, deleteClients,
    addDocument, removeDocument, addScheduleSlot, removeScheduleSlot, setSchedule,
  }), [
    clients, loading, getClient, addClient, updateClient, bulkUpdate, moveStage, revertStage,
    assignBcba, assignRbt, setStartDate, toggleTask, addTask, appendTimeline,
    appendAutomation, deleteClients, addDocument, removeDocument, addScheduleSlot,
    removeScheduleSlot, setSchedule,
  ]);

  return <ClientsContext.Provider value={value}>{children}</ClientsContext.Provider>;
}

export function useClients() {
  const ctx = useContext(ClientsContext);
  if (!ctx) throw new Error("useClients must be used within <ClientsProvider>");
  return ctx;
}
