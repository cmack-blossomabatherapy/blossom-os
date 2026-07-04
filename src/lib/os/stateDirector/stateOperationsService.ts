import { supabase } from "@/integrations/supabase/client";
import type {
  Escalation, OpsTask, EscalationNote, Priority, Department, StateCode,
  EscalationStatus, TaskStatus, ActivityEvent, ActivityKind,
} from "./types";

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
    linkedClientId: r.client_id ?? undefined,
    linkedLeadId: r.lead_id ?? undefined,
    linkedCandidateId: r.candidate_id ?? undefined,
    notes: [],
    completedAt: r.completed_at ?? undefined,
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
    linkedClientId: r.client_id ?? undefined,
    linkedLeadId: r.lead_id ?? undefined,
    linkedCandidateId: r.candidate_id ?? undefined,
    resolution: r.resolution ?? undefined,
    notes: [],
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
  sourceModule?: string;
}) {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id ?? null;
  await supabase.from("state_operational_tasks").insert({
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
    related_escalation_id: input.relatedEscalationId,
    lead_id: input.linkedLeadId,
    client_id: input.linkedClientId,
    candidate_id: input.linkedCandidateId,
    source_module: input.sourceModule,
    centralreach_sync_status: "not_connected",
  });
}

export async function updateTaskRow(id: UUID, patch: Record<string, unknown>) {
  await supabase.from("state_operational_tasks").update(patch).eq("id", id);
}

export async function insertEscalation(input: {
  id?: UUID; state: StateCode; title: string; description?: string;
  department: Department; assignedTo?: string; priority?: Priority;
  status?: EscalationStatus; dueAt?: string; createdBy: string;
  linkedClientId?: string; linkedLeadId?: string; linkedCandidateId?: string;
  sourceModule?: string;
}) {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id ?? null;
  await supabase.from("state_operational_escalations").insert({
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
    lead_id: input.linkedLeadId,
    client_id: input.linkedClientId,
    candidate_id: input.linkedCandidateId,
    centralreach_sync_status: "not_connected",
  });
}

export async function updateEscalationRow(id: UUID, patch: Record<string, unknown>) {
  await supabase.from("state_operational_escalations").update(patch).eq("id", id);
}

export async function insertNote(input: {
  parentType: "task" | "escalation"; parentId: UUID; state: StateCode;
  body: string; author: string;
}) {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id ?? null;
  await supabase.from("state_operational_notes").insert({
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
  state?: StateCode; relatedType?: "task" | "escalation" | "note"; relatedId?: UUID;
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
  });
}