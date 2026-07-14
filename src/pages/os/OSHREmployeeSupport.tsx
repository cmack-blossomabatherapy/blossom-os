import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  HeartHandshake, Sparkles, Search, Plus, MessageSquare, ChevronRight,
  CheckCircle2, AlertTriangle, Clock, Workflow, X, MapPin, Briefcase,
  FileText, Heart, GraduationCap, ShieldCheck, ArrowUpRight, UserCircle2,
  Mail, Phone, Activity, BookOpen,
  LifeBuoy,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { HRIntegrationStatusStrip } from "@/components/hr/HRIntegrationStatusStrip";
import { IntegrationReadinessPanel, type OnboardingReadinessRow } from "@/components/hr/IntegrationReadinessPanel";
import { HRIntegrationReadinessEditor } from "@/components/hr/HRIntegrationReadinessEditor";
import { HRRecentActivity } from "@/components/hr/HRRecentActivity";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { logHrEvent } from "@/lib/hr/activityEvents";

/* ─── atoms ─── */
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
    tone === "crit" ? "bg-destructive/10 text-destructive border-destructive/20" :
    tone === "warn" ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" :
    tone === "ok"   ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" :
    tone === "info" ? "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20" :
                      "bg-muted text-muted-foreground border-border/70";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium", cls)}>
      {children}
    </span>
  );
}
function Avatar({ first, last }: { first: string; last: string }) {
  const initials = `${(first?.[0] ?? "").toUpperCase()}${(last?.[0] ?? "").toUpperCase()}`;
  return (
    <div className="h-9 w-9 rounded-full bg-muted grid place-items-center text-[11px] font-medium text-muted-foreground shrink-0">
      {initials}
    </div>
  );
}
function Empty({ icon: Icon, title, hint }: { icon: React.ElementType; title: string; hint?: string }) {
  return (
    <div className="py-12 text-center">
      <div className="mx-auto mb-3 h-10 w-10 rounded-2xl bg-muted grid place-items-center">
        <Icon className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <p className="text-sm font-medium tracking-tight">{title}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}
function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="text-[12px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ─── helpers ─── */
const daysSince = (iso?: string | null) => {
  if (!iso) return 0;
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return 0;
  return Math.max(0, Math.floor((Date.now() - d) / 86400000));
};
const daysUntil = (iso?: string | null) => {
  if (!iso) return Infinity;
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return Infinity;
  return Math.floor((d - Date.now()) / 86400000);
};

const CASE_TYPE_META: Record<string, { label: string; icon: React.ElementType }> = {
  payroll_issue:         { label: "Payroll",          icon: FileText },
  attendance_issue:      { label: "Attendance",       icon: Clock },
  benefit_question:      { label: "Benefits",         icon: Heart },
  hr_question:           { label: "HR question",      icon: HeartHandshake },
  onboarding_blocker:    { label: "Onboarding",       icon: Workflow },
  training_issue:        { label: "Training",         icon: GraduationCap },
  manager_escalation:    { label: "Escalation",       icon: ArrowUpRight },
  documentation_needed:  { label: "Documents",        icon: FileText },
  access_issue:          { label: "System access",    icon: ShieldCheck },
  policy_acknowledgment: { label: "Policy",           icon: FileText },
  disciplinary_concern:  { label: "Concern",          icon: AlertTriangle },
  offboarding_case:      { label: "Offboarding",      icon: UserCircle2 },
};

const STATUS_META: Record<string, { label: string; tone: Tone }> = {
  new:               { label: "New",            tone: "info" },
  open:              { label: "In progress",    tone: "warn" },
  waiting_employee:  { label: "Waiting on emp", tone: "muted" },
  waiting_manager:   { label: "Waiting on mgr", tone: "muted" },
  waiting_payroll:   { label: "Waiting payroll",tone: "muted" },
  waiting_hr:        { label: "Waiting on HR",  tone: "warn" },
  resolved:          { label: "Resolved",       tone: "ok" },
  closed:            { label: "Closed",         tone: "ok" },
};
const OPEN_STATUSES = new Set(["new","open","waiting_employee","waiting_manager","waiting_payroll","waiting_hr"]);

const PRIORITY_META: Record<string, { label: string; tone: Tone }> = {
  low:    { label: "Low",    tone: "muted" },
  medium: { label: "Medium", tone: "info" },
  high:   { label: "High",   tone: "warn" },
  urgent: { label: "Urgent", tone: "crit" },
};

/* ─── types ─── */
interface Emp {
  id: string; first_name: string; last_name: string; preferred_name: string | null;
  job_title: string; state: string; status: string; email: string | null; phone: string | null;
  hire_date: string | null; start_date: string | null;
}
interface CaseRow {
  id: string; employee_id: string; title: string; summary: string | null;
  case_type: string; status: string; priority: string;
  owner_user_id: string | null; owner_role: string | null;
  opened_at: string; due_date: string | null; closed_at: string | null;
  resolution: string | null; updated_at: string;
}
interface OnbRow extends OnboardingReadinessRow {
  id: string; employee_id: string; status: string; stage_entered_at: string; blockers: string[];
}
interface TrRow { id: string; employee_id: string; course_id: string; status: string; due_date: string | null }
interface DocRow { id: string; employee_id: string; doc_type: string; name: string; status: string; required: boolean }

/* ─── data ─── */
function useSupportData() {
  const [employees, setEmployees] = useState<Emp[]>([]);
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [onboarding, setOnboarding] = useState<OnbRow[]>([]);
  const [trainings, setTrainings] = useState<TrRow[]>([]);
  const [documents, setDocuments] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [emp, cs, onb, tr, dc] = await Promise.all([
        supabase.from("employees").select("id,first_name,last_name,preferred_name,job_title,state,status,email,phone,hire_date,start_date").order("last_name"),
        supabase.from("employee_cases").select("*").order("opened_at", { ascending: false }),
        supabase.from("employee_onboarding").select("id,employee_id,status,stage_entered_at,blockers,viventium_status,viventium_synced_at,viventium_notes,stellar_status,stellar_synced_at,stellar_notes,centralreach_status,centralreach_synced_at,centralreach_notes"),
        supabase.from("employee_trainings").select("id,employee_id,course_id,status,due_date"),
        supabase.from("employee_documents_hr").select("id,employee_id,doc_type,name,status,required"),
      ]);
      if (cancelled) return;
      setEmployees((emp.data ?? []) as Emp[]);
      setCases((cs.data ?? []) as CaseRow[]);
      setOnboarding((onb.data ?? []) as OnbRow[]);
      setTrainings((tr.data ?? []) as TrRow[]);
      setDocuments((dc.data ?? []) as DocRow[]);
      setLoading(false);
    })();
    const ch = supabase
      .channel("employee-support")
      .on("postgres_changes", { event: "*", schema: "public", table: "employee_cases" }, async () => {
        const { data } = await supabase.from("employee_cases").select("*").order("opened_at", { ascending: false });
        if (!cancelled) setCases((data ?? []) as CaseRow[]);
      })
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, []);

  return { employees, cases, onboarding, trainings, documents, loading };
}

/* ─── page ─── */
export default function OSHREmployeeSupport() {
  const data = useSupportData();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "resolved">("open");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selected, setSelected] = useState<CaseRow | null>(null);

  const empById = useMemo(() => {
    const m = new Map<string, Emp>();
    data.employees.forEach((e) => m.set(e.id, e));
    return m;
  }, [data.employees]);

  const onbByEmp = useMemo(() => {
    const m = new Map<string, OnbRow>();
    data.onboarding.forEach((o) => m.set(o.employee_id, o));
    return m;
  }, [data.onboarding]);

  /* filtered cases */
  const visibleCases = useMemo(() => {
    return data.cases.filter((c) => {
      if (statusFilter === "open" && !OPEN_STATUSES.has(c.status)) return false;
      if (statusFilter === "resolved" && OPEN_STATUSES.has(c.status)) return false;
      if (typeFilter !== "all" && c.case_type !== typeFilter) return false;
      if (priorityFilter !== "all" && c.priority !== priorityFilter) return false;
      if (query.trim()) {
        const e = empById.get(c.employee_id);
        const s = `${c.title} ${c.summary ?? ""} ${e?.first_name ?? ""} ${e?.last_name ?? ""} ${e?.job_title ?? ""}`.toLowerCase();
        if (!s.includes(query.toLowerCase())) return false;
      }
      return true;
    });
  }, [data.cases, statusFilter, typeFilter, priorityFilter, query, empById]);

  /* KPIs */
  const kpis = useMemo(() => {
    const open = data.cases.filter((c) => OPEN_STATUSES.has(c.status));
    const urgent = open.filter((c) => c.priority === "urgent" || c.priority === "high");
    const blockers = data.onboarding.filter((o) => o.blockers && o.blockers.length > 0).length;
    const trainingHelp = open.filter((c) => c.case_type === "training_issue").length;
    const orientationFollow = open.filter((c) => c.case_type === "onboarding_blocker").length;
    const weekAgo = Date.now() - 7 * 86400000;
    const resolvedWeek = data.cases.filter((c) => c.closed_at && new Date(c.closed_at).getTime() >= weekAgo).length;
    return [
      { label: "Open requests",     value: open.length,            hint: "Across all categories",       tone: open.length > 12 ? "warn" : "ok" as Tone, onClick: () => setStatusFilter("open") },
      { label: "Urgent issues",     value: urgent.length,          hint: "High and urgent priority",    tone: urgent.length > 0 ? "crit" : "ok" as Tone, onClick: () => { setStatusFilter("open"); setPriorityFilter("urgent"); } },
      { label: "Readiness blockers",value: blockers,               hint: "Employees blocked",           tone: blockers > 0 ? "warn" : "ok" as Tone },
      { label: "Training help",     value: trainingHelp,           hint: "Open training requests",      tone: trainingHelp > 0 ? "warn" : "ok" as Tone, onClick: () => { setStatusFilter("open"); setTypeFilter("training_issue"); } },
      { label: "Onboarding follow", value: orientationFollow,      hint: "Open onboarding follow-ups",  tone: orientationFollow > 0 ? "warn" : "ok" as Tone, onClick: () => { setStatusFilter("open"); setTypeFilter("onboarding_blocker"); } },
      { label: "Resolved this week",value: resolvedWeek,           hint: "Last 7 days",                 tone: "ok" as Tone },
    ];
  }, [data.cases, data.onboarding]);

  const typesPresent = useMemo(() => Array.from(new Set(data.cases.map((c) => c.case_type))).sort(), [data.cases]);

  return (
    <OSShell>
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10 py-10">
        {/* header */}
        <header className="mb-6 flex items-start gap-4">
          <div className="h-11 w-11 rounded-2xl bg-muted grid place-items-center shrink-0">
            <HeartHandshake className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Employee Support</h1>
            <p className="text-[13px] text-muted-foreground mt-1 max-w-2xl">
              Support onboarding, training, communication, readiness, and employee success across Blossom.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 flex-wrap justify-end">
            <Link to="/hr/requests" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] border border-border/70 bg-card hover:bg-muted transition-colors">
              <Plus className="h-3.5 w-3.5" strokeWidth={1.75} /> Create request
            </Link>
            <Link to="/hr/messages" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] border border-border/70 bg-card hover:bg-muted transition-colors">
              <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.75} /> Message employee
            </Link>
            <Link to="/hr/workspace" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] border border-border/70 bg-card hover:bg-muted transition-colors">
              <Workflow className="h-3.5 w-3.5" strokeWidth={1.75} /> HR Workspace
            </Link>
          </div>
        </header>
        <HRIntegrationStatusStrip className="mb-6" />

        {/* KPIs */}
        <div className="grid gap-3 mb-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {kpis.map((k) => (
            <button
              key={k.label}
              onClick={k.onClick}
              className="text-left rounded-2xl border border-border/70 bg-card p-4 hover:border-border transition-colors"
            >
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{k.label}</p>
              <p className={cn(
                "text-2xl font-semibold tracking-tight mt-1",
                k.tone === "crit" && "text-destructive",
                k.tone === "warn" && "text-amber-700 dark:text-amber-400",
              )}>{data.loading ? "—" : k.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{k.hint}</p>
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* main */}
          <div className="space-y-6 min-w-0">
            {/* filters */}
            <Card className="p-3">
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by employee, issue, or category…"
                    className="w-full h-9 pl-9 pr-3 rounded-lg bg-muted/60 border border-border/70 text-[13px] placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-transparent transition"
                  />
                </div>
                <div className="flex gap-1.5">
                  {(["open","resolved","all"] as const).map((s) => (
                    <button key={s} onClick={() => setStatusFilter(s)}
                      className={cn("h-9 px-3 rounded-lg text-[12.5px] capitalize transition-colors",
                        statusFilter === s ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted")}>
                      {s}
                    </button>
                  ))}
                </div>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                  className="h-9 px-3 rounded-lg bg-muted/60 border border-border/70 text-[13px]">
                  <option value="all">All categories</option>
                  {typesPresent.map((t) => <option key={t} value={t}>{CASE_TYPE_META[t]?.label ?? t}</option>)}
                </select>
                <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}
                  className="h-9 px-3 rounded-lg bg-muted/60 border border-border/70 text-[13px]">
                  <option value="all">All priorities</option>
                  {Object.entries(PRIORITY_META).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            </Card>

            {/* Support queue */}
            <section>
              <SectionHeader title="Support queue" subtitle="Open employee support requests across categories" />
              {data.loading ? (
                <Card className="p-6"><p className="text-sm text-muted-foreground">Loading support requests…</p></Card>
              ) : visibleCases.length === 0 ? (
                <Card className="p-6">
                  <Empty
                    icon={CheckCircle2}
                    title={statusFilter === "open" ? "No unresolved employee support requests." : "Nothing matches these filters."}
                    hint={statusFilter === "open" ? "Everyone is progressing smoothly." : "Try adjusting your filters."}
                  />
                </Card>
              ) : (
                <Card className="divide-y divide-border/70">
                  {visibleCases.slice(0, 20).map((c) => {
                    const e = empById.get(c.employee_id);
                    const meta = CASE_TYPE_META[c.case_type] ?? { label: c.case_type, icon: HeartHandshake };
                    const st = STATUS_META[c.status] ?? { label: c.status, tone: "muted" as Tone };
                    const pr = PRIORITY_META[c.priority] ?? { label: c.priority, tone: "muted" as Tone };
                    const Icon = meta.icon;
                    const age = daysSince(c.opened_at);
                    return (
                      <button key={c.id} onClick={() => setSelected(c)} className="w-full text-left p-4 flex items-start gap-3 hover:bg-muted/40 transition-colors">
                        <Avatar first={e?.first_name ?? "?"} last={e?.last_name ?? ""} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                            <p className="text-[13px] font-medium tracking-tight truncate">{c.title}</p>
                          </div>
                          <p className="text-[11.5px] text-muted-foreground truncate">
                            {e ? `${e.preferred_name || e.first_name} ${e.last_name}` : "Unknown"} · {e?.job_title} · {e?.state} · {meta.label}
                          </p>
                          {c.summary && <p className="text-[12px] text-muted-foreground mt-1 line-clamp-1">{c.summary}</p>}
                        </div>
                        <div className="hidden md:flex flex-col items-end gap-1 shrink-0">
                          <div className="flex items-center gap-1.5">
                            <Pill tone={pr.tone}>{pr.label}</Pill>
                            <Pill tone={st.tone}>{st.label}</Pill>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {age === 0 ? "today" : `${age}d open`}{c.owner_role ? ` · ${c.owner_role}` : ""}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </Card>
              )}
            </section>

            {/* Readiness blockers */}
            <section>
              <SectionHeader title="Readiness blockers" subtitle="Employees blocked from full operational readiness" />
              <BlockersSection onboarding={data.onboarding} empById={empById} trainings={data.trainings} documents={data.documents} />
            </section>

            {/* Training & cert support */}
            <section>
              <SectionHeader title="Training & certification support" subtitle="Where employees may need extra help" />
              <TrainingSupport trainings={data.trainings} empById={empById} />
            </section>

            {/* Communication center */}
            <section>
              <SectionHeader title="Communication center" subtitle="Recent activity and outreach" />
              <CommunicationCenter cases={data.cases} empById={empById} onOpen={setSelected} />
            </section>

            {/* Escalations */}
            <section>
              <SectionHeader title="Escalations & high priority" subtitle="Urgent items needing attention" />
              <EscalationsSection cases={data.cases} empById={empById} onOpen={setSelected} />
            </section>

            {/* Analytics */}
            <section>
              <SectionHeader title="Support snapshot" subtitle="Lightweight operational health" />
              <SupportSnapshot cases={data.cases} onboarding={data.onboarding} />
            </section>
          </div>

          {/* right rail */}
          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <LifeBuoy className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
                <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Priority Actions</h3>
              </div>
              <div className="space-y-1.5">
                {[
                  "Who needs urgent HR support?",
                  "Show unresolved onboarding blockers.",
                  "Which employees missed orientation?",
                  "Who has overdue training support?",
                  "Summarize readiness blockers.",
                ].map((p) => (
                  <button key={p} className="w-full text-left rounded-lg px-2 py-1.5 text-[12.5px] text-muted-foreground hover:bg-card hover:text-foreground transition-colors">
                    {p}
                  </button>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-3">Quick links</h3>
              <nav className="space-y-1">
                {[
                  { label: "HR Workspace",      to: "/hr/workspace" },
                  { label: "New Hires",         to: "/hr/new-hires" },
                  { label: "Orientation queue", to: "/hr/orientation-queue" },
                  { label: "Training Management", to: "/hr/training-center" },
                  { label: "Learner Academy",   to: "/academy" },
                  { label: "HR Requests",       to: "/hr/requests" },
                ].map((l) => (
                  <Link key={l.to} to={l.to} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-[13px] hover:bg-muted transition-colors">
                    <span>{l.label}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                  </Link>
                ))}
              </nav>
            </Card>
          </aside>
        </div>
      </div>

      {selected && (
        <DetailPanel
          item={selected}
          employee={empById.get(selected.employee_id)}
          onClose={() => setSelected(null)}
          onboarding={onbByEmp.get(selected.employee_id)}
          trainings={data.trainings.filter((t) => t.employee_id === selected.employee_id)}
          documents={data.documents.filter((d) => d.employee_id === selected.employee_id)}
          relatedCases={data.cases.filter((c) => c.employee_id === selected.employee_id && c.id !== selected.id).slice(0, 4)}
        />
      )}
    </OSShell>
  );
}

/* ─── sub-sections ─── */
function BlockersSection({ onboarding, empById, trainings, documents }: {
  onboarding: OnbRow[]; empById: Map<string, Emp>; trainings: TrRow[]; documents: DocRow[];
}) {
  type Blocker = { id: string; emp: Emp; type: string; days: number; pct: number; tone: Tone };
  const rows: Blocker[] = [];
  onboarding.forEach((o) => {
    const e = empById.get(o.employee_id); if (!e) return;
    if (o.blockers && o.blockers.length > 0) {
      rows.push({ id: `onb-${o.id}`, emp: e, type: o.blockers[0], days: daysSince(o.stage_entered_at), pct: 50, tone: "crit" });
    }
  });
  // missing required docs
  const missingByEmp = new Map<string, number>();
  documents.filter((d) => d.required && d.status === "missing").forEach((d) => {
    missingByEmp.set(d.employee_id, (missingByEmp.get(d.employee_id) ?? 0) + 1);
  });
  missingByEmp.forEach((count, empId) => {
    const e = empById.get(empId); if (!e) return;
    if (!rows.some((r) => r.emp.id === empId)) {
      rows.push({ id: `doc-${empId}`, emp: e, type: `${count} required document${count > 1 ? "s" : ""} missing`, days: 0, pct: 60, tone: "warn" });
    }
  });
  // overdue trainings
  const overdueByEmp = new Map<string, number>();
  trainings.filter((t) => t.status !== "completed" && t.due_date && daysUntil(t.due_date) < 0).forEach((t) => {
    overdueByEmp.set(t.employee_id, (overdueByEmp.get(t.employee_id) ?? 0) + 1);
  });
  overdueByEmp.forEach((count, empId) => {
    const e = empById.get(empId); if (!e) return;
    if (!rows.some((r) => r.emp.id === empId)) {
      rows.push({ id: `tr-${empId}`, emp: e, type: `${count} overdue training${count > 1 ? "s" : ""}`, days: 0, pct: 70, tone: "warn" });
    }
  });

  if (!rows.length) {
    return <Card className="p-6"><Empty icon={CheckCircle2} title="No urgent readiness blockers." hint="Everyone is progressing smoothly." /></Card>;
  }
  return (
    <Card className="divide-y divide-border/70">
      {rows.slice(0, 8).map((r) => (
        <div key={r.id} className="p-4 flex items-center gap-3">
          <Avatar first={r.emp.first_name} last={r.emp.last_name} />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium tracking-tight truncate">{r.emp.preferred_name || r.emp.first_name} {r.emp.last_name}</p>
            <p className="text-[11.5px] text-muted-foreground truncate">{r.emp.job_title} · {r.emp.state} · {r.type}</p>
          </div>
          {r.days > 0 && <span className="text-[11.5px] text-muted-foreground hidden md:inline">{r.days}d waiting</span>}
          <Pill tone={r.tone}>{r.pct}% ready</Pill>
        </div>
      ))}
    </Card>
  );
}

function TrainingSupport({ trainings, empById }: { trainings: TrRow[]; empById: Map<string, Emp> }) {
  const byEmp = new Map<string, TrRow[]>();
  trainings.forEach((t) => {
    const a = byEmp.get(t.employee_id) ?? []; a.push(t); byEmp.set(t.employee_id, a);
  });
  type Row = { empId: string; emp: Emp; total: number; done: number; overdue: number };
  const rows: Row[] = [];
  byEmp.forEach((ts, empId) => {
    const e = empById.get(empId); if (!e) return;
    const overdue = ts.filter((t) => t.status !== "completed" && t.due_date && daysUntil(t.due_date) < 0).length;
    if (overdue === 0) return;
    const done = ts.filter((t) => t.status === "completed").length;
    rows.push({ empId, emp: e, total: ts.length, done, overdue });
  });
  rows.sort((a, b) => b.overdue - a.overdue);
  if (!rows.length) {
    return <Card className="p-6"><Empty icon={GraduationCap} title="No training support needed." hint="No one is currently overdue." /></Card>;
  }
  return (
    <Card className="divide-y divide-border/70">
      {rows.slice(0, 6).map((r) => {
        const pct = r.total ? Math.round((r.done / r.total) * 100) : 0;
        return (
          <div key={r.empId} className="p-4 flex items-center gap-3">
            <Avatar first={r.emp.first_name} last={r.emp.last_name} />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium tracking-tight truncate">{r.emp.preferred_name || r.emp.first_name} {r.emp.last_name}</p>
              <p className="text-[11.5px] text-muted-foreground truncate">{r.emp.job_title} · {r.emp.state}</p>
            </div>
            <div className="w-32 hidden md:block">
              <div className="h-1 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-foreground/70" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">{r.done}/{r.total} modules</p>
            </div>
            <Pill tone="crit">{r.overdue} overdue</Pill>
          </div>
        );
      })}
    </Card>
  );
}

function CommunicationCenter({ cases, empById, onOpen }: {
  cases: CaseRow[]; empById: Map<string, Emp>; onOpen: (c: CaseRow) => void;
}) {
  const recent = cases.filter((c) => OPEN_STATUSES.has(c.status))
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 6);
  if (!recent.length) {
    return <Card className="p-6"><Empty icon={MessageSquare} title="No active conversations." /></Card>;
  }
  return (
    <Card className="divide-y divide-border/70">
      {recent.map((c) => {
        const e = empById.get(c.employee_id);
        const age = daysSince(c.updated_at);
        const responseTone: Tone = c.status === "waiting_employee" ? "warn" : c.status === "waiting_hr" ? "info" : "muted";
        return (
          <button key={c.id} onClick={() => onOpen(c)} className="w-full text-left p-4 flex items-center gap-3 hover:bg-muted/40 transition-colors">
            <Avatar first={e?.first_name ?? "?"} last={e?.last_name ?? ""} />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium tracking-tight truncate">{e ? `${e.preferred_name || e.first_name} ${e.last_name}` : "Unknown"}</p>
              <p className="text-[11.5px] text-muted-foreground truncate">{c.title}</p>
            </div>
            <span className="text-[11px] text-muted-foreground hidden md:inline">
              {age === 0 ? "today" : `${age}d ago`}
            </span>
            <Pill tone={responseTone}>{STATUS_META[c.status]?.label ?? c.status}</Pill>
          </button>
        );
      })}
    </Card>
  );
}

function EscalationsSection({ cases, empById, onOpen }: {
  cases: CaseRow[]; empById: Map<string, Emp>; onOpen: (c: CaseRow) => void;
}) {
  const rows = cases.filter((c) =>
    OPEN_STATUSES.has(c.status) && (c.priority === "urgent" || c.priority === "high" || c.case_type === "manager_escalation")
  ).slice(0, 6);
  if (!rows.length) {
    return <Card className="p-6"><Empty icon={CheckCircle2} title="No active escalations." hint="Nothing requires leadership attention." /></Card>;
  }
  return (
    <Card className="divide-y divide-border/70">
      {rows.map((c) => {
        const e = empById.get(c.employee_id);
        const age = daysSince(c.opened_at);
        const pr = PRIORITY_META[c.priority] ?? { label: c.priority, tone: "muted" as Tone };
        return (
          <button key={c.id} onClick={() => onOpen(c)} className="w-full text-left p-4 flex items-center gap-3 hover:bg-muted/40 transition-colors">
            <div className="h-9 w-9 rounded-full bg-destructive/10 grid place-items-center shrink-0">
              <ArrowUpRight className="h-4 w-4 text-destructive" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium tracking-tight truncate">{c.title}</p>
              <p className="text-[11.5px] text-muted-foreground truncate">{e ? `${e.preferred_name || e.first_name} ${e.last_name}` : "Unknown"} · {age}d open · {c.owner_role ?? "Unassigned"}</p>
            </div>
            <Pill tone={pr.tone}>{pr.label}</Pill>
          </button>
        );
      })}
    </Card>
  );
}

function SupportSnapshot({ cases, onboarding }: { cases: CaseRow[]; onboarding: OnbRow[] }) {
  const closed = cases.filter((c) => c.closed_at);
  const avgResolution = closed.length
    ? Math.round(closed.reduce((sum, c) => sum + ((new Date(c.closed_at!).getTime() - new Date(c.opened_at).getTime()) / 86400000), 0) / closed.length)
    : 0;
  const open = cases.filter((c) => OPEN_STATUSES.has(c.status));
  const urgent = open.filter((c) => c.priority === "urgent").length;
  const onboardingPct = open.length ? Math.round((open.filter((c) => c.case_type === "onboarding_blocker" || c.case_type === "training_issue").length / open.length) * 100) : 0;
  const blockers = onboarding.filter((o) => o.blockers && o.blockers.length > 0).length;

  const stats = [
    { label: "Avg resolution", value: `${avgResolution}d`, icon: Clock },
    { label: "Open requests",  value: open.length,         icon: Activity },
    { label: "Urgent",         value: urgent,              icon: AlertTriangle },
    { label: "Onboarding %",   value: `${onboardingPct}%`, icon: Workflow },
    { label: "Blockers",       value: blockers,            icon: ShieldCheck },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {stats.map((s) => (
        <Card key={s.label} className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <s.icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
          </div>
          <p className="text-xl font-semibold tracking-tight">{s.value}</p>
        </Card>
      ))}
    </div>
  );
}

/* ─── detail panel ─── */
function DetailPanel({ item, employee, onboarding, trainings, documents, relatedCases, onClose }: {
  item: CaseRow; employee?: Emp; onboarding?: OnbRow;
  trainings: TrRow[]; documents: DocRow[]; relatedCases: CaseRow[];
  onClose: () => void;
}) {
  const meta = CASE_TYPE_META[item.case_type] ?? { label: item.case_type, icon: HeartHandshake };
  const st = STATUS_META[item.status] ?? { label: item.status, tone: "muted" as Tone };
  const pr = PRIORITY_META[item.priority] ?? { label: item.priority, tone: "muted" as Tone };
  const age = daysSince(item.opened_at);
  const trainingDone = trainings.filter((t) => t.status === "completed").length;
  const docsMissing = documents.filter((d) => d.required && d.status === "missing").length;
  const Icon = meta.icon;

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-foreground/20 backdrop-blur-sm" />
      <div onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl h-full bg-card border-l border-border/70 overflow-y-auto animate-in slide-in-from-right duration-200">
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border/70 px-5 py-4 flex items-start gap-3">
          <div className="h-10 w-10 rounded-2xl bg-muted grid place-items-center shrink-0">
            <Icon className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold tracking-tight truncate">{item.title}</p>
            <p className="text-[12px] text-muted-foreground truncate">{meta.label} · {age === 0 ? "opened today" : `opened ${age}d ago`}</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full grid place-items-center hover:bg-muted transition-colors">
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Employee */}
          {employee && (
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Employee</p>
              <div className="rounded-xl border border-border/70 bg-background p-3 flex items-center gap-3">
                <Avatar first={employee.first_name} last={employee.last_name} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium tracking-tight truncate">{employee.preferred_name || employee.first_name} {employee.last_name}</p>
                  <p className="text-[11.5px] text-muted-foreground truncate flex items-center gap-2">
                    <Briefcase className="h-3 w-3" />{employee.job_title}
                    <MapPin className="h-3 w-3 ml-1" />{employee.state}
                  </p>
                </div>
              </div>
              {(employee.email || employee.phone) && (
                <div className="mt-2 text-[12px] text-muted-foreground space-y-1">
                  {employee.email && <p className="flex items-center gap-1.5"><Mail className="h-3 w-3" />{employee.email}</p>}
                  {employee.phone && <p className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{employee.phone}</p>}
                </div>
              )}
            </div>
          )}

          {/* Status */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Status</p>
            <div className="flex flex-wrap gap-1.5">
              <Pill tone={pr.tone}>{pr.label}</Pill>
              <Pill tone={st.tone}>{st.label}</Pill>
              <Pill tone="muted">{age}d open</Pill>
              {item.owner_role && <Pill tone="muted">Owner: {item.owner_role}</Pill>}
              {item.due_date && (
                <Pill tone={daysUntil(item.due_date) < 0 ? "crit" : "warn"}>
                  Due {new Date(item.due_date).toLocaleDateString()}
                </Pill>
              )}
            </div>
          </div>

          {/* Summary */}
          {item.summary && (
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Issue summary</p>
              <p className="text-[13px] leading-relaxed">{item.summary}</p>
            </div>
          )}

          {/* Related workflows */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Related workflows</p>
            <div className="grid grid-cols-2 gap-2">
              <StatusTile label="Onboarding" value={onboarding?.status ?? (employee?.status === "active" ? "complete" : "n/a")} tone={onboarding?.status === "ready_for_start" || employee?.status === "active" ? "ok" : "warn"} />
              <StatusTile label="Blockers" value={onboarding?.blockers?.length ? `${onboarding.blockers.length}` : "0"} tone={onboarding?.blockers?.length ? "crit" : "ok"} />
              <StatusTile label="Training" value={trainings.length ? `${trainingDone}/${trainings.length}` : "—"} tone={trainings.length && trainings.every((t) => t.status === "completed") ? "ok" : "muted"} />
              <StatusTile label="Docs missing" value={`${docsMissing}`} tone={docsMissing > 0 ? "warn" : "ok"} />
            </div>
          </div>

          {/* Integration readiness */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Integration readiness</p>
            {onboarding ? (
              <>
                <IntegrationReadinessPanel row={onboarding} />
                <div className="mt-3">
                  <HRIntegrationReadinessEditor
                    onboardingId={onboarding.id}
                    employeeId={employee?.id ?? null}
                    row={onboarding as any}
                  />
                </div>
              </>
            ) : (
              <p className="text-[12px] text-muted-foreground">
                No onboarding record — integration sync is only tracked for employees with an active onboarding row.
              </p>
            )}
            <p className="mt-2 text-[11px] text-muted-foreground/80">
              Provider status only shows "synced" when the integration is connected in the catalog and this employee's row has a real sync timestamp.
            </p>
          </div>

          {/* Recent HR activity */}
          <HRRecentActivity
            employeeId={employee?.id ?? null}
            onboardingId={onboarding?.id ?? null}
            caseId={item.id}
          />

          {/* Related cases */}
          {relatedCases.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Other support requests</p>
              <div className="space-y-1.5">
                {relatedCases.map((rc) => (
                  <div key={rc.id} className="flex items-center gap-2 text-[12.5px] rounded-lg border border-border/70 bg-background p-2.5">
                    <span className="flex-1 truncate">{rc.title}</span>
                    <Pill tone={STATUS_META[rc.status]?.tone ?? "muted"}>{STATUS_META[rc.status]?.label ?? rc.status}</Pill>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline (synthetic from case fields) */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Timeline</p>
            <div className="space-y-2">
              <TimelineItem label="Opened" date={item.opened_at} />
              {item.updated_at !== item.opened_at && <TimelineItem label="Last updated" date={item.updated_at} />}
              {item.closed_at && <TimelineItem label="Closed" date={item.closed_at} />}
            </div>
          </div>

          {/* Resolution */}
          {item.resolution && (
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Resolution</p>
              <p className="text-[13px] leading-relaxed">{item.resolution}</p>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 grid grid-cols-2 gap-2">
            <ActionBtn icon={MessageSquare} label="Message employee" to="/hr/messages" />
            <ActionBtn icon={UserCircle2} label="Reassign" onClick={async () => {
              const owner = window.prompt("Reassign to (role or name):", item.owner_role ?? "");
              if (!owner) return;
              const { error } = await supabase.from("employee_cases").update({ owner_role: owner }).eq("id", item.id);
              if (!error) await logHrEvent({ eventType: "case_reassigned", title: `Case reassigned to ${owner}`, caseId: item.id, employeeId: (item as any).employee_id ?? null, metadata: { owner } });
              toast({ title: error ? "Reassign failed" : "Reassigned", description: error?.message ?? `Owner set to ${owner}.` });
            }} />
            <ActionBtn icon={ArrowUpRight} label="Escalate" onClick={async () => {
              const { error } = await supabase.from("employee_cases").update({ priority: "urgent", status: "waiting_hr" }).eq("id", item.id);
              if (!error) await logHrEvent({ eventType: "case_escalated", title: "Case escalated to urgent", caseId: item.id, employeeId: (item as any).employee_id ?? null });
              toast({ title: error ? "Could not escalate" : "Escalated", description: error?.message ?? "Marked urgent and routed to HR." });
            }} />
            <ActionBtn icon={FileText} label="Add note" onClick={() => {
              const note = window.prompt("Add a private HR note:", "");
              if (!note) return;
              void (async () => {
                const { error } = await logHrEvent({ eventType: "case_note", title: "Internal HR note", description: note, caseId: item.id, employeeId: (item as any).employee_id ?? null });
                toast({ title: error ? "Could not save note" : "Note saved", description: error?.message ?? "Internal note recorded." });
              })();
            }} />
            <ActionBtn icon={BookOpen} label="Create follow-up" onClick={async () => {
              const date = window.prompt("Follow-up due date (YYYY-MM-DD):", new Date(Date.now() + 86400000 * 3).toISOString().slice(0,10));
              if (!date) return;
              const { error } = await supabase.from("employee_cases").update({ due_date: date, status: "waiting_employee" }).eq("id", item.id);
              if (!error) await logHrEvent({ eventType: "case_follow_up_created", title: `Follow-up scheduled for ${date}`, caseId: item.id, employeeId: (item as any).employee_id ?? null, metadata: { due_date: date } });
              toast({ title: error ? "Could not schedule" : "Follow-up created", description: error?.message ?? `Due ${date}` });
            }} />
            <ActionBtn icon={CheckCircle2} label="Resolve" primary onClick={async () => {
              const resolution = window.prompt("Resolution note:", item.resolution ?? "");
              const { error } = await supabase.from("employee_cases").update({
                status: "resolved",
                resolution: resolution ?? item.resolution,
                closed_at: new Date().toISOString(),
              }).eq("id", item.id);
              if (!error) await logHrEvent({ eventType: "case_resolved", title: "Case resolved", description: resolution ?? null, caseId: item.id, employeeId: (item as any).employee_id ?? null });
              toast({ title: error ? "Could not resolve" : "Request resolved", description: error?.message ?? "Marked as resolved." });
              if (!error) onClose();
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusTile({ label, value, tone }: { label: string; value: string; tone: Tone }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/50 p-2.5">
      <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-1"><Pill tone={tone}>{value}</Pill></div>
    </div>
  );
}

function TimelineItem({ label, date }: { label: string; date: string }) {
  return (
    <div className="flex items-center gap-2 text-[12.5px]">
      <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-auto text-muted-foreground/80">{new Date(date).toLocaleString()}</span>
    </div>
  );
}

function ActionBtn({ icon: Icon, label, primary, onClick, to }: { icon: React.ElementType; label: string; primary?: boolean; onClick?: () => void; to?: string }) {
  const className = cn(
    "inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl text-[12.5px] transition-colors",
    primary ? "bg-primary text-primary-foreground hover:opacity-90"
            : "border border-border/70 bg-card hover:bg-muted",
  );
  if (to) {
    return (
      <Link to={to} className={className}>
        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
        {label}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={className}>
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
      {label}
    </button>
  );
}
