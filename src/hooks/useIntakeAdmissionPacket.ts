/**
 * Blossom OS — CentralReach admission packet persistence.
 *
 * Checklist items, Director approval, and the CentralReach handoff mark are
 * stored server-side. Waivers, approvals, and handoffs are Director-only and
 * enforced in the database, not in the browser.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AdmissionChecklistItem, AdmissionApproval } from "@/lib/intake/admissionReadiness";

export interface AdmissionPacketRecord {
  items: AdmissionChecklistItem[];
  approval: AdmissionApproval;
  handoffMarkedAt: string | null;
  handoffReference: string | null;
}

export type AdmissionPacketMap = Record<string, AdmissionPacketRecord>;

const EMPTY: AdmissionPacketRecord = { items: [], approval: {}, handoffMarkedAt: null, handoffReference: null };

export function useAdmissionPackets(leadIds: string[]) {
  const key = [...leadIds].sort().join(",");
  return useQuery({
    queryKey: ["intake-admission-packets", key],
    enabled: leadIds.length > 0,
    queryFn: async (): Promise<AdmissionPacketMap> => {
      const [itemsRes, approvalsRes] = await Promise.all([
        (supabase as any)
          .from("intake_admission_checklist_items")
          .select("lead_id,item_key,label,required,status,missing,waived_by,waived_reason")
          .in("lead_id", leadIds),
        (supabase as any)
          .from("intake_admission_approvals")
          .select("lead_id,approved_by,approved_at,exception_reason,handoff_marked_at,handoff_reference")
          .in("lead_id", leadIds),
      ]);
      if (itemsRes.error) throw itemsRes.error;
      if (approvalsRes.error) throw approvalsRes.error;

      const map: AdmissionPacketMap = {};
      for (const row of itemsRes.data ?? []) {
        const rec = (map[row.lead_id] ??= { ...EMPTY, items: [] });
        rec.items.push({
          key: row.item_key,
          label: row.label,
          required: !!row.required,
          status: row.status,
          missing: row.missing ?? [],
          waivedBy: row.waived_by,
          waivedReason: row.waived_reason,
        });
      }
      for (const row of approvalsRes.data ?? []) {
        const rec = (map[row.lead_id] ??= { ...EMPTY, items: [] });
        rec.approval = {
          approvedBy: row.approved_by,
          approvedAt: row.approved_at,
          exceptionReason: row.exception_reason,
        };
        rec.handoffMarkedAt = row.handoff_marked_at ?? null;
        rec.handoffReference = row.handoff_reference ?? null;
      }
      return map;
    },
  });
}

export function admissionPacketErrorMessage(error: unknown): string {
  const msg = String((error as { message?: string })?.message ?? error ?? "");
  if (msg.includes("director_approval_required")) return "Only the Director of Intake can do that.";
  if (msg.includes("waiver_reason_required")) return "Add a reason before waiving a required item.";
  if (msg.includes("exception_reason_required_for_open_blockers"))
    return "Required items are still missing — add an exception reason to approve anyway.";
  if (msg.includes("admission_approval_required_before_handoff"))
    return "Approve the admission packet before marking the CentralReach handoff.";
  if (msg.includes("not_authorized_for_intake")) return "You do not have access to the admission packet.";
  return "That change could not be saved. Try again.";
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["intake-admission-packets"] });
}

export function useSetAdmissionItem() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (input: {
      leadId: string;
      itemKey: string;
      label: string;
      required: boolean;
      status: "complete" | "missing" | "waived";
      missing?: string[];
      reason?: string | null;
    }) => {
      const { error } = await (supabase as any).rpc("intake_set_admission_item", {
        p_lead_id: input.leadId,
        p_item_key: input.itemKey,
        p_label: input.label,
        p_required: input.required,
        p_status: input.status,
        p_missing: input.missing ?? [],
        p_reason: input.reason ?? null,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useApproveAdmission() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (input: { leadId: string; exceptionReason?: string | null; revoke?: boolean }) => {
      const { error } = await (supabase as any).rpc("intake_approve_admission", {
        p_lead_id: input.leadId,
        p_exception_reason: input.exceptionReason ?? null,
        p_revoke: !!input.revoke,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useMarkAdmissionHandoff() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (input: { leadId: string; reference?: string | null }) => {
      const { error } = await (supabase as any).rpc("intake_mark_admission_handoff", {
        p_lead_id: input.leadId,
        p_reference: input.reference ?? null,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}
