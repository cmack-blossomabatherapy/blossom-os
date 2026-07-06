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
} from "./stateOperationsService";

/**
 * State Director operating store.
 *
 * Persistence contract (current truth — no localStorage):
 *  - Operational tasks, escalations, notes, and activity are backed by
 *    Supabase (`state_operational_*` tables). On first mount we hydrate the
 *    in-memory cache from Supabase and subscribe to realtime updates so
 *    every State Director sees the same live picture.
 *  - Mutations write to Supabase (fire-and-forget with best-effort error
 *    handling) and update the local cache synchronously so
 *    `useSyncExternalStore` stays responsive. Local records and Supabase
 *    rows share the same UUID.
 *  - State profiles and metrics remain seeded until a real metrics source
 *    is wired (see docs/state-director-functionality-pass-2-qa.md). The
 *    dashboard surfaces this honestly and does not present seed KPIs as
 *    live CentralReach data.
 *
 * All CRUD flows go through this module — no page mutates snapshot state
 * directly. Activity events are recorded automatically.
 */

function createSupabaseBackedStateOperationsAdapter(): StateDirectorAdapter {
  const listeners = new Set<(s: StateDirectorSnapshot) => void>();
  let cache: StateDirectorSnapshot | null = null;
  let hydrated = false;

  const read = (): StateDirectorSnapshot => {
    if (cache) return cache;
    if (typeof window === "undefined") return STATE_DIRECTOR_SEED;
    cache = STATE_DIRECTOR_SEED;
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
      }).catch(() => { /* ignore */ });
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
          }).catch(() => { /* ignore */ });
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
      });
    }
    return { ok: result.ok, error: result.error, item: created! };
  },

  updateEscalation(id: string, patch: Partial<Omit<Escalation, "id" | "createdAt" | "notes">>, actor: string) {
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
    if (Object.keys(rowPatch).length) void sbUpdateEscalationRow(id, rowPatch);
  },

  addEscalationNote(escId: string, body: string, author: string) {
    mutate((s) => {
      const i = s.escalations.findIndex((e) => e.id === escId);
      if (i < 0 || !body.trim()) return;
      const note: EscalationNote = { id: dbUuid(), author, body: body.trim(), createdAt: nowIso() };
      s.escalations[i].notes.unshift(note);
      s.escalations[i].updatedAt = nowIso();
      s.activity.unshift(record("note_added", `Note added — ${s.escalations[i].title}`, author, s.escalations[i].state, escId));
    });
    // Best-effort Supabase persistence.
    const parent = adapter.read().escalations.find((e) => e.id === escId);
    if (parent && body.trim()) {
      void sbInsertNote({ id: parent.notes[0]?.id, parentType: "escalation", parentId: escId, state: parent.state, body: body.trim(), author });
    }
  },

  resolveEscalation(id: string, resolution: string, actor: string) {
    this.updateEscalation(id, { status: "resolved", resolution }, actor);
  },

  reopenEscalation(id: string, actor: string) {
    this.updateEscalation(id, { status: "open" }, actor);
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
      });
    }
    return { ok: result.ok, error: result.error, item: created! };
  },

  updateTask(id: string, patch: Partial<Omit<OpsTask, "id" | "createdAt" | "notes">>, actor: string) {
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
    if (Object.keys(rowPatch).length) void sbUpdateTaskRow(id, rowPatch);
  },

  completeTask(id: string, actor: string) { this.updateTask(id, { status: "completed" }, actor); },

  /** Escalate a task into a new escalation. Returns the created escalation. */
  escalateTask(id: string, actor: string) {
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
    if (created) {
      void sbInsertEscalation({
        id: created.id,
        state: created.state, title: created.title,
        description: created.description, department: created.department,
        assignedTo: created.assignedTo, priority: created.priority,
        status: created.status, dueAt: created.dueAt, createdBy: created.createdBy,
        linkedClientId: created.linkedClientId,
        linkedLeadId: created.linkedLeadId,
        linkedCandidateId: created.linkedCandidateId,
        linkedAuthorizationId: created.linkedAuthorizationId,
        linkedSchedulingItemId: created.linkedSchedulingItemId,
        sourceModule: created.sourceModule ?? "state_director_store",
        metadata: created.metadata,
      });
      void sbInsertActivity({
        kind: "task_escalated",
        message: `Task escalated — ${created.title}`,
        actor,
        state: created.state,
        relatedType: "escalation",
        relatedId: created.id,
        metadata: created.metadata,
      });
    }
    return created!;
  },

  addTaskNote(taskId: string, body: string, author: string) {
    mutate((s) => {
      const i = s.tasks.findIndex((t) => t.id === taskId);
      if (i < 0 || !body.trim()) return;
      s.tasks[i].notes.unshift({ id: dbUuid(), author, body: body.trim(), createdAt: nowIso() });
      s.tasks[i].updatedAt = nowIso();
      s.activity.unshift(record("note_added", `Note added — ${s.tasks[i].title}`, author, s.tasks[i].state, taskId));
    });
    const parent = adapter.read().tasks.find((t) => t.id === taskId);
    if (parent && body.trim()) {
      void sbInsertNote({ id: parent.notes[0]?.id, parentType: "task", parentId: taskId, state: parent.state, body: body.trim(), author });
    }
  },
};

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