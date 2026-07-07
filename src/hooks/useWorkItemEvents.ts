/**
 * useWorkItemEvents — live event timeline for a single work item.
 *
 * Reads durable rows from `public.operations_work_item_events` and stays
 * in sync via Realtime. Also exposes `addNote(message)` which inserts a
 * `note_added` event authored by the current user.
 *
 * Empty state is honest: no seeded/mock rows are ever returned. If no
 * events exist for the given work item, `events` is an empty array.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface WorkItemEvent {
  id: string;
  workItemId: string;
  eventType: string;
  message: string | null;
  actorId: string | null;
  actorName: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface UseWorkItemEventsValue {
  events: WorkItemEvent[];
  loading: boolean;
  error: string | null;
  addNote: (message: string) => Promise<void>;
  refresh: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyClient = supabase as any;
const TABLE = "operations_work_item_events";

function rowToEvent(r: Record<string, unknown>): WorkItemEvent {
  return {
    id: String(r.id),
    workItemId: String(r.work_item_id),
    eventType: String(r.event_type ?? "work_item_updated"),
    message: (r.message as string | null) ?? null,
    actorId: (r.actor_id as string | null) ?? null,
    actorName: (r.actor_name as string | null) ?? null,
    metadata: (r.metadata as Record<string, unknown> | null) ?? null,
    createdAt: String(r.created_at ?? new Date().toISOString()),
  };
}

export function useWorkItemEvents(workItemId: string | null | undefined): UseWorkItemEventsValue {
  const [events, setEvents] = useState<WorkItemEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(Boolean(workItemId));
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    if (!workItemId) {
      setEvents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await anyClient
      .from(TABLE)
      .select("*")
      .eq("work_item_id", workItemId)
      .order("created_at", { ascending: true });
    if (!mounted.current) return;
    if (err) setError(err.message);
    setEvents(((data ?? []) as Record<string, unknown>[]).map(rowToEvent));
    setLoading(false);
  }, [workItemId]);

  useEffect(() => {
    mounted.current = true;
    void load();
    if (!workItemId) return;
    const channel = anyClient
      .channel(`operations_work_item_events:${workItemId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TABLE, filter: `work_item_id=eq.${workItemId}` },
        () => {
          void load();
        },
      )
      .subscribe();
    return () => {
      mounted.current = false;
      anyClient.removeChannel(channel);
    };
  }, [workItemId, load]);

  const addNote = useCallback(async (message: string) => {
    if (!workItemId) return;
    const trimmed = message.trim();
    if (!trimmed) return;
    try {
      const { data: userRes } = await anyClient.auth.getUser();
      const user = userRes?.user;
      const actorName =
        (user?.user_metadata?.full_name as string | undefined) ??
        (user?.email as string | undefined) ??
        null;
      const { error: e } = await anyClient.from(TABLE).insert({
        work_item_id: workItemId,
        event_type: "note_added",
        message: trimmed,
        actor_id: user?.id ?? null,
        actor_name: actorName,
        metadata: {},
      });
      if (e) {
        setError(e.message);
      } else {
        void load();
      }
    } catch (err) {
      setError((err as Error).message);
    }
  }, [workItemId, load]);

  return { events, loading, error, addNote, refresh: () => void load() };
}