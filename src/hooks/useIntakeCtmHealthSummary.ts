import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface IntakeCtmHealthSummary {
  callsLast7d: number;
  unlinkedCalls: number;
  disqualifiedLast7d: number;
  webhookErrors: number;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  configured: boolean;
}

/**
 * Director-only CTM health rollup for the Intake Dashboard. Counts only —
 * no call content or PII is read here.
 */
export function useIntakeCtmHealthSummary(enabled: boolean) {
  return useQuery<IntakeCtmHealthSummary>({
    queryKey: ["intake-ctm-health-summary"],
    enabled,
    staleTime: 60_000,
    queryFn: async () => {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const [calls, unlinked, disq, webhook, runs, cfg] = await Promise.all([
        supabase.from("ctm_call_events").select("id", { count: "exact", head: true }).gte("called_at", since),
        supabase.from("ctm_call_events").select("id", { count: "exact", head: true }).is("intake_lead_id", null).gte("called_at", since),
        supabase.from("intake_ctm_qualification_events").select("id", { count: "exact", head: true }).neq("state", "eligible").gte("created_at", since),
        supabase.from("ctm_webhook_events").select("id", { count: "exact", head: true }).eq("status", "error"),
        supabase.from("ctm_sync_runs").select("status,finished_at,started_at").order("started_at", { ascending: false }).limit(1),
        supabase.from("intake_ctm_qualification_config").select("id").limit(1).maybeSingle(),
      ]);
      const run = (runs.data ?? [])[0] as { status?: string; finished_at?: string | null; started_at?: string | null } | undefined;
      return {
        callsLast7d: calls.count ?? 0,
        unlinkedCalls: unlinked.count ?? 0,
        disqualifiedLast7d: disq.count ?? 0,
        webhookErrors: webhook.count ?? 0,
        lastSyncAt: run?.finished_at ?? run?.started_at ?? null,
        lastSyncStatus: run?.status ?? null,
        configured: !!cfg.data,
      };
    },
  });
}
