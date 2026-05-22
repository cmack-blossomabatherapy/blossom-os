import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search, MapPin, Clock, UserPlus, AlertTriangle, ShieldCheck, CalendarClock,
  CheckCircle2, ChevronRight, Sparkles, MessageSquare, Users, Phone, Plus,
  ListChecks, FileText, ArrowUpRight, Home, Building2, GraduationCap, Flag,
  Star, CircleDot, Send,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { cn } from "@/lib/utils";
import { type Client } from "@/data/clients";
import { useClients } from "@/contexts/ClientsContext";
import {
  getClientStaffingNeeds, suggestStaffingMatches, mockRBTProfiles,
  type StaffingClientNeed,
} from "@/data/staffing";
import { useCentralReachOps } from "@/hooks/useCentralReachOps";

/* ---------------- priority + helpers ---------------- */

type Priority = "critical" | "high" | "medium" | "low";
type StatusKey =
  | "needs_rbt"
  | "pairing_pending"
  | "awaiting_availability"
  | "schedule_conflict"
  | "pending_start"
  | "coverage_risk";

const STATUS_LABEL: Record<StatusKey, string> = {
  needs_rbt: "Needs RBT",
  pairing_pending: "Pairing Pending",
  awaiting_availability: "Awaiting Availability",
  schedule_conflict: "Schedule Conflict",
  pending_start: "Pending Start",
  coverage_risk: "Coverage Risk",
};

function statusOf(c: Client): StatusKey {
  if ((c.stage === "Staffing Needed" || c.stage === "Restaffing Needed" || c.staffingStatus === "Needed") && !c.rbt) return "needs_rbt";
  if (c.stage === "Matching in Progress" || c.staffingStatus === "In Progress") return "pairing_pending";
  if (c.stage === "Pending Start Date" || (c.rbt && c.bcba && !c.startDate && c.authStatus === "Approved")) return "pending_start";
  if (c.stage === "Active" && (c.activeServiceStatus === "Services on Pause" || c.activeServiceStatus === "Flaked")) return "coverage_risk";
  if (c.stage === "Active" && c.scheduledWeeklyHours !== undefined && c.approvedWeeklyHours !== undefined && c.scheduledWeeklyHours < c.approvedWeeklyHours * 0.8) return "coverage_risk";
  if (c.schedule.length === 0 && c.rbt) return "awaiting_availability";
  return "pairing_pending";
}

function priorityOf(c: Client, need: StaffingClientNeed | undefined): Priority {
  if (c.authStatus === "Approved" && !c.rbt) return "critical";
  if (c.stage === "Restaffing Needed") return "critical";
  if (c.stage === "Active" && c.activeServiceStatus === "Flaked") return "critical";
  if (need?.daysWaiting && need.daysWaiting > 7) return "high";
  if (statusOf(c) === "pairing_pending" || statusOf(c) === "awaiting_availability") return "high";
  if (statusOf(c) === "pending_start") return "medium";
  return "low";
}

const PRIORITY_ORDER: Priority[] = ["critical", "high", "medium", "low"];
const PRIORITY_LABEL: Record<Priority, string> = {
  critical: "Critical", high: "High", medium: "Medium", low: "Low",
};
const PRIORITY_TONE: Record<Priority, string> = {
  critical: "text-destructive bg-destructive/10 border-destructive/20",
  high: "text-warning bg-warning/10 border-warning/20",
  medium: "text-info bg-info/10 border-info/20",
  low: "text-muted-foreground bg-muted border-border/60",
};

const LOCATION_ICON: Record<string, typeof Home> = {
  Home: Home, Clinic: Building2, School: GraduationCap,
};

/* ---------------- page ---------------- */

export default function OSStaffingQueue() {
  const { clients } = useClients();
  // Live CentralReach signals (last 60 days of billable sessions).
  // Used to surface real RBT roster size, coverage risks, cancellations
  // — none of which live on the static Client record.
  const cr = useCentralReachOps();
  const [params, setParams] = useSearchParams();

  const initialPriority = (params.get("priority") as Priority | null) ?? "all";
  const initialStatus = (params.get("status") as StatusKey | null) ?? "all";
  const initialState = params.get("state") ?? "all";
  const initialGroup = (params.get("group") as GroupBy | null) ?? "priority";

  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">(initialPriority);
  const [statusFilter, setStatusFilter] = useState<StatusKey | "all">(initialStatus);
  const [stateFilter, setStateFilter] = useState<string>(initialState);
  const [groupBy, setGroupBy] = useState<GroupBy>(initialGroup);
  const [query, setQuery] = useState("");

  // Build the operational queue from real staffing-need logic.
  const needs = useMemo(() => getClientStaffingNeeds(clients), [clients]);
  const needByClient = useMemo(() => {
    const m = new Map<string, StaffingClientNeed>();
    needs.forEach((n) => m.set(n.client.id, n));
    return m;
  }, [needs]);

  const queue = useMemo(() => {
    return clients
      .filter((c) => {
        const isNeed = needByClient.has(c.id);
        const isRisk = c.stage === "Active" && (
          c.activeServiceStatus === "Services on Pause" ||
          c.activeServiceStatus === "Flaked" ||
          (c.scheduledWeeklyHours !== undefined && c.approvedWeeklyHours !== undefined &&
            c.scheduledWeeklyHours < c.approvedWeeklyHours * 0.8)
        );
        return isNeed || isRisk;
      })
      .map((c) => {
        const need = needByClient.get(c.id);
        const priority = priorityOf(c, need);
        const status = statusOf(c);
        return { c, need, priority, status, days: need?.daysWaiting ?? c.daysInStage };
      })
      .sort((a, b) =>
        PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority) ||
        b.days - a.days,
      );
  }, [clients, needByClient]);

  const states = useMemo(
    () => Array.from(new Set(clients.map((c) => c.state))).sort(),
    [clients],
  );

  const filtered = useMemo(() => {
    return queue.filter(({ c, priority, status }) => {
      if (priorityFilter !== "all" && priority !== priorityFilter) return false;
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (stateFilter !== "all" && c.state !== stateFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!`${c.childName} ${c.bcba ?? ""} ${c.clinic} ${c.state}`.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [queue, priorityFilter, statusFilter, stateFilter, query]);

  // Sync filter changes to URL for shareable deep links.
  const sync = (next: Partial<Record<string, string>>) => {
    const p = new URLSearchParams(params);
    Object.entries(next).forEach(([k, v]) => {
      if (!v || v === "all") p.delete(k); else p.set(k, v);
    });
    setParams(p, { replace: true });
  };

  const counts = useMemo(() => {
    const k: Record<StatusKey, number> = {
      needs_rbt: 0, pairing_pending: 0, awaiting_availability: 0,
      schedule_conflict: 0, pending_start: 0, coverage_risk: 0,
    };
    queue.forEach(({ status }) => { k[status]++; });
    return k;
  }, [queue]);

  const escalationsCount = queue.filter((q) => q.priority === "critical").length;

  const selectedId = params.get("clientId") ?? filtered[0]?.c.id ?? null;
  const selected = selectedId ? clients.find((c) => c.id === selectedId) ?? null : null;

  const selectClient = (id: string) => {
    const p = new URLSearchParams(params);
    p.set("clientId", id);
    setParams(p, { replace: true });
  };

  // Grouping
  const grouped = useMemo(() => {
    const groups = new Map<string, typeof filtered>();
    filtered.forEach((row) => {
      const key =
        groupBy === "priority" ? PRIORITY_LABEL[row.priority] :
        groupBy === "status" ? STATUS_LABEL[row.status] :
        groupBy === "state" ? row.c.state :
        groupBy === "bcba" ? (row.c.bcba ?? "Unassigned BCBA") :
        groupBy === "wait" ? bucketWait(row.days) :
        "All";
      if (!groups.has(key)) groups.set(key, [] as typeof filtered);
      groups.get(key)!.push(row);
    });
    // Preserve a sensible group ordering.
    if (groupBy === "priority") {
      return Array.from(groups.entries()).sort(
        (a, b) =>
          PRIORITY_ORDER.indexOf((Object.entries(PRIORITY_LABEL).find(([, v]) => v === a[0])?.[0] ?? "low") as Priority) -
          PRIORITY_ORDER.indexOf((Object.entries(PRIORITY_LABEL).find(([, v]) => v === b[0])?.[0] ?? "low") as Priority),
      );
    }
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered, groupBy]);

  return (
    <OSShell>
      <div className="mx-auto max-w-[1400px] px-6 md:px-10 py-8 space-y-6">
        {/* ---------- Header ---------- */}
        <header className="space-y-5">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
                Staffing Queue
              </h1>
              <p className="mt-2 text-[15px] text-muted-foreground max-w-2xl leading-relaxed">
                Manage staffing priorities, pairings, operational blockers, and service readiness across Blossom.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="h-10 px-4 rounded-xl bg-secondary text-secondary-foreground border border-border/70 hover:bg-muted transition text-sm font-medium inline-flex items-center gap-2">
                <MessageSquare className="size-4" /> Add Staffing Note
              </button>
              <Link
                to="/scheduling-workspace"
                className="h-10 px-4 rounded-xl bg-secondary text-secondary-foreground border border-border/70 hover:bg-muted transition text-sm font-medium inline-flex items-center gap-2"
              >
                <CalendarClock className="size-4" /> Open Scheduling Workspace
              </Link>
              <button className="h-10 px-4 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition text-sm font-medium inline-flex items-center gap-2 shadow-sm">
                <UserPlus className="size-4" /> Quick Pairing
              </button>
            </div>
          </div>

          {/* Operational chips */}
          <div className="flex flex-wrap items-center gap-2">
            <SummaryChip label="Needs RBT" value={counts.needs_rbt} tone="destructive"
              active={statusFilter === "needs_rbt"}
              onClick={() => { setStatusFilter(statusFilter === "needs_rbt" ? "all" : "needs_rbt"); sync({ status: statusFilter === "needs_rbt" ? undefined : "needs_rbt" }); }}
            />
            <SummaryChip label="Pending Pairings" value={counts.pairing_pending} tone="warning"
              active={statusFilter === "pairing_pending"}
              onClick={() => { setStatusFilter(statusFilter === "pairing_pending" ? "all" : "pairing_pending"); sync({ status: statusFilter === "pairing_pending" ? undefined : "pairing_pending" }); }}
            />
            <SummaryChip label="Pending Starts" value={counts.pending_start} tone="primary"
              active={statusFilter === "pending_start"}
              onClick={() => { setStatusFilter(statusFilter === "pending_start" ? "all" : "pending_start"); sync({ status: statusFilter === "pending_start" ? undefined : "pending_start" }); }}
            />
            <SummaryChip label="Coverage Risks" value={counts.coverage_risk} tone="warning"
              active={statusFilter === "coverage_risk"}
              onClick={() => { setStatusFilter(statusFilter === "coverage_risk" ? "all" : "coverage_risk"); sync({ status: statusFilter === "coverage_risk" ? undefined : "coverage_risk" }); }}
            />
            <SummaryChip label="Awaiting Availability" value={counts.awaiting_availability} tone="muted"
              active={statusFilter === "awaiting_availability"}
              onClick={() => { setStatusFilter(statusFilter === "awaiting_availability" ? "all" : "awaiting_availability"); sync({ status: statusFilter === "awaiting_availability" ? undefined : "awaiting_availability" }); }}
            />
            <SummaryChip label="Escalations" value={escalationsCount} tone="destructive"
              active={priorityFilter === "critical"}
              onClick={() => { setPriorityFilter(priorityFilter === "critical" ? "all" : "critical"); sync({ priority: priorityFilter === "critical" ? undefined : "critical" }); }}
            />
          </div>

          {/* ---------- Live operational signals from CentralReach ---------- */}
          <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="size-4 text-foreground/70 flex-none" />
                <div className="min-w-0">
                  <h3 className="text-[13px] font-medium tracking-tight text-foreground">
                    Live Coverage Signals
                  </h3>
                  <p className="text-[11.5px] text-muted-foreground">
                    {cr.loading
                      ? "Reading CentralReach session data…"
                      : cr.error
                      ? `Couldn't read session data: ${cr.error}`
                      : `${cr.totalSessions.toLocaleString()} sessions since ${cr.windowStart} · ${cr.counts.rbtCount} active RBTs · ${cr.counts.bcbaCount} active BCBAs`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <LiveChip
                  label="Uncovered" value={cr.counts.uncoveredClients} tone="destructive"
                  hint="No RBT session 14+ days" loading={cr.loading}
                />
                <LiveChip
                  label="At risk" value={cr.counts.atRiskClients} tone="warning"
                  hint="7–13 days since last session, or ≥3 cancels/30d" loading={cr.loading}
                />
                <LiveChip
                  label="Cancels (7d)" value={cr.cancellationsLast7d} tone="warning"
                  hint="Client cancellations logged in CR" loading={cr.loading}
                />
                <LiveChip
                  label="Covered" value={cr.counts.coveredClients} tone="success"
                  hint="Active RBT coverage in last 7d" loading={cr.loading}
                />
              </div>
            </div>

            {!cr.loading && cr.coverageRisks.length > 0 && (
              <ul className="mt-3 divide-y divide-border/60">
                {cr.coverageRisks.slice(0, 5).map((risk) => (
                  <li key={risk.clientName} className="flex items-center gap-3 py-2">
                    <span className={cn(
                      "h-1.5 w-1.5 rounded-full flex-none",
                      risk.level === "uncovered" ? "bg-destructive" : "bg-warning",
                    )} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="truncate text-[13px] font-medium text-foreground">
                          {risk.clientName}
                        </span>
                        <span className="text-[11px] text-muted-foreground">· {risk.state ?? "—"}</span>
                        <span className={cn(
                          "rounded-full border px-2 py-0.5 text-[10.5px]",
                          risk.level === "uncovered"
                            ? "border-destructive/30 bg-destructive/10 text-destructive"
                            : "border-warning/30 bg-warning/10 text-warning",
                        )}>
                          {risk.level === "uncovered" ? "Uncovered" : "At risk"}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                        {risk.reason} · RBT {risk.rbtName ?? "—"} · BCBA {risk.bcbaName ?? "—"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </header>

        {/* ---------- Main layout ---------- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* LEFT — Queue */}
          <aside className="lg:col-span-5 space-y-3">
            <div className="rounded-2xl bg-card border border-border/70 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)] overflow-hidden">
              <div className="p-4 border-b border-border/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold tracking-tight text-foreground">Operational Queue</h2>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">{filtered.length}</span>
                </div>
                <div className="relative">
                  <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search client, BCBA, clinic, state"
                    className="w-full h-9 pl-9 pr-3 rounded-xl bg-muted/60 border border-border text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <FilterSelect
                    value={stateFilter}
                    onChange={(v) => { setStateFilter(v); sync({ state: v }); }}
                    options={[{ value: "all", label: "All states" }, ...states.map((s) => ({ value: s, label: s }))]}
                  />
                  <FilterSelect
                    value={priorityFilter}
                    onChange={(v) => { setPriorityFilter(v as Priority | "all"); sync({ priority: v }); }}
                    options={[{ value: "all", label: "All priorities" }, ...PRIORITY_ORDER.map((p) => ({ value: p, label: PRIORITY_LABEL[p] }))]}
                  />
                  <FilterSelect
                    value={statusFilter}
                    onChange={(v) => { setStatusFilter(v as StatusKey | "all"); sync({ status: v }); }}
                    options={[{ value: "all", label: "All statuses" }, ...(Object.keys(STATUS_LABEL) as StatusKey[]).map((k) => ({ value: k, label: STATUS_LABEL[k] }))]}
                  />
                  <FilterSelect
                    value={groupBy}
                    onChange={(v) => { setGroupBy(v as GroupBy); sync({ group: v }); }}
                    options={[
                      { value: "priority", label: "Group: Priority" },
                      { value: "status", label: "Group: Status" },
                      { value: "state", label: "Group: State" },
                      { value: "bcba", label: "Group: BCBA" },
                      { value: "wait", label: "Group: Wait time" },
                    ]}
                  />
                </div>
              </div>

              <div className="max-h-[760px] overflow-y-auto">
                {filtered.length === 0 ? (
                  <EmptyState
                    icon={CheckCircle2}
                    title="No clients currently require staffing."
                    description="Your queue is clear. New staffing needs will appear here as cases progress."
                  />
                ) : (
                  <div className="divide-y divide-border/40">
                    {grouped.map(([group, rows]) => (
                      <div key={group}>
                        <div className="px-4 py-2 bg-muted/40 flex items-center justify-between sticky top-0 z-10 backdrop-blur">
                          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{group}</span>
                          <span className="text-[11px] text-muted-foreground">{rows.length}</span>
                        </div>
                        {rows.map((row) => (
                          <QueueCard
                            key={row.c.id}
                            row={row}
                            active={row.c.id === selectedId}
                            onSelect={() => selectClient(row.c.id)}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* RIGHT — Workspace */}
          <section className="lg:col-span-7 space-y-4">
            {!selected ? (
              <div className="rounded-2xl bg-muted/40 border border-border/60 p-14 text-center">
                <ListChecks className="size-8 mx-auto text-muted-foreground/70" />
                <p className="mt-3 text-sm text-muted-foreground">Select a staffing case to begin coordination.</p>
              </div>
            ) : (
              <CaseWorkspace client={selected} />
            )}
          </section>
        </div>
      </div>
    </OSShell>
  );
}

/* ---------------- types + utils ---------------- */

type GroupBy = "priority" | "status" | "state" | "bcba" | "wait";

function bucketWait(days: number): string {
  if (days >= 14) return "14+ days waiting";
  if (days >= 7) return "7–13 days waiting";
  if (days >= 3) return "3–6 days waiting";
  return "0–2 days waiting";
}

/* ---------------- subcomponents ---------------- */

function SummaryChip({
  label, value, tone, active, onClick,
}: {
  label: string; value: number;
  tone: "destructive" | "warning" | "success" | "primary" | "muted";
  active?: boolean; onClick?: () => void;
}) {
  const toneText = {
    destructive: "text-destructive", warning: "text-warning",
    success: "text-success", primary: "text-primary", muted: "text-muted-foreground",
  }[tone];
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-9 px-3 rounded-full border text-xs font-medium inline-flex items-center gap-2 transition",
        active
          ? "bg-foreground/5 border-border text-foreground"
          : "bg-card border-border/70 text-muted-foreground hover:bg-muted",
      )}
    >
      <span className={cn("size-1.5 rounded-full", toneText, "bg-current")} />
      <span>{label}</span>
      <span className={cn("tabular-nums", active ? "text-foreground" : "text-foreground/80")}>{value}</span>
    </button>
  );
}

function FilterSelect({
  value, onChange, options,
}: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <_FilterSelectImpl value={value} onChange={onChange} options={options} />
  );
}

function LiveChip({
  label, value, tone, hint, loading,
}: {
  label: string; value: number;
  tone: "destructive" | "warning" | "success" | "muted";
  hint?: string; loading?: boolean;
}) {
  const dot = {
    destructive: "bg-destructive",
    warning: "bg-warning",
    success: "bg-success",
    muted: "bg-muted-foreground",
  }[tone];
  return (
    <span
      title={hint}
      className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-2.5 py-1 text-[11.5px] text-foreground/80"
    >
      <span className={cn("size-1.5 rounded-full", dot)} />
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums font-medium text-foreground">
        {loading ? "…" : value}
      </span>
    </span>
  );
}

function _FilterSelectImpl({
  value, onChange, options,
}: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 rounded-lg bg-muted/60 border border-border px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function QueueCard({
  row, active, onSelect,
}: {
  row: { c: Client; priority: Priority; status: StatusKey; days: number; need?: StaffingClientNeed };
  active: boolean;
  onSelect: () => void;
}) {
  const { c, priority, status, days } = row;
  const setting = (c.serviceLocation ?? "Home") as keyof typeof LOCATION_ICON;
  const LocIcon = LOCATION_ICON[setting] ?? Home;
  const hours = c.approvedWeeklyHours ?? row.need?.requiredHours ?? 20;
  const authReady = c.authStatus === "Approved";
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left p-4 transition group",
        active ? "bg-primary/[0.04]" : "hover:bg-muted/40",
      )}
    >
      {/* Top */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-medium tracking-tight text-foreground truncate">{c.childName}</h3>
            <span className="text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">{c.state}</span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground truncate">{c.clinic}</p>
        </div>
        <span className={cn("shrink-0 h-6 px-2 rounded-full border text-[11px] font-medium inline-flex items-center gap-1", PRIORITY_TONE[priority])}>
          <CircleDot className="size-3" />
          {PRIORITY_LABEL[priority]}
        </span>
      </div>

      {/* Second row */}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1 text-foreground/80">
          <CircleDot className="size-3 text-muted-foreground" />{STATUS_LABEL[status]}
        </span>
        <span className="inline-flex items-center gap-1"><Users className="size-3" />BCBA {c.bcba ?? "—"}</span>
        <span className="inline-flex items-center gap-1"><Clock className="size-3" />{hours}h/wk</span>
        <span className="inline-flex items-center gap-1"><LocIcon className="size-3" />{setting}</span>
      </div>

      {/* Third row */}
      <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
        <Readiness label="Waiting" value={`${days}d`} ok={days <= 3} warn={days > 3 && days <= 7} bad={days > 7} />
        <Readiness label="Avail" value={c.schedule.length > 0 ? "Set" : "Missing"} ok={c.schedule.length > 0} bad={c.schedule.length === 0} />
        <Readiness label="Auth" value={authReady ? "Ready" : c.authStatus} ok={authReady} warn={!authReady} />
        <Readiness label="Pairing" value={c.pairingEmailSent ? "Sent" : c.rbt ? "RBT" : "—"} ok={!!c.pairingEmailSent || !!c.rbt} />
      </div>

      {/* Bottom actions */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <CardAction label="Open Case" />
        <CardAction label="Begin Pairing" />
        <CardAction label="Availability" />
        <CardAction label="Note" />
        <CardAction label="Escalate" />
      </div>
    </button>
  );
}

function Readiness({ label, value, ok, warn, bad }: { label: string; value: string; ok?: boolean; warn?: boolean; bad?: boolean }) {
  const tone = bad ? "text-destructive" : warn ? "text-warning" : ok ? "text-success" : "text-muted-foreground";
  return (
    <div className="rounded-lg bg-muted/40 border border-border/50 px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("text-xs font-medium", tone)}>{value}</div>
    </div>
  );
}

function CardAction({ label }: { label: string }) {
  return (
    <span
      onClick={(e) => e.stopPropagation()}
      className="h-7 px-2.5 rounded-full bg-muted/60 border border-border/60 text-[11px] text-foreground/80 hover:bg-muted hover:text-foreground transition inline-flex items-center"
    >
      {label}
    </span>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: typeof CheckCircle2; title: string; description?: string }) {
  return (
    <div className="p-12 text-center">
      <Icon className="size-7 mx-auto text-muted-foreground/70" />
      <p className="mt-3 text-sm font-medium text-foreground">{title}</p>
      {description && <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">{description}</p>}
    </div>
  );
}

/* ---------------- workspace ---------------- */

function CaseWorkspace({ client }: { client: Client }) {
  const need = useMemo(() => getClientStaffingNeeds([client])[0], [client]);
  const matches = useMemo(() => (need ? suggestStaffingMatches(need) : []), [need]);

  return (
    <div className="space-y-4">
      <ClientOverview client={client} />
      <ReadinessTracker client={client} />
      <MatchingEngine client={client} matches={matches} />
      <ScheduleBuilder client={client} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <OperationalNotes client={client} />
        <OperationalRisks client={client} />
      </div>
      <AskBlossomPanel client={client} />
    </div>
  );
}

function SectionCard({ title, icon: Icon, action, children }: {
  title: string; icon: typeof Users;
  action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-card border border-border/70 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)] overflow-hidden">
      <div className="px-5 py-3 border-b border-border/60 flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-tight text-foreground inline-flex items-center gap-2">
          <Icon className="size-4 text-muted-foreground" />{title}
        </h3>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function ClientOverview({ client }: { client: Client }) {
  const setting = (client.serviceLocation ?? "Home") as keyof typeof LOCATION_ICON;
  const LocIcon = LOCATION_ICON[setting] ?? Home;
  return (
    <SectionCard
      title="Client Overview"
      icon={Users}
      action={
        <div className="flex items-center gap-1.5">
          <LinkPill to={`/clients/${client.id}`} label="Open Client" />
          <LinkPill to={`/authorizations?clientId=${client.id}`} label="Authorizations" />
          <LinkPill to={`/scheduling-workspace?clientId=${client.id}`} label="Scheduling" />
        </div>
      }
    >
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">{client.childName}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{client.state} · {client.clinic}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-3 text-xs">
          <Field label="Staffing" value={STATUS_LABEL[statusOf(client)]} />
          <Field label="Authorization" value={client.authStatus} />
          <Field label="Service" value={<span className="inline-flex items-center gap-1"><LocIcon className="size-3" />{setting}</span>} />
          <Field label="Requested" value={`${client.approvedWeeklyHours ?? 20}h/wk`} />
          <Field label="BCBA" value={client.bcba ?? "Unassigned"} />
          <Field label="RBT" value={client.rbt ?? "Unassigned"} />
          <Field label="Parent availability" value={client.schedule.length > 0 ? "Confirmed" : "Pending"} />
          <Field label="Start date" value={client.startDate ?? "—"} />
          <Field label="Readiness" value={client.authStatus === "Approved" && client.bcba ? "Operational" : "Pending"} />
        </div>
      </div>
    </SectionCard>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-foreground font-medium text-[13px]">{value}</div>
    </div>
  );
}

function LinkPill({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="h-7 px-2.5 rounded-full bg-muted/60 border border-border/60 text-[11px] text-foreground/80 hover:bg-muted hover:text-foreground transition inline-flex items-center gap-1">
      {label} <ArrowUpRight className="size-3" />
    </Link>
  );
}

function ReadinessTracker({ client }: { client: Client }) {
  const steps = [
    { label: "Authorization approved", done: client.authStatus === "Approved" },
    { label: "Treatment auth approved", done: client.authorizations.some((a) => a.type === "Treatment" && a.status === "Approved") },
    { label: "BCBA assigned", done: !!client.bcba },
    { label: "RBT assigned", done: !!client.rbt },
    { label: "Availability confirmed", done: client.schedule.length > 0 },
    { label: "Pairing confirmed", done: !!client.pairingEmailSent },
    { label: "Start date confirmed", done: !!client.startDate },
  ];
  const completed = steps.filter((s) => s.done).length;
  const pct = Math.round((completed / steps.length) * 100);
  return (
    <SectionCard
      title="Staffing Readiness"
      icon={ShieldCheck}
      action={<span className="text-[11px] text-muted-foreground tabular-nums">{completed}/{steps.length} · {pct}%</span>}
    >
      <div className="space-y-3">
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary/80 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6">
          {steps.map((s) => (
            <li key={s.label} className="flex items-center gap-2 text-[13px]">
              <CheckCircle2 className={cn("size-4", s.done ? "text-success" : "text-muted-foreground/40")} />
              <span className={s.done ? "text-foreground" : "text-muted-foreground"}>{s.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </SectionCard>
  );
}

function MatchingEngine({ client, matches }: { client: Client; matches: ReturnType<typeof suggestStaffingMatches> }) {
  return (
    <SectionCard
      title="RBT Matching"
      icon={Sparkles}
      action={<span className="text-[11px] text-muted-foreground">{matches.length} suggested</span>}
    >
      {matches.length === 0 ? (
        <p className="text-sm text-muted-foreground">No strong RBT matches in this region right now.</p>
      ) : (
        <div className="space-y-2">
          {matches.map((m) => {
            const rbt = mockRBTProfiles.find((r) => r.id === m.rbtId);
            if (!rbt) return null;
            const utilization = Math.round((rbt.assignedHours / Math.max(rbt.capacityHours, 1)) * 100);
            return (
              <div key={m.rbtId} className="rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/50 transition p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-foreground truncate">{rbt.name}</span>
                    <span className="text-[11px] text-muted-foreground">{rbt.clinic}</span>
                    <span className="text-[11px] text-muted-foreground">· {m.distanceMiles}mi</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    <span>Avail: {m.availabilityOverlap.join(", ") || "—"}</span>
                    <span>Util: {utilization}%</span>
                    <span>{rbt.assignedClientIds.length} clients</span>
                    <span className="inline-flex items-center gap-1 text-foreground/80"><Star className="size-3 text-primary" />{m.score}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <CardAction label="Assign" />
                  <CardAction label="Compare" />
                  <CardAction label="Contact" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function ScheduleBuilder({ client }: { client: Client }) {
  const scheduledHours = client.scheduledWeeklyHours ?? client.schedule.reduce((s, b) => s + slotHours(b.start, b.end), 0);
  const approvedHours = client.approvedWeeklyHours ?? 20;
  const uncovered = Math.max(0, approvedHours - scheduledHours);
  return (
    <SectionCard
      title="Schedule"
      icon={CalendarClock}
      action={
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {scheduledHours}/{approvedHours}h · {uncovered}h uncovered
        </span>
      }
    >
      <div className="grid grid-cols-6 gap-1.5">
        {WEEK.map((day) => {
          const blocks = client.schedule.filter((s) => s.day === day);
          return (
            <div key={day} className="rounded-xl bg-muted/40 border border-border/50 p-2 min-h-[88px]">
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{day}</div>
              <div className="mt-1 space-y-1">
                {blocks.length === 0 ? (
                  <div className="text-[11px] text-muted-foreground/70 italic">Open</div>
                ) : blocks.map((b, i) => (
                  <div key={i} className="rounded-md bg-primary/10 text-primary px-1.5 py-1 text-[11px] font-medium">
                    {b.start}–{b.end}
                    <div className="text-[10px] text-muted-foreground font-normal truncate">{b.rbt ?? "Unassigned"}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

function slotHours(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.max(0, (eh + em / 60) - (sh + sm / 60));
}

function OperationalNotes({ client }: { client: Client }) {
  const events = (client.timeline ?? []).filter((e) => e.type === "staffing" || e.type === "schedule" || e.type === "note").slice(0, 5);
  return (
    <SectionCard
      title="Operational Notes"
      icon={MessageSquare}
      action={<button className="text-[11px] text-primary hover:underline inline-flex items-center gap-1"><Plus className="size-3" />Add</button>}
    >
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No staffing notes yet.</p>
      ) : (
        <ul className="space-y-3">
          {events.map((e) => (
            <li key={e.id} className="text-[13px] text-foreground">
              <p>{e.description}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{e.user ?? "System"} · {e.timestamp}</p>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex items-center gap-2">
        <input
          placeholder="Add a staffing update…"
          className="flex-1 h-9 px-3 rounded-xl bg-muted/60 border border-border text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button className="h-9 w-9 rounded-xl bg-primary text-primary-foreground inline-flex items-center justify-center hover:opacity-90 transition">
          <Send className="size-4" />
        </button>
      </div>
    </SectionCard>
  );
}

function OperationalRisks({ client }: { client: Client }) {
  const risks: { severity: "high" | "med" | "low"; label: string; suggestion: string }[] = [];
  if (client.authStatus === "Approved" && !client.rbt) {
    risks.push({ severity: "high", label: "Authorized client without RBT", suggestion: "Begin pairing immediately." });
  }
  if (client.schedule.length === 0) {
    risks.push({ severity: "med", label: "No availability confirmed", suggestion: "Request parent availability." });
  }
  if (client.activeServiceStatus === "Flaked") {
    risks.push({ severity: "high", label: "Family unreachable", suggestion: "Escalate to State Director." });
  }
  if (client.scheduledWeeklyHours !== undefined && client.approvedWeeklyHours !== undefined &&
      client.scheduledWeeklyHours < client.approvedWeeklyHours * 0.8) {
    risks.push({ severity: "med", label: "Coverage below 80%", suggestion: "Add an RBT or shift hours." });
  }
  if ((client.blockers ?? []).length > 0) {
    risks.push({ severity: "med", label: `Blocker: ${client.blockers[0]}`, suggestion: "Resolve before scheduling." });
  }
  return (
    <SectionCard title="Operational Risks" icon={AlertTriangle}>
      {risks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No active risks detected.</p>
      ) : (
        <ul className="space-y-3">
          {risks.map((r, i) => {
            const tone = r.severity === "high" ? "text-destructive" : r.severity === "med" ? "text-warning" : "text-muted-foreground";
            return (
              <li key={i} className="flex items-start gap-3">
                <Flag className={cn("size-4 mt-0.5 shrink-0", tone)} />
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-foreground">{r.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{r.suggestion}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}

function AskBlossomPanel({ client }: { client: Client }) {
  const prompts = [
    "Which staffing cases are highest priority?",
    "Who is waiting longest for staffing?",
    "Which RBTs are underutilized?",
    "What staffing blockers exist?",
    "Which pairings are incomplete?",
    "Which clients are at cancellation risk?",
  ];
  return (
    <SectionCard
      title="Ask Blossom AI"
      icon={Sparkles}
      action={<Link to="/ai/assistant" className="text-[11px] text-primary hover:underline inline-flex items-center gap-1">Open assistant <ArrowUpRight className="size-3" /></Link>}
    >
      <div className="flex flex-wrap gap-2">
        {prompts.map((p) => (
          <Link
            key={p}
            to={`/ai/assistant?q=${encodeURIComponent(p)}&scope=scheduling&clientId=${client.id}`}
            className="h-8 px-3 rounded-full bg-muted/60 border border-border/60 text-[12px] text-foreground/80 hover:bg-muted hover:text-foreground transition inline-flex items-center gap-1.5"
          >
            <Sparkles className="size-3 text-primary" />{p}
          </Link>
        ))}
      </div>
    </SectionCard>
  );
}