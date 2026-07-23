import { useEffect, useMemo, useRef, useState } from "react";
import { LeadNameLink } from "@/contexts/LeadDrawerContext";
import {
  Plus, AlertCircle, CheckCircle2, List, Play,
  CalendarClock, Flame, Inbox, ListTodo, Search, ArrowUpDown,
} from "lucide-react";
import { Filter, X } from "lucide-react";
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
import { useNavigate, useSearchParams } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Lock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AssigneePicker } from "@/components/tasks/AssigneePicker";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Circle, Loader2, Ban, CheckCircle2 as CheckIcon } from "lucide-react";
import { Activity as ActivityIcon } from "lucide-react";
import { TaskActivityDrawer } from "@/components/tasks/TaskActivityDrawer";

const STATUS_META: Record<IntakeTaskRow["status"], { label: string; dot: string; text: string; bg: string; border: string; Icon: React.ComponentType<{ className?: string }> }> = {
  "Open":        { label: "Not started", dot: "bg-slate-400",  text: "text-slate-700 dark:text-slate-200", bg: "bg-slate-500/10",  border: "border-slate-500/30",  Icon: Circle },
  "In Progress": { label: "In progress", dot: "bg-sky-500",     text: "text-sky-700 dark:text-sky-200",     bg: "bg-sky-500/10",     border: "border-sky-500/30",     Icon: Loader2 },
  "Blocked":     { label: "Blocked",     dot: "bg-rose-500",    text: "text-rose-700 dark:text-rose-200",   bg: "bg-rose-500/10",    border: "border-rose-500/30",    Icon: Ban },
  "Completed":   { label: "Done",        dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-200", bg: "bg-emerald-500/10", border: "border-emerald-500/30", Icon: CheckIcon },
};

function InlineStatusPicker({ value, onChange, disabled }: {
  value: IntakeTaskRow["status"];
  onChange: (next: IntakeTaskRow["status"]) => void;
  disabled?: boolean;
}) {
  const meta = STATUS_META[value];
  const Icon = meta.Icon;
  return (
    <Select value={value} onValueChange={(v) => onChange(v as IntakeTaskRow["status"])} disabled={disabled}>
      <SelectTrigger
        aria-label="Change task status"
        className={cn(
          "h-7 w-[132px] px-2 py-0 text-[11px] font-medium rounded-full gap-1.5 border",
          meta.bg, meta.text, meta.border,
        )}
      >
        <span className="inline-flex items-center gap-1.5">
          <Icon className={cn("h-3 w-3", value === "In Progress" && "animate-spin")} />
          <SelectValue>{meta.label}</SelectValue>
        </span>
      </SelectTrigger>
      <SelectContent align="start" className="min-w-[168px]">
        {(Object.keys(STATUS_META) as IntakeTaskRow["status"][]).map((s) => {
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
  );
}

type FilterKey = "all" | "today" | "overdue" | "escalated";
type SortKey = "due" | "lead" | "owner" | "title";
type StatusKey = "Open" | "In Progress" | "Blocked";
type DueRangeKey = "any" | "overdue" | "today" | "7d" | "30d" | "unscheduled";
type FlagKey = "any" | "blocked" | "actionable" | "unassigned";
interface TaskRow { task: IntakeTaskRow; lead: Lead | undefined }

function classify(r: TaskRow): "overdue" | "today" | "upcoming" {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (!r.task.due_date) return "upcoming";
  const due = new Date(r.task.due_date); due.setHours(0, 0, 0, 0);
  if (due.getTime() < today.getTime()) return "overdue";
  if (due.getTime() === today.getTime()) return "today";
  return "upcoming";
}

type Destination = {
  to?: string;
  drawer?: boolean;
  label: string;
  nextStep: string;
  section: string;
};

function resolveDestination(row: TaskRow): Destination {
  const leadId = row.lead?.id ?? row.task.lead_id ?? "";
  const text = `${row.task.task_type ?? ""} ${row.task.title ?? ""}`.toLowerCase();
  const focus = `taskId=${encodeURIComponent(row.task.id)}#task-${row.task.id}`;
  if (/missing|packet|document|signature|consent/.test(text)) {
    return {
      to: `/intake/missing-information?leadId=${encodeURIComponent(leadId)}&${focus}`,
      label: "Packet & Missing Info",
      section: "Documents checklist",
      nextStep: "Request, upload, or confirm the missing documents for this lead.",
    };
  }
  if (/staff|match|schedul|assess|ready/.test(text)) {
    return {
      to: `/leads?view=pipeline&lead=${encodeURIComponent(leadId)}&${focus}`,
      label: "Lead → Active pipeline",
      section: "Scheduling / staffing card",
      nextStep: "Move the lead through staffing, scheduling, or assessment steps.",
    };
  }
  if (/referr/.test(text)) {
    return {
      to: `/intake/dashboard?leadId=${encodeURIComponent(leadId)}&${focus}`,
      label: "Intake dashboard",
      section: "Referral intake",
      nextStep: "Triage the referral and capture intake details.",
    };
  }
  return {
    drawer: true,
    label: "Lead drawer",
    section: "Lead overview & actions",
    nextStep: "Use the action panel in the drawer to complete this task.",
  };
}

function getBlockReason(row: TaskRow): string | null {
  if (row.task.status === "Blocked") return "Task is marked Blocked — clear the blocker first.";
  if (!row.task.owner || !row.task.owner.trim()) return "No owner assigned — reassign before starting.";
  if (!row.lead) return "Lead record not found — open the lead first.";
  return null;
}

interface IntakeTasksProps {
  /**
   * `intake` (default) renders the Growth & Admissions workspace variant with
   * lead-scoped filters and the "Add Lead" action. `universal` renders the
   * generic Tasks page used at `/tasks` for every role.
   */
  variant?: "intake" | "universal";
  /** When true, GrowthPageShell will not wrap in its own OSShell — used when
   *  the route already provides the Blossom OS shell (see /tasks). */
  noShell?: boolean;
}

export default function IntakeTasks({ variant = "intake", noShell = false }: IntakeTasksProps = {}) {
  const isUniversal = variant === "universal";
  const { leads: allLeads } = useLeads();
  const { matches } = useIntakeStateFilter();
  const { tasks, loading, complete, snooze, reassign, markStarted, setStatus } = useIntakeTasksLive();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("due");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  // Fast-filter state — status, owner, due range, and blocker/next-step flag.
  const [statuses, setStatuses] = useState<StatusKey[]>([]);
  const [owners, setOwners] = useState<string[]>([]);
  const [dueRange, setDueRange] = useState<DueRangeKey>("any");
  const [flag, setFlag] = useState<FlagKey>("any");
  const [createOpen, setCreateOpen] = useState(false);
  const [activityTask, setActivityTask] = useState<IntakeTaskRow | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const consumedDeepLinkRef = useRef(false);

  // Apply deep-link params once on mount (filter, status, owner, due, flag, q).
  useEffect(() => {
    if (consumedDeepLinkRef.current) return;
    const f = searchParams.get("filter");
    if (f === "all" || f === "today" || f === "overdue" || f === "escalated") setFilter(f);
    const st = searchParams.get("status");
    if (st) {
      const parts = st.split(",").map((s) => s.trim()).filter(Boolean) as StatusKey[];
      const valid = parts.filter((s) => s === "Open" || s === "In Progress" || s === "Blocked");
      if (valid.length) setStatuses(valid);
    }
    const ow = searchParams.get("owner");
    if (ow) setOwners(ow.split(",").map((s) => s.trim()).filter(Boolean));
    const dr = searchParams.get("due");
    if (dr === "any" || dr === "overdue" || dr === "today" || dr === "7d" || dr === "30d" || dr === "unscheduled") setDueRange(dr);
    const fl = searchParams.get("flag");
    if (fl === "any" || fl === "blocked" || fl === "actionable" || fl === "unassigned") setFlag(fl);
    const q = searchParams.get("q");
    if (q) setSearch(q);
    consumedDeepLinkRef.current = true;
  }, [searchParams]);

  // When a taskId is deep-linked, scroll to and highlight the row, and open
  // the activity drawer if `?activity=1`.
  const deepTaskId = searchParams.get("taskId");
  const deepActivity = searchParams.get("activity") === "1";
  useEffect(() => {
    if (!deepTaskId || loading) return;
    const target = tasks.find((t) => t.id === deepTaskId);
    if (!target) return;
    setFocusedTaskId(deepTaskId);
    if (deepActivity) setActivityTask(target);
    const el = rowRefs.current[deepTaskId];
    if (el) {
      requestAnimationFrame(() => el.scrollIntoView({ behavior: "smooth", block: "center" }));
    }
    const timer = window.setTimeout(() => setFocusedTaskId(null), 2600);
    return () => window.clearTimeout(timer);
  }, [deepTaskId, deepActivity, loading, tasks]);

  const leadById = useMemo(() => {
    const map = new Map<string, Lead>();
    allLeads.forEach((l) => map.set(l.id, l));
    return map;
  }, [allLeads]);

  const rows = useMemo<TaskRow[]>(
    () => tasks
      .filter((t) => t.status !== "Completed")
      .map((t) => ({ task: t, lead: t.lead_id ? leadById.get(t.lead_id) : undefined }))
      .filter((r) => (r.lead ? matches(r.lead.state) : true)),
    [tasks, leadById, matches],
  );
  const ownerOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => { const o = (r.task.owner ?? "").trim(); if (o) set.add(o); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows]);
  const hasUnassigned = useMemo(() => rows.some((r) => !r.task.owner || !r.task.owner.trim()), [rows]);
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
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const inDays = (d: Date, n: number) => {
      const cutoff = new Date(today); cutoff.setDate(cutoff.getDate() + n);
      return d.getTime() >= today.getTime() && d.getTime() <= cutoff.getTime();
    };
    let out = rows.filter((r) => {
      const c = classify(r);
      if (filter === "today" && c !== "today") return false;
      if (filter === "overdue" && c !== "overdue") return false;
      if (filter === "escalated" && !(r.lead?.tags ?? []).some((t) => /escalat/i.test(t))) return false;
      // Status multi-select
      if (statuses.length > 0 && !statuses.includes(r.task.status as StatusKey)) return false;
      // Owner multi-select — "Unassigned" is a synthetic bucket
      if (owners.length > 0) {
        const owner = (r.task.owner ?? "").trim();
        const isUnassigned = !owner;
        const wantsUnassigned = owners.includes("__unassigned__");
        const ownerMatch = owner && owners.includes(owner);
        if (!(ownerMatch || (isUnassigned && wantsUnassigned))) return false;
      }
      // Due date range
      if (dueRange !== "any") {
        if (dueRange === "unscheduled") {
          if (r.task.due_date) return false;
        } else if (!r.task.due_date) {
          return false;
        } else {
          const due = new Date(r.task.due_date); due.setHours(0, 0, 0, 0);
          if (dueRange === "overdue" && !(due.getTime() < today.getTime())) return false;
          if (dueRange === "today" && due.getTime() !== today.getTime()) return false;
          if (dueRange === "7d" && !inDays(due, 7)) return false;
          if (dueRange === "30d" && !inDays(due, 30)) return false;
        }
      }
      // Blocker / next-step flag
      if (flag !== "any") {
        const reason = getBlockReason(r);
        const isUnassignedRow = !r.task.owner || !r.task.owner.trim();
        if (flag === "blocked" && !reason) return false;
        if (flag === "actionable" && reason) return false;
        if (flag === "unassigned" && !isUnassignedRow) return false;
      }
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
  }, [rows, filter, search, sortKey, sortDir, statuses, owners, dueRange, flag]);

  const activeFilterCount =
    (statuses.length > 0 ? 1 : 0) +
    (owners.length > 0 ? 1 : 0) +
    (dueRange !== "any" ? 1 : 0) +
    (flag !== "any" ? 1 : 0);
  const clearAdvanced = () => { setStatuses([]); setOwners([]); setDueRange("any"); setFlag("any"); };
  const toggleIn = <T,>(list: T[], v: T): T[] => list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
  const dueRangeLabel: Record<DueRangeKey, string> = {
    any: "Any date", overdue: "Overdue", today: "Today",
    "7d": "Next 7 days", "30d": "Next 30 days", unscheduled: "No due date",
  };
  const flagLabel: Record<FlagKey, string> = {
    any: "All tasks", blocked: "Blocked / needs next step",
    actionable: "Ready to start", unassigned: "Unassigned",
  };

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

  const onReassignRow = async (row: TaskRow, next: string) => {
    try { await reassign(row.task.id, next); toast.success(next ? `Reassigned to ${next}` : "Cleared assignment"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not reassign"); }
  };

  const startTask = async (row: TaskRow) => {
    const reason = getBlockReason(row);
    if (reason) { toast.error(reason); return; }
    const dest = resolveDestination(row);
    try {
      await markStarted(row.task);
      toast.success(`Started: ${row.task.title}`, { description: `Opening ${dest.label} — ${dest.section}` });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not mark task started");
    }
    if (dest.drawer) {
      const openId = row.lead?.id ?? row.task.lead_id;
      if (openId) navigate(`/leads/${encodeURIComponent(openId)}`);
    } else if (dest.to) {
      navigate(dest.to);
    }
  };

  return (
    <>
    <GrowthPageShell
      eyebrow={isUniversal ? "Work" : "Growth & Admissions"}
      title="Tasks"
      noShell={noShell}
      description={
        isUniversal
          ? "Your task list — follow-ups, actions, and reminders."
          : "Your task list — follow-ups, actions, and reminders across every role."
      }
      headerRight={isUniversal ? undefined : <IntakeStateFilterToggle />}
      actions={
        isUniversal
          ? [
              { label: "New task", icon: Plus, variant: "default", onClick: () => setCreateOpen(true) },
              { label: "Open Leads", icon: List, to: "/leads" },
            ]
          : [
              { label: "New task", icon: Plus, variant: "default", onClick: () => setCreateOpen(true) },
              { label: "Add Lead", icon: Plus, to: "/leads?new=1" },
              { label: "Open Leads", icon: List, to: "/leads" },
            ]
      }
    >
      <CreateTaskDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={() => { /* realtime refresh handles it */ }} />
      <section>
        <IntakeSectionHeader icon={ListTodo} tone="indigo" title="Task Pulse" subtitle="Tap a tile to filter the lists below." />
        <IntakePulseStrip tiles={pulseTiles} loading={loading} />
      </section>

      {openTotal === 0 ? (
        loading ? (
          <div className="rounded-2xl border border-border/70 bg-card overflow-hidden" aria-label="Loading tasks">
            <div className="divide-y divide-border/60">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className="h-6 w-24 rounded-full bg-muted animate-pulse" />
                  <div className="h-3 flex-1 max-w-[40%] rounded bg-muted animate-pulse" />
                  <div className="h-3 w-24 rounded bg-muted animate-pulse hidden md:block" />
                  <div className="h-3 w-16 rounded bg-muted animate-pulse hidden md:block" />
                  <div className="h-7 w-40 rounded-lg bg-muted animate-pulse ml-auto" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 p-10 text-center">
            <ListTodo className="mx-auto h-6 w-6 text-muted-foreground/70" />
            <div className="mt-3 text-sm font-medium text-foreground">You're all caught up.</div>
            <p className="mt-1 text-xs text-muted-foreground">
              No open tasks right now. Create one, or tasks generated from leads will appear here.
            </p>
            <div className="mt-4">
              <Button size="sm" onClick={() => setCreateOpen(true)} className="h-8 rounded-xl">
                <Plus className="h-3.5 w-3.5 mr-1" /> New task
              </Button>
            </div>
          </div>
        )
      ) : (
        <section className="space-y-3">
          <div className="flex flex-col gap-2 p-2 rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search task, lead, owner…"
                  className="pl-9 h-9 bg-transparent border-0 focus-visible:ring-0"
                />
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

            <div className="flex flex-wrap items-center gap-1.5 border-t border-border/50 pt-2">
              <div className="inline-flex items-center gap-1 text-[11px] text-muted-foreground pr-1">
                <Filter className="h-3 w-3" /> Filters
              </div>

              {/* Status */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className={cn("px-2.5 py-1 rounded-full text-xs border transition inline-flex items-center gap-1",
                    statuses.length > 0 ? "bg-primary/10 border-primary/40 text-primary" : "bg-card border-border/70 hover:bg-muted")}>
                    Status{statuses.length > 0 && <Badge variant="secondary" className="h-4 px-1 text-[10px]">{statuses.length}</Badge>}
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="p-2 w-[220px]">
                  <div className="text-[11px] text-muted-foreground px-1 pb-1">Task status</div>
                  <div className="flex flex-col gap-1">
                    {(["Open", "In Progress", "Blocked"] as StatusKey[]).map((s) => (
                      <label key={s} className="flex items-center gap-2 text-xs px-1.5 py-1 rounded hover:bg-muted cursor-pointer">
                        <input type="checkbox" checked={statuses.includes(s)}
                          onChange={() => setStatuses((prev) => toggleIn(prev, s))} />
                        {s}
                      </label>
                    ))}
                    {statuses.length > 0 && (
                      <button onClick={() => setStatuses([])} className="text-[11px] text-muted-foreground hover:text-foreground text-left px-1.5 pt-1">Clear</button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Owner */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className={cn("px-2.5 py-1 rounded-full text-xs border transition inline-flex items-center gap-1",
                    owners.length > 0 ? "bg-primary/10 border-primary/40 text-primary" : "bg-card border-border/70 hover:bg-muted")}>
                    Owner{owners.length > 0 && <Badge variant="secondary" className="h-4 px-1 text-[10px]">{owners.length}</Badge>}
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="p-2 w-[260px]">
                  <div className="text-[11px] text-muted-foreground px-1 pb-1">Assigned to</div>
                  <div className="max-h-[260px] overflow-y-auto flex flex-col gap-0.5">
                    {hasUnassigned && (
                      <label className="flex items-center gap-2 text-xs px-1.5 py-1 rounded hover:bg-muted cursor-pointer">
                        <input type="checkbox" checked={owners.includes("__unassigned__")}
                          onChange={() => setOwners((prev) => toggleIn(prev, "__unassigned__"))} />
                        <span className="italic text-muted-foreground">Unassigned</span>
                      </label>
                    )}
                    {ownerOptions.length === 0 && !hasUnassigned && (
                      <div className="text-[11px] text-muted-foreground px-1.5 py-2">No owners yet.</div>
                    )}
                    {ownerOptions.map((o) => (
                      <label key={o} className="flex items-center gap-2 text-xs px-1.5 py-1 rounded hover:bg-muted cursor-pointer">
                        <input type="checkbox" checked={owners.includes(o)}
                          onChange={() => setOwners((prev) => toggleIn(prev, o))} />
                        <span className="truncate">{o}</span>
                      </label>
                    ))}
                  </div>
                  {owners.length > 0 && (
                    <button onClick={() => setOwners([])} className="text-[11px] text-muted-foreground hover:text-foreground text-left px-1.5 pt-1">Clear</button>
                  )}
                </PopoverContent>
              </Popover>

              {/* Due date range */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className={cn("px-2.5 py-1 rounded-full text-xs border transition inline-flex items-center gap-1",
                    dueRange !== "any" ? "bg-primary/10 border-primary/40 text-primary" : "bg-card border-border/70 hover:bg-muted")}>
                    <CalendarClock className="h-3 w-3" /> {dueRangeLabel[dueRange]}
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="p-2 w-[200px]">
                  <div className="text-[11px] text-muted-foreground px-1 pb-1">Due date</div>
                  <div className="flex flex-col gap-0.5">
                    {(Object.keys(dueRangeLabel) as DueRangeKey[]).map((k) => (
                      <button key={k} onClick={() => setDueRange(k)}
                        className={cn("text-left text-xs px-2 py-1 rounded hover:bg-muted",
                          dueRange === k && "bg-primary/10 text-primary font-medium")}>
                        {dueRangeLabel[k]}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Blocker / next-step */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className={cn("px-2.5 py-1 rounded-full text-xs border transition inline-flex items-center gap-1",
                    flag !== "any" ? "bg-primary/10 border-primary/40 text-primary" : "bg-card border-border/70 hover:bg-muted")}>
                    <Lock className="h-3 w-3" /> {flagLabel[flag]}
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="p-2 w-[240px]">
                  <div className="text-[11px] text-muted-foreground px-1 pb-1">Blocker / next step</div>
                  <div className="flex flex-col gap-0.5">
                    {(Object.keys(flagLabel) as FlagKey[]).map((k) => (
                      <button key={k} onClick={() => setFlag(k)}
                        className={cn("text-left text-xs px-2 py-1 rounded hover:bg-muted",
                          flag === k && "bg-primary/10 text-primary font-medium")}>
                        {flagLabel[k]}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {activeFilterCount > 0 && (
                <button
                  onClick={clearAdvanced}
                  className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 rounded"
                >
                  <X className="h-3 w-3" /> Clear filters
                </button>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs text-muted-foreground">
                  <tr className="text-left">
                    <th className="px-3 py-2 w-40">Status</th>
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
                    <tr>
                      <td colSpan={7} className="px-3 py-10 text-center">
                        <div className="text-sm font-medium text-foreground">No tasks match these filters</div>
                        <div className="mt-1 text-xs text-muted-foreground">Try clearing filters or broadening your search.</div>
                        {(activeFilterCount > 0 || search) && (
                          <button
                            onClick={() => { clearAdvanced(); setSearch(""); setFilter("all"); }}
                            className="mt-3 inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full border border-border/70 hover:bg-muted"
                          >
                            <X className="h-3 w-3" /> Clear filters
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : visible.map((r) => {
                    const c = classify(r);
                    const leadName = r.lead?.childName ?? "Lead";
                    const leadId = r.lead?.id ?? r.task.lead_id ?? null;
                    const isEscalated = (r.lead?.tags ?? []).some((t) => /escalat/i.test(t));
                    const wrap = (label: string, fn: () => Promise<void>) => async () => {
                      try { await fn(); toast.success(`${label}: ${r.task.title}`); }
                      catch (e) { toast.error(e instanceof Error ? e.message : `Could not ${label.toLowerCase()}`); }
                    };
                    return (
                     <tr
                       key={r.task.id}
                       id={`task-${r.task.id}`}
                       ref={(el) => { rowRefs.current[r.task.id] = el; }}
                       className={cn(
                         "hover:bg-muted/30 transition-colors",
                         focusedTaskId === r.task.id && "bg-primary/10 ring-2 ring-primary/50 animate-pulse",
                       )}
                     >
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <InlineStatusPicker
                              value={r.task.status}
                              onChange={async (next) => {
                                try {
                                  await setStatus(r.task, next);
                                  toast.success(`Status → ${STATUS_META[next].label}`);
                                } catch (e) {
                                  toast.error(e instanceof Error ? e.message : "Could not update status");
                                }
                              }}
                            />
                            {c === "overdue" && <span className="h-1.5 w-1.5 rounded-full bg-rose-500" aria-label="Overdue" title="Overdue" />}
                            {c === "today" && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-label="Due today" title="Due today" />}
                            {isEscalated && <Flame className="h-3 w-3 text-violet-600" aria-label="Escalated" />}
                          </div>
                        </td>
                        <td className="px-3 py-2 font-medium text-foreground truncate max-w-[280px]">{r.task.title}</td>
                        <td className="px-3 py-2">
                          {leadId ? (
                            <LeadNameLink leadId={leadId} className="hover:underline text-foreground">{leadName}</LeadNameLink>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{r.task.task_type || "—"}</td>
                        <td className={cn("px-3 py-2 text-xs", c === "overdue" && "text-rose-700 dark:text-rose-300 font-medium")}>
                          {r.task.due_date || "—"}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground truncate max-w-[180px]">{r.task.owner || "Unassigned"}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-end gap-1">
                            <StartButton row={r} onStart={() => startTask(r)} />
                            <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={wrap("Completed", () => complete(r.task.id))}>Complete</Button>
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={wrap("Snoozed", () => snooze(r.task.id))}>Snooze</Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs gap-1"
                              onClick={() => setActivityTask(r.task)}
                              title="View activity"
                            >
                              <ActivityIcon className="h-3 w-3" /> Activity
                            </Button>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">Reassign</Button>
                              </PopoverTrigger>
                              <PopoverContent align="end" className="p-2 w-[320px]">
                                <div className="text-[11px] text-muted-foreground px-1 pb-1">Reassign task</div>
                                <AssigneePicker
                                  value={r.task.owner || ""}
                                  onChange={(name) => onReassignRow(r, name)}
                                  placeholder="Search team members…"
                                />
                              </PopoverContent>
                            </Popover>
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
    <TaskActivityDrawer
      task={activityTask}
      open={!!activityTask}
      onOpenChange={(o) => { if (!o) setActivityTask(null); }}
    />
    </>
  );
}

function StartButton({ row, onStart }: { row: TaskRow; onStart: () => void }) {
  const blocked = getBlockReason(row);
  const dest = resolveDestination(row);
  const inProgress = row.task.status === "In Progress";
  const label = blocked ? "Blocked" : inProgress ? "Resume" : "Start";
  const Icon = blocked ? Lock : Play;
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button
              size="sm"
              variant={blocked ? "outline" : "default"}
              disabled={!!blocked}
              className={cn("h-7 px-2.5 text-xs gap-1", blocked && "opacity-70 cursor-not-allowed")}
              onClick={onStart}
            >
              <Icon className="h-3 w-3" /> {label}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-[260px] text-xs leading-snug">
          {blocked ? (
            <div>
              <div className="font-semibold mb-0.5">Can't start yet</div>
              <div className="text-muted-foreground">{blocked}</div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="font-semibold">{inProgress ? "Resume this task" : "Start this task"}</div>
              <div><span className="text-muted-foreground">Opens:</span> {dest.label}</div>
              <div><span className="text-muted-foreground">Focus:</span> {dest.section}</div>
              <div><span className="text-muted-foreground">Next:</span> {dest.nextStep}</div>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
