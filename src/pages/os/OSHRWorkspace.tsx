import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Workflow, GraduationCap, ClipboardCheck, ShieldCheck, Inbox, MessageSquare,
  Sparkles, UserPlus, CalendarPlus, BookOpen, ChevronRight, Search,
  CheckCircle2, AlertTriangle, Clock, FileText, Heart, TrendingUp, Activity,
  ClipboardList,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { ONBOARDING_STAGES, type OnboardingStatus } from "@/lib/hr/types";

/* ---------------- shared atoms (match Recruiting Workspace) ---------------- */

type Tone = "ok" | "warn" | "crit" | "muted";

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
  const cls = tone === "crit"
    ? "bg-destructive/10 text-destructive border-destructive/20"
    : tone === "warn"
    ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
    : tone === "ok"
    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
    : "bg-muted text-muted-foreground border-border/70";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium", cls)}>
      {children}
    </span>
  );
}

function initials(first: string, last: string) {
  return `${(first?.[0] ?? "").toUpperCase()}${(last?.[0] ?? "").toUpperCase()}`;
}

function Avatar({ first, last }: { first: string; last: string }) {
  return (
    <div className="h-9 w-9 rounded-full bg-muted grid place-items-center text-[11px] font-medium text-muted-foreground shrink-0">
      {initials(first, last)}
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

/* ---------------- types ---------------- */

interface Emp {
  id: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  job_title: string;
  state: string;
  status: string;
  start_date: string | null;
  hire_date: string | null;
}
interface OnbRow {
  id: string; employee_id: string; status: OnboardingStatus;
  stage_entered_at: string; blockers: string[];
}
interface TaskRow { id: string; onboarding_id: string; title: string; completed: boolean; due_date: string | null }
interface TrainingRow {
  id: string; employee_id: string; course_id: string; status: string;
  due_date: string | null; assigned_at: string; completed_at: string | null;
}
interface DocRow {
  id: string; employee_id: string; doc_type: string; name: string;
  status: string; required: boolean; expires_on: string | null;
}
interface ReviewRow {
  id: string; employee_id: string; reviewer_name: string | null;
  review_type: string; status: string; due_date: string | null;
}

/* ---------------- data hook ---------------- */

function useHRWorkspaceData() {
  const [employees, setEmployees] = useState<Emp[]>([]);
  const [onboarding, setOnboarding] = useState<OnbRow[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [trainings, setTrainings] = useState<TrainingRow[]>([]);
  const [documents, setDocuments] = useState<DocRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [emp, onb, tr, dc, rv] = await Promise.all([
        supabase.from("employees").select("id,first_name,last_name,preferred_name,job_title,state,status,start_date,hire_date").order("last_name"),
        supabase.from("employee_onboarding").select("id,employee_id,status,stage_entered_at,blockers"),
        supabase.from("employee_trainings").select("id,employee_id,course_id,status,due_date,assigned_at,completed_at"),
        supabase.from("employee_documents_hr").select("id,employee_id,doc_type,name,status,required,expires_on"),
        supabase.from("employee_reviews").select("id,employee_id,reviewer_name,review_type,status,due_date"),
      ]);
      if (cancelled) return;
      setEmployees((emp.data ?? []) as Emp[]);
      setOnboarding((onb.data ?? []) as OnbRow[]);
      setTrainings((tr.data ?? []) as TrainingRow[]);
      setDocuments((dc.data ?? []) as DocRow[]);
      setReviews((rv.data ?? []) as ReviewRow[]);

      const ids = (onb.data ?? []).map((o: any) => o.id);
      if (ids.length) {
        const { data: tk } = await supabase
          .from("employee_onboarding_tasks")
          .select("id,onboarding_id,title,completed,due_date")
          .in("onboarding_id", ids);
        if (!cancelled) setTasks((tk ?? []) as TaskRow[]);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return { employees, onboarding, tasks, trainings, documents, reviews, loading };
}

/* ---------------- helpers ---------------- */

const TABS = [
  { key: "onboarding",  label: "Onboarding",      icon: Workflow },
  { key: "orientation", label: "Orientation",     icon: CalendarPlus },
  { key: "training",    label: "Training",        icon: GraduationCap },
  { key: "certs",       label: "Certifications",  icon: ShieldCheck },
  { key: "support",     label: "Employee Support",icon: Heart },
  { key: "evaluations", label: "Evaluations",     icon: ClipboardCheck },
  { key: "readiness",   label: "Readiness",       icon: Activity },
] as const;
type TabKey = typeof TABS[number]["key"];

function daysSince(iso?: string | null) {
  if (!iso) return 0;
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return 0;
  return Math.max(0, Math.floor((Date.now() - d) / 86400000));
}
function daysUntil(iso?: string | null) {
  if (!iso) return Infinity;
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return Infinity;
  return Math.floor((d - Date.now()) / 86400000);
}
function stageLabel(s: OnboardingStatus) {
  return ONBOARDING_STAGES.find((x) => x.key === s)?.label ?? s;
}
function fullName(e: Pick<Emp, "first_name" | "last_name" | "preferred_name">) {
  return `${e.preferred_name || e.first_name} ${e.last_name}`;
}

/* ---------------- page ---------------- */

export default function OSHRWorkspace() {
  const [tab, setTab] = useState<TabKey>("onboarding");
  const [query, setQuery] = useState("");
  const data = useHRWorkspaceData();

  const empById = useMemo(() => {
    const m = new Map<string, Emp>();
    data.employees.forEach((e) => m.set(e.id, e));
    return m;
  }, [data.employees]);

  /* derived KPIs */
  const kpis = useMemo(() => {
    const onboardingOpen = data.onboarding.filter((o) => !["active"].includes(o.status)).length;
    const overdueTraining = data.trainings.filter((t) => t.status !== "completed" && t.due_date && daysUntil(t.due_date) < 0).length;
    const expiringSoon = data.documents.filter((d) => d.expires_on && daysUntil(d.expires_on) <= 30 && daysUntil(d.expires_on) >= 0).length;
    const reviewsDue = data.reviews.filter((r) => r.status !== "completed" && r.due_date && daysUntil(r.due_date) <= 14).length;
    const pendingStarts = data.employees.filter((e) => e.status === "pending_start").length;
    return [
      { label: "Onboarding open", value: onboardingOpen, tone: onboardingOpen ? "warn" : "ok" as Tone },
      { label: "Pending starts",  value: pendingStarts },
      { label: "Training overdue",value: overdueTraining, tone: overdueTraining ? "crit" : "ok" as Tone },
      { label: "Expiring docs",   value: expiringSoon, tone: expiringSoon ? "warn" : "ok" as Tone },
      { label: "Reviews due",     value: reviewsDue, tone: reviewsDue ? "warn" : "ok" as Tone },
    ];
  }, [data]);

  return (
    <OSShell>
      <div className="px-6 md:px-10 py-10 max-w-7xl mx-auto">
        {/* header */}
        <header className="mb-6 flex items-start gap-4">
          <div className="h-11 w-11 rounded-2xl bg-muted grid place-items-center shrink-0">
            <Workflow className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">HR Workspace</h1>
            <p className="text-[13px] text-muted-foreground mt-1 max-w-2xl">
              Coordinate onboarding, readiness, training, certifications, employee support, and growth across Blossom.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Link to="/user-management?add=1" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] text-foreground border border-border/70 bg-card hover:bg-muted transition-colors">
              <UserPlus className="h-3.5 w-3.5" strokeWidth={1.75} /> Add new hire
            </Link>
            <Link to="/hr/orientation-queue" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] text-foreground border border-border/70 bg-card hover:bg-muted transition-colors">
              <CalendarPlus className="h-3.5 w-3.5" strokeWidth={1.75} /> Orientation
            </Link>
            <Link to="/hr/training-center" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] text-foreground border border-border/70 bg-card hover:bg-muted transition-colors">
              <BookOpen className="h-3.5 w-3.5" strokeWidth={1.75} /> Training Management
            </Link>
            <Link to="/hr/requests" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] text-foreground border border-border/70 bg-card hover:bg-muted transition-colors">
              <Inbox className="h-3.5 w-3.5" strokeWidth={1.75} /> Requests
            </Link>
          </div>
        </header>

        {/* kpi strip */}
        <div className="grid gap-3 mb-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-2xl border border-border/70 bg-card p-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{k.label}</p>
              <p className="text-2xl font-semibold tracking-tight mt-1">{data.loading ? "—" : k.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* main */}
          <div className="space-y-6 min-w-0">
            {/* tabs + search */}
            <Card className="p-2">
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <div className="flex flex-wrap gap-1 flex-1">
                  {TABS.map((t) => {
                    const active = tab === t.key;
                    return (
                      <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={cn(
                          "inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12.5px] transition-colors",
                          active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"
                        )}
                      >
                        <t.icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
                <div className="relative md:w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search employees…"
                    className="w-full h-8 pl-8 pr-3 rounded-lg bg-muted/60 border border-border/70 text-[12.5px] placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-transparent transition"
                  />
                </div>
              </div>
            </Card>

            {tab === "onboarding"  && <OnboardingPanel  data={data} empById={empById} query={query} />}
            {tab === "orientation" && <OrientationPanel data={data} empById={empById} query={query} />}
            {tab === "training"    && <TrainingPanel    data={data} empById={empById} query={query} />}
            {tab === "certs"       && <CertsPanel       data={data} empById={empById} query={query} />}
            {tab === "support"     && <SupportPanel     />}
            {tab === "evaluations" && <EvaluationsPanel data={data} empById={empById} query={query} />}
            {tab === "readiness"   && <ReadinessPanel   data={data} empById={empById} query={query} />}
          </div>

          {/* right rail */}
          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Today</h3>
              </div>
              <TodayList data={data} />
            </Card>

            <Card className="p-5">
              <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-3">Quick links</h3>
              <nav className="space-y-1">
                {[
                  { label: "Training Management", to: "/hr/training-center" },
                  { label: "Learner Academy",     to: "/academy" },
                  { label: "Resource Library",   to: "/hr/team-resources" },
                  { label: "HR Requests",        to: "/hr/requests" },
                  { label: "Messages & Updates", to: "/hr/messages" },
                  { label: "Compliance & Docs",  to: "/hr/compliance" },
                ].map((l) => (
                  <Link key={l.to} to={l.to} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-[13px] hover:bg-muted transition-colors">
                    <span>{l.label}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                  </Link>
                ))}
              </nav>
            </Card>

            <Card className="p-5 bg-muted/40">
              <div className="flex items-center gap-2 mb-3">
                <ClipboardList className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
                <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Priority Actions</h3>
              </div>
              <div className="space-y-1.5">
                {[
                  { label: "Clear onboarding blockers",       to: "/hr/new-hires" },
                  { label: "Verify missing certifications",   to: "/hr/compliance" },
                  { label: "Reschedule missed orientation",   to: "/hr/orientation-queue" },
                  { label: "Review readiness gaps",           to: "/hr/new-hires" },
                  { label: "Complete overdue onboarding tasks", to: "/hr/new-hires" },
                ].map((p) => (
                  <Link key={p.label} to={p.to} className="block w-full text-left rounded-lg px-2 py-1.5 text-[12.5px] text-muted-foreground hover:bg-card hover:text-foreground transition-colors">
                    {p.label}
                  </Link>
                ))}
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </OSShell>
  );
}

/* ---------------- panels ---------------- */

type Data = ReturnType<typeof useHRWorkspaceData>;
type PanelProps = { data: Data; empById: Map<string, Emp>; query: string };

function matchesQuery(e: Emp | undefined, q: string) {
  if (!q.trim()) return true;
  if (!e) return false;
  const s = `${e.first_name} ${e.last_name} ${e.job_title} ${e.state}`.toLowerCase();
  return s.includes(q.toLowerCase());
}

/* --- Onboarding board --- */
function OnboardingPanel({ data, empById, query }: PanelProps) {
  const stages = ONBOARDING_STAGES.filter((s) => !["on_hold", "incomplete"].includes(s.key));
  const taskByOnb = useMemo(() => {
    const m = new Map<string, TaskRow[]>();
    data.tasks.forEach((t) => {
      const arr = m.get(t.onboarding_id) ?? [];
      arr.push(t);
      m.set(t.onboarding_id, arr);
    });
    return m;
  }, [data.tasks]);

  const rows = data.onboarding.filter((o) => matchesQuery(empById.get(o.employee_id), query));

  if (data.loading) return <Card className="p-6"><p className="text-sm text-muted-foreground">Loading onboarding…</p></Card>;
  if (!rows.length) {
    return (
      <Card className="p-6">
        <Empty
          icon={CheckCircle2}
          title="No onboarding in progress."
          hint="When new hires move from offer accepted to ready for staffing, they will appear here."
        />
      </Card>
    );
  }

  return (
    <div className="overflow-x-auto -mx-2">
      <div className="flex gap-3 px-2 min-w-max">
        {stages.map((s) => {
          const items = rows.filter((r) => r.status === s.key);
          return (
            <Card key={s.key} className="w-72 shrink-0 p-3">
              <div className="flex items-center justify-between mb-2 px-1">
                <p className="text-[12px] font-medium tracking-tight">{s.label}</p>
                <span className="text-[11px] text-muted-foreground">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.length === 0 && (
                  <p className="px-2 py-3 text-[11.5px] text-muted-foreground/70">Empty.</p>
                )}
                {items.map((row) => {
                  const emp = empById.get(row.employee_id);
                  const tasks = taskByOnb.get(row.id) ?? [];
                  const done = tasks.filter((t) => t.completed).length;
                  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
                  const age = daysSince(row.stage_entered_at);
                  return (
                    <div key={row.id} className="rounded-xl border border-border/70 bg-background p-3 hover:border-border transition-colors">
                      <div className="flex items-start gap-2.5">
                        <Avatar first={emp?.first_name ?? "?"} last={emp?.last_name ?? ""} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium tracking-tight truncate">{emp ? fullName(emp) : "Unknown"}</p>
                          <p className="text-[11.5px] text-muted-foreground truncate">{emp?.job_title} · {emp?.state}</p>
                        </div>
                      </div>
                      <div className="mt-2.5 h-1 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-foreground/70" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{pct}% · {done}/{tasks.length || 0}</span>
                        <span>{age}d in stage</span>
                      </div>
                      {row.blockers?.length > 0 && (
                        <div className="mt-2">
                          <Pill tone="crit"><AlertTriangle className="h-3 w-3" strokeWidth={2} />{row.blockers[0]}</Pill>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* --- Orientation --- */
function OrientationPanel({ data, empById, query }: PanelProps) {
  // Orientation surface: pending_start employees + their onboarding status
  const pending = data.employees.filter((e) => e.status === "pending_start" && matchesQuery(e, query));
  if (data.loading) return <Card className="p-6"><p className="text-sm text-muted-foreground">Loading orientation…</p></Card>;
  if (!pending.length) {
    return (
      <Card className="p-6">
        <Empty icon={CalendarPlus} title="No one is awaiting orientation." hint="Pending starts and missed orientations show up here." />
      </Card>
    );
  }
  return (
    <Card className="divide-y divide-border/70">
      {pending.map((e) => {
        const onb = data.onboarding.find((o) => o.employee_id === e.id);
        const ready = onb?.status === "ready_for_start";
        const startIn = daysUntil(e.start_date);
        return (
          <div key={e.id} className="p-4 flex items-center gap-3">
            <Avatar first={e.first_name} last={e.last_name} />
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-medium tracking-tight truncate">{fullName(e)}</p>
              <p className="text-[12px] text-muted-foreground truncate">
                {e.job_title} · {e.state}{e.start_date ? ` · starts ${e.start_date}` : ""}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              {ready
                ? <Pill tone="ok"><CheckCircle2 className="h-3 w-3" />Ready</Pill>
                : onb
                ? <Pill tone="warn">{stageLabel(onb.status)}</Pill>
                : <Pill tone="muted">Not started</Pill>}
              {Number.isFinite(startIn) && startIn < 0 && <Pill tone="crit">Missed</Pill>}
              {Number.isFinite(startIn) && startIn >= 0 && startIn <= 7 && <Pill tone="warn">In {startIn}d</Pill>}
            </div>
          </div>
        );
      })}
    </Card>
  );
}

/* --- Training --- */
function TrainingPanel({ data, empById, query }: PanelProps) {
  if (data.loading) return <Card className="p-6"><p className="text-sm text-muted-foreground">Loading training…</p></Card>;
  const rows = data.trainings.filter((t) => matchesQuery(empById.get(t.employee_id), query));
  const overdue = rows.filter((t) => t.status !== "completed" && t.due_date && daysUntil(t.due_date) < 0);
  const inProgress = rows.filter((t) => t.status === "in_progress" || (t.status === "assigned" && !(t.due_date && daysUntil(t.due_date) < 0)));

  if (!rows.length) {
    return (
      <Card className="p-6">
        <Empty icon={GraduationCap} title="No training assignments yet." hint="Assignments from Training Academy will surface here." />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <TrainingList title="Overdue" rows={overdue} empById={empById} tone="crit" />
      <TrainingList title="In progress" rows={inProgress} empById={empById} tone="warn" />
    </div>
  );
}

function TrainingList({ title, rows, empById, tone }: { title: string; rows: TrainingRow[]; empById: Map<string, Emp>; tone: Tone }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3 px-1">
        <p className="text-[12px] font-medium tracking-tight">{title}</p>
        <span className="text-[11px] text-muted-foreground">{rows.length}</span>
      </div>
      {rows.length === 0 ? (
        <p className="px-2 py-4 text-[12px] text-muted-foreground">Nothing here.</p>
      ) : (
        <ul className="divide-y divide-border/70">
          {rows.map((t) => {
            const e = empById.get(t.employee_id);
            return (
              <li key={t.id} className="py-2.5 flex items-center gap-3">
                <Avatar first={e?.first_name ?? "?"} last={e?.last_name ?? ""} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium tracking-tight truncate">{e ? fullName(e) : "Unknown"}</p>
                  <p className="text-[11.5px] text-muted-foreground truncate">{e?.job_title} · {e?.state}{t.due_date ? ` · due ${t.due_date}` : ""}</p>
                </div>
                <Pill tone={tone}>{t.status.replace("_", " ")}</Pill>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

/* --- Certifications --- */
function CertsPanel({ data, empById, query }: PanelProps) {
  if (data.loading) return <Card className="p-6"><p className="text-sm text-muted-foreground">Loading certifications…</p></Card>;
  const rows = data.documents.filter((d) => matchesQuery(empById.get(d.employee_id), query));
  if (!rows.length) {
    return (
      <Card className="p-6">
        <Empty icon={ShieldCheck} title="No certifications tracked yet." hint="Upload certifications and credentials in Compliance & Documents." />
      </Card>
    );
  }

  const sorted = [...rows].sort((a, b) => {
    const da = a.expires_on ? daysUntil(a.expires_on) : Infinity;
    const db = b.expires_on ? daysUntil(b.expires_on) : Infinity;
    return da - db;
  });

  return (
    <Card className="divide-y divide-border/70">
      {sorted.map((d) => {
        const e = empById.get(d.employee_id);
        const dleft = d.expires_on ? daysUntil(d.expires_on) : Infinity;
        const tone: Tone =
          d.status === "expired" || dleft < 0 ? "crit" :
          dleft <= 30 ? "warn" :
          d.status === "verified" ? "ok" : "muted";
        const label =
          d.status === "expired" || dleft < 0 ? "Expired" :
          dleft <= 30 && Number.isFinite(dleft) ? `Expires in ${dleft}d` :
          d.status === "verified" ? "Valid" : d.status;
        return (
          <div key={d.id} className="p-4 flex items-center gap-3">
            <Avatar first={e?.first_name ?? "?"} last={e?.last_name ?? ""} />
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-medium tracking-tight truncate">{e ? fullName(e) : "Unknown"}</p>
              <p className="text-[12px] text-muted-foreground truncate">
                {d.name} · {d.doc_type}{d.expires_on ? ` · exp ${d.expires_on}` : ""}
              </p>
            </div>
            <Pill tone={tone}>{label}</Pill>
          </div>
        );
      })}
    </Card>
  );
}

/* --- Support (no backing table yet) --- */
function SupportPanel() {
  return (
    <Card className="p-6">
      <Empty
        icon={Heart}
        title="No open employee support requests."
        hint="Requests submitted via HR Requests will appear here for triage."
      />
      <div className="mt-4 flex justify-center">
        <Link to="/hr/requests" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] text-foreground border border-border/70 bg-card hover:bg-muted transition-colors">
          <Inbox className="h-3.5 w-3.5" strokeWidth={1.75} /> Open HR Requests
        </Link>
      </div>
    </Card>
  );
}

/* --- Evaluations --- */
function EvaluationsPanel({ data, empById, query }: PanelProps) {
  if (data.loading) return <Card className="p-6"><p className="text-sm text-muted-foreground">Loading evaluations…</p></Card>;
  const rows = data.reviews
    .filter((r) => matchesQuery(empById.get(r.employee_id), query))
    .sort((a, b) => daysUntil(a.due_date) - daysUntil(b.due_date));
  if (!rows.length) {
    return (
      <Card className="p-6">
        <Empty icon={ClipboardCheck} title="No evaluations scheduled." hint="Quarterly and annual reviews will show up here as they’re created." />
      </Card>
    );
  }
  return (
    <Card className="divide-y divide-border/70">
      {rows.map((r) => {
        const e = empById.get(r.employee_id);
        const dleft = daysUntil(r.due_date);
        const tone: Tone = r.status === "completed" ? "ok" : dleft < 0 ? "crit" : dleft <= 14 ? "warn" : "muted";
        return (
          <div key={r.id} className="p-4 flex items-center gap-3">
            <Avatar first={e?.first_name ?? "?"} last={e?.last_name ?? ""} />
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-medium tracking-tight truncate">{e ? fullName(e) : "Unknown"}</p>
              <p className="text-[12px] text-muted-foreground truncate">
                {r.review_type} review{r.reviewer_name ? ` · ${r.reviewer_name}` : ""}{r.due_date ? ` · due ${r.due_date}` : ""}
              </p>
            </div>
            <Pill tone={tone}>{r.status === "completed" ? "Done" : dleft < 0 ? "Overdue" : dleft <= 14 ? `In ${dleft}d` : r.status}</Pill>
          </div>
        );
      })}
    </Card>
  );
}

/* --- Readiness --- */
function ReadinessPanel({ data, empById, query }: PanelProps) {
  if (data.loading) return <Card className="p-6"><p className="text-sm text-muted-foreground">Loading readiness…</p></Card>;

  // Score each pending_start or onboarding employee.
  const candidates = data.employees.filter((e) => e.status === "pending_start" && matchesQuery(e, query));
  if (!candidates.length) {
    return (
      <Card className="p-6">
        <Empty icon={Activity} title="Everyone is staffing-ready." hint="Readiness blockers across onboarding, certs, and training will surface here." />
      </Card>
    );
  }

  const rows = candidates.map((e) => {
    const onb = data.onboarding.find((o) => o.employee_id === e.id);
    const blockers: string[] = [];
    if (!onb) blockers.push("Onboarding not started");
    else {
      if (onb.status !== "ready_for_start") blockers.push(stageLabel(onb.status));
      onb.blockers?.forEach((b) => blockers.push(b));
    }
    const missingDocs = data.documents.filter((d) => d.employee_id === e.id && d.required && d.status !== "verified").length;
    if (missingDocs) blockers.push(`${missingDocs} document${missingDocs > 1 ? "s" : ""} pending`);
    const overdueTr = data.trainings.filter((t) => t.employee_id === e.id && t.status !== "completed" && t.due_date && daysUntil(t.due_date) < 0).length;
    if (overdueTr) blockers.push(`${overdueTr} training overdue`);

    const score = Math.max(0, 100 - blockers.length * 25);
    const status: { label: string; tone: Tone } =
      score >= 100 ? { label: "Ready", tone: "ok" } :
      score >= 75  ? { label: "Almost ready", tone: "warn" } :
      score >= 25  ? { label: "Needs attention", tone: "warn" } :
                     { label: "Blocked", tone: "crit" };
    return { e, score, blockers, status };
  }).sort((a, b) => a.score - b.score);

  return (
    <Card className="divide-y divide-border/70">
      {rows.map(({ e, score, blockers, status }) => (
        <div key={e.id} className="p-4 flex items-center gap-3">
          <Avatar first={e.first_name} last={e.last_name} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-[13.5px] font-medium tracking-tight truncate">{fullName(e)}</p>
              <span className="text-[11px] text-muted-foreground">· {e.job_title} · {e.state}</span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1 w-32 rounded-full bg-muted overflow-hidden">
                <div className={cn("h-full", status.tone === "ok" ? "bg-emerald-500" : status.tone === "warn" ? "bg-amber-500" : "bg-destructive")} style={{ width: `${score}%` }} />
              </div>
              <span className="text-[11px] text-muted-foreground">{score}%</span>
              {blockers.length > 0 && (
                <span className="text-[11.5px] text-muted-foreground truncate">· {blockers.slice(0, 2).join(" · ")}</span>
              )}
            </div>
          </div>
          <Pill tone={status.tone}>{status.label}</Pill>
        </div>
      ))}
    </Card>
  );
}

/* --- Today rail --- */
function TodayList({ data }: { data: Data }) {
  const items: { label: string; count: number; to: string; tone: Tone }[] = [
    {
      label: "Onboarding tasks due",
      count: data.tasks.filter((t) => !t.completed && t.due_date && daysUntil(t.due_date) <= 0).length,
      to: "/hr/new-hires",
      tone: "warn",
    },
    {
      label: "Orientations today",
      count: data.employees.filter((e) => e.status === "pending_start" && e.start_date && daysUntil(e.start_date) === 0).length,
      to: "/hr/orientation-queue",
      tone: "warn",
    },
    {
      label: "Training overdue",
      count: data.trainings.filter((t) => t.status !== "completed" && t.due_date && daysUntil(t.due_date) < 0).length,
      to: "/hr/training-center",
      tone: "crit",
    },
    {
      label: "Expiring certifications",
      count: data.documents.filter((d) => d.expires_on && daysUntil(d.expires_on) <= 30 && daysUntil(d.expires_on) >= 0).length,
      to: "/hr/compliance",
      tone: "warn",
    },
    {
      label: "Evaluations due",
      count: data.reviews.filter((r) => r.status !== "completed" && r.due_date && daysUntil(r.due_date) <= 14).length,
      to: "/hr/evaluations",
      tone: "warn",
    },
  ];

  if (data.loading) return <p className="text-[12px] text-muted-foreground">Loading…</p>;
  const hasAny = items.some((i) => i.count > 0);
  if (!hasAny) {
    return <p className="text-[12.5px] text-muted-foreground">You’re all caught up. No urgent items today.</p>;
  }
  return (
    <ul className="space-y-1">
      {items.filter((i) => i.count > 0).map((i) => (
        <li key={i.label}>
          <Link to={i.to} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-muted transition-colors">
            <span className="text-[12.5px]">{i.label}</span>
            <Pill tone={i.tone}>{i.count}</Pill>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/* Avoid unused warnings for icons we keep as future affordances. */
void MessageSquare; void FileText; void TrendingUp;