/**
 * Live RBT report KPI summaries for the shared `/reports` page.
 *
 * Aggregates durable data from:
 *   - `public.academy_runtime_progress` (training completion + sync_status)
 *   - `public.rbt_readiness_records`    (assigned path + module_progress)
 *   - `public.rbt_resource_prefs`       (resource completion)
 *   - `public.rbt_help_requests`, `rbt_sessions`, `rbt_supervision`
 *     (workflow signals — scoped by employees.user_id lookup)
 *
 * Returns truthful empty values when the current user has no data. Never
 * fabricates numbers.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RBT_PATHS, type RBTPathId } from "@/lib/training/rbtAcademy";
import { mergeRbtPathProgress } from "@/hooks/useMyRbtAcademyProgress";

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

const INITIAL_SUMMARIES = (): Record<RbtReportSummary["key"], RbtReportSummary> => ({
  "rbt-training-progress":    EMPTY("rbt-training-progress"),
  "rbt-readiness-status":     EMPTY("rbt-readiness-status"),
  "rbt-sessions-attendance":  EMPTY("rbt-sessions-attendance"),
  "rbt-my-supervision":       EMPTY("rbt-my-supervision"),
  "rbt-help-requests":        EMPTY("rbt-help-requests"),
  "rbt-resource-completion":  EMPTY("rbt-resource-completion"),
  "rbt-centralreach-sync":    EMPTY("rbt-centralreach-sync"),
});

export function useRbtReportSummaries(): RbtReportSummaries {
  const [state, setState] = useState<RbtReportSummaries>({
    summaries: INITIAL_SUMMARIES(),
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

        // Employee id is needed to scope rbt_sessions / rbt_help_requests /
        // rbt_supervision, which key on `rbt_employee_id` (not auth.uid()).
        const empRes = await supabase
          .from("employees")
          .select("id")
          .eq("user_id", uid)
          .maybeSingle();
        const employeeId = (empRes.data?.id as string | undefined) ?? null;

        const [runtime, readiness, prefs, sessions, help, supervision] = await Promise.all([
          (supabase.from("academy_runtime_progress" as any) as any)
            .select("status, module_id, source_module_id, journey_slug, sync_status, elapsed_seconds")
            .eq("user_id", uid)
            .eq("journey_slug", "rbt"),
          supabase
            .from("rbt_readiness_records")
            .select("path_id, current_module_id, module_progress, flags")
            .eq("user_id", uid)
            .maybeSingle(),
          supabase.from("rbt_resource_prefs").select("status, resource_id").eq("user_id", uid),
          employeeId
            ? supabase.from("rbt_sessions").select("status").eq("rbt_employee_id", employeeId)
            : Promise.resolve({ data: [] as any[] }),
          employeeId
            ? supabase.from("rbt_help_requests").select("status").eq("rbt_employee_id", employeeId)
            : Promise.resolve({ data: [] as any[] }),
          employeeId
            ? supabase.from("rbt_supervision").select("supervision_date").eq("rbt_employee_id", employeeId)
            : Promise.resolve({ data: [] as any[] }),
        ]);

        if (cancelled) return;

        const summaries = INITIAL_SUMMARIES();
        const runtimeRows = (runtime.data ?? []) as any[];
        const readinessRow = (readiness.data ?? null) as any;
        const prefRows = (prefs.data ?? []) as any[];
        const sessionRows = ((sessions as any).data ?? []) as any[];
        const helpRows = ((help as any).data ?? []) as any[];
        const supRows = ((supervision as any).data ?? []) as any[];

        /* -------- Training progress: denominator = path total modules -------- */
        const pathId = (readinessRow?.path_id as RBTPathId | undefined) ?? null;
        const basePath = pathId ? (RBT_PATHS.find((p) => p.id === pathId) ?? null) : null;
        if (basePath) {
          const merged = mergeRbtPathProgress(basePath, readinessRow?.module_progress ?? null, runtimeRows);
          const allModules = merged.phases.flatMap((ph) => ph.modules);
          const completed = allModules.filter((m) => m.status === "completed").length;
          const total = allModules.length;
          const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
          summaries["rbt-training-progress"] = {
            key: "rbt-training-progress",
            primary: `${pct}%`,
            secondary: `${completed} of ${total} modules complete`,
          };
        } else if (runtimeRows.length > 0) {
          // No path assigned yet, but the learner has touched some modules —
          // show touched-only progress, clearly labelled.
          const done = runtimeRows.filter((r) => r.status === "completed").length;
          summaries["rbt-training-progress"] = {
            key: "rbt-training-progress",
            primary: `${done}`,
            secondary: `${done} of ${runtimeRows.length} touched`,
          };
        }

        /* --------------------------- Readiness ---------------------------- */
        if (readinessRow) {
          const blocked = readinessRow.flags?.blocked;
          summaries["rbt-readiness-status"] = {
            key: "rbt-readiness-status",
            primary: blocked ? "Blocked" : (readinessRow.path_id ?? "assigned"),
            secondary: blocked?.reason
              ? String(blocked.reason)
              : readinessRow.current_module_id
                ? `on ${readinessRow.current_module_id}`
                : "path assigned",
          };
        }

        /* ---------------------- Resource completion ---------------------- */
        const completedRes = prefRows.filter((p) => p.status === "completed").length;
        if (prefRows.length > 0 || completedRes > 0) {
          summaries["rbt-resource-completion"] = {
            key: "rbt-resource-completion",
            primary: `${completedRes}`,
            secondary: `${completedRes} of ${prefRows.length} tracked`,
          };
        }

        /* ---------------- Sessions / Help / Supervision ---------------- */
        if (employeeId) {
          if (sessionRows.length > 0) {
            const completed = sessionRows.filter((s) => s.status === "completed").length;
            const cancelled = sessionRows.filter((s) => s.status === "cancelled").length;
            summaries["rbt-sessions-attendance"] = {
              key: "rbt-sessions-attendance",
              primary: `${completed}`,
              secondary: cancelled > 0 ? `${cancelled} cancelled` : `${sessionRows.length} total`,
            };
          }

          if (helpRows.length > 0) {
            const open = helpRows.filter((h) => h.status && h.status !== "resolved" && h.status !== "closed").length;
            summaries["rbt-help-requests"] = {
              key: "rbt-help-requests",
              primary: `${open}`,
              secondary: `${helpRows.length} total`,
            };
          }

          if (supRows.length > 0) {
            const latest = supRows
              .map((s) => (s.supervision_date ? new Date(s.supervision_date).getTime() : 0))
              .filter((t) => t > 0)
              .sort((a, b) => b - a)[0];
            const daysAgo = latest ? Math.round((Date.now() - latest) / 86400000) : null;
            summaries["rbt-my-supervision"] = {
              key: "rbt-my-supervision",
              primary: `${supRows.length}`,
              secondary: daysAgo == null ? "last unknown" : `last ${daysAgo}d ago`,
            };
          }
        }

        /* --------------------- CentralReach sync status ------------------- */
        // Uses sync_status from academy_runtime_progress. Anything not
        // "synced" is treated as pending. If no rows exist, keep the
        // "no data yet" fallback rather than pretending everything is OK.
        if (runtimeRows.length > 0) {
          const pending = runtimeRows.filter((r) => r.sync_status && r.sync_status !== "synced").length;
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
  }, []);

  return state;
}
