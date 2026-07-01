import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { LeadSourceEvent } from "@/lib/leads/leadSourceEvents";
import {
  mapRowToEvent,
  type MarketingSourceEventRow,
} from "@/lib/marketing/sourceEventMapper";

export interface MarketingCallEventRow {
  id: string;
  occurred_at: string;
  source_system: string | null;
  caller_name: string | null;
  caller_phone: string | null;
  duration_seconds: number | null;
  recording_url: string | null;
  transcript_summary: string | null;
  status: string | null;
  lead_id: string | null;
}

export interface MarketingEmailEventRow {
  id: string;
  occurred_at: string;
  event_type: string | null;
  subject: string | null;
  recipient_email: string | null;
  campaign_id: string | null;
  list_name: string | null;
  lead_id: string | null;
}

export interface LeadMarketingActivity {
  sourceEvents: LeadSourceEvent[];
  callEvents: MarketingCallEventRow[];
  emailEvents: MarketingEmailEventRow[];
  loading: boolean;
}

/**
 * Persisted marketing activity for a single lead, sourced entirely from
 * `marketing_source_events`, `marketing_call_events`, and
 * `marketing_email_events`. Backs Patient Lifetime Journey and replaces the
 * legacy in-memory `leadSourceEventsStore` lookups.
 */
export function useLeadMarketingActivity(leadId: string | null): LeadMarketingActivity {
  const [state, setState] = useState<LeadMarketingActivity>({
    sourceEvents: [],
    callEvents: [],
    emailEvents: [],
    loading: false,
  });

  useEffect(() => {
    if (!leadId) {
      setState({ sourceEvents: [], callEvents: [], emailEvents: [], loading: false });
      return;
    }
    let cancelled = false;
    setState((s) => ({ ...s, loading: true }));
    (async () => {
      const [ses, calls, emails] = await Promise.all([
        supabase
          .from("marketing_source_events")
          .select("*")
          .eq("lead_id", leadId)
          .order("occurred_at", { ascending: false }),
        supabase
          .from("marketing_call_events")
          .select("id, occurred_at, source_system, caller_name, caller_phone, duration_seconds, recording_url, transcript_summary, status, lead_id")
          .eq("lead_id", leadId)
          .order("occurred_at", { ascending: false }),
        supabase
          .from("marketing_email_events")
          .select("id, occurred_at, event_type, subject, recipient_email, campaign_id, list_name, lead_id")
          .eq("lead_id", leadId)
          .order("occurred_at", { ascending: false }),
      ]);
      if (cancelled) return;
      setState({
        sourceEvents: ((ses.data ?? []) as MarketingSourceEventRow[]).map(mapRowToEvent),
        callEvents: (calls.data ?? []) as MarketingCallEventRow[],
        emailEvents: (emails.data ?? []) as MarketingEmailEventRow[],
        loading: false,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [leadId]);

  return state;
}