import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Pass-2 write surface for the Authorizations team. Every page action
 * (Submit / Request PR / Send to QA / Note / Escalate / bulk Assign /
 * Change Status / external send) writes a row through these helpers so
 * the operational overlay (`authorization_operational_records`) and the
 * `authorization_activity` audit feed stay in sync.
 *
 * Live items from `monday_authorizations_raw` don't have an overlay row
 * until the team takes their first action — `ensureOverlay` lazily creates
 * one keyed on `monday_item_id` so we get a stable internal id without
 * needing a backfill job.
 */

export type AuthSourceSystem = "monday" | "centralreach" | "manual";

export interface EnsureOverlayInput {
  source_system: AuthSourceSystem;
  monday_item_id?: string | null;
  centralreach_authorization_id?: string | null;
  source_id?: string | null;
  /**
   * If known, the existing operational overlay row id. When provided we skip
   * the lookup/insert path entirely — required when chaining actions against
   * a freshly-created manual record so we don't insert duplicate overlays.
   */
  overlay_id?: string | null;
  client_name?: string | null;
  state?: string | null;
  payer?: string | null;
  auth_type?: string | null;
  status?: string | null;
  workflow_stage?: string | null;
  assigned_owner?: string | null;
  assigned_bcba?: string | null;
  expiration_date?: string | null;
}

export type AuthActivityType =
  | "status_change"
  | "submitted"
  | "request_pr"
  | "send_to_qa"
  | "escalate"
  | "note"
  | "assign_coordinator"
  | "resolve_docs"
  | "centralreach_sync"
  | "external_send_pending"
  | "review_denial"
  | "mark_reviewed"
  | "manual_created";

export interface LogActivityInput {
  recordId: string;
  activityType: AuthActivityType;
  description?: string;
  oldValue?: string | null;
  newValue?: string | null;
}

export interface CreateTaskInput {
  recordId: string;
  title: string;
  ownerLabel?: string | null;
  dueDate?: string | null;
  notes?: string | null;
}

export interface ExternalSendInput {
  recordId: string;
  channel: "outlook" | "email" | "sms" | "phone";
  summary: string;
}

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/**
 * Ensures an overlay row exists for a given auth. For Monday-sourced
 * items we key on `monday_item_id`; for manual/CR sources we use the
 * passed `source_id`. Returns the overlay row id.
 */
async function ensureOverlay(input: EnsureOverlayInput): Promise<string> {
  // Fast path: caller already knows the overlay row id.
  if (input.overlay_id) return input.overlay_id;

  const lookupKey =
    input.monday_item_id ??
    input.centralreach_authorization_id ??
    input.source_id;

  if (lookupKey) {
    const { data: existing, error: findErr } = await supabase
      .from("authorization_operational_records")
      .select("id")
      .or(
        [
          input.monday_item_id ? `monday_item_id.eq.${input.monday_item_id}` : null,
          input.centralreach_authorization_id ? `centralreach_authorization_id.eq.${input.centralreach_authorization_id}` : null,
        ].filter(Boolean).join(",") || `source_id.eq.${lookupKey}`,
      )
      .limit(1)
      .maybeSingle();
    if (findErr) throw findErr;
    if (existing?.id) return existing.id;
  }

  const userId = await currentUserId();
  const { data: inserted, error: insErr } = await supabase
    .from("authorization_operational_records")
    .insert({
      source_system: input.source_system,
      monday_item_id: input.monday_item_id ?? null,
      centralreach_authorization_id: input.centralreach_authorization_id ?? null,
      source_id: input.source_id ?? null,
      client_name: input.client_name ?? null,
      state: input.state ?? null,
      payer: input.payer ?? null,
      auth_type: input.auth_type ?? null,
      status: input.status ?? null,
      workflow_stage: input.workflow_stage ?? null,
      assigned_owner: input.assigned_owner ?? null,
      assigned_bcba: input.assigned_bcba ?? null,
      expiration_date: input.expiration_date ?? null,
      created_by: userId,
      updated_by: userId,
    })
    .select("id")
    .single();
  if (insErr) throw insErr;
  const newId = inserted.id;
  // For manual rows without an external system key, stamp source_id with the
  // new overlay id so subsequent lookups by `source_id` find this row instead
  // of creating a second overlay.
  if (!input.monday_item_id && !input.centralreach_authorization_id && !input.source_id) {
    await supabase
      .from("authorization_operational_records")
      .update({ source_id: newId })
      .eq("id", newId);
  }
  return newId;
}

async function logActivity({ recordId, activityType, description, oldValue, newValue }: LogActivityInput) {
  const userId = await currentUserId();
  const { error } = await supabase.from("authorization_activity").insert({
    authorization_id: recordId,
    activity_type: activityType,
    title: description ?? activityType,
    body: description ?? null,
    old_value: oldValue ?? null,
    new_value: newValue ?? null,
    created_by: userId,
  });
  if (error) throw error;
}

async function createTask({ recordId, title, ownerLabel, dueDate, notes }: CreateTaskInput) {
  const userId = await currentUserId();
  const { error } = await supabase.from("authorization_tasks").insert({
    authorization_id: recordId,
    title,
    owner_user: ownerLabel ?? null,
    due_date: dueDate ?? null,
    description: notes ?? null,
    created_by: userId,
  });
  if (error) throw error;
}

export interface AuthorizationActions {
  pending: boolean;
  ensureOverlay: (input: EnsureOverlayInput) => Promise<string>;
  requestPR: (input: EnsureOverlayInput, opts?: { dueInDays?: number }) => Promise<void>;
  sendToQA: (input: EnsureOverlayInput) => Promise<void>;
  escalate: (input: EnsureOverlayInput, reason?: string) => Promise<void>;
  addNote: (input: EnsureOverlayInput, note: string) => Promise<void>;
  submitAuth: (input: EnsureOverlayInput) => Promise<void>;
  resolveDocs: (input: EnsureOverlayInput) => Promise<void>;
  markReviewed: (input: EnsureOverlayInput) => Promise<void>;
  reviewDenial: (input: EnsureOverlayInput) => Promise<void>;
  queueExternalSend: (input: EnsureOverlayInput, send: Omit<ExternalSendInput, "recordId">) => Promise<void>;
  bulkChangeStatus: (records: EnsureOverlayInput[], newStatus: string) => Promise<void>;
  bulkAssign: (records: EnsureOverlayInput[], assignee: string) => Promise<void>;
  createManualAuth: (
    input: Omit<EnsureOverlayInput, "source_system"> & { source_system?: AuthSourceSystem },
  ) => Promise<string>;
}

const CHANNEL_LABEL: Record<ExternalSendInput["channel"], string> = {
  outlook: "Outlook",
  email: "Email",
  sms: "SMS",
  phone: "Phone",
};

function explainError(e: unknown) {
  return e instanceof Error ? e.message : "Action failed";
}

export function useAuthorizationActions(): AuthorizationActions {
  const [pending, setPending] = useState(false);

  const run = useCallback(
    async <T,>(label: string, fn: () => Promise<T>, successMsg?: string): Promise<T> => {
      setPending(true);
      try {
        const out = await fn();
        if (successMsg) toast.success(successMsg);
        return out;
      } catch (e: unknown) {
        toast.error(`${label} failed: ${explainError(e)}`);
        throw e;
      } finally {
        setPending(false);
      }
    },
    [],
  );

  const ensure = useCallback((input: EnsureOverlayInput) => ensureOverlay(input), []);

  const requestPR: AuthorizationActions["requestPR"] = useCallback(
    (input, opts) =>
      run("Request PR", async () => {
        const id = await ensureOverlay(input);
        const dueDate = opts?.dueInDays
          ? new Date(Date.now() + opts.dueInDays * 86_400_000).toISOString().slice(0, 10)
          : null;
        await logActivity({
          recordId: id,
          activityType: "request_pr",
          description: `PR requested for ${input.client_name ?? "client"}.`,
        });
        await createTask({
          recordId: id,
          title: "Follow up on requested PR",
          ownerLabel: input.assigned_bcba ?? input.assigned_owner ?? null,
          dueDate,
        });
      }, "PR request logged"),
    [run],
  );

  const sendToQA: AuthorizationActions["sendToQA"] = useCallback(
    (input) =>
      run("Send to QA", async () => {
        const id = await ensureOverlay(input);
        const userId = await currentUserId();
        const { error: updErr } = await supabase
          .from("authorization_operational_records")
          .update({
            workflow_stage: "In QA Review",
            status: "In QA Review",
            updated_by: userId,
          })
          .eq("id", id);
        if (updErr) throw updErr;
        await logActivity({
          recordId: id,
          activityType: "send_to_qa",
          description: `Sent to QA review.`,
          newValue: "In QA Review",
        });
      }, "Sent to QA"),
    [run],
  );

  const escalate: AuthorizationActions["escalate"] = useCallback(
    (input, reason) =>
      run("Escalate", async () => {
        const id = await ensureOverlay(input);
        await logActivity({
          recordId: id,
          activityType: "escalate",
          description: reason ?? `Escalated to State Director.`,
        });
      }, "Escalation logged"),
    [run],
  );

  const addNote: AuthorizationActions["addNote"] = useCallback(
    (input, note) =>
      run("Add note", async () => {
        const id = await ensureOverlay(input);
        await logActivity({
          recordId: id,
          activityType: "note",
          description: note,
        });
      }, "Note added"),
    [run],
  );

  const submitAuth: AuthorizationActions["submitAuth"] = useCallback(
    (input) =>
      run("Submit", async () => {
        const id = await ensureOverlay(input);
        const userId = await currentUserId();
        const { error: updErr } = await supabase
          .from("authorization_operational_records")
          .update({
            status: "Submitted",
            workflow_stage: "Submitted",
            submitted_date: new Date().toISOString().slice(0, 10),
            updated_by: userId,
          })
          .eq("id", id);
        if (updErr) throw updErr;
        await logActivity({
          recordId: id,
          activityType: "submitted",
          description: `Marked submitted.`,
        });
      }, "Submission recorded"),
    [run],
  );

  const resolveDocs: AuthorizationActions["resolveDocs"] = useCallback(
    (input) =>
      run("Resolve docs", async () => {
        const id = await ensureOverlay(input);
        // Mark any open authorization_requirements as "Received" for this auth.
        // The check constraint on `status` is case-sensitive ("Received").
        const { data: updatedRows, error: reqErr } = await supabase
          .from("authorization_requirements")
          .update({ status: "Received", received_at: new Date().toISOString() })
          .eq("authorization_id", id)
          .neq("status", "Received")
          .select("id");
        if (reqErr) throw reqErr;
        const resolvedCount = updatedRows?.length ?? 0;
        await logActivity({
          recordId: id,
          activityType: "resolve_docs",
          description: resolvedCount > 0
            ? `Resolved ${resolvedCount} open requirement${resolvedCount === 1 ? "" : "s"} as Received.`
            : "Documentation reviewed — no open requirements to resolve.",
          newValue: String(resolvedCount),
        });
          // Intentionally no return — interface is Promise<void>.
      }, "Documentation reviewed"),
    [run],
  );

  const markReviewed: AuthorizationActions["markReviewed"] = useCallback(
    (input) =>
      run("Mark reviewed", async () => {
        const id = await ensureOverlay(input);
        const userId = await currentUserId();
        // Merge metadata so we don't blow away existing keys.
        const { data: existing, error: fetchErr } = await supabase
          .from("authorization_operational_records")
          .select("metadata")
          .eq("id", id)
          .maybeSingle();
        if (fetchErr) throw fetchErr;
        const currentMeta =
          (existing?.metadata && typeof existing.metadata === "object" && !Array.isArray(existing.metadata)
            ? (existing.metadata as Record<string, unknown>)
            : {});
        const mergedMeta = {
          ...currentMeta,
          last_reviewed_at: new Date().toISOString(),
          last_reviewed_by: userId,
        };
        const { error: updErr } = await supabase
          .from("authorization_operational_records")
          .update({ metadata: mergedMeta, updated_by: userId })
          .eq("id", id);
        if (updErr) throw updErr;
        await logActivity({
          recordId: id,
          activityType: "mark_reviewed",
          description: `Coordinator marked record reviewed.`,
        });
      }, "Record marked reviewed"),
    [run],
  );

  const reviewDenial: AuthorizationActions["reviewDenial"] = useCallback(
    (input) =>
      run("Review denial", async () => {
        const id = await ensureOverlay(input);
        const userId = await currentUserId();
        const { error: updErr } = await supabase
          .from("authorization_operational_records")
          .update({
            workflow_stage: "Denial Review",
            priority: "High",
            updated_by: userId,
          })
          .eq("id", id);
        if (updErr) throw updErr;
        await createTask({
          recordId: id,
          title: "Review denial reason and plan response",
          ownerLabel: input.assigned_owner ?? null,
          dueDate: new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10),
        });
        await logActivity({
          recordId: id,
          activityType: "review_denial",
          description: `Denial review opened — follow-up task created.`,
        });
      }, "Denial review logged"),
    [run],
  );

  const queueExternalSend: AuthorizationActions["queueExternalSend"] = useCallback(
    (input, send) =>
      run("External send", async () => {
        const id = await ensureOverlay(input);
        await logActivity({
          recordId: id,
          activityType: "external_send_pending",
          description: `${CHANNEL_LABEL[send.channel]} send queued — integration pending. ${send.summary}`,
          newValue: send.channel,
        });
      }, `${CHANNEL_LABEL[send.channel]} send queued — integration pending`),
    [run],
  );

  const bulkChangeStatus: AuthorizationActions["bulkChangeStatus"] = useCallback(
    (records, newStatus) =>
      run("Change status", async () => {
        const userId = await currentUserId();
        for (const r of records) {
          const id = await ensureOverlay(r);
          const { error: updErr } = await supabase
            .from("authorization_operational_records")
            .update({ status: newStatus, workflow_stage: newStatus, updated_by: userId })
            .eq("id", id);
          if (updErr) throw updErr;
          await logActivity({
            recordId: id,
            activityType: "status_change",
            description: `Status changed to ${newStatus}.`,
            newValue: newStatus,
          });
        }
      }, `Status updated · ${records.length} record${records.length === 1 ? "" : "s"}`),
    [run],
  );

  const bulkAssign: AuthorizationActions["bulkAssign"] = useCallback(
    (records, assignee) =>
      run("Assign", async () => {
        const userId = await currentUserId();
        for (const r of records) {
          const id = await ensureOverlay(r);
          const { error: updErr } = await supabase
            .from("authorization_operational_records")
            .update({ assigned_owner: assignee, updated_by: userId })
            .eq("id", id);
          if (updErr) throw updErr;
          await logActivity({
            recordId: id,
            activityType: "assign_coordinator",
            description: `Assigned to ${assignee}.`,
            newValue: assignee,
          });
        }
      }, `Assigned ${records.length} record${records.length === 1 ? "" : "s"}`),
    [run],
  );

  const createManualAuth: AuthorizationActions["createManualAuth"] = useCallback(
    (input) =>
      run("Create authorization", async () => {
        const id = await ensureOverlay({ source_system: "manual", ...input });
        await logActivity({
          recordId: id,
          activityType: "manual_created",
          description: `Manually created authorization for ${input.client_name ?? "client"}.`,
        });
        return id;
      }, "Authorization created"),
    [run],
  );

  return {
    pending,
    ensureOverlay: ensure,
    requestPR,
    sendToQA,
    escalate,
    addNote,
    submitAuth,
    resolveDocs,
    markReviewed,
    reviewDenial,
    queueExternalSend,
    bulkChangeStatus,
    bulkAssign,
    createManualAuth,
  };
}