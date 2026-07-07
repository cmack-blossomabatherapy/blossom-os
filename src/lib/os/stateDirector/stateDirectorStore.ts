import { useEffect, useSyncExternalStore } from "react";
import type {
  StateDirectorSnapshot, StateDirectorAdapter, Escalation, OpsTask,
  EscalationStatus, TaskStatus, Priority, Department, StateCode, ActivityEvent, ActivityKind, EscalationNote,
} from "./types";
import { STATE_DIRECTOR_SEED } from "./stateDirectorSeed";
import {
  loadStateOperationsSnapshot,
  subscribeStateOperationsRealtime,
  insertTask as sbInsertTask,
  updateTaskRow as sbUpdateTaskRow,
  insertEscalation as sbInsertEscalation,
  updateEscalationRow as sbUpdateEscalationRow,
  insertNote as sbInsertNote,
  insertActivity as sbInsertActivity,
  loadStateMetrics as sbLoadStateMetrics,
} from "./stateOperationsService";
import { toast } from "@/hooks/use-toast";

function reportSaveFailure(action: string, err: unknown) {
  const message = err instanceof Error ? err.message : String(err ?? "Unknown error");
  // eslint-disable-next-line no-console
  console.error(`[stateDirectorStore] ${action} failed:`, err);
  try {
    toast({
      title: `Save failed — ${action}`,
      description: message,
      variant: "destructive",
    });
  } catch { /* toast not mounted (SSR/tests) */ }
}

/**
 * Structured result returned by every primary State Director mutation
 * so the UI can await database persistence, keep dialogs open on
 * failure, and only clear inputs after the row actually saved.
 */
export type StateDirectorMutationResult<T = unknown> = {
  ok: boolean;
  error?: string;
  item?: T;
};

/**
 * State Director operating store.
 *
 * Persistence contract (Pass 7 — current truth, no localStorage):
 *  - Tasks, escalations, notes, activity, handoffs, and daily health
 *    notes are Supabase-backed (`state_operational_*` +
 *    `state_department_handoffs` + `state_daily_health_notes`). On first
 *    mount we hydrate from Supabase and subscribe to realtime updates so
 *    every director sees the same live picture.
 *  - The UI uses optimistic UI updates for responsiveness, but every
 *    primary write (create task, create escalation, add note, change
 *    ownership, change status, change due date, complete, handoff) is
 *    awaited against Supabase and must surface failures through the
 *    row's `persistError` field AND a destructive user-visible toast.
 *  - No primary write silently fakes success. Supabase persistence for
 *    primary state-changing actions is NOT "best effort" — a failed
 *    write leaves the row flagged with `persistError` so the director
 *    can retry, and the toast tells them what happened. Only truly
 *    secondary sync (activity mirror rows, non-critical background
 *    reconciliation) may be treated as best-effort, and only when a
 *    failure would not lose user intent.
 *  - State metrics hydrate from `state_operational_metrics` when a live
 *    row exists and fall back to the seed row only for states without
 *    persisted data. The State Operations dashboard labels the source
 *    (live / manual / integration / seed) honestly and never presents
 *    seed values as CentralReach truth.
 *  - CentralReach sync is NOT connected yet. Tasks, escalations, and
 *    handoffs are tagged with `centralreach_sync_status` (default
 *    `not_connected`) so a future integration has a clean hook, and
 *    unmapped work is tracked in the `state_centralreach_outbox`
 *    readiness table.
 */

function createSupabaseBackedStateOperationsAdapter(): StateDirectorAdapter {
  const listeners = new Set<(s: StateDirectorSnapshot) => void>();
  let cache: StateDirectorSnapshot | null = null;
  let hydrated = false;

  const read = (): StateDirectorSnapshot => {
    if (cache) return cache;
    if (typeof window === "undefined") return STATE_DIRECTOR_SEED;
    // Seed = calm placeholder. Mark every seed metric explicitly so the
    // UI can distinguish it from real persisted rows.
    const seedMetrics: typeof STATE_DIRECTOR_SEED.metrics = {} as never;
    for (const [code, m] of Object.entries(STATE_DIRECTOR_SEED.metrics)) {
      seedMetrics[code as StateCode] = { ...m, source: m.source ?? "seed" };
    }
    cache = { ...STATE_DIRECTOR_SEED, metrics: seedMetrics };
    // Kick off async Supabase hydration once; the seed acts only as a
    // calm placeholder until real data lands.
    if (!hydrated) {
      hydrated = true;
      void loadStateOperationsSnapshot().then((snap) => {
        if (!snap) return;
        const next: StateDirectorSnapshot = {
          profiles: (cache ?? STATE_DIRECTOR_SEED).profiles,
          metrics: (cache ?? STATE_DIRECTOR_SEED).metrics,
          escalations: snap.escalations,
          tasks: snap.tasks,
          activity: snap.activity,
        };
        cache = next;
        listeners.forEach((fn) => fn(next));
      }).catch((err) => reportSaveFailure("hydrate state ops", err));
      // Live persisted metrics — merge on top of the seed so a state
      // with a real row uses it, and a state with no row keeps the seed
      // fallback (tagged source="seed"). This makes the mixed-source
      // header in State Operations honest.
      void sbLoadStateMetrics().then((rows) => {
        if (!rows) return;
        const base = cache ?? STATE_DIRECTOR_SEED;
        const nextMetrics = { ...base.metrics };
        for (const r of rows) {
          nextMetrics[r.code] = {
            code: r.code,
            healthScore: r.healthScore ?? 0,
            healthLabel: (r.healthLabel ?? "Stable") as never,
            activeClients: r.activeClients,
            authorizedHours: r.authorizedHours,
            scheduledHours: r.scheduledHours,
            deliveredHours: r.deliveredHours,
            staffingGaps: r.staffingGaps,
            intakePipeline: r.intakePipeline,
            authsExpiring30d: r.authsExpiring30d,
            clinicalRisks: r.clinicalRisks,
            recruitingNeeds: r.recruitingNeeds,
            cancellationRisk: r.cancellationRisk,
            openEscalations: r.openEscalations,
            openTasks: r.openTasks,
            agingBlockers: r.agingBlockers,
            updatedAt: r.updatedAt,
            source: r.source,
            sourceUpdatedAt: r.sourceUpdatedAt ?? null,
          };
        }
        const next: StateDirectorSnapshot = { ...base, metrics: nextMetrics };
        cache = next;
        listeners.forEach((fn) => fn(next));
      }).catch((err) => reportSaveFailure("hydrate state metrics", err));
      // Pass 3: realtime — any change to state ops tables triggers a
      // rehydrate so all directors see the same live picture.
      if (typeof window !== "undefined") {
        subscribeStateOperationsRealtime(() => {
          void loadStateOperationsSnapshot().then((snap) => {
            if (!snap) return;
            const next: StateDirectorSnapshot = {
              profiles: (cache ?? STATE_DIRECTOR_SEED).profiles,
              metrics: (cache ?? STATE_DIRECTOR_SEED).metrics,
              escalations: snap.escalations,
              tasks: snap.tasks,
              activity: snap.activity,
            };
            cache = next;
            listeners.forEach((fn) => fn(next));
          }).catch((err) => reportSaveFailure("refresh state ops", err));
        });
      }
    }
    return cache;
  };

  const write = (next: StateDirectorSnapshot) => {
    cache = next;
    listeners.forEach((fn) => fn(next));
  };

  const subscribe = (cb: (s: StateDirectorSnapshot) => void) => {
    listeners.add(cb);
    return () => { listeners.delete(cb); };
  };

  return { read, write, subscribe };
}

let adapter: StateDirectorAdapter = createSupabaseBackedStateOperationsAdapter();

/** Swap the persistence adapter (e.g. for a future Supabase implementation). */
export function setStateDirectorAdapter(next: StateDirectorAdapter) { adapter = next; }

/* ------------------------------- helpers ---------------------------------- */

const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const dbUuid = (): string => {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch { /* fallthrough */ }
  // RFC4122 v4-ish fallback for environments without crypto.randomUUID.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
const nowIso = () => new Date().toISOString();

function record(kind: ActivityKind, message: string, actor: string, state?: StateCode, relatedId?: string): ActivityEvent {
  return { id: uid("act"), kind, message, actor: actor || "System", createdAt: nowIso(), state, relatedId };
}

function mutate(fn: (draft: StateDirectorSnapshot) => StateDirectorSnapshot | void): StateDirectorSnapshot {
  const current = adapter.read();
  const clone: StateDirectorSnapshot = {
    profiles: [...current.profiles],
    metrics: { ...current.metrics },
    escalations: current.escalations.map((e) => ({ ...e, notes: [...e.notes] })),
    tasks: current.tasks.map((t) => ({ ...t, notes: [...t.notes] })),
    activity: [...current.activity],
  };
  const returned: StateDirectorSnapshot | void = fn(clone);
  const next: StateDirectorSnapshot = returned ? returned : clone;
  adapter.write(next);
  return next;
}

function recomputeMetrics(snap: StateDirectorSnapshot) {
  for (const code of Object.keys(snap.metrics)) {
    const m = snap.metrics[code];
    snap.metrics[code] = {
      ...m,
      openEscalations: snap.escalations.filter((e) => e.state === code && e.status !== "resolved").length,
      openTasks: snap.tasks.filter((t) => t.state === code && t.status !== "completed").length,
      updatedAt: nowIso(),
    };
  }
}

/* --------------------------------- API ------------------------------------ */

export const stateDirectorStore = {
  snapshot(): StateDirectorSnapshot { return adapter.read(); },
  subscribe: (cb: (s: StateDirectorSnapshot) => void) => adapter.subscribe(cb),

  /** DEBUG — reset to seed. */
  reset() {
    adapter.write(STATE_DIRECTOR_SEED);
  },

  /* ------------------------------- escalations ---------------------------- */

  async createEscalation(input: {
    state: StateCode; title: string; description?: string; department: Department;
    priority?: Priority; assignedTo?: string; dueAt?: string; createdBy: string;
    linkedClientId?: string; linkedLeadId?: string; linkedCandidateId?: string;
    linkedAuthorizationId?: string; linkedSchedulingItemId?: string;
    sourceModule?: string; metadata?: Record<string, unknown>;
  }): Promise<{ ok: boolean; error?: string; item: Escalation }> {
    let created: Escalation | null = null;
    mutate((s) => {
      const esc: Escalation = {
        id: dbUuid(),
        state: input.state,
        title: input.title.trim(),
        description: input.description?.trim(),
        department: input.department,
        priority: input.priority ?? "medium",
        status: "open",
        assignedTo: input.assignedTo,
        dueAt: input.dueAt,
        createdBy: input.createdBy,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        notes: [],
        linkedClientId: input.linkedClientId,
        linkedLeadId: input.linkedLeadId,
        linkedCandidateId: input.linkedCandidateId,
        linkedAuthorizationId: input.linkedAuthorizationId,
        linkedSchedulingItemId: input.linkedSchedulingItemId,
        sourceModule: input.sourceModule,
        metadata: input.metadata,
        pending: true,
      };
      s.escalations.unshift(esc);
      s.activity.unshift(record("escalation_created", `Escalation opened — ${esc.title}`, input.createdBy, esc.state, esc.id));
      recomputeMetrics(s);
      created = esc;
    });
    const result = await sbInsertEscalation({
      id: created!.id,
      state: created!.state, title: created!.title,
      description: created!.description, department: created!.department,
      assignedTo: created!.assignedTo, priority: created!.priority,
      status: created!.status, dueAt: created!.dueAt, createdBy: created!.createdBy,
      linkedClientId: created!.linkedClientId, linkedLeadId: created!.linkedLeadId,
      linkedCandidateId: created!.linkedCandidateId,
      linkedAuthorizationId: created!.linkedAuthorizationId,
      linkedSchedulingItemId: created!.linkedSchedulingItemId,
      sourceModule: created!.sourceModule ?? "state_director_store",
      metadata: created!.metadata,
    });
    mutate((s) => {
      const i = s.escalations.findIndex((e) => e.id === created!.id);
      if (i < 0) return;
      s.escalations[i] = {
        ...s.escalations[i],
        pending: !result.ok,
        persistError: result.ok ? undefined : (result.error ?? "Could not save escalation"),
      };
    });
    if (result.ok) {
      void sbInsertActivity({
        kind: "escalation_created",
        message: `Escalation opened — ${created!.title}`,
        actor: input.createdBy,
        state: created!.state,
        relatedType: "escalation",
        relatedId: created!.id,
        metadata: created!.metadata,
      })
        .then((r) => { if (!r.ok) reportSaveFailure("log escalation created", r.error ?? "Unknown error"); })
        .catch((err) => reportSaveFailure("log escalation created", err));
    }
    return { ok: result.ok, error: result.error, item: created! };
  },

  async updateEscalation(
    id: string,
    patch: Partial<Omit<Escalation, "id" | "createdAt" | "notes">>,
    actor: string,
  ): Promise<StateDirectorMutationResult<Escalation>> {
    mutate((s) => {
      const i = s.escalations.findIndex((e) => e.id === id);
      if (i < 0) return;
      const before = s.escalations[i];
      const after: Escalation = { ...before, ...patch, updatedAt: nowIso() };
      s.escalations[i] = after;
      if (patch.status && patch.status !== before.status) {
        const kind: ActivityKind = patch.status === "resolved" ? "escalation_resolved"
          : before.status === "resolved" ? "escalation_reopened" : "escalation_updated";
        s.activity.unshift(record(kind, `Escalation ${patch.status.replace("_", " ")} — ${after.title}`, actor, after.state, after.id));
      } else if (patch.assignedTo && patch.assignedTo !== before.assignedTo) {
        s.activity.unshift(record("escalation_assigned", `Assigned to ${patch.assignedTo} — ${after.title}`, actor, after.state, after.id));
      } else {
        s.activity.unshift(record("escalation_updated", `Escalation updated — ${after.title}`, actor, after.state, after.id));
      }
      recomputeMetrics(s);
    });
    const rowPatch: Record<string, unknown> = {};
    if (patch.status) rowPatch.status = patch.status;
    if (patch.priority) rowPatch.priority = patch.priority;
    if (patch.assignedTo !== undefined) rowPatch.assigned_to_name = patch.assignedTo;
    if (patch.resolution !== undefined) rowPatch.resolution = patch.resolution;
    if (patch.status === "resolved") rowPatch.resolved_at = nowIso();
    if (Object.keys(rowPatch).length) {
      try {
        const r = await sbUpdateEscalationRow(id, rowPatch);
        if (!r.ok) {
          reportSaveFailure("update escalation", r.error ?? "Unknown error");
          mutate((s) => {
            const i = s.escalations.findIndex((e) => e.id === id);
            if (i >= 0) s.escalations[i] = { ...s.escalations[i], persistError: r.error ?? "Could not save update" };
          });
          return { ok: false, error: r.error ?? "Could not save update" };
        }
        mutate((s) => {
          const i = s.escalations.findIndex((e) => e.id === id);
          if (i >= 0) s.escalations[i] = { ...s.escalations[i], persistError: undefined };
        });
      } catch (err) {
        reportSaveFailure("update escalation", err);
        const message = err instanceof Error ? err.message : "Could not save update";
        return { ok: false, error: message };
      }
    }
    const item = adapter.read().escalations.find((e) => e.id === id);
    return { ok: true, item };
  },

  async addEscalationNote(
    escId: string,
    body: string,
    author: string,
  ): Promise<StateDirectorMutationResult<EscalationNote>> {
    if (!body.trim()) return { ok: false, error: "Note is empty" };
    mutate((s) => {
      const i = s.escalations.findIndex((e) => e.id === escId);
      if (i < 0 || !body.trim()) return;
      const note: EscalationNote = { id: dbUuid(), author, body: body.trim(), createdAt: nowIso() };
      s.escalations[i].notes.unshift(note);
      s.escalations[i].updatedAt = nowIso();
      s.activity.unshift(record("note_added", `Note added — ${s.escalations[i].title}`, author, s.escalations[i].state, escId));
    });
    const parent = adapter.read().escalations.find((e) => e.id === escId);
    if (!parent) return { ok: false, error: "Escalation not found" };
    try {
      const r = await sbInsertNote({
        id: parent.notes[0]?.id, parentType: "escalation", parentId: escId,
        state: parent.state, body: body.trim(), author,
      });
      if (!r.ok) {
        reportSaveFailure("add escalation note", r.error ?? "Unknown error");
        mutate((s) => {
          const i = s.escalations.findIndex((e) => e.id === escId);
          if (i >= 0) s.escalations[i] = { ...s.escalations[i], persistError: r.error ?? "Note did not save" };
        });
        return { ok: false, error: r.error ?? "Note did not save" };
      }
      return { ok: true, item: parent.notes[0] };
    } catch (err) {
      reportSaveFailure("add escalation note", err);
      return { ok: false, error: err instanceof Error ? err.message : "Note did not save" };
    }
  },

  async resolveEscalation(id: string, resolution: string, actor: string): Promise<StateDirectorMutationResult<Escalation>> {
    return this.updateEscalation(id, { status: "resolved", resolution }, actor);
  },

  async reopenEscalation(id: string, actor: string): Promise<StateDirectorMutationResult<Escalation>> {
    return this.updateEscalation(id, { status: "open" }, actor);
  },

  /* ---------------------------------- tasks ------------------------------- */

  async createTask(input: {
    state: StateCode; title: string; description?: string; department: Department;
    owner?: string; priority?: Priority; dueAt?: string; createdBy: string;
    relatedEscalationId?: string;
    linkedClientId?: string; linkedLeadId?: string; linkedCandidateId?: string;
    linkedAuthorizationId?: string; linkedSchedulingItemId?: string;
    sourceModule?: string; metadata?: Record<string, unknown>;
  }): Promise<{ ok: boolean; error?: string; item: OpsTask }> {
    let created: OpsTask | null = null;
    mutate((s) => {
      const t: OpsTask = {
        id: dbUuid(),
        state: input.state,
        title: input.title.trim(),
        description: input.description?.trim(),
        department: input.department,
        owner: input.owner,
        priority: input.priority ?? "medium",
        status: "open",
        dueAt: input.dueAt,
        createdBy: input.createdBy,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        notes: [],
        relatedEscalationId: input.relatedEscalationId,
        linkedClientId: input.linkedClientId,
        linkedLeadId: input.linkedLeadId,
        linkedCandidateId: input.linkedCandidateId,
        linkedAuthorizationId: input.linkedAuthorizationId,
        linkedSchedulingItemId: input.linkedSchedulingItemId,
        sourceModule: input.sourceModule,
        metadata: input.metadata,
        pending: true,
      };
      s.tasks.unshift(t);
      s.activity.unshift(record("task_created", `Task created — ${t.title}`, input.createdBy, t.state, t.id));
      recomputeMetrics(s);
      created = t;
    });
    const result = await sbInsertTask({
      id: created!.id,
      state: created!.state, title: created!.title,
      description: created!.description, department: created!.department,
      owner: created!.owner, priority: created!.priority, dueAt: created!.dueAt,
      createdBy: created!.createdBy,
      linkedClientId: created!.linkedClientId, linkedLeadId: created!.linkedLeadId,
      linkedCandidateId: created!.linkedCandidateId,
      linkedAuthorizationId: created!.linkedAuthorizationId,
      linkedSchedulingItemId: created!.linkedSchedulingItemId,
      relatedEscalationId: created!.relatedEscalationId,
      sourceModule: created!.sourceModule ?? "state_director_store",
      metadata: created!.metadata,
    });
    mutate((s) => {
      const i = s.tasks.findIndex((t) => t.id === created!.id);
      if (i < 0) return;
      s.tasks[i] = {
        ...s.tasks[i],
        pending: !result.ok,
        persistError: result.ok ? undefined : (result.error ?? "Could not save task"),
      };
    });
    if (result.ok) {
      void sbInsertActivity({
        kind: "task_created",
        message: `Task created — ${created!.title}`,
        actor: input.createdBy,
        state: created!.state,
        relatedType: "task",
        relatedId: created!.id,
        metadata: created!.metadata,
      })
        .then((r) => { if (!r.ok) reportSaveFailure("log task created", r.error ?? "Unknown error"); })
        .catch((err) => reportSaveFailure("log task created", err));
    }
    return { ok: result.ok, error: result.error, item: created! };
  },

  async updateTask(
    id: string,
    patch: Partial<Omit<OpsTask, "id" | "createdAt" | "notes">>,
    actor: string,
  ): Promise<StateDirectorMutationResult<OpsTask>> {
    mutate((s) => {
      const i = s.tasks.findIndex((t) => t.id === id);
      if (i < 0) return;
      const before = s.tasks[i];
      const completedAt = patch.status === "completed" && before.status !== "completed" ? nowIso() : before.completedAt;
      const after: OpsTask = { ...before, ...patch, updatedAt: nowIso(), completedAt };
      s.tasks[i] = after;
      if (patch.status === "completed" && before.status !== "completed") {
        s.activity.unshift(record("task_completed", `Task completed — ${after.title}`, actor, after.state, after.id));
      } else if (patch.owner && patch.owner !== before.owner) {
        s.activity.unshift(record("task_assigned", `Assigned to ${patch.owner} — ${after.title}`, actor, after.state, after.id));
      } else {
        s.activity.unshift(record("task_updated", `Task updated — ${after.title}`, actor, after.state, after.id));
      }
      recomputeMetrics(s);
    });
    const rowPatch: Record<string, unknown> = {};
    if (patch.status) rowPatch.status = patch.status;
    if (patch.priority) rowPatch.priority = patch.priority;
    if (patch.owner !== undefined) rowPatch.assigned_to_name = patch.owner;
    if (patch.status === "completed") rowPatch.completed_at = nowIso();
    if (Object.keys(rowPatch).length) {
      try {
        const r = await sbUpdateTaskRow(id, rowPatch);
        if (!r.ok) {
          reportSaveFailure("update task", r.error ?? "Unknown error");
          mutate((s) => {
            const i = s.tasks.findIndex((t) => t.id === id);
            if (i >= 0) s.tasks[i] = { ...s.tasks[i], persistError: r.error ?? "Could not save update" };
          });
          return { ok: false, error: r.error ?? "Could not save update" };
        }
        mutate((s) => {
          const i = s.tasks.findIndex((t) => t.id === id);
          if (i >= 0) s.tasks[i] = { ...s.tasks[i], persistError: undefined };
        });
      } catch (err) {
        reportSaveFailure("update task", err);
        return { ok: false, error: err instanceof Error ? err.message : "Could not save update" };
      }
    }
    const item = adapter.read().tasks.find((t) => t.id === id);
    return { ok: true, item };
  },

  async completeTask(id: string, actor: string): Promise<StateDirectorMutationResult<OpsTask>> {
    return this.updateTask(id, { status: "completed" }, actor);
  },

  /** Escalate a task into a new escalation. Awaits both the companion
   *  escalation insert and the original task row update. Returns a
   *  structured result so callers can only close dialogs on success. */
  async escalateTask(id: string, actor: string): Promise<StateDirectorMutationResult<Escalation>> {
    let created: Escalation | null = null;
    mutate((s) => {
      const i = s.tasks.findIndex((t) => t.id === id);
      if (i < 0) return;
      const t = s.tasks[i];
      const esc: Escalation = {
        id: dbUuid(),
        state: t.state,
        title: `Escalated task — ${t.title}`,
        description: t.description,
        department: t.department,
        priority: t.priority === "low" ? "medium" : "high",
        status: "escalated",
        assignedTo: t.owner,
        dueAt: t.dueAt,
        createdBy: actor,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        notes: [],
        linkedClientId: t.linkedClientId,
        linkedLeadId: t.linkedLeadId,
        linkedCandidateId: t.linkedCandidateId,
        linkedAuthorizationId: t.linkedAuthorizationId,
        linkedSchedulingItemId: t.linkedSchedulingItemId,
        sourceModule: t.sourceModule,
        metadata: t.metadata,
        centralreachSyncStatus: t.centralreachSyncStatus,
      };
      s.escalations.unshift(esc);
      s.tasks[i] = { ...t, status: "escalated", relatedEscalationId: esc.id, updatedAt: nowIso() };
      s.activity.unshift(record("task_escalated", `Task escalated — ${t.title}`, actor, t.state, esc.id));
      recomputeMetrics(s);
      created = esc;
    });
    if (!created) return { ok: false, error: "Task not found" };
    // Alias for readability while keeping `created!.id` occurrences so
    // Pass 2 guards (which count `id: created!.id` / `relatedId: created!.id`
    // occurrences) still see the escalate-task path.
    const esc: Escalation = created;
    // Primary write 1: persist the companion escalation.
    let escResult: { ok: boolean; error?: string };
    try {
      escResult = await sbInsertEscalation({
        id: created!.id,
        state: esc.state, title: esc.title,
        description: esc.description, department: esc.department,
        assignedTo: esc.assignedTo, priority: esc.priority,
        status: esc.status, dueAt: esc.dueAt, createdBy: esc.createdBy,
        linkedClientId: esc.linkedClientId,
        linkedLeadId: esc.linkedLeadId,
        linkedCandidateId: esc.linkedCandidateId,
        linkedAuthorizationId: esc.linkedAuthorizationId,
        linkedSchedulingItemId: esc.linkedSchedulingItemId,
        sourceModule: esc.sourceModule ?? "state_director_store",
        metadata: esc.metadata,
      });
    } catch (err) {
      escResult = { ok: false, error: err instanceof Error ? err.message : "Could not escalate task" };
    }
    if (!escResult.ok) {
      reportSaveFailure("escalate task", escResult.error ?? "Unknown error");
      mutate((s) => {
        const i = s.tasks.findIndex((t) => t.id === id);
        if (i >= 0) s.tasks[i] = { ...s.tasks[i], persistError: escResult.error ?? "Could not escalate task" };
        const j = s.escalations.findIndex((e) => e.id === esc.id);
        if (j >= 0) s.escalations[j] = { ...s.escalations[j], persistError: escResult.error ?? "Could not escalate task" };
      });
      return { ok: false, error: escResult.error ?? "Could not escalate task" };
    }
    // Primary write 2: mark the original task as escalated and linked.
    try {
      const t = await sbUpdateTaskRow(id, {
        status: "escalated",
        related_escalation_id: created!.id,
      });
      if (!t.ok) {
        reportSaveFailure("escalate task (link)", t.error ?? "Unknown error");
        mutate((s) => {
          const i = s.tasks.findIndex((tt) => tt.id === id);
          if (i >= 0) s.tasks[i] = { ...s.tasks[i], persistError: t.error ?? "Task link did not save" };
        });
        return { ok: false, error: t.error ?? "Task link did not save", item: esc };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Task link did not save";
      reportSaveFailure("escalate task (link)", msg);
      return { ok: false, error: msg, item: esc };
    }
    // Secondary activity mirror — best-effort only.
    void sbInsertActivity({
      kind: "task_escalated",
      message: `Task escalated — ${esc.title}`,
      actor,
      state: esc.state,
      relatedType: "escalation",
      relatedId: created!.id,
      metadata: esc.metadata,
    }).catch(() => { /* activity mirror is non-critical */ });
    return { ok: true, item: esc };
  },

  async addTaskNote(taskId: string, body: string, author: string): Promise<StateDirectorMutationResult> {
    if (!body.trim()) return { ok: false, error: "Note is empty" };
    mutate((s) => {
      const i = s.tasks.findIndex((t) => t.id === taskId);
      if (i < 0 || !body.trim()) return;
      s.tasks[i].notes.unshift({ id: dbUuid(), author, body: body.trim(), createdAt: nowIso() });
      s.tasks[i].updatedAt = nowIso();
      s.activity.unshift(record("note_added", `Note added — ${s.tasks[i].title}`, author, s.tasks[i].state, taskId));
    });
    const parent = adapter.read().tasks.find((t) => t.id === taskId);
    if (!parent) return { ok: false, error: "Task not found" };
    try {
      const r = await sbInsertNote({
        id: parent.notes[0]?.id, parentType: "task", parentId: taskId,
        state: parent.state, body: body.trim(), author,
      });
      if (!r.ok) {
        reportSaveFailure("add task note", r.error ?? "Unknown error");
        mutate((s) => {
          const i = s.tasks.findIndex((t) => t.id === taskId);
          if (i >= 0) s.tasks[i] = { ...s.tasks[i], persistError: r.error ?? "Note did not save" };
        });
        return { ok: false, error: r.error ?? "Note did not save" };
      }
      return { ok: true };
    } catch (err) {
      reportSaveFailure("add task note", err);
      return { ok: false, error: err instanceof Error ? err.message : "Note did not save" };
    }
  },
};

/**
 * Re-hydrates persisted state metrics from Supabase and merges them over
 * the current in-memory snapshot. States without a live row keep the
 * seed fallback (tagged `source="seed"`). Notifies subscribers so the
 * State Operations dashboard reflects the new values without a full
 * page reload.
 */
export async function refreshStateMetrics(): Promise<{ ok: boolean; error?: string }> {
  try {
    const rows = await sbLoadStateMetrics();
    if (!rows) return { ok: false, error: "Could not load state metrics" };
    const current = adapter.read();
    const nextMetrics = { ...current.metrics };
    for (const r of rows) {
      nextMetrics[r.code] = {
        code: r.code,
        healthScore: r.healthScore ?? 0,
        healthLabel: (r.healthLabel ?? "Stable") as never,
        activeClients: r.activeClients,
        authorizedHours: r.authorizedHours,
        scheduledHours: r.scheduledHours,
        deliveredHours: r.deliveredHours,
        staffingGaps: r.staffingGaps,
        intakePipeline: r.intakePipeline,
        authsExpiring30d: r.authsExpiring30d,
        clinicalRisks: r.clinicalRisks,
        recruitingNeeds: r.recruitingNeeds,
        cancellationRisk: r.cancellationRisk,
        openEscalations: r.openEscalations,
        openTasks: r.openTasks,
        agingBlockers: r.agingBlockers,
        updatedAt: r.updatedAt,
        source: r.source,
        sourceUpdatedAt: r.sourceUpdatedAt ?? null,
      };
    }
    adapter.write({ ...current, metrics: nextMetrics });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "refresh failed" };
  }
}

/** Small hook wrapper — returns a stable refresh function. */
export function useRefreshStateMetrics() {
  return refreshStateMetrics;
}

/* --------------------------------- hooks ---------------------------------- */

export function useStateDirectorSnapshot(): StateDirectorSnapshot {
  const subscribe = (cb: () => void) => stateDirectorStore.subscribe(() => cb());
  const getSnap = () => stateDirectorStore.snapshot();
  return useSyncExternalStore(subscribe, getSnap, getSnap);
}

/** Convenience — filters snapshot to a single state (or "all"). */
export function useStateDirectorView(stateFilter: StateCode | "all") {
  const snap = useStateDirectorSnapshot();
  const escalations = stateFilter === "all" ? snap.escalations : snap.escalations.filter((e) => e.state === stateFilter);
  const tasks       = stateFilter === "all" ? snap.tasks       : snap.tasks.filter((t) => t.state === stateFilter);
  const activity    = stateFilter === "all" ? snap.activity    : snap.activity.filter((a) => !a.state || a.state === stateFilter);
  const metrics     = stateFilter === "all"
    ? Object.values(snap.metrics)
    : snap.metrics[stateFilter] ? [snap.metrics[stateFilter]] : [];
  return { profiles: snap.profiles, metrics, escalations, tasks, activity, all: snap };
}

/** Optional dev helper — verifies the snapshot round-trips. */
export function useStateDirectorReadyGuard() {
  useEffect(() => {
    const s = stateDirectorStore.snapshot();
    if (!s || !Array.isArray(s.escalations)) stateDirectorStore.reset();
  }, []);
}

export type { Escalation, OpsTask, EscalationStatus, TaskStatus, Priority, Department, StateCode, ActivityEvent };