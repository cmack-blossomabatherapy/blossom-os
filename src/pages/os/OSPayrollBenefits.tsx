import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Briefcase, Search, X, ChevronRight, Sparkles, MapPin, Calendar,
  Inbox, Clock, AlertTriangle, Plus, MessageSquare, Send, CheckCircle2,
  ArrowUpRight, Wallet, Flame, FileText, Users2, ShieldCheck, FileWarning,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { Card, HeaderBtn, PageHeader, Pill, Empty, fullName, fmtDate, fmtMoney, type Tone } from "./_PayrollAtoms";
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
  hire_date: string | null;
}
interface Deduction {
  id: string; employee_id: string; deduction_type: string;
  amount: number | string; frequency: string;
  start_date: string | null; end_date: string | null;
  status: string; notes: string | null;
  created_at: string; updated_at: string;
}
interface Benefit {
  id: string; employee_id: string; benefit_type: string;
  provider: string | null; plan_name: string | null;
  status: string; effective_date: string | null; end_date: string | null;
  employee_contribution: number | string | null;
  employer_contribution: number | string | null;
  notes: string | null;
  created_at: string; updated_at: string;
}
interface Comm {
  id: string; employee_id: string | null; channel: string;
  direction: string; category: string; subject: string | null;
  body: string | null; status: string; created_by_name: string | null;
  created_at: string;
}

type ItemKind = "deduction" | "benefit";
interface QueueItem {
  kind: ItemKind;
  id: string;
  employee_id: string;
  title: string;
  subtitle: string;
  status: string;
  effective_date: string | null;
  updated_at: string;
  amount?: string;
  notes: string | null;
  raw: Deduction | Benefit;
}

const DED_STATUS_LABEL: Record<string, string> = {
  active: "Active", paused: "Paused", completed: "Completed", cancelled: "Cancelled",
};
const DED_STATUS_TONE: Record<string, Tone> = {
  active: "ok", paused: "warn", completed: "muted", cancelled: "muted",
};
const BEN_STATUS_LABEL: Record<string, string> = {
  pending: "Pending", active: "Active", inactive: "Inactive", terminated: "Terminated",
};
const BEN_STATUS_TONE: Record<string, Tone> = {
  pending: "warn", active: "ok", inactive: "muted", terminated: "muted",
};
const FREQ_LABEL: Record<string, string> = {
  per_paycheck: "Per paycheck", monthly: "Monthly", one_time: "One-time",
};

function relTime(iso: string) {
  const d = new Date(iso); const ms = Date.now() - d.getTime();
  const m = Math.floor(ms / 60000); if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24); return days < 30 ? `${days}d ago` : fmtDate(iso);
}
function isInCurrentCycle(start?: string | null) {
  if (!start) return false;
  const s = new Date(start).getTime();
  const cycleStart = Date.now() - 14 * 86400000;
  const cycleEnd = Date.now() + 14 * 86400000;
  return s >= cycleStart && s <= cycleEnd;
}
function initials(e: Emp) {
  return `${(e.preferred_name || e.first_name || "?")[0] || "?"}${(e.last_name || "")[0] || ""}`.toUpperCase();
}

/* ---------------- Page ---------------- */
export default function OSPayrollBenefits() {
  const [emps, setEmps] = useState<Emp[]>([]);
  const [deds, setDeds] = useState<Deduction[]>([]);
  const [bens, setBens] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [stateF, setStateF] = useState("all");
  const [kindF, setKindF] = useState<"all" | ItemKind>("all");
  const [statusF, setStatusF] = useState("all");
  const [impactF, setImpactF] = useState("all");
  const [view, setView] = useState("all");

  const [selected, setSelected] = useState<QueueItem | null>(null);

  async function loadAll() {
    setLoading(true);
    const [eRes, dRes, bRes] = await Promise.all([
      supabase.from("employees")
        .select("id,user_id,first_name,last_name,preferred_name,job_title,state,clinic,avatar_url,photo_url,hire_date")
        .neq("status", "terminated").limit(500),
      supabase.from("payroll_deductions").select("*").order("updated_at", { ascending: false }).limit(500),
      supabase.from("payroll_benefits").select("*").order("updated_at", { ascending: false }).limit(500),
    ]);
    setEmps((eRes.data ?? []) as Emp[]);
    setDeds((dRes.data ?? []) as Deduction[]);
    setBens((bRes.data ?? []) as Benefit[]);
    setLoading(false);
  }
  useEffect(() => { loadAll(); }, []);

  const empById = useMemo(() => {
    const m = new Map<string, Emp>();
    for (const e of emps) m.set(e.id, e);
    return m;
  }, [emps]);

  function empFor(id: string) { return empById.get(id); }

  /* ---------- Normalize into queue items ---------- */
  const items: QueueItem[] = useMemo(() => {
    const list: QueueItem[] = [];
    for (const d of deds) {
      list.push({
        kind: "deduction",
        id: d.id,
        employee_id: d.employee_id,
        title: d.deduction_type,
        subtitle: `${fmtMoney(d.amount)} · ${FREQ_LABEL[d.frequency] ?? d.frequency}`,
        status: d.status,
        effective_date: d.start_date,
        updated_at: d.updated_at,
        amount: String(d.amount),
        notes: d.notes,
        raw: d,
      });
    }
    for (const b of bens) {
      list.push({
        kind: "benefit",
        id: b.id,
        employee_id: b.employee_id,
        title: `${b.benefit_type}${b.plan_name ? ` · ${b.plan_name}` : ""}`,
        subtitle: `${b.provider ?? "—"} · ee ${fmtMoney(b.employee_contribution)} / er ${fmtMoney(b.employer_contribution)}`,
        status: b.status,
        effective_date: b.effective_date,
        updated_at: b.updated_at,
        notes: b.notes,
        raw: b,
      });
    }
    return list.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  }, [deds, bens]);

  /* ---------- Impact classification ---------- */
  function impactOf(it: QueueItem): "ready" | "review" | "risk" | "blocked" {
    const text = (it.notes || "").toLowerCase();
    const inCycle = isInCurrentCycle(it.effective_date);
    const missingDocs = /awaiting|pending|missing|signed|authorization|paperwork/.test(text);
    if (it.kind === "benefit" && it.status === "pending" && missingDocs) return "blocked";
    if (it.kind === "deduction" && it.status === "paused") return "risk";
    if (it.kind === "benefit" && it.status === "pending") return "risk";
    if (inCycle && /change|new|election|adjust|effective/.test(text)) return "review";
    if (it.status === "active") return "ready";
    return "review";
  }

  /* ---------- Counts ---------- */
  const counts = useMemo(() => {
    let pendingChanges = 0, benefitsFollowUp = 0, payrollImpact = 0,
        missingDocs = 0, escalations = 0, ready = 0;
    for (const it of items) {
      const i = impactOf(it);
      const text = (it.notes || "").toLowerCase();
      if (it.kind === "deduction" && (it.status === "paused" || /change|new|election|amount change|effective next cycle/.test(text))) pendingChanges++;
      if (it.kind === "benefit" && it.status === "pending") benefitsFollowUp++;
      if (i === "review" || i === "risk") payrollImpact++;
      if (/awaiting|pending|missing|signed|authorization|paperwork/.test(text)) missingDocs++;
      if (i === "blocked") escalations++;
      if (i === "ready") ready++;
    }
    return { pendingChanges, benefitsFollowUp, payrollImpact, missingDocs, escalations, ready };
  }, [items]);

  /* ---------- Filters ---------- */
  const states = useMemo(() => Array.from(new Set(emps.map(e => e.state).filter(Boolean))).sort(), [emps]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return items.filter(it => {
      const e = empFor(it.employee_id); if (!e) return false;
      if (stateF !== "all" && e.state !== stateF) return false;
      if (kindF !== "all" && it.kind !== kindF) return false;
      if (statusF !== "all" && it.status !== statusF) return false;
      const i = impactOf(it);
      if (impactF !== "all" && i !== impactF) return false;

      if (view === "deductions" && it.kind !== "deduction") return false;
      if (view === "benefits" && it.kind !== "benefit") return false;
      if (view === "impact" && !(i === "review" || i === "risk")) return false;
      if (view === "missing" && !/awaiting|pending|missing|signed|authorization|paperwork/.test((it.notes || "").toLowerCase())) return false;
      if (view === "escalated" && i !== "blocked") return false;
      if (view === "ready" && i !== "ready") return false;

      if (qq) {
        const hay = [e.first_name, e.last_name, e.preferred_name, e.job_title, e.state, it.title, it.subtitle, it.notes]
          .filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(qq)) return false;
      }
      return true;
    });
  }, [items, empById, q, stateF, kindF, statusF, impactF, view]);

  /* ---------- Onboarding status per employee ---------- */
  const onboarding = useMemo(() => {
    const rows: { emp: Emp; medical: boolean; dental: boolean; retirement: boolean; pending: number; status: "complete" | "review" | "missing" | "awaiting" }[] = [];
    const recent = emps
      .filter(e => e.hire_date && new Date(e.hire_date).getTime() > Date.now() - 1000 * 60 * 60 * 24 * 365)
      .sort((a, b) => (b.hire_date || "").localeCompare(a.hire_date || ""))
      .slice(0, 8);
    const sample = recent.length > 0 ? recent : emps.slice(0, 8);
    for (const e of sample) {
      const empBens = bens.filter(b => b.employee_id === e.id);
      const medical = empBens.some(b => b.benefit_type === "Medical" && b.status === "active");
      const dental = empBens.some(b => b.benefit_type === "Dental" && b.status === "active");
      const retirement = empBens.some(b => b.benefit_type === "401(k)" && b.status === "active");
      const pending = empBens.filter(b => b.status === "pending").length;
      const total = [medical, dental, retirement].filter(Boolean).length;
      const status: "complete" | "review" | "missing" | "awaiting" =
        pending > 0 ? "awaiting"
        : total === 3 ? "complete"
        : total >= 1 ? "review"
        : "missing";
      rows.push({ emp: e, medical, dental, retirement, pending, status });
    }
    return rows;
  }, [emps, bens]);

  const payrollImpactItems = useMemo(
    () => items.filter(it => ["review", "risk", "blocked"].includes(impactOf(it))).slice(0, 6),
    [items],
  );
  const escalationItems = useMemo(
    () => items.filter(it => impactOf(it) === "blocked").slice(0, 6),
    [items],
  );

  /* ---------- Cycle readiness ---------- */
  const cycleReadiness = useMemo(() => {
    if (counts.escalations > 0) return "blocked";
    if (counts.benefitsFollowUp + counts.missingDocs > 4) return "risk";
    if (counts.pendingChanges > 0 || counts.payrollImpact > 0) return "review";
    return "ready";
  }, [counts]);

  const statusOptions: [string, string][] = useMemo(() => {
    if (kindF === "deduction") return [["all", "All statuses"], ...Object.entries(DED_STATUS_LABEL).map(([v, l]) => [v, l] as [string, string])];
    if (kindF === "benefit") return [["all", "All statuses"], ...Object.entries(BEN_STATUS_LABEL).map(([v, l]) => [v, l] as [string, string])];
    return [["all", "All statuses"], ["active", "Active"], ["pending", "Pending"], ["paused", "Paused"], ["inactive", "Inactive"], ["completed", "Completed"], ["cancelled", "Cancelled"], ["terminated", "Terminated"]];
  }, [kindF]);

  return (
    <OSShell>
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-8">
        <PageHeader
          icon={Briefcase}
          title="Benefits & Deductions"
          subtitle="Track payroll-facing benefits activity, deduction changes, and employee follow-up in one calm operational workspace."
        >
          <HeaderBtn icon={Users2} to="/payroll/profiles">Employee profiles</HeaderBtn>
          <HeaderBtn icon={Inbox} to="/payroll/queue">Payroll Queue</HeaderBtn>
        </PageHeader>

        {/* Summary tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
          <SumTile icon={Wallet} label="Deduction changes" value={counts.pendingChanges} tone="warn"
            hint="Pending payroll review" active={view === "deductions"} onClick={() => setView(view === "deductions" ? "all" : "deductions")} />
          <SumTile icon={ShieldCheck} label="Benefits follow-up" value={counts.benefitsFollowUp} tone="info"
            hint="Pending enrollment" active={view === "benefits"} onClick={() => setView(view === "benefits" ? "all" : "benefits")} />
          <SumTile icon={Flame} label="Payroll impact" value={counts.payrollImpact} tone="warn"
            hint="Affects current run" active={view === "impact"} onClick={() => setView(view === "impact" ? "all" : "impact")} />
          <SumTile icon={FileWarning} label="Missing documentation" value={counts.missingDocs} tone="warn"
            hint="Awaiting forms" active={view === "missing"} onClick={() => setView(view === "missing" ? "all" : "missing")} />
          <SumTile icon={AlertTriangle} label="Escalated issues" value={counts.escalations} tone="crit"
            hint="Blocked items" active={view === "escalated"} onClick={() => setView(view === "escalated" ? "all" : "escalated")} />
          <SumTile icon={CheckCircle2} label="Employees ready" value={counts.ready} tone="ok"
            hint="No payroll risk" active={view === "ready"} onClick={() => setView(view === "ready" ? "all" : "ready")} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div>
            {/* Cycle readiness */}
            <Card className="p-5 mb-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">Payroll cycle impact</p>
                  <h2 className="text-base font-semibold tracking-tight mt-0.5">Benefits & deductions readiness</h2>
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
                <MiniStat label="Active deductions" value={deds.filter(d => d.status === "active").length} tone="info" />
                <MiniStat label="Pending benefits" value={bens.filter(b => b.status === "pending").length} tone="warn" />
                <MiniStat label="Payroll impact" value={counts.payrollImpact} tone="warn" />
                <MiniStat label="Escalations" value={counts.escalations} tone="crit" />
              </div>
            </Card>

            {/* Filters */}
            <Card className="p-3 mb-5">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input value={q} onChange={e => setQ(e.target.value)}
                    placeholder="Search employee, deduction, plan…"
                    className="w-full h-9 pl-9 pr-8 rounded-xl bg-muted/50 border border-border/60 text-[13px] placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition" />
                  {q && <button onClick={() => setQ("")} className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 grid place-items-center rounded-lg hover:bg-muted">
                    <X className="h-3 w-3 text-muted-foreground" />
                  </button>}
                </div>
                <Select value={stateF} onChange={setStateF} options={[["all", "All states"], ...states.map(s => [s, s] as [string, string])]} />
                <Select value={kindF} onChange={(v) => { setKindF(v as any); setStatusF("all"); }} options={[
                  ["all", "All items"], ["deduction", "Deductions"], ["benefit", "Benefits"],
                ]} />
                <Select value={statusF} onChange={setStatusF} options={statusOptions} />
                <Select value={impactF} onChange={setImpactF} options={[
                  ["all", "All impact"],
                  ["ready", "Ready"],
                  ["review", "Needs review"],
                  ["risk", "At risk"],
                  ["blocked", "Blocked"],
                ]} />
              </div>
            </Card>

            {/* Employee Benefits Queue */}
            <Card className="overflow-hidden">
              <div className="px-4 py-3 border-b border-border/70 flex items-center justify-between">
                <h2 className="text-[13px] font-medium tracking-tight">Employee benefits queue</h2>
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
                <Empty icon={Briefcase} title="No benefits or deductions match" hint="Try clearing a filter or switching view." />
              ) : (
                <ul className="divide-y divide-border/60">
                  {filtered.map(it => {
                    const e = empFor(it.employee_id)!;
                    const i = impactOf(it);
                    const tone = it.kind === "deduction" ? DED_STATUS_TONE[it.status] : BEN_STATUS_TONE[it.status];
                    const label = it.kind === "deduction" ? DED_STATUS_LABEL[it.status] : BEN_STATUS_LABEL[it.status];
                    return (
                      <li key={`${it.kind}-${it.id}`}>
                        <button onClick={() => setSelected(it)} className="w-full text-left px-4 py-3.5 hover:bg-muted/40 transition flex items-center gap-3">
                          <div className="h-9 w-9 shrink-0 rounded-xl bg-muted grid place-items-center text-[11.5px] font-medium overflow-hidden">
                            {e.photo_url || e.avatar_url
                              ? <img src={e.photo_url || e.avatar_url || ""} alt="" className="h-full w-full object-cover" />
                              : initials(e)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="text-[14px] font-medium tracking-tight truncate">{fullName(e)}</span>
                              <Pill tone={tone ?? "muted"}>{label ?? it.status}</Pill>
                              <Pill tone="muted">{it.kind === "deduction" ? "Deduction" : "Benefit"}</Pill>
                              {i === "blocked" && <Pill tone="crit">Blocked</Pill>}
                              {i === "risk" && <Pill tone="warn">At risk</Pill>}
                              {i === "review" && <Pill tone="info">Needs review</Pill>}
                              {isInCurrentCycle(it.effective_date) && <Pill tone="warn">Current cycle</Pill>}
                            </div>
                            <p className="text-[12.5px] tracking-tight truncate">{it.title}</p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground mt-0.5">
                              <span>{it.subtitle}</span>
                              {it.effective_date && <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{fmtDate(it.effective_date)}</span>}
                              {e.state && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{e.state}</span>}
                              <span>· updated {relTime(it.updated_at)}</span>
                            </div>
                            {it.notes && <p className="text-[11.5px] text-muted-foreground truncate mt-1">{it.notes}</p>}
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            {/* Lower row: onboarding + payroll impact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                    <h3 className="text-[13px] font-medium tracking-tight">Benefits onboarding status</h3>
                  </div>
                  <span className="text-[11px] text-muted-foreground">Recent hires</span>
                </div>
                {onboarding.length === 0 ? (
                  <p className="text-[12px] text-muted-foreground">No onboarding items.</p>
                ) : (
                  <ul className="space-y-2">
                    {onboarding.map(r => (
                      <li key={r.emp.id}>
                        <Link to={`/payroll/profiles?employee=${r.emp.id}`}
                          className="block rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/60 p-2.5 transition">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[12.5px] font-medium tracking-tight truncate">{fullName(r.emp)}</p>
                            <Pill tone={
                              r.status === "complete" ? "ok"
                              : r.status === "review" ? "info"
                              : r.status === "awaiting" ? "warn" : "crit"
                            }>
                              {r.status === "complete" ? "Complete"
                                : r.status === "review" ? "Needs review"
                                : r.status === "awaiting" ? "Awaiting employee" : "Missing info"}
                            </Pill>
                          </div>
                          <p className="text-[11.5px] text-muted-foreground mt-0.5">
                            {[r.medical && "Medical", r.dental && "Dental", r.retirement && "401(k)"].filter(Boolean).join(" · ") || "No active elections"}
                            {r.pending > 0 && ` · ${r.pending} pending`}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                    <h3 className="text-[13px] font-medium tracking-tight">Payroll impact review</h3>
                  </div>
                  <Link to="/payroll/adjustments" className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                    Open <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
                {payrollImpactItems.length === 0 ? (
                  <p className="text-[12px] text-muted-foreground">No items currently affect payroll.</p>
                ) : (
                  <ul className="space-y-2">
                    {payrollImpactItems.map(it => {
                      const e = empFor(it.employee_id)!;
                      const i = impactOf(it);
                      return (
                        <li key={`pi-${it.kind}-${it.id}`}>
                          <button onClick={() => setSelected(it)} className="w-full text-left rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/60 p-2.5 transition">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[12.5px] font-medium tracking-tight truncate">{fullName(e)}</p>
                              <Pill tone={i === "blocked" ? "crit" : i === "risk" ? "warn" : "info"}>
                                {i === "blocked" ? "Blocked" : i === "risk" ? "At risk" : "Review"}
                              </Pill>
                            </div>
                            <p className="text-[11.5px] text-muted-foreground mt-0.5 truncate">
                              {it.title} · {it.subtitle}
                            </p>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            </div>

            {/* Escalations */}
            <Card className="p-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                  <h3 className="text-[13px] font-medium tracking-tight">Escalations & risks</h3>
                </div>
                <Link to="/payroll/queue" className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                  Open queue <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
              {escalationItems.length === 0 ? (
                <p className="text-[12px] text-muted-foreground">No escalated benefits or deduction issues.</p>
              ) : (
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {escalationItems.map(it => {
                    const e = empFor(it.employee_id)!;
                    return (
                      <li key={`es-${it.kind}-${it.id}`}>
                        <button onClick={() => setSelected(it)} className="w-full text-left rounded-xl border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 p-2.5 transition">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[12.5px] font-medium tracking-tight truncate">{fullName(e)}</p>
                            <Pill tone="crit">Escalated</Pill>
                          </div>
                          <p className="text-[11.5px] text-muted-foreground mt-0.5 truncate">
                            {it.title} · {it.notes ?? "Missing documentation"}
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
                <RailLink icon={FileText} to="/payroll/queue">Request documentation</RailLink>
                <RailLink icon={Users2} to="/payroll/profiles">Open employee profile</RailLink>
                <RailLink icon={MessageSquare} to="/payroll/messages">Send benefits reminder</RailLink>
                <RailLink icon={Flame} to="/payroll/issues">Escalate concern</RailLink>
                <RailLink icon={Inbox} to="/payroll/queue">Open payroll queue</RailLink>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <h3 className="text-[13px] font-medium tracking-tight">Operational Insights</h3>
              </div>
              <div className="space-y-1.5">
                {[
                  "What deduction changes affect this payroll cycle?",
                  "Which employees need benefits follow-up?",
                  "What benefits onboarding is incomplete?",
                  "Which deduction issues are unresolved?",
                  "What payroll risks exist related to deductions?",
                  "Summarize payroll-facing benefits issues.",
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
            <ItemDrawer
              item={selected}
              emp={empFor(selected.employee_id)}
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
function ItemDrawer({
  item, emp, impact, onClose, onChanged,
}: {
  item: QueueItem; emp: Emp | undefined;
  impact: "ready" | "review" | "risk" | "blocked";
  onClose: () => void; onChanged: () => void;
}) {
  const [comms, setComms] = useState<Comm[]>([]);
  const [note, setNote] = useState("");
  const [noteCat, setNoteCat] = useState("deduction_change");
  const [busy, setBusy] = useState(false);

  async function loadComms() {
    if (!emp) return;
    const { data } = await supabase.from("payroll_communications")
      .select("*").eq("employee_id", emp.id).order("created_at", { ascending: false }).limit(50);
    setComms((data ?? []) as Comm[]);
  }
  useEffect(() => { loadComms(); }, [item.id, emp?.id]);

  async function addNote() {
    if (!emp || !note.trim()) return;
    const { error } = await supabase.from("payroll_communications").insert({
      employee_id: emp.id, channel: "note" as any, direction: "internal" as any,
      category: noteCat,
      subject: `${item.kind === "deduction" ? "Deduction" : "Benefit"}: ${item.title}`,
      body: note.trim(), status: "logged",
      created_by_name: "Payroll Coordinator",
    } as any);
    if (error) { toast.error("Could not save note"); return; }
    setNote("");
    toast.success("Benefits note recorded");
    loadComms();
  }

  async function markReviewed() {
    setBusy(true);
    const table = item.kind === "deduction" ? "payroll_deductions" : "payroll_benefits";
    const next = item.kind === "deduction" ? "active" : "active";
    const { error } = await supabase.from(table).update({ status: next } as any).eq("id", item.id);
    setBusy(false);
    if (error) { toast.error("Update failed"); return; }
    toast.success("Marked payroll reviewed");
    onChanged();
    onClose();
  }

  const text = (item.notes || "").toLowerCase();
  const docsReceived = !/awaiting|pending|missing|signed|authorization|paperwork/.test(text);
  const checklist = [
    { label: "Documentation received", done: docsReceived },
    { label: "Payroll reviewed", done: item.status === "active" },
    { label: "Deduction / benefit updated", done: item.status === "active" || item.status === "completed" },
    { label: "Employee confirmed", done: comms.length > 0 },
    { label: "Payroll cycle updated", done: item.status === "active" && !isInCurrentCycle(item.effective_date) },
    { label: "Issue resolved", done: impact === "ready" },
  ];

  const tone = item.kind === "deduction" ? DED_STATUS_TONE[item.status] : BEN_STATUS_TONE[item.status];
  const statusLabel = item.kind === "deduction" ? DED_STATUS_LABEL[item.status] : BEN_STATUS_LABEL[item.status];

  return (
    <div>
      <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/70">
        <div className="flex items-center gap-2 mb-3">
          <Pill tone={tone ?? "muted"}>{statusLabel ?? item.status}</Pill>
          <Pill tone="muted">{item.kind === "deduction" ? "Deduction" : "Benefit"}</Pill>
          {impact === "blocked" && <Pill tone="crit">Blocked</Pill>}
          {impact === "risk" && <Pill tone="warn">At risk</Pill>}
          {impact === "review" && <Pill tone="info">Needs review</Pill>}
          {isInCurrentCycle(item.effective_date) && <Pill tone="warn">Current cycle</Pill>}
        </div>
        <SheetTitle className="text-lg font-semibold tracking-tight">{item.title}</SheetTitle>
        <p className="text-[12.5px] text-muted-foreground mt-1">{item.subtitle}</p>
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

      {/* Overview */}
      <Section title={item.kind === "deduction" ? "Deduction overview" : "Benefit overview"}>
        <div className="grid grid-cols-2 gap-2">
          {item.kind === "deduction" ? (
            <>
              <Detail label="Type" value={(item.raw as Deduction).deduction_type} />
              <Detail label="Amount" value={fmtMoney((item.raw as Deduction).amount)} />
              <Detail label="Frequency" value={FREQ_LABEL[(item.raw as Deduction).frequency] ?? (item.raw as Deduction).frequency} />
              <Detail label="Start" value={fmtDate((item.raw as Deduction).start_date ?? undefined)} />
              <Detail label="End" value={fmtDate((item.raw as Deduction).end_date ?? undefined)} />
              <Detail label="Updated" value={relTime(item.updated_at)} />
            </>
          ) : (
            <>
              <Detail label="Type" value={(item.raw as Benefit).benefit_type} />
              <Detail label="Provider" value={(item.raw as Benefit).provider ?? "—"} />
              <Detail label="Plan" value={(item.raw as Benefit).plan_name ?? "—"} />
              <Detail label="Effective" value={fmtDate((item.raw as Benefit).effective_date ?? undefined)} />
              <Detail label="EE contribution" value={fmtMoney((item.raw as Benefit).employee_contribution)} />
              <Detail label="ER contribution" value={fmtMoney((item.raw as Benefit).employer_contribution)} />
            </>
          )}
        </div>
        {item.notes && (
          <div className="mt-3 rounded-xl border border-border/60 bg-muted/30 p-2.5">
            <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground mb-1">Notes</p>
            <p className="text-[12.5px]">{item.notes}</p>
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
            <span className="text-[11.5px] uppercase tracking-wider text-muted-foreground">Log benefits / deduction note</span>
          </div>
          <textarea value={note} onChange={e => setNote(e.target.value)}
            placeholder="Who was contacted, what was discussed, what documentation was requested, next step…"
            rows={3}
            className="w-full rounded-xl bg-background border border-border/60 px-3 py-2 text-[13px] placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none" />
          <div className="flex items-center justify-between gap-2 mt-2">
            <Select small value={noteCat} onChange={setNoteCat} options={[
              ["deduction_change", "Deduction change"],
              ["benefits_enrollment", "Benefits enrollment"],
              ["follow_up", "Follow-up"],
              ["documentation", "Documentation"],
              ["payroll_impact", "Payroll impact"],
              ["escalation", "Escalation"],
              ["call_log", "Call log"],
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
                {c.subject && <p className="text-[12px] font-medium tracking-tight mt-1">{c.subject}</p>}
                {c.body && <p className="text-[12px] text-muted-foreground mt-1 whitespace-pre-wrap">{c.body}</p>}
                {c.created_by_name && <p className="text-[11px] text-muted-foreground/80 mt-1">— {c.created_by_name}</p>}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Footer actions */}
      <div className="px-6 py-4 border-t border-border/70 flex flex-wrap items-center justify-end gap-2 sticky bottom-0 bg-card/95 backdrop-blur">
        <Link to={`/payroll/adjustments?employee=${emp?.id}`}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[12.5px] border border-border/70 bg-card hover:bg-muted transition">
          <Plus className="h-3.5 w-3.5" /> Create adjustment
        </Link>
        {item.status !== "active" && (
          <button onClick={markReviewed} disabled={busy}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[12.5px] bg-primary text-primary-foreground hover:opacity-90 transition">
            Mark payroll reviewed
          </button>
        )}
        {item.status === "active" && (
          <button onClick={onClose}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[12.5px] bg-primary text-primary-foreground hover:opacity-90 transition">
            Close
          </button>
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