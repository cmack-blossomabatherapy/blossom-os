import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck, Sparkles, Search, Filter, Upload, Send, CheckCircle2,
  AlertCircle, ChevronRight, X, FileText, FileCheck2, Award, Clock,
  MessageSquare, ArrowRight, UserCheck, Download, FileWarning, BellRing,
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
import { getHrReadinessBlockers } from "@/lib/hr/readiness";
import { useOperatorDialogs } from "@/components/os/OperatorDialogs";

/* ---------------- types ---------------- */
interface Doc {
  id: string; employee_id: string; doc_type: string; name: string;
  status: string; required: boolean; expires_on: string | null;
  uploaded_at: string | null; verified_at: string | null; notes: string | null;
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
interface Training {
  id: string; employee_id: string; course_id: string; status: string;
  due_date: string | null; expires_on: string | null; completed_at: string | null;
}
interface Course { id: string; title: string; }

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
function QuickAction({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <button className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-[12px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} /> {label}
    </button>
  );
}

/* ---------------- helpers ---------------- */
const DOC_STATUS_LABEL: Record<string, string> = {
  missing: "Missing",
  requested: "Requested",
  uploaded: "Pending review",
  verified: "Verified",
  expired: "Expired",
};

function docStatusTone(s: string, expires: string | null): Tone {
  if (s === "missing" || s === "expired") return "crit";
  if (s === "requested") return "warn";
  if (s === "uploaded") return "info";
  if (s === "verified") {
    const d = expiresInDays(expires);
    if (d != null && d < 0) return "crit";
    if (d != null && d <= 30) return "warn";
    return "ok";
  }
  return "muted";
}
function expiresInDays(d: string | null): number | null {
  if (!d) return null;
  return Math.round((new Date(d + "T00:00:00").getTime() - Date.now()) / 86400000);
}
function fmtDate(d: string | null) {
  if (!d) return "—";
  try { return new Date(d + (d.length === 10 ? "T00:00:00" : "")).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }
  catch { return d; }
}
function relTime(iso: string | null) {
  if (!iso) return "—";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "1d ago";
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}
function isCertDoc(t: string) { return /cert|rbt|cpr|bcba|bls|license/i.test(t); }
function isOnboardingDoc(t: string) { return /onboard|i-?9|w-?[24]|form|ack|policy|handbook|direct.?deposit/i.test(t); }
function isBgCheckDoc(t: string) { return /background|bg.?check|fingerprint|clear/i.test(t); }

/* ---------------- data ---------------- */
function useData(reloadKey = 0) {
  const [s, set] = useState({
    docs: [] as Doc[],
    employees: [] as Employee[],
    onboarding: [] as Onboarding[],
    trainings: [] as Training[],
    courses: [] as Course[],
    loading: true,
  });
  useEffect(() => {
    let cancel = false;
    (async () => {
      const [dq, eq, oq, tq, cq] = await Promise.all([
        supabase.from("employee_documents_hr").select("*").order("expires_on", { nullsFirst: false }),
        supabase.from("employees").select("id,first_name,last_name,job_title,state,status,start_date").order("last_name"),
        supabase.from("employee_onboarding").select("id,employee_id,status,blockers,viventium_status,viventium_synced_at,viventium_notes,stellar_status,stellar_synced_at,stellar_notes,centralreach_status,centralreach_synced_at,centralreach_notes"),
        supabase.from("employee_trainings").select("id,employee_id,course_id,status,due_date,expires_on,completed_at"),
        supabase.from("training_courses").select("id,title"),
      ]);
      if (cancel) return;
      set({
        docs: (dq.data ?? []) as Doc[],
        employees: (eq.data ?? []) as Employee[],
        onboarding: (oq.data ?? []) as Onboarding[],
        trainings: (tq.data ?? []) as Training[],
        courses: (cq.data ?? []) as Course[],
        loading: false,
      });
    })();
    return () => { cancel = true; };
  }, [reloadKey]);
  return s;
}

/* ---------------- page ---------------- */
type Tab = "all" | "onboarding" | "certifications" | "background" | "missing" | "expiring" | "pending";

export default function OSHRCompliance() {
  const { promptOperator } = useOperatorDialogs();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [reloadKey, setReloadKey] = useState(0);
  const d = useData(reloadKey);
  const refresh = () => setReloadKey(k => k + 1);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [openEmpId, setOpenEmpId] = useState<string | null>(null);

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
  const docsByEmp = useMemo(() => {
    const m = new Map<string, Doc[]>();
    d.docs.forEach(x => {
      const arr = m.get(x.employee_id) ?? [];
      arr.push(x); m.set(x.employee_id, arr);
    });
    return m;
  }, [d.docs]);
  const courseById = useMemo(() => Object.fromEntries(d.courses.map(c => [c.id, c])), [d.courses]);

  /* readiness per employee */
  const readinessByEmp = useMemo(() => {
    const m = new Map<string, { pct: number; blocked: boolean; blockers: string[] }>();
    d.employees.forEach(e => {
      const docs = docsByEmp.get(e.id) ?? [];
      const reqDocs = docs.filter(x => x.required);
      const verifiedReq = reqDocs.filter(x => x.status === "verified" && (!x.expires_on || expiresInDays(x.expires_on)! >= 0));
      const onb = onbByEmp.get(e.id);
      const tr = trnByEmp.get(e.id) ?? [];
      const trDone = tr.filter(t => t.status === "completed").length;
      const trWeight = tr.length ? trDone / tr.length : 1;
      const docWeight = reqDocs.length ? verifiedReq.length / reqDocs.length : 1;
      const onbWeight = !onb ? 1 : ["active", "ready_for_start"].includes(onb.status) ? 1 : onb.status === "incomplete" ? 0.2 : 0.6;
      const pct = Math.round((docWeight * 0.5 + trWeight * 0.3 + onbWeight * 0.2) * 100);
      const blockers: string[] = [];
      if (reqDocs.some(x => x.status === "missing" || x.status === "requested")) blockers.push("Missing documents");
      if (reqDocs.some(x => x.status === "expired" || (x.expires_on && expiresInDays(x.expires_on)! < 0))) blockers.push("Expired documents");
      if (onb && ["on_hold", "incomplete"].includes(onb.status)) blockers.push("Onboarding " + onb.status.replace(/_/g, " "));
      if ((onb?.blockers ?? []).length) blockers.push(...(onb!.blockers ?? []));
      m.set(e.id, { pct, blocked: blockers.length > 0, blockers });
    });
    return m;
  }, [d.employees, docsByEmp, onbByEmp, trnByEmp]);

  /* KPI */
  const stats = useMemo(() => {
    const missing = d.docs.filter(x => x.status === "missing" || x.status === "requested").length;
    const expiringSoon = d.docs.filter(x => x.status === "verified" && x.expires_on && expiresInDays(x.expires_on)! >= 0 && expiresInDays(x.expires_on)! <= 30).length
      + d.trainings.filter(t => t.expires_on && t.status === "completed" && expiresInDays(t.expires_on)! >= 0 && expiresInDays(t.expires_on)! <= 30).length;
    const blocked = Array.from(readinessByEmp.values()).filter(r => r.blocked).length;
    const pendingReview = d.docs.filter(x => x.status === "uploaded").length;
    const bgPending = d.docs.filter(x => isBgCheckDoc(x.doc_type) && x.status !== "verified").length;
    const ready = Array.from(readinessByEmp.values()).filter(r => !r.blocked && r.pct >= 90).length;
    return { missing, expiringSoon, blocked, pendingReview, bgPending, ready };
  }, [d.docs, d.trainings, readinessByEmp]);

  /* employee rows for queue */
  const rows = useMemo(() => {
    let list = d.employees.map(e => {
      const docs = docsByEmp.get(e.id) ?? [];
      const r = readinessByEmp.get(e.id) ?? { pct: 100, blocked: false, blockers: [] };
      const missing = docs.filter(x => x.status === "missing" || x.status === "requested").length;
      const expiring = docs.filter(x => x.expires_on && expiresInDays(x.expires_on)! >= 0 && expiresInDays(x.expires_on)! <= 30).length;
      const expired = docs.filter(x => x.status === "expired" || (x.expires_on && expiresInDays(x.expires_on)! < 0)).length;
      const pending = docs.filter(x => x.status === "uploaded").length;
      return { e, docs, r, missing, expiring, expired, pending };
    });
    if (tab === "onboarding") list = list.filter(x => x.docs.some(dx => isOnboardingDoc(dx.doc_type)));
    else if (tab === "certifications") list = list.filter(x => x.docs.some(dx => isCertDoc(dx.doc_type)));
    else if (tab === "background") list = list.filter(x => x.docs.some(dx => isBgCheckDoc(dx.doc_type)));
    else if (tab === "missing") list = list.filter(x => x.missing > 0);
    else if (tab === "expiring") list = list.filter(x => x.expiring > 0 || x.expired > 0);
    else if (tab === "pending") list = list.filter(x => x.pending > 0);
    else list = list.filter(x => x.docs.length > 0 || x.r.blocked);
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(x =>
        `${x.e.first_name} ${x.e.last_name}`.toLowerCase().includes(q)
        || (x.e.job_title ?? "").toLowerCase().includes(q)
        || (x.e.state ?? "").toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => (b.missing + b.expired) - (a.missing + a.expired) || a.r.pct - b.r.pct);
    return list;
  }, [d.employees, docsByEmp, readinessByEmp, tab, query]);

  /* certifications across all employees */
  const certifications = useMemo(() => {
    const items: { id: string; emp: Employee | undefined; name: string; type: string; expires: string | null; status: string; source: "doc" | "training" }[] = [];
    d.docs.filter(x => isCertDoc(x.doc_type)).forEach(x => {
      items.push({ id: x.id, emp: empById[x.employee_id], name: x.name, type: x.doc_type, expires: x.expires_on, status: x.status, source: "doc" });
    });
    d.trainings.filter(t => t.expires_on || (courseById[t.course_id] && /cert|rbt|cpr|bls/i.test(courseById[t.course_id].title))).forEach(t => {
      const c = courseById[t.course_id];
      items.push({
        id: t.id, emp: empById[t.employee_id], name: c?.title ?? "Certification training",
        type: "training", expires: t.expires_on,
        status: t.status === "completed" ? "verified" : t.status === "expired" ? "expired" : "requested",
        source: "training",
      });
    });
    return items
      .filter(x => x.emp)
      .sort((a, b) => {
        const ad = a.expires ? new Date(a.expires).getTime() : Infinity;
        const bd = b.expires ? new Date(b.expires).getTime() : Infinity;
        return ad - bd;
      })
      .slice(0, 12);
  }, [d.docs, d.trainings, empById, courseById]);

  /* blockers */
  const blockers = useMemo(() => {
    return d.employees
      .map(e => ({ e, r: readinessByEmp.get(e.id) ?? { pct: 100, blocked: false, blockers: [] } }))
      .filter(x => x.r.blocked)
      .slice(0, 10);
  }, [d.employees, readinessByEmp]);

  /* document request center */
  const requests = useMemo(() => {
    return d.docs
      .filter(x => x.status === "requested" || x.status === "missing")
      .slice(0, 10);
  }, [d.docs]);

  const openEmp = openEmpId ? empById[openEmpId] : null;
  const openDocs = openEmpId ? docsByEmp.get(openEmpId) ?? [] : [];
  const openOnb = openEmpId ? onbByEmp.get(openEmpId) : undefined;
  const openTrn = openEmpId ? trnByEmp.get(openEmpId) ?? [] : [];
  const openR = openEmpId ? readinessByEmp.get(openEmpId) : undefined;

  return (
    <OSShell>
      <div className="px-6 md:px-10 py-10 max-w-7xl mx-auto">
        {/* header */}
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-start">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="h-11 w-11 rounded-2xl bg-muted grid place-items-center shrink-0">
              <ShieldCheck className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Compliance & Documents</h1>
              <p className="text-[13px] text-muted-foreground mt-1 max-w-2xl">
                Manage onboarding documents, certifications, readiness requirements, and operational employee records across Blossom.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <HeaderBtn icon={Send} to="/hr/messages">Message employees</HeaderBtn>
            <HeaderBtn icon={Award} to="/hr/training-certifications">Training & certs</HeaderBtn>
            <HeaderBtn icon={Download} onClick={() => {
              const rows = [["Employee","Role","State","Readiness","Missing","Expired","Expiring"]];
              d.employees.forEach(e => {
                const r = readinessByEmp.get(e.id);
                const docs = docsByEmp.get(e.id) ?? [];
                const missing = docs.filter(x => x.status === "missing" || x.status === "requested").length;
                const expired = docs.filter(x => x.status === "expired").length;
                const expiring = docs.filter(x => x.expires_on && expiresInDays(x.expires_on)! >= 0 && expiresInDays(x.expires_on)! <= 30).length;
                rows.push([`${e.first_name} ${e.last_name}`, e.job_title, e.state, `${r?.pct ?? 100}%`, String(missing), String(expired), String(expiring)]);
              });
              const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = `compliance-${new Date().toISOString().slice(0,10)}.csv`;
              a.click();
              URL.revokeObjectURL(url);
              toast({ title: "Report exported" });
            }}>Export CSV</HeaderBtn>
          </div>
        </header>
        <HRIntegrationStatusStrip className="mb-6" />

        {/* KPI */}
        <div className="grid gap-3 mb-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <Kpi label="Missing docs" value={d.loading ? "—" : stats.missing} tone={stats.missing ? "crit" : "ok"} hint="Required & not yet uploaded" onClick={() => setTab("missing")} active={tab === "missing"} />
          <Kpi label="Expiring soon" value={d.loading ? "—" : stats.expiringSoon} tone={stats.expiringSoon ? "warn" : "ok"} hint="Next 30 days" onClick={() => setTab("expiring")} active={tab === "expiring"} />
          <Kpi label="Blocked" value={d.loading ? "—" : stats.blocked} tone={stats.blocked ? "crit" : "ok"} hint="By compliance" />
          <Kpi label="Pending review" value={d.loading ? "—" : stats.pendingReview} tone={stats.pendingReview ? "info" : "muted"} hint="Awaiting HR verify" onClick={() => setTab("pending")} active={tab === "pending"} />
          <Kpi label="Background checks" value={d.loading ? "—" : stats.bgPending} tone={stats.bgPending ? "warn" : "ok"} hint="Pending clearance" onClick={() => setTab("background")} active={tab === "background"} />
          <Kpi label="Staffing ready" value={d.loading ? "—" : stats.ready} tone="ok" hint="Clear & current" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* MAIN */}
          <div className="space-y-6 min-w-0">
            {/* QUEUE */}
            <section>
              <div className="flex items-end justify-between mb-3 gap-3 flex-wrap">
                <div>
                  <h2 className="text-base font-medium tracking-tight">Compliance queue</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Employee document & certification status with readiness impact.</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by employee, role, state…"
                    className="w-64 h-8 pl-8 pr-3 rounded-lg bg-muted/60 border border-border/70 text-[12.5px] placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-transparent transition"
                  />
                </div>
              </div>
              <Card>
                {/* tabs */}
                <div className="flex items-center gap-1 p-2 border-b border-border/70 overflow-x-auto">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground ml-1 mr-1 shrink-0" strokeWidth={1.75} />
                  {([
                    ["all", "All"],
                    ["onboarding", "Onboarding"],
                    ["certifications", "Certifications"],
                    ["background", "Background"],
                    ["missing", "Missing"],
                    ["expiring", "Expiring"],
                    ["pending", "Pending review"],
                  ] as [Tab, string][]).map(([k, label]) => (
                    <button key={k} onClick={() => setTab(k)} className={cn(
                      "h-7 px-3 rounded-lg text-[12px] whitespace-nowrap transition-colors",
                      tab === k ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-muted",
                    )}>{label}</button>
                  ))}
                </div>

                <div className="divide-y divide-border/70">
                  {d.loading ? (
                    <div className="p-6 space-y-3">
                      {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}
                    </div>
                  ) : rows.length === 0 ? (
                    <Empty icon={CheckCircle2} title="All compliance records are current." hint="No missing documents or expiring certifications in this view." />
                  ) : (
                    rows.map(({ e, docs, r, missing, expiring, expired, pending }) => (
                      <button key={e.id} onClick={() => setOpenEmpId(e.id)} className="w-full text-left p-4 hover:bg-muted/40 transition-colors flex items-center gap-4">
                        <div className="h-9 w-9 rounded-full bg-muted grid place-items-center shrink-0 text-[12px] font-medium text-muted-foreground">
                          {e.first_name[0]}{e.last_name[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-[13.5px] font-medium tracking-tight truncate">{e.first_name} {e.last_name}</p>
                            {expired > 0 && <Pill tone="crit">{expired} expired</Pill>}
                            {missing > 0 && <Pill tone="crit">{missing} missing</Pill>}
                            {expiring > 0 && <Pill tone="warn">{expiring} expiring</Pill>}
                            {pending > 0 && <Pill tone="info">{pending} to review</Pill>}
                            {missing + expired + expiring + pending === 0 && docs.length > 0 && <Pill tone="ok">Current</Pill>}
                          </div>
                          <p className="text-[12px] text-muted-foreground mt-0.5 truncate">
                            {e.job_title} · {e.state} · {docs.length} document{docs.length === 1 ? "" : "s"}
                            {r.blocked && ` · blocked: ${r.blockers[0]}`}
                          </p>
                        </div>
                        <div className="hidden sm:flex items-center gap-2 w-32 shrink-0">
                          <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                            <div className={cn("h-full", r.blocked ? "bg-amber-500/70" : "bg-primary/70")} style={{ width: `${r.pct}%` }} />
                          </div>
                          <span className="text-[11px] tabular-nums text-muted-foreground w-8 text-right">{r.pct}%</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                      </button>
                    ))
                  )}
                </div>
              </Card>
            </section>

            {/* CERTIFICATIONS */}
            <section>
              <div className="mb-3">
                <h2 className="text-base font-medium tracking-tight">Certification management</h2>
                <p className="text-xs text-muted-foreground mt-0.5">RBT, CPR, BLS, and role-specific certifications across the team.</p>
              </div>
              <Card>
                {d.loading ? (
                  <div className="p-6 space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />)}</div>
                ) : certifications.length === 0 ? (
                  <Empty icon={Award} title="All certifications are current." hint="No certifications recorded yet, or all are verified and not expiring." />
                ) : (
                  <div className="divide-y divide-border/70">
                    {certifications.map(c => {
                      const days = expiresInDays(c.expires);
                      const tone: Tone =
                        c.status === "expired" || (days != null && days < 0) ? "crit"
                        : days != null && days <= 30 ? "warn"
                        : c.status === "verified" ? "ok"
                        : c.status === "uploaded" ? "info" : "muted";
                      const label = c.status === "expired" || (days != null && days < 0) ? "Expired"
                        : days != null && days <= 30 ? `Expires in ${days}d`
                        : c.status === "verified" ? "Active"
                        : c.status === "uploaded" ? "Pending review"
                        : c.status === "requested" ? "Requested" : "Missing";
                      return (
                        <button key={c.id} onClick={() => c.emp && setOpenEmpId(c.emp.id)} className="w-full text-left p-3.5 hover:bg-muted/40 transition-colors flex items-center gap-3">
                          <div className="h-8 w-8 rounded-xl bg-muted grid place-items-center shrink-0">
                            <Award className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-[13px] font-medium tracking-tight truncate">{c.name}</p>
                              <Pill tone={tone}>{label}</Pill>
                            </div>
                            <p className="text-[11.5px] text-muted-foreground mt-0.5 truncate">
                              {c.emp ? `${c.emp.first_name} ${c.emp.last_name}` : "—"} · {c.emp?.job_title}
                              {c.expires && ` · expires ${fmtDate(c.expires)}`}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </Card>
            </section>

            {/* BLOCKERS + REQUESTS */}
            <div className="grid gap-6 md:grid-cols-2">
              <section>
                <div className="mb-3">
                  <h2 className="text-base font-medium tracking-tight">Readiness blockers</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Employees blocked by missing or expired compliance.</p>
                </div>
                <Card>
                  {d.loading ? <div className="p-6"><div className="h-10 rounded-xl bg-muted animate-pulse" /></div>
                  : blockers.length === 0 ? <Empty icon={ShieldCheck} title="No readiness blockers." hint="Everyone is staffing ready." />
                  : (
                    <div className="divide-y divide-border/70">
                      {blockers.map(({ e, r }) => (
                        <button key={e.id} onClick={() => setOpenEmpId(e.id)} className="w-full text-left p-3.5 hover:bg-muted/40 transition-colors flex items-center gap-3">
                          <div className="h-8 w-8 rounded-2xl bg-amber-500/10 grid place-items-center shrink-0">
                            <AlertCircle className="h-4 w-4 text-amber-700 dark:text-amber-400" strokeWidth={1.75} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-[13px] font-medium tracking-tight truncate">{e.first_name} {e.last_name}</p>
                              <Pill tone="warn">{r.blockers[0]}</Pill>
                            </div>
                            <p className="text-[11.5px] text-muted-foreground mt-0.5 truncate">{e.job_title} · {e.state} · readiness {r.pct}%</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </Card>
              </section>

              <section>
                <div className="mb-3">
                  <h2 className="text-base font-medium tracking-tight">Document requests</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Outstanding requests waiting on the employee.</p>
                </div>
                <Card>
                  {d.loading ? <div className="p-6"><div className="h-10 rounded-xl bg-muted animate-pulse" /></div>
                  : requests.length === 0 ? <Empty icon={FileCheck2} title="No outstanding requests." hint="Nothing waiting on employees." />
                  : (
                    <div className="divide-y divide-border/70">
                      {requests.map(r => {
                        const e = empById[r.employee_id];
                        return (
                          <button key={r.id} onClick={() => e && setOpenEmpId(e.id)} className="w-full text-left p-3.5 hover:bg-muted/40 transition-colors flex items-center gap-3">
                            <div className="h-8 w-8 rounded-xl bg-muted grid place-items-center shrink-0">
                              <FileWarning className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-[13px] font-medium tracking-tight truncate">{r.name}</p>
                                <Pill tone={r.status === "missing" ? "crit" : "warn"}>{DOC_STATUS_LABEL[r.status]}</Pill>
                              </div>
                              <p className="text-[11.5px] text-muted-foreground mt-0.5 truncate">{e ? `${e.first_name} ${e.last_name}` : "—"} · {r.doc_type}</p>
                            </div>
                            <BellRing className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
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
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
                </div>
                <p className="text-[13px] font-medium tracking-tight">Priority Actions</p>
              </div>
              <p className="text-[12px] text-muted-foreground mb-4">Compliance &amp; readiness shortcuts.</p>
              <div className="space-y-1.5 text-[12.5px] text-foreground/80">
                <div className="px-2.5 py-1.5">Review expiring certifications this week</div>
                <div className="px-2.5 py-1.5">Unblock employees flagged in readiness</div>
                <div className="px-2.5 py-1.5">Request missing onboarding documents</div>
                <div className="px-2.5 py-1.5">Follow up on pending CPR renewals</div>
                <div className="px-2.5 py-1.5">Close out pending compliance reviews</div>
              </div>
            </Card>

            <Card className="p-5">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">Snapshot</p>
              <ul className="space-y-2 text-[12.5px]">
                <li className="flex items-center justify-between"><span className="text-muted-foreground">Missing documents</span><span className="font-medium tabular-nums">{d.loading ? "—" : stats.missing}</span></li>
                <li className="flex items-center justify-between"><span className="text-muted-foreground">Expiring (30d)</span><span className="font-medium tabular-nums">{d.loading ? "—" : stats.expiringSoon}</span></li>
                <li className="flex items-center justify-between"><span className="text-muted-foreground">Pending review</span><span className="font-medium tabular-nums">{d.loading ? "—" : stats.pendingReview}</span></li>
                <li className="flex items-center justify-between"><span className="text-muted-foreground">Readiness blockers</span><span className="font-medium tabular-nums">{d.loading ? "—" : stats.blocked}</span></li>
                <li className="flex items-center justify-between"><span className="text-muted-foreground">Staffing ready</span><span className="font-medium tabular-nums">{d.loading ? "—" : stats.ready}</span></li>
              </ul>
            </Card>
          </aside>
        </div>
      </div>

      {/* DETAIL PANEL */}
      {openEmp && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog">
          <button className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setOpenEmpId(null)} aria-label="Close" />
          <div className="relative w-full max-w-xl h-full bg-background border-l border-border/70 overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border/70 px-6 py-4 flex items-center justify-between">
              <div className="min-w-0 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted grid place-items-center text-[12px] font-medium text-muted-foreground shrink-0">
                  {openEmp.first_name[0]}{openEmp.last_name[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{openEmp.job_title} · {openEmp.state}</p>
                  <p className="text-base font-semibold tracking-tight truncate">{openEmp.first_name} {openEmp.last_name}</p>
                </div>
              </div>
              <button onClick={() => setOpenEmpId(null)} className="rounded-full h-8 w-8 grid place-items-center hover:bg-muted transition-colors">
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Readiness */}
              <section>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Readiness</p>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                      <div className={cn("h-full", openR?.blocked ? "bg-amber-500/70" : "bg-primary/70")} style={{ width: `${openR?.pct ?? 100}%` }} />
                    </div>
                    <span className="text-[13px] tabular-nums font-medium">{openR?.pct ?? 100}%</span>
                  </div>
                  {openR?.blockers.length ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {openR.blockers.map(b => <Pill key={b} tone="warn">{b}</Pill>)}
                    </div>
                  ) : (
                    <p className="text-[12px] text-muted-foreground mt-2">No active blockers.</p>
                  )}
                  <p className="text-[11.5px] text-muted-foreground mt-2">
                    Onboarding {openOnb ? openOnb.status.replace(/_/g, " ") : "—"}
                    {openEmp.start_date && ` · starts ${fmtDate(openEmp.start_date)}`}
                  </p>
                </Card>
              </section>

              {/* Integration readiness (honest per-provider status) */}
              <section>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Integration readiness</p>
                <IntegrationReadinessPanel row={openOnb ?? {}} />
                {openOnb && (
                  <div className="mt-3">
                    <HRIntegrationReadinessEditor
                      onboardingId={openOnb.id}
                      employeeId={openEmp.id}
                      row={openOnb as any}
                      onSaved={refresh}
                    />
                  </div>
                )}
              </section>

              {/* Recent HR activity */}
              <section>
                <HRRecentActivity employeeId={openEmp.id} onboardingId={openOnb?.id ?? null} />
              </section>

              {/* Documents */}
              <section>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Documents ({openDocs.length})</p>
                <Card>
                  {openDocs.length === 0 ? (
                    <Empty icon={FileText} title="No documents on file." hint="Request onboarding documents to begin." />
                  ) : (
                    <div className="divide-y divide-border/70">
                      {openDocs.map(x => {
                        const tone = docStatusTone(x.status, x.expires_on);
                        const days = expiresInDays(x.expires_on);
                        const label = x.status === "verified" && days != null && days < 0 ? "Expired"
                          : x.status === "verified" && days != null && days <= 30 ? `Expires ${days}d`
                          : DOC_STATUS_LABEL[x.status] ?? x.status;
                        return (
                          <div key={x.id} className="p-3.5 flex items-center gap-3">
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.75} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-[13px] font-medium tracking-tight truncate">{x.name}</p>
                                <Pill tone={tone}>{label}</Pill>
                                {x.required && <span className="text-[10.5px] text-muted-foreground">required</span>}
                              </div>
                              <p className="text-[11.5px] text-muted-foreground mt-0.5 truncate">
                                {x.doc_type}
                                {x.uploaded_at && ` · uploaded ${relTime(x.uploaded_at)}`}
                                {x.expires_on && ` · expires ${fmtDate(x.expires_on)}`}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </section>

              {/* Trainings / certs */}
              {openTrn.length > 0 && (
                <section>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Training & certifications</p>
                  <Card>
                    <div className="divide-y divide-border/70">
                      {openTrn.slice(0, 6).map(t => {
                        const c = courseById[t.course_id];
                        const days = expiresInDays(t.expires_on);
                        const tone: Tone = t.status === "expired" || (days != null && days < 0) ? "crit"
                          : days != null && days <= 30 ? "warn"
                          : t.status === "completed" ? "ok" : "info";
                        return (
                          <div key={t.id} className="p-3.5 flex items-center gap-3">
                            <Award className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.75} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-[13px] font-medium tracking-tight truncate">{c?.title ?? "Training"}</p>
                                <Pill tone={tone}>{t.status}</Pill>
                              </div>
                              <p className="text-[11.5px] text-muted-foreground mt-0.5 truncate">
                                {t.completed_at && `completed ${relTime(t.completed_at)}`}
                                {t.expires_on && ` · expires ${fmtDate(t.expires_on)}`}
                                {t.due_date && !t.completed_at && `due ${fmtDate(t.due_date)}`}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                </section>
              )}

              {/* Actions */}
              <section className="pt-2 border-t border-border/70 -mx-6 px-6">
                <div className="flex flex-wrap gap-2">
                  <button onClick={async () => {
                    const docType = await promptOperator({
                      title: "Request document",
                      label: "Document type (e.g. cpr_cert, i9, w4)",
                      submitLabel: "Continue",
                      required: true,
                    });
                    if (!docType) return;
                    const name = await promptOperator({
                      title: "Document name",
                      label: "Display name shown to the employee",
                      defaultValue: docType,
                      submitLabel: "Request",
                      required: true,
                    });
                    if (!name) return;
                    const { error } = await supabase.from("employee_documents_hr").insert({
                      employee_id: openEmp.id, doc_type: docType, name, status: "requested", required: true,
                    });
                    toast({ title: error ? "Could not request" : "Document requested", description: error ? "Please try again in a moment." : undefined });
                    if (!error) refresh();
                  }} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] bg-primary text-primary-foreground hover:opacity-90 transition">
                    <Send className="h-3.5 w-3.5" strokeWidth={1.75} /> Request document
                  </button>
                  <button onClick={async () => {
                    const pendingDocs = openDocs.filter(x => x.status === "uploaded");
                    if (pendingDocs.length === 0) return toast({ title: "No documents pending review" });
                    const { error } = await supabase.from("employee_documents_hr").update({
                      status: "verified", verified_at: new Date().toISOString(),
                    }).in("id", pendingDocs.map(x => x.id));
                    toast({ title: error ? "Could not approve" : `Approved ${pendingDocs.length} document(s)` });
                    if (!error) refresh();
                  }} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] border border-border/70 bg-card hover:bg-muted transition">
                    <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.75} /> Approve
                  </button>
                  <button onClick={async () => {
                    const expired = openDocs.filter(x => x.status === "expired" || (x.expires_on && expiresInDays(x.expires_on)! < 0));
                    if (expired.length === 0) return toast({ title: "Nothing needs renewal" });
                    const { error } = await supabase.from("employee_documents_hr").update({ status: "requested" })
                      .in("id", expired.map(x => x.id));
                    toast({ title: error ? "Could not request" : `Requested update on ${expired.length} document(s)` });
                    if (!error) refresh();
                  }} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] border border-border/70 bg-card hover:bg-muted transition">
                    <Send className="h-3.5 w-3.5" strokeWidth={1.75} /> Request update
                  </button>
                  <button onClick={() => navigate("/hr/messages")} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] border border-border/70 bg-card hover:bg-muted transition">
                    <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.75} /> Message
                  </button>
                  <button onClick={async () => {
                    const blockers = getHrReadinessBlockers({
                      onboarding: openOnb as any,
                      documents: openDocs as any,
                      trainings: openTrn as any,
                      employeeRole: openEmp.job_title,
                    });
                    if (blockers.length) {
                      toast({ title: "Cannot mark ready", description: blockers.join(" · ") });
                      await logHrEvent({
                        eventType: "ready_blocked",
                        title: `${openEmp.first_name} ${openEmp.last_name} blocked from staffing`,
                        description: blockers.join(" · "),
                        employeeId: openEmp.id,
                        metadata: { blockers },
                      });
                      return;
                    }
                    // Only mark onboarding ready for start — do NOT activate the employee here.
                    const { error } = openOnb
                      ? await supabase.from("employee_onboarding").update({ status: "ready_for_start" as never }).eq("id", openOnb.id)
                      : { error: null } as any;
                    if (!error) await logHrEvent({ eventType: "compliance_marked_ready", title: `${openEmp.first_name} ${openEmp.last_name} marked staffing ready`, employeeId: openEmp.id });
                    toast({ title: error ? "Could not update" : "Marked staffing ready" });
                    if (!error) { setOpenEmpId(null); refresh(); }
                  }} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] border border-border/70 bg-card hover:bg-muted transition">
                    <UserCheck className="h-3.5 w-3.5" strokeWidth={1.75} /> Mark ready
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
