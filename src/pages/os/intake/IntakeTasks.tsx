import { useMemo, useState } from "react";
import { LeadNameLink } from "@/contexts/LeadDrawerContext";
import {
  Plus, Clock, AlertCircle, CheckCircle2, ExternalLink, List,
  CalendarClock, Flame, Inbox, ListTodo,
} from "lucide-react";
import { GrowthPageShell, ReadyForDataNotice } from "@/components/os/growth/GrowthPageShell";
import {
  IntakeSectionHeader, IntakePulseStrip, INTAKE_TONE, type PulseTileSpec,
} from "@/components/os/intake/IntakeVisuals";
import { cn } from "@/lib/utils";
import { useLeads } from "@/contexts/LeadsContext";
import type { Lead } from "@/data/leads";
import { useIntakeTasksLive, type IntakeTaskRow } from "@/hooks/useIntakeTasksLive";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { IntakeStateFilterToggle, useIntakeStateFilter } from "@/lib/intake/intakeStateFilter";

type FilterKey = "all" | "today" | "overdue" | "escalated";
interface TaskRow { task: IntakeTaskRow; lead: Lead | undefined }

function bucketize(rows: TaskRow[]) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const overdue: TaskRow[] = []; const dueToday: TaskRow[] = []; const upcoming: TaskRow[] = [];
  rows.forEach((r) => {
    if (r.task.status === "Completed") return;
    if (!r.task.due_date) { upcoming.push(r); return; }
    const due = new Date(r.task.due_date); due.setHours(0, 0, 0, 0);
    if (due.getTime() < today.getTime()) overdue.push(r);
    else if (due.getTime() === today.getTime()) dueToday.push(r);
    else upcoming.push(r);
  });
  return { overdue, dueToday, upcoming };
}

function TaskCard({
  row, tone, onComplete, onSnooze, onReassign,
}: {
  row: TaskRow;
  tone: keyof typeof INTAKE_TONE;
  onComplete: (id: string) => Promise<void>;
  onSnooze: (id: string) => Promise<void>;
  onReassign: (id: string, owner: string) => Promise<void>;
}) {
  const t = INTAKE_TONE[tone];
  const wrap = (label: string, fn: () => Promise<void>) => async () => {
    try { await fn(); toast.success(`${label}: ${row.task.title}`); }
    catch (e) { toast.error(e instanceof Error ? e.message : `Could not ${label.toLowerCase()}`); }
  };
  const reassign = async () => {
    const next = window.prompt("Reassign to", row.task.owner || "");
    if (next && next.trim()) {
      try { await onReassign(row.task.id, next.trim()); toast.success(`Reassigned to ${next.trim()}`); }
      catch (e) { toast.error(e instanceof Error ? e.message : "Could not reassign"); }
    }
  };
  const leadName = row.lead?.childName ?? "Lead";
  const leadId = row.lead?.id ?? row.task.lead_id;
  return (
    <div className={cn("group rounded-2xl border border-border/70 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm", t.bg)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-medium text-sm truncate">{row.task.title}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            <LeadNameLink leadId={leadId} className="hover:underline">{leadName}</LeadNameLink>
            {row.task.task_type && <span> · {row.task.task_type}</span>}
          </div>
        </div>
        {row.task.due_date && (
          <div className={cn("text-[11px] shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded-md", t.icon)}>
            <Clock className="h-3 w-3" /> {row.task.due_date}
          </div>
        )}
      </div>
      <div className="mt-2 text-[11px] text-muted-foreground">Owner: {row.task.owner || "Unassigned"}</div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Button size="sm" variant="outline" onClick={wrap("Completed", () => onComplete(row.task.id))}>Complete</Button>
        <Button size="sm" variant="ghost" onClick={wrap("Snoozed", () => onSnooze(row.task.id))}>Snooze</Button>
        <Button size="sm" variant="ghost" onClick={reassign}>Reassign</Button>
        <Button asChild size="sm" variant="ghost">
          <LeadNameLink leadId={leadId}><ExternalLink className="h-3 w-3 mr-1" /> Lead</LeadNameLink>
        </Button>
      </div>
    </div>
  );
}

export default function IntakeTasks() {
  const { leads: allLeads } = useLeads();
  const { matches } = useIntakeStateFilter();
  const { tasks, loading, complete, snooze, reassign } = useIntakeTasksLive();
  const [filter, setFilter] = useState<FilterKey>("all");

  const leadById = useMemo(() => {
    const map = new Map<string, Lead>();
    allLeads.forEach((l) => map.set(l.id, l));
    return map;
  }, [allLeads]);

  const rows = useMemo<TaskRow[]>(
    () => tasks
      .map((t) => ({ task: t, lead: leadById.get(t.lead_id) }))
      .filter((r) => (r.lead ? matches(r.lead.state) : true)),
    [tasks, leadById, matches],
  );
  const { overdue, dueToday, upcoming } = useMemo(() => bucketize(rows), [rows]);
  const escalated = useMemo(
    () => rows.filter((r) => (r.lead?.tags ?? []).some((t) => /escalat/i.test(t))),
    [rows],
  );
  const openTotal = overdue.length + dueToday.length + upcoming.length;

  const pulseTiles: PulseTileSpec[] = [
    { key: "all",       label: "All Open",   value: openTotal,        hint: "Across all buckets",   icon: ListTodo,      tone: "indigo",  onClick: () => setFilter("all") },
    { key: "overdue",   label: "Overdue",    value: overdue.length,   hint: "Past due date",        icon: AlertCircle,   tone: "rose",    onClick: () => setFilter("overdue") },
    { key: "today",     label: "Due Today",  value: dueToday.length,  hint: "Owe today",            icon: CalendarClock, tone: "amber",   onClick: () => setFilter("today") },
    { key: "upcoming",  label: "Upcoming",   value: upcoming.length,  hint: "Future tasks",         icon: Inbox,         tone: "sky" },
    { key: "escalated", label: "Escalated",  value: escalated.length, hint: "Tagged escalated",     icon: Flame,         tone: "violet",  onClick: () => setFilter("escalated") },
    { key: "done",      label: "All Clear",  value: openTotal === 0 ? 1 : 0, hint: openTotal === 0 ? "Nothing pending" : "Keep working", icon: CheckCircle2, tone: "emerald" },
  ];

  const showOverdue = filter === "all" || filter === "overdue";
  const showToday = filter === "all" || filter === "today";
  const showUpcoming = filter === "all";
  const showEscalated = filter === "all" || filter === "escalated";

  return (
    <GrowthPageShell
      eyebrow="Growth & Admissions"
      title="Intake Tasks"
      description="Your personal intake task list — follow-ups, missing information, and lead actions."
      headerRight={<IntakeStateFilterToggle />}
      actions={[
        { label: "Add Lead", icon: Plus, variant: "default", to: "/leads?new=1" },
        { label: "Open Leads", icon: List, to: "/leads" },
      ]}
    >
      <section>
        <IntakeSectionHeader icon={ListTodo} tone="indigo" title="Task Pulse" subtitle="Tap a tile to filter the lists below." />
        <IntakePulseStrip tiles={pulseTiles} loading={loading} />
      </section>

      {openTotal === 0 ? (
        <ReadyForDataNotice message={loading ? "Loading tasks…" : "No open intake tasks. Tasks created from leads will appear here."} />
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5">
            {(["all", "today", "overdue", "escalated"] as const).map((k) => (
              <button key={k} onClick={() => setFilter(k)}
                className={`px-3 py-1 rounded-full text-xs border transition ${filter === k ? "bg-foreground text-background border-foreground" : "bg-card border-border/70 hover:bg-muted"}`}>
                {k === "all" ? "All open" : k === "today" ? "Due today" : k === "overdue" ? "Overdue" : "Escalated"}
              </button>
            ))}
          </div>
          {showOverdue && (
            <section>
              <IntakeSectionHeader icon={AlertCircle} tone="rose" title={`Overdue (${overdue.length})`} subtitle="Tasks past their due date." />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                {overdue.length === 0 ? (
                  <div className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-600" /> Nothing overdue.</div>
                ) : overdue.map((r) => <TaskCard key={r.task.id} row={r} tone="rose" onComplete={complete} onSnooze={snooze} onReassign={reassign} />)}
              </div>
            </section>
          )}
          {showToday && (
            <section>
              <IntakeSectionHeader icon={CalendarClock} tone="amber" title={`Due today (${dueToday.length})`} />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                {dueToday.length === 0 ? (
                  <div className="text-xs text-muted-foreground">Nothing due today.</div>
                ) : dueToday.map((r) => <TaskCard key={r.task.id} row={r} tone="amber" onComplete={complete} onSnooze={snooze} onReassign={reassign} />)}
              </div>
            </section>
          )}
          {showUpcoming && (
            <section>
              <IntakeSectionHeader icon={Inbox} tone="sky" title={`Upcoming (${upcoming.length})`} />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                {upcoming.length === 0 ? (
                  <div className="text-xs text-muted-foreground flex items-center gap-1"><AlertCircle className="h-3 w-3" /> No upcoming tasks.</div>
                ) : upcoming.map((r) => <TaskCard key={r.task.id} row={r} tone="sky" onComplete={complete} onSnooze={snooze} onReassign={reassign} />)}
              </div>
            </section>
          )}
          {showEscalated && (
            <section>
              <IntakeSectionHeader icon={Flame} tone="violet" title={`Escalated (${escalated.length})`} subtitle="Tasks tied to leads tagged as escalated." />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                {escalated.length === 0 ? (
                  <div className="text-xs text-muted-foreground flex items-center gap-1"><Badge variant="outline" className="text-[10px]">none</Badge> No escalated tasks.</div>
                ) : escalated.map((r) => <TaskCard key={r.task.id} row={r} tone="violet" onComplete={complete} onSnooze={snooze} onReassign={reassign} />)}
              </div>
            </section>
          )}
        </>
      )}
    </GrowthPageShell>
  );
}
