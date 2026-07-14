import { useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Reads URL search params for the currently "selected" record on the page
 * (lead, client, or authorization) and resolves a short natural-language
 * summary that Blossom AI can prepend to prompts.
 *
 * The recognized params match the deep-link conventions used across the OS:
 *   ?lead=<id>          (intake_leads)
 *   ?client=<id>        (clients)
 *   ?authId=<id>        (authorization_operational_records)
 *   ?overlayId=<id>     (authorization_operational_records — legacy)
 *
 * Only fields the caller's role can already read via RLS are fetched; if the
 * record is not visible the hook simply returns nothing rather than leaking.
 */
export interface CurrentRecordContext {
  /** Human label like "Lead: Jane D. (VOB pending)". */
  label: string | null;
  /** Multi-line block suitable for prepending to an AI prompt. */
  contextText: string | null;
  /** Route the user can jump to to view the record. */
  href: string | null;
  /** Kind of record — useful for suggested prompts. */
  kind: "lead" | "client" | "authorization" | null;
  loading: boolean;
}

const EMPTY: CurrentRecordContext = {
  label: null,
  contextText: null,
  href: null,
  kind: null,
  loading: false,
};

function fmt(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s.length > 0 ? s : null;
}

export function useCurrentRecordContext(): CurrentRecordContext {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const leadId = searchParams.get("lead");
  const clientId = searchParams.get("client");
  const authId = searchParams.get("authId") ?? searchParams.get("overlayId");

  const [state, setState] = useState<CurrentRecordContext>(EMPTY);

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      if (!leadId && !clientId && !authId) {
        setState(EMPTY);
        return;
      }
      setState((prev) => ({ ...prev, loading: true }));

      try {
        if (authId) {
          const { data } = await supabase
            .from("authorization_operational_records")
            .select(
              "id, client_name, status, payer, service_code, start_date, expiration_date, authorized_units, used_units, remaining_units, state, next_action_due_date",
            )
            .eq("id", authId)
            .maybeSingle();
          if (cancelled) return;
          if (!data) return setState(EMPTY);
          const lines = [
            `Authorization for ${fmt(data.client_name) ?? "unknown client"}`,
            fmt(data.payer) && `Payer: ${data.payer}`,
            fmt(data.service_code) && `Service code: ${data.service_code}`,
            fmt(data.status) && `Status: ${data.status}`,
            (fmt(data.start_date) || fmt(data.expiration_date)) &&
              `Auth window: ${fmt(data.start_date) ?? "?"} → ${fmt(data.expiration_date) ?? "?"}`,
            data.authorized_units != null &&
              `Units: ${data.used_units ?? 0}/${data.authorized_units} used (${data.remaining_units ?? "?"} remaining)`,
            fmt(data.next_action_due_date) && `Next action due: ${data.next_action_due_date}`,
            fmt(data.state) && `State: ${data.state}`,
          ].filter(Boolean);
          setState({
            kind: "authorization",
            label: `Auth · ${fmt(data.client_name) ?? data.id.slice(0, 8)}`,
            contextText: lines.join("\n"),
            href: `${location.pathname}?authId=${data.id}`,
            loading: false,
          });
          return;
        }

        if (clientId) {
          const { data } = await supabase
            .from("clients")
            .select(
              "id, child_name, parent_name, state, stage, auth_status, scheduling_status, staffing_status, billing_status, service_location, start_date",
            )
            .eq("id", clientId)
            .maybeSingle();
          if (cancelled) return;
          if (!data) return setState(EMPTY);
          const lines = [
            `Client: ${fmt(data.child_name) ?? "unnamed"}`,
            fmt(data.parent_name) && `Parent: ${data.parent_name}`,
            fmt(data.state) && `State: ${data.state}`,
            fmt(data.stage) && `Stage: ${data.stage}`,
            fmt(data.service_location) && `Service location: ${data.service_location}`,
            fmt(data.auth_status) && `Auth: ${data.auth_status}`,
            fmt(data.scheduling_status) && `Scheduling: ${data.scheduling_status}`,
            fmt(data.staffing_status) && `Staffing: ${data.staffing_status}`,
            fmt(data.billing_status) && `Billing: ${data.billing_status}`,
            fmt(data.start_date) && `Start date: ${data.start_date}`,
          ].filter(Boolean);
          setState({
            kind: "client",
            label: `Client · ${fmt(data.child_name) ?? data.id.slice(0, 8)}`,
            contextText: lines.join("\n"),
            href: `${location.pathname}?client=${data.id}`,
            loading: false,
          });
          return;
        }

        if (leadId) {
          const { data } = await supabase
            .from("intake_leads")
            .select(
              "id, patient_first_name, patient_last_name, child_name, parent_first_name, parent_last_name, parent_name, state, vob_status, call_status, form_status, financial_status, consent_form_status",
            )
            .eq("id", leadId)
            .maybeSingle();
          if (cancelled) return;
          if (!data) return setState(EMPTY);
          const patient =
            fmt(data.child_name) ??
            [fmt(data.patient_first_name), fmt(data.patient_last_name)].filter(Boolean).join(" ") ||
            null;
          const parent =
            fmt(data.parent_name) ??
            [fmt(data.parent_first_name), fmt(data.parent_last_name)].filter(Boolean).join(" ") ||
            null;
          const lines = [
            `Lead: ${patient ?? "unnamed patient"}`,
            parent && `Parent/guardian: ${parent}`,
            fmt(data.state) && `State: ${data.state}`,
            fmt(data.vob_status) && `VOB: ${data.vob_status}`,
            fmt(data.call_status) && `Call: ${data.call_status}`,
            fmt(data.form_status) && `Forms: ${data.form_status}`,
            fmt(data.consent_form_status) && `Consent: ${data.consent_form_status}`,
            fmt(data.financial_status) && `Financial: ${data.financial_status}`,
          ].filter(Boolean);
          setState({
            kind: "lead",
            label: `Lead · ${patient ?? data.id.slice(0, 8)}`,
            contextText: lines.join("\n"),
            href: `${location.pathname}?lead=${data.id}`,
            loading: false,
          });
          return;
        }
      } catch {
        if (!cancelled) setState(EMPTY);
      }
    }

    void resolve();
    return () => {
      cancelled = true;
    };
  }, [leadId, clientId, authId, location.pathname]);

  return state;
}

/** Suggested prompts tailored to the currently selected record type. */
export function recordContextSuggestions(
  kind: CurrentRecordContext["kind"],
): string[] | null {
  switch (kind) {
    case "lead":
      return [
        "What's the next step for this lead?",
        "Which SOP covers this VOB stage?",
        "Draft a follow-up message for the parent",
      ];
    case "client":
      return [
        "Summarize this client's operational status",
        "What risks or blockers should I know about?",
        "Which team owns the next action?",
      ];
    case "authorization":
      return [
        "Summarize this authorization",
        "When does this auth need to be renewed?",
        "What's the reauth SOP for this payer?",
      ];
    default:
      return null;
  }
}
