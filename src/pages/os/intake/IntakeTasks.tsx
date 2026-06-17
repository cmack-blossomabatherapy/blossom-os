import { useMemo } from "react";
import { Link } from "react-router-dom";
import { FileText, Plus, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { GrowthPageShell, ReadyForDataNotice, Section } from "@/components/os/growth/GrowthPageShell";
import { useLeads } from "@/contexts/LeadsContext";
import type { Lead, LeadTask } from "@/data/leads";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface TaskRow {
  task: LeadTask;
  lead: Lead;
}

function bucketize(rows: TaskRow[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdue: TaskRow[] = [];
  const dueToday: TaskRow[] = [];
  const upcoming: TaskRow[] = [];
  rows.forEach((r) => {
    if (r.task.completed) return;
    if (!r.task.dueDate) { upcoming.push(r); return; }
    const due = new Date(r.task.dueDate);
    due.setHours(0, 0, 0, 0);
    if (due.getTime() < today.getTime()) overdue.push(r);
    else if (due.getTime() === today.getTime()) dueToday.push(r);
    else upcoming.push(r);
  });
  return { overdue, dueToday, upcoming };
}

function TaskCard({ row }: { row: TaskRow }) {
  const complete = () => toast.success(`Marked complete: ${row.task.title}`);
  const snooze = () => toast.success(`Snoozed: ${row.task.title}`);
  const reassign = () => {
    const next = window.prompt("Reassign to", row.task.owner || "");
    if (next && next.trim()) toast.success(`Reassigned to ${next.trim()}`);
  };
  return (
    <div className="rounded-xl border border-border/60 bg-card p-3 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-medium text-sm truncate">{row.task.title}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            <Link to={`/leads/${row.lead.id}`} className="hover:underline">{row.lead.childName}</Link>
            {row.task.workflowStep && <span> · {row.task.workflowStep}</span>}
          </div>
        </div>
        {row.task.dueDate && (
          <div className="text-[11px] text-muted-foreground shrink-0 flex items-center gap-1">
            <Clock className="h-3 w-3" /> {row.task.dueDate}
          </div>
        )}
      </div>
      <div className="mt-2 text-[11px] text-muted-foreground">
        Owner: {row.task.owner || "Unassigned"}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Button size="sm" variant="outline" onClick={complete}>Complete</Button>
        <Button size="sm" variant="ghost" onClick={snooze}>Snooze</Button>
        <Button size="sm" variant="ghost" onClick={reassign}>Reassign</Button>
      </div>
    </div>
  );
}

export default function IntakeTasks() {
  const { leads, loading } = useLeads();

  const rows = useMemo<TaskRow[]>(
    () => leads.flatMap((l) => (l.tasks ?? []).map((t) => ({ task: t, lead: l }))),
    [leads],
  );
  const { overdue, dueToday, upcoming } = useMemo(() => bucketize(rows), [rows]);
  const openTotal = overdue.length + dueToday.length + upcoming.length;

  return (
    <GrowthPageShell
      eyebrow="Growth & Admissions"
      title="Intake Tasks"
      description="Your personal intake task list — follow-ups, missing information, and lead actions."
      actions={[
        { label: "Add Lead", icon: Plus, variant: "default", to: "/leads?new=1" },
        { label: "Open Leads", icon: FileText, to: "/leads" },
      ]}
    >
      {openTotal === 0 ? (
        <ReadyForDataNotice message={loading ? "Loading tasks…" : "No open intake tasks. Tasks created from leads will appear here."} />
      ) : (
        <>
          <Section title={`Overdue (${overdue.length})`} description="Tasks past their due date.">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
              {overdue.length === 0 ? (
                <div className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-600" /> Nothing overdue.</div>
              ) : overdue.map((r) => <TaskCard key={r.task.id} row={r} />)}
            </div>
          </Section>
          <Section title={`Due today (${dueToday.length})`}>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
              {dueToday.length === 0 ? (
                <div className="text-xs text-muted-foreground">Nothing due today.</div>
              ) : dueToday.map((r) => <TaskCard key={r.task.id} row={r} />)}
            </div>
          </Section>
          <Section title={`Upcoming (${upcoming.length})`}>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
              {upcoming.length === 0 ? (
                <div className="text-xs text-muted-foreground flex items-center gap-1"><AlertCircle className="h-3 w-3" /> No upcoming tasks.</div>
              ) : upcoming.map((r) => <TaskCard key={r.task.id} row={r} />)}
            </div>
          </Section>
        </>
      )}
    </GrowthPageShell>
  );
}