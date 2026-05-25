import { supabase } from "@/integrations/supabase/client";

/**
 * Shared HR Team query helpers — single source of truth for KPI counts
 * used across the HR Team OS pages (workspace, dashboard, operations).
 *
 * All helpers return numbers and swallow errors to 0 so KPI tiles never
 * crash the page. For full lists/rows the pages use their existing
 * dedicated hooks (useEmployeeDirectory, useRecruitingCandidates, etc.).
 */

const today = () => new Date().toISOString().slice(0, 10);
const inDays = (n: number) =>
  new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

async function safeCount(
  fn: () => PromiseLike<{ count: number | null; error: unknown }>,
): Promise<number> {
  try {
    const { count, error } = await fn();
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

/* ---------- Onboarding ---------- */
export const countNewHiresInProgress = () =>
  safeCount(() =>
    supabase
      .from("employee_onboarding")
      .select("id", { count: "exact", head: true })
      .in("status", [
        "new_hire_pending",
        "documents_in_progress",
        "background_check",
        "orientation_scheduled",
      ] as never[]),
  );

export const countOnboardingBlocked = () =>
  safeCount(() =>
    supabase
      .from("employee_onboarding")
      .select("id", { count: "exact", head: true })
      .not("blockers", "eq", "{}"),
  );

/* ---------- Orientation ---------- */
export const countOrientationThisWeek = () =>
  safeCount(() =>
    supabase
      .from("recruiting_orientation_slots")
      .select("id", { count: "exact", head: true })
      .gte("scheduled_date", today())
      .lte("scheduled_date", inDays(7))
      .not("status", "in", "(Completed,Cancelled)"),
  );

/* ---------- Training ---------- */
export const countTrainingOverdue = () =>
  safeCount(() =>
    supabase
      .from("employee_trainings")
      .select("id", { count: "exact", head: true })
      .in("status", ["assigned", "in_progress"] as never[])
      .lt("due_date", today()),
  );

export const countCertificationsExpiringSoon = (windowDays = 30) =>
  safeCount(() =>
    supabase
      .from("employee_trainings")
      .select("id", { count: "exact", head: true })
      .gte("expires_on", today())
      .lte("expires_on", inDays(windowDays)),
  );

/* ---------- HR Cases (employee support / requests) ---------- */
export const countOpenCases = () =>
  safeCount(() =>
    supabase
      .from("employee_cases")
      .select("id", { count: "exact", head: true })
      .not("status", "in", "(resolved,closed)"),
  );

export const countUrgentCases = () =>
  safeCount(() =>
    supabase
      .from("employee_cases")
      .select("id", { count: "exact", head: true })
      .eq("priority", "urgent" as never)
      .not("status", "in", "(resolved,closed)"),
  );

/* ---------- Reviews / evaluations ---------- */
export const countReviewsDue = () =>
  safeCount(() =>
    supabase
      .from("employee_reviews")
      .select("id", { count: "exact", head: true })
      .eq("status", "scheduled" as never)
      .gte("scheduled_for", today()),
  );

export const countReviewsOverdue = () =>
  safeCount(() =>
    supabase
      .from("employee_reviews")
      .select("id", { count: "exact", head: true })
      .eq("status", "scheduled" as never)
      .lt("scheduled_for", today()),
  );

/* ---------- Compliance documents ---------- */
export const countDocsExpiringSoon = (windowDays = 30) =>
  safeCount(() =>
    supabase
      .from("employee_documents_hr")
      .select("id", { count: "exact", head: true })
      .gte("expires_on", today())
      .lte("expires_on", inDays(windowDays)),
  );

export const countDocsMissing = () =>
  safeCount(() =>
    supabase
      .from("employee_documents_hr")
      .select("id", { count: "exact", head: true })
      .eq("required", true)
      .eq("status", "requested" as never),
  );

/* ---------- Roll-up for HR Workspace / Dashboard tiles ---------- */
export type HrSnapshotCounts = {
  newHiresInProgress: number;
  orientationThisWeek: number;
  trainingOverdue: number;
  certsExpiring: number;
  openCases: number;
  urgentCases: number;
  reviewsDue: number;
  reviewsOverdue: number;
  docsExpiring: number;
  docsMissing: number;
};

export async function loadHrSnapshot(): Promise<HrSnapshotCounts> {
  const [
    newHiresInProgress,
    orientationThisWeek,
    trainingOverdue,
    certsExpiring,
    openCases,
    urgentCases,
    reviewsDue,
    reviewsOverdue,
    docsExpiring,
    docsMissing,
  ] = await Promise.all([
    countNewHiresInProgress(),
    countOrientationThisWeek(),
    countTrainingOverdue(),
    countCertificationsExpiringSoon(),
    countOpenCases(),
    countUrgentCases(),
    countReviewsDue(),
    countReviewsOverdue(),
    countDocsExpiringSoon(),
    countDocsMissing(),
  ]);

  return {
    newHiresInProgress,
    orientationThisWeek,
    trainingOverdue,
    certsExpiring,
    openCases,
    urgentCases,
    reviewsDue,
    reviewsOverdue,
    docsExpiring,
    docsMissing,
  };
}