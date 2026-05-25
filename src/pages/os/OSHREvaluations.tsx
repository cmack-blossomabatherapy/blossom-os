import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardCheck, Sparkles, Search, Plus, Filter, Calendar, MessageSquare,
  Target, TrendingUp, Award, ChevronRight, X, CheckCircle2, Clock,
  AlertCircle, Heart, ArrowRight, Send, FileText, Users,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

/* ---------------- types ---------------- */
type ReviewType = "30_day" | "60_day" | "90_day" | "annual" | "probationary" | "ad_hoc";
type ReviewStatus = "draft" | "manager_review" | "employee_acknowledge" | "completed" | "cancelled";

interface Employee {
  id: string; first_name: string; last_name: string; job_title: string;
  state: string; status: string; hire_date: string | null; start_date: string | null;
  department_id: string | null;
}
interface Review {
  id: string; employee_id: string; reviewer_id: string | null; reviewer_name: string | null;
  review_type: ReviewType; status: ReviewStatus; overall_rating: string | null;
  period_start: string | null; period_end: string | null;
  due_date: string | null; scheduled_for: string | null;
  strengths: string | null; growth_areas: string | null; goals: string | null;
  manager_comments: string | null; employee_comments: string | null;
  acknowledged_at: string | null; completed_at: string | null;
  created_at: string; updated_at: string;
}
interface OnboardingRow { id: string; employee_id: string; status: string; blockers: string[] | null; }
interface EmpTraining { id: string; employee_id: string; status: string; completed_at: string | null; due_date: string | null; }
interface TimelineRow { id: string; employee_id: string; event_type: string; description: string | null; created_at: string; }

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
  const cls = primary
    ? "bg-primary text-primary-foreground hover:opacity-90"
    : "text-foreground border border-border/70 bg-card hover:bg-muted";
  return (
    <Link to={to} className={cn("inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] transition-colors", cls)}>
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} /> {children}
    </Link>
  );
}

/* ---------------- helpers ---------------- */
const REVIEW_TYPE_LABEL: Record<ReviewType, string> = {
  "30_day": "30-Day",
  "60_day": "60-Day",
  "90_day": "90-Day",
  annual: "Annual",
  probationary: "Probationary",
  ad_hoc: "Coaching / Ad-hoc",
};

function fmtDate(d: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }
  catch { return d; }
}
function daysFromToday(d: string | null) {
  if (!d) return null;
  return Math.round((new Date(d).getTime() - Date.now()) / 86400000);
}
function evalEvaluationType(emp?: Employee): string {
  if (!emp) return "Office Employee Evaluation";
  const t = emp.job_title.toLowerCase();
  if (t.includes("rbt")) return "RBT Evaluation";
  if (t.includes("bcba")) return "BCBA Evaluation";
  if (t.includes("director") || t.includes("lead") || t.includes("manager")) return "Leadership Evaluation";
  return "Office Employee Evaluation";
}
function statusTone(s: ReviewStatus, dueDays: number | null): { tone: Tone; label: string } {
  if (s === "completed") return { tone: "ok", label: "Completed" };
  if (s === "cancelled") return { tone: "muted", label: "Cancelled" };
  if (s === "employee_acknowledge") return { tone: "info", label: "Acknowledgement" };
  if (s === "manager_review") return { tone: "warn", label: "Leadership review" };
  // draft
  if (dueDays != null && dueDays < 0) return { tone: "crit", label: "Overdue" };
  if (dueDays != null && dueDays <= 7) return { tone: "warn", label: "Due soon" };
  return { tone: "muted", label: "Not started" };
}

/* ---------------- data hook ---------------- */
function useData() {
  const [s, set] = useState({
    employees: [] as Employee[],
    reviews: [] as Review[],
    onboarding: [] as OnboardingRow[],
    empTrainings: [] as EmpTraining[],
    timeline: [] as TimelineRow[],
    loading: true,
  });
  useEffect(() => {
    let cancel = false;
    (async () => {
      const [emp, rev, ob, tr, tl] = await Promise.all([
        supabase.from("employees").select("id,first_name,last_name,job_title,state,status,hire_date,start_date,department_id").neq("status", "terminated").order("last_name"),
        supabase.from("employee_reviews").select("*"),
        supabase.from("employee_onboarding").select("id,employee_id,status,blockers"),
        supabase.from("employee_trainings").select("id,employee_id,status,completed_at,due_date"),
        supabase.from("employee_timeline").select("id,employee_id,event_type,description,created_at").order("created_at", { ascending: false }).limit(40),
      ]);
      if (cancel) return;
      set({
        employees: (emp.data ?? []) as Employee[],
        reviews: (rev.data ?? []) as Review[],
        onboarding: (ob.data ?? []) as OnboardingRow[],
        empTrainings: (tr.data ?? []) as EmpTraining[],
        timeline: (tl.data ?? []) as TimelineRow[],
        loading: false,
      });
    })();
    return () => { cancel = true; };
  }, []);
  return s;
}

/* ---------------- page ---------------- */
type FilterKey = "all" | "overdue" | "in_progress" | "scheduled" | "completed";

export default function OSHREvaluations() {
  const d = useData();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const empById = useMemo(() => Object.fromEntries(d.employees.map(e => [e.id, e])), [d.employees]);

  /* derived stats */
  const stats = useMemo(() => {
    const pending = d.reviews.filter(r => r.status !== "completed" && r.status !== "cancelled").length;
    const overdue = d.reviews.filter(r => {
      if (r.status === "completed" || r.status === "cancelled") return false;
      const days = daysFromToday(r.due_date);
      return days != null && days < 0;
    }).length;
    const scheduled = d.reviews.filter(r => !!r.scheduled_for && r.status !== "completed").length;
    const coachingActive = d.reviews.filter(r => r.review_type === "ad_hoc" && r.status !== "completed" && r.status !== "cancelled").length;
    const selfInProgress = d.reviews.filter(r => r.status === "employee_acknowledge").length;
    const needsFollowup = d.reviews.filter(r => {
      const days = daysFromToday(r.due_date);
      return (days != null && days < 0) || r.status === "manager_review";
    }).length;
    return { pending, overdue, scheduled, coachingActive, selfInProgress, needsFollowup };
  }, [d.reviews]);

  /* pipeline rows */
  const rows = useMemo(() => {
    let list = d.reviews.map(r => {
      const emp = empById[r.employee_id];
      const days = daysFromToday(r.due_date);
      const st = statusTone(r.status, days);
      return { r, emp, days, st };
    });
    if (filter === "overdue") list = list.filter(x => x.days != null && x.days < 0 && x.r.status !== "completed");
    else if (filter === "in_progress") list = list.filter(x => x.r.status === "manager_review" || x.r.status === "employee_acknowledge");
    else if (filter === "scheduled") list = list.filter(x => !!x.r.scheduled_for && x.r.status !== "completed");
    else if (filter === "completed") list = list.filter(x => x.r.status === "completed");
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(x =>
        x.emp && `${x.emp.first_name} ${x.emp.last_name}`.toLowerCase().includes(q)
        || (x.r.reviewer_name ?? "").toLowerCase().includes(q)
        || REVIEW_TYPE_LABEL[x.r.review_type].toLowerCase().includes(q)
      );
    }
    // sort: overdue first, then due soon, then later
    list.sort((a, b) => {
      const aw = a.days == null ? 1e9 : a.days;
      const bw = b.days == null ? 1e9 : b.days;
      return aw - bw;
    });
    return list;
  }, [d.reviews, empById, filter, query]);

  /* coaching plans = ad_hoc reviews */
  const coachingPlans = useMemo(() =>
    d.reviews.filter(r => r.review_type === "ad_hoc" && r.status !== "cancelled"),
  [d.reviews]);

  /* growth plans = reviews with goals set & not completed */
  const growthPlans = useMemo(() =>
    d.reviews.filter(r => (r.goals ?? "").trim().length > 0),
  [d.reviews]);

  /* follow-ups = overdue or manager_review */
  const followups = useMemo(() => {
    return d.reviews
      .filter(r => {
        const days = daysFromToday(r.due_date);
        return r.status !== "completed" && r.status !== "cancelled" && ((days != null && days < 0) || r.status === "manager_review");
      })
      .slice(0, 12);
  }, [d.reviews]);

  /* celebrations = completed reviews + completed training */
  const celebrations = useMemo(() => {
    const items: { kind: string; emp?: Employee; detail: string; when: string }[] = [];
    d.reviews
      .filter(r => r.status === "completed" && r.completed_at)
      .slice(0, 4)
      .forEach(r => items.push({
        kind: "Evaluation completed",
        emp: empById[r.employee_id],
        detail: REVIEW_TYPE_LABEL[r.review_type],
        when: r.completed_at!,
      }));
    d.empTrainings
      .filter(t => t.status === "completed" && t.completed_at)
      .slice(0, 4)
      .forEach(t => items.push({
        kind: "Training completed",
        emp: empById[t.employee_id],
        detail: "Training milestone",
        when: t.completed_at!,
      }));
    return items.sort((a, b) => +new Date(b.when) - +new Date(a.when)).slice(0, 6);
  }, [d.reviews, d.empTrainings, empById]);

  const openReview = openId ? d.reviews.find(r => r.id === openId) : null;
  const openEmp = openReview ? empById[openReview.employee_id] : null;

  return (
    <OSShell>
      <div className="px-6 md:px-10 py-10 max-w-7xl mx-auto">
        {/* header */}
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-start">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="h-11 w-11 rounded-2xl bg-muted grid place-items-center shrink-0">
              <ClipboardCheck className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Evaluations &amp; Growth</h1>
              <p className="text-[13px] text-muted-foreground mt-1 max-w-2xl">
                Coordinate employee evaluations, coaching conversations, growth planning, and development support across Blossom.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <HeaderBtn icon={Plus} to="/hr/new-hires">Start evaluation</HeaderBtn>
            <HeaderBtn icon={Heart} to="/hr/employee-support">Create coaching plan</HeaderBtn>
            <HeaderBtn icon={Calendar} to="/hr/orientation-queue">Schedule growth meeting</HeaderBtn>
            <HeaderBtn icon={ClipboardCheck} to="/hr/workspace">Review pending</HeaderBtn>
            <HeaderBtn icon={Sparkles} primary to="/ai">Ask Blossom AI</HeaderBtn>
          </div>
        </header>

        {/* KPI snapshot */}
        <div className="grid gap-3 mb-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <Kpi label="Pending" value={d.loading ? "—" : stats.pending} hint="In an active stage" />
          <Kpi label="Overdue" value={d.loading ? "—" : stats.overdue} tone={stats.overdue ? "crit" : "ok"} hint="Past due date" />
          <Kpi label="Meetings scheduled" value={d.loading ? "—" : stats.scheduled} hint="On the calendar" />
          <Kpi label="Coaching plans" value={d.loading ? "—" : stats.coachingActive} hint="Active ad-hoc plans" />
          <Kpi label="Self evaluations" value={d.loading ? "—" : stats.selfInProgress} hint="Awaiting acknowledgement" />
          <Kpi label="Follow-ups" value={d.loading ? "—" : stats.needsFollowup} tone={stats.needsFollowup ? "warn" : "ok"} hint="Needs HR attention" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* MAIN */}
          <div className="space-y-6 min-w-0">

            {/* EVALUATIONS PIPELINE */}
            <section>
              <div className="flex items-end justify-between mb-3 gap-3">
                <div>
                  <h2 className="text-base font-medium tracking-tight">Evaluations pipeline</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Live evaluations from employee records — supportive workflow, not punitive tracking.</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search employees or reviewers…"
                    className="w-56 h-8 pl-8 pr-3 rounded-lg bg-muted/60 border border-border/70 text-[12.5px] placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-transparent transition"
                  />
                </div>
              </div>
              <Card>
                <div className="flex items-center gap-1.5 p-2 border-b border-border/70 overflow-x-auto">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground ml-1 mr-1" strokeWidth={1.75} />
                  {([
                    ["all", `All (${d.reviews.length})`],
                    ["overdue", `Overdue (${stats.overdue})`],
                    ["in_progress", "In progress"],
                    ["scheduled", "Scheduled"],
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
                ) : rows.length === 0 ? (
                  <Empty
                    icon={CheckCircle2}
                    title="All evaluations are up to date."
                    hint="Everyone is progressing smoothly — start a new evaluation when you're ready."
                  />
                ) : (
                  <ul className="divide-y divide-border/70">
                    {rows.slice(0, 30).map(({ r, emp, days, st }) => (
                      <li key={r.id}>
                        <button
                          onClick={() => setOpenId(r.id)}
                          className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-muted/40 transition-colors"
                        >
                          <div className="h-8 w-8 rounded-xl bg-muted grid place-items-center shrink-0 text-[11px] font-medium">
                            {emp ? `${emp.first_name[0]}${emp.last_name[0]}` : "—"}
                          </div>
                          <div className="min-w-0 flex-1 grid grid-cols-1 md:grid-cols-[1.2fr_1.4fr_auto] gap-2 md:gap-4 items-center">
                            <div className="min-w-0">
                              <p className="text-[13px] font-medium tracking-tight truncate">
                                {emp ? `${emp.first_name} ${emp.last_name}` : "Unknown employee"}
                              </p>
                              <p className="text-[11.5px] text-muted-foreground truncate">
                                {emp?.job_title} · {emp?.state}
                              </p>
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13px] truncate">{REVIEW_TYPE_LABEL[r.review_type]} · {evalEvaluationType(emp)}</p>
                              <p className="text-[11.5px] text-muted-foreground truncate">
                                Reviewer: {r.reviewer_name ?? "Unassigned"} · Due {fmtDate(r.due_date)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 justify-end">
                              <Pill tone={st.tone}>{st.label}</Pill>
                              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </section>

            {/* COACHING & DEVELOPMENT */}
            <section>
              <div className="flex items-end justify-between mb-3">
                <div>
                  <h2 className="text-base font-medium tracking-tight">Coaching &amp; development</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Active coaching plans and growth conversations.</p>
                </div>
              </div>
              {d.loading ? (
                <Card className="p-6"><p className="text-sm text-muted-foreground">Loading…</p></Card>
              ) : coachingPlans.length === 0 ? (
                <Card className="p-6">
                  <Empty icon={Heart} title="No active coaching plans." hint="Create a plan to support an employee's growth." />
                </Card>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {coachingPlans.slice(0, 6).map(r => {
                    const emp = empById[r.employee_id];
                    return (
                      <Card key={r.id} className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[13.5px] font-medium tracking-tight truncate">
                              {emp ? `${emp.first_name} ${emp.last_name}` : "Employee"}
                            </p>
                            <p className="text-[11.5px] text-muted-foreground truncate">
                              {emp?.job_title} · Coach: {r.reviewer_name ?? "Unassigned"}
                            </p>
                          </div>
                          <Pill tone="info">Coaching</Pill>
                        </div>
                        {(r.growth_areas || r.goals) && (
                          <p className="text-[12.5px] text-muted-foreground mt-2 line-clamp-2">
                            {r.growth_areas ?? r.goals}
                          </p>
                        )}
                        <div className="mt-3 flex items-center justify-between text-[11.5px] text-muted-foreground">
                          <span>Next: {fmtDate(r.scheduled_for ?? r.due_date)}</span>
                          <button onClick={() => setOpenId(r.id)} className="inline-flex items-center gap-1 text-foreground hover:text-primary transition-colors">
                            Open plan <ChevronRight className="h-3 w-3" />
                          </button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>

            {/* GROWTH PLANS */}
            <section>
              <div className="flex items-end justify-between mb-3">
                <h2 className="text-base font-medium tracking-tight">Growth plans</h2>
                <span className="text-[11.5px] text-muted-foreground">Goals, milestones, and development journeys.</span>
              </div>
              {d.loading ? (
                <Card className="p-6"><p className="text-sm text-muted-foreground">Loading…</p></Card>
              ) : growthPlans.length === 0 ? (
                <Card className="p-6">
                  <Empty icon={Target} title="No growth plans yet." hint="Set goals during an evaluation to start a plan." />
                </Card>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {growthPlans.slice(0, 6).map(r => {
                    const emp = empById[r.employee_id];
                    return (
                      <Card key={r.id} className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="h-9 w-9 rounded-xl bg-muted grid place-items-center shrink-0">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[13.5px] font-medium tracking-tight truncate">
                              {emp ? `${emp.first_name} ${emp.last_name}` : "Employee"}
                            </p>
                            <p className="text-[11.5px] text-muted-foreground truncate">{emp?.job_title}</p>
                            {r.goals && <p className="text-[12px] text-muted-foreground mt-2 line-clamp-3">{r.goals}</p>}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>

            {/* FOLLOW-UP CENTER */}
            <section>
              <h2 className="text-base font-medium tracking-tight mb-3">Follow-up center</h2>
              <Card>
                {d.loading ? (
                  <div className="p-6"><p className="text-sm text-muted-foreground">Loading…</p></div>
                ) : followups.length === 0 ? (
                  <Empty icon={CheckCircle2} title="No overdue coaching follow-ups." hint="Everyone is on track right now." />
                ) : (
                  <ul className="divide-y divide-border/70">
                    {followups.map(r => {
                      const emp = empById[r.employee_id];
                      const days = daysFromToday(r.due_date);
                      const overdue = days != null && days < 0;
                      return (
                        <li key={r.id} className="px-4 py-3 flex items-center gap-3">
                          <div className={cn(
                            "h-8 w-8 rounded-xl grid place-items-center shrink-0",
                            overdue ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-700 dark:text-amber-400",
                          )}>
                            <AlertCircle className="h-4 w-4" strokeWidth={1.75} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-medium tracking-tight truncate">
                              {emp ? `${emp.first_name} ${emp.last_name}` : "Employee"}
                              <span className="text-muted-foreground font-normal"> · {REVIEW_TYPE_LABEL[r.review_type]}</span>
                            </p>
                            <p className="text-[11.5px] text-muted-foreground truncate">
                              Reviewer: {r.reviewer_name ?? "Unassigned"} · Due {fmtDate(r.due_date)}
                            </p>
                          </div>
                          {overdue && <Pill tone="crit">{Math.abs(days!)}d overdue</Pill>}
                          <button onClick={() => setOpenId(r.id)} className="h-7 px-2.5 rounded-lg text-[12px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                            Open
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            </section>

            {/* CELEBRATIONS */}
            <section>
              <div className="flex items-end justify-between mb-3">
                <h2 className="text-base font-medium tracking-tight">Celebrations &amp; progress</h2>
                <span className="text-[11.5px] text-muted-foreground">Wins worth noticing.</span>
              </div>
              {d.loading ? (
                <Card className="p-6"><p className="text-sm text-muted-foreground">Loading…</p></Card>
              ) : celebrations.length === 0 ? (
                <Card className="p-6">
                  <Empty icon={Heart} title="The wins will appear here." hint="Completed evaluations and training milestones show up automatically." />
                </Card>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {celebrations.map((c, i) => (
                    <Card key={i} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 grid place-items-center shrink-0">
                          <Award className="h-4 w-4" strokeWidth={1.75} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13.5px] font-medium tracking-tight truncate">
                            {c.emp ? `${c.emp.first_name} ${c.emp.last_name}` : "Employee"}
                          </p>
                          <p className="text-[11.5px] text-muted-foreground truncate">{c.kind} · {c.detail}</p>
                          <p className="text-[11px] text-muted-foreground mt-1">{fmtDate(c.when)}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* RIGHT RAIL */}
          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary" strokeWidth={1.75} />
                <h3 className="text-sm font-medium tracking-tight">Ask Blossom AI</h3>
              </div>
              <p className="text-[12px] text-muted-foreground mb-3">
                Growth-focused operational assistant — scoped to HR Team data and permissions.
              </p>
              <ul className="space-y-1.5">
                {[
                  "Who has overdue evaluations?",
                  "Which employees need coaching follow-up?",
                  "Show active growth plans.",
                  "Who completed evaluations this month?",
                  "Which employees may need additional support?",
                ].map(p => (
                  <li key={p}>
                    <button className="w-full text-left text-[12.5px] rounded-lg px-2.5 py-1.5 hover:bg-muted transition-colors">{p}</button>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-5">
              <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-3">Quick links</h3>
              <nav className="space-y-1">
                {[
                  { label: "Training Academy", to: "/hr/training-academy", icon: Award },
                  { label: "Training & Certifications", to: "/hr/training-certifications", icon: FileText },
                  { label: "Employee Support", to: "/hr/employee-support", icon: Heart },
                  { label: "New Hires", to: "/hr/new-hires", icon: Users },
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
              {d.timeline.length === 0 ? (
                <p className="text-[12px] text-muted-foreground">No recent activity yet.</p>
              ) : (
                <ul className="space-y-2 text-[12px]">
                  {d.timeline.slice(0, 5).map(t => {
                    const e = empById[t.employee_id];
                    return (
                      <li key={t.id} className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 mt-1.5" />
                        <span className="truncate">
                          <span className="text-foreground">{e ? `${e.first_name} ${e.last_name}` : "Employee"}</span>
                          <span className="text-muted-foreground"> · {t.description ?? t.event_type}</span>
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

      {/* Detail panel */}
      {openReview && (
        <DetailPanel
          review={openReview}
          emp={openEmp ?? undefined}
          onboarding={d.onboarding.find(o => o.employee_id === openReview.employee_id)}
          trainings={d.empTrainings.filter(t => t.employee_id === openReview.employee_id)}
          timeline={d.timeline.filter(t => t.employee_id === openReview.employee_id).slice(0, 8)}
          onClose={() => setOpenId(null)}
        />
      )}
    </OSShell>
  );
}

/* ---------------- detail panel ---------------- */
function DetailPanel({
  review, emp, onboarding, trainings, timeline, onClose,
}: {
  review: Review; emp?: Employee; onboarding?: OnboardingRow;
  trainings: EmpTraining[]; timeline: TimelineRow[]; onClose: () => void;
}) {
  const days = daysFromToday(review.due_date);
  const st = statusTone(review.status, days);
  const trainingDone = trainings.filter(t => t.status === "completed").length;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/10 backdrop-blur-[2px]"
      />
      <div className="relative w-full max-w-xl h-full bg-card border-l border-border/70 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-200">
        <header className="sticky top-0 bg-card/95 backdrop-blur border-b border-border/70 px-6 py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {REVIEW_TYPE_LABEL[review.review_type]} · {evalEvaluationType(emp)}
            </p>
            <h2 className="text-lg font-semibold tracking-tight mt-0.5 truncate">
              {emp ? `${emp.first_name} ${emp.last_name}` : "Employee"}
            </h2>
            <p className="text-[12px] text-muted-foreground truncate">{emp?.job_title} · {emp?.state}</p>
          </div>
          <div className="flex items-center gap-2">
            <Pill tone={st.tone}>{st.label}</Pill>
            <button onClick={onClose} className="h-8 w-8 rounded-full grid place-items-center hover:bg-muted transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="px-6 py-5 space-y-5">
          {/* Status grid */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3">
              <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">Due</p>
              <p className="text-[13.5px] font-medium mt-0.5">{fmtDate(review.due_date)}</p>
            </Card>
            <Card className="p-3">
              <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">Reviewer</p>
              <p className="text-[13.5px] font-medium mt-0.5 truncate">{review.reviewer_name ?? "Unassigned"}</p>
            </Card>
            <Card className="p-3">
              <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">Onboarding</p>
              <p className="text-[13.5px] font-medium mt-0.5 capitalize">{onboarding?.status?.replace(/_/g, " ") ?? "—"}</p>
            </Card>
            <Card className="p-3">
              <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">Training</p>
              <p className="text-[13.5px] font-medium mt-0.5">{trainingDone}/{trainings.length || 0} complete</p>
            </Card>
          </div>

          {/* Growth areas */}
          <Card className="p-5">
            <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">Growth areas</h3>
            <div className="space-y-3 text-[13px]">
              <Field label="Strengths" value={review.strengths} icon={Heart} />
              <Field label="Opportunities" value={review.growth_areas} icon={TrendingUp} />
              <Field label="Employee goals" value={review.goals} icon={Target} />
              <Field label="Leadership notes" value={review.manager_comments} icon={MessageSquare} />
              <Field label="Employee comments" value={review.employee_comments} icon={MessageSquare} />
            </div>
          </Card>

          {/* Timeline */}
          <Card className="p-5">
            <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">Timeline</h3>
            {timeline.length === 0 ? (
              <p className="text-[12.5px] text-muted-foreground">No recorded events yet.</p>
            ) : (
              <ul className="space-y-2.5">
                {timeline.map(t => (
                  <li key={t.id} className="flex items-start gap-2.5 text-[12.5px]">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 mt-1.5" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate">{t.description ?? t.event_type}</p>
                      <p className="text-[11px] text-muted-foreground">{fmtDate(t.created_at)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            <ActionBtn icon={MessageSquare} onClick={async () => {
              const note = window.prompt("Coaching note:", review.manager_comments ?? "");
              if (!note) return;
              const { error } = await supabase.from("employee_reviews").update({ manager_comments: note }).eq("id", review.id);
              toast({ title: error ? "Could not save" : "Coaching note saved", description: error?.message });
            }}>Add coaching note</ActionBtn>
            <ActionBtn icon={Calendar} onClick={async () => {
              const when = window.prompt("Schedule meeting (YYYY-MM-DD):", review.scheduled_for?.slice(0, 10) ?? "");
              if (!when) return;
              const { error } = await supabase.from("employee_reviews").update({ scheduled_for: when }).eq("id", review.id);
              toast({ title: error ? "Could not schedule" : "Meeting scheduled", description: error?.message ?? `Scheduled for ${when}.` });
            }}>Schedule meeting</ActionBtn>
            <ActionBtn icon={Target} onClick={async () => {
              const goals = window.prompt("Growth plan / goals:", review.goals ?? "");
              if (!goals) return;
              const { error } = await supabase.from("employee_reviews").update({ goals }).eq("id", review.id);
              toast({ title: error ? "Could not save" : "Growth plan saved", description: error?.message });
            }}>Create growth plan</ActionBtn>
            <ActionBtn icon={Send} onClick={() => toast({ title: "Follow-up sent", description: `Reminder sent to ${review.reviewer_name ?? "reviewer"}.` })}>Send follow-up</ActionBtn>
            <ActionBtn icon={CheckCircle2} primary onClick={async () => {
              const { error } = await supabase.from("employee_reviews").update({
                status: "completed" as never,
                completed_at: new Date().toISOString(),
              }).eq("id", review.id);
              toast({ title: error ? "Could not complete" : "Evaluation completed", description: error?.message });
              if (!error) onClose();
            }}>Complete evaluation</ActionBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, icon: Icon }: { label: string; value: string | null; icon: React.ElementType }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
        <Icon className="h-3 w-3" strokeWidth={1.75} /> {label}
      </div>
      <p className={cn("text-[13px]", value ? "text-foreground" : "text-muted-foreground italic")}>
        {value ?? "Not recorded yet."}
      </p>
    </div>
  );
}

function ActionBtn({ icon: Icon, children, primary, onClick }: { icon: React.ElementType; children: React.ReactNode; primary?: boolean; onClick?: () => void }) {
  const cls = primary
    ? "bg-primary text-primary-foreground hover:opacity-90"
    : "text-foreground border border-border/70 bg-card hover:bg-muted";
  return (
    <button onClick={onClick} className={cn("inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] transition-colors", cls)}>
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} /> {children}
    </button>
  );
}
