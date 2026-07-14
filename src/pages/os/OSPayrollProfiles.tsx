import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users2, Search, X, ChevronRight, Sparkles, MapPin, Calendar,
  Inbox, Clock, AlertTriangle, Plus, MessageSquare, Send,
  CheckCircle2, ShieldCheck, Briefcase, Receipt, Flame, BellRing,
  FileText, ArrowUpRight, Wallet, HeartHandshake, Banknote,
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
  email: string | null; job_title: string;
  state: string; clinic: string | null;
  employment_type: string; pay_type: string; work_setting: string;
  status: string;
  start_date: string | null; hire_date: string | null;
  pay_rate: number | string | null;
  viventium_employee_id: string | null;
  viventium_sync_status: string | null;
  manager_id: string | null;
  avatar_url: string | null; photo_url: string | null;
}
interface Issue {
  id: string; employee_id: string; title: string; description: string | null;
  category: string; priority: string; status: string;
  owner_role: string | null; due_date: string | null;
  source: string | null; created_at: string; updated_at: string;
}
interface Adj {
  id: string; employee_id: string; adjustment_type: string;
  amount: number | string; hours: number | string; reason: string | null;
  status: string; created_at: string; updated_at: string;
}
interface AttExc {
  id: string; employee_id: string; kind: string; status: string;
  occurred_on: string; detail: string | null;
}
interface PtoReq {
  id: string; user_id: string; pto_type: string; status: string;
  start_date: string; end_date: string; hours: number | string;
  reason: string | null; submitted_at: string;
}
interface Ded {
  id: string; employee_id: string; deduction_type: string;
  amount: number | string; frequency: string; status: string;
  start_date: string | null; end_date: string | null;
}
interface Ben {
  id: string; employee_id: string; benefit_type: string;
  provider: string | null; plan_name: string | null; status: string;
  effective_date: string | null; end_date: string | null;
}
interface Comm {
  id: string; employee_id: string | null; channel: string;
  direction: string; category: string; subject: string | null;
  body: string | null; status: string; created_by_name: string | null;
  created_at: string;
}

const OPEN_ISSUE = (s: string) => !["resolved", "closed"].includes(s);
const OPEN_ADJ = (s: string) => !["applied", "rejected"].includes(s);
const OPEN_PTO = (s: string) => ["pending", "submitted"].includes(s);
const OPEN_EXC = (s: string) => !["resolved", "ignored", "cleared"].includes(s);

function relTime(iso: string) {
  const d = new Date(iso); const ms = Date.now() - d.getTime();
  const m = Math.floor(ms / 60000); if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24); return days < 30 ? `${days}d ago` : fmtDate(iso);
}
function initials(e: Emp) {
  return `${(e.preferred_name || e.first_name || "?")[0] || "?"}${(e.last_name || "")[0] || ""}`.toUpperCase();
}

type Readiness = "ready" | "review" | "risk" | "blocked";
const READINESS_LABEL: Record<Readiness, string> = {
  ready: "Payroll ready", review: "Needs review", risk: "At risk", blocked: "Blocked",
};
const READINESS_TONE: Record<Readiness, Tone> = {
  ready: "ok", review: "info", risk: "warn", blocked: "crit",
};

function computeReadiness(args: {
  openIssues: number; criticalIssues: number; openAdj: number;
  openExc: number; missingSetup: boolean;
}): Readiness {
  if (args.criticalIssues > 0 || args.missingSetup) return "blocked";
  if (args.openIssues + args.openExc + args.openAdj >= 4) return "risk";
  if (args.openIssues + args.openExc + args.openAdj > 0) return "review";
  return "ready";
}

/* ---------------- Page ---------------- */
export default function OSPayrollProfiles() {
  const [emps, setEmps] = useState<Emp[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [adjs, setAdjs] = useState<Adj[]>([]);
  const [excs, setExcs] = useState<AttExc[]>([]);
  const [pto, setPto] = useState<PtoReq[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [state, setState] = useState("all");
  const [role, setRole] = useState("all");
  const [filter, setFilter] = useState("all"); // readiness / quick filter

  const [selected, setSelected] = useState<Emp | null>(null);

  async function loadAll() {
    setLoading(true);
    const [eRes, iRes, aRes, xRes, pRes] = await Promise.all([
      supabase.from("employees")
        .select("id,user_id,first_name,last_name,preferred_name,email,job_title,state,clinic,employment_type,pay_type,work_setting,status,start_date,hire_date,pay_rate,viventium_employee_id,viventium_sync_status,manager_id,avatar_url,photo_url")
        .neq("status", "terminated")
        .order("first_name", { ascending: true }).limit(500),
      supabase.from("payroll_issues").select("*").limit(1000),
      supabase.from("payroll_adjustments").select("id,employee_id,adjustment_type,amount,hours,reason,status,created_at,updated_at").limit(1000),
      supabase.from("attendance_exceptions").select("id,employee_id,kind,status,occurred_on,detail").limit(1000),
      supabase.from("pto_requests").select("id,user_id,pto_type,status,start_date,end_date,hours,reason,submitted_at").limit(1000),
    ]);
    setEmps((eRes.data ?? []) as Emp[]);
    setIssues((iRes.data ?? []) as Issue[]);
    setAdjs((aRes.data ?? []) as Adj[]);
    setExcs((xRes.data ?? []) as AttExc[]);
    setPto((pRes.data ?? []) as PtoReq[]);
    setLoading(false);
  }
  useEffect(() => { loadAll(); }, []);

  /* ---------- Indexed aggregates per employee ---------- */
  const byEmp = useMemo(() => {
    const map = new Map<string, {
      openIssues: Issue[]; criticalIssues: Issue[];
      openAdj: Adj[]; openExc: AttExc[]; openPto: PtoReq[];
      readiness: Readiness; missingSetup: boolean;
      lastActivity: string | null;
    }>();
    for (const e of emps) {
      const ei = issues.filter(x => x.employee_id === e.id && OPEN_ISSUE(x.status));
      const ec = ei.filter(x => x.priority === "critical" || x.priority === "high");
      const ea = adjs.filter(x => x.employee_id === e.id && OPEN_ADJ(x.status));
      const ex = excs.filter(x => x.employee_id === e.id && OPEN_EXC(x.status));
      const ep = e.user_id ? pto.filter(p => p.user_id === e.user_id && OPEN_PTO(p.status)) : [];
      const missingSetup = !e.viventium_employee_id || e.viventium_sync_status === "error";
      const readiness = computeReadiness({
        openIssues: ei.length, criticalIssues: ec.length,
        openAdj: ea.length, openExc: ex.length, missingSetup,
      });
      const lastActivity =
        [...ei, ...ea].map(r => (r as any).updated_at as string | undefined)
          .filter(Boolean).sort().slice(-1)[0] || null;
      map.set(e.id, { openIssues: ei, criticalIssues: ec, openAdj: ea, openExc: ex, openPto: ep, readiness, missingSetup, lastActivity });
    }
    return map;
  }, [emps, issues, adjs, excs, pto]);

  /* ---------- Header counts ---------- */
  const counts = useMemo(() => {
    let withIssues = 0, missingSetup = 0, attRisk = 0, ptoImpact = 0, openAdj = 0, ready = 0;
    byEmp.forEach(v => {
      if (v.openIssues.length > 0) withIssues++;
      if (v.missingSetup) missingSetup++;
      if (v.openExc.length > 0) attRisk++;
      if (v.openPto.length > 0) ptoImpact++;
      if (v.openAdj.length > 0) openAdj++;
      if (v.readiness === "ready") ready++;
    });
    return { withIssues, missingSetup, attRisk, ptoImpact, openAdj, ready };
  }, [byEmp]);

  /* ---------- Filters ---------- */
  const states = useMemo(() => Array.from(new Set(emps.map(e => e.state).filter(Boolean))).sort(), [emps]);
  const roles = useMemo(() => {
    const set = new Set<string>();
    for (const e of emps) {
      const t = (e.job_title || "").toLowerCase();
      if (t.includes("rbt")) set.add("RBT");
      else if (t.includes("bcba")) set.add("BCBA");
      else if (t.includes("schedul")) set.add("Scheduling");
      else if (t.includes("qa") || t.includes("quality")) set.add("QA");
      else if (t.includes("intake")) set.add("Intake");
      else if (t.includes("payroll")) set.add("Payroll");
      else if (t.includes("hr")) set.add("HR");
      else if (t.includes("director") || t.includes("operations")) set.add("Operations");
      else set.add("Other");
    }
    return Array.from(set).sort();
  }, [emps]);

  function matchRole(e: Emp, r: string) {
    if (r === "all") return true;
    const t = (e.job_title || "").toLowerCase();
    const m: Record<string, (t: string) => boolean> = {
      RBT: t => t.includes("rbt"),
      BCBA: t => t.includes("bcba"),
      Scheduling: t => t.includes("schedul"),
      QA: t => t.includes("qa") || t.includes("quality"),
      Intake: t => t.includes("intake"),
      Payroll: t => t.includes("payroll"),
      HR: t => t.includes("hr"),
      Operations: t => t.includes("director") || t.includes("operations"),
      Other: t => !["rbt", "bcba", "schedul", "qa", "quality", "intake", "payroll", "hr", "director", "operations"].some(k => t.includes(k)),
    };
    return m[r] ? m[r](t) : true;
  }

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return emps.filter(e => {
      const v = byEmp.get(e.id);
      if (state !== "all" && e.state !== state) return false;
      if (!matchRole(e, role)) return false;
      if (filter === "issues" && (!v || v.openIssues.length === 0)) return false;
      if (filter === "missing_setup" && (!v || !v.missingSetup)) return false;
      if (filter === "attendance" && (!v || v.openExc.length === 0)) return false;
      if (filter === "pto" && (!v || v.openPto.length === 0)) return false;
      if (filter === "adjustments" && (!v || v.openAdj.length === 0)) return false;
      if (filter === "ready" && (!v || v.readiness !== "ready")) return false;
      if (qq) {
        const hay = [e.first_name, e.last_name, e.preferred_name, e.email, e.job_title, e.state, e.clinic]
          .filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(qq)) return false;
      }
      return true;
    });
  }, [emps, byEmp, q, state, role, filter]);

  return (
    <OSShell>
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10 py-10">
        <PageHeader
          icon={Users2}
          title="Employee Payroll Profiles"
          subtitle="Centralized payroll operations profiles for employees across Blossom."
        >
          <HeaderBtn icon={Inbox} to="/payroll/queue">Payroll Queue</HeaderBtn>
          <HeaderBtn icon={Plus} primary onClick={() => toast.info("Open an employee to log a payroll note.")}>Add payroll note</HeaderBtn>
        </PageHeader>

        {/* Quick chip row */}
        <div className="flex flex-wrap gap-2 mb-5">
          <Chip active={filter === "all"} onClick={() => setFilter("all")}>All employees · {emps.length}</Chip>
          <Chip active={filter === "issues"} onClick={() => setFilter("issues")} tone="warn">Payroll issues · {counts.withIssues}</Chip>
          <Chip active={filter === "missing_setup"} onClick={() => setFilter("missing_setup")} tone="crit">Missing setup · {counts.missingSetup}</Chip>
          <Chip active={filter === "attendance"} onClick={() => setFilter("attendance")} tone="warn">Attendance risk · {counts.attRisk}</Chip>
          <Chip active={filter === "pto"} onClick={() => setFilter("pto")} tone="info">PTO impact · {counts.ptoImpact}</Chip>
          <Chip active={filter === "adjustments"} onClick={() => setFilter("adjustments")} tone="info">Open adjustments · {counts.openAdj}</Chip>
          <Chip active={filter === "ready"} onClick={() => setFilter("ready")} tone="ok">Payroll ready · {counts.ready}</Chip>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Main */}
          <div>
            {/* Search & filters */}
            <Card className="p-3 mb-5">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={q} onChange={e => setQ(e.target.value)}
                    placeholder="Search by name, role, email, clinic…"
                    className="w-full h-9 pl-9 pr-8 rounded-xl bg-muted/50 border border-border/60 text-[13px] placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                  />
                  {q && (
                    <button onClick={() => setQ("")} className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 grid place-items-center rounded-lg hover:bg-muted">
                      <X className="h-3 w-3 text-muted-foreground" />
                    </button>
                  )}
                </div>
                <Select value={state} onChange={setState} options={[["all", "All states"], ...states.map(s => [s, s] as [string, string])]} />
                <Select value={role} onChange={setRole} options={[["all", "All roles"], ...roles.map(r => [r, r] as [string, string])]} />
              </div>
            </Card>

            {/* List */}
            <Card className="overflow-hidden">
              <div className="px-4 py-3 border-b border-border/70 flex items-center justify-between">
                <h2 className="text-[13px] font-medium tracking-tight">Employees</h2>
                <span className="text-[11px] text-muted-foreground">{filtered.length} shown</span>
              </div>
              {loading ? (
                <ul className="divide-y divide-border/60">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <li key={i} className="px-4 py-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-muted animate-pulse" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-40 bg-muted rounded animate-pulse" />
                        <div className="h-2.5 w-24 bg-muted rounded animate-pulse" />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : filtered.length === 0 ? (
                <Empty icon={Users2} title="No matching employees" hint="Try clearing filters or searching a different term." />
              ) : (
                <ul className="divide-y divide-border/60">
                  {filtered.map(e => {
                    const v = byEmp.get(e.id)!;
                    return (
                      <li key={e.id}>
                        <button onClick={() => setSelected(e)} className="w-full text-left px-4 py-3.5 hover:bg-muted/40 transition flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 rounded-xl bg-muted grid place-items-center text-[12px] font-medium overflow-hidden">
                            {e.photo_url || e.avatar_url
                              ? <img src={e.photo_url || e.avatar_url || ""} alt="" className="h-full w-full object-cover" />
                              : initials(e)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[14px] font-medium tracking-tight truncate">{fullName(e)}</span>
                              <Pill tone={READINESS_TONE[v.readiness]}>{READINESS_LABEL[v.readiness]}</Pill>
                              {v.missingSetup && <Pill tone="crit">Missing setup</Pill>}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground mt-1">
                              <span className="truncate">{e.job_title}</span>
                              {e.state && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{e.state}</span>}
                              {e.clinic && <span>· {e.clinic}</span>}
                              {v.lastActivity && <span>· last activity {relTime(v.lastActivity)}</span>}
                            </div>
                          </div>
                          <div className="hidden sm:flex items-center gap-1.5 mr-2">
                            {v.openIssues.length > 0 && <Pill tone="warn">{v.openIssues.length} issues</Pill>}
                            {v.openExc.length > 0 && <Pill tone="warn">{v.openExc.length} att.</Pill>}
                            {v.openPto.length > 0 && <Pill tone="info">{v.openPto.length} PTO</Pill>}
                            {v.openAdj.length > 0 && <Pill tone="info">{v.openAdj.length} adj.</Pill>}
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
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
                <RailLink icon={Clock} to="/payroll/time-attendance">Request missing time</RailLink>
                <RailLink icon={HeartHandshake} to="/payroll/pto">Review PTO impact</RailLink>
                <RailLink icon={Flame} to="/payroll/issues">Escalate concern</RailLink>
                <RailLink icon={BellRing} to="/payroll/messages">Send weekly reminder</RailLink>
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
                  "Which employees are not payroll-ready?",
                  "Show employees with missing Viventium setup",
                  "Who has overdue payroll follow-ups?",
                  "Summarize attendance risks by state",
                  "What PTO impacts the current payroll cycle?",
                  "Which employees have repeated payroll issues?",
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
        <SheetContent side="right" className="w-full sm:max-w-2xl p-0 overflow-y-auto">
          {selected && (
            <ProfileDrawer
              emp={selected}
              agg={byEmp.get(selected.id)!}
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
function ProfileDrawer({
  emp, agg, onClose, onChanged,
}: {
  emp: Emp;
  agg: ReturnType<Map<string, any>["get"]>;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [comms, setComms] = useState<Comm[]>([]);
  const [deds, setDeds] = useState<Ded[]>([]);
  const [bens, setBens] = useState<Ben[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [noteCat, setNoteCat] = useState("follow_up");

  async function load() {
    setLoading(true);
    const [c, d, b] = await Promise.all([
      supabase.from("payroll_communications").select("*").eq("employee_id", emp.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("payroll_deductions").select("*").eq("employee_id", emp.id).limit(50),
      supabase.from("payroll_benefits").select("*").eq("employee_id", emp.id).limit(50),
    ]);
    setComms((c.data ?? []) as Comm[]);
    setDeds((d.data ?? []) as Ded[]);
    setBens((b.data ?? []) as Ben[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, [emp.id]);

  async function addNote() {
    const text = note.trim(); if (!text) return;
    const { error } = await supabase.from("payroll_communications").insert({
      employee_id: emp.id, channel: "note" as any, direction: "internal" as any,
      category: noteCat, body: text, status: "logged",
      created_by_name: "Payroll Coordinator",
    } as any);
    if (error) { toast.error("Could not save note"); return; }
    setNote("");
    toast.success("Payroll note recorded");
    load();
  }

  const openIssues: Issue[] = agg?.openIssues ?? [];
  const openAdj: Adj[] = agg?.openAdj ?? [];
  const openExc: AttExc[] = agg?.openExc ?? [];
  const openPto: PtoReq[] = agg?.openPto ?? [];
  const readiness: Readiness = agg?.readiness ?? "review";
  const missingSetup = agg?.missingSetup;

  const checklist = [
    { label: "Viventium employee linked", done: !!emp.viventium_employee_id },
    { label: "Pay rate on file", done: !!emp.pay_rate && Number(emp.pay_rate) > 0 },
    { label: "Start date confirmed", done: !!emp.start_date },
    { label: "No critical payroll issues", done: openIssues.filter(i => i.priority === "critical").length === 0 },
    { label: "Attendance cleared", done: openExc.length === 0 },
    { label: "PTO reviewed", done: openPto.length === 0 },
  ];

  return (
    <div>
      <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/70">
        <div className="flex items-center gap-2 mb-3">
          <Pill tone={READINESS_TONE[readiness]}>{READINESS_LABEL[readiness]}</Pill>
          {missingSetup && <Pill tone="crit">Missing setup</Pill>}
          <Pill tone="muted">{emp.employment_type.replace(/_/g, " ")}</Pill>
          <Pill tone="muted">{emp.pay_type}</Pill>
        </div>
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-2xl bg-muted grid place-items-center text-[14px] font-medium overflow-hidden shrink-0">
            {emp.photo_url || emp.avatar_url
              ? <img src={emp.photo_url || emp.avatar_url || ""} alt="" className="h-full w-full object-cover" />
              : initials(emp)}
          </div>
          <div className="min-w-0 flex-1">
            <SheetTitle className="text-lg font-semibold tracking-tight">{fullName(emp)}</SheetTitle>
            <p className="text-[13px] text-muted-foreground mt-0.5">{emp.job_title}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground mt-1.5">
              {emp.state && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{emp.state}</span>}
              {emp.clinic && <span>· {emp.clinic}</span>}
              {emp.start_date && <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />Started {fmtDate(emp.start_date)}</span>}
              {emp.email && <span>· {emp.email}</span>}
            </div>
          </div>
        </div>
      </SheetHeader>

      {/* Readiness snapshot */}
      <Section title="Payroll readiness">
        <div className="grid grid-cols-2 gap-2">
          {checklist.map(c => (
            <div key={c.label} className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-2">
              <CheckCircle2 className={cn("h-3.5 w-3.5", c.done ? "text-emerald-600" : "text-muted-foreground/40")} />
              <span className="text-[12px] tracking-tight">{c.label}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2 mt-3">
          <Mini label="Issues" value={openIssues.length} tone={openIssues.length ? "warn" : "ok"} />
          <Mini label="Attendance" value={openExc.length} tone={openExc.length ? "warn" : "ok"} />
          <Mini label="PTO" value={openPto.length} tone={openPto.length ? "info" : "ok"} />
          <Mini label="Adjustments" value={openAdj.length} tone={openAdj.length ? "info" : "ok"} />
        </div>
      </Section>

      {/* Attendance & PTO */}
      <Section title="Attendance & PTO" right={
        <Link to="/payroll/time-attendance" className="text-[11.5px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          Open <ArrowUpRight className="h-3 w-3" />
        </Link>
      }>
        {openExc.length === 0 && openPto.length === 0 ? (
          <p className="text-[12px] text-muted-foreground">No open attendance or PTO items.</p>
        ) : (
          <ul className="space-y-2">
            {openExc.map(x => (
              <li key={x.id} className="rounded-xl border border-border/60 bg-muted/30 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[12.5px] font-medium tracking-tight">{(x.kind || "").replace(/_/g, " ")}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{fmtDate(x.occurred_on)}</span>
                </div>
                {x.detail && <p className="text-[11.5px] text-muted-foreground mt-1">{x.detail}</p>}
              </li>
            ))}
            {openPto.map(p => (
              <li key={p.id} className="rounded-xl border border-border/60 bg-muted/30 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <HeartHandshake className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[12.5px] font-medium tracking-tight">PTO · {p.pto_type?.replace(/_/g, " ")}</span>
                  </div>
                  <Pill tone="info">{p.status}</Pill>
                </div>
                <p className="text-[11.5px] text-muted-foreground mt-1">
                  {fmtDate(p.start_date)} → {fmtDate(p.end_date)} · {Number(p.hours)} hrs
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Adjustments */}
      <Section title="Payroll adjustments" right={
        <Link to="/payroll/adjustments" className="text-[11.5px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          Open <ArrowUpRight className="h-3 w-3" />
        </Link>
      }>
        {openAdj.length === 0 ? (
          <p className="text-[12px] text-muted-foreground">No open adjustments.</p>
        ) : (
          <ul className="space-y-2">
            {openAdj.map(a => (
              <li key={a.id} className="rounded-xl border border-border/60 bg-muted/30 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12.5px] font-medium tracking-tight capitalize">{a.adjustment_type.replace(/_/g, " ")}</span>
                  <span className="text-[12px] font-medium">{Number(a.amount) !== 0 ? fmtMoney(Number(a.amount)) : `${Number(a.hours)} hrs`}</span>
                </div>
                {a.reason && <p className="text-[11.5px] text-muted-foreground mt-1 truncate">{a.reason}</p>}
                <div className="mt-1"><Pill tone="info">{a.status}</Pill></div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Deductions & Benefits */}
      <Section title="Deductions & benefits">
        {loading ? (
          <p className="text-[12px] text-muted-foreground">Loading…</p>
        ) : (deds.length === 0 && bens.length === 0) ? (
          <p className="text-[12px] text-muted-foreground">No deductions or benefits on file.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {deds.map(d => (
              <div key={d.id} className="rounded-xl border border-border/60 bg-muted/30 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-[12.5px] font-medium tracking-tight truncate capitalize">{d.deduction_type.replace(/_/g, " ")}</span>
                  </div>
                  <span className="text-[12px] font-medium">{fmtMoney(Number(d.amount))}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 capitalize">{d.frequency} · {d.status}</p>
              </div>
            ))}
            {bens.map(b => (
              <div key={b.id} className="rounded-xl border border-border/60 bg-muted/30 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-[12.5px] font-medium tracking-tight truncate capitalize">{b.benefit_type.replace(/_/g, " ")}</span>
                  </div>
                  <Pill tone="ok">{b.status}</Pill>
                </div>
                {b.plan_name && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{b.plan_name}</p>}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Issues & escalations */}
      <Section title="Payroll issues & escalations" right={
        <Link to="/payroll/issues" className="text-[11.5px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          Open <ArrowUpRight className="h-3 w-3" />
        </Link>
      }>
        {openIssues.length === 0 ? (
          <p className="text-[12px] text-muted-foreground">No unresolved issues. Calm profile.</p>
        ) : (
          <ul className="space-y-2">
            {openIssues.map(i => (
              <li key={i.id} className="rounded-xl border border-border/60 bg-muted/30 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12.5px] font-medium tracking-tight truncate">{i.title}</span>
                  <Pill tone={i.priority === "critical" ? "crit" : i.priority === "high" ? "warn" : "info"}>{i.priority}</Pill>
                </div>
                {i.description && <p className="text-[11.5px] text-muted-foreground mt-1 truncate">{i.description}</p>}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground mt-1.5">
                  <span className="capitalize">{(i.category || "").replace(/_/g, " ")}</span>
                  <span>· {i.status}</span>
                  {i.due_date && <span>· due {fmtDate(i.due_date)}</span>}
                  {i.source && <span>· {i.source}</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Communication timeline */}
      <Section title="Payroll communication timeline">
        <div className="rounded-2xl border border-border/60 bg-muted/30 p-3 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[11.5px] uppercase tracking-wider text-muted-foreground">Log a payroll note</span>
          </div>
          <textarea
            value={note} onChange={e => setNote(e.target.value)}
            placeholder="Who was contacted, what was discussed, what was decided, next step…"
            rows={3}
            className="w-full rounded-xl bg-background border border-border/60 px-3 py-2 text-[13px] placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
          />
          <div className="flex items-center justify-between gap-2 mt-2">
            <Select small value={noteCat} onChange={setNoteCat} options={[
              ["follow_up", "Follow-up"], ["reminder", "Reminder"],
              ["attendance", "Attendance"], ["pto", "PTO"],
              ["adjustment", "Adjustment"], ["deduction", "Deduction"],
              ["escalation", "Escalation"], ["call_log", "Call log"],
            ]} />
            <button onClick={addNote} disabled={!note.trim()}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-90 disabled:opacity-40 transition">
              <Send className="h-3 w-3" /> Save note
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-[12px] text-muted-foreground">Loading communications…</p>
        ) : comms.length === 0 ? (
          <p className="text-[12px] text-muted-foreground">No payroll communication logged yet.</p>
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
                {c.subject && <p className="text-[12.5px] font-medium tracking-tight mt-1">{c.subject}</p>}
                {c.body && <p className="text-[12px] text-muted-foreground mt-0.5 whitespace-pre-wrap">{c.body}</p>}
                {c.created_by_name && <p className="text-[11px] text-muted-foreground/80 mt-1">— {c.created_by_name}</p>}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Footer actions */}
      <div className="px-6 py-4 border-t border-border/70 flex flex-wrap items-center justify-end gap-2 sticky bottom-0 bg-card/95 backdrop-blur">
        <Link to={`/payroll/adjustments?employee=${emp.id}`} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[12.5px] border border-border/70 bg-card hover:bg-muted transition">
          <Plus className="h-3.5 w-3.5" /> Create adjustment
        </Link>
        <Link to={`/payroll/time-attendance?employee=${emp.id}`} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[12.5px] border border-border/70 bg-card hover:bg-muted transition">
          <Clock className="h-3.5 w-3.5" /> Request missing time
        </Link>
        <button onClick={onClose} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[12.5px] bg-primary text-primary-foreground hover:opacity-90 transition">
          Close
        </button>
      </div>
    </div>
  );
}

/* ---------------- Small atoms ---------------- */
function Section({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="px-6 py-4 border-b border-border/70">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">{title}</p>
        {right}
      </div>
      {children}
    </div>
  );
}

function Mini({ label, value, tone }: { label: string; value: number; tone: Tone }) {
  const cls =
    tone === "ok" ? "text-emerald-700 dark:text-emerald-400"
    : tone === "warn" ? "text-amber-700 dark:text-amber-400"
    : tone === "crit" ? "text-destructive"
    : tone === "info" ? "text-blue-700 dark:text-blue-400"
    : "text-foreground";
  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 px-2.5 py-2 text-center">
      <p className={cn("text-lg font-semibold tracking-tight", cls)}>{value}</p>
      <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function Chip({ children, active, tone, onClick }: { children: React.ReactNode; active?: boolean; tone?: Tone; onClick: () => void }) {
  const base = "inline-flex items-center h-8 px-3 rounded-full text-[12px] border transition tracking-tight";
  const a = active
    ? tone === "warn" ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300"
    : tone === "crit" ? "bg-destructive/10 border-destructive/30 text-destructive"
    : tone === "info" ? "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300"
    : tone === "ok" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
    : "bg-foreground text-background border-foreground"
    : "bg-card text-muted-foreground border-border/70 hover:bg-muted hover:text-foreground";
  return <button onClick={onClick} className={cn(base, a)}>{children}</button>;
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