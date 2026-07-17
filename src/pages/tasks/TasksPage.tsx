import { Component, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertCircle, CalendarClock, CheckCircle2, Flame,
  Inbox, ListTodo, Plus, Search, Link2, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useIntakeTasksLive, type IntakeTaskRow } from "@/hooks/useIntakeTasksLive";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { TaskActivityDrawer } from "@/components/tasks/TaskActivityDrawer";
import { relatedRecordChipLabel, resolveRelatedRecordHref } from "@/lib/tasks/relatedRecord";
import { Link } from "react-router-dom";
import { useLeads } from "@/contexts/LeadsContext";

/**
 * Universal Tasks page mounted at `/tasks` for every role.
 *
 * The route wraps this component in <OSShellPage> (single Blossom OS shell
 * — sidebar + topbar). This component does NOT wrap in any additional shell,
 * so there's never a nested/duplicate header. An inline error boundary
 * catches unexpected render errors and surfaces the message directly.
 */

type FilterKey = "all" | "today" | "overdue";
type StatusKey = IntakeTaskRow["status"];

const STATUS_META: Record<StatusKey, { label: string; dot: string; text: string; bg: string; border: string }> = {
  "Open":        { label: "Not started", dot: "bg-slate-400",   text: "text-slate-700 dark:text-slate-200",     bg: "bg-slate-500/10",   border: "border-slate-500/20" },
  "In Progress": { label: "In progress", dot: "bg-sky-500",     text: "text-sky-700 dark:text-sky-200",         bg: "bg-sky-500/10",     border: "border-sky-500/20" },
  "Blocked":     { label: "Blocked",     dot: "bg-rose-500",    text: "text-rose-700 dark:text-rose-200",       bg: "bg-rose-500/10",    border: "border-rose-500/20" },
  "Completed":   { label: "Done",        dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-200", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
};

function classify(row: IntakeTaskRow): "overdue" | "today" | "upcoming" {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (!row.due_date) return "upcoming";
  const due = new Date(row.due_date); due.setHours(0, 0, 0, 0);
  if (due.getTime() < today.getTime()) return "overdue";
  if (due.getTime() === today.getTime()) return "today";
  return "upcoming";
}

function TasksInner() {
  const { tasks, loading, setStatus, complete } = useIntakeTasksLive();
  const { leads } = useLeads();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [activityTask, setActivityTask] = useState<IntakeTaskRow | null>(null);

  // Consume deep-link params once.
  useEffect(() => {
    const f = searchParams.get("filter");
    if (f === "all" || f === "today" || f === "overdue") setFilter(f);
    const q = searchParams.get("q");
    if (q) setSearch(q);
    const taskId = searchParams.get("taskId");
    if (taskId && !loading) {
      const t = tasks.find((x) => x.id === taskId);
      // Any deep link with `taskId` opens the task drawer — notifications
      // (assignment, due today, due tomorrow) all rely on this behavior.
      if (t) setActivityTask(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const open = useMemo(() => tasks.filter((t) => t.status !== "Completed"), [tasks]);
  const overdue = open.filter((r) => classify(r) === "overdue");
  const dueToday = open.filter((r) => classify(r) === "today");
  const upcoming = open.filter((r) => classify(r) === "upcoming");

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    let out = open;
    if (filter === "today") out = out.filter((r) => classify(r) === "today");
    if (filter === "overdue") out = out.filter((r) => classify(r) === "overdue");
    if (q) {
      out = out.filter((r) => {
        const hay = [r.title, r.task_type, r.owner].map((s) => String(s ?? "").toLowerCase()).join(" ");
        return hay.includes(q);
      });
    }
    return [...out].sort((a, b) => (a.due_date ?? "9999") .localeCompare(b.due_date ?? "9999"));
  }, [open, filter, search]);

  const setFilterParam = (next: FilterKey) => {
    setFilter(next);
    const p = new URLSearchParams(searchParams);
    if (next === "all") p.delete("filter"); else p.set("filter", next);
    setSearchParams(p, { replace: true });
  };

  // Clear the drawer deep-link params when the drawer closes so a browser
  // back navigation doesn't immediately re-open it.
  const closeActivity = () => {
    setActivityTask(null);
    const p = new URLSearchParams(searchParams);
    if (p.has("taskId") || p.has("activity")) {
      p.delete("taskId");
      p.delete("activity");
      setSearchParams(p, { replace: true });
    }
  };

  const tiles = [
    { key: "all",      label: "All Open",   value: open.length,     Icon: ListTodo,      tone: "text-indigo-600", onClick: () => setFilterParam("all") },
    { key: "overdue",  label: "Overdue",    value: overdue.length,  Icon: AlertCircle,   tone: "text-rose-600",   onClick: () => setFilterParam("overdue") },
    { key: "today",    label: "Due Today",  value: dueToday.length, Icon: CalendarClock, tone: "text-amber-600",  onClick: () => setFilterParam("today") },
    { key: "upcoming", label: "Upcoming",   value: upcoming.length, Icon: Inbox,         tone: "text-sky-600" },
    { key: "done",     label: "All Clear",  value: open.length === 0 ? 1 : 0, Icon: CheckCircle2, tone: "text-emerald-600" },
  ];

  const onStatusChange = async (task: IntakeTaskRow, next: StatusKey) => {
    try {
      await setStatus(task, next);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update status");
    }
  };

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Work</div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">
            Your task list — follow-ups, actions, and reminders.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> New task
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate("/leads")}>Open Leads</Button>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {tiles.map((t) => {
          const Body = (
            <div className="rounded-2xl border border-border/70 bg-card p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm">
              <div className="flex items-center justify-between">
                <t.Icon className={cn("h-4 w-4", t.tone)} />
                {filter === t.key && <Badge variant="secondary" className="h-4 px-1 text-[10px]">Filter</Badge>}
              </div>
              <p className="mt-3 text-[11px] uppercase tracking-wide text-muted-foreground">{t.label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                {loading ? "…" : t.value.toLocaleString()}
              </p>
            </div>
          );
          if (!t.onClick) return <div key={t.key}>{Body}</div>;
          return (
            <button key={t.key} type="button" onClick={t.onClick} className="text-left focus:outline-none focus:ring-2 focus:ring-ring rounded-2xl">
              {Body}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks…"
            className="pl-8 h-9"
          />
        </div>
        {(filter !== "all" || search) && (
          <Button size="sm" variant="ghost" onClick={() => { setFilter("all"); setSearch(""); setSearchParams(new URLSearchParams(), { replace: true }); }}>
            Clear filters
          </Button>
        )}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border/70 bg-card overflow-hidden">
          <div className="divide-y divide-border/60">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="h-6 w-24 rounded-full bg-muted animate-pulse" />
                <div className="h-3 flex-1 max-w-[40%] rounded bg-muted animate-pulse" />
                <div className="h-3 w-24 rounded bg-muted animate-pulse hidden md:block" />
                <div className="h-7 w-24 rounded-lg bg-muted animate-pulse ml-auto" />
              </div>
            ))}
          </div>
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 p-10 text-center">
          <ListTodo className="mx-auto h-6 w-6 text-muted-foreground/70" />
          <div className="mt-3 text-sm font-medium text-foreground">
            {open.length === 0 ? "You're all caught up." : "No tasks match this view."}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {open.length === 0 ? "New tasks will appear here as they're created." : "Try clearing the filters or search."}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> New task
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/70 bg-card overflow-hidden">
          <div className="divide-y divide-border/60">
            {visible.map((t) => {
              const meta = STATUS_META[t.status];
              const c = classify(t);
              let chipLabel = relatedRecordChipLabel(t);
              let chipHref = resolveRelatedRecordHref(t);
              if (!chipLabel && t.lead_id) {
                const l = leads.find((x) => x.id === t.lead_id);
                chipLabel = `Lead${l?.childName ? ` · ${l.childName}` : ""}`;
                chipHref = `/leads?view=pipeline&lead=${encodeURIComponent(t.lead_id)}`;
              }
              return (
                <div
                  key={t.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActivityTask(t)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActivityTask(t); } }}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors cursor-pointer focus:outline-none focus:bg-muted/40"
                >
                  <div onClick={(e) => e.stopPropagation()}>
                  <Select value={t.status} onValueChange={(v) => onStatusChange(t, v as StatusKey)}>
                    <SelectTrigger
                      aria-label="Change task status"
                      className={cn(
                        "h-6 w-auto shrink-0 px-2.5 py-0 text-[11px] font-medium rounded-full border justify-start gap-1.5 shadow-none hover:opacity-80 transition [&>svg:last-child]:hidden focus:ring-0 focus:ring-offset-0",
                        meta.bg, meta.text, meta.border,
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", meta.dot)} />
                      <SelectValue>{meta.label}</SelectValue>
                    </SelectTrigger>
                    <SelectContent align="start" className="min-w-[168px]">
                      {(Object.keys(STATUS_META) as StatusKey[]).map((s) => {
                        const m = STATUS_META[s];
                        return (
                          <SelectItem key={s} value={s} className="text-xs">
                            <span className="inline-flex items-center gap-2">
                              <span className={cn("h-2 w-2 rounded-full", m.dot)} />
                              {m.label}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground truncate">{t.title}</div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                      {t.task_type && <span>{t.task_type}</span>}
                      {t.owner && <span>· {t.owner}</span>}
                      {t.due_date && (
                        <span className={cn("inline-flex items-center gap-1", c === "overdue" && "text-rose-600", c === "today" && "text-amber-600")}>
                          <CalendarClock className="h-3 w-3" /> {new Date(t.due_date).toLocaleDateString()}
                        </span>
                      )}
                      {c === "overdue" && <Flame className="h-3 w-3 text-rose-500" />}
                      {chipLabel && (
                        chipHref ? (
                          <Link
                            to={chipHref}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background px-1.5 py-0.5 text-[10px] font-medium text-foreground/80 hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition max-w-[220px]"
                            title={`Open ${chipLabel}`}
                          >
                            <Link2 className="h-3 w-3 shrink-0" />
                            <span className="truncate">{chipLabel}</span>
                            <ArrowRight className="h-3 w-3 shrink-0 opacity-60" />
                          </Link>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted px-1.5 py-0.5 text-[10px]">
                            <Link2 className="h-3 w-3" />
                            <span className="truncate max-w-[180px]">{chipLabel}</span>
                          </span>
                        )
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                      onClick={(e) => { e.stopPropagation(); complete(t.id).catch((err) => toast.error(err instanceof Error ? err.message : "Could not complete")); }}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Complete
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <CreateTaskDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={() => { /* realtime refresh */ }} />
      <TaskActivityDrawer
        task={activityTask}
        open={!!activityTask}
        onOpenChange={(o) => { if (!o) setActivityTask(null); }}
      />
    </div>
  );
}

class TasksErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error) { console.error("[TasksPage] render error", error); }
  render() {
    if (this.state.error) {
      return (
        <div className="px-6 lg:px-10 py-12 max-w-2xl mx-auto">
          <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <h2 className="text-base font-semibold tracking-tight">Tasks failed to load</h2>
                <p className="text-sm text-muted-foreground mt-1">Something went wrong rendering the task list.</p>
                <pre className="mt-3 text-[11px] text-muted-foreground bg-muted/60 rounded-lg p-2 overflow-auto max-h-40">
                  {this.state.error.message}
                </pre>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" onClick={() => window.location.reload()}>Reload</Button>
                  <Button size="sm" variant="outline" onClick={() => this.setState({ error: null })}>Retry</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function TasksPage() {
  return (
    <TasksErrorBoundary>
      <TasksInner />
    </TasksErrorBoundary>
  );
}