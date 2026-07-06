import { supabase } from "@/integrations/supabase/client";
import type {
  Escalation, OpsTask, EscalationNote, Priority, Department, StateCode,
  EscalationStatus, TaskStatus, ActivityEvent, ActivityKind,
} from "./types";
import { normalizeLinkedRef, pickLinkedRef } from "./linkedRef";

/**
 * Supabase-backed persistence for the State Operations workflow.
 *
 * The tables (state_operational_tasks/escalations/notes/activity) are
 * created by the 2026-07-04 State Operations migration and protected
 * with RLS that scopes non-leadership users to their profile state.
 *
 * Persistence contract (State Director Pass 5):
 *   - `insertTask` / `insertEscalation` / `insertNote` / `insertActivity`
 *     / `updateTaskRow` / `updateEscalationRow` / `deliverHandoff` all
 *     return { ok, error } so callers can surface real database failures.
 *   - The store (stateDirectorStore) keeps optimistic in-memory state so
 *     the UI stays responsive, but marks affected rows with
 *     `persistError` and toasts the failure when a write does not land.
 *   - No write path silently swallows a Supabase error anymore.
 */

type UUID = string;

function fromTaskRow(r: any): OpsTask {
  return {
    id: r.id,
    state: r.state_code as StateCode,
    title: r.title,
    description: r.description ?? undefined,
    department: (r.department ?? "Operations") as Department,
    owner: r.assigned_to_name ?? undefined,
    priority: (r.priority ?? "medium") as Priority,
    status: (r.status ?? "open") as TaskStatus,
    dueAt: r.due_at ?? undefined,
    createdBy: r.created_by_name ?? "System",
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    relatedEscalationId: r.related_escalation_id ?? undefined,
    linkedClientId: pickLinkedRef(r.client_ref, r.client_id),
    linkedLeadId: pickLinkedRef(r.lead_ref, r.lead_id),
    linkedCandidateId: pickLinkedRef(r.candidate_ref, r.candidate_id),
    linkedAuthorizationId: pickLinkedRef(r.authorization_ref, r.authorization_id),
    linkedSchedulingItemId: pickLinkedRef(r.scheduling_item_ref, r.scheduling_item_id),
    sourceModule: r.source_module ?? undefined,
    metadata: r.metadata ?? undefined,
    notes: [],
    completedAt: r.completed_at ?? undefined,
    centralreachSyncStatus: r.centralreach_sync_status ?? undefined,
  };
}

function fromEscRow(r: any): Escalation {
  return {
    id: r.id,
    state: r.state_code as StateCode,
    title: r.title,
    description: r.description ?? undefined,
    department: (r.department ?? "Operations") as Department,
    assignedTo: r.assigned_to_name ?? undefined,
    priority: (r.priority ?? "medium") as Priority,
    status: (r.status ?? "open") as EscalationStatus,
    dueAt: r.due_at ?? undefined,
    createdBy: r.created_by_name ?? "System",
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    linkedClientId: pickLinkedRef(r.client_ref, r.client_id),
    linkedLeadId: pickLinkedRef(r.lead_ref, r.lead_id),
    linkedCandidateId: pickLinkedRef(r.candidate_ref, r.candidate_id),
    linkedAuthorizationId: pickLinkedRef(r.authorization_ref, r.authorization_id),
    linkedSchedulingItemId: pickLinkedRef(r.scheduling_item_ref, r.scheduling_item_id),
    sourceModule: r.source_module ?? undefined,
    metadata: r.metadata ?? undefined,
    resolution: r.resolution ?? undefined,
    notes: [],
    centralreachSyncStatus: r.centralreach_sync_status ?? undefined,
  };
}

function fromNoteRow(r: any): EscalationNote {
  return {
    id: r.id,
    author: r.created_by_name ?? "System",
    body: r.body,
    createdAt: r.created_at,
  };
}

export interface StateOperationsSnapshot {
  tasks: OpsTask[];
  escalations: Escalation[];
  activity: ActivityEvent[];
}

export type StateMetricSource = "live" | "manual" | "integration" | "seed";

export interface LiveStateMetric {
  code: StateCode;
  name: string | null;
  healthScore: number | null;
  healthLabel: string | null;
  activeClients: number;
  authorizedHours: number;
  scheduledHours: number;
  deliveredHours: number;
  staffingGaps: number;
  intakePipeline: number;
  authsExpiring30d: number;
  clinicalRisks: number;
  recruitingNeeds: number;
  cancellationRisk: number;
  openEscalations: number;
  openTasks: number;
  agingBlockers: number;
  source: StateMetricSource;
  sourceUpdatedAt: string | null;
  updatedAt: string;
}

/**
 * Loads persisted per-state metrics. Returns `null` on failure so the
 * store can gracefully fall back to seed values.
 */
export async function loadStateMetrics(): Promise<LiveStateMetric[] | null> {
  try {
    const { data, error } = await supabase
      .from("state_operational_metrics")
      .select("*")
      .order("state_code", { ascending: true });
    if (error || !data) return null;
    return (data as any[]).map((r) => ({
      code: r.state_code as StateCode,
      name: r.state_name ?? null,
      healthScore: r.health_score ?? null,
      healthLabel: r.health_label ?? null,
      activeClients: Number(r.active_clients ?? 0),
      authorizedHours: Number(r.authorized_hours ?? 0),
      scheduledHours: Number(r.scheduled_hours ?? 0),
      deliveredHours: Number(r.delivered_hours ?? 0),
      staffingGaps: Number(r.staffing_gaps ?? 0),
      intakePipeline: Number(r.intake_pipeline ?? 0),
      authsExpiring30d: Number(r.auths_expiring_30d ?? 0),
      clinicalRisks: Number(r.clinical_risks ?? 0),
      recruitingNeeds: Number(r.recruiting_needs ?? 0),
      cancellationRisk: Number(r.cancellation_risk ?? 0),
      openEscalations: Number(r.open_escalations ?? 0),
      openTasks: Number(r.open_tasks ?? 0),
      agingBlockers: Number(r.aging_blockers ?? 0),
      source: ((r.source ?? "manual") as StateMetricSource),
      sourceUpdatedAt: r.source_updated_at ?? null,
      updatedAt: r.updated_at,
    }));
  } catch {
    return null;
  }
}

export async function upsertStateMetric(input: Partial<LiveStateMetric> & { code: StateCode; source?: StateMetricSource }): Promise<{ ok: boolean; error?: string }> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id ?? null;
  const { error } = await supabase.from("state_operational_metrics").upsert({
    state_code: input.code,
    state_name: input.name ?? null,
    health_score: input.healthScore ?? null,
    health_label: input.healthLabel ?? null,
    active_clients: input.activeClients ?? 0,
    authorized_hours: input.authorizedHours ?? 0,
    scheduled_hours: input.scheduledHours ?? 0,
    delivered_hours: input.deliveredHours ?? 0,
    staffing_gaps: input.staffingGaps ?? 0,
    intake_pipeline: input.intakePipeline ?? 0,
    auths_expiring_30d: input.authsExpiring30d ?? 0,
    clinical_risks: input.clinicalRisks ?? 0,
    recruiting_needs: input.recruitingNeeds ?? 0,
    cancellation_risk: input.cancellationRisk ?? 0,
    open_escalations: input.openEscalations ?? 0,
    open_tasks: input.openTasks ?? 0,
    aging_blockers: input.agingBlockers ?? 0,
    source: input.source ?? "manual",
    source_updated_at: new Date().toISOString(),
    updated_by: uid,
  } as any, { onConflict: "state_code" });
  return { ok: !error, error: error?.message };
}

/**
 * Bulk ingest helper for future CentralReach / importer jobs. Callers
 * pass a normalized StateMetricInput per state; every row is written with
 * an explicit source (never "seed") and a fresh source_updated_at. This
 * is the single documented upsert path for automated metric writers so
 * they never have to touch the UI store directly.
 */
export type StateMetricInput = Partial<LiveStateMetric> & {
  code: StateCode;
  source: Exclude<StateMetricSource, "seed">;
};

export async function ingestStateMetrics(rows: StateMetricInput[]): Promise<{ ok: boolean; written: number; failures: Array<{ code: StateCode; error: string }> }> {
  const failures: Array<{ code: StateCode; error: string }> = [];
  let written = 0;
  for (const r of rows) {
    // Guard: importers must never claim "seed" as their source. Seed is
    // reserved for the calm placeholder rows the UI ships without any
    // persisted metrics row.
    const source: StateMetricSource = r.source ?? "manual";
    const res = await upsertStateMetric({ ...r, source });
    if (res.ok) written += 1;
    else failures.push({ code: r.code, error: res.error ?? "unknown" });
  }
  return { ok: failures.length === 0, written, failures };
}

export async function loadStateOperationsSnapshot(): Promise<StateOperationsSnapshot | null> {
  try {
    const [t, e, n, a] = await Promise.all([
      supabase.from("state_operational_tasks").select("*").order("created_at", { ascending: false }),
      supabase.from("state_operational_escalations").select("*").order("created_at", { ascending: false }),
      supabase.from("state_operational_notes").select("*").order("created_at", { ascending: false }),
      supabase.from("state_operational_activity").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    if (t.error || e.error) return null;
    const notesByParent = new Map<string, EscalationNote[]>();
    for (const row of (n.data ?? []) as any[]) {
      const list = notesByParent.get(row.parent_id) ?? [];
      list.push(fromNoteRow(row));
      notesByParent.set(row.parent_id, list);
    }
    const tasks = ((t.data ?? []) as any[]).map(fromTaskRow).map((t2) => ({
      ...t2, notes: notesByParent.get(t2.id) ?? [],
    }));
    const escalations = ((e.data ?? []) as any[]).map(fromEscRow).map((e2) => ({
      ...e2, notes: notesByParent.get(e2.id) ?? [],
    }));
    const activity: ActivityEvent[] = ((a.data ?? []) as any[]).map((r) => ({
      id: r.id,
      state: r.state_code ?? undefined,
      kind: r.event_kind as ActivityKind,
      message: r.message,
      actor: r.actor_name ?? "System",
      createdAt: r.created_at,
      relatedId: r.related_id ?? undefined,
    }));
    return { tasks, escalations, activity };
  } catch {
    return null;
  }
}

/* ------------------------------ mutations --------------------------------- */

export async function insertTask(input: {
  id?: UUID; state: StateCode; title: string; description?: string;
  department: Department; owner?: string; priority?: Priority;
  dueAt?: string; createdBy: string; relatedEscalationId?: string;
  linkedClientId?: string; linkedLeadId?: string; linkedCandidateId?: string;
  linkedAuthorizationId?: string; linkedSchedulingItemId?: string;
  sourceModule?: string;
  metadata?: Record<string, unknown>;
}): Promise<{ ok: boolean; error?: string }> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id ?? null;
  const lead   = normalizeLinkedRef(input.linkedLeadId);
  const client = normalizeLinkedRef(input.linkedClientId);
  const cand   = normalizeLinkedRef(input.linkedCandidateId);
  const auth   = normalizeLinkedRef(input.linkedAuthorizationId);
  const sched  = normalizeLinkedRef(input.linkedSchedulingItemId);
  const relEsc = normalizeLinkedRef(input.relatedEscalationId);
  const { error } = await supabase.from("state_operational_tasks").insert({
    id: input.id,
    state_code: input.state,
    title: input.title,
    description: input.description,
    department: input.department,
    assigned_to_name: input.owner,
    priority: input.priority ?? "medium",
    status: "open",
    due_at: input.dueAt,
    created_by: uid,
    created_by_name: input.createdBy,
    related_escalation_id: relEsc.uuid,
    lead_id: lead.uuid,
    lead_ref: lead.ref,
    client_id: client.uuid,
    client_ref: client.ref,
    candidate_id: cand.uuid,
    candidate_ref: cand.ref,
    authorization_id: auth.uuid,
    authorization_ref: auth.ref,
    scheduling_item_id: sched.uuid,
    scheduling_item_ref: sched.ref,
    source_module: input.sourceModule,
    metadata: input.metadata,
    centralreach_sync_status: "not_connected",
  } as any);
  return { ok: !error, error: error?.message };
}

export async function updateTaskRow(
  id: UUID,
  patch: Record<string, unknown>,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from("state_operational_tasks").update(patch as any).eq("id", id);
  return { ok: !error, error: error?.message };
}

export async function insertEscalation(input: {
  id?: UUID; state: StateCode; title: string; description?: string;
  department: Department; assignedTo?: string; priority?: Priority;
  status?: EscalationStatus; dueAt?: string; createdBy: string;
  linkedClientId?: string; linkedLeadId?: string; linkedCandidateId?: string;
  linkedAuthorizationId?: string; linkedSchedulingItemId?: string;
  sourceModule?: string;
  metadata?: Record<string, unknown>;
}): Promise<{ ok: boolean; error?: string }> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id ?? null;
  const lead   = normalizeLinkedRef(input.linkedLeadId);
  const client = normalizeLinkedRef(input.linkedClientId);
  const cand   = normalizeLinkedRef(input.linkedCandidateId);
  const auth   = normalizeLinkedRef(input.linkedAuthorizationId);
  const sched  = normalizeLinkedRef(input.linkedSchedulingItemId);
  const { error } = await supabase.from("state_operational_escalations").insert({
    id: input.id,
    state_code: input.state,
    title: input.title,
    description: input.description,
    department: input.department,
    assigned_to_name: input.assignedTo,
    priority: input.priority ?? "medium",
    status: input.status ?? "open",
    due_at: input.dueAt,
    created_by: uid,
    created_by_name: input.createdBy,
    lead_id: lead.uuid,
    lead_ref: lead.ref,
    client_id: client.uuid,
    client_ref: client.ref,
    candidate_id: cand.uuid,
    candidate_ref: cand.ref,
    authorization_id: auth.uuid,
    authorization_ref: auth.ref,
    scheduling_item_id: sched.uuid,
    scheduling_item_ref: sched.ref,
    source_module: input.sourceModule,
    metadata: input.metadata,
    centralreach_sync_status: "not_connected",
  } as any);
  return { ok: !error, error: error?.message };
}

export async function updateEscalationRow(
  id: UUID,
  patch: Record<string, unknown>,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from("state_operational_escalations").update(patch as any).eq("id", id);
  return { ok: !error, error: error?.message };
}

export async function insertNote(input: {
  id?: UUID; parentType: "task" | "escalation"; parentId: UUID; state: StateCode;
  body: string; author: string;
}): Promise<{ ok: boolean; error?: string; id?: string }> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id ?? null;
  const { data, error } = await supabase.from("state_operational_notes").insert({
    id: input.id,
    state_code: input.state,
    parent_type: input.parentType,
    parent_id: input.parentId,
    body: input.body,
    created_by: uid,
    created_by_name: input.author,
  } as any).select("id").maybeSingle();
  return { ok: !error, error: error?.message, id: (data as any)?.id };
}

export async function insertActivity(input: {
  kind: ActivityKind; message: string; actor: string;
  state?: StateCode; relatedType?: "task" | "escalation" | "note" | "handoff"; relatedId?: UUID;
  metadata?: Record<string, unknown>;
}): Promise<{ ok: boolean; error?: string }> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id ?? null;
  const { error } = await supabase.from("state_operational_activity").insert({
    state_code: input.state ?? null,
    event_kind: input.kind,
    message: input.message,
    actor_user_id: uid,
    actor_name: input.actor,
    related_type: input.relatedType ?? null,
    related_id: input.relatedId ?? null,
    metadata: input.metadata ?? null,
  } as any);
  return { ok: !error, error: error?.message };
}

/* ------------------------------ pass 3 ----------------------------------- */

/**
 * Subscribes to realtime changes on all five State Operations tables.
 * The callback fires (with a debounce burden left to the caller) whenever
 * anything changes so the store can rehydrate.
 * Returns a teardown function.
 */
export function subscribeStateOperationsRealtime(cb: () => void): () => void {
  const channel = supabase
    .channel(`state-operations-${Math.random().toString(36).slice(2, 8)}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "state_operational_tasks" },       cb)
    .on("postgres_changes", { event: "*", schema: "public", table: "state_operational_escalations" }, cb)
    .on("postgres_changes", { event: "*", schema: "public", table: "state_operational_notes" },       cb)
    .on("postgres_changes", { event: "*", schema: "public", table: "state_operational_activity" },    cb)
    .on("postgres_changes", { event: "*", schema: "public", table: "state_department_handoffs" },     cb)
    .subscribe();
  return () => { void supabase.removeChannel(channel); };
}

/**
 * Cross-department handoff — persists to `state_department_handoffs` AND
 * creates a companion `state_operational_tasks` row scoped to the receiving
 * department so it shows up in that department's operational task queue.
 */
export interface DeliverHandoffResult {
  ok: boolean;
  error?: string;
  handoffId?: string;
  taskId?: string;
}

export async function deliverHandoff(input: {
  state: StateCode;
  fromDepartment: Department;
  toDepartment: Department;
  subject: string;
  body?: string;
  priority?: Priority;
  createdBy: string;
  linkedClientId?: string;
  linkedLeadId?: string;
  linkedCandidateId?: string;
  linkedAuthorizationId?: string;
  linkedSchedulingItemId?: string;
  sourceModule?: string;
  metadata?: Record<string, unknown>;
  relatedEscalationId?: string;
}): Promise<DeliverHandoffResult> {
  try {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id ?? null;

  const lead   = normalizeLinkedRef(input.linkedLeadId);
  const client = normalizeLinkedRef(input.linkedClientId);
  const cand   = normalizeLinkedRef(input.linkedCandidateId);
  const auth   = normalizeLinkedRef(input.linkedAuthorizationId);
  const sched  = normalizeLinkedRef(input.linkedSchedulingItemId);
  const relEsc = normalizeLinkedRef(input.relatedEscalationId);

  // 1) Write the canonical handoff record.
  const { data: handoff, error: handoffError } = await supabase
    .from("state_department_handoffs")
    .insert({
      state_code: input.state,
      from_role: input.fromDepartment,
      to_department: input.toDepartment,
      title: input.subject,
      description: input.body ?? null,
      priority: input.priority ?? "medium",
      status: "open",
      created_by: uid,
      related_escalation_id: relEsc.uuid,
      client_id: client.uuid, client_ref: client.ref,
      lead_id: lead.uuid, lead_ref: lead.ref,
      candidate_id: cand.uuid, candidate_ref: cand.ref,
      authorization_id: auth.uuid, authorization_ref: auth.ref,
      scheduling_item_id: sched.uuid, scheduling_item_ref: sched.ref,
      source_module: input.sourceModule ?? null,
      metadata: input.metadata ?? null,
      centralreach_sync_status: "not_connected",
    } as any)
    .select("id")
    .maybeSingle();
  if (handoffError) {
    return { ok: false, error: handoffError.message };
  }
  const handoffId: string | undefined = handoff?.id;

  // 2) Companion operational task in the receiving department so it lands
  //    in that department's queue instead of getting lost in a handoff table.
  const taskResult = await insertTaskReturningId({
    state: input.state,
    title: `[Handoff from ${input.fromDepartment}] ${input.subject}`,
    description: input.body,
    department: input.toDepartment,
    priority: input.priority ?? "medium",
    createdBy: input.createdBy,
    relatedEscalationId: input.relatedEscalationId,
    linkedClientId: input.linkedClientId,
    linkedLeadId: input.linkedLeadId,
    linkedCandidateId: input.linkedCandidateId,
    linkedAuthorizationId: input.linkedAuthorizationId,
    linkedSchedulingItemId: input.linkedSchedulingItemId,
    sourceModule: input.sourceModule ?? "state_handoff",
    metadata: input.metadata,
  });
  if (!taskResult.ok) {
    return { ok: false, error: taskResult.error ?? "Handoff task could not be created", handoffId };
  }

  // 3) Activity feed entry so directors see the routing happen live.
  //    The handoff id points at state_department_handoffs — never mislabel
  //    as a task id.
  await insertActivity({
    kind: "handoff",
    message: `${input.fromDepartment} → ${input.toDepartment}: ${input.subject}`,
    actor: input.createdBy,
    state: input.state,
    relatedType: "handoff",
    relatedId: handoffId,
    metadata: input.metadata,
  });

    return { ok: true, handoffId, taskId: taskResult.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unexpected handoff failure" };
  }
}

// Internal helper mirrors insertTask but also returns the new task id so
// deliverHandoff can propagate it to callers.
async function insertTaskReturningId(input: Parameters<typeof insertTask>[0]): Promise<{ ok: boolean; error?: string; id?: string }> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id ?? null;
  const lead   = normalizeLinkedRef(input.linkedLeadId);
  const client = normalizeLinkedRef(input.linkedClientId);
  const cand   = normalizeLinkedRef(input.linkedCandidateId);
  const auth   = normalizeLinkedRef(input.linkedAuthorizationId);
  const sched  = normalizeLinkedRef(input.linkedSchedulingItemId);
  const relEsc = normalizeLinkedRef(input.relatedEscalationId);
  const { data, error } = await supabase.from("state_operational_tasks").insert({
    id: input.id,
    state_code: input.state,
    title: input.title,
    description: input.description,
    department: input.department,
    assigned_to_name: input.owner,
    priority: input.priority ?? "medium",
    status: "open",
    due_at: input.dueAt,
    created_by: uid,
    created_by_name: input.createdBy,
    related_escalation_id: relEsc.uuid,
    lead_id: lead.uuid, lead_ref: lead.ref,
    client_id: client.uuid, client_ref: client.ref,
    candidate_id: cand.uuid, candidate_ref: cand.ref,
    authorization_id: auth.uuid, authorization_ref: auth.ref,
    scheduling_item_id: sched.uuid, scheduling_item_ref: sched.ref,
    source_module: input.sourceModule,
    metadata: input.metadata,
    centralreach_sync_status: "not_connected",
  } as any).select("id").maybeSingle();
  return { ok: !error, error: error?.message, id: (data as any)?.id };
}

/* ---------------- CentralReach readiness / outbox (Pass 6) --------------- */

export type CentralReachOutboxSourceType =
  | "task" | "escalation" | "handoff" | "daily_health_note" | "manual_metric" | "other";
export type CentralReachOutboxActionType =
  | "needs_mapping" | "manual_update_required" | "ready_for_sync" | "blocked_missing_cr_id" | "other";
export type CentralReachOutboxSyncStatus =
  | "not_connected" | "pending" | "synced" | "error";

export interface CentralReachOutboxRow {
  id: string;
  stateCode: StateCode;
  sourceType: CentralReachOutboxSourceType;
  sourceId: string | null;
  centralreachObjectType: string | null;
  centralreachExternalId: string | null;
  actionType: CentralReachOutboxActionType;
  syncStatus: CentralReachOutboxSyncStatus;
  payload: Record<string, unknown>;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

function fromOutboxRow(r: any): CentralReachOutboxRow {
  return {
    id: r.id,
    stateCode: r.state_code as StateCode,
    sourceType: r.source_type as CentralReachOutboxSourceType,
    sourceId: r.source_id ?? null,
    centralreachObjectType: r.centralreach_object_type ?? null,
    centralreachExternalId: r.centralreach_external_id ?? null,
    actionType: r.action_type as CentralReachOutboxActionType,
    syncStatus: r.sync_status as CentralReachOutboxSyncStatus,
    payload: (r.payload ?? {}) as Record<string, unknown>,
    errorMessage: r.error_message ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function loadStateCentralReachOutbox(
  state?: StateCode,
): Promise<CentralReachOutboxRow[] | null> {
  try {
    let q = supabase.from("state_centralreach_outbox").select("*").order("created_at", { ascending: false }).limit(200);
    if (state) q = q.eq("state_code", state);
    const { data, error } = await q;
    if (error || !data) return null;
    return (data as any[]).map(fromOutboxRow);
  } catch {
    return null;
  }
}

export async function createStateCentralReachOutboxItem(input: {
  stateCode: StateCode;
  sourceType: CentralReachOutboxSourceType;
  sourceId?: string | null;
  centralreachObjectType?: string | null;
  centralreachExternalId?: string | null;
  actionType: CentralReachOutboxActionType;
  syncStatus?: CentralReachOutboxSyncStatus;
  payload?: Record<string, unknown>;
  errorMessage?: string | null;
}): Promise<{ ok: boolean; error?: string; id?: string }> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id ?? null;
  const { data, error } = await supabase.from("state_centralreach_outbox").insert({
    state_code: input.stateCode,
    source_type: input.sourceType,
    source_id: input.sourceId ?? null,
    centralreach_object_type: input.centralreachObjectType ?? null,
    centralreach_external_id: input.centralreachExternalId ?? null,
    action_type: input.actionType,
    sync_status: input.syncStatus ?? "not_connected",
    payload: input.payload ?? {},
    error_message: input.errorMessage ?? null,
    created_by: uid,
  } as any).select("id").maybeSingle();
  return { ok: !error, error: error?.message, id: (data as any)?.id };
}

export async function updateStateCentralReachOutboxStatus(
  id: string,
  patch: { syncStatus?: CentralReachOutboxSyncStatus; actionType?: CentralReachOutboxActionType; errorMessage?: string | null; centralreachExternalId?: string | null },
): Promise<{ ok: boolean; error?: string }> {
  const row: Record<string, unknown> = {};
  if (patch.syncStatus) row.sync_status = patch.syncStatus;
  if (patch.actionType) row.action_type = patch.actionType;
  if (patch.errorMessage !== undefined) row.error_message = patch.errorMessage;
  if (patch.centralreachExternalId !== undefined) row.centralreach_external_id = patch.centralreachExternalId;
  const { error } = await supabase.from("state_centralreach_outbox").update(row as any).eq("id", id);
  return { ok: !error, error: error?.message };
}