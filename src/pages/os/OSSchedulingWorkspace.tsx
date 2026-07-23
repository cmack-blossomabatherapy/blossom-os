import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search, Filter, MapPin, Clock, UserPlus, AlertTriangle, ShieldCheck,
  CalendarClock, CheckCircle2, ChevronRight, Sparkles, MessageSquare,
  ArrowUpRight, Users, Phone, Plus, ListChecks, FileText,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { cn } from "@/lib/utils";
import { type Client } from "@/data/clients";
import { useClients } from "@/contexts/ClientsContext";
import { useCentralReachOps, type ProviderRosterEntry, type CoverageRiskRow } from "@/hooks/useCentralReachOps";
import {
  AssignRbtDialog, ContactAttemptDialog, CoverageNoteDialog,
  StartDateDialog,
} from "@/components/scheduling/SchedulingDialogs";
import { SchedulingOverlayWarning } from "@/components/scheduling/SchedulingOverlayWarning";
import { useSchedulingActions } from "@/hooks/useSchedulingActions";
import { SendToStateSupportButton } from "@/components/stateDirector/SendToStateSupportButton";
import { StateDirectorSnapshotBanner } from "@/components/stateDirector/StateDirectorSnapshotBanner";

const RBT_TARGET_HOURS = 32;

/* ---------------- helpers ---------------- */

type WorkBucket =
  | "needs_rbt"
  | "pairing_pending"
  | "ready_to_schedule"
  | "pending_start"
  | "coverage_risk";

const BUCKET_LABEL: Record<WorkBucket, string> = {
  needs_rbt: "Needs RBT",
  pairing_pending: "Pairing Pending",
  ready_to_schedule: "Ready to Schedule",
  pending_start: "Pending Start",
  coverage_risk: "Coverage Risk",
};

const BUCKET_TONE: Record<WorkBucket, string> = {
  needs_rbt: "text-destructive bg-destructive/10",
  pairing_pending: "text-warning bg-warning/10",
  ready_to_schedule: "text-info bg-info/10",
  pending_start: "text-primary bg-primary/10",
  coverage_risk: "text-warning bg-warning/10",
};

function bucketOf(c: Client): WorkBucket | null {
  if ((c.stage === "Staffing Needed" || c.stage === "Restaffing Needed" || c.staffingStatus === "Needed") && !c.rbt) return "needs_rbt";
  if (c.stage === "Matching in Progress" || c.staffingStatus === "In Progress") return "pairing_pending";
  if (c.stage === "Pending Start Date" || (c.rbt && c.bcba && !c.startDate && c.authStatus === "Approved")) return "pending_start";
  if (c.authStatus === "Approved" && c.bcba && c.rbt && (c.schedulingStatus === "Pending Schedule" || c.schedulingStatus === "Schedule Created") && c.stage !== "Active") return "ready_to_schedule";
  if (c.stage === "Active" && (c.activeServiceStatus === "Services on Pause" || c.activeServiceStatus === "Flaked" ||
    (c.scheduledWeeklyHours !== undefined && c.approvedWeeklyHours !== undefined && c.scheduledWeeklyHours < c.approvedWeeklyHours * 0.8) ||
    (c.blockers && c.blockers.length > 0))) return "coverage_risk";
  return null;
}

const BUCKET_ORDER: WorkBucket[] = ["needs_rbt", "pending_start", "ready_to_schedule", "pairing_pending", "coverage_risk"];

// Map external ?view= aliases (used by dashboards/links) to internal buckets.
const VIEW_TO_BUCKET: Record<string, WorkBucket> = {
  needs_rbt: "needs_rbt",
  pairing_pending: "pairing_pending",
  ready_to_schedule: "ready_to_schedule",
  ready: "ready_to_schedule",
  pending_start: "pending_start",
  coverage_risk: "coverage_risk",
  risks: "coverage_risk",
  availability: "coverage_risk",
  conflicts: "coverage_risk",
  // Menu aliases surfaced from the Scheduling sidebar. These keep every
  // sidebar click on a real filtered bucket instead of silently falling
  // through to the unfiltered "all" view.
  assessments: "pending_start",
  readiness: "pending_start",
  "start-dates": "pending_start",
  "family-availability": "coverage_risk",
  clinic: "ready_to_schedule",
  field: "ready_to_schedule",
  "cr-entry": "ready_to_schedule",
};

/* ---------------- page ---------------- */

export default function OSSchedulingWorkspace() {
  const { clients } = useClients();
  const cr = useCentralReachOps();
  const [params, setParams] = useSearchParams();
  const [coverageOpen, setCoverageOpen] = useState(false);
  const [pairingOpen, setPairingOpen] = useState(false);

  // Initialize filters from URL so deep links pre-apply correctly.
  const initialBucket = (() => {
    const v = params.get("bucket") ?? params.get("view");
    if (!v) return "all" as const;
    return (VIEW_TO_BUCKET[v] ?? "all") as WorkBucket | "all";
  })();
  const initialState = params.get("state") ?? "all";
  const initialQuery = params.get("q") ?? "";

  const [stateFilter, setStateFilter] = useState<string>(initialState);
  const [bucketFilter, setBucketFilter] = useState<WorkBucket | "all">(initialBucket);
  const [query, setQuery] = useState(initialQuery);

  // Sync filter changes back to URL (preserves clientId / scope).
  useEffect(() => {
    const next = new URLSearchParams(params);
    if (bucketFilter === "all") { next.delete("bucket"); next.delete("view"); }
    else { next.set("bucket", bucketFilter); next.delete("view"); }
    if (stateFilter === "all") next.delete("state"); else next.set("state", stateFilter);
    if (!query) next.delete("q"); else next.set("q", query);
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bucketFilter, stateFilter, query]);

  const queue = useMemo(() => {
    return clients
      .map((c) => ({ c, b: bucketOf(c) }))
      .filter((x): x is { c: Client; b: WorkBucket } => x.b !== null)
      .sort((a, b) => BUCKET_ORDER.indexOf(a.b) - BUCKET_ORDER.indexOf(b.b) || b.c.daysInStage - a.c.daysInStage);
  }, [clients]);

  const filtered = useMemo(() => {
    return queue.filter(({ c, b }) => {
      if (stateFilter !== "all" && c.state !== stateFilter) return false;
      if (bucketFilter !== "all" && b !== bucketFilter) return false;
      if (query && !`${c.childName} ${c.bcba ?? ""} ${c.clinic}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [queue, stateFilter, bucketFilter, query]);

  const selectedId = params.get("clientId") ?? filtered[0]?.c.id ?? null;
  const selected = selectedId ? clients.find((c) => c.id === selectedId) ?? null : null;
  const liteSelected = selected ? { id: selected.id, childName: selected.childName, state: selected.state, rbt: selected.rbt, bcba: selected.bcba } : null;

  const selectClient = (id: string) => {
    const next = new URLSearchParams(params);
    next.set("clientId", id);
    setParams(next, { replace: true });
  };

  const states = Array.from(new Set(clients.map((c) => c.state))).sort();

  const counts = useMemo(() => {
    const k: Record<WorkBucket, number> = { needs_rbt: 0, pairing_pending: 0, ready_to_schedule: 0, pending_start: 0, coverage_risk: 0 };
    for (const { b } of queue) k[b]++;
    return k;
  }, [queue]);

  // RBT availability is derived from CentralReach last-7d hours vs a 32h soft cap.
  const availableRbts = useMemo(
    () => cr.rbtRoster.filter((r) => r.hoursLast7d < RBT_TARGET_HOURS - 4).length,
    [cr.rbtRoster],
  );

  return (
    <OSShell>
      <div className="mx-auto max-w-[1400px] px-6 md:px-10 py-8 space-y-6">
        <SchedulingOverlayWarning />
        {/* Header */}
        <header className="space-y-4">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">Scheduling Workspace</h1>
              <p className="mt-2 text-[15px] text-muted-foreground max-w-2xl">
                Manage staffing execution, pairings, coverage, and operational scheduling workflows.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setCoverageOpen(true)} className="h-10 px-4 rounded-xl bg-secondary text-secondary-foreground border border-border/70 hover:bg-muted transition text-sm font-medium inline-flex items-center gap-2">
                <MessageSquare className="size-4" /> Add Coverage Note
              </button>
              <Link to="/scheduling" className="h-10 px-4 rounded-xl bg-secondary text-secondary-foreground border border-border/70 hover:bg-muted transition text-sm font-medium inline-flex items-center gap-2">
                <ListChecks className="size-4" /> Open Coverage Queue
              </Link>
              <button onClick={() => setPairingOpen(true)} className="h-10 px-4 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition text-sm font-medium inline-flex items-center gap-2 shadow-sm">
                <UserPlus className="size-4" /> Quick Pairing
              </button>
              <SendToStateSupportButton fromDepartment="Scheduling" />
            </div>
          </div>

          {/* Operational chips */}
          <div className="flex flex-wrap items-center gap-2">
            <Chip label="Needs RBT" value={counts.needs_rbt} tone="destructive" />
            <Chip label="Uncovered (CR)" value={cr.counts.uncoveredClients} tone="destructive" loading={cr.loading} />
            <Chip label="At Risk (CR)" value={cr.counts.atRiskClients} tone="warning" loading={cr.loading} />
            <Chip label="Pending Starts" value={counts.pending_start} tone="primary" />
            <Chip label="RBTs w/ Capacity" value={availableRbts} tone="success" loading={cr.loading} />
          </div>
        </header>

        <StateDirectorSnapshotBanner
          ownerDepartment="Scheduling"
          sourceModule="scheduling_workspace"
          openBlockers={counts.needs_rbt + counts.coverage_risk + (cr.counts.uncoveredClients ?? 0)}
          overdueCount={cr.counts.atRiskClients ?? 0}
          topRisks={[
            counts.needs_rbt ? `${counts.needs_rbt} needs RBT` : "",
            counts.coverage_risk ? `${counts.coverage_risk} coverage risks` : "",
            (cr.counts.uncoveredClients ?? 0) ? `${cr.counts.uncoveredClients} uncovered (CR)` : "",
          ].filter(Boolean)}
        />

        {/* 3-panel layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* LEFT — Staffing Queue */}
          <aside className="lg:col-span-4 space-y-3">
            <div className="rounded-2xl bg-card border border-border/70 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)] overflow-hidden">
              <div className="p-4 border-b border-border/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold tracking-tight text-foreground">Coverage Queue</h2>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">{filtered.length}</span>
                </div>
                <div className="relative">
                  <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search client, BCBA, clinic"
                    className="w-full h-9 pl-9 pr-3 rounded-xl bg-muted/60 border border-border text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={stateFilter}
                    onChange={(e) => setStateFilter(e.target.value)}
                    className="h-8 rounded-lg bg-muted/60 border border-border px-2 text-xs text-foreground"
                  >
                    <option value="all">All states</option>
                    {states.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select
                    value={bucketFilter}
                    onChange={(e) => setBucketFilter(e.target.value as WorkBucket | "all")}
                    className="h-8 rounded-lg bg-muted/60 border border-border px-2 text-xs text-foreground"
                  >
                    <option value="all">All statuses</option>
                    {BUCKET_ORDER.map((b) => <option key={b} value={b}>{BUCKET_LABEL[b]}</option>)}
                  </select>
                </div>
              </div>

              <div className="max-h-[680px] overflow-y-auto divide-y divide-border/50">
                {filtered.length === 0 && (
                  <EmptyState label="No coverage cases match your filters." />
                )}
                {filtered.map(({ c, b }) => (
                  <div key={c.id} className="relative">
                    <QueueCard
                      client={c}
                      bucket={b}
                      active={c.id === selectedId}
                      onSelect={() => selectClient(c.id)}
                    />
                    <div className="absolute right-8 top-2">
                      <SendToStateSupportButton
                        fromDepartment="Scheduling"
                        linkedClientId={String(c.id)}
                        linkedSchedulingItemId={String(c.id)}
                        defaultState={c.state || undefined}
                        defaultTitle={`Scheduling support: ${c.childName}`}
                        defaultDescription={`State: ${c.state} · Risk: ${b.replace(/_/g," ")} · BCBA: ${c.bcba ?? "unassigned"} · Waiting: ${c.daysInStage}d`}
                        defaultPriority={b === "coverage_risk" ? "high" : "medium"}
                        sourceModule="scheduling"
                        metadata={{ clientName: c.childName, state: c.state, bucket: b, currentOwner: c.bcba, authStatus: c.authStatus }}
                        buttonLabel="State"
                        variant="ghost"
                        size="sm"
                        className="text-[10px] h-6 px-1.5"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* CENTER — Active workflow */}
          <section className="lg:col-span-5 space-y-4">
            {!selected ? (
              <div className="rounded-2xl bg-muted/40 border border-border/60 p-12 text-center">
                <CalendarClock className="size-8 mx-auto text-muted-foreground/70" />
                <p className="mt-3 text-sm text-muted-foreground">Select a staffing case to begin scheduling work.</p>
              </div>
            ) : (
              <ActiveWorkflow client={selected} rbtRoster={cr.rbtRoster} />
            )}
          </section>

          {/* RIGHT — Operational context */}
          <aside className="lg:col-span-3 space-y-4">
            <ContextPanel coverageRisks={cr.coverageRisks} rbtRoster={cr.rbtRoster} loading={cr.loading} />
            <AskBlossomPanel cr={cr} counts={counts} availableRbts={availableRbts} />
          </aside>
        </div>
        <CoverageNoteDialog open={coverageOpen} onOpenChange={setCoverageOpen} client={liteSelected ?? undefined} />
        <AssignRbtDialog open={pairingOpen} onOpenChange={setPairingOpen} client={liteSelected ?? undefined} />
      </div>
    </OSShell>
  );
}

/* ---------------- subcomponents ---------------- */

function Chip({ label, value, tone, loading }: { label: string; value: number; tone: "destructive" | "warning" | "success" | "primary"; loading?: boolean }) {
  const toneClass = {
    destructive: "text-destructive",
    warning: "text-warning",
    success: "text-success",
    primary: "text-primary",
  }[tone];
  return (
    <div className="inline-flex items-center gap-2 h-9 px-3 rounded-full bg-card border border-border/70 text-sm">
      <span className={cn("font-semibold tabular-nums", toneClass)}>{loading ? "…" : value}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

function QueueCard({ client, bucket, active, onSelect }: { client: Client; bucket: WorkBucket; active: boolean; onSelect: () => void }) {
  const approved = client.approvedWeeklyHours ?? 0;
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left p-3.5 transition-colors group",
        active ? "bg-primary/5" : "hover:bg-muted/40",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground truncate">{client.childName}</p>
            <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-md", BUCKET_TONE[bucket])}>
              {BUCKET_LABEL[bucket]}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{client.state} · {client.clinic}</span>
            {approved > 0 && <span className="inline-flex items-center gap-1"><Clock className="size-3" />{approved}h/wk</span>}
            <span>{client.bcba ?? "No BCBA"}</span>
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-[11px]">
            <span className={cn("rounded px-1.5 py-0.5", client.authStatus === "Approved" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")}>
              Auth {client.authStatus}
            </span>
            <span className={cn(client.daysInStage > 7 ? "text-destructive" : "text-muted-foreground")}>
              {client.daysInStage}d waiting
            </span>
          </div>
        </div>
        <ChevronRight className={cn("size-4 shrink-0 mt-1 transition-colors", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
      </div>
    </button>
  );
}

function ActiveWorkflow({ client, rbtRoster }: { client: Client; rbtRoster: ProviderRosterEntry[] }) {
  const { listClientSchedulingActions, listClientContactAttempts, listOpenCoverageCases, updateCoverageCase } = useSchedulingActions();
  const [assignFor, setAssignFor] = useState<string | null>(null);
  const [contactFor, setContactFor] = useState<string | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [activity, setActivity] = useState<Array<{ id: string; description: string; timestamp: string }>>([]);
  const [clientCoverageCases, setClientCoverageCases] = useState<Array<Record<string, unknown>>>([]);
  const lite = { id: client.id, childName: client.childName, state: client.state, rbt: client.rbt, bcba: client.bcba };
  const reload = async () => {
    const [a, c, cases] = await Promise.all([
      listClientSchedulingActions(client.id),
      listClientContactAttempts(client.id),
      listOpenCoverageCases(),
    ]);
    setActivity([
      ...a.map((r) => ({ id: `a-${r.id}`, description: `${(r.action_type as string).replace(/_/g, " ")} — ${(r.note ?? r.title) as string ?? ""}`, timestamp: new Date(r.created_at as string).toLocaleString() })),
      ...c.map((r) => ({ id: `c-${r.id}`, description: `Contact (${r.contact_type}/${r.channel}) — ${(r.body ?? r.outcome) as string ?? ""}`, timestamp: new Date(r.created_at as string).toLocaleString() })),
    ].sort((x, y) => (x.timestamp < y.timestamp ? 1 : -1)).slice(0, 6));
    setClientCoverageCases(
      (cases as Array<Record<string, unknown>>).filter((cs) => cs.client_id === client.id || cs.client_key === client.id),
    );
  };
  useEffect(() => { void reload(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [client.id]);

  // Real CR-derived suggestions: same-state RBTs with capacity remaining vs a 32h/wk soft cap.
  const suggestions = useMemo(() => {
    const inState = rbtRoster.filter((r) => !client.state || !r.state || r.state === client.state);
    return inState
      .map((r) => ({
        rbt: r,
        capacityRemaining: Math.max(0, Math.round(RBT_TARGET_HOURS - r.hoursLast7d)),
        utilization: Math.min(100, Math.round((r.hoursLast7d / RBT_TARGET_HOURS) * 100)),
      }))
      .filter((s) => s.capacityRemaining > 0)
      .sort((a, b) => b.capacityRemaining - a.capacityRemaining)
      .slice(0, 4);
  }, [rbtRoster, client.state]);

  const readiness = [
    { label: "Authorization approved", ok: client.authStatus === "Approved" },
    { label: "BCBA assigned", ok: !!client.bcba },
    { label: "RBT paired", ok: !!client.rbt },
    { label: "Schedule built", ok: client.schedule.length > 0 },
    { label: "Start date confirmed", ok: !!client.startDate },
  ];

  const canConfirmStartDate = !!client.rbt && !!client.bcba && client.authStatus === "Approved";

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];

  return (
    <>
      {/* Overview */}
      <div className="rounded-2xl bg-card border border-border/70 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">{client.childName}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{client.state} · {client.clinic} · {client.serviceLocation ?? "Home"}</p>
          </div>
          <div className="flex items-center gap-2">
            {canConfirmStartDate && !client.startDate && (
              <button
                onClick={() => setStartDateOpen(true)}
                className="h-7 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition inline-flex items-center gap-1"
              >
                <CalendarClock className="size-3" /> Confirm Start Date
              </button>
            )}
            <Link to={`/clients/${client.id}`} className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
              Open client <ArrowUpRight className="size-3" />
            </Link>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <InfoCell label="BCBA" value={client.bcba ?? "—"} />
          <InfoCell label="RBT" value={client.rbt ?? "Unassigned"} />
          <InfoCell label="Approved hrs" value={`${client.approvedWeeklyHours ?? "—"} /wk`} />
          <InfoCell label="Start date" value={client.startDate ?? "Pending"} />
        </div>
      </div>

      {/* Coverage Cases for this client */}
      {clientCoverageCases.length > 0 && (
        <div className="rounded-2xl bg-card border border-border/70 p-5">
          <h3 className="text-sm font-semibold tracking-tight text-foreground inline-flex items-center gap-2">
            <AlertTriangle className="size-4 text-warning" /> Open Coverage Cases ({clientCoverageCases.length})
          </h3>
          <ul className="mt-3 space-y-2">
            {clientCoverageCases.map((cs) => {
              const id = String(cs.id ?? "");
              const caseType = String(cs.case_type ?? "coverage_gap").replace(/_/g, " ");
              const risk = String(cs.risk_level ?? "—");
              const status = String(cs.status ?? "open");
              const reason = (cs.reason as string) ?? "";
              const next = (cs.next_action as string) ?? "";
              const created = cs.created_at ? new Date(cs.created_at as string).toLocaleDateString() : "—";
              const isEscalation = caseType === "escalation";
              return (
                <li key={id} className="rounded-xl border border-border/60 bg-muted/30 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn(
                          "text-[10px] font-medium px-1.5 py-0.5 rounded",
                          isEscalation ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning",
                        )}>{caseType}</span>
                        <span className="text-[10px] text-muted-foreground bg-background px-1.5 py-0.5 rounded border border-border/60">risk: {risk}</span>
                        <span className="text-[10px] text-muted-foreground">status: {status}</span>
                        <span className="text-[10px] text-muted-foreground ml-auto">opened {created}</span>
                      </div>
                      {reason && <p className="text-sm text-foreground mt-1.5">{reason}</p>}
                      {next && <p className="text-[11px] text-muted-foreground mt-0.5">Next: {next}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <button
                        onClick={async () => { await updateCoverageCase(id, { status: "watching" } as never); void reload(); }}
                        className="h-7 px-2.5 rounded-lg text-[11px] text-muted-foreground hover:bg-muted transition"
                      >Mark Watching</button>
                      <button
                        onClick={async () => { await updateCoverageCase(id, { status: "resolved" } as never); void reload(); }}
                        className="h-7 px-2.5 rounded-lg bg-success/10 text-success text-[11px] font-medium hover:opacity-90 transition"
                      >Resolve</button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Readiness */}
      <div className="rounded-2xl bg-card border border-border/70 p-5">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">Staffing Readiness</h3>
        <ul className="mt-3 space-y-2">
          {readiness.map((r) => (
            <li key={r.label} className="flex items-center gap-2.5 text-sm">
              {r.ok
                ? <CheckCircle2 className="size-4 text-success" />
                : <span className="size-4 rounded-full border border-border/70" />}
              <span className={r.ok ? "text-foreground" : "text-muted-foreground"}>{r.label}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Match suggestions */}
      <div className="rounded-2xl bg-card border border-border/70 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold tracking-tight text-foreground inline-flex items-center gap-2">
            <Sparkles className="size-4 text-primary" /> Suggested RBT Matches
          </h3>
          <span className="text-xs text-muted-foreground">{suggestions.length} candidates</span>
        </div>
        {suggestions.length === 0 ? (
          <EmptyState label={`No RBTs with remaining capacity${client.state ? ` in ${client.state}` : ""} based on the last 7 days.`} />
        ) : (
          <div className="space-y-2">
            {suggestions.map(({ rbt, capacityRemaining, utilization }, idx) => {
              return (
                <div key={rbt.name} className="rounded-xl border border-border/60 bg-muted/30 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{rbt.name}</p>
                        {idx === 0 && <span className="text-[10px] font-medium uppercase tracking-wide bg-primary text-primary-foreground px-1.5 py-0.5 rounded">Top match</span>}
                        <span className="text-[10px] text-muted-foreground">{capacityRemaining}h open</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {rbt.state ?? "—"} · {rbt.hoursLast7d.toFixed(1)}h last 7d · {rbt.distinctClients} clients · {rbt.sessionsLast30d} sessions/30d
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        <span className="text-[10px] text-success bg-success/10 px-1.5 py-0.5 rounded">Util {utilization}%</span>
                        {rbt.lastSessionDate && (
                          <span className="text-[10px] text-muted-foreground bg-background px-1.5 py-0.5 rounded border border-border/60">
                            Last seen {rbt.lastSessionDate}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <button onClick={() => setAssignFor(rbt.name)} className="h-7 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition">Assign</button>
                      <button onClick={() => setContactFor(rbt.name)} className="h-7 px-3 rounded-lg text-xs text-muted-foreground hover:bg-muted transition inline-flex items-center gap-1">
                        <Phone className="size-3" /> Contact
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Schedule */}
      <div className="rounded-2xl bg-card border border-border/70 p-5">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">Schedule Coordination</h3>
        {client.schedule.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No schedule built yet.</p>
        ) : (
          <div className="mt-3 grid grid-cols-5 gap-2">
            {days.map((d) => {
              const blocks = client.schedule.filter((s) => s.day === d);
              return (
                <div key={d} className="rounded-lg border border-border/60 bg-muted/30 p-2 min-h-[72px]">
                  <p className="text-[11px] font-medium text-muted-foreground">{d}</p>
                  {blocks.length === 0 ? (
                    <p className="mt-2 text-[10px] text-muted-foreground/70">—</p>
                  ) : blocks.map((b, i) => (
                    <div key={i} className="mt-1.5 text-[10px] rounded bg-primary/10 text-primary px-1.5 py-1">
                      {b.start}–{b.end}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="rounded-2xl bg-card border border-border/70 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">Operational Notes</h3>
          <button onClick={() => setNoteOpen(true)} className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
            <Plus className="size-3" /> Add note
          </button>
        </div>
        <ul className="mt-3 space-y-2.5">
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No scheduling activity logged yet.</p>
          ) : activity.map((t) => (
            <li key={t.id} className="flex items-start gap-2.5 text-sm">
              <FileText className="size-3.5 mt-0.5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-foreground">{t.description}</p>
                <p className="text-[11px] text-muted-foreground">{t.timestamp}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <AssignRbtDialog open={!!assignFor} onOpenChange={(o) => !o && setAssignFor(null)} client={lite} defaultRbt={assignFor ?? ""} onSaved={() => { setAssignFor(null); void reload(); }} />
      <ContactAttemptDialog open={!!contactFor} onOpenChange={(o) => !o && setContactFor(null)} client={lite} defaultContactType="rbt" onSaved={() => { void reload(); }} />
      <CoverageNoteDialog open={noteOpen} onOpenChange={setNoteOpen} client={lite} onSaved={reload} />
      <StartDateDialog open={startDateOpen} onOpenChange={setStartDateOpen} client={lite} onSaved={() => { setStartDateOpen(false); void reload(); }} />
    </>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/40 border border-border/60 px-3 py-2">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-foreground truncate mt-0.5">{value}</p>
    </div>
  );
}

function ContextPanel({
  coverageRisks,
  rbtRoster,
  loading,
}: {
  coverageRisks: CoverageRiskRow[];
  rbtRoster: ProviderRosterEntry[];
  loading: boolean;
}) {
  const topRisks = coverageRisks.slice(0, 5);
  const openRbts = rbtRoster
    .filter((r) => r.hoursLast7d < RBT_TARGET_HOURS - 4)
    .sort((a, b) => a.hoursLast7d - b.hoursLast7d)
    .slice(0, 5);

  return (
    <div className="rounded-2xl bg-card border border-border/70 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)] p-5 space-y-5">
      <Section title="Coverage Risks (CR)" icon={AlertTriangle} tone="warning">
        {loading ? <Quiet text="Loading CentralReach signals…" /> :
          topRisks.length === 0 ? <Quiet text="All clients have recent RBT coverage." /> :
          topRisks.map((c) => (
            <div key={c.clientName} className="rounded-lg hover:bg-muted/40 px-2 py-1.5 -mx-2 transition">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-foreground truncate">{c.clientName}</p>
                <span className={cn(
                  "text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0",
                  c.level === "uncovered" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning",
                )}>{c.level === "uncovered" ? "Uncovered" : "At risk"}</span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">{c.state ?? "—"} · {c.reason}</p>
            </div>
          ))
        }
      </Section>

      <Section title="RBTs with Capacity" icon={Users} tone="success">
        {loading ? <Quiet text="Loading roster…" /> :
          openRbts.length === 0 ? <Quiet text="All RBTs near or above 32h target this week." /> :
          openRbts.map((r) => (
            <div key={r.name} className="flex items-center justify-between text-sm px-2 py-1.5 -mx-2 rounded-lg hover:bg-muted/40 transition">
              <div className="min-w-0">
                <p className="text-foreground truncate">{r.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {r.state ?? "—"} · {r.hoursLast7d.toFixed(1)}h / {RBT_TARGET_HOURS}h · {r.distinctClients} clients
                </p>
              </div>
            </div>
          ))
        }
      </Section>

      <Section title="Quick Actions" icon={ShieldCheck}>
        <div className="space-y-1.5">
          <QuickLink to="/scheduling" label="Open Scheduling" />
          <QuickLink to="/scheduling/rbts" label="Open RBT Roster" />
          <QuickLink to="/scheduling/bcbas" label="Open BCBA Roster" />
          <QuickLink to="/authorizations" label="Open Authorizations" />
        </div>
      </Section>
    </div>
  );
}

function AskBlossomPanel({
  cr,
  counts,
  availableRbts,
}: {
  cr: ReturnType<typeof useCentralReachOps>;
  counts: Record<WorkBucket, number>;
  availableRbts: number;
}) {
  const topUncovered = cr.coverageRisks.find((r) => r.level === "uncovered");
  const overloaded = cr.rbtRoster.filter((r) => r.hoursLast7d > 35).length;

  const prompts: { label: string; q: string }[] = [
    {
      label: `Uncovered clients · ${cr.counts.uncoveredClients} (CR 14d+)`,
      q: `List the ${cr.counts.uncoveredClients} clients with no 97153 (RBT direct) session in the last 14 days. Group by state and suggest next coordination step.`,
    },
    {
      label: `Forming gaps · ${cr.counts.atRiskClients} at risk${topUncovered ? ` · start with ${topUncovered.clientName}` : ""}`,
      q: `Which active clients have their last RBT session 7-13 days ago${topUncovered ? `, starting with ${topUncovered.clientName}` : ""}? Suggest a Scheduling next action for each.`,
    },
    {
      label: `Cancellation trend · ${cr.cancellationsLast7d} (7d) / ${cr.cancellationsLast30d} (30d)`,
      q: `Summarize CentralReach client cancellations: ${cr.cancellationsLast7d} in last 7 days and ${cr.cancellationsLast30d} in last 30 days. Identify any states or clinics trending up.`,
    },
    {
      label: `Rebalance load · ${overloaded} overloaded · ${availableRbts} with capacity`,
      q: `From CentralReach last 7 days, ${overloaded} RBTs are above 35h and ${availableRbts} are under ${RBT_TARGET_HOURS - 4}h. Recommend rebalancing pairs by state.`,
    },
    {
      label: `Confirm ${counts.pending_start} pending start dates`,
      q: `Which paired clients still need a confirmed start date? Group by state and flag any waiting more than 7 days.`,
    },
  ];

  return (
    <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-primary/5 to-transparent backdrop-blur-sm p-5">
      <h3 className="text-sm font-semibold tracking-tight text-foreground inline-flex items-center gap-2">
        <Sparkles className="size-4 text-primary" /> Operational Insights
      </h3>
      <p className="mt-1 text-[11px] text-muted-foreground">Scoped to Scheduling · live operational data.</p>
      <div className="mt-3 space-y-1.5">
        {prompts.map((p) => (
          <Link
            key={p.label}
            to={`/ai/assistant?scope=scheduling&q=${encodeURIComponent(p.q)}`}
            className="block w-full text-left text-xs text-foreground rounded-lg bg-card border border-border/60 px-2.5 py-2 hover:border-primary/40 hover:bg-primary/5 transition"
          >
            {p.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, tone = "default", children }: { title: string; icon: typeof AlertTriangle; tone?: "warning" | "success" | "default"; children: React.ReactNode }) {
  const toneClass = tone === "warning" ? "text-warning" : tone === "success" ? "text-success" : "text-muted-foreground";
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold tracking-tight text-foreground inline-flex items-center gap-1.5">
        <Icon className={cn("size-3.5", toneClass)} /> {title}
      </h4>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function QuickLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="flex items-center justify-between text-sm text-foreground rounded-lg px-2 py-1.5 -mx-2 hover:bg-muted/40 transition">
      <span>{label}</span>
      <ChevronRight className="size-3.5 text-muted-foreground" />
    </Link>
  );
}

function EmptyState({ label }: { label: string }) {
  return <p className="text-sm text-muted-foreground italic px-4 py-8 text-center">{label}</p>;
}

function Quiet({ text }: { text: string }) {
  return <p className="text-xs text-muted-foreground">{text}</p>;
}