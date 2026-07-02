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
import {
  groupAuthsByClient, mondayRowToClient,
  type MondayAuthRow, type MondayClientRow,
} from "@/lib/clients/mondayClientMapper";
import {
  listSchedulingClientOverrides, listSchedulingScheduleSlots,
  upsertSchedulingClientOverride, upsertSchedulingScheduleSlot,
  removeSchedulingScheduleSlotsByClientDay, setSchedulingSchedule,
} from "@/hooks/useSchedulingClientState";

type Row<T> = T & Record<string, unknown>;

interface ClientsContextValue {
  clients: Client[];
  loading: boolean;
  /**
   * Warnings surfaced from the Scheduling overlay merge path. When the
   * durable Scheduling overlay tables cannot be read, refetch() populates
   * this with a human-readable message so Scheduling surfaces can warn
   * the user that they may be looking at stale Monday-only data.
   */
  dataWarnings: string[];
  schedulingOverlayError: string | null;
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
  // Structured flake/unreachable flag. Falls back to legacy blocker text or stage so
  // existing seeded data still surfaces under the Flaked Client queue.
  clientUnreachable:
    ((c as Row<DbClient>).client_unreachable as boolean | undefined) ??
    (c.stage === "Flaked" ||
      (c.blockers ?? []).some((b) => /flake|no\s*show|unreachable|cannot reach|can't reach/i.test(b))),
  clientUnreachableSince: ((c as Row<DbClient>).client_unreachable_since as string | null | undefined) ?? null,
  clientUnreachableReason: ((c as Row<DbClient>).client_unreachable_reason as string | null | undefined) ?? null,
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
  const [schedulingOverlayError, setSchedulingOverlayError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setSchedulingOverlayError(null);
    try {
      // Page through monday_clients_raw and monday_authorizations_raw.
      const fetchAll = async <T,>(table: "monday_clients_raw" | "monday_authorizations_raw"): Promise<T[]> => {
        const all: T[] = [];
        const pageSize = 1000;
        let from = 0;
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { data, error } = await supabase
            .from(table)
            .select("id, monday_item_id, monday_group, name, state, status, owner, data, imported_at, updated_at")
            .order("imported_at", { ascending: false })
            .range(from, from + pageSize - 1);
          if (error) throw error;
          const rows = (data ?? []) as unknown as T[];
          all.push(...rows);
          if (rows.length < pageSize || all.length >= 8000) break;
          from += pageSize;
        }
        return all;
      };

      const [clientRows, authRows] = await Promise.all([
        fetchAll<MondayClientRow>("monday_clients_raw"),
        fetchAll<MondayAuthRow>("monday_authorizations_raw"),
      ]);

      if (clientRows.length === 0) {
        setClients(mockClients);
        setLoading(false);
        return;
      }

      const authByClient = groupAuthsByClient(clientRows, authRows);
      const built = clientRows.map((row) =>
        mondayRowToClient(row, authByClient.get(row.monday_item_id ?? row.id) ?? []),
      );
      // Merge durable Scheduling overlay state (Pass 5).
      // Client ids here come from Monday and are NOT real public.clients.id —
      // overlays are keyed by the same id so we can rehydrate after refresh.
      const keys = built.map((c) => c.id);
      try {
        const [overrides, overlaySlots] = await Promise.all([
          listSchedulingClientOverrides(keys),
          listSchedulingScheduleSlots(keys),
        ]);
        const overrideByKey = new Map(overrides.map((o) => [o.client_key, o]));
        const slotsByKey = new Map<string, typeof overlaySlots>();
        for (const s of overlaySlots) {
          const arr = slotsByKey.get(s.client_key) ?? [];
          arr.push(s);
          slotsByKey.set(s.client_key, arr);
        }
        const merged = built.map((c) => {
          const ov = overrideByKey.get(c.id);
          const slots = slotsByKey.get(c.id);
          if (!ov && !slots) return c;
          const next: Client = { ...c };
          if (ov?.rbt_name) next.rbt = ov.rbt_name;
          if (ov?.start_date) next.startDate = ov.start_date;
          if (ov?.staffing_status) {
            const allowed: StaffingStatus[] = ["Not Needed", "In Progress", "Needed", "Assigned"];
            if (allowed.includes(ov.staffing_status as StaffingStatus)) {
              next.staffingStatus = ov.staffing_status as StaffingStatus;
            }
          }
          if (ov?.scheduling_status) {
            next.schedulingStatus = ov.scheduling_status as ClientSchedulingStatus;
          }
          if (slots && slots.length > 0) {
            next.schedule = slots.map((s) => ({
              day: s.day, start: s.start_time, end: s.end_time,
              rbt: s.rbt_name ?? undefined,
              location: (s.location as ScheduleSlot["location"]) ?? undefined,
              notes: s.notes ?? undefined,
            }));
            next.automationLog = [...next.automationLog, "Scheduling overlay applied from Blossom OS"];
          }
          return next;
        });
        setClients(merged);
      } catch (overlayErr) {
        console.warn("Scheduling overlay merge failed", overlayErr);
        const message =
          (overlayErr as { message?: string } | null)?.message ||
          "Scheduling overlay could not be loaded. Showing Monday-only data.";
        setSchedulingOverlayError(message);
        setClients(built);
      }
    } catch (e) {
      console.error("Clients fetch (Monday) error", e);
      setClients(mockClients);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    void refetch();
  }, [authLoading, refetch]);

  /* ──────────────── Mutations ──────────────── */

  const getClient = useCallback((id: string) => clients.find((c) => c.id === id), [clients]);

  // ─── Mutation helpers ───────────────────────────────────────────────
  // Monday is still the import baseline for client identity, but
  // Scheduling-critical mutations (assignRbt, setStartDate, schedule
  // slot helpers) ALSO persist to the durable Scheduling overlay tables
  // (scheduling_client_overrides, scheduling_client_schedule_slots) so
  // they survive refresh and Monday re-import. Other helpers remain
  // optimistic in-memory updates until those workflows get their own
  // overlays.

  const applyPatch = (id: string, patch: Partial<Client>) =>
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const applyPatchMany = (ids: string[], patch: Partial<Client>) =>
    setClients((prev) => prev.map((c) => (ids.includes(c.id) ? { ...c, ...patch } : c)));

  const pushTimeline = (clientId: string, description: string, type: ClientTimelineEvent["type"] = "note") =>
    setClients((prev) => prev.map((c) => c.id !== clientId ? c : {
      ...c,
      timeline: [{
        id: `tl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type, description, timestamp: new Date().toISOString(), user: "You",
      }, ...c.timeline],
    }));

  const pushAutomation = (clientId: string, message: string) =>
    setClients((prev) => prev.map((c) => c.id !== clientId ? c : {
      ...c, automationLog: [...c.automationLog, message],
    }));

  const addClient = useCallback(async (client: Omit<Client, "id"> & { id?: string }) => {
    const id = client.id ?? `local-${Date.now()}`;
    const created: Client = { ...(client as Client), id };
    setClients((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateClient = useCallback(async (id: string, patch: Partial<Client>) => {
    applyPatch(id, patch);
  }, []);

  const bulkUpdate = useCallback(async (ids: string[], patch: Partial<Client>) => {
    applyPatchMany(ids, patch);
  }, []);

  const moveStage = useCallback(async (ids: string[], stage: ClientStage) => {
    for (const id of ids) {
      const c = clients.find((x) => x.id === id);
      if (c && !canAdvanceToStage(c.stage, stage)) {
        throw new Error(`Pipeline stages must advance in order. Move from ${canonicalPipelineStage(c.stage)} to the next stage before ${stage}.`);
      }
      applyPatch(id, { stage, daysInStage: 0 });
      pushAutomation(id, `Stage moved to ${stage} (manual)`);
      pushTimeline(id, `Moved to ${stage}`, "stage");
    }
  }, [clients]);

  const revertStage = useCallback(async (
    clientId: string, previousStage: ClientStage, _previousStageEnteredAt: string, automationLogEntry: string,
  ) => {
    setClients((prev) => prev.map((c) => {
      if (c.id !== clientId) return c;
      const log = [...c.automationLog];
      const idx = log.lastIndexOf(automationLogEntry);
      if (idx >= 0) log.splice(idx, 1);
      log.push(`Stage move undone — restored to ${previousStage}`);
      return { ...c, stage: previousStage, automationLog: log };
    }));
    pushTimeline(clientId, `Move undone — restored to ${previousStage}`, "stage");
  }, []);

  const assignBcba = useCallback(async (ids: string[], bcba: string) => {
    for (const id of ids) {
      applyPatch(id, { bcba });
      pushAutomation(id, `BCBA assigned: ${bcba}`);
      pushTimeline(id, `${bcba} assigned as BCBA`, "staffing");
    }
  }, []);

  const assignRbt = useCallback(async (ids: string[], rbt: string) => {
    for (const id of ids) {
      applyPatch(id, { rbt, staffingStatus: "Assigned" });
      pushAutomation(id, `RBT assigned: ${rbt}`);
      pushTimeline(id, `${rbt} assigned as RBT`, "staffing");
      const c = clients.find((x) => x.id === id);
      try {
        await upsertSchedulingClientOverride({
          clientKey: id,
          clientName: c?.childName ?? null,
          state: c?.state ?? null,
          sourceRecordId: id,
          rbtName: rbt,
          staffingStatus: "Assigned",
          centralReachSyncStatus: "not_ready",
          metadata: { source: "scheduling_assign_rbt" },
        });
      } catch (err) {
        console.warn("assignRbt overlay persist failed", err);
      }
    }
  }, [clients]);

  const setStartDate = useCallback(async (ids: string[], date: string) => {
    for (const id of ids) {
      applyPatch(id, { startDate: date });
      pushAutomation(id, `Start date set to ${date}`);
      pushTimeline(id, `Start date set to ${date}`, "schedule");
      const c = clients.find((x) => x.id === id);
      try {
        await upsertSchedulingClientOverride({
          clientKey: id,
          clientName: c?.childName ?? null,
          state: c?.state ?? null,
          sourceRecordId: id,
          startDate: date,
          centralReachSyncStatus: "not_ready",
          metadata: { source: "scheduling_start_date" },
        });
      } catch (err) {
        console.warn("setStartDate overlay persist failed", err);
      }
    }
  }, [clients]);

  const toggleTask = useCallback(async (clientId: string, taskId: string) => {
    setClients((prev) => prev.map((c) => c.id !== clientId ? c : {
      ...c, tasks: c.tasks.map((t) => t.id === taskId ? { ...t, completed: !t.completed } : t),
    }));
  }, []);

  const addTask = useCallback(async (clientId: string, task: ClientTask) => {
    setClients((prev) => prev.map((c) => c.id !== clientId ? c : { ...c, tasks: [...c.tasks, task] }));
  }, []);

  const appendTimeline = useCallback(async (clientId: string, description: string, type: ClientTimelineEvent["type"] = "note") => {
    pushTimeline(clientId, description, type);
  }, []);

  const appendAutomation = useCallback(async (clientId: string, message: string) => {
    pushAutomation(clientId, message);
  }, []);

  const deleteClients = useCallback(async (ids: string[]) => {
    setClients((prev) => prev.filter((c) => !ids.includes(c.id)));
  }, []);

  const addDocument = useCallback(async (clientId: string, name: string, type: string) => {
    setClients((prev) => prev.map((c) => c.id !== clientId ? c : { ...c, documents: [...c.documents, { name, type }] }));
  }, []);

  const removeDocument = useCallback(async (clientId: string, documentId: string) => {
    setClients((prev) => prev.map((c) => c.id !== clientId ? c : { ...c, documents: c.documents.filter((_, i) => String(i) !== documentId) }));
  }, []);

  const addScheduleSlot = useCallback(async (clientId: string, slot: ScheduleSlot) => {
    setClients((prev) => prev.map((c) => c.id !== clientId ? c : { ...c, schedule: [...c.schedule.filter((s) => s.day !== slot.day), slot] }));
    const c = clients.find((x) => x.id === clientId);
    try {
      // Replace any existing overlay slot(s) for this day before inserting
      // the new one so the unique (client_key, day, start, end) constraint
      // does not conflict and so the client only has one slot per day in
      // the overlay table.
      await removeSchedulingScheduleSlotsByClientDay(clientId, slot.day);
      await upsertSchedulingScheduleSlot({
        clientKey: clientId,
        clientName: c?.childName ?? null,
        state: c?.state ?? null,
        sourceRecordId: clientId,
        slot,
      });
    } catch (err) {
      console.warn("addScheduleSlot overlay persist failed", err);
    }
  }, [clients]);

  const removeScheduleSlot = useCallback(async (clientId: string, day: ScheduleSlot["day"]) => {
    setClients((prev) => prev.map((c) => c.id !== clientId ? c : { ...c, schedule: c.schedule.filter((s) => s.day !== day) }));
    try {
      await removeSchedulingScheduleSlotsByClientDay(clientId, day);
    } catch (err) {
      console.warn("removeScheduleSlot overlay persist failed", err);
    }
  }, []);

  const setSchedule = useCallback(async (clientId: string, slots: ScheduleSlot[]) => {
    setClients((prev) => prev.map((c) => c.id !== clientId ? c : { ...c, schedule: slots }));
    const c = clients.find((x) => x.id === clientId);
    try {
      await setSchedulingSchedule(
        { clientKey: clientId, clientName: c?.childName ?? null, state: c?.state ?? null, sourceRecordId: clientId },
        slots,
      );
    } catch (err) {
      console.warn("setSchedule overlay persist failed", err);
    }
  }, [clients]);

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
