import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap, Sparkles, Search, Plus, BookOpen, ShieldCheck, Award,
  Clock, AlertCircle, CheckCircle2, Send, UserPlus, ArrowRight, Filter,
  Workflow, Users, ChevronRight, FileText, ClipboardList,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { HRIntegrationStatusStrip } from "@/components/hr/HRIntegrationStatusStrip";
import { HRMessageHistory } from "@/components/hr/HRMessageHistory";
import {
  IntegrationReadinessPanel,
  ReadinessFilterChips,
  useIntegrationCatalogStatus,
  rowMatchesReadinessFilter,
  type OnboardingReadinessRow,
  type ReadinessFilter,
} from "@/components/hr/IntegrationReadinessPanel";
import { IntegrationReadinessSummary } from "@/components/hr/IntegrationReadinessSummary";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { queueHrMessage } from "@/lib/hr/activityEvents";

/* ---------------- types ---------------- */
interface Employee {
  id: string; first_name: string; last_name: string; job_title: string;
  state: string; status: string; hire_date: string | null; start_date: string | null;
}
interface Course {
  id: string; title: string; category: string | null; training_type: string;
  estimated_minutes: number | null; renewal_months: number | null;
  required_for_roles: string[]; role_visibility: string[]; status: string;
  updated_at: string;
}
interface EmpTraining {
  id: string; employee_id: string; course_id: string;
  status: "assigned" | "in_progress" | "completed" | "overdue" | string;
  assigned_at: string; due_date: string | null; completed_at: string | null;
  expires_on: string | null; score: number | null;
}
interface Track { id: string; name: string; description: string | null; }
interface Phase { id: string; track_id: string; name: string; position: number; }
interface Week { id: string; phase_id: string; week_number: number; title: string; }
interface ModuleRow { id: string; week_id: string; title: string; module_type: string; is_required: boolean; is_archived: boolean; }
interface Enrollment {
  id: string; track_id: string; employee_id: string;
  status: string; current_week_id: string | null;
  start_date: string | null;
}
interface Cert { id: string; track_id: string; code: string; name: string; description: string | null; }
interface UserCert { id: string; enrollment_id: string; certificate_id: string; awarded_at: string; }
interface Onboarding extends OnboardingReadinessRow {
  id: string;
  employee_id: string;
  status: string;
  blockers: string[] | null;
}

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

function Kpi({ label, value, tone = "muted", hint }: { label: string; value: string | number; tone?: Tone; hint?: string }) {
  const accent =
    tone === "crit" ? "text-destructive"
    : tone === "warn" ? "text-amber-700 dark:text-amber-400"
    : tone === "ok" ? "text-emerald-700 dark:text-emerald-400"
    : "text-foreground";
  return (
    <Card className="p-4">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("text-2xl font-semibold tracking-tight mt-1 tabular-nums", accent)}>{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}
    </Card>
  );
}

function HeaderBtn({ icon: Icon, children, primary, to = "#" }: { icon: React.ElementType; children: React.ReactNode; primary?: boolean; to?: string }) {
  const base = "inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] transition-colors";
  const cls = primary
    ? "bg-primary text-primary-foreground hover:opacity-90"
    : "text-foreground border border-border/70 bg-card hover:bg-muted";
  return (
    <Link to={to} className={cn(base, cls)}>
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} /> {children}
    </Link>
  );
}

/* ---------------- helpers ---------------- */
function daysBetween(a: Date, b: Date) {
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}
function fmtDate(d: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }
  catch { return d; }
}
function isOverdue(t: EmpTraining) {
  if (t.status === "completed") return false;
  if (!t.due_date) return false;
  return new Date(t.due_date).getTime() < Date.now();
}
function certStatus(expires: string | null): { tone: Tone; label: string } {
  if (!expires) return { tone: "ok", label: "Active" };
  const d = daysBetween(new Date(expires), new Date());
  if (d < 0) return { tone: "crit", label: "Expired" };
  if (d <= 30) return { tone: "warn", label: `Expires in ${d}d` };
  if (d <= 60) return { tone: "warn", label: "Expiring soon" };
  return { tone: "ok", label: "Active" };
}

/* ---------------- data hook ---------------- */
function useData() {
  const [state, setState] = useState({
    employees: [] as Employee[],
    courses: [] as Course[],
    empTrainings: [] as EmpTraining[],
    tracks: [] as Track[],
    phases: [] as Phase[],
    weeks: [] as Week[],
    modules: [] as ModuleRow[],
    enrollments: [] as Enrollment[],
    certs: [] as Cert[],
    userCerts: [] as UserCert[],
    onboarding: [] as Onboarding[],
    loading: true,
  });

  useEffect(() => {
    let cancel = false;
    (async () => {
      const [emp, crs, etr, tr, ph, wk, md, en, ct, uc, ob] = await Promise.all([
        supabase.from("employees").select("id,first_name,last_name,job_title,state,status,hire_date,start_date").neq("status", "terminated").order("last_name"),
        supabase.from("training_courses").select("id,title,category,training_type,estimated_minutes,renewal_months,required_for_roles,role_visibility,status,updated_at").eq("status", "active"),
        supabase.from("employee_trainings").select("id,employee_id,course_id,status,assigned_at,due_date,completed_at,expires_on,score"),
        supabase.from("academy_tracks").select("id,name,description").order("name"),
        supabase.from("academy_phases").select("id,track_id,name,position").order("position"),
        supabase.from("academy_weeks").select("id,phase_id,week_number,title").order("week_number"),
        supabase.from("academy_modules").select("id,week_id,title,module_type,is_required,is_archived").eq("is_archived", false),
        supabase.from("academy_enrollments").select("id,track_id,employee_id,status,current_week_id,start_date"),
        supabase.from("academy_certificates").select("id,track_id,code,name,description"),
        supabase.from("academy_user_certificates").select("id,enrollment_id,certificate_id,awarded_at"),
        supabase.from("employee_onboarding").select("id,employee_id,status,blockers,viventium_status,viventium_synced_at,viventium_notes,stellar_status,stellar_synced_at,stellar_notes,centralreach_status,centralreach_synced_at,centralreach_notes"),
      ]);
      if (cancel) return;
      setState({
        employees: (emp.data ?? []) as Employee[],
        courses: (crs.data ?? []) as Course[],
        empTrainings: (etr.data ?? []) as EmpTraining[],
        tracks: (tr.data ?? []) as Track[],
        phases: (ph.data ?? []) as Phase[],
        weeks: (wk.data ?? []) as Week[],
        modules: (md.data ?? []) as ModuleRow[],
        enrollments: (en.data ?? []) as Enrollment[],
        certs: (ct.data ?? []) as Cert[],
        userCerts: (uc.data ?? []) as UserCert[],
        onboarding: (ob.data ?? []) as Onboarding[],
        loading: false,
      });
    })();
    return () => { cancel = true; };
  }, []);

  return state;
}

/* ---------------- HR journey catalog (operational categories) ---------------- */
const HR_JOURNEY_GROUPS = [
  {
    group: "Foundation",
    items: ["Welcome to Blossom", "HR Team Onboarding", "Using Blossom OS", "Communication Standards"],
  },
  {
    group: "Onboarding Operations",
    items: ["New Hire Workflow", "Orientation Process", "Viventium Workflow", "Background Check Coordination", "Staffing Readiness Workflow"],
  },
  {
    group: "Employee Support",
    items: ["Supporting RBTs", "Supporting BCBAs", "Employee Communication", "Escalation Handling"],
  },
  {
    group: "Training Management",
    items: ["Creating Journeys", "Module Management", "Quiz Management", "Certification Tracking"],
  },
  {
    group: "Systems",
    items: ["Monday.com HR Workflows", "Viventium Operations", "CentralReach Employee Setup", "Resource Library Management"],
  },
  {
    group: "Evaluations & Growth",
    items: ["Evaluations Workflow", "Coaching Standards", "Growth Planning"],
  },
];

/* ---------------- page ---------------- */
type FilterKey = "all" | "overdue" | "in_progress" | "completed" | "not_started" | "blocked";

export default function OSHRTrainingCerts() {
  const d = useData();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [readinessFilter, setReadinessFilter] = useState<ReadinessFilter>("all");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [messageRefresh, setMessageRefresh] = useState(0);
  const { catalog: readinessCatalog } = useIntegrationCatalogStatus();

  /* indexes */
  const empById = useMemo(() => Object.fromEntries(d.employees.map(e => [e.id, e])), [d.employees]);
  const courseById = useMemo(() => Object.fromEntries(d.courses.map(c => [c.id, c])), [d.courses]);
  const trackById = useMemo(() => Object.fromEntries(d.tracks.map(t => [t.id, t])), [d.tracks]);
  const certById = useMemo(() => Object.fromEntries(d.certs.map(c => [c.id, c])), [d.certs]);
  const enrollById = useMemo(() => Object.fromEntries(d.enrollments.map(e => [e.id, e])), [d.enrollments]);

  /* derived stats */
  const stats = useMemo(() => {
    const overdueTrainings = d.empTrainings.filter(isOverdue).length;
    const activeLearners = new Set(
      d.enrollments.filter(e => e.status !== "completed").map(e => e.employee_id)
        .concat(d.empTrainings.filter(t => t.status !== "completed").map(t => t.employee_id)),
    ).size;
    const certsExpiring = d.empTrainings.filter(t => {
      if (!t.expires_on) return false;
      const days = daysBetween(new Date(t.expires_on), new Date());
      return days >= 0 && days <= 30;
    }).length;
    const incompleteJourneys = d.enrollments.filter(e => e.status !== "completed").length;
    const blockedEmps = d.onboarding.filter(o => (o.blockers ?? []).length > 0).length
      + new Set(d.empTrainings.filter(isOverdue).map(t => t.employee_id)).size;
    const certsPending = d.empTrainings.filter(t => t.status === "completed" && !t.score).length;
    return { overdueTrainings, activeLearners, certsExpiring, incompleteJourneys, blockedEmps, certsPending };
  }, [d]);

  /* training operations rows (per active assignment) */
  const trainingRows = useMemo(() => {
    let rows = d.empTrainings.map(t => {
      const emp = empById[t.employee_id];
      const course = courseById[t.course_id];
      const overdue = isOverdue(t);
      const tone: Tone =
        t.status === "completed" ? "ok"
        : overdue ? "crit"
        : t.status === "in_progress" ? "warn"
        : "muted";
      const label =
        t.status === "completed" ? "Completed"
        : overdue ? "Overdue"
        : t.status === "in_progress" ? "In progress"
        : t.status === "assigned" ? "Not started"
        : t.status.replace("_", " ");
      return { t, emp, course, tone, label, overdue };
    });
    if (filter === "overdue") rows = rows.filter(r => r.overdue);
    else if (filter === "in_progress") rows = rows.filter(r => r.t.status === "in_progress");
    else if (filter === "completed") rows = rows.filter(r => r.t.status === "completed");
    else if (filter === "not_started") rows = rows.filter(r => r.t.status === "assigned");
    if (query) {
      const q = query.toLowerCase();
      rows = rows.filter(r =>
        (r.emp && `${r.emp.first_name} ${r.emp.last_name}`.toLowerCase().includes(q)) ||
        (r.course?.title.toLowerCase().includes(q)),
      );
    }
    return rows;
  }, [d.empTrainings, empById, courseById, filter, query]);

  /* readiness blockers (onboarding blockers + overdue training) */
  const blockerRows = useMemo(() => {
    const items: {
      emp: Employee | undefined;
      onb?: Onboarding;
      kind: string;
      detail: string;
      days: number | null;
    }[] = [];
    d.onboarding.forEach(o => {
      (o.blockers ?? []).forEach(b => {
        items.push({ emp: empById[o.employee_id], onb: o, kind: "Onboarding blocker", detail: b, days: null });
      });
    });
    d.empTrainings.filter(isOverdue).forEach(t => {
      const days = t.due_date ? daysBetween(new Date(), new Date(t.due_date)) : null;
      items.push({
        emp: empById[t.employee_id],
        onb: d.onboarding.find(o => o.employee_id === t.employee_id),
        kind: "Overdue training",
        detail: courseById[t.course_id]?.title ?? "Training",
        days,
      });
    });
    return items.slice(0, 20);
  }, [d.onboarding, d.empTrainings, empById, courseById]);

  /* filter blocker rows by integration readiness of the employee's onboarding row */
  const filteredBlockerRows = useMemo(() => {
    if (readinessFilter === "all") return blockerRows;
    return blockerRows.filter(b => b.onb && rowMatchesReadinessFilter(b.onb, readinessCatalog, readinessFilter));
  }, [blockerRows, readinessFilter, readinessCatalog]);

  /* counts for each filter chip (based on distinct onboarding rows) */
  const readinessCounts = useMemo(() => ({
    all: d.onboarding.length,
    missing_connected: d.onboarding.filter(o => rowMatchesReadinessFilter(o, readinessCatalog, "missing_connected")).length,
    missing_synced: d.onboarding.filter(o => rowMatchesReadinessFilter(o, readinessCatalog, "missing_synced")).length,
    missing_any: d.onboarding.filter(o => rowMatchesReadinessFilter(o, readinessCatalog, "missing_any")).length,
  }), [d.onboarding, readinessCatalog]);

  /* certifications view — from employee_trainings with renewal/expires + academy certs */
  const certRows = useMemo(() => {
    const rows = d.empTrainings
      .filter(t => t.expires_on || (t.completed_at && (courseById[t.course_id]?.renewal_months ?? 0) > 0))
      .map(t => {
        const emp = empById[t.employee_id];
        const c = courseById[t.course_id];
        const status = certStatus(t.expires_on);
        return { id: t.id, emp, name: c?.title ?? "Certification", awarded: t.completed_at, expires: t.expires_on, status };
      });
    // Awarded academy certs (active, no expiry)
    const academy = d.userCerts.map(uc => {
      const enr = enrollById[uc.enrollment_id];
      const emp = enr ? empById[enr.employee_id] : undefined;
      const c = certById[uc.certificate_id];
      return { id: uc.id, emp, name: c?.name ?? "Certificate", awarded: uc.awarded_at, expires: null as string | null, status: { tone: "ok" as Tone, label: "Active" } };
    });
    return [...rows, ...academy];
  }, [d.empTrainings, d.userCerts, empById, courseById, certById, enrollById]);

  const hrTrack = d.tracks.find(t => t.name === "HR Admin Assistant");

  return (
    <OSShell>
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10 py-10">
        {/* header */}
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-start">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="h-11 w-11 rounded-2xl bg-muted grid place-items-center shrink-0">
              <GraduationCap className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Training &amp; Certifications</h1>
              <p className="text-[13px] text-muted-foreground mt-1 max-w-2xl">
                Manage onboarding journeys, operational learning, certifications, readiness, and employee development across Blossom.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <HeaderBtn icon={UserPlus} to="/hr/training-center">Assign training</HeaderBtn>
            <HeaderBtn icon={Workflow} to="/training/manage">Create journey</HeaderBtn>
            <HeaderBtn icon={BookOpen} to="/training/manage">Create module</HeaderBtn>
            <HeaderBtn icon={ShieldCheck} to="/hr/compliance">Manage certifications</HeaderBtn>
          </div>
        </header>
        <HRIntegrationStatusStrip className="mb-6" />

        {/* KPI snapshot */}
        <div className="grid gap-3 mb-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <Kpi label="Active learners" value={d.loading ? "—" : stats.activeLearners} hint="In an active journey or assignment" />
          <Kpi label="Training overdue" value={d.loading ? "—" : stats.overdueTrainings} tone={stats.overdueTrainings ? "crit" : "ok"} hint="Past due date" />
          <Kpi label="Certs expiring (30d)" value={d.loading ? "—" : stats.certsExpiring} tone={stats.certsExpiring ? "warn" : "ok"} hint="Renewal window" />
          <Kpi label="Incomplete journeys" value={d.loading ? "—" : stats.incompleteJourneys} hint="Not yet completed" />
          <Kpi label="Readiness blocked" value={d.loading ? "—" : stats.blockedEmps} tone={stats.blockedEmps ? "warn" : "ok"} hint="Onboarding or training" />
          <Kpi label="Pending review" value={d.loading ? "—" : stats.certsPending} hint="Awaiting HR sign-off" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* MAIN */}
          <div className="space-y-6 min-w-0">

            {/* TRAINING OPERATIONS — primary */}
            <section>
              <div className="flex items-end justify-between mb-3 gap-3">
                <div>
                  <h2 className="text-base font-medium tracking-tight">Training operations</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Live employee training assignments — drawn from operational records.</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search employees or training…"
                      className="w-56 h-8 pl-8 pr-3 rounded-lg bg-muted/60 border border-border/70 text-[12.5px] placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-transparent transition"
                    />
                  </div>
                </div>
              </div>

              <Card>
                <div className="flex items-center gap-1.5 p-2 border-b border-border/70 overflow-x-auto">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground ml-1 mr-1" strokeWidth={1.75} />
                  {([
                    ["all", "All"],
                    ["overdue", `Overdue (${stats.overdueTrainings})`],
                    ["in_progress", "In progress"],
                    ["not_started", "Not started"],
                    ["completed", "Completed"],
                  ] as [FilterKey, string][]).map(([k, label]) => (
                    <button
                      key={k}
                      onClick={() => setFilter(k)}
                      className={cn(
                        "h-7 px-3 rounded-lg text-[12px] transition-colors whitespace-nowrap",
                        filter === k ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted",
                      )}
                    >{label}</button>
                  ))}
                </div>

                {d.loading ? (
                  <div className="p-6"><p className="text-sm text-muted-foreground">Loading…</p></div>
                ) : trainingRows.length === 0 ? (
                  <Empty
                    icon={CheckCircle2}
                    title="Everyone is progressing smoothly."
                    hint="No training assignments match this filter."
                  />
                ) : (
                  <ul className="divide-y divide-border/70">
                    {trainingRows.slice(0, 30).map(r => (
                      <li key={r.t.id} className="px-4 py-3 flex items-center gap-3 hover:bg-muted/40 transition-colors">
                        <div className="h-8 w-8 rounded-xl bg-muted grid place-items-center shrink-0 text-[11px] font-medium">
                          {r.emp ? `${r.emp.first_name[0]}${r.emp.last_name[0]}` : "—"}
                        </div>
                        <div className="min-w-0 flex-1 grid grid-cols-1 md:grid-cols-[1.2fr_1.5fr_auto] gap-2 md:gap-4 items-center">
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium tracking-tight truncate">
                              {r.emp ? `${r.emp.first_name} ${r.emp.last_name}` : "Unknown employee"}
                            </p>
                            <p className="text-[11.5px] text-muted-foreground truncate">{r.emp?.job_title} · {r.emp?.state}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] truncate">{r.course?.title ?? "Course"}</p>
                            <p className="text-[11.5px] text-muted-foreground truncate">
                              Due {fmtDate(r.t.due_date)} · Assigned {fmtDate(r.t.assigned_at)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 justify-end">
                            <Pill tone={r.tone}>{r.label}</Pill>
                            <button
                              onClick={async () => {
                                const name = r.emp ? `${r.emp.first_name} ${r.emp.last_name}` : "employee";
                                const res = await queueHrMessage({
                                  body: `Reminder for ${name}: ${r.course?.title ?? "training"} is due ${r.t.due_date ?? "soon"}.`,
                                  subject: "Training reminder",
                                  employeeId: r.emp?.id ?? null,
                                  channels: ["in_app"],
                                  metadata: { training_id: r.t.id, course_id: r.t.course_id, source: "training_reminder" },
                                });
                                toast({ title: res.status === "queued" ? "Reminder queued in Blossom OS" : "Could not queue reminder" });
                                if (r.emp?.id) {
                                  setSelectedEmployeeId(r.emp.id);
                                  setMessageRefresh((n) => n + 1);
                                }
                              }}
                              className="h-7 px-2.5 rounded-lg text-[12px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors inline-flex items-center gap-1"
                            >
                              <Send className="h-3 w-3" strokeWidth={1.75} /> Remind
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
              {selectedEmployeeId && (
                <div className="mt-3 rounded-2xl border border-border/70 bg-card p-3">
                  <HRMessageHistory
                    employeeId={selectedEmployeeId}
                    refreshKey={messageRefresh}
                    title="Recent HR messages for this employee"
                  />
                </div>
              )}
            </section>

            {/* LEARNING JOURNEYS */}
            <section>
              <div className="flex items-end justify-between mb-3">
                <div>
                  <h2 className="text-base font-medium tracking-tight">HR learning journeys</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Operational journeys for the HR Team — anchored on the HR Admin Assistant track.</p>
                </div>
                <Link to="/academy" className="text-[12px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                  Open learner academy <ArrowRight className="h-3 w-3" strokeWidth={1.75} />
                </Link>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {HR_JOURNEY_GROUPS.map(g => {
                  const isFoundation = g.group === "Foundation";
                  const liveStats = isFoundation && hrTrack
                    ? {
                        modules: d.modules.filter(m => {
                          const w = d.weeks.find(w => w.id === m.week_id);
                          const ph = w ? d.phases.find(p => p.id === w.phase_id) : null;
                          return ph?.track_id === hrTrack.id;
                        }).length,
                        learners: d.enrollments.filter(e => e.track_id === hrTrack.id).length,
                      }
                    : null;
                  return (
                    <Card key={g.group} className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{g.group}</p>
                          <h3 className="text-[14.5px] font-medium tracking-tight mt-1">
                            {isFoundation ? hrTrack?.name ?? "HR Admin Assistant" : `${g.group} journey`}
                          </h3>
                        </div>
                        <Pill tone={isFoundation ? "info" : "muted"}>
                          {isFoundation ? "Published" : "Draft"}
                        </Pill>
                      </div>
                      <ul className="mt-3 space-y-1.5">
                        {g.items.map(i => (
                          <li key={i} className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
                            <span className="h-1 w-1 rounded-full bg-muted-foreground/50" /> {i}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-4 flex items-center justify-between text-[11.5px] text-muted-foreground">
                        <span>
                          {liveStats ? `${liveStats.modules} modules · ${liveStats.learners} learners` : `${g.items.length} modules planned`}
                        </span>
                        <Link to="/hr/training-center" className="inline-flex items-center gap-1 text-foreground hover:text-primary transition-colors">
                          Open <ChevronRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>

            {/* MODULE LIBRARY */}
            <section>
              <div className="flex items-end justify-between mb-3">
                <h2 className="text-base font-medium tracking-tight">Module library</h2>
                <Link to="/training/manage" className="text-[12px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                  Manage modules <ArrowRight className="h-3 w-3" strokeWidth={1.75} />
                </Link>
              </div>
              {d.loading ? (
                <Card className="p-6"><p className="text-sm text-muted-foreground">Loading…</p></Card>
              ) : d.courses.length === 0 && d.modules.length === 0 ? (
                <Card className="p-6">
                  <Empty icon={BookOpen} title="No modules published yet." hint="Create the first module to start building HR operational content." />
                </Card>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {d.courses.slice(0, 9).map(c => (
                    <Card key={c.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-xl bg-muted grid place-items-center shrink-0">
                          <FileText className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13.5px] font-medium tracking-tight truncate">{c.title}</p>
                          <p className="text-[11.5px] text-muted-foreground truncate">
                            {c.category ?? c.training_type} · {c.estimated_minutes ?? "—"} min
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {(c.required_for_roles ?? []).slice(0, 3).map(r => (
                              <span key={r} className="text-[10.5px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{r}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* CERTIFICATIONS */}
            <section>
              <h2 className="text-base font-medium tracking-tight mb-3">Certifications</h2>
              <Card>
                {d.loading ? (
                  <div className="p-6"><p className="text-sm text-muted-foreground">Loading…</p></div>
                ) : certRows.length === 0 ? (
                  <Empty icon={Award} title="All certifications are current." hint="No active certification records yet." />
                ) : (
                  <ul className="divide-y divide-border/70">
                    {certRows.slice(0, 20).map(r => (
                      <li key={r.id} className="px-4 py-3 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-muted grid place-items-center shrink-0">
                          <Award className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                        </div>
                        <div className="min-w-0 flex-1 grid grid-cols-1 md:grid-cols-[1.2fr_1.5fr_auto] gap-2 md:gap-4 items-center">
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium tracking-tight truncate">
                              {r.emp ? `${r.emp.first_name} ${r.emp.last_name}` : "—"}
                            </p>
                            <p className="text-[11.5px] text-muted-foreground truncate">{r.emp?.job_title}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] truncate">{r.name}</p>
                            <p className="text-[11.5px] text-muted-foreground truncate">
                              Awarded {fmtDate(r.awarded)} · Expires {fmtDate(r.expires)}
                            </p>
                          </div>
                          <Pill tone={r.status.tone}>{r.status.label}</Pill>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </section>

            {/* READINESS BLOCKERS */}
            <section>
              <div className="flex items-end justify-between mb-3 gap-3 flex-wrap">
                <div>
                  <h2 className="text-base font-medium tracking-tight">Readiness blockers</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Filter by integration readiness — providers must be connected and rows must be synced.
                  </p>
                </div>
                <ReadinessFilterChips
                  value={readinessFilter}
                  onChange={setReadinessFilter}
                  counts={readinessCounts}
                />
              </div>
              <Card>
                {d.loading ? (
                  <div className="p-6"><p className="text-sm text-muted-foreground">Loading…</p></div>
                ) : filteredBlockerRows.length === 0 ? (
                  <Empty
                    icon={CheckCircle2}
                    title={readinessFilter === "all" ? "No training blockers right now." : "No employees match this readiness filter."}
                    hint={readinessFilter === "all" ? "No employees are blocked by training or onboarding." : "Try a different readiness filter."}
                  />
                ) : (
                  <ul className="divide-y divide-border/70">
                    {filteredBlockerRows.map((b, i) => (
                      <li key={i} className="px-4 py-3 flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-xl bg-destructive/10 text-destructive grid place-items-center shrink-0">
                            <AlertCircle className="h-4 w-4" strokeWidth={1.75} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-medium tracking-tight truncate">
                              {b.emp ? `${b.emp.first_name} ${b.emp.last_name}` : "Unknown"}
                              <span className="text-muted-foreground font-normal"> · {b.emp?.job_title}</span>
                            </p>
                            <p className="text-[11.5px] text-muted-foreground truncate">{b.kind}: {b.detail}</p>
                          </div>
                          {b.days != null && <Pill tone="crit">{b.days}d overdue</Pill>}
                          <Link to="/hr/employee-support" className="h-7 px-2.5 rounded-lg text-[12px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                            Resolve
                          </Link>
                        </div>
                        {b.onb && <IntegrationReadinessPanel row={b.onb} className="ml-11" />}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </section>
          </div>

          {/* RIGHT RAIL */}
          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <Card className="p-5">
              <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-3">Integration readiness</h3>
              <p className="text-[12px] text-muted-foreground mb-3">
                Sync coverage across active onboarding records. Rows only count as synced when the provider is connected.
              </p>
              <IntegrationReadinessSummary rows={d.onboarding} />
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap className="h-4 w-4 text-primary" strokeWidth={1.75} />
                <h3 className="text-sm font-medium tracking-tight">Workflow Guidance</h3>
              </div>
              <p className="text-[12px] text-muted-foreground mb-3">
                Where to focus training and certification work.
              </p>
              <ul className="space-y-1.5">
                {[
                  "Who has overdue onboarding training?",
                  "Which certifications expire this month?",
                  "Who is blocked from readiness?",
                  "Show incomplete HR journeys.",
                  "Which onboarding modules are most overdue?",
                ].map(p => (
                  <li key={p}>
                    <button className="w-full text-left text-[12.5px] rounded-lg px-2.5 py-1.5 hover:bg-muted transition-colors">
                      {p}
                    </button>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-5">
              <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-3">Quick links</h3>
              <nav className="space-y-1">
                {[
                  { label: "Learner Academy", to: "/academy", icon: GraduationCap },
                  { label: "Training Management", to: "/hr/training-center", icon: Workflow },
                  { label: "New Hires", to: "/hr/new-hires", icon: UserPlus },
                  { label: "Employee Support", to: "/hr/employee-support", icon: Users },
                  { label: "Compliance & Documents", to: "/hr/compliance", icon: ShieldCheck },
                  { label: "Resource Library", to: "/resource-library", icon: BookOpen },
                ].map(l => (
                  <Link key={l.label} to={l.to} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-[13px] hover:bg-muted transition-colors">
                    <span className="inline-flex items-center gap-2">
                      <l.icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} /> {l.label}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                  </Link>
                ))}
              </nav>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                <h3 className="text-[12px] font-medium tracking-tight">Recent activity</h3>
              </div>
              {d.empTrainings.length === 0 && d.userCerts.length === 0 ? (
                <p className="text-[12px] text-muted-foreground">No recent training activity.</p>
              ) : (
                <ul className="space-y-2 text-[12px]">
                  {d.empTrainings.slice(0, 4).map(t => {
                    const e = empById[t.employee_id];
                    return (
                      <li key={t.id} className="flex items-start gap-2">
                        <ClipboardList className="h-3 w-3 text-muted-foreground mt-0.5" strokeWidth={1.75} />
                        <span className="truncate">
                          <span className="text-foreground">{e ? `${e.first_name} ${e.last_name}` : "Employee"}</span>
                          <span className="text-muted-foreground"> · {t.status.replace("_", " ")}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </aside>
        </div>
      </div>
    </OSShell>
  );
}
