import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Inbox, Sparkles, Search, Filter, Plus, Send, CheckCircle2, AlertCircle,
  ChevronRight, X, Clock, MessageSquare, ArrowRight, UserCheck, ShieldAlert,
  ShieldCheck, GraduationCap, Flag, MailQuestion, ListChecks,
  ClipboardList,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { HRIntegrationStatusStrip } from "@/components/hr/HRIntegrationStatusStrip";
import { IntegrationReadinessPanel, type OnboardingReadinessRow } from "@/components/hr/IntegrationReadinessPanel";
import { HRIntegrationReadinessEditor } from "@/components/hr/HRIntegrationReadinessEditor";
import { HRRecentActivity } from "@/components/hr/HRRecentActivity";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { logHrEvent } from "@/lib/hr/activityEvents";
import { useOperatorDialogs } from "@/components/os/OperatorDialogs";

/* ---------------- types ---------------- */
interface Case {
  id: string; employee_id: string; case_type: string; status: string; priority: string;
  title: string; summary: string | null; owner_role: string | null; due_date: string | null;
  resolution: string | null; opened_at: string; closed_at: string | null; updated_at: string;
}
interface Employee {
  id: string; first_name: string; last_name: string; job_title: string;
  state: string; status: string; start_date: string | null;
}
interface Onboarding extends OnboardingReadinessRow {
  id: string;
  employee_id: string;
  status: string;
  blockers: string[] | null;
}
interface Training { id: string; employee_id: string; status: string; due_date: string | null; course_id: string | null; }

/* ---------------- atoms ---------------- */
type Tone = "ok" | "warn" | "crit" | "muted" | "info";

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn(
      "rounded-2xl border border-border/70 bg-card",
      "shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]",
      className,
    )}>{children}</div>
  );
}
function Pill({ tone = "muted", children }: { tone?: Tone; children: React.ReactNode }) {
  const cls =
    tone === "crit" ? "bg-destructive/10 text-destructive border-destructive/20"
    : tone === "warn" ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
    : tone === "ok"   ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
    : tone === "info" ? "bg-primary/10 text-primary border-primary/20"
    : "bg-muted text-muted-foreground border-border/70";
  return <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium", cls)}>{children}</span>;
}
function Empty({ icon: Icon, title, hint }: { icon: React.ElementType; title: string; hint?: string }) {
  return (
    <div className="py-10 text-center">
      <div className="mx-auto mb-3 h-10 w-10 rounded-2xl bg-muted grid place-items-center">
        <Icon className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <p className="text-sm font-medium tracking-tight">{title}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}
function Kpi({ label, value, tone = "muted", hint, onClick, active }: { label: string; value: string | number; tone?: Tone; hint?: string; onClick?: () => void; active?: boolean }) {
  const accent =
    tone === "crit" ? "text-destructive"
    : tone === "warn" ? "text-amber-700 dark:text-amber-400"
    : tone === "ok" ? "text-emerald-700 dark:text-emerald-400"
    : "text-foreground";
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-left rounded-2xl border bg-card p-4 transition-all",
        "shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]",
        active ? "border-primary/40 ring-1 ring-primary/20" : "border-border/70 hover:-translate-y-0.5",
      )}
    >
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("text-2xl font-semibold tracking-tight mt-1 tabular-nums", accent)}>{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}
    </button>
  );
}
function HeaderBtn({ icon: Icon, children, primary, to, onClick }: { icon: React.ElementType; children: React.ReactNode; primary?: boolean; to?: string; onClick?: () => void }) {
  const cls = primary
    ? "bg-primary text-primary-foreground hover:opacity-90"
    : "text-foreground border border-border/70 bg-card hover:bg-muted";
  if (to) return (
    <Link to={to} className={cn("inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] transition-colors", cls)}>
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} /> {children}
    </Link>
  );
  return (
    <button onClick={onClick} className={cn("inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] transition-colors", cls)}>
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} /> {children}
    </button>
  );
}
function QuickAction({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-[12px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} /> {label}
    </button>
  );
}

/* ---------------- helpers ---------------- */
const TYPE_LABEL: Record<string, string> = {
  payroll_issue: "Payroll",
  attendance_issue: "Attendance",
  benefit_question: "Benefits",
  hr_question: "General HR",
  onboarding_blocker: "Onboarding",
  training_issue: "Training",
  manager_escalation: "Escalation",
  documentation_needed: "Documentation",
  access_issue: "System access",
  policy_acknowledgment: "Policy",
  disciplinary_concern: "Performance",
  offboarding_case: "Offboarding",
};
const STATUS_LABEL: Record<string, string> = {
  new: "New",
  open: "In progress",
  waiting_employee: "Waiting on employee",
  waiting_manager: "Waiting on manager",
  waiting_payroll: "Waiting on payroll",
  waiting_hr: "Waiting on HR",
  resolved: "Resolved",
  closed: "Closed",
};

function statusTone(s: string): Tone {
  if (s === "new") return "info";
  if (s === "open") return "warn";
  if (s.startsWith("waiting")) return "muted";
  if (s === "resolved" || s === "closed") return "ok";
  return "muted";
}
function priorityTone(p: string): Tone {
  if (p === "urgent") return "crit";
  if (p === "high") return "warn";
  if (p === "medium") return "info";
  return "muted";
}
function fmtDate(d: string | null) {
  if (!d) return "—";
  try { return new Date(d + (d.length === 10 ? "T00:00:00" : "")).toLocaleDateString(undefined, { month: "short", day: "numeric" }); }
  catch { return d; }
}
function relTime(iso: string | null) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d <= 0) return "Today";
  if (d === 1) return "1d ago";
  if (d < 30) return `${d}d ago`;
  const m = Math.floor(d / 30); return `${m}mo ago`;
}
function daysOpen(iso: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
}

/* ---------------- data ---------------- */
function useData(reloadKey = 0) {
  const [s, set] = useState({
    cases: [] as Case[],
    employees: [] as Employee[],
    onboarding: [] as Onboarding[],
    trainings: [] as Training[],
    loading: true,
  });
  useEffect(() => {
    let cancel = false;
    (async () => {
      const [c, e, o, t] = await Promise.all([
        supabase.from("employee_cases").select("*").order("opened_at", { ascending: false }),
        supabase.from("employees").select("id,first_name,last_name,job_title,state,status,start_date").order("last_name"),
        supabase.from("employee_onboarding").select("id,employee_id,status,blockers,viventium_status,viventium_synced_at,viventium_notes,stellar_status,stellar_synced_at,stellar_notes,centralreach_status,centralreach_synced_at,centralreach_notes"),
        supabase.from("employee_trainings").select("id,employee_id,status,due_date,course_id"),
      ]);
      if (cancel) return;
      set({
        cases: (c.data ?? []) as Case[],
        employees: (e.data ?? []) as Employee[],
        onboarding: (o.data ?? []) as Onboarding[],
        trainings: (t.data ?? []) as Training[],
        loading: false,
      });
    })();
    return () => { cancel = true; };
  }, [reloadKey]);
  return s;
}

/* ---------------- page ---------------- */
type Tab = "all" | "onboarding" | "orientation" | "training" | "certifications" | "evaluations" | "readiness" | "escalations";

const TAB_FILTER: Record<Tab, (c: Case) => boolean> = {
  all: () => true,
  onboarding: c => c.case_type === "onboarding_blocker",
  orientation: c => c.case_type === "onboarding_blocker" && /orient/i.test(c.title + " " + (c.summary ?? "")),
  training: c => c.case_type === "training_issue",
  certifications: c => /cert|license|rbt|cpr/i.test(c.title + " " + (c.summary ?? "")),
  evaluations: c => c.case_type === "disciplinary_concern" || /eval|review|growth/i.test(c.title + " " + (c.summary ?? "")),
  readiness: c => c.case_type === "onboarding_blocker" || c.case_type === "access_issue",
  escalations: c => c.case_type === "manager_escalation" || c.priority === "urgent",
};

export default function OSHRRequests() {
  const { toast } = useToast();
  const { promptOperator } = useOperatorDialogs();
  const navigate = useNavigate();
  const [reloadKey, setReloadKey] = useState(0);
  const d = useData(reloadKey);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const empById = useMemo(() => Object.fromEntries(d.employees.map(e => [e.id, e])), [d.employees]);
  const onbByEmp = useMemo(() => {
    const m = new Map<string, Onboarding>();
    d.onboarding.forEach(o => m.set(o.employee_id, o));
    return m;
  }, [d.onboarding]);
  const trnByEmp = useMemo(() => {
    const m = new Map<string, Training[]>();
    d.trainings.forEach(t => {
      const arr = m.get(t.employee_id) ?? [];
      arr.push(t); m.set(t.employee_id, arr);
    });
    return m;
  }, [d.trainings]);

  /* KPI */
  const stats = useMemo(() => {
    const open = d.cases.filter(c => !["resolved", "closed"].includes(c.status));
    const urgent = open.filter(c => c.priority === "urgent");
    const waitingEmp = open.filter(c => c.status === "waiting_employee");
    const onboardingS = open.filter(c => c.case_type === "onboarding_blocker");
    const trainingS = open.filter(c => c.case_type === "training_issue");
    const weekAgo = Date.now() - 7 * 86400000;
    const resolvedWk = d.cases.filter(c => c.closed_at && new Date(c.closed_at).getTime() >= weekAgo).length;
    const avgResolve = (() => {
      const closed = d.cases.filter(c => c.closed_at);
      if (!closed.length) return null;
      const total = closed.reduce((s, c) => s + (new Date(c.closed_at!).getTime() - new Date(c.opened_at).getTime()), 0);
      return Math.round(total / closed.length / 86400000 * 10) / 10;
    })();
    return {
      open: open.length, urgent: urgent.length, waitingEmp: waitingEmp.length,
      onboarding: onboardingS.length, training: trainingS.length, resolvedWk, avgResolve,
    };
  }, [d.cases]);

  /* queue rows */
  const queueRows = useMemo(() => {
    let rows = d.cases.filter(TAB_FILTER[tab]);
    if (statusFilter === "open") rows = rows.filter(c => !["resolved","closed"].includes(c.status));
    else if (statusFilter === "urgent") rows = rows.filter(c => c.priority === "urgent");
    else if (statusFilter === "waiting_employee") rows = rows.filter(c => c.status === "waiting_employee");
    else if (statusFilter === "resolved") rows = rows.filter(c => ["resolved","closed"].includes(c.status));
    if (query) {
      const q = query.toLowerCase();
      rows = rows.filter(r => {
        const e = empById[r.employee_id];
        return r.title.toLowerCase().includes(q)
          || (r.summary ?? "").toLowerCase().includes(q)
          || (e && `${e.first_name} ${e.last_name}`.toLowerCase().includes(q))
          || (TYPE_LABEL[r.case_type] ?? r.case_type).toLowerCase().includes(q);
      });
    }
    return rows;
  }, [d.cases, tab, statusFilter, query, empById]);

  /* readiness blockers derived from onboarding + overdue training + cases */
  const blockers = useMemo(() => {
    const items: { who: string; empId: string; kind: string; detail: string; days: number; readiness: number; owner: string }[] = [];
    d.onboarding.forEach(o => {
      const e = empById[o.employee_id]; if (!e) return;
      const isStuck = o.status !== "active" && o.status !== "completed";
      const hasBlockers = (o.blockers ?? []).length > 0;
      if (!isStuck && !hasBlockers) return;
      const tr = trnByEmp.get(o.employee_id) ?? [];
      const trDone = tr.filter(t => t.status === "completed").length;
      const readiness = tr.length ? Math.round((trDone / tr.length) * 100) : (o.status === "active" ? 80 : 30);
      items.push({
        who: `${e.first_name} ${e.last_name}`, empId: e.id,
        kind: hasBlockers ? "Onboarding blocker" : "Onboarding stalled",
        detail: hasBlockers ? (o.blockers ?? []).slice(0, 2).join(", ") : (o.status ?? "—").replace(/_/g, " "),
        days: 0, readiness, owner: "HR",
      });
    });
    d.cases
      .filter(c => c.case_type === "onboarding_blocker" && !["resolved","closed"].includes(c.status))
      .forEach(c => {
        const e = empById[c.employee_id]; if (!e) return;
        if (items.find(i => i.empId === e.id)) return;
        items.push({
          who: `${e.first_name} ${e.last_name}`, empId: e.id,
          kind: c.title, detail: c.summary ?? "—",
          days: daysOpen(c.opened_at), readiness: 50, owner: c.owner_role ?? "HR",
        });
      });
    return items.slice(0, 12);
  }, [d.onboarding, d.cases, empById, trnByEmp]);

  /* follow-ups: waiting cases + due_date passed */
  const followups = useMemo(() => {
    return d.cases
      .filter(c => !["resolved","closed"].includes(c.status))
      .filter(c => c.status.startsWith("waiting") || (c.due_date && new Date(c.due_date + "T23:59:59").getTime() < Date.now()))
      .slice(0, 10);
  }, [d.cases]);

  /* escalations */
  const escalations = useMemo(() => {
    return d.cases
      .filter(c => !["resolved","closed"].includes(c.status))
      .filter(c => c.priority === "urgent" || c.case_type === "manager_escalation")
      .slice(0, 8);
  }, [d.cases]);

  const openCase = openId ? d.cases.find(c => c.id === openId) : null;
  const openEmp = openCase ? empById[openCase.employee_id] : null;
  const openOnb = openCase ? onbByEmp.get(openCase.employee_id) : undefined;
  const openTrn = openCase ? trnByEmp.get(openCase.employee_id) ?? [] : [];

  return (
    <OSShell>
      <div className="px-6 md:px-10 py-10 max-w-7xl mx-auto">
        {/* header */}
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-start">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="h-11 w-11 rounded-2xl bg-muted grid place-items-center shrink-0">
              <Inbox className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">HR Requests</h1>
              <p className="text-[13px] text-muted-foreground mt-1 max-w-2xl">
                Coordinate employee support, onboarding assistance, operational follow-ups, and readiness workflows across Blossom.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <HeaderBtn icon={Plus} to="/hr/employee-support">Open employee support</HeaderBtn>
            <HeaderBtn icon={Send} to="/hr/messages">Message employee</HeaderBtn>
            <HeaderBtn icon={ListChecks} to="/hr/new-hires">New hire pipeline</HeaderBtn>
          </div>
        </header>
        <HRIntegrationStatusStrip className="mb-6" />

        {/* KPI snapshot */}
        <div className="grid gap-3 mb-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <Kpi label="Open" value={d.loading ? "—" : stats.open} hint="Active requests" onClick={() => setStatusFilter(statusFilter === "open" ? null : "open")} active={statusFilter === "open"} />
          <Kpi label="Urgent" value={d.loading ? "—" : stats.urgent} tone={stats.urgent ? "crit" : "ok"} hint="Priority follow-up" onClick={() => setStatusFilter(statusFilter === "urgent" ? null : "urgent")} active={statusFilter === "urgent"} />
          <Kpi label="Waiting on employee" value={d.loading ? "—" : stats.waitingEmp} tone={stats.waitingEmp ? "warn" : "muted"} hint="Needs nudge" onClick={() => setStatusFilter(statusFilter === "waiting_employee" ? null : "waiting_employee")} active={statusFilter === "waiting_employee"} />
          <Kpi label="Onboarding support" value={d.loading ? "—" : stats.onboarding} tone={stats.onboarding ? "warn" : "muted"} hint="Onboarding-related" onClick={() => setTab("onboarding")} />
          <Kpi label="Training support" value={d.loading ? "—" : stats.training} tone={stats.training ? "warn" : "muted"} hint="Training-related" onClick={() => setTab("training")} />
          <Kpi label="Resolved (7d)" value={d.loading ? "—" : stats.resolvedWk} tone="ok" hint={stats.avgResolve != null ? `${stats.avgResolve}d avg` : "—"} onClick={() => setStatusFilter(statusFilter === "resolved" ? null : "resolved")} active={statusFilter === "resolved"} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* MAIN */}
          <div className="space-y-6 min-w-0">
            {/* QUEUE */}
            <section>
              <div className="flex items-end justify-between mb-3 gap-3 flex-wrap">
                <div>
                  <h2 className="text-base font-medium tracking-tight">Request queue</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Employee support requests across onboarding, training, certifications, and readiness.</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by employee, title, category…"
                    className="w-64 h-8 pl-8 pr-3 rounded-lg bg-muted/60 border border-border/70 text-[12.5px] placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-transparent transition"
                  />
                </div>
              </div>

              <Card>
                {/* segmented tabs */}
                <div className="flex items-center gap-1 p-2 border-b border-border/70 overflow-x-auto">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground ml-1 mr-1 shrink-0" strokeWidth={1.75} />
                  {([
                    ["all", "All"],
                    ["onboarding", "Onboarding"],
                    ["orientation", "Orientation"],
                    ["training", "Training"],
                    ["certifications", "Certifications"],
                    ["evaluations", "Evaluations"],
                    ["readiness", "Readiness"],
                    ["escalations", "Escalations"],
                  ] as [Tab, string][]).map(([k, label]) => (
                    <button
                      key={k}
                      onClick={() => setTab(k)}
                      className={cn(
                        "h-7 px-3 rounded-lg text-[12px] whitespace-nowrap transition-colors",
                        tab === k ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-muted",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* rows */}
                <div className="divide-y divide-border/70">
                  {d.loading ? (
                    <div className="p-6 space-y-3">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
                      ))}
                    </div>
                  ) : queueRows.length === 0 ? (
                    <Empty
                      icon={CheckCircle2}
                      title="No unresolved HR requests."
                      hint="You're all caught up — new requests will surface here as employees submit them."
                    />
                  ) : (
                    queueRows.map(r => {
                      const e = empById[r.employee_id];
                      return (
                        <button
                          key={r.id}
                          onClick={() => setOpenId(r.id)}
                          className="w-full text-left p-4 hover:bg-muted/40 transition-colors flex items-center gap-4"
                        >
                          <div className="h-9 w-9 rounded-full bg-muted grid place-items-center shrink-0 text-[12px] font-medium text-muted-foreground">
                            {e ? `${e.first_name[0] ?? ""}${e.last_name[0] ?? ""}` : "?"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-[13.5px] font-medium tracking-tight truncate">{r.title}</p>
                              <Pill tone={priorityTone(r.priority)}>{r.priority}</Pill>
                              <Pill tone={statusTone(r.status)}>{STATUS_LABEL[r.status] ?? r.status}</Pill>
                            </div>
                            <p className="text-[12px] text-muted-foreground mt-0.5 truncate">
                              {e ? `${e.first_name} ${e.last_name}` : "Unknown"}
                              {e?.job_title && ` · ${e.job_title}`}
                              {e?.state && ` · ${e.state}`}
                              {` · ${TYPE_LABEL[r.case_type] ?? r.case_type}`}
                              {` · opened ${relTime(r.opened_at)}`}
                              {r.due_date && ` · due ${fmtDate(r.due_date)}`}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                        </button>
                      );
                    })
                  )}
                </div>
              </Card>
            </section>

            {/* READINESS BLOCKERS */}
            <section>
              <div className="flex items-end justify-between mb-3">
                <div>
                  <h2 className="text-base font-medium tracking-tight">Readiness blockers</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Employees with onboarding, training, or access blockers slowing staffing readiness.</p>
                </div>
              </div>
              <Card>
                {d.loading ? (
                  <div className="p-6 space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />)}
                  </div>
                ) : blockers.length === 0 ? (
                  <Empty icon={ShieldCheck} title="No readiness blockers." hint="Everyone is progressing smoothly toward staffing." />
                ) : (
                  <div className="divide-y divide-border/70">
                    {blockers.map((b, i) => (
                      <div key={i} className="p-4 flex items-center gap-4">
                        <div className="h-9 w-9 rounded-2xl bg-amber-500/10 grid place-items-center shrink-0">
                          <AlertCircle className="h-4 w-4 text-amber-700 dark:text-amber-400" strokeWidth={1.75} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-[13px] font-medium tracking-tight truncate">{b.who}</p>
                            <Pill tone="warn">{b.kind}</Pill>
                          </div>
                          <p className="text-[12px] text-muted-foreground mt-0.5 truncate">{b.detail} · owner {b.owner}</p>
                        </div>
                        <div className="hidden sm:block w-28 shrink-0">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                              <div className="h-full bg-primary/70" style={{ width: `${b.readiness}%` }} />
                            </div>
                            <span className="text-[11px] tabular-nums text-muted-foreground w-8 text-right">{b.readiness}%</span>
                          </div>
                        </div>
                        <div className="hidden md:flex items-center gap-1">
                          <QuickAction icon={UserCheck} label="Open" onClick={() => navigate(`/hr/employee-support?employee=${b.empId}`)} />
                          <QuickAction icon={MessageSquare} label="Message" onClick={() => navigate("/hr/messages")} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </section>

            {/* FOLLOW-UPS + ESCALATIONS */}
            <div className="grid gap-6 md:grid-cols-2">
              <section>
                <div className="mb-3">
                  <h2 className="text-base font-medium tracking-tight">Follow-up center</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Requests waiting on a response or past their due date.</p>
                </div>
                <Card>
                  {d.loading ? <div className="p-6"><div className="h-10 rounded-xl bg-muted animate-pulse" /></div>
                  : followups.length === 0 ? <Empty icon={CheckCircle2} title="No follow-ups needed." hint="Everything is moving." />
                  : (
                    <div className="divide-y divide-border/70">
                      {followups.map(f => {
                        const e = empById[f.employee_id];
                        const overdue = f.due_date && new Date(f.due_date + "T23:59:59").getTime() < Date.now();
                        return (
                          <button key={f.id} onClick={() => setOpenId(f.id)} className="w-full text-left p-3.5 hover:bg-muted/40 transition-colors">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-[13px] font-medium tracking-tight truncate">{f.title}</p>
                              <Pill tone={overdue ? "crit" : "muted"}>{STATUS_LABEL[f.status] ?? f.status}</Pill>
                            </div>
                            <p className="text-[11.5px] text-muted-foreground mt-0.5 truncate">
                              {e ? `${e.first_name} ${e.last_name}` : "—"}
                              {f.due_date && ` · ${overdue ? "overdue" : "due"} ${fmtDate(f.due_date)}`}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </section>

              <section>
                <div className="mb-3">
                  <h2 className="text-base font-medium tracking-tight">Escalations</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Urgent and leadership-flagged employee issues.</p>
                </div>
                <Card>
                  {d.loading ? <div className="p-6"><div className="h-10 rounded-xl bg-muted animate-pulse" /></div>
                  : escalations.length === 0 ? <Empty icon={ShieldCheck} title="No active escalations." hint="No urgent operational risks." />
                  : (
                    <div className="divide-y divide-border/70">
                      {escalations.map(c => {
                        const e = empById[c.employee_id];
                        return (
                          <button key={c.id} onClick={() => setOpenId(c.id)} className="w-full text-left p-3.5 hover:bg-muted/40 transition-colors">
                            <div className="flex items-center gap-2 flex-wrap">
                              <ShieldAlert className="h-3.5 w-3.5 text-destructive" strokeWidth={1.75} />
                              <p className="text-[13px] font-medium tracking-tight truncate">{c.title}</p>
                              <Pill tone="crit">{c.priority}</Pill>
                            </div>
                            <p className="text-[11.5px] text-muted-foreground mt-0.5 truncate">
                              {e ? `${e.first_name} ${e.last_name}` : "—"} · open {daysOpen(c.opened_at)}d · {TYPE_LABEL[c.case_type] ?? c.case_type}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </section>
            </div>
          </div>

          {/* RIGHT RAIL */}
          <aside className="space-y-6 min-w-0">
            <Card className="p-5 sticky top-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-xl bg-primary/10 grid place-items-center">
                  <ClipboardList className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
                </div>
                <p className="text-[13px] font-medium tracking-tight">Priority Actions</p>
              </div>
              <p className="text-[12px] text-muted-foreground mb-4">Operational support for HR workflows.</p>
              <div className="space-y-1.5 text-[12.5px] text-foreground/80">
                <div className="rounded-lg px-2.5 py-1.5">Triage urgent requests</div>
                <div className="rounded-lg px-2.5 py-1.5">Unblock onboarding-related tickets</div>
                <div className="rounded-lg px-2.5 py-1.5">Follow up on requests waiting on employees</div>
                <div className="rounded-lg px-2.5 py-1.5">Escalate readiness blockers</div>
                <div className="rounded-lg px-2.5 py-1.5">Close out resolved conversations</div>
              </div>
            </Card>

            <Card className="p-5">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">Snapshot</p>
              <ul className="space-y-2 text-[12.5px]">
                <li className="flex items-center justify-between"><span className="text-muted-foreground">Open requests</span><span className="font-medium tabular-nums">{d.loading ? "—" : stats.open}</span></li>
                <li className="flex items-center justify-between"><span className="text-muted-foreground">Escalated</span><span className="font-medium tabular-nums">{d.loading ? "—" : stats.urgent}</span></li>
                <li className="flex items-center justify-between"><span className="text-muted-foreground">Avg resolution</span><span className="font-medium tabular-nums">{stats.avgResolve != null ? `${stats.avgResolve}d` : "—"}</span></li>
                <li className="flex items-center justify-between"><span className="text-muted-foreground">Onboarding-related</span><span className="font-medium tabular-nums">{stats.open ? `${Math.round((stats.onboarding / stats.open) * 100)}%` : "—"}</span></li>
                <li className="flex items-center justify-between"><span className="text-muted-foreground">Readiness blockers</span><span className="font-medium tabular-nums">{d.loading ? "—" : blockers.length}</span></li>
              </ul>
            </Card>
          </aside>
        </div>
      </div>

      {/* DETAIL PANEL */}
      {openCase && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog">
          <button className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setOpenId(null)} aria-label="Close" />
          <div className="relative w-full max-w-xl h-full bg-background border-l border-border/70 overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border/70 px-6 py-4 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{TYPE_LABEL[openCase.case_type] ?? openCase.case_type}</p>
                <p className="text-base font-semibold tracking-tight truncate">{openCase.title}</p>
              </div>
              <button onClick={() => setOpenId(null)} className="rounded-full h-8 w-8 grid place-items-center hover:bg-muted transition-colors">
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="flex items-center gap-2 flex-wrap">
                <Pill tone={statusTone(openCase.status)}>{STATUS_LABEL[openCase.status] ?? openCase.status}</Pill>
                <Pill tone={priorityTone(openCase.priority)}>{openCase.priority}</Pill>
                <span className="text-[12px] text-muted-foreground">opened {relTime(openCase.opened_at)} · {daysOpen(openCase.opened_at)}d open</span>
              </div>

              {/* Employee */}
              {openEmp && (
                <section>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Employee</p>
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted grid place-items-center text-[12px] font-medium text-muted-foreground">
                        {openEmp.first_name[0]}{openEmp.last_name[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[14px] font-medium tracking-tight truncate">{openEmp.first_name} {openEmp.last_name}</p>
                        <p className="text-[12px] text-muted-foreground truncate">
                          {openEmp.job_title} · {openEmp.state} · {openEmp.status.replace(/_/g, " ")}
                        </p>
                      </div>
                    </div>
                  </Card>
                </section>
              )}

              {/* Summary */}
              <section>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Request summary</p>
                <Card className="p-4 text-[13px] text-foreground/90 leading-relaxed">
                  {openCase.summary ?? <span className="text-muted-foreground">No additional detail provided.</span>}
                  {openCase.due_date && <p className="text-[12px] text-muted-foreground mt-2">Due {fmtDate(openCase.due_date)}</p>}
                  {openCase.owner_role && <p className="text-[12px] text-muted-foreground mt-1">Owner · {openCase.owner_role}</p>}
                </Card>
              </section>

              {/* Related operational data */}
              <section>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Operational context</p>
                <div className="grid gap-2 grid-cols-2">
                  <Card className="p-3">
                    <p className="text-[11px] text-muted-foreground">Onboarding</p>
                    <p className="text-[13px] font-medium mt-0.5 truncate">{openOnb ? openOnb.status.replace(/_/g, " ") : "—"}</p>
                  </Card>
                  <Card className="p-3">
                    <p className="text-[11px] text-muted-foreground">Blockers</p>
                    <p className="text-[13px] font-medium mt-0.5 truncate">{openOnb && openOnb.blockers?.length ? openOnb.blockers.length : "None"}</p>
                  </Card>
                  <Card className="p-3">
                    <p className="text-[11px] text-muted-foreground">Trainings</p>
                    <p className="text-[13px] font-medium mt-0.5 truncate">{openTrn.length ? `${openTrn.filter(t => t.status === "completed").length}/${openTrn.length}` : "—"}</p>
                  </Card>
                  <Card className="p-3">
                    <p className="text-[11px] text-muted-foreground">Overdue training</p>
                    <p className="text-[13px] font-medium mt-0.5 truncate">{openTrn.filter(t => t.due_date && t.status !== "completed" && new Date(t.due_date+"T23:59:59").getTime() < Date.now()).length}</p>
                  </Card>
                </div>
              </section>

              {/* Integration readiness */}
              <section>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Integration readiness</p>
                {openOnb ? (
                  <>
                    <IntegrationReadinessPanel row={openOnb} />
                    <div className="mt-3">
                      <HRIntegrationReadinessEditor
                        onboardingId={openOnb.id}
                        employeeId={(openCase as any).employee_id ?? null}
                        row={openOnb as any}
                        onSaved={() => setReloadKey(k => k + 1)}
                      />
                    </div>
                  </>
                ) : (
                  <Card className="p-4 text-[12px] text-muted-foreground">
                    No onboarding record found for this employee — readiness will populate once onboarding is initialized.
                  </Card>
                )}
              </section>

              {/* Recent HR activity */}
              <section>
                <HRRecentActivity
                  employeeId={(openCase as any).employee_id ?? null}
                  onboardingId={openOnb?.id ?? null}
                  caseId={openCase.id}
                />
              </section>

              {/* Resolution */}
              {openCase.resolution && (
                <section>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Resolution</p>
                  <Card className="p-4 text-[13px] text-foreground/90 leading-relaxed">{openCase.resolution}</Card>
                </section>
              )}

              {/* Actions */}
              <section className="pt-2 border-t border-border/70 -mx-6 px-6">
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => navigate("/hr/messages")} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] bg-primary text-primary-foreground hover:opacity-90 transition">
                    <Send className="h-3.5 w-3.5" strokeWidth={1.75} /> Message employee
                  </button>
                  <button onClick={async () => {
                    const role = window.prompt("Reassign to owner role (HR, Manager, Payroll, Recruiting):", openCase.owner_role ?? "HR");
                    if (!role) return;
                    const { error } = await supabase.from("employee_cases").update({ owner_role: role }).eq("id", openCase.id);
                    if (!error) await logHrEvent({ eventType: "request_reassigned", title: `Request reassigned to ${role}`, caseId: openCase.id, employeeId: (openCase as any).employee_id ?? null, metadata: { role } });
                    toast({ title: error ? "Could not reassign" : `Reassigned to ${role}` });
                    if (!error) setReloadKey(k => k + 1);
                  }} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] border border-border/70 bg-card hover:bg-muted transition">
                    <UserCheck className="h-3.5 w-3.5" strokeWidth={1.75} /> Reassign
                  </button>
                  <button onClick={async () => {
                    const { error } = await supabase.from("employee_cases").update({ priority: "urgent" }).eq("id", openCase.id);
                    if (!error) await logHrEvent({ eventType: "request_escalated", title: "Request escalated to urgent", caseId: openCase.id, employeeId: (openCase as any).employee_id ?? null });
                    toast({ title: error ? "Could not escalate" : "Escalated to urgent" });
                    if (!error) setReloadKey(k => k + 1);
                  }} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] border border-border/70 bg-card hover:bg-muted transition">
                    <Flag className="h-3.5 w-3.5" strokeWidth={1.75} /> Escalate
                  </button>
                  <button onClick={async () => {
                    const note = window.prompt("Add operational note:");
                    if (!note) return;
                    const { error } = await logHrEvent({ eventType: "request_note", title: "Operational note added", description: note, caseId: openCase.id, employeeId: (openCase as any).employee_id ?? null });
                    toast({ title: error ? "Could not add note" : "Note added" });
                    if (!error) setReloadKey(k => k + 1);
                  }} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] border border-border/70 bg-card hover:bg-muted transition">
                    <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.75} /> Add note
                  </button>
                  <button onClick={async () => {
                    const resolution = window.prompt("Resolution note:", openCase.resolution ?? "");
                    if (resolution === null) return;
                    const { error } = await supabase.from("employee_cases").update({
                      status: "resolved", resolution, closed_at: new Date().toISOString(),
                    }).eq("id", openCase.id);
                    if (!error) await logHrEvent({ eventType: "request_resolved", title: "Request resolved", description: resolution, caseId: openCase.id, employeeId: (openCase as any).employee_id ?? null });
                    toast({ title: error ? "Could not resolve" : "Request resolved" });
                    if (!error) { setOpenId(null); setReloadKey(k => k + 1); }
                  }} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] border border-border/70 bg-card hover:bg-muted transition">
                    <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.75} /> Resolve
                  </button>
                  <button onClick={async () => {
                    const date = window.prompt("Follow-up due date (YYYY-MM-DD):", new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10));
                    if (!date) return;
                    const { error } = await supabase.from("employee_cases").update({
                      due_date: date, status: "waiting_employee",
                    }).eq("id", openCase.id);
                    if (!error) await logHrEvent({ eventType: "request_follow_up_created", title: `Follow-up scheduled for ${date}`, caseId: openCase.id, employeeId: (openCase as any).employee_id ?? null, metadata: { due_date: date } });
                    toast({ title: error ? "Could not schedule" : `Follow-up set for ${date}` });
                    if (!error) setReloadKey(k => k + 1);
                  }} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] border border-border/70 bg-card hover:bg-muted transition">
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} /> Create follow-up
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </OSShell>
  );
}
