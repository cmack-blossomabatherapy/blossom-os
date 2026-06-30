import { supabase } from "@/integrations/supabase/client";

/**
 * QA workflow persistence layer.
 *
 * Centralizes the write side of every QA action so QA pages share the same
 * mutation logic. For QA work items that map to a real `clients.id`, writes
 * land on `client_qa_reviews`. For items that only exist as imported source
 * records (e.g. `monday_authorizations_raw`), writes land on the
 * `qa_work_item_overrides` bridge table.
 *
 * Source-system writes go through `upsertOverride(...)`; client-id writes
 * go through `upsertReview(...)`. The hook in `useQAWorkflow.ts` exposes
 * the friendly action verbs (startReview, markIssuesFound, etc.).
 */

export type QAStatus =
  | "Awaiting Review"
  | "In Review"
  | "Issues Found"
  | "Ready for Submission"
  | "Submitted to Auth"
  | "Escalated";

export interface QAWorkItemRef {
  /** Real client uuid if known; otherwise null. */
  clientId?: string | null;
  /** Imported source identifier (e.g. monday item id). */
  sourceRecordId: string;
  sourceSystem?: string;
  mondayItemId?: string | null;
}

interface OverridePatch {
  assigned_qa_owner?: string | null;
  qa_status?: string | null;
  priority?: string | null;
  next_action?: string | null;
  blockers?: string[];
  alerts?: string[];
  notes?: string | null;
  escalated?: boolean;
  escalation_reason?: string | null;
}

async function upsertOverride(ref: QAWorkItemRef, patch: OverridePatch) {
  const payload = {
    source_system: ref.sourceSystem ?? "monday_authorizations_raw",
    source_record_id: ref.sourceRecordId,
    monday_item_id: ref.mondayItemId ?? null,
    client_id: ref.clientId ?? null,
    last_action_at: new Date().toISOString(),
    ...patch,
  };
  const { data, error } = await supabase
    .from("qa_work_item_overrides")
    .upsert(payload as never, {
      onConflict: "source_system,source_record_id",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

interface ReviewPatch {
  status?: QAStatus;
  assigned_qa_owner?: string | null;
  next_action?: string;
  blockers?: string[];
  alerts?: string[];
  notes?: string | null;
  errors_found?: boolean;
  notes_verified?: boolean;
  documentation_complete?: boolean;
  treatment_plan_received?: boolean;
  qa_start_date?: string | null;
  qa_completed_date?: string | null;
}

async function upsertReview(clientId: string, patch: ReviewPatch) {
  // Try to find an existing open review for this client first.
  const { data: existing } = await supabase
    .from("client_qa_reviews")
    .select("id")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    const { data, error } = await supabase
      .from("client_qa_reviews")
      .update(patch as never)
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from("client_qa_reviews")
    .insert([{ client_id: clientId, ...patch } as never])
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Apply a patch using the right table for whichever ref we have. */
async function applyPatch(
  ref: QAWorkItemRef,
  reviewPatch: ReviewPatch,
  overridePatch: OverridePatch,
) {
  if (ref.clientId) return upsertReview(ref.clientId, reviewPatch);
  return upsertOverride(ref, overridePatch);
}

export const qaWorkflowStore = {
  async startReview(ref: QAWorkItemRef, owner?: string | null) {
    const today = new Date().toISOString().slice(0, 10);
    return applyPatch(
      ref,
      {
        status: "In Review",
        qa_start_date: today,
        assigned_qa_owner: owner ?? null,
        next_action: "Review documentation",
      },
      {
        qa_status: "In Review",
        assigned_qa_owner: owner ?? null,
        next_action: "Review documentation",
      },
    );
  },

  async markIssuesFound(
    ref: QAWorkItemRef,
    blockers: string[] = [],
    notes?: string,
  ) {
    return applyPatch(
      ref,
      {
        status: "Issues Found",
        errors_found: true,
        blockers,
        notes: notes ?? null,
        next_action: "Send corrections to BCBA",
      },
      {
        qa_status: "Issues Found",
        blockers,
        notes: notes ?? null,
        next_action: "Send corrections to BCBA",
      },
    );
  },

  async markReadyForSubmission(ref: QAWorkItemRef) {
    const today = new Date().toISOString().slice(0, 10);
    return applyPatch(
      ref,
      {
        status: "Ready for Submission",
        documentation_complete: true,
        notes_verified: true,
        treatment_plan_received: true,
        blockers: [],
        next_action: "Hand off to Authorizations",
        qa_completed_date: today,
      },
      {
        qa_status: "Ready for Submission",
        blockers: [],
        next_action: "Hand off to Authorizations",
      },
    );
  },

  async submitToAuth(ref: QAWorkItemRef) {
    return applyPatch(
      ref,
      {
        status: "Submitted to Auth",
        next_action: "Awaiting auth team",
      },
      {
        qa_status: "Submitted to Auth",
        next_action: "Awaiting auth team",
      },
    );
  },

  async assignOwner(ref: QAWorkItemRef, owner: string | null) {
    return applyPatch(
      ref,
      { assigned_qa_owner: owner },
      { assigned_qa_owner: owner },
    );
  },

  async addNote(ref: QAWorkItemRef, note: string) {
    return applyPatch(ref, { notes: note }, { notes: note });
  },

  async escalate(ref: QAWorkItemRef, reason: string) {
    return applyPatch(
      ref,
      {
        status: "Escalated",
        alerts: [reason],
        next_action: "Leadership escalation",
      },
      {
        qa_status: "Escalated",
        escalated: true,
        escalation_reason: reason,
        alerts: [reason],
        next_action: "Leadership escalation",
      },
    );
  },

  async resolveMissingInfo(ref: QAWorkItemRef) {
    return applyPatch(
      ref,
      { blockers: [], alerts: [] },
      { blockers: [], alerts: [] },
    );
  },

  /** Bulk variant — runs sequentially so a partial failure is visible. */
  async bulk<T>(
    refs: QAWorkItemRef[],
    fn: (ref: QAWorkItemRef) => Promise<T>,
  ): Promise<{ ok: T[]; failed: { ref: QAWorkItemRef; error: unknown }[] }> {
    const ok: T[] = [];
    const failed: { ref: QAWorkItemRef; error: unknown }[] = [];
    for (const ref of refs) {
      try {
        ok.push(await fn(ref));
      } catch (error) {
        failed.push({ ref, error });
      }
    }
    return { ok, failed };
  },
};

export type QAWorkflowStore = typeof qaWorkflowStore;