import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  HeartHandshake, Search, X, ChevronRight, Sparkles, MapPin, Calendar,
  Inbox, Clock, AlertTriangle, Plus, MessageSquare, Send, CheckCircle2,
  ArrowUpRight, Wallet, Flame, BellRing, FileText, Users2, CalendarDays,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { Card, HeaderBtn, PageHeader, Pill, Empty, fullName, fmtDate, type Tone } from "./_PayrollAtoms";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ---------------- Types ---------------- */
interface Emp {
  id: string; user_id: string | null;
  first_name: string; last_name: string; preferred_name: string | null;
  job_title: string; state: string; clinic: string | null;
  avatar_url: string | null; photo_url: string | null;
}
interface Pto {
  id: string; user_id: string;
  pto_type: string; start_date: string; end_date: string;
  partial_day: boolean; hours: number | string;
  reason: string | null; status: string;
  manager_id: string | null;
  submitted_at: string | null; reviewed_at: string | null;
  reviewed_by: string | null; review_notes: string | null;
  created_at: string; updated_at: string;
}
interface AttExc {
  id: string; employee_id: string; kind: string; status: string;
  occurred_on: string; detail: string | null;
}
interface Comm {
  id: string; employee_id: string | null; channel: string;
  direction: string; category: string; subject: string | null;
  body: string | null; status: string; created_by_name: string | null;
  created_at: string;
}

const TYPE_LABEL: Record<string, string> = {
  vacation: "Vacation", sick: "Sick", personal: "Personal",
  unpaid: "Unpaid", other: "Other",
};
const STATUS_LABEL: Record<string, string> = {
  draft: "Draft", submitted: "Submitted", pending_review: "Pending review",
  approved: "Approved", denied: "Denied", cancelled: "Cancelled",
};
const STATUS_TONE: Record<string, Tone> = {
  draft: "muted", submitted: "info", pending_review: "warn",
  approved: "ok", denied: "crit", cancelled: "muted",
};
const PAID_TYPES = new Set(["vacation", "sick", "personal"]);

function relTime(iso: string) {
  const d = new Date(iso); const ms = Date.now() - d.getTime();
  const m = Math.floor(ms / 60000); if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24); return days < 30 ? `${days}d ago` : fmtDate(iso);
}
function daysBetween(a: string, b: string) {
  return Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000) + 1);
}
function isInCurrentCycle(start: string, end: string) {
  // Treat current payroll cycle as the trailing 14 days through today + next 14 days
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const cycleStart = Date.now() - 14 * 86400000;
  const cycleEnd = Date.now() + 14 * 86400000;
  return e >= cycleStart && s <= cycleEnd;
}
function isUpcoming(start: string) {
  return new Date(start).getTime() >= Date.now() - 86400000;
}
function initials(e: Emp) {
  return `${(e.preferred_name || e.first_name || "?")[0] || "?"}${(e.last_name || "")[0] || ""}`.toUpperCase();
}

const OPEN_STATUSES = ["submitted", "pending_review"];

/* ---------------- Page ---------------- */
export default function OSPayrollPTO() {
  const [emps, setEmps] = useState<Emp[]>([]);
  const [pto, setPto] = useState<Pto[]>([]);
  const [excs, setExcs] = useState<AttExc[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [state, setState] = useState("all");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [impact, setImpact] = useState("all");
  const [view, setView] = useState("all");

  const [selected, setSelected] = useState<Pto | null>(null);

  async function loadAll() {
    setLoading(true);
    const [eRes, pRes, xRes] = await Promise.all([
      supabase.from("employees")
        .select("id,user_id,first_name,last_name,preferred_name,job_title,state,clinic,avatar_url,photo_url")
        .neq("status", "terminated").limit(500),
      supabase.from("pto_requests").select("*").order("start_date", { ascending: true }).limit(500),
      supabase.from("attendance_exceptions").select("id,employee_id,kind,status,occurred_on,detail").limit(500),
    ]);
    setEmps((eRes.data ?? []) as Emp[]);
    setPto((pRes.data ?? []) as Pto[]);
    setExcs((xRes.data ?? []) as AttExc[]);
    setLoading(false);
  }
  useEffect(() => { loadAll(); }, []);

  // Build emp lookup keyed by both id and user_id so PTO matches whichever was used
  const empByKey = useMemo(() => {
    const map = new Map<string, Emp>();
    for (const e of emps) {
      map.set(e.id, e);
      if (e.user_id) map.set(e.user_id, e);
    }
    return map;
  }, [emps]);

  function empFor(p: Pto) { return empByKey.get(p.user_id); }

  // PTO ↔ attendance conflict detection (overlapping date with an open attendance exception)
  const conflicts = useMemo(() => {
    const set = new Set<string>();
    for (const p of pto) {
      const e = empFor(p); if (!e) continue;
      const overlap = excs.find(x =>
        x.employee_id === e.id &&
        x.occurred_on >= p.start_date && x.occurred_on <= p.end_date &&
        !["resolved", "ignored", "cleared"].includes(x.status)
      );
      if (overlap) set.add(p.id);
    }
    return set;
  }, [pto, excs, empByKey]);

  function impactOf(p: Pto): "none" | "current" | "adjust" | "conflict" | "missing" {
    if (conflicts.has(p.id)) return "conflict";
    if (p.status === "approved" && PAID_TYPES.has(p.pto_type) && isInCurrentCycle(p.start_date, p.end_date)) return "adjust";
    if (isInCurrentCycle(p.start_date, p.end_date)) return "current";
    if (OPEN_STATUSES.includes(p.status) && !p.reason) return "missing";
    return "none";
  }

  /* ---------- Counts ---------- */
  const counts = useMemo(() => {
    let pending = 0, approvedCycle = 0, payrollImpact = 0, conflict = 0, followUp = 0, adjustNeeded = 0;
    for (const p of pto) {
      if (OPEN_STATUSES.includes(p.status)) pending++;
      if (p.status === "approved" && isInCurrentCycle(p.start_date, p.end_date)) approvedCycle++;
      const i = impactOf(p);
      if (i === "current" || i === "adjust") payrollImpact++;
      if (i === "conflict") conflict++;
      if (i === "adjust") adjustNeeded++;
      if (i === "missing") followUp++;
    }
    return { pending, approvedCycle, payrollImpact, conflict, followUp, adjustNeeded };
  }, [pto, conflicts]);

  /* ---------- Filters ---------- */
  const states = useMemo(() => Array.from(new Set(emps.map(e => e.state).filter(Boolean))).sort(), [emps]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return pto.filter(p => {
      const e = empFor(p); if (!e) return false;
      if (state !== "all" && e.state !== state) return false;
      if (type !== "all" && p.pto_type !== type) return false;
      if (status !== "all" && p.status !== status) return false;
      const i = impactOf(p);
      if (impact !== "all" && i !== impact) return false;

      if (view === "pending" && !OPEN_STATUSES.includes(p.status)) return false;
      if (view === "approved_cycle" && !(p.status === "approved" && isInCurrentCycle(p.start_date, p.end_date))) return false;
      if (view === "impact" && !(i === "current" || i === "adjust")) return false;
      if (view === "conflicts" && i !== "conflict") return false;
      if (view === "adjust" && i !== "adjust") return false;
      if (view === "upcoming" && !isUpcoming(p.start_date)) return false;

      if (qq) {
        const hay = [e.first_name, e.last_name, e.preferred_name, e.job_title, e.state, p.reason]
          .filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(qq)) return false;
      }
      return true;
    });
  }, [pto, empByKey, q, state, type, status, impact, view, conflicts]);

  const upcoming = useMemo(
    () => pto.filter(p => p.status === "approved" && isUpcoming(p.start_date))
      .sort((a, b) => a.start_date.localeCompare(b.start_date)).slice(0, 8),
    [pto]
  );
  const conflictItems = useMemo(() => pto.filter(p => conflicts.has(p.id)).slice(0, 6), [pto, conflicts]);
  const adjustItems = useMemo(() => pto.filter(p => impactOf(p) === "adjust").slice(0, 6), [pto, conflicts]);

  /* ---------- Cycle readiness ---------- */
  const cycleReadiness = useMemo(() => {
    if (counts.conflict > 0 || counts.followUp > 2) return "blocked";
    if (counts.adjustNeeded > 0 || counts.pending > 4) return "risk";
    if (counts.pending > 0 || counts.approvedCycle > 0) return "review";
    return "ready";
  }, [counts]);

  return (
    <OSShell>
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10 py-10">
        <PageHeader
          icon={HeartHandshake}
          title="PTO & Time Off"
          subtitle="Review PTO, absences, and payroll-impacting time off in one calm operational workspace."
        >
          <HeaderBtn icon={Clock} to="/payroll/time-attendance">Time & Attendance</HeaderBtn>
          <HeaderBtn icon={Inbox} to="/payroll/queue">Payroll Queue</HeaderBtn>
        </PageHeader>

        {/* Summary tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
          <SumTile icon={Inbox} label="Pending PTO" value={counts.pending} tone="warn"
            hint="Awaiting review" active={view === "pending"} onClick={() => setView(view === "pending" ? "all" : "pending")} />
          <SumTile icon={CheckCircle2} label="Approved this cycle" value={counts.approvedCycle} tone="info"
            hint="Inside current cycle" active={view === "approved_cycle"} onClick={() => setView(view === "approved_cycle" ? "all" : "approved_cycle")} />
          <SumTile icon={Wallet} label="Payroll impact" value={counts.payrollImpact} tone="warn"
            hint="Affects current run" active={view === "impact"} onClick={() => setView(view === "impact" ? "all" : "impact")} />
          <SumTile icon={AlertTriangle} label="Attendance conflicts" value={counts.conflict} tone="crit"
            hint="Overlap detected" active={view === "conflicts"} onClick={() => setView(view === "conflicts" ? "all" : "conflicts")} />
          <SumTile icon={MessageSquare} label="Follow-up needed" value={counts.followUp} tone="warn"
            hint="Missing detail" active={view === "all"} onClick={() => setView("all")} />
          <SumTile icon={Flame} label="Adjustment needed" value={counts.adjustNeeded} tone="crit"
            hint="Create adjustment" active={view === "adjust"} onClick={() => setView(view === "adjust" ? "all" : "adjust")} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div>
            {/* Cycle impact */}
            <Card className="p-5 mb-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">Payroll cycle impact</p>
                  <h2 className="text-base font-semibold tracking-tight mt-0.5">Current cycle readiness</h2>
                </div>
                <Pill tone={
                  cycleReadiness === "ready" ? "ok"
                  : cycleReadiness === "review" ? "info"
                  : cycleReadiness === "risk" ? "warn" : "crit"
                }>
                  {cycleReadiness === "ready" ? "Ready"
                    : cycleReadiness === "review" ? "Needs review"
                    : cycleReadiness === "risk" ? "At risk" : "Blocked"}
                </Pill>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <MiniStat label="Approved in cycle" value={counts.approvedCycle} tone="info" />
                <MiniStat label="Pending in cycle" value={pto.filter(p => OPEN_STATUSES.includes(p.status) && isInCurrentCycle(p.start_date, p.end_date)).length} tone="warn" />
                <MiniStat label="Adjustments needed" value={counts.adjustNeeded} tone="crit" />
                <MiniStat label="Conflicts" value={counts.conflict} tone="crit" />
              </div>
            </Card>

            {/* Filters */}
            <Card className="p-3 mb-5">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input value={q} onChange={e => setQ(e.target.value)}
                    placeholder="Search employee, reason…"
                    className="w-full h-9 pl-9 pr-8 rounded-xl bg-muted/50 border border-border/60 text-[13px] placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition" />
                  {q && <button onClick={() => setQ("")} className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 grid place-items-center rounded-lg hover:bg-muted">
                    <X className="h-3 w-3 text-muted-foreground" />
                  </button>}
                </div>
                <Select value={state} onChange={setState} options={[["all", "All states"], ...states.map(s => [s, s] as [string, string])]} />
                <Select value={type} onChange={setType} options={[
                  ["all", "All types"],
                  ...Object.entries(TYPE_LABEL).map(([v, l]) => [v, l] as [string, string]),
                ]} />
                <Select value={status} onChange={setStatus} options={[
                  ["all", "All statuses"],
                  ...Object.entries(STATUS_LABEL).map(([v, l]) => [v, l] as [string, string]),
                ]} />
                <Select value={impact} onChange={setImpact} options={[
                  ["all", "All impact"],
                  ["current", "Impacts current payroll"],
                  ["adjust", "Adjustment needed"],
                  ["conflict", "Attendance conflict"],
                  ["missing", "Missing documentation"],
                  ["none", "No impact"],
                ]} />
              </div>
            </Card>

            {/* Queue */}
            <Card className="overflow-hidden">
              <div className="px-4 py-3 border-b border-border/70 flex items-center justify-between">
                <h2 className="text-[13px] font-medium tracking-tight">PTO requests queue</h2>
                <span className="text-[11px] text-muted-foreground">{filtered.length} shown</span>
              </div>
              {loading ? (
                <ul className="divide-y divide-border/60">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <li key={i} className="px-4 py-4 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-muted animate-pulse" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-48 bg-muted rounded animate-pulse" />
                        <div className="h-2.5 w-32 bg-muted rounded animate-pulse" />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : filtered.length === 0 ? (
                <Empty icon={HeartHandshake} title="No PTO matches these filters" hint="Try clearing a filter or switching view." />
              ) : (
                <ul className="divide-y divide-border/60">
                  {filtered.map(p => {
                    const e = empFor(p)!;
                    const i = impactOf(p);
                    return (
                      <li key={p.id}>
                        <button onClick={() => setSelected(p)} className="w-full text-left px-4 py-3.5 hover:bg-muted/40 transition flex items-center gap-3">
                          <div className="h-9 w-9 shrink-0 rounded-xl bg-muted grid place-items-center text-[11.5px] font-medium overflow-hidden">
                            {e.photo_url || e.avatar_url
                              ? <img src={e.photo_url || e.avatar_url || ""} alt="" className="h-full w-full object-cover" />
                              : initials(e)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="text-[14px] font-medium tracking-tight truncate">{fullName(e)}</span>
                              <Pill tone={STATUS_TONE[p.status]}>{STATUS_LABEL[p.status]}</Pill>
                              <Pill tone="muted">{TYPE_LABEL[p.pto_type]}</Pill>
                              {i === "adjust" && <Pill tone="crit">Adjustment</Pill>}
                              {i === "conflict" && <Pill tone="crit">Conflict</Pill>}
                              {i === "current" && <Pill tone="warn">Current cycle</Pill>}
                              {i === "missing" && <Pill tone="warn">Needs detail</Pill>}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground">
                              <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />
                                {fmtDate(p.start_date)}{p.start_date !== p.end_date && ` → ${fmtDate(p.end_date)}`}
                              </span>
                              <span>· {daysBetween(p.start_date, p.end_date)} day{daysBetween(p.start_date, p.end_date) > 1 ? "s" : ""}</span>
                              <span>· {Number(p.hours)} hrs</span>
                              {e.state && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{e.state}</span>}
                              {p.submitted_at && <span>· submitted {relTime(p.submitted_at)}</span>}
                            </div>
                            {p.reason && <p className="text-[11.5px] text-muted-foreground truncate mt-1">{p.reason}</p>}
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            {/* Lower row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                    <h3 className="text-[13px] font-medium tracking-tight">Upcoming time off</h3>
                  </div>
                  <span className="text-[11px] text-muted-foreground">Approved, next 30d</span>
                </div>
                {upcoming.length === 0 ? (
                  <p className="text-[12px] text-muted-foreground">No upcoming approved PTO.</p>
                ) : (
                  <ul className="space-y-2">
                    {upcoming.map(p => {
                      const e = empFor(p)!;
                      const inCycle = isInCurrentCycle(p.start_date, p.end_date);
                      return (
                        <li key={p.id}>
                          <button onClick={() => setSelected(p)} className="w-full text-left rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/60 p-2.5 transition">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[12.5px] font-medium tracking-tight truncate">{fullName(e)}</p>
                              <Pill tone={inCycle ? "warn" : "muted"}>{inCycle ? "Current cycle" : "Next cycle"}</Pill>
                            </div>
                            <p className="text-[11.5px] text-muted-foreground mt-0.5">
                              {TYPE_LABEL[p.pto_type]} · {fmtDate(p.start_date)}
                              {p.start_date !== p.end_date && ` → ${fmtDate(p.end_date)}`} · {Number(p.hours)} hrs
                            </p>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                    <h3 className="text-[13px] font-medium tracking-tight">PTO & attendance conflicts</h3>
                  </div>
                  <Link to="/payroll/time-attendance" className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                    Open <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
                {conflictItems.length === 0 ? (
                  <p className="text-[12px] text-muted-foreground">No conflicts detected.</p>
                ) : (
                  <ul className="space-y-2">
                    {conflictItems.map(p => {
                      const e = empFor(p)!;
                      return (
                        <li key={p.id}>
                          <button onClick={() => setSelected(p)} className="w-full text-left rounded-xl border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 p-2.5 transition">
                            <p className="text-[12.5px] font-medium tracking-tight truncate">{fullName(e)}</p>
                            <p className="text-[11.5px] text-muted-foreground mt-0.5">
                              {TYPE_LABEL[p.pto_type]} · {fmtDate(p.start_date)} overlaps an attendance exception
                            </p>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            </div>

            {/* Adjustment triggers */}
            <Card className="p-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                  <h3 className="text-[13px] font-medium tracking-tight">Payroll adjustment triggers</h3>
                </div>
                <Link to="/payroll/adjustments" className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                  Open <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
              {adjustItems.length === 0 ? (
                <p className="text-[12px] text-muted-foreground">No PTO requires payroll adjustment right now.</p>
              ) : (
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {adjustItems.map(p => {
                    const e = empFor(p)!;
                    return (
                      <li key={p.id}>
                        <button onClick={() => setSelected(p)} className="w-full text-left rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/60 p-2.5 transition">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[12.5px] font-medium tracking-tight truncate">{fullName(e)}</p>
                            <Pill tone="crit">Adjustment</Pill>
                          </div>
                          <p className="text-[11.5px] text-muted-foreground mt-0.5">
                            {TYPE_LABEL[p.pto_type]} · {fmtDate(p.start_date)} · {Number(p.hours)} hrs
                          </p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </div>

          {/* Right rail */}
          <aside className="space-y-4">
            <Card className="p-4">
              <h3 className="text-[13px] font-medium tracking-tight mb-3">Quick actions</h3>
              <div className="space-y-1">
                <RailLink icon={Plus} to="/payroll/adjustments?new=1">Create payroll adjustment</RailLink>
                <RailLink icon={Clock} to="/payroll/time-attendance">Open Time & Attendance</RailLink>
                <RailLink icon={Users2} to="/payroll/profiles">Open employee profile</RailLink>
                <RailLink icon={BellRing} to="/payroll/messages">Send PTO reminder</RailLink>
                <RailLink icon={Flame} to="/payroll/issues">Escalate concern</RailLink>
                <RailLink icon={Inbox} to="/payroll/queue">Open Payroll Queue</RailLink>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <h3 className="text-[13px] font-medium tracking-tight">Operational Insights</h3>
              </div>
              <div className="space-y-1.5">
                {[
                  "What PTO affects this payroll cycle?",
                  "Which PTO requests still need review?",
                  "Which PTO items have attendance conflicts?",
                  "What time off may require a payroll adjustment?",
                  "Which employees need PTO follow-up?",
                  "Summarize PTO risks for payroll.",
                ].map(p => (
                  <Link key={p} to={`/ai/assistant?q=${encodeURIComponent(p)}`}
                    className="block text-[12px] text-muted-foreground hover:text-foreground rounded-lg px-2 py-1.5 hover:bg-muted transition">
                    “{p}”
                  </Link>
                ))}
              </div>
            </Card>
          </aside>
        </div>
      </div>

      {/* Detail drawer */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0 overflow-y-auto">
          {selected && (
            <PtoDrawer
              pto={selected}
              emp={empFor(selected)}
              conflict={conflicts.has(selected.id)}
              impact={impactOf(selected)}
              onClose={() => setSelected(null)}
              onChanged={loadAll}
            />
          )}
        </SheetContent>
      </Sheet>
    </OSShell>
  );
}

/* ---------------- Drawer ---------------- */
function PtoDrawer({
  pto, emp, conflict, impact, onClose, onChanged,
}: {
  pto: Pto; emp: Emp | undefined; conflict: boolean;
  impact: "none" | "current" | "adjust" | "conflict" | "missing";
  onClose: () => void; onChanged: () => void;
}) {
  const [comms, setComms] = useState<Comm[]>([]);
  const [note, setNote] = useState("");
  const [noteCat, setNoteCat] = useState("pto");
  const [busy, setBusy] = useState(false);

  async function loadComms() {
    if (!emp) return;
    const { data } = await supabase.from("payroll_communications")
      .select("*").eq("employee_id", emp.id).order("created_at", { ascending: false }).limit(50);
    setComms((data ?? []) as Comm[]);
  }
  useEffect(() => { loadComms(); }, [pto.id, emp?.id]);

  async function addNote() {
    if (!emp || !note.trim()) return;
    const { error } = await supabase.from("payroll_communications").insert({
      employee_id: emp.id, channel: "note" as any, direction: "internal" as any,
      category: noteCat, body: note.trim(), status: "logged",
      created_by_name: "Payroll Coordinator",
    } as any);
    if (error) { toast.error("Could not save note"); return; }
    setNote("");
    toast.success("PTO note recorded");
    loadComms();
  }

  async function updateStatus(next: string) {
    setBusy(true);
    const patch: any = { status: next };
    if (["approved", "denied"].includes(next)) {
      patch.reviewed_at = new Date().toISOString();
    }
    const { error } = await supabase.from("pto_requests").update(patch).eq("id", pto.id);
    setBusy(false);
    if (error) { toast.error("Update failed"); return; }
    toast.success(`Marked ${STATUS_LABEL[next] ?? next}`);
    onChanged();
  }

  const checklist = [
    { label: "PTO reviewed by payroll", done: !OPEN_STATUSES.includes(pto.status) },
    { label: "Manager approval confirmed", done: pto.status === "approved" || pto.status === "denied" },
    { label: "Attendance checked", done: !conflict },
    { label: "Payroll impact reviewed", done: impact === "none" || impact === "current" || comms.length > 0 },
    { label: "Adjustment created if needed", done: impact !== "adjust" },
  ];

  return (
    <div>
      <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/70">
        <div className="flex items-center gap-2 mb-3">
          <Pill tone={STATUS_TONE[pto.status]}>{STATUS_LABEL[pto.status]}</Pill>
          <Pill tone="muted">{TYPE_LABEL[pto.pto_type]}</Pill>
          {impact === "adjust" && <Pill tone="crit">Adjustment</Pill>}
          {impact === "conflict" && <Pill tone="crit">Conflict</Pill>}
          {impact === "current" && <Pill tone="warn">Current cycle</Pill>}
        </div>
        <SheetTitle className="text-lg font-semibold tracking-tight">
          {TYPE_LABEL[pto.pto_type]} · {fmtDate(pto.start_date)}{pto.start_date !== pto.end_date && ` → ${fmtDate(pto.end_date)}`}
        </SheetTitle>
        <p className="text-[12.5px] text-muted-foreground mt-1">
          {daysBetween(pto.start_date, pto.end_date)} day{daysBetween(pto.start_date, pto.end_date) > 1 ? "s" : ""} · {Number(pto.hours)} hrs{pto.partial_day && " · partial day"}
        </p>
      </SheetHeader>

      {/* Employee */}
      <Section title="Employee">
        {emp ? (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-muted grid place-items-center text-[12px] font-medium overflow-hidden">
              {emp.photo_url || emp.avatar_url
                ? <img src={emp.photo_url || emp.avatar_url || ""} alt="" className="h-full w-full object-cover" />
                : initials(emp)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-medium tracking-tight truncate">{fullName(emp)}</p>
              <p className="text-[11.5px] text-muted-foreground truncate">
                {emp.job_title}{emp.state && ` · ${emp.state}`}{emp.clinic && ` · ${emp.clinic}`}
              </p>
            </div>
            <Link to={`/payroll/profiles?employee=${emp.id}`}
              className="text-[11.5px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              Profile <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        ) : <p className="text-[12px] text-muted-foreground">Employee not found.</p>}
      </Section>

      {/* PTO details */}
      <Section title="PTO details">
        <div className="grid grid-cols-2 gap-2">
          <Detail label="Type" value={TYPE_LABEL[pto.pto_type]} />
          <Detail label="Hours" value={`${Number(pto.hours)}`} />
          <Detail label="Start" value={fmtDate(pto.start_date)} />
          <Detail label="End" value={fmtDate(pto.end_date)} />
          <Detail label="Submitted" value={pto.submitted_at ? relTime(pto.submitted_at) : "—"} />
          <Detail label="Reviewed" value={pto.reviewed_at ? relTime(pto.reviewed_at) : "—"} />
        </div>
        {pto.reason && (
          <div className="mt-3 rounded-xl border border-border/60 bg-muted/30 p-2.5">
            <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground mb-1">Reason</p>
            <p className="text-[12.5px]">{pto.reason}</p>
          </div>
        )}
      </Section>

      {/* Resolution checklist */}
      <Section title="Resolution checklist">
        <div className="space-y-1.5">
          {checklist.map(c => (
            <div key={c.label} className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-2">
              <CheckCircle2 className={cn("h-3.5 w-3.5", c.done ? "text-emerald-600" : "text-muted-foreground/40")} />
              <span className="text-[12.5px] tracking-tight">{c.label}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Notes & comms */}
      <Section title="Notes & communication">
        <div className="rounded-2xl border border-border/60 bg-muted/30 p-3 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[11.5px] uppercase tracking-wider text-muted-foreground">Log PTO note</span>
          </div>
          <textarea value={note} onChange={e => setNote(e.target.value)}
            placeholder="Who was contacted, what was discussed, what was decided, next step…"
            rows={3}
            className="w-full rounded-xl bg-background border border-border/60 px-3 py-2 text-[13px] placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none" />
          <div className="flex items-center justify-between gap-2 mt-2">
            <Select small value={noteCat} onChange={setNoteCat} options={[
              ["pto", "PTO"], ["follow_up", "Follow-up"], ["reminder", "Reminder"],
              ["attendance", "Attendance"], ["adjustment", "Adjustment"],
              ["escalation", "Escalation"], ["call_log", "Call log"],
            ]} />
            <button onClick={addNote} disabled={!note.trim() || !emp}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-90 disabled:opacity-40 transition">
              <Send className="h-3 w-3" /> Save note
            </button>
          </div>
        </div>

        {comms.length === 0 ? (
          <p className="text-[12px] text-muted-foreground">No payroll communication logged for this employee yet.</p>
        ) : (
          <ul className="space-y-2">
            {comms.map(c => (
              <li key={c.id} className="rounded-xl border border-border/60 bg-card p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Pill tone="muted">{c.channel}</Pill>
                    <span className="text-[11.5px] text-muted-foreground capitalize truncate">{c.category.replace(/_/g, " ")}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{relTime(c.created_at)}</span>
                </div>
                {c.body && <p className="text-[12px] text-muted-foreground mt-1 whitespace-pre-wrap">{c.body}</p>}
                {c.created_by_name && <p className="text-[11px] text-muted-foreground/80 mt-1">— {c.created_by_name}</p>}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Footer actions */}
      <div className="px-6 py-4 border-t border-border/70 flex flex-wrap items-center justify-end gap-2 sticky bottom-0 bg-card/95 backdrop-blur">
        {OPEN_STATUSES.includes(pto.status) && (
          <>
            <button onClick={() => updateStatus("denied")} disabled={busy}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[12.5px] border border-border/70 bg-card hover:bg-muted transition">
              Deny
            </button>
            <button onClick={() => updateStatus("approved")} disabled={busy}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[12.5px] bg-primary text-primary-foreground hover:opacity-90 transition">
              Mark payroll reviewed
            </button>
          </>
        )}
        {!OPEN_STATUSES.includes(pto.status) && (
          <>
            <Link to={`/payroll/adjustments?employee=${emp?.id}`}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[12.5px] border border-border/70 bg-card hover:bg-muted transition">
              <Plus className="h-3.5 w-3.5" /> Create adjustment
            </Link>
            <button onClick={onClose}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[12.5px] bg-primary text-primary-foreground hover:opacity-90 transition">
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------- Small atoms ---------------- */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-6 py-4 border-b border-border/70">
      <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground mb-3">{title}</p>
      {children}
    </div>
  );
}
function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2">
      <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-[12.5px] font-medium tracking-tight mt-0.5">{value}</p>
    </div>
  );
}
function MiniStat({ label, value, tone }: { label: string; value: number; tone: Tone }) {
  const cls =
    tone === "ok" ? "text-emerald-700 dark:text-emerald-400"
    : tone === "warn" ? "text-amber-700 dark:text-amber-400"
    : tone === "crit" ? "text-destructive"
    : tone === "info" ? "text-blue-700 dark:text-blue-400"
    : "text-foreground";
  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5 text-center">
      <p className={cn("text-lg font-semibold tracking-tight", cls)}>{value}</p>
      <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
function SumTile({
  icon: Icon, label, value, hint, tone, active, onClick,
}: {
  icon: any; label: string; value: number; hint?: string; tone: Tone;
  active?: boolean; onClick: () => void;
}) {
  const accent =
    tone === "ok" ? "text-emerald-700 dark:text-emerald-400"
    : tone === "warn" ? "text-amber-700 dark:text-amber-400"
    : tone === "crit" ? "text-destructive"
    : tone === "info" ? "text-blue-700 dark:text-blue-400"
    : "text-foreground";
  return (
    <button onClick={onClick}
      className={cn(
        "text-left rounded-2xl border bg-card p-3 transition hover:-translate-y-0.5",
        "shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]",
        active ? "border-foreground/40" : "border-border/70",
      )}>
      <div className="flex items-center justify-between mb-1.5">
        <Icon className={cn("h-3.5 w-3.5", accent)} strokeWidth={1.75} />
        <span className={cn("text-lg font-semibold tracking-tight", accent)}>{value}</span>
      </div>
      <p className="text-[12px] font-medium tracking-tight">{label}</p>
      {hint && <p className="text-[10.5px] text-muted-foreground mt-0.5">{hint}</p>}
    </button>
  );
}
function Select({ value, onChange, options, small }: {
  value: string; onChange: (v: string) => void; options: [string, string][]; small?: boolean;
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className={cn(
        "rounded-xl bg-muted/50 border border-border/60 text-[12.5px] focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition",
        small ? "h-8 px-2" : "h-9 px-3"
      )}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}
function RailLink({ icon: Icon, to, children }: { icon: any; to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-[12.5px] text-foreground hover:bg-muted transition">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
      <span className="flex-1">{children}</span>
      <ChevronRight className="h-3 w-3 text-muted-foreground" />
    </Link>
  );
}