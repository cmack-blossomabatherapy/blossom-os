 import { useEffect, useMemo, useState } from "react";
 import { Link, useSearchParams } from "react-router-dom";
 import {
   Search, CalendarClock, Plus, ListChecks, AlertTriangle, Sparkles,
   MessageSquare, ChevronRight, Users, Home, Building2, GraduationCap,
   ArrowUpRight, ShieldCheck, Activity, MapPin, Clock, CircleDot, Send,
 } from "lucide-react";
 import { OSShell } from "./OSShell";
import { SchedulingOverlayWarning } from "@/components/scheduling/SchedulingOverlayWarning";
 import { cn } from "@/lib/utils";
 import { useClients } from "@/contexts/ClientsContext";
 import { type Client, type ScheduleSlot } from "@/data/clients";
 import { useCentralReachOps, type ClientPairing } from "@/hooks/useCentralReachOps";
import { useOSRole } from "@/contexts/OSRoleContext";
import {
  AdjustmentDialog, CancellationDialog, ContactAttemptDialog,
  CoverageCaseDialog, CoverageNoteDialog, CRSyncBadge,
} from "@/components/scheduling/SchedulingDialogs";
import { useSchedulingActions } from "@/hooks/useSchedulingActions";
import { buildClientDetailHref } from "@/lib/os/reporting/clientRouteBuilder";

 /* ---------------- helpers ---------------- */

 const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
 type Day = (typeof DAYS)[number];

 type SessionStatus = "confirmed" | "pending" | "uncovered" | "conflict" | "cancelled" | "coverage_needed";

 const STATUS_LABEL: Record<SessionStatus, string> = {
   confirmed: "Confirmed",
   pending: "Pending",
   uncovered: "Uncovered",
   conflict: "Conflict",
   cancelled: "Cancelled",
   coverage_needed: "Coverage Needed",
 };

 const STATUS_TONE: Record<SessionStatus, string> = {
   confirmed: "bg-success/10 text-success border-success/20",
   pending: "bg-info/10 text-info border-info/20",
   uncovered: "bg-destructive/10 text-destructive border-destructive/20",
   conflict: "bg-warning/10 text-warning border-warning/20",
   cancelled: "bg-muted text-muted-foreground border-border/60",
   coverage_needed: "bg-warning/10 text-warning border-warning/20",
 };

 const LOC_ICON = { Home, Clinic: Building2, School: GraduationCap } as const;

 interface SessionItem {
   id: string;
   client: Client;
   day: Day;
   start: string;
   end: string;
   rbt?: string;
   bcba?: string;
   location?: ScheduleSlot["location"];
   status: SessionStatus;
 }

 function statusForClient(c: Client, slot: ScheduleSlot): SessionStatus {
   if (!slot.rbt && !c.rbt) return "uncovered";
   if (c.activeServiceStatus === "Flaked") return "cancelled";
   if (c.activeServiceStatus === "Services on Pause") return "coverage_needed";
   if (c.blockers && c.blockers.length > 0) return "conflict";
   if (c.stage === "Pending Start Date") return "pending";
   if (c.stage === "Active") return "confirmed";
   return "pending";
 }

 function buildSessions(
   clients: Client[],
   pairingsByClient: Map<string, ClientPairing>,
 ): SessionItem[] {
   const out: SessionItem[] = [];
   // Map weekday index (0-6, Sun-Sat) → label used by this page
   const DOW_TO_DAY: Record<number, Day | null> = {
     0: null, 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat",
   };
   for (const c of clients) {
     for (let i = 0; i < c.schedule.length; i++) {
       const s = c.schedule[i];
       out.push({
         id: `${c.id}-${i}`,
         client: c,
         day: s.day as Day,
         start: s.start,
         end: s.end,
         rbt: s.rbt ?? c.rbt ?? undefined,
         bcba: c.bcba ?? undefined,
         location: s.location,
         status: statusForClient(c, s),
       });
     }
     // No explicit schedule slot on the client record? Fall back to the
     // real recurring pattern derived from CentralReach session history
     // (last 4 weeks). Each weekday with any RBT hours becomes one slot.
     if (c.schedule.length === 0) {
       const pairing = pairingsByClient.get(c.childName);
       const activeDays = pairing?.weeklyPattern.filter((d) => d.hours > 0) ?? [];
       if (activeDays.length > 0) {
         for (const d of activeDays) {
           const dayIdx = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(d.day);
           const dayLabel = DOW_TO_DAY[dayIdx];
           if (!dayLabel) continue;
           const avgHoursPerSession = Math.max(1, Math.round((d.hours / 4) * 10) / 10);
           const status: SessionStatus =
             pairing!.cancellationsLast30d >= 3 ? "coverage_needed" : "confirmed";
           out.push({
             id: `${c.id}-cr-${d.day}`,
             client: c,
             day: dayLabel,
             start: "Recurring",
             end: `~${avgHoursPerSession}h`,
             rbt: pairing!.rbtName ?? undefined,
             bcba: pairing!.bcbaName ?? c.bcba ?? undefined,
             status,
           });
         }
       } else if (
         c.stage === "Pending Start Date" ||
         (c.scheduledWeeklyHours !== undefined && c.approvedWeeklyHours !== undefined &&
           c.scheduledWeeklyHours < c.approvedWeeklyHours * 0.8)
       ) {
         // Pending start with no CR history yet — show as uncovered card.
         out.push({
           id: `${c.id}-none`,
           client: c,
           day: "Mon",
           start: "—",
           end: "—",
           rbt: c.rbt ?? undefined,
           bcba: c.bcba ?? undefined,
           status: c.rbt ? "pending" : "uncovered",
         });
       }
     }
   }
   return out;
 }

 /* ---------------- page ---------------- */

 export default function OSScheduling() {
  const { clients } = useClients();
   const cr = useCentralReachOps();
  const { activeState } = useOSRole();
   const [params, setParams] = useSearchParams();
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

   const [stateFilter, setStateFilter] = useState<string>(params.get("state") ?? "all");
   const [statusFilter, setStatusFilter] = useState<SessionStatus | "all">(
     (params.get("status") as SessionStatus | null) ?? "all"
   );
   const [query, setQuery] = useState(params.get("q") ?? "");

  // Scope clients by active state for State Director / state-scoped roles.
  const scopedClients = useMemo(
    () => (activeState ? clients.filter((c) => c.state === activeState) : clients),
    [clients, activeState],
  );

  const allSessions = useMemo(
    () => buildSessions(scopedClients, cr.pairingsByClient),
    [scopedClients, cr.pairingsByClient],
  );

   const filtered = useMemo(() => {
     return allSessions.filter((s) => {
       if (stateFilter !== "all" && s.client.state !== stateFilter) return false;
       if (statusFilter !== "all" && s.status !== statusFilter) return false;
       if (query) {
         const q = query.toLowerCase();
         const blob = `${s.client.childName} ${s.rbt ?? ""} ${s.bcba ?? ""} ${s.client.clinic ?? ""}`.toLowerCase();
         if (!blob.includes(q)) return false;
       }
       return true;
     });
   }, [allSessions, stateFilter, statusFilter, query]);

   const selectedClientId = params.get("clientId");
   const selectedClient = selectedClientId ? clients.find((c) => c.id === selectedClientId) ?? null : null;

   const selectClient = (id: string) => {
     const next = new URLSearchParams(params);
     next.set("clientId", id);
     setParams(next, { replace: true });
   };

  const states = Array.from(new Set(scopedClients.map((c) => c.state))).sort();

   // Header chip counts
   const counts = useMemo(() => {
     const uncovered = allSessions.filter((s) => s.status === "uncovered").length;
    const coverageRisk = scopedClients.filter((c) =>
       c.activeServiceStatus === "Services on Pause" ||
       c.activeServiceStatus === "Flaked" ||
       (c.scheduledWeeklyHours !== undefined && c.approvedWeeklyHours !== undefined && c.scheduledWeeklyHours < c.approvedWeeklyHours * 0.8)
     ).length;
     const pending = allSessions.filter((s) => s.status === "pending").length;
     const conflicts = allSessions.filter((s) => s.status === "conflict").length;
    const activePairs = scopedClients.filter((c) => c.stage === "Active" && c.rbt && c.bcba).length;
    const upcomingStarts = scopedClients.filter((c) => c.stage === "Pending Start Date").length;
     return { uncovered, coverageRisk, pending, conflicts, activePairs, upcomingStarts };
  }, [allSessions, scopedClients]);

   // Week grid grouping
   const grid = useMemo(() => {
     const m: Record<Day, SessionItem[]> = { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [] };
     for (const s of filtered) if (s.start !== "—") m[s.day].push(s);
     for (const d of DAYS) m[d].sort((a, b) => a.start.localeCompare(b.start));
     return m;
   }, [filtered]);

   return (
     <OSShell>
       <div className="mx-auto max-w-[1400px] px-6 md:px-10 py-8 space-y-6">
         {/* Header */}
         <header className="space-y-4">
           <div className="flex items-start justify-between gap-6 flex-wrap">
             <div>
               <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">Scheduling</h1>
               <p className="mt-2 text-[15px] text-muted-foreground max-w-2xl">
                 Coordinate schedules, manage coverage, monitor conflicts, and support service continuity across Blossom.
               </p>
             </div>
             <div className="flex items-center gap-2">
                <button onClick={() => setAdjustOpen(true)} className="h-10 px-4 rounded-xl bg-secondary text-secondary-foreground border border-border/70 hover:bg-muted transition text-sm font-medium inline-flex items-center gap-2">
                 <Plus className="size-4" /> Add Adjustment
               </button>
                <button onClick={() => setCancelOpen(true)} className="h-10 px-4 rounded-xl bg-secondary text-secondary-foreground border border-border/70 hover:bg-muted transition text-sm font-medium inline-flex items-center gap-2">
                 <MessageSquare className="size-4" /> Log Cancellation
               </button>
               <Link to="/ops/staffing?tab=coverage" className="h-10 px-4 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition text-sm font-medium inline-flex items-center gap-2 shadow-sm">
                 <ListChecks className="size-4" /> Open Staffing Queue
               </Link>
             </div>
           </div>

           {/* Operational chips */}
           <div className="flex flex-wrap items-center gap-2">
             <Chip label="Uncovered Sessions" value={counts.uncovered} tone="destructive" />
             <Chip label="Coverage Risks" value={counts.coverageRisk} tone="warning" />
             <Chip label="Pending Confirmations" value={counts.pending} tone="info" />
             <Chip label="Schedule Conflicts" value={counts.conflicts} tone="warning" />
             <Chip label="Active Pairings" value={counts.activePairs} tone="success" />
             <Chip label="Upcoming Starts" value={counts.upcomingStarts} tone="primary" />
           </div>
         </header>

        <SchedulingOverlayWarning />

         {/* TOP — schedule timeline + filters */}
         <section className="rounded-2xl bg-card border border-border/70 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]">
           <div className="p-4 md:p-5 border-b border-border/60 flex flex-wrap items-center gap-3 justify-between">
             <div className="flex items-center gap-2">
               <CalendarClock className="size-4 text-muted-foreground" />
               <h2 className="text-sm font-semibold tracking-tight text-foreground">Operational Week</h2>
               <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">{filtered.length} sessions</span>
             </div>
             <div className="flex flex-wrap items-center gap-2">
               <div className="relative">
                 <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                 <input
                   value={query}
                   onChange={(e) => setQuery(e.target.value)}
                   placeholder="Search client, RBT, BCBA"
                   className="w-56 h-9 pl-9 pr-3 rounded-xl bg-muted/60 border border-border text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                 />
               </div>
               <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} className="h-9 rounded-xl bg-muted/60 border border-border px-3 text-sm">
                 <option value="all">All states</option>
                 {states.map((s) => <option key={s} value={s}>{s}</option>)}
               </select>
               <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as SessionStatus | "all")} className="h-9 rounded-xl bg-muted/60 border border-border px-3 text-sm">
                 <option value="all">All statuses</option>
                 {(Object.keys(STATUS_LABEL) as SessionStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
               </select>
             </div>
           </div>

           <div className="p-4 md:p-5">
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
               {DAYS.map((d) => (
                 <div key={d} className="rounded-xl bg-muted/40 border border-border/60 p-3 min-h-[180px]">
                   <div className="flex items-center justify-between mb-3">
                     <span className="text-xs font-medium text-foreground">{d}</span>
                     <span className="text-[11px] text-muted-foreground tabular-nums">{grid[d].length}</span>
                   </div>
                   <div className="space-y-2">
                     {grid[d].length === 0 && (
                       <p className="text-[11px] text-muted-foreground/70 italic">No sessions</p>
                     )}
                     {grid[d].slice(0, 6).map((s) => (
                       <button
                         key={s.id}
                         onClick={() => selectClient(s.client.id)}
                         className={cn(
                           "w-full text-left rounded-lg border p-2 transition hover:-translate-y-0.5 hover:shadow-sm",
                           selectedClientId === s.client.id ? "border-primary/50 bg-primary/5" : "border-border/60 bg-card",
                         )}
                       >
                         <div className="flex items-center justify-between gap-2">
                           <span className="text-[11px] tabular-nums text-muted-foreground">{s.start}–{s.end}</span>
                           <span className={cn("text-[10px] px-1.5 py-0.5 rounded border", STATUS_TONE[s.status])}>{STATUS_LABEL[s.status]}</span>
                         </div>
                         <p className="text-xs font-medium text-foreground mt-1 truncate">{s.client.childName}</p>
                         <p className="text-[11px] text-muted-foreground truncate">{s.rbt ?? "Unassigned RBT"}</p>
                       </button>
                     ))}
                     {grid[d].length > 6 && (
                       <p className="text-[11px] text-muted-foreground">+{grid[d].length - 6} more</p>
                     )}
                   </div>
                 </div>
               ))}
             </div>
           </div>
         </section>

         {/* MIDDLE — coordination workspace + AI panel */}
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
           <section className="lg:col-span-8">
             {selectedClient ? (
               <CoordinationWorkspace client={selectedClient} />
             ) : (
               <EmptyWorkspace />
             )}
           </section>
           <aside className="lg:col-span-4 space-y-4">
             <AskBlossomPanel />
           </aside>
         </div>

         {/* BOTTOM — operational insights */}
         <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <CoverageRisksCard clients={scopedClients} onSelect={selectClient} />
          <UpcomingStartsCard clients={scopedClients} onSelect={selectClient} />
           <ProviderLoadCard clients={clients} />
         </section>
       </div>
       <AdjustmentDialog open={adjustOpen} onOpenChange={setAdjustOpen} client={selectedClient ? { id: selectedClient.id, childName: selectedClient.childName, state: selectedClient.state, rbt: selectedClient.rbt, bcba: selectedClient.bcba } : null} />
       <CancellationDialog open={cancelOpen} onOpenChange={setCancelOpen} client={selectedClient ? { id: selectedClient.id, childName: selectedClient.childName, state: selectedClient.state, rbt: selectedClient.rbt, bcba: selectedClient.bcba } : null} />
     </OSShell>
   );
 }

 /* ---------------- subcomponents ---------------- */

 function Chip({ label, value, tone }: { label: string; value: number; tone: "destructive" | "warning" | "success" | "primary" | "info" }) {
   const t = {
     destructive: "text-destructive",
     warning: "text-warning",
     success: "text-success",
     primary: "text-primary",
     info: "text-info",
   }[tone];
   return (
     <div className="inline-flex items-center gap-2 h-9 px-3 rounded-full bg-card border border-border/70 text-sm">
       <span className={cn("font-semibold tabular-nums", t)}>{value}</span>
       <span className="text-muted-foreground">{label}</span>
     </div>
   );
 }

 function EmptyWorkspace() {
   return (
     <div className="rounded-2xl bg-muted/40 border border-border/60 p-12 text-center">
       <CalendarClock className="size-8 mx-auto text-muted-foreground/70" />
       <p className="mt-3 text-sm text-muted-foreground">Select a session or client schedule to begin coordination.</p>
     </div>
   );
 }

 function CoordinationWorkspace({ client }: { client: Client }) {
    const { logAction, listClientSchedulingActions, listClientContactAttempts } = useSchedulingActions();
    const [findOpen, setFindOpen] = useState(false);
    const [escalateOpen, setEscalateOpen] = useState(false);
    const [notifyOpen, setNotifyOpen] = useState(false);
    const [notes, setNotes] = useState<Array<{ id: string; author: string; ts: string; body: string }>>([]);
    const [draft, setDraft] = useState("");
    const [posting, setPosting] = useState(false);
    const lite = { id: client.id, childName: client.childName, state: client.state, rbt: client.rbt, bcba: client.bcba };
    const reload = async () => {
      const [a, c] = await Promise.all([listClientSchedulingActions(client.id), listClientContactAttempts(client.id)]);
      const merged = [
        ...a.map((r) => ({
          id: `a-${r.id}`,
          author: (r.action_type as string).replace(/_/g, " "),
          ts: new Date(r.created_at as string).toLocaleString(),
          body: (r.note as string) ?? (r.title as string) ?? "",
        })),
        ...c.map((r) => ({
          id: `c-${r.id}`,
          author: `${r.contact_type} · ${r.channel}`,
          ts: new Date(r.created_at as string).toLocaleString(),
          body: (r.body as string) ?? (r.outcome as string) ?? "",
        })),
      ].sort((x, y) => (x.ts < y.ts ? 1 : -1)).slice(0, 8);
      setNotes(merged);
    };
    useEffect(() => { void reload(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [client.id]);

    const postNote = async () => {
      if (!draft.trim()) return;
      setPosting(true);
      try {
        await logAction({ clientId: client.id, actionType: "coverage_note", note: draft, state: client.state });
        setDraft("");
        await reload();
      } finally { setPosting(false); }
    };

   const scheduledHrs = client.scheduledWeeklyHours ?? client.schedule.reduce((a, s) => {
     const [sh, sm] = s.start.split(":").map(Number);
     const [eh, em] = s.end.split(":").map(Number);
     return a + (eh * 60 + em - sh * 60 - sm) / 60;
   }, 0);
   const approved = client.approvedWeeklyHours ?? 0;
   const uncovered = Math.max(0, approved - scheduledHrs);
   const consistency = approved > 0 ? Math.round(Math.min(100, (scheduledHrs / approved) * 100)) : 100;

   const stabilitySignals: { label: string; tone: "success" | "warning" | "destructive" }[] = [];
   if (client.rbt && client.bcba) stabilitySignals.push({ label: "Stable pairing", tone: "success" });
   if (client.activeServiceStatus === "Flaked") stabilitySignals.push({ label: "Frequent cancellations", tone: "destructive" });
   if (uncovered > 0) stabilitySignals.push({ label: `${uncovered.toFixed(1)}h uncovered`, tone: "warning" });
   if (client.blockers && client.blockers.length > 0) stabilitySignals.push({ label: "Schedule blockers", tone: "warning" });
   if (stabilitySignals.length === 0) stabilitySignals.push({ label: "Schedule stable", tone: "success" });

   return (
     <div className="space-y-4">
       {/* Overview */}
       <div className="rounded-2xl bg-card border border-border/70 p-5 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]">
         <div className="flex items-start justify-between gap-4 flex-wrap">
           <div>
             <p className="text-xs uppercase tracking-widest text-muted-foreground">{client.state} · {client.clinic}</p>
             <h2 className="text-xl font-semibold tracking-tight text-foreground mt-1">{client.childName}</h2>
             <p className="text-sm text-muted-foreground mt-1">{client.stage}{client.activeServiceStatus ? ` · ${client.activeServiceStatus}` : ""}</p>
           </div>
           <div className="flex flex-wrap items-center gap-2">
             <Link to={buildClientDetailHref(client.id) ?? "#"} className="h-9 px-3 rounded-xl bg-secondary text-secondary-foreground border border-border/70 hover:bg-muted text-xs font-medium inline-flex items-center gap-1.5"><ArrowUpRight className="size-3.5" /> Open Client</Link>
             <Link to="/ops/staffing?tab=open-cases" className="h-9 px-3 rounded-xl bg-secondary text-secondary-foreground border border-border/70 hover:bg-muted text-xs font-medium inline-flex items-center gap-1.5"><Users className="size-3.5" /> Staffing Queue</Link>
             <Link to="/staff" className="h-9 px-3 rounded-xl bg-secondary text-secondary-foreground border border-border/70 hover:bg-muted text-xs font-medium inline-flex items-center gap-1.5"><ShieldCheck className="size-3.5" /> BCBA / RBT</Link>
             <Link to="/authorizations" className="h-9 px-3 rounded-xl bg-secondary text-secondary-foreground border border-border/70 hover:bg-muted text-xs font-medium inline-flex items-center gap-1.5"><Activity className="size-3.5" /> Auths</Link>
           </div>
         </div>

         <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
           <Metric label="BCBA" value={client.bcba ?? "—"} />
           <Metric label="RBT" value={client.rbt ?? "Unassigned"} muted={!client.rbt} />
           <Metric label="Scheduled / Authorized" value={`${scheduledHrs.toFixed(1)} / ${approved} h`} />
           <Metric label="Consistency" value={`${consistency}%`} tone={consistency >= 90 ? "success" : consistency >= 70 ? "info" : "warning"} />
         </div>
       </div>

       {/* Weekly schedule view */}
       <div className="rounded-2xl bg-card border border-border/70 p-5">
         <h3 className="text-sm font-semibold tracking-tight text-foreground">Weekly Schedule</h3>
         {client.schedule.length === 0 ? (
           <p className="mt-3 text-sm text-muted-foreground">No sessions scheduled yet. Add a session or open Staffing Queue to assign coverage.</p>
         ) : (
           <div className="mt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
             {DAYS.map((d) => {
               const slots = client.schedule.filter((s) => s.day === d);
               return (
                 <div key={d} className="rounded-xl bg-muted/40 border border-border/50 p-2 min-h-[110px]">
                   <p className="text-[11px] font-medium text-foreground">{d}</p>
                   <div className="mt-1.5 space-y-1.5">
                     {slots.length === 0 ? (
                       <p className="text-[11px] text-muted-foreground/70 italic">—</p>
                     ) : slots.map((s, i) => {
                       const Icon = s.location ? LOC_ICON[s.location] : Home;
                       return (
                         <div key={i} className="rounded-md bg-card border border-border/60 px-2 py-1.5">
                           <p className="text-[11px] tabular-nums text-foreground">{s.start}–{s.end}</p>
                           <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1"><Icon className="size-3" />{s.rbt ?? "Unassigned"}</p>
                         </div>
                       );
                     })}
                   </div>
                 </div>
               );
             })}
           </div>
         )}
       </div>

       {/* Coverage management */}
       <div className="rounded-2xl bg-card border border-border/70 p-5">
         <div className="flex items-center justify-between">
           <h3 className="text-sm font-semibold tracking-tight text-foreground">Coverage Management</h3>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">Operational impact + next action</span>
              <CRSyncBadge status="not_ready" />
            </div>
         </div>
         <div className="mt-3 space-y-2">
           {uncovered > 0 ? (
             <CoverageRow
               title={`${uncovered.toFixed(1)}h uncovered this week`}
               impact={uncovered >= approved * 0.3 ? "High service continuity risk" : "Moderate service gap"}
                onFind={() => setFindOpen(true)}
                onNotify={() => setNotifyOpen(true)}
                onEscalate={() => setEscalateOpen(true)}
             />
           ) : null}
           {client.activeServiceStatus === "Flaked" && (
              <CoverageRow title="Repeated cancellations detected" impact="Parent communication recommended"
                onFind={() => setFindOpen(true)} onNotify={() => setNotifyOpen(true)} onEscalate={() => setEscalateOpen(true)} />
           )}
           {client.activeServiceStatus === "Services on Pause" && (
              <CoverageRow title="Services paused" impact="Confirm resumption date with family"
                onFind={() => setFindOpen(true)} onNotify={() => setNotifyOpen(true)} onEscalate={() => setEscalateOpen(true)} />
           )}
           {!client.rbt && (
              <CoverageRow title="No RBT assigned" impact="Open Staffing Queue to find matches"
                onFind={() => setFindOpen(true)} onNotify={() => setNotifyOpen(true)} onEscalate={() => setEscalateOpen(true)} />
           )}
           {uncovered === 0 && client.activeServiceStatus !== "Flaked" && client.activeServiceStatus !== "Services on Pause" && client.rbt && (
             <p className="text-sm text-muted-foreground">All sessions are currently covered.</p>
           )}
         </div>
       </div>

       {/* Schedule stability */}
       <div className="rounded-2xl bg-card border border-border/70 p-5">
         <h3 className="text-sm font-semibold tracking-tight text-foreground">Schedule Stability</h3>
         <div className="mt-3 flex flex-wrap gap-2">
           {stabilitySignals.map((s, i) => (
             <span key={i} className={cn(
               "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs border",
               s.tone === "success" && "bg-success/10 text-success border-success/20",
               s.tone === "warning" && "bg-warning/10 text-warning border-warning/20",
               s.tone === "destructive" && "bg-destructive/10 text-destructive border-destructive/20",
             )}>
               <CircleDot className="size-3" />{s.label}
             </span>
           ))}
         </div>
       </div>

       {/* Communication */}
       <div className="rounded-2xl bg-card border border-border/70 p-5">
         <h3 className="text-sm font-semibold tracking-tight text-foreground">Scheduling Notes</h3>
         <div className="mt-3 space-y-2">
            {notes.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No scheduling activity yet — posts and contact attempts will appear here.</p>
            ) : notes.map((n) => <NoteRow key={n.id} author={n.author} time={n.ts} body={n.body} />)}
         </div>
         <div className="mt-3 flex items-center gap-2">
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a coordination note…" className="flex-1 h-9 px-3 rounded-xl bg-muted/60 border border-border text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring" />
            <button onClick={postNote} disabled={posting || !draft.trim()} className="h-9 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50"><Send className="size-3.5" /> {posting ? "Posting…" : "Post"}</button>
         </div>
       </div>
       <CoverageCaseDialog open={findOpen} onOpenChange={setFindOpen} client={lite} mode="find" onSaved={reload} />
       <CoverageCaseDialog open={escalateOpen} onOpenChange={setEscalateOpen} client={lite} mode="escalate" onSaved={reload} />
       <ContactAttemptDialog open={notifyOpen} onOpenChange={setNotifyOpen} client={lite} defaultContactType="family" onSaved={reload} />
     </div>
   );
 }

 function Metric({ label, value, tone, muted }: { label: string; value: string; tone?: "success" | "info" | "warning"; muted?: boolean }) {
   const t = tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : tone === "info" ? "text-info" : "";
   return (
     <div className="rounded-xl bg-muted/40 border border-border/50 p-3">
       <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
       <p className={cn("mt-1 text-sm font-medium truncate", muted ? "text-muted-foreground" : t || "text-foreground")}>{value}</p>
     </div>
   );
 }

  function CoverageRow({ title, impact, onFind, onNotify, onEscalate }: { title: string; impact: string; onFind?: () => void; onNotify?: () => void; onEscalate?: () => void }) {
   return (
     <div className="rounded-xl bg-muted/40 border border-border/50 p-3 flex items-start justify-between gap-3">
       <div className="min-w-0">
         <p className="text-sm font-medium text-foreground">{title}</p>
         <p className="text-xs text-muted-foreground mt-0.5">{impact}</p>
       </div>
       <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={onFind} className="h-8 px-2.5 rounded-lg bg-card border border-border/70 text-xs hover:bg-muted">Find Coverage</button>
          <button onClick={onNotify} className="h-8 px-2.5 rounded-lg bg-card border border-border/70 text-xs hover:bg-muted">Notify</button>
          <button onClick={onEscalate} className="h-8 px-2.5 rounded-lg bg-card border border-border/70 text-xs hover:bg-muted">Escalate</button>
       </div>
     </div>
   );
 }

 function NoteRow({ author, time, body }: { author: string; time: string; body: string }) {
   return (
     <div className="rounded-xl bg-muted/40 border border-border/50 p-3">
       <div className="flex items-center justify-between">
         <p className="text-xs font-medium text-foreground">{author}</p>
         <p className="text-[11px] text-muted-foreground">{time}</p>
       </div>
       <p className="text-sm text-foreground/90 mt-1">{body}</p>
     </div>
   );
 }

 /* ---------------- bottom cards ---------------- */

 function InsightCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
   return (
     <div className="rounded-2xl bg-card border border-border/70 p-5 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]">
       <div className="flex items-center justify-between">
         <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
         <span className="text-[11px] text-muted-foreground">{subtitle}</span>
       </div>
       <div className="mt-3 space-y-2">{children}</div>
     </div>
   );
 }

 function CoverageRisksCard({ clients, onSelect }: { clients: Client[]; onSelect: (id: string) => void }) {
   const risks = clients.filter((c) =>
     c.activeServiceStatus === "Services on Pause" ||
     c.activeServiceStatus === "Flaked" ||
     (c.scheduledWeeklyHours !== undefined && c.approvedWeeklyHours !== undefined && c.scheduledWeeklyHours < c.approvedWeeklyHours * 0.8)
   ).slice(0, 4);
   return (
     <InsightCard title="Coverage Risks" subtitle={`${risks.length}`}>
       {risks.length === 0 ? (
         <p className="text-sm text-muted-foreground">Schedules are currently stable.</p>
       ) : risks.map((c) => (
         <button key={c.id} onClick={() => onSelect(c.id)} className="w-full text-left rounded-xl bg-muted/40 border border-border/50 p-3 hover:bg-muted transition flex items-center justify-between">
           <div className="min-w-0">
             <p className="text-sm font-medium text-foreground truncate">{c.childName}</p>
             <p className="text-[11px] text-muted-foreground truncate">{c.state} · {c.activeServiceStatus ?? c.stage}</p>
           </div>
           <ChevronRight className="size-4 text-muted-foreground" />
         </button>
       ))}
     </InsightCard>
   );
 }

 function UpcomingStartsCard({ clients, onSelect }: { clients: Client[]; onSelect: (id: string) => void }) {
   const upcoming = clients.filter((c) => c.stage === "Pending Start Date" || c.stage === "Schedule Created").slice(0, 4);
   return (
     <InsightCard title="Upcoming Starts" subtitle={`${upcoming.length}`}>
       {upcoming.length === 0 ? (
         <p className="text-sm text-muted-foreground">No upcoming starts pending setup.</p>
       ) : upcoming.map((c) => (
         <button key={c.id} onClick={() => onSelect(c.id)} className="w-full text-left rounded-xl bg-muted/40 border border-border/50 p-3 hover:bg-muted transition flex items-center justify-between">
           <div className="min-w-0">
             <p className="text-sm font-medium text-foreground truncate">{c.childName}</p>
             <p className="text-[11px] text-muted-foreground truncate">{c.rbt ? "Pairing ready" : "Pairing pending"} · {c.bcba ?? "No BCBA"}</p>
           </div>
           <ChevronRight className="size-4 text-muted-foreground" />
         </button>
       ))}
     </InsightCard>
   );
 }

 function ProviderLoadCard({ clients }: { clients: Client[] }) {
   const load = new Map<string, number>();
   for (const c of clients) {
     if (!c.rbt) continue;
     const h = c.scheduledWeeklyHours ?? c.schedule.reduce((a, s) => {
       const [sh, sm] = s.start.split(":").map(Number);
       const [eh, em] = s.end.split(":").map(Number);
       return a + (eh * 60 + em - sh * 60 - sm) / 60;
     }, 0);
     load.set(c.rbt, (load.get(c.rbt) ?? 0) + h);
   }
   const rows = Array.from(load.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4);
   return (
     <InsightCard title="Provider Load Balance" subtitle="weekly hrs">
       {rows.length === 0 ? (
         <p className="text-sm text-muted-foreground">No active provider assignments.</p>
       ) : rows.map(([name, h]) => {
         const pct = Math.min(100, (h / 40) * 100);
         const tone = h > 36 ? "bg-warning" : h > 25 ? "bg-primary" : "bg-success";
         return (
           <div key={name} className="rounded-xl bg-muted/40 border border-border/50 p-3">
             <div className="flex items-center justify-between">
               <p className="text-sm font-medium text-foreground truncate">{name}</p>
               <p className="text-[11px] tabular-nums text-muted-foreground">{h.toFixed(1)} h</p>
             </div>
             <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
               <div className={cn("h-full rounded-full", tone)} style={{ width: `${pct}%` }} />
             </div>
           </div>
         );
       })}
     </InsightCard>
   );
 }

 /* ---------------- AI panel ---------------- */

 function AskBlossomPanel() {
   const prompts = [
     "Which schedules are unstable?",
     "Show uncovered sessions this week.",
     "Which providers are overloaded?",
     "Which clients have cancellation risk?",
     "What scheduling conflicts need attention?",
     "Which schedules are incomplete?",
   ];
   return (
     <div className="rounded-2xl border border-border/70 p-5 bg-gradient-to-br from-primary/5 to-card shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]">
       <div className="flex items-center gap-2">
         <Sparkles className="size-4 text-primary" />
         <h3 className="text-sm font-semibold tracking-tight text-foreground">Operational Insights</h3>
       </div>
       <p className="text-xs text-muted-foreground mt-1">Scheduling assistant — permission-scoped.</p>
       <div className="mt-3 space-y-1.5">
         {prompts.map((p) => (
           <button key={p} className="w-full text-left text-xs text-foreground/90 rounded-lg bg-muted/50 hover:bg-muted border border-border/50 px-3 py-2 transition">
             {p}
           </button>
         ))}
       </div>
       <div className="mt-3 flex items-center gap-2">
         <input placeholder="Ask anything about scheduling…" className="flex-1 h-9 px-3 rounded-xl bg-muted/60 border border-border text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring" />
         <button className="h-9 w-9 grid place-items-center rounded-xl bg-primary text-primary-foreground hover:opacity-90"><Send className="size-4" /></button>
       </div>
     </div>
   );
 }