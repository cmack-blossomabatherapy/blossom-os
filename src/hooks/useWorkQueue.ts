/**
 * Pass 2 — Supabase-backed Work Queue hook.
 *
 * Persists work items to `public.operations_work_items` and stays in sync
 * across users via Realtime. Public API preserved for the Work Queue and
 * Escalation Center pages: mutators are fire-and-forget wrappers around
 * async Supabase writes with optimistic local updates.
 *
 * No client-side seed — empty state only until real items are created or
 * pushed in by upstream integrations.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type {
  WorkItem,
  WorkItemStatus,
} from "@/lib/workQueue/workQueueModel";

export interface UseWorkQueueValue {
  items: WorkItem[];
  loading: boolean;
  error: string | null;
  createWorkItem: (input: Partial<WorkItem>) => void;
  updateWorkItem: (id: string, patch: Partial<WorkItem>) => void;
  assignWorkItem: (id: string, ownerName: string, ownerId?: string) => void;
  setStatus: (id: string, status: WorkItemStatus) => void;
  completeWorkItem: (id: string, notes?: string) => void;
  snoozeWorkItem: (id: string, untilIso: string) => void;
  escalateWorkItem: (id: string, reason: string, level?: 1 | 2 | 3 | 4) => void;
  resolveEscalation: (id: string, notes?: string) => void;
  refresh: () => void;
}

type Row = Record<string, unknown>;

function rowToItem(r: Row): WorkItem {
  return {
    id: String(r.id),
    title: String(r.title ?? ""),
    description: (r.description as string | null) ?? undefined,
    type: (r.type as WorkItem["type"]) ?? "general_task",
    department: (r.department as WorkItem["department"]) ?? "Operations Leadership",
    ownerId: (r.owner_id as string | null) ?? undefined,
    ownerName: (r.owner_name as string | null) ?? undefined,
    assignedRole: (r.assigned_role as string | null) ?? undefined,
    state: (r.state as string | null) ?? undefined,
    priority: (r.priority as WorkItem["priority"]) ?? "normal",
    status: (r.status as WorkItemStatus) ?? "open",
    dueDate: (r.due_date as string | null) ?? undefined,
    createdAt: String(r.created_at ?? new Date().toISOString()),
    updatedAt: (r.updated_at as string | null) ?? undefined,
    escalatedAt: (r.escalated_at as string | null) ?? undefined,
    resolvedAt: (r.resolved_at as string | null) ?? undefined,
    snoozedUntil: (r.snoozed_until as string | null) ?? undefined,
    relatedLeadId: (r.related_lead_id as string | null) ?? undefined,
    relatedPatientId: (r.related_patient_id as string | null) ?? undefined,
    relatedUserId: (r.related_user_id as string | null) ?? undefined,
    sourceSystem: (r.source_system as string | null) ?? undefined,
    tags: (r.tags as string[] | null) ?? [],
    escalationReason: (r.escalation_reason as string | null) ?? undefined,
    escalationLevel: (r.escalation_level as WorkItem["escalationLevel"]) ?? undefined,
    resolutionNotes: (r.resolution_notes as string | null) ?? undefined,
    metadata: (r.metadata as Record<string, unknown> | null) ?? undefined,
  };
}

function itemPatchToRow(p: Partial<WorkItem>): Row {
  const out: Row = {};
  if ("title" in p) out.title = p.title;
  if ("description" in p) out.description = p.description ?? null;
  if ("type" in p) out.type = p.type;
  if ("department" in p) out.department = p.department;
  if ("ownerId" in p) out.owner_id = p.ownerId ?? null;
  if ("ownerName" in p) out.owner_name = p.ownerName ?? null;
  if ("assignedRole" in p) out.assigned_role = p.assignedRole ?? null;
  if ("state" in p) out.state = p.state ?? null;
  if ("priority" in p) out.priority = p.priority;
  if ("status" in p) out.status = p.status;
  if ("dueDate" in p) out.due_date = p.dueDate ?? null;
  if ("escalatedAt" in p) out.escalated_at = p.escalatedAt ?? null;
  if ("resolvedAt" in p) out.resolved_at = p.resolvedAt ?? null;
  if ("snoozedUntil" in p) out.snoozed_until = p.snoozedUntil ?? null;
  if ("relatedLeadId" in p) out.related_lead_id = p.relatedLeadId ?? null;
  if ("relatedPatientId" in p) out.related_patient_id = p.relatedPatientId ?? null;
  if ("relatedUserId" in p) out.related_user_id = p.relatedUserId ?? null;
  if ("sourceSystem" in p) out.source_system = p.sourceSystem ?? null;
  if ("tags" in p) out.tags = p.tags ?? [];
  if ("escalationReason" in p) out.escalation_reason = p.escalationReason ?? null;
  if ("escalationLevel" in p) out.escalation_level = p.escalationLevel ?? null;
  if ("resolutionNotes" in p) out.resolution_notes = p.resolutionNotes ?? null;
  if ("metadata" in p) out.metadata = p.metadata ?? {};
  return out;
}

const TABLE = "operations_work_items";
const EVENTS_TABLE = "operations_work_item_events";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyClient = supabase as any;

async function logWorkItemEvent(
  workItemId: string,
  eventType: string,
  message?: string | null,
  metadata?: Record<string, unknown>,
) {
  try {
    const { data: userRes } = await anyClient.auth.getUser();
    const user = userRes?.user;
    const actorName =
      (user?.user_metadata?.full_name as string | undefined) ??
      (user?.email as string | undefined) ??
      null;
    await anyClient.from(EVENTS_TABLE).insert({
      work_item_id: workItemId,
      event_type: eventType,
      message: message ?? null,
      actor_id: user?.id ?? null,
      actor_name: actorName,
      metadata: metadata ?? {},
    });
  } catch {
    // Non-fatal — event log is auxiliary.
  }
}

function describePatch(patch: Partial<WorkItem>): string | null {
  const bits: string[] = [];
  if ("status" in patch) bits.push(`status → ${patch.status}`);
  if ("priority" in patch) bits.push(`priority → ${patch.priority}`);
  if ("ownerName" in patch) bits.push(`owner → ${patch.ownerName ?? "unassigned"}`);
  if ("dueDate" in patch) bits.push(`due → ${patch.dueDate ?? "cleared"}`);
  return bits.length ? bits.join(", ") : null;
}

export function useWorkQueue(): UseWorkQueueValue {
  const [items, setItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await anyClient
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false });
    if (!mounted.current) return;
    if (err) setError(err.message);
    setItems(((data ?? []) as Row[]).map(rowToItem));
    setLoading(false);
  }, []);

  useEffect(() => {
    mounted.current = true;
    void load();
    const channel = anyClient
      .channel("operations_work_items")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TABLE },
        () => {
          void load();
        },
      )
      .subscribe();
    return () => {
      mounted.current = false;
      anyClient.removeChannel(channel);
    };
  }, [load]);

  const createWorkItem = useCallback((input: Partial<WorkItem>) => {
    const row = itemPatchToRow(input);
    if (!row.title) row.title = "Untitled work item";
    if (!row.type) row.type = "general_task";
    if (!row.department) row.department = "Operations Leadership";
    if (!row.priority) row.priority = "normal";
    if (!row.status) row.status = "open";
    void anyClient
      .from(TABLE)
      .insert(row)
      .select("id")
      .single()
      .then(({ data, error: e }: { data: { id: string } | null; error: { message: string } | null }) => {
        if (e) setError(e.message);
        else {
          if (data?.id) {
            void logWorkItemEvent(data.id, "work_item_created", String(row.title ?? ""));
          }
          void load();
        }
      });
  }, [load]);

  const applyPatch = useCallback((id: string, patch: Partial<WorkItem>, eventType: string = "work_item_updated", message?: string | null, metadata?: Record<string, unknown>) => {
    // Optimistic update.
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...patch, updatedAt: new Date().toISOString() } : it)),
    );
    void anyClient
      .from(TABLE)
      .update(itemPatchToRow(patch))
      .eq("id", id)
      .then(({ error: e }: { error: { message: string } | null }) => {
        if (e) {
          setError(e.message);
          void load();
        } else {
          void logWorkItemEvent(id, eventType, message ?? describePatch(patch), metadata);
        }
      });
  }, [load]);

  return {
    items,
    loading,
    error,
    createWorkItem,
    updateWorkItem: (id, patch) => applyPatch(id, patch, "work_item_updated"),
    assignWorkItem: (id, ownerName, ownerId) =>
      applyPatch(id, { ownerName, ownerId }, "work_item_assigned", `Assigned to ${ownerName}`),
    setStatus: (id, status) => {
      const patch: Partial<WorkItem> = { status };
      if (status === "resolved" || status === "closed") patch.resolvedAt = new Date().toISOString();
      applyPatch(id, patch, "work_item_status_changed", `Status → ${status}`);
    },
    completeWorkItem: (id, notes) =>
      applyPatch(id, {
        status: "resolved",
        resolvedAt: new Date().toISOString(),
        resolutionNotes: notes,
      }, "work_item_completed", notes ?? "Completed"),
    snoozeWorkItem: (id, untilIso) =>
      applyPatch(id, { status: "waiting", snoozedUntil: untilIso }, "work_item_snoozed", `Snoozed until ${untilIso}`),
    escalateWorkItem: (id, reason, level = 2) =>
      applyPatch(id, {
        status: "escalated",
        escalatedAt: new Date().toISOString(),
        escalationReason: reason,
        escalationLevel: level,
        priority: level >= 4 ? "critical" : level >= 3 ? "urgent" : "high",
      }, "work_item_escalated", reason, { level }),
    resolveEscalation: (id, notes) =>
      applyPatch(id, {
        status: "resolved",
        resolvedAt: new Date().toISOString(),
        resolutionNotes: notes,
      }, "work_item_escalation_resolved", notes ?? "Escalation resolved"),
    refresh: () => void load(),
  };
}