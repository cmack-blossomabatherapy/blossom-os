import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type {
  ClinicalPriority, ClinicalSourceType, ClinicalStatus, ClinicalWorkItem,
} from "@/hooks/useClinicalDirectorData";

export interface CreateWorkItemInput {
  title: string;
  source_type: ClinicalSourceType;
  source_record_id?: string | null;
  client_id?: string | null;
  client_name?: string | null;
  bcba_id?: string | null;
  bcba_name?: string | null;
  state?: string | null;
  priority?: ClinicalPriority;
  status?: ClinicalStatus;
  notes?: string | null;
  owner_user_id?: string | null;
  owner_name?: string | null;
  due_at?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Durable Clinical Director actions.
 *
 * Every action:
 *   - writes to `clinical_work_items` (source of truth)
 *   - appends a `clinical_activity_log` event so history is preserved
 *   - mirrors auth-linked activity into `authorization_activity` when the
 *     work item is tied to an authorization, so QA/auth history is not lost.
 */
export function useClinicalDirectorActions() {
  const currentUser = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    return data.user ?? null;
  }, []);

  const logActivity = useCallback(async (
    workItem: Pick<ClinicalWorkItem, "id" | "source_type" | "source_record_id" | "client_id" | "bcba_id">,
    event_type: string,
    summary: string,
    payload: Record<string, unknown> = {},
  ) => {
    const user = await currentUser();
    await supabase.from("clinical_activity_log").insert({
      work_item_id: workItem.id,
      event_type,
      actor_user_id: user?.id ?? null,
      actor_name: user?.email ?? null,
      source_type: workItem.source_type,
      source_record_id: workItem.source_record_id,
      client_id: workItem.client_id,
      bcba_id: workItem.bcba_id,
      summary,
      payload,
    } as never);
    if (workItem.source_type === "authorization" && workItem.source_record_id) {
      // Mirror into the existing authorization activity trail so QA/auth
      // history stays complete. Best-effort — do not block on failure.
      try {
        await supabase.from("authorization_activity").insert({
          authorization_id: workItem.source_record_id,
          event_type: `clinical.${event_type}`,
          summary,
          actor_user_id: user?.id ?? null,
          payload,
        } as never);
      } catch { /* non-blocking */ }
    }
  }, [currentUser]);

  const createWorkItem = useCallback(async (input: CreateWorkItemInput) => {
    const user = await currentUser();
    const row = {
      title: input.title,
      source_type: input.source_type,
      source_record_id: input.source_record_id ?? null,
      client_id: input.client_id ?? null,
      client_name: input.client_name ?? null,
      bcba_id: input.bcba_id ?? null,
      bcba_name: input.bcba_name ?? null,
      state: input.state ?? null,
      priority: input.priority ?? "normal",
      status: input.status ?? "open",
      notes: input.notes ?? null,
      owner_user_id: input.owner_user_id ?? null,
      owner_name: input.owner_name ?? null,
      due_at: input.due_at ?? null,
      metadata: input.metadata ?? {},
      created_by: user?.id ?? null,
      updated_by: user?.id ?? null,
    };
    const { data, error } = await supabase
      .from("clinical_work_items")
      .insert(row as never)
      .select("*")
      .single();
    if (error) throw error;
    await logActivity(data as unknown as ClinicalWorkItem, "created", `Created: ${input.title}`);
    return data as unknown as ClinicalWorkItem;
  }, [currentUser, logActivity]);

  const patch = useCallback(async (
    id: string,
    updates: Partial<Omit<ClinicalWorkItem, "id" | "created_at" | "created_by">>,
    event_type: string,
    summary: string,
  ) => {
    const user = await currentUser();
    const { data, error } = await supabase
      .from("clinical_work_items")
      .update({ ...updates, updated_by: user?.id ?? null } as never)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    await logActivity(data as unknown as ClinicalWorkItem, event_type, summary, updates as Record<string, unknown>);
    return data as unknown as ClinicalWorkItem;
  }, [currentUser, logActivity]);

  const addNote = (id: string, note: string, base: Pick<ClinicalWorkItem, "source_type" | "source_record_id" | "client_id" | "bcba_id" | "notes">) => {
    const merged = [base.notes, note].filter(Boolean).join("\n\n---\n");
    return patch(id, { notes: merged }, "note_added", "Added clinical note");
  };
  const assignOwner = (id: string, ownerUserId: string, ownerName: string) =>
    patch(id, { owner_user_id: ownerUserId, owner_name: ownerName }, "owner_assigned", `Assigned to ${ownerName}`);
  const changePriority = (id: string, priority: ClinicalPriority) =>
    patch(id, { priority }, "priority_changed", `Priority set to ${priority}`);
  const markReviewed = (id: string) =>
    patch(id, { status: "reviewed" }, "reviewed", "Marked reviewed");
  const escalate = (id: string) =>
    patch(id, { status: "escalated", priority: "high" }, "escalated", "Escalation opened");
  const resolve = (id: string) =>
    patch(id, { status: "resolved" }, "resolved", "Marked resolved");
  const reopen = (id: string) =>
    patch(id, { status: "open" }, "reopened", "Reopened");
  const archive = (id: string) =>
    patch(id, { status: "archived" }, "archived", "Archived");

  const saveView = useCallback(async (name: string, filters: Record<string, unknown>, is_shared = false) => {
    const user = await currentUser();
    if (!user) throw new Error("Not signed in");
    const { data, error } = await supabase
      .from("clinical_saved_views")
      .insert({ user_id: user.id, name, filters, is_shared } as never)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }, [currentUser]);

  return {
    createWorkItem, addNote, assignOwner, changePriority,
    markReviewed, escalate, resolve, reopen, archive,
    saveView,
  };
}
