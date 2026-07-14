import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileCheck2, Search, X, ChevronRight, Sparkles, MapPin, Calendar,
  Inbox, Clock, AlertTriangle, Plus, MessageSquare, Send, CheckCircle2,
  ArrowUpRight, FileText, Users2, FileWarning, Flame, Wallet, ClipboardCheck,
  ShieldCheck, Briefcase, BadgeAlert, Upload, FolderOpen, Archive,
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
interface DocRow {
  id: string; employee_id: string;
  doc_type: string; name: string;
  status: "missing" | "requested" | "uploaded" | "verified" | "expired";
  required: boolean;
  storage_path: string | null;
  expires_on: string | null;
  uploaded_at: string | null;
  verified_at: string | null;
  notes: string | null;
  created_at: string;
}
interface Comm {
  id: string; employee_id: string | null; channel: string;
  direction: string; category: string; subject: string | null;
  body: string | null; status: string; created_by_name: string | null;
  created_at: string;
}

type RecordType =
  | "tax_form" | "w2" | "direct_deposit" | "payroll_auth"
  | "benefits" | "deduction" | "onboarding" | "other";

type DocStatus =
  | "complete" | "needs_review" | "waiting_employee"
  | "waiting_payroll" | "missing" | "escalated" | "resolved" | "archived";

type AuditRisk = "low" | "moderate" | "high" | "critical";

const RECORD_TYPE_LABEL: Record<RecordType, string> = {
  tax_form: "Payroll tax form",
  w2: "W-2 related",
  direct_deposit: "Direct deposit form",
  payroll_auth: "Payroll authorization",
  benefits: "Benefits documentation",
  deduction: "Deduction record",
  onboarding: "Onboarding payroll form",
  other: "Payroll record",
};

const STATUS_LABEL: Record<DocStatus, string> = {
  complete: "Complete",
  needs_review: "Needs review",
  waiting_employee: "Waiting on employee",
  waiting_payroll: "Waiting on payroll",
  missing: "Missing",
  escalated: "Escalated",
  resolved: "Resolved",
  archived: "Archived",
};
const STATUS_TONE: Record<DocStatus, Tone> = {
  complete: "ok",
  needs_review: "info",
  waiting_employee: "warn",
  waiting_payroll: "info",
  missing: "warn",
  escalated: "crit",
  resolved: "muted",
  archived: "muted",
};
const RISK_TONE: Record<AuditRisk, Tone> = {
  low: "muted", moderate: "info", high: "warn", critical: "crit",
};

function classifyType(doc_type: string): RecordType {
  if (doc_type === "w4_federal" || doc_type === "w4_state") return "tax_form";
  if (doc_type === "w2_election") return "w2";
  if (doc_type === "direct_deposit") return "direct_deposit";
  if (doc_type === "payroll_auth") return "payroll_auth";
  if (doc_type === "benefits_enroll") return "benefits";
  if (doc_type === "deduction_auth") return "deduction";
  if (doc_type === "i9" || doc_type === "onboarding_packet") return "onboarding";
  return "other";
}

function ageDays(iso?: string | null): number {
  if (!iso) return 0;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

function classifyStatus(d: DocRow): DocStatus {
  if (d.status === "verified") return "complete";
  if (d.status === "expired") return "escalated";
  if (d.status === "uploaded") return "waiting_payroll";
  if (d.status === "requested") return "waiting_employee";
  // missing
  const age = ageDays(d.created_at);
  if (d.required && age > 21) return "escalated";
  return "missing";
}

function classifyRisk(d: DocRow): AuditRisk {
  if (d.status === "verified") return "low";
  if (d.status === "expired") return d.required ? "critical" : "high";
  if (d.status === "missing") {
    const age = ageDays(d.created_at);
    if (!d.required) return "low";
    if (age > 21) return "critical";
    if (age > 10) return "high";
    return "moderate";
  }
  if (d.status === "requested") {
    const age = ageDays(d.created_at);
    if (d.required && age > 14) return "high";
    return "moderate";
  }
  if (d.status === "uploaded") return "moderate"; // payroll review needed
  return "low";
}

function cycleLabel(d?: string | null) {
  if (!d) return "Unscheduled";
  const days = Math.floor((new Date(d).getTime() - Date.now()) / 86400000);
  if (days < -1) return `Overdue ${-days}d`;
  if (days < 14) return "Current cycle";
  if (days < 28) return "Next cycle";
  return "Future cycle";
}

function relTime(iso?: string | null) {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000); if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); return d < 30 ? `${d}d ago` : fmtDate(iso);
}
function initials(e: Emp) {
  return `${(e.preferred_name || e.first_name || "?")[0] || "?"}${(e.last_name || "")[0] || ""}`.toUpperCase();
}

/* ---------------- Page ---------------- */
export default function OSPayrollTaxDocuments() {
  const [emps, setEmps] = useState<Emp[]>([]);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [stateF, setStateF] = useState("all");
  const [typeF, setTypeF] = useState<"all" | RecordType>("all");
  const [statusF, setStatusF] = useState<"all" | DocStatus>("all");
  const [riskF, setRiskF] = useState<"all" | AuditRisk>("all");
  const [view, setView] = useState("all");

  const [selected, setSelected] = useState<DocRow | null>(null);

  async function loadAll() {
    setLoading(true);
    const [eRes, dRes] = await Promise.all([
      supabase.from("employees")
        .select("id,user_id,first_name,last_name,preferred_name,job_title,state,clinic,avatar_url,photo_url,hire_date,viventium_employee_id")
        .neq("status", "terminated").limit(500),
      supabase.from("employee_documents_hr")
        .select("*").order("created_at", { ascending: false }).limit(800),
    ]);
    setEmps((eRes.data ?? []) as Emp[]);
    setDocs((dRes.data ?? []) as DocRow[]);
    setLoading(false);
  }
  useEffect(() => { loadAll(); }, []);

  const empById = useMemo(() => {
    const m = new Map<string, Emp>(); for (const e of emps) m.set(e.id, e); return m;
  }, [emps]);

  /* ---------- Enriched docs ---------- */
  const enriched = useMemo(() => {
    return docs.map(d => ({
      ...d,
      _type: classifyType(d.doc_type),
      _status: classifyStatus(d),
      _risk: classifyRisk(d),
    }));
  }, [docs]);

  /* ---------- Counts ---------- */
  const counts = useMemo(() => {
    let missing = 0, needsReview = 0, waitingEmp = 0, risks = 0,
        escalated = 0, complete = 0;
    const empNeeds = new Set<string>();
    for (const d of enriched) {
      if (d._status === "missing") { missing++; empNeeds.add(d.employee_id); }
      if (d._status === "needs_review" || d._status === "waiting_payroll") needsReview++;
      if (d._status === "waiting_employee") { waitingEmp++; empNeeds.add(d.employee_id); }
      if (d._risk === "high" || d._risk === "critical") risks++;
      if (d._status === "escalated") { escalated++; empNeeds.add(d.employee_id); }
      if (d._status === "complete") complete++;
    }
    return { missing, needsReview, waitingEmp, risks, escalated, complete, followUps: empNeeds.size };
  }, [enriched]);

  const auditReadiness: { tone: Tone; label: string; pct: number } = useMemo(() => {
    const total = enriched.length || 1;
    const pct = Math.round((counts.complete / total) * 100);
    if (counts.escalated > 0) return { tone: "crit", label: "Blocked", pct };
    if (counts.missing > 6) return { tone: "warn", label: "At risk", pct };
    if (counts.risks > 2) return { tone: "info", label: "Needs review", pct };
    return { tone: "ok", label: "Ready", pct };
  }, [counts, enriched.length]);

  /* ---------- Filters ---------- */
  const states = useMemo(() => Array.from(new Set(emps.map(e => e.state).filter(Boolean))).sort() as string[], [emps]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return enriched.filter(d => {
      const e = empById.get(d.employee_id);
      if (stateF !== "all" && e?.state !== stateF) return false;
      if (typeF !== "all" && d._type !== typeF) return false;
      if (statusF !== "all" && d._status !== statusF) return false;
      if (riskF !== "all" && d._risk !== riskF) return false;

      if (view === "missing" && d._status !== "missing") return false;
      if (view === "review" && !(d._status === "needs_review" || d._status === "waiting_payroll")) return false;
      if (view === "waiting" && d._status !== "waiting_employee") return false;
      if (view === "risks" && !(d._risk === "high" || d._risk === "critical")) return false;
      if (view === "escalated" && d._status !== "escalated") return false;
      if (view === "complete" && d._status !== "complete") return false;

      if (qq) {
        const hay = [e?.first_name, e?.last_name, e?.preferred_name, e?.state, e?.job_title,
          d.name, d.doc_type, d.notes].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(qq)) return false;
      }
      return true;
    }).sort((a, b) => {
      const order: AuditRisk[] = ["critical", "high", "moderate", "low"];
      const r = order.indexOf(a._risk) - order.indexOf(b._risk);
      if (r !== 0) return r;
      return (b.created_at || "").localeCompare(a.created_at || "");
    });
  }, [enriched, empById, q, stateF, typeF, statusF, riskF, view]);

  /* ---------- Section data ---------- */
  const missingItems = useMemo(() => enriched.filter(d => d._status === "missing" || d._status === "escalated").slice(0, 8), [enriched]);
  const riskItems = useMemo(() => enriched.filter(d => d._risk === "high" || d._risk === "critical").slice(0, 6), [enriched]);
  const followUps = useMemo(() => enriched.filter(d => d._status === "waiting_employee" || d._status === "waiting_payroll").slice(0, 6), [enriched]);
  const escalations = useMemo(() => enriched.filter(d => d._status === "escalated").slice(0, 6), [enriched]);

  /* ---------- Employee tax record status ---------- */
  const employeeStatuses = useMemo(() => {
    const byEmp = new Map<string, typeof enriched>();
    for (const d of enriched) {
      if (!byEmp.has(d.employee_id)) byEmp.set(d.employee_id, [] as any);
      byEmp.get(d.employee_id)!.push(d);
    }
    const rows: Array<{
      emp: Emp; total: number; complete: number;
      missing: number; review: number; status: DocStatus; risk: AuditRisk;
    }> = [];
    for (const [empId, list] of byEmp) {
      const emp = empById.get(empId); if (!emp) continue;
      const complete = list.filter(d => d._status === "complete").length;
      const missing = list.filter(d => d._status === "missing" || d._status === "escalated").length;
      const review = list.filter(d => d._status === "needs_review" || d._status === "waiting_payroll" || d._status === "waiting_employee").length;
      const hasEsc = list.some(d => d._status === "escalated");
      const hasMissing = missing > 0;
      const status: DocStatus = hasEsc ? "escalated" : hasMissing ? "missing" : review > 0 ? "needs_review" : "complete";
      const maxRisk: AuditRisk = list.reduce<AuditRisk>((r, d) => {
        const order: AuditRisk[] = ["low", "moderate", "high", "critical"];
        return order.indexOf(d._risk) > order.indexOf(r) ? d._risk : r;
      }, "low");
      rows.push({ emp, total: list.length, complete, missing, review, status, risk: maxRisk });
    }
    return rows.sort((a, b) => {
      const order: AuditRisk[] = ["critical", "high", "moderate", "low"];
      return order.indexOf(a.risk) - order.indexOf(b.risk);
    });
  }, [enriched, empById]);

  return (
    <OSShell>
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-8">
        <PageHeader
          icon={FileCheck2}
          title="Tax Documents & Records"
          subtitle="Centralized payroll document visibility, payroll records, and operational tax documentation workflows."
        >
          <HeaderBtn icon={ShieldCheck} to="/payroll/compliance">Compliance</HeaderBtn>
          <HeaderBtn icon={Users2} to="/payroll/profiles">Employee profiles</HeaderBtn>
        </PageHeader>

        {/* Summary tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
          <SumTile icon={FileWarning} label="Missing documents" value={counts.missing} tone="warn"
            hint="Payroll-related employee records" active={view === "missing"} onClick={() => setView(view === "missing" ? "all" : "missing")} />
          <SumTile icon={ClipboardCheck} label="Pending review" value={counts.needsReview} tone="info"
            hint="Uploaded · awaiting payroll" active={view === "review"} onClick={() => setView(view === "review" ? "all" : "review")} />
          <SumTile icon={MessageSquare} label="Follow-ups needed" value={counts.followUps} tone="warn"
            hint="Employees requiring outreach" active={view === "waiting"} onClick={() => setView(view === "waiting" ? "all" : "waiting")} />
          <SumTile icon={Flame} label="Audit risks" value={counts.risks} tone="crit"
            hint="High & critical risk" active={view === "risks"} onClick={() => setView(view === "risks" ? "all" : "risks")} />
          <SumTile icon={AlertTriangle} label="Escalated" value={counts.escalated} tone="crit"
            hint="Overdue / expired" active={view === "escalated"} onClick={() => setView(view === "escalated" ? "all" : "escalated")} />
          <SumTile icon={CheckCircle2} label="Payroll ready" value={counts.complete} tone="ok"
            hint="Verified records" active={view === "complete"} onClick={() => setView(view === "complete" ? "all" : "complete")} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div>
            {/* Audit readiness */}
            <Card className="p-5 mb-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">Audit readiness</p>
                  <h2 className="text-base font-semibold tracking-tight mt-0.5">Documentation & payroll record health</h2>
                </div>
                <Pill tone={auditReadiness.tone}>{auditReadiness.label}</Pill>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                <MiniStat label="Missing" value={counts.missing} tone="warn" />
                <MiniStat label="Needs review" value={counts.needsReview} tone="info" />
                <MiniStat label="Risks" value={counts.risks} tone="crit" />
                <MiniStat label="Escalated" value={counts.escalated} tone="crit" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] text-muted-foreground">Records verified</p>
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
                    placeholder="Search employee, document, notes…"
                    className="w-full h-9 pl-9 pr-8 rounded-xl bg-muted/50 border border-border/60 text-[13px] placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition" />
                  {q && <button onClick={() => setQ("")} className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 grid place-items-center rounded-lg hover:bg-muted">
                    <X className="h-3 w-3 text-muted-foreground" />
                  </button>}
                </div>
                <Select value={stateF} onChange={setStateF} options={[["all", "All states"], ...states.map(s => [s, s] as [string, string])]} />
                <Select value={typeF} onChange={(v) => setTypeF(v as any)} options={[
                  ["all", "All record types"],
                  ["tax_form", "Payroll tax form"],
                  ["w2", "W-2 related"],
                  ["direct_deposit", "Direct deposit"],
                  ["payroll_auth", "Payroll authorization"],
                  ["benefits", "Benefits documentation"],
                  ["deduction", "Deduction record"],
                  ["onboarding", "Onboarding payroll"],
                ]} />
                <Select value={statusF} onChange={(v) => setStatusF(v as any)} options={[
                  ["all", "All statuses"],
                  ["complete", "Complete"],
                  ["needs_review", "Needs review"],
                  ["waiting_payroll", "Waiting on payroll"],
                  ["waiting_employee", "Waiting on employee"],
                  ["missing", "Missing"],
                  ["escalated", "Escalated"],
                  ["resolved", "Resolved"],
                ]} />
                <Select value={riskF} onChange={(v) => setRiskF(v as any)} options={[
                  ["all", "All risk"], ["low", "Low"], ["moderate", "Moderate"], ["high", "High"], ["critical", "Critical"],
                ]} />
              </div>
            </Card>

            {/* Payroll records library */}
            <Card className="overflow-hidden">
              <div className="px-4 py-3 border-b border-border/70 flex items-center justify-between">
                <h2 className="text-[13px] font-medium tracking-tight">Payroll records library</h2>
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
                <Empty icon={FolderOpen} title="No payroll records match" hint="Try clearing a filter or switching view." />
              ) : (
                <ul className="divide-y divide-border/60">
                  {filtered.map(d => {
                    const e = empById.get(d.employee_id);
                    return (
                      <li key={d.id}>
                        <button onClick={() => setSelected(d)} className="w-full text-left px-4 py-3.5 hover:bg-muted/40 transition flex items-center gap-3">
                          <div className="h-9 w-9 shrink-0 rounded-xl bg-muted grid place-items-center text-[11.5px] font-medium overflow-hidden">
                            {e?.photo_url || e?.avatar_url
                              ? <img src={e.photo_url || e.avatar_url || ""} alt="" className="h-full w-full object-cover" />
                              : e ? initials(e) : <FileText className="h-4 w-4 text-muted-foreground" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="text-[14px] font-medium tracking-tight truncate">{e ? fullName(e) : "Unassigned"}</span>
                              <Pill tone={STATUS_TONE[d._status]}>{STATUS_LABEL[d._status]}</Pill>
                              <Pill tone={RISK_TONE[d._risk]}>{d._risk}</Pill>
                              <Pill tone="muted">{RECORD_TYPE_LABEL[d._type]}</Pill>
                              {d.required && <Pill tone="info">Required</Pill>}
                            </div>
                            <p className="text-[12.5px] tracking-tight truncate">{d.name}</p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground mt-0.5">
                              <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{cycleLabel(d.expires_on || d.created_at)}</span>
                              {e?.state && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{e.state}</span>}
                              <span>Uploaded · {d.uploaded_at ? relTime(d.uploaded_at) : "not yet"}</span>
                              <span>· {relTime(d.created_at)}</span>
                            </div>
                            {d.notes && <p className="text-[11.5px] text-muted-foreground truncate mt-1">{d.notes}</p>}
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            {/* Missing documentation queue + Risk monitor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileWarning className="h-3.5 w-3.5 text-amber-600" />
                    <h3 className="text-[13px] font-medium tracking-tight">Missing documentation queue</h3>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{missingItems.length} open</span>
                </div>
                {missingItems.length === 0 ? (
                  <p className="text-[12px] text-muted-foreground">No missing payroll documentation.</p>
                ) : (
                  <ul className="space-y-2">
                    {missingItems.map(d => {
                      const e = empById.get(d.employee_id);
                      return (
                        <li key={`miss-${d.id}`}>
                          <button onClick={() => setSelected(d)} className="w-full text-left rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/60 p-2.5 transition">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[12.5px] font-medium tracking-tight truncate">{e ? fullName(e) : "Unassigned"}</p>
                              <Pill tone={STATUS_TONE[d._status]}>{STATUS_LABEL[d._status]}</Pill>
                            </div>
                            <p className="text-[11.5px] text-muted-foreground mt-0.5 truncate">
                              {d.name} · {RECORD_TYPE_LABEL[d._type]}
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
                    <h3 className="text-[13px] font-medium tracking-tight">Audit risks</h3>
                  </div>
                  <Link to="/payroll/compliance" className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                    Compliance <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
                {riskItems.length === 0 ? (
                  <p className="text-[12px] text-muted-foreground">No high or critical audit risks detected.</p>
                ) : (
                  <ul className="space-y-2">
                    {riskItems.map(d => {
                      const e = empById.get(d.employee_id);
                      return (
                        <li key={`risk-${d.id}`}>
                          <button onClick={() => setSelected(d)} className="w-full text-left rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/60 p-2.5 transition">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[12.5px] font-medium tracking-tight truncate">{e ? fullName(e) : "Unassigned"}</p>
                              <Pill tone={RISK_TONE[d._risk]}>{d._risk}</Pill>
                            </div>
                            <p className="text-[11.5px] text-muted-foreground mt-0.5 truncate">
                              {d.name} · {STATUS_LABEL[d._status]}
                            </p>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            </div>

            {/* Employee Tax Record Status */}
            <Card className="mt-4 overflow-hidden">
              <div className="px-4 py-3 border-b border-border/70 flex items-center justify-between">
                <h3 className="text-[13px] font-medium tracking-tight">Employee tax record status</h3>
                <span className="text-[11px] text-muted-foreground">{employeeStatuses.length} employees</span>
              </div>
              {employeeStatuses.length === 0 ? (
                <Empty icon={Users2} title="No employee records yet" hint="Records will appear as payroll documentation is uploaded." />
              ) : (
                <ul className="divide-y divide-border/60">
                  {employeeStatuses.slice(0, 12).map(r => (
                    <li key={r.emp.id} className="px-4 py-3 flex items-center gap-3">
                      <div className="h-8 w-8 shrink-0 rounded-xl bg-muted grid place-items-center text-[11px] font-medium overflow-hidden">
                        {r.emp.photo_url || r.emp.avatar_url
                          ? <img src={r.emp.photo_url || r.emp.avatar_url || ""} alt="" className="h-full w-full object-cover" />
                          : initials(r.emp)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-medium tracking-tight truncate">{fullName(r.emp)}</span>
                          <Pill tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Pill>
                          {r.risk !== "low" && <Pill tone={RISK_TONE[r.risk]}>{r.risk}</Pill>}
                        </div>
                        <p className="text-[11.5px] text-muted-foreground mt-0.5">
                          {r.complete}/{r.total} verified · {r.missing} missing · {r.review} in review
                          {r.emp.state && ` · ${r.emp.state}`}
                        </p>
                      </div>
                      <Link to={`/payroll/profiles?employee=${r.emp.id}`}
                        className="text-[11.5px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                        Profile <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Follow-ups + Escalations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                    <h3 className="text-[13px] font-medium tracking-tight">Communication & follow-up</h3>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{followUps.length} pending</span>
                </div>
                {followUps.length === 0 ? (
                  <p className="text-[12px] text-muted-foreground">No outstanding follow-ups.</p>
                ) : (
                  <ul className="space-y-2">
                    {followUps.map(d => {
                      const e = empById.get(d.employee_id);
                      const age = ageDays(d.created_at);
                      return (
                        <li key={`fu-${d.id}`}>
                          <button onClick={() => setSelected(d)} className="w-full text-left rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/60 p-2.5 transition">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[12.5px] font-medium tracking-tight truncate">{e ? fullName(e) : "Unassigned"}</p>
                              <Pill tone={age > 14 ? "crit" : "info"}>{age}d open</Pill>
                            </div>
                            <p className="text-[11.5px] text-muted-foreground mt-0.5 truncate">
                              {d.name} · {STATUS_LABEL[d._status]}
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
                    <h3 className="text-[13px] font-medium tracking-tight">Escalations & risks</h3>
                  </div>
                  <Link to="/payroll/queue" className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                    Queue <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
                {escalations.length === 0 ? (
                  <p className="text-[12px] text-muted-foreground">No escalated documentation items.</p>
                ) : (
                  <ul className="space-y-2">
                    {escalations.map(d => {
                      const e = empById.get(d.employee_id);
                      return (
                        <li key={`es-${d.id}`}>
                          <button onClick={() => setSelected(d)} className="w-full text-left rounded-xl border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 p-2.5 transition">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[12.5px] font-medium tracking-tight truncate">{e ? fullName(e) : "Unassigned"}</p>
                              <Pill tone="crit">Escalated</Pill>
                            </div>
                            <p className="text-[11.5px] text-muted-foreground mt-0.5 truncate">
                              {d.name} · routed to Payroll
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
                <RailLink icon={Upload} to="/payroll/queue">Upload payroll record</RailLink>
                <RailLink icon={FileText} to="/payroll/queue">Request documentation</RailLink>
                <RailLink icon={Plus} to="/payroll/adjustments?new=1">Add payroll note</RailLink>
                <RailLink icon={Flame} to="/payroll/compliance">Escalate concern</RailLink>
                <RailLink icon={Users2} to="/payroll/profiles">Open employee profile</RailLink>
                <RailLink icon={FileWarning} to="#" onClick={() => setView("missing")}>Review missing documents</RailLink>
                <RailLink icon={Archive} to="/payroll/compliance">Open payroll compliance</RailLink>
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
                  "What payroll documents are missing?",
                  "Which employees need follow-up on tax forms?",
                  "What payroll records are incomplete?",
                  "What payroll documentation risks exist?",
                  "Which records are overdue or escalated?",
                  "What records affect payroll readiness this cycle?",
                  "Summarize unresolved payroll documentation.",
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
          {selected && (() => {
            const e = empById.get(selected.employee_id) ?? null;
            const enrichedSel = enriched.find(x => x.id === selected.id)!;
            return (
              <RecordDrawer
                doc={enrichedSel}
                emp={e}
                onClose={() => setSelected(null)}
                onChanged={loadAll}
              />
            );
          })()}
        </SheetContent>
      </Sheet>
    </OSShell>
  );
}

/* ---------------- Drawer ---------------- */
function RecordDrawer({
  doc, emp, onClose, onChanged,
}: {
  doc: DocRow & { _type: RecordType; _status: DocStatus; _risk: AuditRisk };
  emp: Emp | null;
  onClose: () => void; onChanged: () => void;
}) {
  const [comms, setComms] = useState<Comm[]>([]);
  const [note, setNote] = useState("");
  const [noteCat, setNoteCat] = useState("documentation");
  const [busy, setBusy] = useState(false);

  useEffect(() => { loadComms(); /* eslint-disable-next-line */ }, [doc.id, emp?.id]);

  async function loadComms() {
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
      subject: `Tax doc: ${doc.name}`,
      body: note.trim(), status: "logged",
      created_by_name: "Payroll Coordinator",
    } as any);
    if (error) { toast.error("Could not save note"); return; }
    setNote("");
    toast.success("Documentation note recorded");
    loadComms();
  }

  async function markReviewed() {
    setBusy(true);
    try {
      const { error } = await supabase.from("employee_documents_hr").update({
        status: "verified", verified_at: new Date().toISOString(),
      }).eq("id", doc.id);
      if (error) throw error;
      toast.success("Marked as verified");
      onChanged();
      onClose();
    } catch {
      toast.error("Could not update record");
    } finally {
      setBusy(false);
    }
  }

  async function requestDocs() {
    if (!emp) return;
    setBusy(true);
    try {
      const [u1, u2] = await Promise.all([
        supabase.from("employee_documents_hr").update({ status: "requested" }).eq("id", doc.id),
        supabase.from("payroll_communications").insert({
          employee_id: emp.id, channel: "email" as any, direction: "outbound" as any,
          category: "documentation",
          subject: `Documentation requested: ${doc.name}`,
          body: `Requested ${doc.name} from employee for payroll documentation completeness.`,
          status: "logged", created_by_name: "Payroll Coordinator",
        } as any),
      ]);
      if (u1.error || u2.error) throw u1.error ?? u2.error;
      toast.success("Documentation request logged");
      onChanged();
      loadComms();
    } catch {
      toast.error("Could not request documentation");
    } finally {
      setBusy(false);
    }
  }

  const checklist = [
    { label: "Documentation received", done: doc.status === "uploaded" || doc.status === "verified" },
    { label: "Payroll reviewed", done: doc.status === "verified" },
    { label: "Follow-up completed", done: comms.length > 0 },
    { label: "Issue resolved", done: doc._status === "complete" || doc._status === "resolved" },
    { label: "Audit-ready", done: doc.status === "verified" && !!doc.uploaded_at },
  ];

  return (
    <div>
      <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/70">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Pill tone={STATUS_TONE[doc._status]}>{STATUS_LABEL[doc._status]}</Pill>
          <Pill tone={RISK_TONE[doc._risk]}>{doc._risk} risk</Pill>
          <Pill tone="muted">{RECORD_TYPE_LABEL[doc._type]}</Pill>
          {doc.required && <Pill tone="info">Required</Pill>}
        </div>
        <SheetTitle className="text-lg font-semibold tracking-tight">{doc.name}</SheetTitle>
        <p className="text-[12.5px] text-muted-foreground mt-1">
          {doc.doc_type.replace(/_/g, " ")} · created {relTime(doc.created_at)}
        </p>
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

      <Section title="Record overview">
        <div className="grid grid-cols-2 gap-2">
          <Detail label="Record type" value={RECORD_TYPE_LABEL[doc._type]} />
          <Detail label="Doc status" value={doc.status} />
          <Detail label="Uploaded" value={doc.uploaded_at ? fmtDate(doc.uploaded_at) : "—"} />
          <Detail label="Verified" value={doc.verified_at ? fmtDate(doc.verified_at) : "—"} />
          <Detail label="Expires" value={doc.expires_on ? fmtDate(doc.expires_on) : "—"} />
          <Detail label="Required" value={doc.required ? "Yes" : "No"} />
        </div>
        {doc.notes && (
          <div className="mt-3 rounded-xl border border-border/60 bg-muted/30 p-2.5">
            <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground mb-1">Documentation notes</p>
            <p className="text-[12.5px] whitespace-pre-wrap">{doc.notes}</p>
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
            <span className="text-[11.5px] uppercase tracking-wider text-muted-foreground">Log documentation note</span>
          </div>
          <textarea value={note} onChange={e => setNote(e.target.value)}
            placeholder="Who was contacted, what was discussed, documentation requested, next follow-up, due date…"
            rows={3}
            className="w-full rounded-xl bg-background border border-border/60 px-3 py-2 text-[13px] placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none" />
          <div className="flex items-center justify-between gap-2 mt-2">
            <Select small value={noteCat} onChange={setNoteCat} options={[
              ["documentation", "Documentation"],
              ["follow_up", "Follow-up"],
              ["call_log", "Call log"],
              ["escalation", "Escalation"],
              ["payroll_impact", "Payroll impact"],
              ["audit_note", "Audit note"],
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
        <button onClick={requestDocs} disabled={busy || !emp}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[12.5px] border border-border/70 bg-card hover:bg-muted transition disabled:opacity-40">
          <FileText className="h-3.5 w-3.5" /> Request documentation
        </button>
        <button onClick={markReviewed} disabled={busy || doc.status === "verified"}
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
function RailLink({ icon: Icon, to, children, onClick }: { icon: any; to: string; children: React.ReactNode; onClick?: () => void }) {
  if (to === "#" && onClick) {
    return (
      <button onClick={onClick} className="w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-[12.5px] text-foreground hover:bg-muted transition text-left">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
        <span className="flex-1">{children}</span>
        <ChevronRight className="h-3 w-3 text-muted-foreground" />
      </button>
    );
  }
  return (
    <Link to={to} className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-[12.5px] text-foreground hover:bg-muted transition">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
      <span className="flex-1">{children}</span>
      <ChevronRight className="h-3 w-3 text-muted-foreground" />
    </Link>
  );
}