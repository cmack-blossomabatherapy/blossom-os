import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck, Search, X, ChevronRight, Sparkles, MapPin, Calendar,
  Inbox, Clock, AlertTriangle, Plus, MessageSquare, Send, CheckCircle2,
  ArrowUpRight, FileText, Users2, FileWarning, Flame, Wallet, ClipboardCheck,
  FileCheck2, Briefcase, BadgeAlert,
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
  job_title: string | null; state: string | null; clinic: string | null;
  avatar_url: string | null; photo_url: string | null;
  hire_date: string | null;
  viventium_employee_id?: string | null;
}
interface Issue {
  id: string; employee_id: string | null;
  title: string; description: string | null; category: string;
  priority: string; status: string; owner_role: string | null;
  due_date: string | null; source: string | null;
  created_at: string; updated_at: string;
}
interface Exception {
  id: string; employee_id: string; clinic: string | null;
  kind: string; status: string; occurred_on: string;
  detail: string | null; resolution: string | null;
  resolved_at: string | null; created_at: string; updated_at: string;
}
interface Adjustment {
  id: string; employee_id: string;
  adjustment_type: string; amount: number | string; hours: number | string;
  reason: string | null; status: string;
  notes: string | null; created_at: string; updated_at: string;
}
interface Deduction {
  id: string; employee_id: string; deduction_type: string;
  amount: number | string; frequency: string;
  start_date: string | null; status: string; notes: string | null;
  created_at: string; updated_at: string;
}
interface Benefit {
  id: string; employee_id: string; benefit_type: string;
  plan_name: string | null; status: string; effective_date: string | null;
  notes: string | null; created_at: string; updated_at: string;
}
interface Comm {
  id: string; employee_id: string | null; channel: string;
  direction: string; category: string; subject: string | null;
  body: string | null; status: string; created_by_name: string | null;
  created_at: string;
}

type ItemType =
  | "missing_docs" | "attendance" | "adjustment"
  | "deduction" | "benefit" | "payroll_setup" | "issue";

type Risk = "low" | "moderate" | "high" | "critical";
type Compliance = "compliant" | "review" | "missing" | "waiting" | "escalated" | "at_risk" | "resolved";

interface ComplianceItem {
  key: string;
  source: ItemType;
  source_id: string;
  employee_id: string | null;
  title: string;
  subtitle: string;
  notes: string | null;
  risk: Risk;
  compliance: Compliance;
  owner: string;
  cycle: string;
  due_date: string | null;
  updated_at: string;
  docs_missing: boolean;
}

const ITEM_LABEL: Record<ItemType, string> = {
  missing_docs: "Missing documentation",
  attendance: "Attendance review",
  adjustment: "Payroll adjustment",
  deduction: "Deduction review",
  benefit: "Benefits follow-up",
  payroll_setup: "Payroll setup",
  issue: "Payroll issue",
};
const ITEM_ICON: Record<ItemType, any> = {
  missing_docs: FileWarning, attendance: Clock, adjustment: Wallet,
  deduction: Briefcase, benefit: ShieldCheck, payroll_setup: BadgeAlert, issue: AlertTriangle,
};
const RISK_TONE: Record<Risk, Tone> = {
  low: "muted", moderate: "info", high: "warn", critical: "crit",
};
const COMP_LABEL: Record<Compliance, string> = {
  compliant: "Compliant", review: "Needs review", missing: "Missing info",
  waiting: "Waiting on employee", escalated: "Escalated", at_risk: "At risk",
  resolved: "Resolved",
};
const COMP_TONE: Record<Compliance, Tone> = {
  compliant: "ok", review: "info", missing: "warn",
  waiting: "warn", escalated: "crit", at_risk: "warn", resolved: "muted",
};

function relTime(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000); if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); return d < 30 ? `${d}d ago` : fmtDate(iso);
}
function initials(e: Emp) {
  return `${(e.preferred_name || e.first_name || "?")[0] || "?"}${(e.last_name || "")[0] || ""}`.toUpperCase();
}
function cycleLabel(d?: string | null) {
  if (!d) return "Unscheduled";
  const t = new Date(d).getTime();
  const now = Date.now();
  const diff = (t - now) / 86400000;
  if (diff < -1) return `Overdue ${Math.ceil(-diff)}d`;
  if (diff < 14) return "Current cycle";
  if (diff < 28) return "Next cycle";
  return "Future cycle";
}
function daysUntil(d?: string | null) {
  if (!d) return null;
  return Math.floor((new Date(d).getTime() - Date.now()) / 86400000);
}

/* ---------------- Page ---------------- */
export default function OSPayrollCompliance() {
  const [emps, setEmps] = useState<Emp[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [deductions, setDeductions] = useState<Deduction[]>([]);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [stateF, setStateF] = useState("all");
  const [typeF, setTypeF] = useState<"all" | ItemType>("all");
  const [compF, setCompF] = useState<"all" | Compliance>("all");
  const [riskF, setRiskF] = useState<"all" | Risk>("all");
  const [view, setView] = useState("all");

  const [selected, setSelected] = useState<ComplianceItem | null>(null);

  async function loadAll() {
    setLoading(true);
    const [eRes, iRes, xRes, aRes, dRes, bRes] = await Promise.all([
      supabase.from("employees")
        .select("id,user_id,first_name,last_name,preferred_name,job_title,state,clinic,avatar_url,photo_url,hire_date,viventium_employee_id")
        .neq("status", "terminated").limit(500),
      supabase.from("payroll_issues").select("*").order("updated_at", { ascending: false }).limit(500),
      supabase.from("attendance_exceptions").select("*").order("occurred_on", { ascending: false }).limit(500),
      supabase.from("payroll_adjustments").select("*").order("updated_at", { ascending: false }).limit(500),
      supabase.from("payroll_deductions").select("*").order("updated_at", { ascending: false }).limit(500),
      supabase.from("payroll_benefits").select("*").order("updated_at", { ascending: false }).limit(500),
    ]);
    setEmps((eRes.data ?? []) as Emp[]);
    setIssues((iRes.data ?? []) as Issue[]);
    setExceptions((xRes.data ?? []) as Exception[]);
    setAdjustments((aRes.data ?? []) as Adjustment[]);
    setDeductions((dRes.data ?? []) as Deduction[]);
    setBenefits((bRes.data ?? []) as Benefit[]);
    setLoading(false);
  }
  useEffect(() => { loadAll(); }, []);

  const empById = useMemo(() => {
    const m = new Map<string, Emp>();
    for (const e of emps) m.set(e.id, e);
    return m;
  }, [emps]);

  /* ---------- Aggregate compliance items ---------- */
  const items: ComplianceItem[] = useMemo(() => {
    const list: ComplianceItem[] = [];
    const missingPat = /awaiting|pending|missing|signed|authorization|paperwork|need|request/i;

    // Payroll issues
    for (const i of issues) {
      if (i.status === "resolved" || i.status === "closed") continue;
      const risk: Risk =
        i.priority === "critical" ? "critical"
        : i.priority === "high" ? "high"
        : i.priority === "medium" ? "moderate" : "low";
      const comp: Compliance =
        i.status === "escalated" ? "escalated"
        : risk === "critical" ? "at_risk"
        : i.status === "pending" ? "review"
        : "review";
      const docs = missingPat.test(`${i.title} ${i.description ?? ""}`);
      list.push({
        key: `i-${i.id}`, source: docs ? "missing_docs" : "issue", source_id: i.id,
        employee_id: i.employee_id, title: i.title,
        subtitle: (i.description ?? "").slice(0, 120) || ITEM_LABEL.issue,
        notes: i.description, risk, compliance: comp,
        owner: (i.owner_role || "Payroll").replace(/_/g, " "),
        cycle: cycleLabel(i.due_date), due_date: i.due_date, updated_at: i.updated_at,
        docs_missing: docs,
      });
    }

    // Attendance exceptions (unresolved)
    for (const x of exceptions) {
      if (x.status === "resolved" || x.resolved_at) continue;
      const age = (Date.now() - new Date(x.occurred_on).getTime()) / 86400000;
      const risk: Risk = age > 10 ? "high" : age > 5 ? "moderate" : "low";
      list.push({
        key: `x-${x.id}`, source: "attendance", source_id: x.id,
        employee_id: x.employee_id,
        title: `Attendance: ${x.kind.replace(/_/g, " ")}`,
        subtitle: x.detail || `Occurred ${fmtDate(x.occurred_on)}`,
        notes: x.detail, risk,
        compliance: x.status === "pending_review" ? "review" : "missing",
        owner: "Payroll", cycle: cycleLabel(x.occurred_on),
        due_date: x.occurred_on, updated_at: x.updated_at,
        docs_missing: !x.resolution,
      });
    }

    // Pending payroll adjustments missing docs/notes
    for (const a of adjustments) {
      if (a.status === "applied" || a.status === "rejected") continue;
      const noNotes = !a.notes || a.notes.trim().length < 5;
      const noReason = !a.reason || a.reason.trim().length < 5;
      const risk: Risk = a.status === "pending" && (noNotes || noReason) ? "high"
        : a.status === "pending" ? "moderate" : "low";
      list.push({
        key: `a-${a.id}`, source: "adjustment", source_id: a.id,
        employee_id: a.employee_id,
        title: `Adjustment: ${a.adjustment_type.replace(/_/g, " ")}`,
        subtitle: a.reason || "Reason not documented",
        notes: a.notes, risk,
        compliance: noNotes || noReason ? "missing"
          : a.status === "pending" ? "review" : "waiting",
        owner: "Payroll", cycle: cycleLabel(a.updated_at),
        due_date: null, updated_at: a.updated_at,
        docs_missing: noNotes || noReason,
      });
    }

    // Deductions needing review
    for (const d of deductions) {
      const text = (d.notes || "").toLowerCase();
      const docs = missingPat.test(text);
      if (d.status === "active" && !docs) continue;
      const risk: Risk = d.status === "paused" ? "high" : docs ? "moderate" : "low";
      list.push({
        key: `d-${d.id}`, source: "deduction", source_id: d.id,
        employee_id: d.employee_id,
        title: `Deduction: ${d.deduction_type}`,
        subtitle: d.notes || `${d.frequency.replace(/_/g, " ")} · ${d.status}`,
        notes: d.notes, risk,
        compliance: d.status === "paused" ? "at_risk" : docs ? "missing" : "review",
        owner: "Payroll", cycle: cycleLabel(d.start_date),
        due_date: d.start_date, updated_at: d.updated_at,
        docs_missing: docs,
      });
    }

    // Benefits follow-up
    for (const b of benefits) {
      const text = (b.notes || "").toLowerCase();
      const docs = missingPat.test(text);
      if (b.status === "active" && !docs) continue;
      const risk: Risk = b.status === "pending" && docs ? "high"
        : b.status === "pending" ? "moderate" : "low";
      list.push({
        key: `b-${b.id}`, source: "benefit", source_id: b.id,
        employee_id: b.employee_id,
        title: `Benefits: ${b.benefit_type}${b.plan_name ? ` · ${b.plan_name}` : ""}`,
        subtitle: b.notes || `${b.status} enrollment`,
        notes: b.notes, risk,
        compliance: docs ? "missing" : b.status === "pending" ? "waiting" : "review",
        owner: "HR / Payroll", cycle: cycleLabel(b.effective_date),
        due_date: b.effective_date, updated_at: b.updated_at,
        docs_missing: docs,
      });
    }

    // Payroll setup gaps (missing viventium id on active employees with hire_date)
    for (const e of emps) {
      if (e.viventium_employee_id) continue;
      if (!e.hire_date) continue;
      const days = (Date.now() - new Date(e.hire_date).getTime()) / 86400000;
      if (days < 0 || days > 120) continue;
      const risk: Risk = days < 14 ? "moderate" : days < 30 ? "high" : "critical";
      list.push({
        key: `s-${e.id}`, source: "payroll_setup", source_id: e.id,
        employee_id: e.id,
        title: "Payroll setup incomplete",
        subtitle: "Viventium employee ID not yet linked",
        notes: null, risk,
        compliance: risk === "critical" ? "escalated" : "missing",
        owner: "Payroll", cycle: "Onboarding",
        due_date: e.hire_date, updated_at: e.hire_date || new Date().toISOString(),
        docs_missing: true,
      });
    }

    return list.sort((a, b) => {
      const order: Risk[] = ["critical", "high", "moderate", "low"];
      const r = order.indexOf(a.risk) - order.indexOf(b.risk);
      if (r !== 0) return r;
      return b.updated_at.localeCompare(a.updated_at);
    });
  }, [issues, exceptions, adjustments, deductions, benefits, emps]);

  /* ---------- Counts ---------- */
  const counts = useMemo(() => {
    let open = 0, missingDocs = 0, payrollRisks = 0, escalations = 0,
        attendance = 0, ptoExceptions = 0, benefitsFollowUp = 0;
    for (const it of items) {
      open++;
      if (it.docs_missing) missingDocs++;
      if (it.risk === "high" || it.risk === "critical") payrollRisks++;
      if (it.compliance === "escalated") escalations++;
      if (it.source === "attendance") attendance++;
      if (it.source === "benefit" || it.source === "deduction") benefitsFollowUp++;
    }
    // PTO exceptions = attendance items kinds related to time off
    for (const x of exceptions) {
      if (/pto|time_off|vacation/i.test(x.kind)) ptoExceptions++;
    }
    const empIdsAtRisk = new Set(items.filter(i => i.risk === "high" || i.risk === "critical").map(i => i.employee_id).filter(Boolean));
    const ready = Math.max(0, emps.length - empIdsAtRisk.size);
    return { open, missingDocs, payrollRisks, escalations, attendance, ptoExceptions, benefitsFollowUp, ready };
  }, [items, exceptions, emps]);

  const auditReadiness: { tone: Tone; label: string; pct: number } = useMemo(() => {
    if (emps.length === 0) return { tone: "muted", label: "—", pct: 0 };
    const pct = Math.round((counts.ready / emps.length) * 100);
    if (counts.escalations > 0) return { tone: "crit", label: "Blocked", pct };
    if (counts.missingDocs > 6) return { tone: "warn", label: "At risk", pct };
    if (counts.payrollRisks > 2) return { tone: "info", label: "Needs review", pct };
    return { tone: "ok", label: "Ready", pct };
  }, [counts, emps.length]);

  /* ---------- Filters ---------- */
  const states = useMemo(() => Array.from(new Set(emps.map(e => e.state).filter(Boolean))).sort() as string[], [emps]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return items.filter(it => {
      const e = it.employee_id ? empById.get(it.employee_id) : null;
      if (stateF !== "all" && e?.state !== stateF) return false;
      if (typeF !== "all" && it.source !== typeF) return false;
      if (compF !== "all" && it.compliance !== compF) return false;
      if (riskF !== "all" && it.risk !== riskF) return false;

      if (view === "missing" && !it.docs_missing) return false;
      if (view === "risks" && !(it.risk === "high" || it.risk === "critical")) return false;
      if (view === "escalations" && it.compliance !== "escalated") return false;
      if (view === "attendance" && it.source !== "attendance") return false;
      if (view === "benefits" && !(it.source === "benefit" || it.source === "deduction")) return false;
      if (view === "setup" && it.source !== "payroll_setup") return false;

      if (qq) {
        const hay = [e?.first_name, e?.last_name, e?.preferred_name, e?.state, e?.job_title,
          it.title, it.subtitle, it.notes].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(qq)) return false;
      }
      return true;
    });
  }, [items, empById, q, stateF, typeF, compF, riskF, view]);

  /* ---------- Section data ---------- */
  const docsItems = useMemo(() => items.filter(i => i.docs_missing).slice(0, 8), [items]);
  const riskItems = useMemo(() => items.filter(i => i.risk === "high" || i.risk === "critical").slice(0, 6), [items]);
  const followUps = useMemo(() => items.filter(i => i.compliance === "waiting" || i.compliance === "review").slice(0, 6), [items]);
  const escalations = useMemo(() => items.filter(i => i.compliance === "escalated").slice(0, 6), [items]);

  return (
    <OSShell>
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-8">
        <PageHeader
          icon={ShieldCheck}
          title="Payroll Compliance"
          subtitle="Monitor payroll operational compliance, payroll readiness, documentation, and workflow consistency."
        >
          <HeaderBtn icon={Users2} to="/payroll/profiles">Employee profiles</HeaderBtn>
          <HeaderBtn icon={Inbox} to="/payroll/queue">Payroll queue</HeaderBtn>
        </PageHeader>

        {/* Header indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
          <SumTile icon={ClipboardCheck} label="Compliance items" value={counts.open} tone="warn"
            hint="Open across payroll" active={view === "all"} onClick={() => setView("all")} />
          <SumTile icon={FileWarning} label="Missing documentation" value={counts.missingDocs} tone="warn"
            hint="Awaiting docs/notes" active={view === "missing"} onClick={() => setView(view === "missing" ? "all" : "missing")} />
          <SumTile icon={Flame} label="Payroll risks" value={counts.payrollRisks} tone="crit"
            hint="High & critical" active={view === "risks"} onClick={() => setView(view === "risks" ? "all" : "risks")} />
          <SumTile icon={Clock} label="Attendance issues" value={counts.attendance} tone="info"
            hint="Open exceptions" active={view === "attendance"} onClick={() => setView(view === "attendance" ? "all" : "attendance")} />
          <SumTile icon={AlertTriangle} label="Escalated" value={counts.escalations} tone="crit"
            hint="Need leadership" active={view === "escalations"} onClick={() => setView(view === "escalations" ? "all" : "escalations")} />
          <SumTile icon={CheckCircle2} label="Payroll-ready" value={counts.ready} tone="ok"
            hint={`of ${emps.length} employees`} active={false} onClick={() => setView("all")} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div>
            {/* Readiness */}
            <Card className="p-5 mb-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">Payroll readiness</p>
                  <h2 className="text-base font-semibold tracking-tight mt-0.5">Compliance & audit readiness</h2>
                </div>
                <Pill tone={auditReadiness.tone}>{auditReadiness.label}</Pill>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                <MiniStat label="Open compliance" value={counts.open} tone="warn" />
                <MiniStat label="Missing docs" value={counts.missingDocs} tone="warn" />
                <MiniStat label="Risks" value={counts.payrollRisks} tone="crit" />
                <MiniStat label="Escalations" value={counts.escalations} tone="crit" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] text-muted-foreground">Employees payroll-ready</p>
                  <p className="text-[11px] font-medium tracking-tight">{auditReadiness.pct}%</p>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all",
                      auditReadiness.tone === "ok" ? "bg-emerald-500"
                      : auditReadiness.tone === "info" ? "bg-blue-500"
                      : auditReadiness.tone === "warn" ? "bg-amber-500"
                      : "bg-destructive",
                    )}
                    style={{ width: `${auditReadiness.pct}%` }}
                  />
                </div>
              </div>
            </Card>

            {/* Filters */}
            <Card className="p-3 mb-5">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input value={q} onChange={e => setQ(e.target.value)}
                    placeholder="Search employee, item, owner…"
                    className="w-full h-9 pl-9 pr-8 rounded-xl bg-muted/50 border border-border/60 text-[13px] placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition" />
                  {q && <button onClick={() => setQ("")} className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 grid place-items-center rounded-lg hover:bg-muted">
                    <X className="h-3 w-3 text-muted-foreground" />
                  </button>}
                </div>
                <Select value={stateF} onChange={setStateF} options={[["all", "All states"], ...states.map(s => [s, s] as [string, string])]} />
                <Select value={typeF} onChange={(v) => setTypeF(v as any)} options={[
                  ["all", "All issue types"],
                  ["missing_docs", "Missing documentation"],
                  ["attendance", "Attendance review"],
                  ["adjustment", "Payroll adjustment"],
                  ["deduction", "Deduction review"],
                  ["benefit", "Benefits follow-up"],
                  ["payroll_setup", "Payroll setup"],
                  ["issue", "Payroll issue"],
                ]} />
                <Select value={compF} onChange={(v) => setCompF(v as any)} options={[
                  ["all", "All compliance"],
                  ["review", "Needs review"],
                  ["missing", "Missing info"],
                  ["waiting", "Waiting on employee"],
                  ["escalated", "Escalated"],
                  ["at_risk", "At risk"],
                  ["compliant", "Compliant"],
                  ["resolved", "Resolved"],
                ]} />
                <Select value={riskF} onChange={(v) => setRiskF(v as any)} options={[
                  ["all", "All risk"], ["low", "Low"], ["moderate", "Moderate"], ["high", "High"], ["critical", "Critical"],
                ]} />
              </div>
            </Card>

            {/* Compliance workflow queue */}
            <Card className="overflow-hidden">
              <div className="px-4 py-3 border-b border-border/70 flex items-center justify-between">
                <h2 className="text-[13px] font-medium tracking-tight">Compliance workflow queue</h2>
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
                <Empty icon={ShieldCheck} title="No compliance items match" hint="Try clearing a filter or switching view." />
              ) : (
                <ul className="divide-y divide-border/60">
                  {filtered.map(it => {
                    const e = it.employee_id ? empById.get(it.employee_id) : null;
                    const Icon = ITEM_ICON[it.source];
                    return (
                      <li key={it.key}>
                        <button onClick={() => setSelected(it)} className="w-full text-left px-4 py-3.5 hover:bg-muted/40 transition flex items-center gap-3">
                          <div className="h-9 w-9 shrink-0 rounded-xl bg-muted grid place-items-center text-[11.5px] font-medium overflow-hidden">
                            {e?.photo_url || e?.avatar_url
                              ? <img src={e.photo_url || e.avatar_url || ""} alt="" className="h-full w-full object-cover" />
                              : e ? initials(e) : <Icon className="h-4 w-4 text-muted-foreground" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="text-[14px] font-medium tracking-tight truncate">{e ? fullName(e) : "Unassigned"}</span>
                              <Pill tone={COMP_TONE[it.compliance]}>{COMP_LABEL[it.compliance]}</Pill>
                              <Pill tone={RISK_TONE[it.risk]}>{it.risk}</Pill>
                              <Pill tone="muted">{ITEM_LABEL[it.source]}</Pill>
                              {it.docs_missing && <Pill tone="warn">Docs missing</Pill>}
                            </div>
                            <p className="text-[12.5px] tracking-tight truncate">{it.title}</p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground mt-0.5">
                              <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{it.cycle}</span>
                              {e?.state && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{e.state}</span>}
                              <span>Owner · {it.owner}</span>
                              <span>· updated {relTime(it.updated_at)}</span>
                            </div>
                            {it.subtitle && <p className="text-[11.5px] text-muted-foreground truncate mt-1">{it.subtitle}</p>}
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            {/* Documentation + Risk monitoring */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <h3 className="text-[13px] font-medium tracking-tight">Documentation & audit readiness</h3>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{docsItems.length} open</span>
                </div>
                {docsItems.length === 0 ? (
                  <p className="text-[12px] text-muted-foreground">All payroll items have documentation logged.</p>
                ) : (
                  <ul className="space-y-2">
                    {docsItems.map(it => {
                      const e = it.employee_id ? empById.get(it.employee_id) : null;
                      return (
                        <li key={`doc-${it.key}`}>
                          <button onClick={() => setSelected(it)} className="w-full text-left rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/60 p-2.5 transition">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[12.5px] font-medium tracking-tight truncate">{e ? fullName(e) : "Unassigned"}</p>
                              <Pill tone="warn">Docs needed</Pill>
                            </div>
                            <p className="text-[11.5px] text-muted-foreground mt-0.5 truncate">
                              {it.title} · {ITEM_LABEL[it.source]}
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
                    <Flame className="h-3.5 w-3.5 text-destructive" />
                    <h3 className="text-[13px] font-medium tracking-tight">Payroll risk monitoring</h3>
                  </div>
                  <Link to="/payroll/issues" className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                    Issues <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
                {riskItems.length === 0 ? (
                  <p className="text-[12px] text-muted-foreground">No high or critical payroll risks detected.</p>
                ) : (
                  <ul className="space-y-2">
                    {riskItems.map(it => {
                      const e = it.employee_id ? empById.get(it.employee_id) : null;
                      return (
                        <li key={`risk-${it.key}`}>
                          <button onClick={() => setSelected(it)} className="w-full text-left rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/60 p-2.5 transition">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[12.5px] font-medium tracking-tight truncate">{e ? fullName(e) : "Unassigned"}</p>
                              <Pill tone={RISK_TONE[it.risk]}>{it.risk}</Pill>
                            </div>
                            <p className="text-[11.5px] text-muted-foreground mt-0.5 truncate">
                              {it.title} · {it.cycle}
                            </p>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            </div>

            {/* Follow-up + Escalations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                    <h3 className="text-[13px] font-medium tracking-tight">Follow-up & resolution</h3>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{followUps.length} pending</span>
                </div>
                {followUps.length === 0 ? (
                  <p className="text-[12px] text-muted-foreground">No follow-ups pending. Payroll is caught up.</p>
                ) : (
                  <ul className="space-y-2">
                    {followUps.map(it => {
                      const e = it.employee_id ? empById.get(it.employee_id) : null;
                      const d = daysUntil(it.due_date);
                      return (
                        <li key={`fu-${it.key}`}>
                          <button onClick={() => setSelected(it)} className="w-full text-left rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/60 p-2.5 transition">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[12.5px] font-medium tracking-tight truncate">{e ? fullName(e) : "Unassigned"}</p>
                              <Pill tone={d != null && d < 0 ? "crit" : "info"}>
                                {d == null ? "Open" : d < 0 ? `Overdue ${-d}d` : `${d}d`}
                              </Pill>
                            </div>
                            <p className="text-[11.5px] text-muted-foreground mt-0.5 truncate">
                              {it.title} · owner {it.owner}
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
                    <h3 className="text-[13px] font-medium tracking-tight">Escalations & compliance risks</h3>
                  </div>
                  <Link to="/payroll/queue" className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                    Queue <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
                {escalations.length === 0 ? (
                  <p className="text-[12px] text-muted-foreground">No escalated compliance items.</p>
                ) : (
                  <ul className="space-y-2">
                    {escalations.map(it => {
                      const e = it.employee_id ? empById.get(it.employee_id) : null;
                      return (
                        <li key={`es-${it.key}`}>
                          <button onClick={() => setSelected(it)} className="w-full text-left rounded-xl border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 p-2.5 transition">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[12.5px] font-medium tracking-tight truncate">{e ? fullName(e) : "Unassigned"}</p>
                              <Pill tone="crit">Escalated</Pill>
                            </div>
                            <p className="text-[11.5px] text-muted-foreground mt-0.5 truncate">
                              {it.title} · routed to {it.owner}
                            </p>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            </div>
          </div>

          {/* Right rail */}
          <aside className="space-y-4">
            <Card className="p-4">
              <h3 className="text-[13px] font-medium tracking-tight mb-3">Quick actions</h3>
              <div className="space-y-1">
                <RailLink icon={Plus} to="/payroll/adjustments?new=1">Create payroll adjustment</RailLink>
                <RailLink icon={FileText} to="/payroll/queue">Request documentation</RailLink>
                <RailLink icon={Flame} to="/payroll/issues">Escalate compliance concern</RailLink>
                <RailLink icon={Clock} to="/payroll/time-attendance">Review attendance</RailLink>
                <RailLink icon={Briefcase} to="/payroll/benefits">Benefits & deductions</RailLink>
                <RailLink icon={Users2} to="/payroll/profiles">Open employee profile</RailLink>
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
                  "What payroll compliance items are unresolved?",
                  "What documentation is missing for payroll?",
                  "Which employees are not payroll-ready?",
                  "What payroll follow-ups are overdue?",
                  "Summarize payroll risks for this cycle.",
                  "What attendance gaps could impact payroll?",
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

      {/* Drawer */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0 overflow-y-auto">
          {selected && (
            <ItemDrawer
              item={selected}
              emp={selected.employee_id ? empById.get(selected.employee_id) ?? null : null}
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
  item, emp, onClose, onChanged,
}: {
  item: ComplianceItem; emp: Emp | null;
  onClose: () => void; onChanged: () => void;
}) {
  const [comms, setComms] = useState<Comm[]>([]);
  const [note, setNote] = useState("");
  const [noteCat, setNoteCat] = useState("compliance");
  const [busy, setBusy] = useState(false);

  useEffect(() => { loadCommsSafe(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [item.key, emp?.id]);

  async function loadCommsSafe() {
    if (!emp) return;
    const { data } = await supabase.from("payroll_communications")
      .select("*").eq("employee_id", emp.id).order("created_at", { ascending: false }).limit(50);
    setComms((data ?? []) as Comm[]);
  }

  async function addNote() {
    if (!emp || !note.trim()) return;
    const { error } = await supabase.from("payroll_communications").insert({
      employee_id: emp.id, channel: "note" as any, direction: "internal" as any,
      category: noteCat,
      subject: `Compliance: ${item.title}`,
      body: note.trim(), status: "logged",
      created_by_name: "Payroll Coordinator",
    } as any);
    if (error) { toast.error("Could not save note"); return; }
    setNote("");
    toast.success("Compliance note recorded");
    loadCommsSafe();
  }

  async function markReviewed() {
    setBusy(true);
    try {
      if (item.source === "issue" || item.source === "missing_docs") {
        await supabase.from("payroll_issues").update({ status: "resolved" } as any).eq("id", item.source_id);
      } else if (item.source === "attendance") {
        await supabase.from("attendance_exceptions").update({ status: "resolved", resolved_at: new Date().toISOString() } as any).eq("id", item.source_id);
      } else if (item.source === "adjustment") {
        await supabase.from("payroll_adjustments").update({ status: "approved" } as any).eq("id", item.source_id);
      } else if (item.source === "deduction") {
        await supabase.from("payroll_deductions").update({ status: "active" } as any).eq("id", item.source_id);
      } else if (item.source === "benefit") {
        await supabase.from("payroll_benefits").update({ status: "active" } as any).eq("id", item.source_id);
      }
      toast.success("Marked reviewed");
      onChanged();
      onClose();
    } catch {
      toast.error("Update failed");
    } finally {
      setBusy(false);
    }
  }

  const checklist = [
    { label: "Documentation received", done: !item.docs_missing },
    { label: "Payroll reviewed", done: item.compliance === "resolved" || item.compliance === "compliant" },
    { label: "Attendance reviewed", done: item.source !== "attendance" || item.compliance === "resolved" },
    { label: "Adjustments confirmed", done: item.source !== "adjustment" || item.compliance !== "missing" },
    { label: "Communication logged", done: comms.length > 0 },
    { label: "Issue resolved", done: item.compliance === "resolved" },
  ];

  return (
    <div>
      <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/70">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Pill tone={COMP_TONE[item.compliance]}>{COMP_LABEL[item.compliance]}</Pill>
          <Pill tone={RISK_TONE[item.risk]}>{item.risk} risk</Pill>
          <Pill tone="muted">{ITEM_LABEL[item.source]}</Pill>
          {item.docs_missing && <Pill tone="warn">Docs missing</Pill>}
        </div>
        <SheetTitle className="text-lg font-semibold tracking-tight">{item.title}</SheetTitle>
        <p className="text-[12.5px] text-muted-foreground mt-1">{item.subtitle}</p>
      </SheetHeader>

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
        ) : <p className="text-[12px] text-muted-foreground">No employee linked.</p>}
      </Section>

      <Section title="Compliance overview">
        <div className="grid grid-cols-2 gap-2">
          <Detail label="Workflow" value={ITEM_LABEL[item.source]} />
          <Detail label="Payroll cycle" value={item.cycle} />
          <Detail label="Risk level" value={item.risk} />
          <Detail label="Owner" value={item.owner} />
          <Detail label="Due" value={fmtDate(item.due_date ?? undefined)} />
          <Detail label="Updated" value={relTime(item.updated_at)} />
        </div>
        {item.notes && (
          <div className="mt-3 rounded-xl border border-border/60 bg-muted/30 p-2.5">
            <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground mb-1">Notes</p>
            <p className="text-[12.5px] whitespace-pre-wrap">{item.notes}</p>
          </div>
        )}
      </Section>

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

      <Section title="Notes & communication">
        <div className="rounded-2xl border border-border/60 bg-muted/30 p-3 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[11.5px] uppercase tracking-wider text-muted-foreground">Log compliance note</span>
          </div>
          <textarea value={note} onChange={e => setNote(e.target.value)}
            placeholder="Who was contacted, what was discussed, documentation requested, next step, payroll impact…"
            rows={3}
            className="w-full rounded-xl bg-background border border-border/60 px-3 py-2 text-[13px] placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none" />
          <div className="flex items-center justify-between gap-2 mt-2">
            <Select small value={noteCat} onChange={setNoteCat} options={[
              ["compliance", "Compliance note"],
              ["documentation", "Documentation"],
              ["follow_up", "Follow-up"],
              ["call_log", "Call log"],
              ["escalation", "Escalation"],
              ["payroll_impact", "Payroll impact"],
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

      <div className="px-6 py-4 border-t border-border/70 flex flex-wrap items-center justify-end gap-2 sticky bottom-0 bg-card/95 backdrop-blur">
        <Link to={`/payroll/adjustments?employee=${emp?.id ?? ""}`}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[12.5px] border border-border/70 bg-card hover:bg-muted transition">
          <Plus className="h-3.5 w-3.5" /> Create adjustment
        </Link>
        <button onClick={markReviewed} disabled={busy || item.compliance === "resolved"}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[12.5px] bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition">
          <CheckCircle2 className="h-3.5 w-3.5" /> Mark reviewed
        </button>
      </div>
    </div>
  );
}

/* ---------------- Atoms ---------------- */
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
      <p className="text-[12.5px] font-medium tracking-tight mt-0.5 capitalize">{value}</p>
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