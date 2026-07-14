import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getAiScope } from "@/lib/ai/aiPermissions";
import type { OSRole } from "@/lib/os/permissions";

export type InsightSeverity = "risk" | "watch" | "info";

export interface BlossomInsight {
  id: string;
  title: string;
  detail: string;
  severity: InsightSeverity;
  module: string;
  href?: string;
  count?: number;
}

const DAY = 24 * 60 * 60 * 1000;

async function loadInsights(role: OSRole, state: string, userId: string | null) {
  const scope = getAiScope(role);
  const results: BlossomInsight[] = [];
  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * DAY).toISOString().slice(0, 10);
  const nowIso = now.toISOString();
  const cutoff14 = new Date(now.getTime() - 14 * DAY).toISOString();
  const cutoff7 = new Date(now.getTime() - 7 * DAY).toISOString();
  const useState = scope.dataScope === "state" && state && state !== "ALL";

  // Run everything in parallel. Failures on individual queries never blow up the whole set.
  const settle = async <T>(p: PromiseLike<T>) => {
    try { return await p; } catch { return null; }
  };

  // 1) Auths expiring ≤ 30d
  const authsPromise = (async () => {
    let q = supabase.from("client_authorizations")
      .select("id, expiration_date, payor, state, kind", { count: "exact" })
      .not("expiration_date", "is", null)
      .lte("expiration_date", in30)
      .gte("expiration_date", now.toISOString().slice(0, 10))
      .order("expiration_date", { ascending: true })
      .limit(1);
    if (useState) q = q.eq("state", state);
    return q;
  })();

  // 2) Open critical alerts
  const alertsPromise = supabase.from("critical_alerts")
    .select("id, title, category", { count: "exact" })
    .eq("status", "open")
    .order("due_at", { ascending: true })
    .limit(1);

  // 3) Coverage cases
  const coveragePromise = (async () => {
    let q = supabase.from("scheduling_coverage_cases")
      .select("id, case_type, state, risk_level", { count: "exact" })
      .in("status", ["open", "in_progress"])
      .limit(1);
    if (useState) q = q.eq("state", state);
    return q;
  })();

  // 4) My overdue tasks
  const tasksPromise = userId
    ? supabase.from("user_tasks")
        .select("id, title, due_at", { count: "exact" })
        .eq("assignee_id", userId)
        .lt("due_at", nowIso)
        .neq("status", "done")
        .order("due_at", { ascending: true })
        .limit(1)
    : Promise.resolve(null);

  // 5) Stalled recruiting candidates (RLS: only recruiting/leadership see rows)
  const recruitPromise = (async () => {
    let q = supabase.from("recruiting_candidates")
      .select("id, first_name, last_name, pipeline_stage, updated_at, state", { count: "exact" })
      .lt("updated_at", cutoff14)
      .not("pipeline_stage", "in", "(Staffed,Withdrawn,Rejected)")
      .eq("is_archived", false)
      .order("updated_at", { ascending: true })
      .limit(1);
    if (useState) q = q.eq("state", state as never);
    return q;
  })();

  // 6) Recent high-priority ops work items
  const opsPromise = supabase.from("operations_work_items")
    .select("id, title, priority, status", { count: "exact" })
    .in("priority", ["high", "urgent", "critical"])
    .eq("status", "open")
    .gte("created_at", cutoff7)
    .order("created_at", { ascending: false })
    .limit(1);

  const [auths, alerts, coverage, tasks, recruit, ops] = await Promise.all([
    settle(authsPromise), settle(alertsPromise), settle(coveragePromise),
    settle(tasksPromise), settle(recruitPromise), settle(opsPromise),
  ]);

  // 1) Authorizations
  if (auths?.count) {
    const row = auths.data?.[0];
    const days = row?.expiration_date
      ? Math.max(0, Math.ceil((new Date(row.expiration_date).getTime() - now.getTime()) / DAY))
      : null;
    results.push({
      id: "auths-expiring",
      title: `${auths.count} authorization${auths.count === 1 ? "" : "s"} expiring in 30 days`,
      detail: row
        ? `Next: ${row.payor ?? "Payor unknown"} · ${row.kind ?? ""}${days !== null ? ` — in ${days} day${days === 1 ? "" : "s"}` : ""}${useState ? ` · ${state}` : ""}`
        : "Review the authorizations queue.",
      severity: auths.count >= 3 ? "risk" : "watch",
      module: "authorizations",
      href: "/authorizations",
      count: auths.count,
    });
  }

  // 2) Alerts
  if (alerts?.count) {
    const row = alerts.data?.[0];
    results.push({
      id: "alerts-open",
      title: `${alerts.count} open critical alert${alerts.count === 1 ? "" : "s"}`,
      detail: row ? `Newest: ${row.title}` : "Review critical alerts.",
      severity: "risk",
      module: "alerts",
      href: "/admin/alerts",
      count: alerts.count,
    });
  }

  // 3) Coverage
  if (coverage?.count) {
    const row = coverage.data?.[0];
    results.push({
      id: "coverage-open",
      title: `${coverage.count} open coverage case${coverage.count === 1 ? "" : "s"}`,
      detail: row ? `${row.case_type ?? "Coverage gap"}${useState ? ` · ${state}` : ""}` : "Open the Coverage board.",
      severity: coverage.count >= 5 ? "risk" : "watch",
      module: "scheduling",
      href: "/scheduling/coverage",
      count: coverage.count,
    });
  }

  // 4) My overdue tasks
  if (tasks?.count) {
    const row = tasks.data?.[0];
    results.push({
      id: "my-overdue-tasks",
      title: `${tasks.count} of your task${tasks.count === 1 ? " is" : "s are"} overdue`,
      detail: row ? `Oldest: “${row.title}”` : "Open your task list.",
      severity: "risk",
      module: "tasks",
      href: "/tasks",
      count: tasks.count,
    });
  }

  // 5) Recruiting (only surface when recruiting/leadership actually see data)
  if (recruit?.count) {
    const row = recruit.data?.[0];
    const days = row?.updated_at
      ? Math.floor((now.getTime() - new Date(row.updated_at).getTime()) / DAY)
      : null;
    results.push({
      id: "recruit-stalled",
      title: `${recruit.count} recruiting candidate${recruit.count === 1 ? "" : "s"} stalled 14+ days`,
      detail: row
        ? `Oldest: ${row.first_name} ${row.last_name} · ${row.pipeline_stage}${days !== null ? ` · ${days}d idle` : ""}`
        : "Reactivate stalled candidates.",
      severity: "watch",
      module: "recruiting",
      href: "/recruiting/pipeline",
      count: recruit.count,
    });
  }

  // 6) Ops work items
  if (ops?.count) {
    const row = ops.data?.[0];
    results.push({
      id: "ops-high",
      title: `${ops.count} high-priority ops item${ops.count === 1 ? "" : "s"} this week`,
      detail: row ? `Latest: ${row.title}` : "Review the work queue.",
      severity: "watch",
      module: "operations",
      href: "/work-queue",
      count: ops.count,
    });
  }

  if (results.length === 0) {
    results.push({
      id: "all-clear",
      title: "No risks flagged in your scope right now.",
      detail: "You’re current on authorizations, alerts, coverage, tasks, and staffing.",
      severity: "info",
      module: "status",
    });
  }

  return results;
}

export function useBlossomAiInsights(role: OSRole, state: string) {
  const { user } = useAuth();
  const uid = user?.id ?? null;
  const query = useQuery({
    queryKey: ["blossom-ai-insights", role, state, uid],
    queryFn: () => loadInsights(role, state, uid),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const refresh = useCallback(() => { void query.refetch(); }, [query]);
  return {
    insights: query.data ?? [],
    loading: query.isLoading,
    refreshing: query.isFetching && !query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refresh,
  };
}
