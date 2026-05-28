import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { EvaluationsData } from "../useEvaluationsData";

function Kpi({ label, value, hint, tone = "muted" }: { label: string; value: string | number; hint?: string; tone?: "muted" | "ok" | "warn" | "crit" }) {
  const accent = tone === "crit" ? "text-destructive" : tone === "warn" ? "text-amber-700 dark:text-amber-400" : tone === "ok" ? "text-emerald-700 dark:text-emerald-400" : "text-foreground";
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("text-2xl font-semibold tracking-tight mt-1 tabular-nums", accent)}>{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

export default function OverviewTab({ data }: { data: EvaluationsData }) {
  const stats = useMemo(() => {
    const today = new Date();
    const in30 = new Date(); in30.setDate(today.getDate() + 30);
    const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
    const yearStart = new Date(today.getFullYear(), 0, 1);

    const active = data.staff.filter((s) => s.active_status).length;
    const overdue = data.evaluations.filter((e) => {
      if (e.final_status === "Complete") return false;
      if (e.final_status === "Overdue") return true;
      if (!e.next_review_date) return false;
      return new Date(e.next_review_date) < today;
    }).length;
    const upcoming30 = data.evaluations.filter((e) => {
      if (e.final_status === "Complete") return false;
      if (!e.next_review_date) return false;
      const d = new Date(e.next_review_date);
      return d >= today && d <= in30;
    }).length;
    const selfSent = data.evaluations.filter((e) => e.self_status !== "Not Sent").length;
    const selfCompleted = data.evaluations.filter((e) => e.self_status === "Completed").length;
    const leadershipPending = data.evaluations.filter((e) => e.leadership_status === "In Progress" || e.leadership_status === "Not Started").length;
    const meetingsNeeded = data.evaluations.filter((e) => e.final_status === "Needs Meeting" || e.meeting_status === "Not Scheduled").length;
    const completedQ = data.evaluations.filter((e) => e.completed_at && new Date(e.completed_at) >= quarterStart).length;
    const completedY = data.evaluations.filter((e) => e.completed_at && new Date(e.completed_at) >= yearStart).length;
    return { active, overdue, upcoming30, selfSent, selfCompleted, leadershipPending, meetingsNeeded, completedQ, completedY };
  }, [data]);

  if (data.loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      <Kpi label="Active BCBA / RBT" value={stats.active} hint="Staff in evaluation pool" />
      <Kpi label="Overdue" value={stats.overdue} tone={stats.overdue ? "crit" : "ok"} hint="Past next review date" />
      <Kpi label="Upcoming 30 Days" value={stats.upcoming30} tone={stats.upcoming30 ? "warn" : "muted"} />
      <Kpi label="Self Evaluations Sent" value={stats.selfSent} />
      <Kpi label="Self Evaluations Completed" value={stats.selfCompleted} />
      <Kpi label="Leadership Reviews Pending" value={stats.leadershipPending} />
      <Kpi label="Meetings Needed" value={stats.meetingsNeeded} tone={stats.meetingsNeeded ? "warn" : "muted"} />
      <Kpi label="Completed This Quarter" value={stats.completedQ} tone="ok" />
      <Kpi label="Completed This Year" value={stats.completedY} tone="ok" />
    </div>
  );
}