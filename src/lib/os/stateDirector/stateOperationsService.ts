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
 * All functions are best-effort: callers (e.g. stateDirectorStore) can
 * fire-and-forget while still updating their in-memory cache, so the UI
 * remains responsive whether or not the user has database access.
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

export async function updateTaskRow(id: UUID, patch: Record<string, unknown>) {
  await supabase.from("state_operational_tasks").update(patch as any).eq("id", id);
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

export async function updateEscalationRow(id: UUID, patch: Record<string, unknown>) {
  await supabase.from("state_operational_escalations").update(patch as any).eq("id", id);
}

export async function insertNote(input: {
  id?: UUID; parentType: "task" | "escalation"; parentId: UUID; state: StateCode;
  body: string; author: string;
}) {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id ?? null;
  await supabase.from("state_operational_notes").insert({
    id: input.id,
    state_code: input.state,
    parent_type: input.parentType,
    parent_id: input.parentId,
    body: input.body,
    created_by: uid,
    created_by_name: input.author,
  });
}

export async function insertActivity(input: {
  kind: ActivityKind; message: string; actor: string;
  state?: StateCode; relatedType?: "task" | "escalation" | "note" | "handoff"; relatedId?: UUID;
  metadata?: Record<string, unknown>;
}) {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id ?? null;
  await supabase.from("state_operational_activity").insert({
    state_code: input.state ?? null,
    event_kind: input.kind,
    message: input.message,
    actor_user_id: uid,
    actor_name: input.actor,
    related_type: input.relatedType ?? null,
    related_id: input.relatedId ?? null,
    metadata: input.metadata ?? null,
  } as any);
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
}) {
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
    throw new Error(handoffError.message);
  }
  const handoffId: string | undefined = handoff?.id;

  // 2) Companion operational task in the receiving department so it lands
  //    in that department's queue instead of getting lost in a handoff table.
  const taskResult = await insertTask({
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
    throw new Error(taskResult.error ?? "Handoff task could not be created");
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

  return handoff;
}