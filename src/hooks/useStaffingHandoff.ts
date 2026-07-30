import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/**
 * Manual recruiting → staffing handoff.
 *
 * Recruiting proposes a match between a candidate/hire and an existing
 * client (or a minimal manually-entered staffing need). Staffing/Operations
 * owns the final accept/decline. Everything persists to
 * `recruiting_staffing_needs` + `recruiting_staffing_need_events`; nothing
 * is local-only and no clinical/PHI fields are captured.
 */

export type HandoffStatus =
  | "proposed"
  | "pending_review"
  | "needs_clarification"
  | "accepted"
  | "declined"
  | "cancelled";

export interface StaffingHandoff {
  id: string;
  client_id: string | null;
  client_label: string;
  state: string;
  city: string | null;
  service_setting: string | null;
  role_needed: string;
  priority: string | null;
  desired_start_date: string | null;
  required_availability: string | null;
  preference_notes: string | null;
  source: string | null;
  handoff_status: HandoffStatus;
  handoff_blocker: string | null;
  matched_candidate_id: string | null;
  decision_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
}

/** One audited step in a staffing handoff's life. */
export interface StaffingHandoffEvent {
  id: string;
  need_id: string;
  event_type: string;
  from_status: string | null;
  to_status: string | null;
  note: string | null;
  actor_id: string | null;
  created_at: string;
}

export interface ClientStaffingOption {
  client_id: string;
  display_label: string;
  state: string | null;
  clinic: string | null;
  service_location: string | null;
  staffing_status: string | null;
}

export interface ProposeHandoffInput {
  candidateId: string;
  clientId?: string | null;
  clientLabel: string;
  state: string;
  city?: string | null;
  serviceSetting?: string | null;
  roleNeeded: "RBT" | "BCBA";
  priority?: string | null;
  desiredStartDate?: string | null;
  requiredAvailability?: string | null;
  preferenceNotes?: string | null;
  source?: string | null;
  blocker?: string | null;
}

/** Minimum-PHI client lookup for staffing fit (secure RPC, not a table read). */
export function useClientStaffingOptions(search: string) {
  const [options, setOptions] = useState<ClientStaffingOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("recruiting_client_staffing_options", {
        _search: search || null,
        _limit: 25,
      });
      if (cancelled) return;
      if (error) {
        setOptions([]);
      } else {
        setOptions((data ?? []) as ClientStaffingOption[]);
      }
      setLoading(false);
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [search]);

  return { options, loading };
}

export function useStaffingHandoffs(candidateId?: string | null) {
  const [handoffs, setHandoffs] = useState<StaffingHandoff[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    let q = supabase
      .from("recruiting_staffing_needs")
      .select("*")
      // Only rows that originated from the manual recruiting handoff dialog.
      // Legacy / ordinary staffing needs default to handoff_status='proposed'
      // but never carry both a matched candidate and an entering recruiter.
      .not("matched_candidate_id", "is", null)
      .not("entered_by", "is", null)
      .order("created_at", { ascending: false });
    if (candidateId) q = q.eq("matched_candidate_id", candidateId);
    const { data, error } = await q;
    if (error) {
      setHandoffs([]);
    } else {
      setHandoffs((data ?? []) as unknown as StaffingHandoff[]);
    }
    setLoading(false);
  }, [candidateId]);

  useEffect(() => { refetch(); }, [refetch]);

  const logEvent = useCallback(
    async (needId: string, eventType: string, from: string | null, to: string | null, note?: string | null) => {
      const { data: auth } = await supabase.auth.getUser();
      await supabase.from("recruiting_staffing_need_events").insert({
        need_id: needId,
        event_type: eventType,
        from_status: from,
        to_status: to,
        note: note ?? null,
        actor_id: auth?.user?.id ?? null,
      });
    },
    [],
  );

  const propose = useCallback(
    async (input: ProposeHandoffInput): Promise<{ ok: boolean; duplicate?: boolean }> => {
      // Duplicate guard (also enforced by a unique index in the database).
      const { data: existing } = await supabase
        .from("recruiting_staffing_needs")
        .select("id,handoff_status")
        .eq("matched_candidate_id", input.candidateId)
        .eq("role_needed", input.roleNeeded)
        .ilike("client_label", input.clientLabel)
        .in("handoff_status", ["proposed", "pending_review", "accepted"]);
      if ((existing ?? []).length > 0) {
        toast.error("This candidate already has an active proposal for that client and role.");
        return { ok: false, duplicate: true };
      }

      const { data: auth } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("recruiting_staffing_needs")
        .insert({
          client_id: input.clientId ?? null,
          client_label: input.clientLabel,
          state: input.state,
          city: input.city ?? null,
          service_setting: input.serviceSetting ?? null,
          role_needed: input.roleNeeded,
          priority: input.priority ?? "Normal",
          desired_start_date: input.desiredStartDate ?? null,
          required_availability: input.requiredAvailability ?? null,
          preference_notes: input.preferenceNotes ?? null,
          source: input.source ?? "Recruiting",
          entered_by: auth?.user?.id ?? null,
          matched_candidate_id: input.candidateId,
          handoff_status: input.blocker ? "proposed" : "pending_review",
          handoff_blocker: input.blocker ?? null,
          status: "Match Pending",
        } as never)
        .select("id")
        .single();

      if (error || !data) {
        toast.error("Could not send this staffing proposal. Please try again.");
        return { ok: false };
      }
      await logEvent(
        (data as { id: string }).id,
        "handoff_proposed",
        null,
        input.blocker ? "proposed" : "pending_review",
        input.blocker ? `Blocked: ${input.blocker}` : null,
      );
      toast.success(
        input.blocker
          ? "Saved as a proposed future match — Staffing will see the blocker."
          : "Sent to Staffing for review.",
      );
      await refetch();
      return { ok: true };
    },
    [logEvent, refetch],
  );

  const decide = useCallback(
    async (needId: string, to: HandoffStatus, reason?: string): Promise<boolean> => {
      const current = handoffs.find((h) => h.id === needId) ?? null;
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("recruiting_staffing_needs")
        .update({
          handoff_status: to,
          decision_reason: reason ?? null,
          reviewed_by: auth?.user?.id ?? null,
          reviewed_at: new Date().toISOString(),
          ...(to === "accepted" ? { status: "Filled", filled_at: new Date().toISOString().slice(0, 10) } : {}),
        } as never)
        .eq("id", needId);
      if (error) {
        toast.error("You do not have permission to change this staffing decision.");
        return false;
      }
      await logEvent(needId, `handoff_${to}`, current?.handoff_status ?? null, to, reason ?? null);
      toast.success(`Staffing handoff marked ${to.replace("_", " ")}.`);
      await refetch();
      return true;
    },
    [handoffs, logEvent, refetch],
  );

  return { handoffs, loading, refetch, propose, decide };
}
