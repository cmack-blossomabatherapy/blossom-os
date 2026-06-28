import { useMemo, useState } from "react";
import { LeadNameLink, useLeadDrawer } from "@/contexts/LeadDrawerContext";
import {
  Plus, AlertCircle, CheckCircle2, List, Play,
  CalendarClock, Flame, Inbox, ListTodo, Search, ArrowUpDown,
} from "lucide-react";
import { GrowthPageShell, ReadyForDataNotice } from "@/components/os/growth/GrowthPageShell";
import {
  IntakeSectionHeader, IntakePulseStrip, type PulseTileSpec,
} from "@/components/os/intake/IntakeVisuals";
import { cn } from "@/lib/utils";
import { useLeads } from "@/contexts/LeadsContext";
import type { Lead } from "@/data/leads";
import { useIntakeTasksLive, type IntakeTaskRow } from "@/hooks/useIntakeTasksLive";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { IntakeStateFilterToggle, useIntakeStateFilter } from "@/lib/intake/intakeStateFilter";
import { useNavigate } from "react-router-dom";

type FilterKey = "all" | "today" | "overdue" | "escalated";
type SortKey = "due" | "lead" | "owner" | "title";
interface TaskRow { task: IntakeTaskRow; lead: Lead | undefined }

function classify(r: TaskRow): "overdue" | "today" | "upcoming" {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (!r.task.due_date) return "upcoming";
  const due = new Date(r.task.due_date); due.setHours(0, 0, 0, 0);
  if (due.getTime() < today.getTime()) return "overdue";
  if (due.getTime() === today.getTime()) return "today";
  return "upcoming";
}

export default function IntakeTasks() {
  const { leads: allLeads } = useLeads();
  const { matches } = useIntakeStateFilter();
  const { tasks, loading, complete, snooze, reassign } = useIntakeTasksLive();
  const { openLead } = useLeadDrawer();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("due");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const leadById = useMemo(() => {
    const map = new Map<string, Lead>();
    allLeads.forEach((l) => map.set(l.id, l));
    return map;
  }, [allLeads]);

  const rows = useMemo<TaskRow[]>(
    () => tasks
      .filter((t) => t.status !== "Completed")
      .map((t) => ({ task: t, lead: leadById.get(t.lead_id) }))
      .filter((r) => (r.lead ? matches(r.lead.state) : true)),
    [tasks, leadById, matches],
  );
  const overdue = rows.filter((r) => classify(r) === "overdue");
  const dueToday = rows.filter((r) => classify(r) === "today");
  const upcoming = rows.filter((r) => classify(r) === "upcoming");
  const escalated = useMemo(
    () => rows.filter((r) => (r.lead?.tags ?? []).some((t) => /escalat/i.test(t))),
    [rows],
  );
  const openTotal = rows.length;

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    let out = rows.filter((r) => {
      const c = classify(r);
      if (filter === "today" && c !== "today") return false;
      if (filter === "overdue" && c !== "overdue") return false;
      if (filter === "escalated" && !(r.lead?.tags ?? []).some((t) => /escalat/i.test(t))) return false;
      if (q) {
        const hay = [r.task.title, r.task.task_type, r.task.owner, r.lead?.childName, r.lead?.parentName]
          .map((s) => String(s ?? "").toLowerCase()).join(" ");
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    out = [...out].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      const get = (r: TaskRow): string => {
        switch (sortKey) {
          case "due": return r.task.due_date ?? "9999-12-31";
          case "lead": return r.lead?.childName ?? "";
          case "owner": return r.task.owner ?? "";
          case "title": return r.task.title ?? "";
        }
      };
      return get(a).localeCompare(get(b)) * dir;
    });
    return out;
  }, [rows, filter, search, sortKey, sortDir]);

  const pulseTiles: PulseTileSpec[] = [
    { key: "all",       label: "All Open",   value: openTotal,        hint: "Across all buckets",   icon: ListTodo,      tone: "indigo",  onClick: () => setFilter("all") },
    { key: "overdue",   label: "Overdue",    value: overdue.length,   hint: "Past due date",        icon: AlertCircle,   tone: "rose",    onClick: () => setFilter("overdue") },
    { key: "today",     label: "Due Today",  value: dueToday.length,  hint: "Owe today",            icon: CalendarClock, tone: "amber",   onClick: () => setFilter("today") },
    { key: "upcoming",  label: "Upcoming",   value: upcoming.length,  hint: "Future tasks",         icon: Inbox,         tone: "sky" },
    { key: "escalated", label: "Escalated",  value: escalated.length, hint: "Tagged escalated",     icon: Flame,         tone: "violet",  onClick: () => setFilter("escalated") },
    { key: "done",      label: "All Clear",  value: openTotal === 0 ? 1 : 0, hint: openTotal === 0 ? "Nothing pending" : "Keep working", icon: CheckCircle2, tone: "emerald" },
  ];

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir("asc"); }
  };
  const SortBtn = ({ k, children }: { k: SortKey; children: React.ReactNode }) => (
    <button onClick={() => toggleSort(k)} className="inline-flex items-center gap-1 hover:text-foreground">
      {children} <ArrowUpDown className={cn("h-3 w-3 opacity-50", sortKey === k && "opacity-100 text-primary")} />
    </button>
  );

  const onReassignRow = async (row: TaskRow) => {
    const next = window.prompt("Reassign to", row.task.owner || "");
    if (next && next.trim()) {
      try { await reassign(row.task.id, next.trim()); toast.success(`Reassigned to ${next.trim()}`); }
      catch (e) { toast.error(e instanceof Error ? e.message : "Could not reassign"); }
    }
  };

  const startTask = (row: TaskRow) => {
    const leadId = row.lead?.id ?? row.task.lead_id;
    const text = `${row.task.task_type ?? ""} ${row.task.title ?? ""}`.toLowerCase();
    if (/missing|packet|document|signature|consent/.test(text)) {
      navigate(`/intake/missing-information?leadId=${encodeURIComponent(leadId)}`);
      return;
    }
    if (/staff|match|schedul|assess|ready/.test(text)) {
      navigate(`/intake/lead-to-active?leadId=${encodeURIComponent(leadId)}`);
      return;
    }
    if (/referr/.test(text)) {
      navigate(`/intake/referral-queue?leadId=${encodeURIComponent(leadId)}`);
      return;
    }
    // Default: open the lead drawer so the user can act in context
    openLead(leadId);
  };

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
        <section className="space-y-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-center p-2 rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search task, lead, owner…" className="pl-9 h-9 bg-transparent border-0 focus-visible:ring-0" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(["all", "today", "overdue", "escalated"] as const).map((k) => (
                <button key={k} onClick={() => setFilter(k)}
                  className={cn("px-3 py-1 rounded-full text-xs border transition",
                    filter === k ? "bg-foreground text-background border-foreground" : "bg-card border-border/70 hover:bg-muted")}>
                  {k === "all" ? "All open" : k === "today" ? "Due today" : k === "overdue" ? "Overdue" : "Escalated"}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs text-muted-foreground">
                  <tr className="text-left">
                    <th className="px-3 py-2 w-24">Status</th>
                    <th className="px-3 py-2"><SortBtn k="title">Task</SortBtn></th>
                    <th className="px-3 py-2"><SortBtn k="lead">Lead</SortBtn></th>
                    <th className="px-3 py-2 w-32">Type</th>
                    <th className="px-3 py-2 w-28"><SortBtn k="due">Due</SortBtn></th>
                    <th className="px-3 py-2 w-36"><SortBtn k="owner">Owner</SortBtn></th>
                    <th className="px-3 py-2 w-[300px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {visible.length === 0 ? (
                    <tr><td colSpan={7} className="px-3 py-8 text-center text-xs text-muted-foreground">No tasks match the current filters.</td></tr>
                  ) : visible.map((r) => {
                    const c = classify(r);
                    const leadName = r.lead?.childName ?? "Lead";
                    const leadId = r.lead?.id ?? r.task.lead_id;
                    const isEscalated = (r.lead?.tags ?? []).some((t) => /escalat/i.test(t));
                    const wrap = (label: string, fn: () => Promise<void>) => async () => {
                      try { await fn(); toast.success(`${label}: ${r.task.title}`); }
                      catch (e) { toast.error(e instanceof Error ? e.message : `Could not ${label.toLowerCase()}`); }
                    };
                    return (
                      <tr key={r.task.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            {c === "overdue" && <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30">Overdue</Badge>}
                            {c === "today" && <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30">Today</Badge>}
                            {c === "upcoming" && <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30">Upcoming</Badge>}
                            {isEscalated && <Flame className="h-3 w-3 text-violet-600" aria-label="Escalated" />}
                          </div>
                        </td>
                        <td className="px-3 py-2 font-medium text-foreground truncate max-w-[280px]">{r.task.title}</td>
                        <td className="px-3 py-2">
                          <LeadNameLink leadId={leadId} className="hover:underline text-foreground">{leadName}</LeadNameLink>
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{r.task.task_type || "—"}</td>
                        <td className={cn("px-3 py-2 text-xs", c === "overdue" && "text-rose-700 dark:text-rose-300 font-medium")}>
                          {r.task.due_date || "—"}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground truncate max-w-[180px]">{r.task.owner || "Unassigned"}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="default" className="h-7 px-2.5 text-xs gap-1" onClick={() => startTask(r)}>
                              <Play className="h-3 w-3" /> Start
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={wrap("Completed", () => complete(r.task.id))}>Complete</Button>
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={wrap("Snoozed", () => snooze(r.task.id))}>Snooze</Button>
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => onReassignRow(r)}>Reassign</Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-3 py-2 border-t border-border/60 text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Showing {visible.length} of {openTotal}</span>
              <span className="hidden md:inline">Click column headers to sort.</span>
            </div>
          </div>
        </section>
      )}
    </GrowthPageShell>
  );
}
