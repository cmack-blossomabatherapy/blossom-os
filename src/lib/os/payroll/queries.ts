import { supabase } from "@/integrations/supabase/client";

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function safeCount(fn: () => PromiseLike<{ count: number | null; error: unknown }>): Promise<number> {
  try {
    const { count, error } = await fn();
    return error ? 0 : count ?? 0;
  } catch {
    return 0;
  }
}

export const countOpenIssues = () =>
  safeCount(() =>
    supabase
      .from("payroll_issues")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "in_progress"] as never[])
  );

export const countOverdueIssues = () =>
  safeCount(() =>
    supabase
      .from("payroll_issues")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "in_progress"] as never[])
      .lt("due_date", today())
  );

export const countPendingAdjustments = () =>
  safeCount(() =>
    supabase
      .from("payroll_adjustments")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending" as never)
  );

export const countPendingPto = () =>
  safeCount(() =>
    supabase
      .from("pto_requests")
      .select("id", { count: "exact", head: true })
      .in("status", ["submitted", "pending_review"] as never[])
  );

export const countOpenRunsToFinalize = () =>
  safeCount(() =>
    supabase
      .from("payroll_runs")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "in_progress"] as never[])
  );

export const countDraftTimesheets = () =>
  safeCount(() =>
    supabase
      .from("hours_timesheets")
      .select("id", { count: "exact", head: true })
      .eq("status", "draft" as never)
  );

export const countScheduledReminders = () =>
  safeCount(() =>
    supabase
      .from("payroll_reminders")
      .select("id", { count: "exact", head: true })
      .eq("status", "scheduled" as never)
  );