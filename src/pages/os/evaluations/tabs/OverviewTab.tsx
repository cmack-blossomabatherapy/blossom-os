import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { EvaluationsData } from "../useEvaluationsData";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Mail, CalendarClock, CheckCircle2, UserPlus, XCircle } from "lucide-react";

function ActionCard({ icon: Icon, count, title, hint, tone, onView }: { icon: any; count: number; title: string; hint?: string; tone: "crit" | "warn" | "ok" | "muted"; onView?: () => void }) {
  const color = tone === "crit" ? "text-destructive bg-destructive/10" : tone === "warn" ? "text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-950/40" : tone === "ok" ? "text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/40" : "text-muted-foreground bg-muted";
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 flex items-start gap-3">
      <div className={cn("h-9 w-9 rounded-xl grid place-items-center shrink-0", color)}><Icon className="h-4 w-4" /></div>
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-semibold tabular-nums leading-none">{count}</p>
        <p className="text-xs font-medium mt-1">{title}</p>
        {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      </div>
      {onView && count > 0 && <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onView}>View</Button>}
    </div>
  );
}

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

export default function OverviewTab({ data, onGoToStaff, onGoToEmails }: { data: EvaluationsData; onGoToStaff?: () => void; onGoToEmails?: () => void }) {
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

  const attention = useMemo(() => {
    const today = new Date();
    const selfOverdue = data.evaluations.filter((e) => e.final_status !== "Complete" && e.self_status !== "Completed" && e.next_review_date && new Date(e.next_review_date) < today).length;
    const leaderWaiting = data.evaluations.filter((e) => e.final_status !== "Complete" && e.self_status === "Completed" && e.leadership_status !== "Completed").length;
    const needsMeeting = data.evaluations.filter((e) => e.final_status !== "Complete" && e.leadership_status === "Completed" && e.meeting_status === "Not Scheduled").length;
    const readyFinal = data.evaluations.filter((e) => e.final_status !== "Complete" && e.meeting_status === "Completed").length;
    const emailFails = data.emails.filter((e) => e.status === "Failed").length;
    const unscheduled = data.staff.filter((s) => s.active_status && !data.evaluations.some((e) => e.staff_id === s.id && e.final_status !== "Complete")).length;
    return { selfOverdue, leaderWaiting, needsMeeting, readyFinal, emailFails, unscheduled };
  }, [data]);

  if (data.loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  // Empty states
  if (data.staff.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/70 bg-card p-10 text-center">
        <UserPlus className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm font-medium">No BCBA/RBT staff added yet</p>
        <p className="text-xs text-muted-foreground mt-1">Add staff manually or import a staff list to begin evaluations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Center */}
      <section>
        <h2 className="text-sm font-semibold mb-3">Needs Attention</h2>
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <ActionCard icon={AlertTriangle} count={attention.selfOverdue} title="Self Evaluations Overdue" hint="Past due date" tone={attention.selfOverdue ? "crit" : "ok"} onView={onGoToStaff} />
          <ActionCard icon={Mail} count={attention.leaderWaiting} title="Leadership Reviews Pending" hint="Self complete, awaiting leadership" tone={attention.leaderWaiting ? "warn" : "ok"} onView={onGoToStaff} />
          <ActionCard icon={CalendarClock} count={attention.needsMeeting} title="Meetings Need Scheduling" tone={attention.needsMeeting ? "warn" : "ok"} onView={onGoToStaff} />
          <ActionCard icon={CheckCircle2} count={attention.readyFinal} title="Ready to Finalize" tone="ok" onView={onGoToStaff} />
          <ActionCard icon={XCircle} count={attention.emailFails} title="Email Failures" hint="Queue errors" tone={attention.emailFails ? "crit" : "ok"} onView={onGoToEmails} />
          <ActionCard icon={UserPlus} count={attention.unscheduled} title="Staff Without Active Evaluation" tone={attention.unscheduled ? "warn" : "ok"} onView={onGoToStaff} />
        </div>
      </section>

      {/* KPI Grid */}
      <section>
        <h2 className="text-sm font-semibold mb-3">Overview</h2>
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
      </section>

      {data.cycles.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border/70 bg-card p-6 text-center">
          <p className="text-sm font-medium">No evaluation cycles created yet</p>
          <p className="text-xs text-muted-foreground mt-1">Create a quarterly or annual cycle to start the evaluation process.</p>
        </div>
      )}
      {!data.settings?.email_connected && (
        <div className="rounded-xl border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
          Email sending is not connected yet. You can still build forms, create cycles, and queue emails.
        </div>
      )}
    </div>
  );
}