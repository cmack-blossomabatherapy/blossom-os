/**
 * Sprint 12 — Local Work Queue store.
 *
 * In-memory store with a subscription model so all open WorkQueue/Escalation
 * Center surfaces stay in sync. Persistence is intentionally deferred to a
 * later sprint (additive Supabase migration) — this store provides a clean
 * abstraction so swapping it for a Supabase-backed implementation is a
 * single-file change.
 *
 * Never store secrets, tokens, or credential values in metadata.
 */
import {
  normalizeWorkItem,
  seedWorkItems,
  type WorkItem,
  type WorkItemStatus,
} from "./workQueueModel";

type Listener = (items: WorkItem[]) => void;

let items: WorkItem[] = seedWorkItems();
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l([...items]);
}

export function subscribeWorkItems(listener: Listener): () => void {
  listeners.add(listener);
  listener([...items]);
  return () => {
    listeners.delete(listener);
  };
}

export function listWorkItems(): WorkItem[] {
  return [...items];
}

export function createWorkItem(input: Partial<WorkItem>): WorkItem {
  const item = normalizeWorkItem(input);
  items = [item, ...items];
  emit();
  return item;
}

export function updateWorkItem(id: string, patch: Partial<WorkItem>): WorkItem | undefined {
  let updated: WorkItem | undefined;
  items = items.map((i) => {
    if (i.id !== id) return i;
    updated = { ...i, ...patch, updatedAt: new Date().toISOString() };
    return updated;
  });
  if (updated) emit();
  return updated;
}

export function assignWorkItem(id: string, ownerName: string, ownerId?: string) {
  return updateWorkItem(id, { ownerName, ownerId });
}

export function setWorkItemStatus(id: string, status: WorkItemStatus) {
  const patch: Partial<WorkItem> = { status };
  if (status === "resolved" || status === "closed") patch.resolvedAt = new Date().toISOString();
  return updateWorkItem(id, patch);
}

export function completeWorkItem(id: string, resolutionNotes?: string) {
  return updateWorkItem(id, {
    status: "resolved",
    resolvedAt: new Date().toISOString(),
    resolutionNotes,
  });
}

export function snoozeWorkItem(id: string, untilIso: string) {
  return updateWorkItem(id, { status: "waiting", snoozedUntil: untilIso });
}

export function escalateWorkItem(id: string, reason: string, level: 1 | 2 | 3 | 4 = 2) {
  return updateWorkItem(id, {
    status: "escalated",
    escalatedAt: new Date().toISOString(),
    escalationReason: reason,
    escalationLevel: level,
    priority: level >= 4 ? "critical" : level >= 3 ? "urgent" : "high",
  });
}

export function resolveEscalation(id: string, notes?: string) {
  return updateWorkItem(id, {
    status: "resolved",
    resolvedAt: new Date().toISOString(),
    resolutionNotes: notes,
  });
}