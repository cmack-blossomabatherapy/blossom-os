import { useEffect, useSyncExternalStore } from "react";
import type {
  StateDirectorSnapshot, StateDirectorAdapter, Escalation, OpsTask,
  EscalationStatus, TaskStatus, Priority, Department, StateCode, ActivityEvent, ActivityKind, EscalationNote,
} from "./types";
import { STATE_DIRECTOR_SEED } from "./stateDirectorSeed";

/**
 * State Director operating store.
 *
 * Persistence: pluggable adapter. The default is a localStorage adapter that
 * hydrates from `stateDirectorSeed.ts` on first run — this keeps the UI real
 * and mutable inside Lovable preview with no Supabase dependency, while
 * leaving a clean swap point for a Supabase adapter later.
 *
 * All CRUD flows go through this module — no page mutates snapshot state
 * directly. Activity events are recorded automatically.
 */

const KEY = "blossom.state_director.v1";

function safeParse(raw: string | null): StateDirectorSnapshot | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StateDirectorSnapshot;
    if (!parsed || !Array.isArray(parsed.escalations) || !Array.isArray(parsed.tasks)) return null;
    return parsed;
  } catch { return null; }
}

function createLocalStorageAdapter(): StateDirectorAdapter {
  const listeners = new Set<(s: StateDirectorSnapshot) => void>();
  let cache: StateDirectorSnapshot | null = null;

  const read = (): StateDirectorSnapshot => {
    if (cache) return cache;
    if (typeof window === "undefined") return STATE_DIRECTOR_SEED;
    const persisted = safeParse(window.localStorage.getItem(KEY));
    cache = persisted ?? STATE_DIRECTOR_SEED;
    return cache;
  };

  const write = (next: StateDirectorSnapshot) => {
    cache = next;
    if (typeof window !== "undefined") {
      try { window.localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* quota — ignore */ }
    }
    listeners.forEach((fn) => fn(next));
  };

  const subscribe = (cb: (s: StateDirectorSnapshot) => void) => {
    listeners.add(cb);
    return () => { listeners.delete(cb); };
  };

  // Cross-tab sync
  if (typeof window !== "undefined") {
    window.addEventListener("storage", (e) => {
      if (e.key !== KEY) return;
      const parsed = safeParse(e.newValue);
      if (parsed) { cache = parsed; listeners.forEach((fn) => fn(parsed)); }
    });
  }

  return { read, write, subscribe };
}

let adapter: StateDirectorAdapter = createLocalStorageAdapter();

/** Swap the persistence adapter (e.g. for a future Supabase implementation). */
export function setStateDirectorAdapter(next: StateDirectorAdapter) { adapter = next; }

/* ------------------------------- helpers ---------------------------------- */

const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
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
  const returned = fn(clone);
  const next: StateDirectorSnapshot = returned ?? clone;
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

  createEscalation(input: {
    state: StateCode; title: string; description?: string; department: Department;
    priority?: Priority; assignedTo?: string; dueAt?: string; createdBy: string;
    linkedClientId?: string; linkedLeadId?: string; linkedCandidateId?: string;
  }) {
    let created: Escalation | null = null;
    mutate((s) => {
      const esc: Escalation = {
        id: uid("esc"),
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
      };
      s.escalations.unshift(esc);
      s.activity.unshift(record("escalation_created", `Escalation opened — ${esc.title}`, input.createdBy, esc.state, esc.id));
      recomputeMetrics(s);
      created = esc;
    });
    return created!;
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
  },

  addEscalationNote(escId: string, body: string, author: string) {
    mutate((s) => {
      const i = s.escalations.findIndex((e) => e.id === escId);
      if (i < 0 || !body.trim()) return;
      const note: EscalationNote = { id: uid("note"), author, body: body.trim(), createdAt: nowIso() };
      s.escalations[i].notes.unshift(note);
      s.escalations[i].updatedAt = nowIso();
      s.activity.unshift(record("note_added", `Note added — ${s.escalations[i].title}`, author, s.escalations[i].state, escId));
    });
  },

  resolveEscalation(id: string, resolution: string, actor: string) {
    this.updateEscalation(id, { status: "resolved", resolution }, actor);
  },

  reopenEscalation(id: string, actor: string) {
    this.updateEscalation(id, { status: "open" }, actor);
  },

  /* ---------------------------------- tasks ------------------------------- */

  createTask(input: {
    state: StateCode; title: string; description?: string; department: Department;
    owner?: string; priority?: Priority; dueAt?: string; createdBy: string;
    relatedEscalationId?: string;
    linkedClientId?: string; linkedLeadId?: string; linkedCandidateId?: string;
  }) {
    let created: OpsTask | null = null;
    mutate((s) => {
      const t: OpsTask = {
        id: uid("task"),
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
      };
      s.tasks.unshift(t);
      s.activity.unshift(record("task_created", `Task created — ${t.title}`, input.createdBy, t.state, t.id));
      recomputeMetrics(s);
      created = t;
    });
    return created!;
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
        id: uid("esc"),
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
      };
      s.escalations.unshift(esc);
      s.tasks[i] = { ...t, status: "escalated", relatedEscalationId: esc.id, updatedAt: nowIso() };
      s.activity.unshift(record("task_escalated", `Task escalated — ${t.title}`, actor, t.state, esc.id));
      recomputeMetrics(s);
      created = esc;
    });
    return created!;
  },

  addTaskNote(taskId: string, body: string, author: string) {
    mutate((s) => {
      const i = s.tasks.findIndex((t) => t.id === taskId);
      if (i < 0 || !body.trim()) return;
      s.tasks[i].notes.unshift({ id: uid("note"), author, body: body.trim(), createdAt: nowIso() });
      s.tasks[i].updatedAt = nowIso();
      s.activity.unshift(record("note_added", `Note added — ${s.tasks[i].title}`, author, s.tasks[i].state, taskId));
    });
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