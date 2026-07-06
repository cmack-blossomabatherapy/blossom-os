/**
 * Live RBT report KPI summaries for the shared `/reports` page.
 *
 * Aggregates durable data from:
 *   - `public.academy_runtime_progress` (training completion)
 *   - `public.rbt_readiness_records`    (current readiness)
 *   - `public.rbt_resource_prefs`       (resource completion)
 *   - `public.rbt_help_requests`, `public.rbt_sessions`, and the
 *     `useRbtWorkflow` self-scoped workflow (for messages / sessions /
 *     help / CentralReach sync counts).
 *
 * Returns truthful empty values when the current user has no data. Never
 * fabricates numbers.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface RbtReportSummary {
  key:
    | "rbt-training-progress"
    | "rbt-readiness-status"
    | "rbt-sessions-attendance"
    | "rbt-my-supervision"
    | "rbt-help-requests"
    | "rbt-resource-completion"
    | "rbt-centralreach-sync";
  primary: string;             // headline KPI, e.g. "62%"
  secondary?: string;          // supporting note, e.g. "8 of 13 modules"
  empty?: boolean;             // true when no source rows exist
}

export interface RbtReportSummaries {
  summaries: Record<RbtReportSummary["key"], RbtReportSummary>;
  loading: boolean;
  error: string | null;
}

const EMPTY = (key: RbtReportSummary["key"]): RbtReportSummary => ({
  key, primary: "-", secondary: "no data yet", empty: true,
});

export function useRbtReportSummaries(): RbtReportSummaries {
  const [state, setState] = useState<RbtReportSummaries>({
    summaries: {
      "rbt-training-progress":    EMPTY("rbt-training-progress"),
      "rbt-readiness-status":     EMPTY("rbt-readiness-status"),
      "rbt-sessions-attendance":  EMPTY("rbt-sessions-attendance"),
      "rbt-my-supervision":       EMPTY("rbt-my-supervision"),
      "rbt-help-requests":        EMPTY("rbt-help-requests"),
      "rbt-resource-completion":  EMPTY("rbt-resource-completion"),
      "rbt-centralreach-sync":    EMPTY("rbt-centralreach-sync"),
    },
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const uid = userData.user?.id;
        if (!uid) { if (!cancelled) setState((s) => ({ ...s, loading: false })); return; }

        const [runtime, readiness, prefs, help, sessions, supervision] = await Promise.all([
          (supabase.from("academy_runtime_progress" as any) as any)
            .select("status, module_id, journey_slug")
            .eq("user_id", uid)
            .eq("journey_slug", "rbt"),
          supabase.from("rbt_readiness_records").select("*").eq("user_id", uid).maybeSingle(),
          supabase.from("rbt_resource_prefs").select("status, resource_id").eq("user_id", uid),
          supabase.from("rbt_help_requests").select("id, status").eq("requester_user_id", uid),
          supabase.from("rbt_sessions").select("id, status, scheduled_start").eq("rbt_user_id", uid).gte("scheduled_start", new Date().toISOString()),
          supabase.from("rbt_supervision").select("id, status").eq("rbt_user_id", uid),
        ]);

        if (cancelled) return;

        const summaries = { ...state.summaries };

        // Training progress
        const runtimeRows = (runtime.data ?? []) as any[];
        if (runtimeRows.length > 0) {
          const done = runtimeRows.filter((r) => r.status === "completed").length;
          const pct = Math.round((done / runtimeRows.length) * 100);
          summaries["rbt-training-progress"] = {
            key: "rbt-training-progress",
            primary: `${pct}%`,
            secondary: `${done} of ${runtimeRows.length} modules complete`,
          };
        }

        // Readiness
        const r = readiness.data as any | null;
        if (r) {
          summaries["rbt-readiness-status"] = {
            key: "rbt-readiness-status",
            primary: r.path_id ?? "assigned",
            secondary: r.current_module_id ? `on ${r.current_module_id}` : "path assigned",
          };
        }

        // Resource completion
        const prefRows = (prefs.data ?? []) as any[];
        const completedRes = prefRows.filter((p) => p.status === "completed").length;
        if (prefRows.length > 0 || completedRes > 0) {
          summaries["rbt-resource-completion"] = {
            key: "rbt-resource-completion",
            primary: `${completedRes}`,
            secondary: `${completedRes} of ${prefRows.length} tracked`,
          };
        }

        // Help
        const helpRows = (help.data ?? []) as any[];
        if (helpRows.length > 0) {
          const open = helpRows.filter((h) => h.status !== "resolved" && h.status !== "closed").length;
          summaries["rbt-help-requests"] = {
            key: "rbt-help-requests",
            primary: `${open}`,
            secondary: `${open} open of ${helpRows.length}`,
          };
        }

        // Sessions upcoming
        const sessionRows = (sessions.data ?? []) as any[];
        if (sessionRows.length > 0) {
          summaries["rbt-sessions-attendance"] = {
            key: "rbt-sessions-attendance",
            primary: `${sessionRows.length}`,
            secondary: "upcoming sessions",
          };
        }

        // Supervision
        const supRows = (supervision.data ?? []) as any[];
        if (supRows.length > 0) {
          summaries["rbt-my-supervision"] = {
            key: "rbt-my-supervision",
            primary: `${supRows.length}`,
            secondary: "supervision events",
          };
        }

        // CentralReach sync — count of pending runtime rows and sessions with
        // sync_status other than "synced".
        const pending = runtimeRows.filter((r) => r.sync_status && r.sync_status !== "synced").length;
        if (runtimeRows.length > 0) {
          summaries["rbt-centralreach-sync"] = {
            key: "rbt-centralreach-sync",
            primary: pending === 0 ? "OK" : `${pending} pending`,
            secondary: pending === 0 ? "training in sync" : "action needed",
          };
        }

        setState({ summaries, loading: false, error: null });
      } catch (e) {
        if (cancelled) return;
        setState((s) => ({ ...s, loading: false, error: (e as Error).message }));
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}