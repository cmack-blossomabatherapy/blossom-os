import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  UserPlus, Sparkles, Search, CalendarPlus, BookOpen, X,
  CheckCircle2, AlertTriangle, ShieldCheck, GraduationCap, Workflow,
  Heart, Clock, MessageSquare, FileText, ChevronRight, MapPin, Briefcase,
  Activity,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { supabase } from "@/integrations/supabase/client";
import { IntegrationReadinessPanel } from "@/components/hr/IntegrationReadinessPanel";
import { HRIntegrationReadinessEditor } from "@/components/hr/HRIntegrationReadinessEditor";
import { HRRecentActivity } from "@/components/hr/HRRecentActivity";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { logHrEvent } from "@/lib/hr/activityEvents";
import { getHrReadinessBlockers } from "@/lib/hr/readiness";
import { ONBOARDING_STAGES, type OnboardingStatus } from "@/lib/hr/types";
import {
  useRecruitingCandidates, useRecruitingBackgroundChecks,
  useRecruitingOrientation, daysInStage, fullName as candName,
  type RecruitingCandidate, type PipelineStage,
} from "@/hooks/useRecruitingCandidates";

/* ─── atoms ─── */
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

/* ─── types ─── */
interface Emp {
  id: string; first_name: string; last_name: string; preferred_name: string | null;
  job_title: string; state: string; status: string; start_date: string | null;
  hire_date: string | null; email: string | null; phone: string | null;
}
interface OnbRow {
  id: string; employee_id: string; status: OnboardingStatus; stage_entered_at: string; blockers: string[]; hr_owner: string | null;
  viventium_status?: string | null; viventium_synced_at?: string | null; viventium_notes?: string | null;
  stellar_status?: string | null; stellar_synced_at?: string | null; stellar_notes?: string | null;
  centralreach_status?: string | null; centralreach_synced_at?: string | null; centralreach_notes?: string | null;
}
interface TaskRow { id: string; onboarding_id: string; title: string; completed: boolean; due_date: string | null }
interface TrainingRow { id: string; employee_id: string; course_id: string; status: string; due_date: string | null; completed_at: string | null }
interface DocRow { id: string; employee_id: string; doc_type: string; name: string; status: string; required: boolean }

/* ─── data hook ─── */
function useNewHiresData() {
  const [employees, setEmployees] = useState<Emp[]>([]);
  const [onboarding, setOnboarding] = useState<OnbRow[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [trainings, setTrainings] = useState<TrainingRow[]>([]);
  const [documents, setDocuments] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [emp, onb, tr, dc] = await Promise.all([
        supabase.from("employees").select("id,first_name,last_name,preferred_name,job_title,state,status,start_date,hire_date,email,phone").order("hire_date", { ascending: false }),
        supabase.from("employee_onboarding").select("id,employee_id,status,stage_entered_at,blockers,viventium_status,viventium_synced_at,viventium_notes,stellar_status,stellar_synced_at,stellar_notes,centralreach_status,centralreach_synced_at,centralreach_notes"),
        supabase.from("employee_trainings").select("id,employee_id,course_id,status,due_date,completed_at"),
        supabase.from("employee_documents_hr").select("id,employee_id,doc_type,name,status,required"),
      ]);
      if (cancelled) return;
      setEmployees((emp.data ?? []) as Emp[]);
      setOnboarding((onb.data ?? []) as OnbRow[]);
      setTrainings((tr.data ?? []) as TrainingRow[]);
      setDocuments((dc.data ?? []) as DocRow[]);
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
  }, [reloadKey]);

  return { employees, onboarding, tasks, trainings, documents, loading, reload: () => setReloadKey((k) => k + 1) };
}

/* ─── unified onboarding pipeline ─── */
const PIPELINE_STAGES: { key: string; label: string; from: "candidate" | "employee" }[] = [
  { key: "Offer Accepted",       label: "Offer Accepted",      from: "candidate" },
  { key: "Background Check",     label: "Background Check",    from: "candidate" },
  { key: "Orientation Scheduled",label: "Orientation",         from: "candidate" },
  { key: "Onboarding",           label: "Onboarding (Viventium)", from: "candidate" },
  { key: "ready_for_start",      label: "Ready for Start",     from: "employee" },
  { key: "active",               label: "Active",              from: "employee" },
];

interface PipelineItem {
  id: string;
  source: "candidate" | "employee";
  name: string;
  role: string;
  state: string;
  stageKey: string;
  stageLabel: string;
  ageDays: number;
  blocker?: string;
  hrOwner?: string | null;
  pct: number;
  raw: any;
}

export default function OSHRNewHires() {
  const hr = useNewHiresData();
  const { candidates } = useRecruitingCandidates();
  const { items: bgChecks } = useRecruitingBackgroundChecks();
  const { items: orientation } = useRecruitingOrientation();

  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [selected, setSelected] = useState<PipelineItem | null>(null);

  const empById = useMemo(() => {
    const m = new Map<string, Emp>();
    hr.employees.forEach((e) => m.set(e.id, e));
    return m;
  }, [hr.employees]);

  const tasksByOnb = useMemo(() => {
    const m = new Map<string, TaskRow[]>();
    hr.tasks.forEach((t) => {
      const a = m.get(t.onboarding_id) ?? [];
      a.push(t); m.set(t.onboarding_id, a);
    });
    return m;
  }, [hr.tasks]);

  const onbByEmp = useMemo(() => {
    const m = new Map<string, OnbRow>();
    hr.onboarding.forEach((o) => m.set(o.employee_id, o));
    return m;
  }, [hr.onboarding]);

  /* unified pipeline items */
  const items = useMemo<PipelineItem[]>(() => {
    const candStages: PipelineStage[] = ["Offer Accepted","Background Check","Orientation Scheduled","Onboarding","Ready to Staff"];
    const fromCands: PipelineItem[] = candidates
      .filter((c) => candStages.includes(c.pipeline_stage))
      .map((c) => {
        const bg = bgChecks.find((b) => b.candidate_id === c.id);
        const blocker = c.pipeline_stage === "Background Check" && bg?.blocker ? bg.blocker : undefined;
        const stage = c.pipeline_stage === "Ready to Staff" ? "ready_for_start" : c.pipeline_stage;
        const idx = PIPELINE_STAGES.findIndex((s) => s.key === stage);
        return {
          id: c.id, source: "candidate" as const, name: candName(c), role: c.role,
          state: c.state, stageKey: stage, stageLabel: stage,
          ageDays: daysInStage(c), blocker, hrOwner: c.recruiter,
          pct: Math.max(10, Math.round(((idx + 1) / PIPELINE_STAGES.length) * 100)),
          raw: c,
        };
      });
    const fromEmps: PipelineItem[] = hr.employees
      .filter((e) => e.status === "pending_start" || (e.status === "active" && e.hire_date && daysSince(e.hire_date) <= 30))
      .map((e) => {
        const onb = onbByEmp.get(e.id);
        const tks = onb ? tasksByOnb.get(onb.id) ?? [] : [];
        const pct = tks.length ? Math.round((tks.filter((t) => t.completed).length / tks.length) * 100) : (e.status === "active" ? 100 : 50);
        const stageKey = e.status === "active" ? "active" : (onb?.status ?? "ready_for_start");
        return {
          id: e.id, source: "employee" as const, name: `${e.preferred_name || e.first_name} ${e.last_name}`,
          role: e.job_title, state: e.state, stageKey, stageLabel: ONBOARDING_STAGES.find((s) => s.key === stageKey)?.label ?? stageKey,
          ageDays: daysSince(onb?.stage_entered_at ?? e.hire_date),
          blocker: onb?.blockers?.[0], hrOwner: onb?.hr_owner,
          pct, raw: e,
        };
      });
    return [...fromCands, ...fromEmps];
  }, [candidates, bgChecks, hr.employees, onbByEmp, tasksByOnb]);

  const states = useMemo(() => Array.from(new Set(items.map((i) => i.state))).sort(), [items]);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (stateFilter !== "all" && i.state !== stateFilter) return false;
      if (stageFilter !== "all" && i.stageKey !== stageFilter) return false;
      if (query.trim()) {
        const s = `${i.name} ${i.role} ${i.state}`.toLowerCase();
        if (!s.includes(query.toLowerCase())) return false;
      }
      return true;
    });
  }, [items, stateFilter, stageFilter, query]);

  /* KPIs */
  const kpis = useMemo(() => {
    const newThisWeek = items.filter((i) => i.ageDays <= 7 && (i.stageKey === "Offer Accepted" || i.stageKey === "active")).length;
    const inProgress = items.filter((i) => i.stageKey !== "active").length;
    const orientationPending = orientation.filter((o) => o.status !== "completed" && o.status !== "missed").length
      + candidates.filter((c) => c.pipeline_stage === "Offer Accepted").length;
    const bgPending = bgChecks.filter((b) => b.status === "pending" || b.status === "in_review").length;
    const trainingOverdue = hr.trainings.filter((t) => t.status !== "completed" && t.due_date && daysUntil(t.due_date) < 0).length;
    const readyToStaff = items.filter((i) => i.stageKey === "ready_for_start").length;
    return [
      { label: "New this week", value: newThisWeek, hint: "Last 7 days", filter: () => { setStageFilter("all"); } },
      { label: "Onboarding active", value: inProgress, tone: inProgress > 8 ? "warn" : "ok" as Tone, hint: "Across all stages" },
      { label: "Orientation pending", value: orientationPending, tone: orientationPending > 0 ? "warn" : "ok" as Tone, hint: "Awaiting scheduling" },
      { label: "Background checks", value: bgPending, tone: bgPending > 0 ? "warn" : "ok" as Tone, hint: "Pending or in review" },
      { label: "Training overdue", value: trainingOverdue, tone: trainingOverdue > 0 ? "crit" : "ok" as Tone, hint: "Past due" },
      { label: "Ready for staffing", value: readyToStaff, tone: readyToStaff > 0 ? "ok" : "muted" as Tone, hint: "Pending start" },
    ];
  }, [items, orientation, candidates, bgChecks, hr.trainings]);

  return (
    <OSShell>
      <div className="px-6 md:px-10 py-10 max-w-7xl mx-auto">
        {/* header */}
        <header className="mb-6 flex items-start gap-4">
          <div className="h-11 w-11 rounded-2xl bg-muted grid place-items-center shrink-0">
            <UserPlus className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">New Hires</h1>
            <p className="text-[13px] text-muted-foreground mt-1 max-w-2xl">
              Track onboarding progress, orientation readiness, training completion, and staffing preparation for every new employee.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 flex-wrap justify-end">
            <Link to="/user-management?add=1" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] border border-border/70 bg-card hover:bg-muted transition-colors">
              <UserPlus className="h-3.5 w-3.5" strokeWidth={1.75} /> Add new hire
            </Link>
            <Link to="/hr/orientation-queue" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] border border-border/70 bg-card hover:bg-muted transition-colors">
              <CalendarPlus className="h-3.5 w-3.5" strokeWidth={1.75} /> Orientation
            </Link>
            <Link to="/hr/training-center" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] border border-border/70 bg-card hover:bg-muted transition-colors">
              <BookOpen className="h-3.5 w-3.5" strokeWidth={1.75} /> Assign training
            </Link>
          </div>
        </header>

        {/* KPIs */}
        <div className="grid gap-3 mb-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {kpis.map((k) => (
            <button
              key={k.label}
              onClick={() => k.filter?.()}
              className="text-left rounded-2xl border border-border/70 bg-card p-4 hover:border-border transition-colors"
            >
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{k.label}</p>
              <p className={cn(
                "text-2xl font-semibold tracking-tight mt-1",
                k.tone === "crit" && "text-destructive",
                k.tone === "warn" && "text-amber-700 dark:text-amber-400",
              )}>{hr.loading ? "—" : k.value}</p>
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
                    placeholder="Search new hires by name, role, or state…"
                    className="w-full h-9 pl-9 pr-3 rounded-lg bg-muted/60 border border-border/70 text-[13px] placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-transparent transition"
                  />
                </div>
                <select
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                  className="h-9 px-3 rounded-lg bg-muted/60 border border-border/70 text-[13px]"
                >
                  <option value="all">All states</option>
                  {states.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  className="h-9 px-3 rounded-lg bg-muted/60 border border-border/70 text-[13px]"
                >
                  <option value="all">All stages</option>
                  {PIPELINE_STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>
            </Card>

            {/* Pipeline */}
            <section>
              <SectionHeader title="Onboarding pipeline" subtitle="Live view of every new hire across the journey" />
              {hr.loading ? (
                <Card className="p-6"><p className="text-sm text-muted-foreground">Loading pipeline…</p></Card>
              ) : filtered.length === 0 ? (
                <Card className="p-6">
                  <Empty icon={CheckCircle2} title="No onboarding in progress." hint="New hires from recruiting will appear here automatically." />
                </Card>
              ) : (
                <div className="overflow-x-auto -mx-2">
                  <div className="flex gap-3 px-2 min-w-max">
                    {PIPELINE_STAGES.map((stage) => {
                      const stageItems = filtered.filter((i) => i.stageKey === stage.key);
                      return (
                        <Card key={stage.key} className="w-72 shrink-0 p-3">
                          <div className="flex items-center justify-between mb-2 px-1">
                            <p className="text-[12px] font-medium tracking-tight">{stage.label}</p>
                            <span className="text-[11px] text-muted-foreground">{stageItems.length}</span>
                          </div>
                          <div className="space-y-2">
                            {stageItems.length === 0 && (
                              <p className="px-2 py-3 text-[11.5px] text-muted-foreground/70">Empty.</p>
                            )}
                            {stageItems.map((item) => (
                              <button
                                key={`${item.source}-${item.id}`}
                                onClick={() => setSelected(item)}
                                className="w-full text-left rounded-xl border border-border/70 bg-background p-3 hover:border-border hover:-translate-y-0.5 transition-all"
                              >
                                <div className="flex items-start gap-2.5">
                                  <Avatar first={item.name.split(" ")[0]} last={item.name.split(" ").slice(-1)[0]} />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[13px] font-medium tracking-tight truncate">{item.name}</p>
                                    <p className="text-[11.5px] text-muted-foreground truncate">{item.role} · {item.state}</p>
                                  </div>
                                </div>
                                <div className="mt-2.5 h-1 rounded-full bg-muted overflow-hidden">
                                  <div className="h-full bg-foreground/70" style={{ width: `${item.pct}%` }} />
                                </div>
                                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                                  <span>{item.pct}%</span>
                                  <span>{item.ageDays}d in stage</span>
                                </div>
                                {item.blocker && (
                                  <div className="mt-2"><Pill tone="crit"><AlertTriangle className="h-3 w-3" />{item.blocker}</Pill></div>
                                )}
                                {!item.blocker && item.ageDays >= 5 && item.stageKey !== "active" && (
                                  <div className="mt-2"><Pill tone="warn"><Clock className="h-3 w-3" />Stalled</Pill></div>
                                )}
                              </button>
                            ))}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            {/* Orientation readiness */}
            <section>
              <SectionHeader title="Orientation readiness" subtitle="Upcoming sessions, unscheduled hires, and missed attendance" />
              <OrientationSection orientation={orientation} candidates={candidates} hrEmployees={hr.employees} onbByEmp={onbByEmp} />
            </section>

            {/* Background checks */}
            <section>
              <SectionHeader title="Background checks" subtitle="Track from initiation through clearance" />
              <BackgroundChecksSection bgChecks={bgChecks} candidates={candidates} />
            </section>

            {/* Training & readiness */}
            <section>
              <SectionHeader title="Training & readiness" subtitle="Assigned journeys and module progress" />
              <TrainingSection trainings={hr.trainings} employees={hr.employees} />
            </section>

            {/* HR follow-up queue */}
            <section>
              <SectionHeader title="HR follow-up queue" subtitle="Open items that need HR attention" />
              <FollowUpSection items={items} hr={hr} candidates={candidates} bgChecks={bgChecks} />
            </section>

            {/* Staffing readiness */}
            <section>
              <SectionHeader title="Staffing readiness" subtitle="Who is ready, almost ready, and blocked" />
              <ReadinessSection items={items} />
            </section>
          </div>

          {/* right rail */}
          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <UserPlus className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
                <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Readiness Checklist</h3>
              </div>
              <div className="space-y-1.5">
                {[
                  "Who is blocked from onboarding?",
                  "Which new hires missed orientation?",
                  "Who is ready for staffing?",
                  "Show overdue onboarding tasks.",
                  "Which new hires still need training?",
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
                  { label: "HR Workspace",     to: "/hr/workspace" },
                  { label: "User Management", to: "/user-management" },
                  { label: "Orientation queue",to: "/hr/orientation-queue" },
                  { label: "Training Management", to: "/hr/training-center" },
                  { label: "Learner Academy", to: "/academy" },
                  { label: "Compliance & docs",to: "/hr/compliance" },
                  { label: "Employee support", to: "/hr/employee-support" },
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

      {/* Detail panel */}
      {selected && (
        <DetailPanel
          item={selected}
          onClose={() => setSelected(null)}
          hr={hr}
          onbByEmp={onbByEmp}
          tasksByOnb={tasksByOnb}
          bgChecks={bgChecks}
          orientation={orientation}
        />
      )}
    </OSShell>
  );
}

/* ─── sub-sections ─── */
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="text-[12px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function OrientationSection({ orientation, candidates, hrEmployees, onbByEmp }: {
  orientation: ReturnType<typeof useRecruitingOrientation>["items"];
  candidates: RecruitingCandidate[];
  hrEmployees: Emp[];
  onbByEmp: Map<string, OnbRow>;
}) {
  const candById = useMemo(() => {
    const m = new Map<string, RecruitingCandidate>();
    candidates.forEach((c) => m.set(c.id, c));
    return m;
  }, [candidates]);
  const rows = orientation.slice(0, 8);
  if (!rows.length) {
    return <Card className="p-6"><Empty icon={CalendarPlus} title="All upcoming orientations look ready." /></Card>;
  }
  return (
    <Card className="divide-y divide-border/70">
      {rows.map((o) => {
        const c = candById.get(o.candidate_id);
        const tone: Tone = o.status === "completed" ? "ok" : o.status === "missed" ? "crit" : "warn";
        return (
          <div key={o.id} className="p-4 flex items-center gap-3">
            <Avatar first={c?.first_name ?? "?"} last={c?.last_name ?? ""} />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium tracking-tight truncate">{c ? candName(c) : "Unknown"}</p>
              <p className="text-[11.5px] text-muted-foreground truncate">{c?.role} · {c?.state} · {o.format ?? "TBD"}</p>
            </div>
            <div className="hidden md:block text-[12px] text-muted-foreground">
              {o.scheduled_date ?? "Unscheduled"} {o.scheduled_time ?? ""}
            </div>
            <Pill tone={tone}>{o.status}</Pill>
          </div>
        );
      })}
    </Card>
  );
}

function BackgroundChecksSection({ bgChecks, candidates }: {
  bgChecks: ReturnType<typeof useRecruitingBackgroundChecks>["items"];
  candidates: RecruitingCandidate[];
}) {
  const candById = useMemo(() => {
    const m = new Map<string, RecruitingCandidate>();
    candidates.forEach((c) => m.set(c.id, c));
    return m;
  }, [candidates]);
  const rows = bgChecks.filter((b) => b.status !== "cleared").slice(0, 8);
  if (!rows.length) {
    return <Card className="p-6"><Empty icon={ShieldCheck} title="All background checks are clear." /></Card>;
  }
  return (
    <Card className="divide-y divide-border/70">
      {rows.map((b) => {
        const c = candById.get(b.candidate_id);
        const tone: Tone = b.status === "flagged" ? "crit" : b.status === "in_review" ? "warn" : "muted";
        return (
          <div key={b.id} className="p-4 flex items-center gap-3">
            <Avatar first={c?.first_name ?? "?"} last={c?.last_name ?? ""} />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium tracking-tight truncate">{c ? candName(c) : "Unknown"}</p>
              <p className="text-[11.5px] text-muted-foreground truncate">
                {c?.role} · Initiated {b.initiated_at ? new Date(b.initiated_at).toLocaleDateString() : "—"}
              </p>
            </div>
            {b.blocker && <Pill tone="crit"><AlertTriangle className="h-3 w-3" />{b.blocker}</Pill>}
            <Pill tone={tone}>{b.status}</Pill>
          </div>
        );
      })}
    </Card>
  );
}

function TrainingSection({ trainings, employees }: { trainings: TrainingRow[]; employees: Emp[] }) {
  const empById = useMemo(() => {
    const m = new Map<string, Emp>();
    employees.forEach((e) => m.set(e.id, e));
    return m;
  }, [employees]);
  const recentEmpIds = new Set(employees.filter((e) => e.status === "pending_start" || (e.hire_date && daysSince(e.hire_date) <= 45)).map((e) => e.id));
  const byEmp = new Map<string, TrainingRow[]>();
  trainings.filter((t) => recentEmpIds.has(t.employee_id)).forEach((t) => {
    const a = byEmp.get(t.employee_id) ?? []; a.push(t); byEmp.set(t.employee_id, a);
  });
  const rows = Array.from(byEmp.entries()).slice(0, 8);
  if (!rows.length) {
    return <Card className="p-6"><Empty icon={GraduationCap} title="No active training paths for new hires." /></Card>;
  }
  return (
    <Card className="divide-y divide-border/70">
      {rows.map(([empId, ts]) => {
        const e = empById.get(empId); if (!e) return null;
        const done = ts.filter((t) => t.status === "completed").length;
        const pct = Math.round((done / ts.length) * 100);
        const overdue = ts.filter((t) => t.status !== "completed" && t.due_date && daysUntil(t.due_date) < 0).length;
        return (
          <div key={empId} className="p-4 flex items-center gap-3">
            <Avatar first={e.first_name} last={e.last_name} />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium tracking-tight truncate">{e.preferred_name || e.first_name} {e.last_name}</p>
              <p className="text-[11.5px] text-muted-foreground truncate">{e.job_title} · {e.state}</p>
            </div>
            <div className="w-32 hidden md:block">
              <div className="h-1 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-foreground/70" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">{done}/{ts.length} modules</p>
            </div>
            {overdue > 0 ? <Pill tone="crit">{overdue} overdue</Pill> : <Pill tone="ok">On track</Pill>}
          </div>
        );
      })}
    </Card>
  );
}

function FollowUpSection({ items, hr, candidates, bgChecks }: {
  items: PipelineItem[]; hr: ReturnType<typeof useNewHiresData>;
  candidates: RecruitingCandidate[]; bgChecks: ReturnType<typeof useRecruitingBackgroundChecks>["items"];
}) {
  type FU = { id: string; name: string; issue: string; priority: Tone; due: string };
  const followUps: FU[] = [];
  items.filter((i) => i.blocker).forEach((i) => followUps.push({
    id: `b-${i.id}`, name: i.name, issue: i.blocker!, priority: "crit", due: "ASAP",
  }));
  items.filter((i) => i.ageDays >= 5 && !i.blocker && i.stageKey !== "active").forEach((i) => followUps.push({
    id: `s-${i.id}`, name: i.name, issue: `Stalled in ${i.stageLabel}`, priority: "warn", due: `${i.ageDays}d in stage`,
  }));
  hr.trainings.filter((t) => t.status !== "completed" && t.due_date && daysUntil(t.due_date) < 0).slice(0, 5).forEach((t) => {
    const e = hr.employees.find((emp) => emp.id === t.employee_id);
    if (!e) return;
    followUps.push({ id: `t-${t.id}`, name: `${e.preferred_name || e.first_name} ${e.last_name}`, issue: "Training overdue", priority: "crit", due: `${-daysUntil(t.due_date)}d overdue` });
  });
  if (!followUps.length) {
    return <Card className="p-6"><Empty icon={CheckCircle2} title="No HR follow-ups right now." hint="You're all caught up." /></Card>;
  }
  return (
    <Card className="divide-y divide-border/70">
      {followUps.slice(0, 10).map((f) => (
        <div key={f.id} className="p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-muted grid place-items-center shrink-0">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium tracking-tight truncate">{f.name}</p>
            <p className="text-[11.5px] text-muted-foreground truncate">{f.issue}</p>
          </div>
          <span className="text-[11.5px] text-muted-foreground hidden md:inline">{f.due}</span>
          <Pill tone={f.priority}>{f.priority === "crit" ? "Urgent" : "Attention"}</Pill>
        </div>
      ))}
    </Card>
  );
}

function ReadinessSection({ items }: { items: PipelineItem[] }) {
  const buckets = {
    ready: items.filter((i) => i.stageKey === "ready_for_start"),
    almost: items.filter((i) => i.stageKey === "Onboarding" || i.stageKey === "Orientation Scheduled"),
    blocked: items.filter((i) => !!i.blocker),
  };
  const cols: { key: keyof typeof buckets; label: string; tone: Tone }[] = [
    { key: "ready", label: "Ready", tone: "ok" },
    { key: "almost", label: "Almost ready", tone: "warn" },
    { key: "blocked", label: "Blocked", tone: "crit" },
  ];
  return (
    <div className="grid md:grid-cols-3 gap-3">
      {cols.map((c) => (
        <Card key={c.key} className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12px] font-medium tracking-tight">{c.label}</p>
            <Pill tone={c.tone}>{buckets[c.key].length}</Pill>
          </div>
          {buckets[c.key].length === 0 ? (
            <p className="text-[12px] text-muted-foreground/70 py-4 text-center">Nothing here.</p>
          ) : (
            <div className="space-y-2">
              {buckets[c.key].slice(0, 5).map((i) => (
                <div key={`${i.source}-${i.id}`} className="flex items-center gap-2.5 rounded-lg p-1.5 hover:bg-muted/60 transition-colors">
                  <Avatar first={i.name.split(" ")[0]} last={i.name.split(" ").slice(-1)[0]} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-medium tracking-tight truncate">{i.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{i.role} · {i.state}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

/* ─── slide-over detail panel ─── */
function DetailPanel({ item, onClose, hr, onbByEmp, tasksByOnb, bgChecks, orientation }: {
  item: PipelineItem; onClose: () => void;
  hr: ReturnType<typeof useNewHiresData>;
  onbByEmp: Map<string, OnbRow>;
  tasksByOnb: Map<string, TaskRow[]>;
  bgChecks: ReturnType<typeof useRecruitingBackgroundChecks>["items"];
  orientation: ReturnType<typeof useRecruitingOrientation>["items"];
}) {
  const isEmp = item.source === "employee";
  const emp = isEmp ? (item.raw as Emp) : null;
  const cand = !isEmp ? (item.raw as RecruitingCandidate) : null;
  const onb = emp ? onbByEmp.get(emp.id) : undefined;
  const tasks = onb ? tasksByOnb.get(onb.id) ?? [] : [];
  const docs = emp ? hr.documents.filter((d) => d.employee_id === emp.id) : [];
  const trs = emp ? hr.trainings.filter((t) => t.employee_id === emp.id) : [];
  const bg = cand ? bgChecks.find((b) => b.candidate_id === cand.id) : undefined;
  const orient = cand ? orientation.find((o) => o.candidate_id === cand.id) : undefined;

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-foreground/20 backdrop-blur-sm" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl h-full bg-card border-l border-border/70 overflow-y-auto animate-in slide-in-from-right duration-200"
      >
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border/70 px-5 py-4 flex items-start gap-3">
          <Avatar first={item.name.split(" ")[0]} last={item.name.split(" ").slice(-1)[0]} />
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold tracking-tight truncate">{item.name}</p>
            <p className="text-[12px] text-muted-foreground truncate flex items-center gap-2">
              <Briefcase className="h-3 w-3" />{item.role}
              <MapPin className="h-3 w-3 ml-1" />{item.state}
            </p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full grid place-items-center hover:bg-muted transition-colors">
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Status */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Status</p>
            <div className="flex flex-wrap gap-1.5">
              <Pill tone="muted">{item.stageLabel}</Pill>
              <Pill tone={item.ageDays >= 5 ? "warn" : "muted"}>{item.ageDays}d in stage</Pill>
              {item.blocker && <Pill tone="crit"><AlertTriangle className="h-3 w-3" />{item.blocker}</Pill>}
              {item.hrOwner && <Pill tone="muted">Owner: {item.hrOwner}</Pill>}
            </div>
            <div className="mt-3">
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-foreground/70" style={{ width: `${item.pct}%` }} />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">{item.pct}% complete</p>
            </div>
          </div>

          {/* Contact */}
          {(emp?.email || emp?.phone || cand?.email || cand?.phone) && (
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Contact</p>
              <div className="text-[13px] space-y-1">
                {(emp?.email || cand?.email) && <p>{emp?.email || cand?.email}</p>}
                {(emp?.phone || cand?.phone) && <p className="text-muted-foreground">{emp?.phone || cand?.phone}</p>}
              </div>
            </div>
          )}

          {/* Onboarding status */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Onboarding status</p>
            <div className="grid grid-cols-2 gap-2 text-[12.5px]">
              <StatusRow label="Background check" value={bg?.status ?? (emp ? "n/a" : "not started")} tone={bg?.status === "cleared" ? "ok" : bg?.status === "flagged" ? "crit" : "warn"} />
              <StatusRow label="Orientation" value={orient?.status ?? (emp?.status === "active" ? "completed" : "pending")} tone={orient?.status === "completed" ? "ok" : orient?.status === "missed" ? "crit" : "warn"} />
              <StatusRow label="Training" value={trs.length ? `${trs.filter((t) => t.status === "completed").length}/${trs.length}` : "—"} tone={trs.length && trs.every((t) => t.status === "completed") ? "ok" : "muted"} />
            </div>
          </div>

          {/* Integration readiness — honest per-provider status */}
          {onb && (
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Integration readiness</p>
              <IntegrationReadinessPanel row={onb} />
              <div className="mt-3">
                <HRIntegrationReadinessEditor
                  onboardingId={onb.id}
                  employeeId={emp?.id ?? null}
                  row={onb as any}
                  onSaved={hr.reload}
                />
              </div>
            </div>
          )}

          {/* Recent HR activity */}
          {(emp?.id || onb?.id) && (
            <HRRecentActivity employeeId={emp?.id ?? null} onboardingId={onb?.id ?? null} />
          )}

          {/* Tasks */}
          {tasks.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Tasks</p>
              <div className="space-y-1.5">
                {tasks.slice(0, 8).map((t) => (
                  <div key={t.id} className="flex items-center gap-2 text-[13px]">
                    <CheckCircle2 className={cn("h-3.5 w-3.5", t.completed ? "text-emerald-600" : "text-muted-foreground/40")} strokeWidth={1.75} />
                    <span className={cn("flex-1 truncate", t.completed && "line-through text-muted-foreground")}>{t.title}</span>
                    {t.due_date && !t.completed && daysUntil(t.due_date) < 0 && (
                      <Pill tone="crit">{-daysUntil(t.due_date)}d late</Pill>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          {docs.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Documents</p>
              <div className="space-y-1.5">
                {docs.slice(0, 6).map((d) => (
                  <div key={d.id} className="flex items-center gap-2 text-[13px]">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                    <span className="flex-1 truncate">{d.name}</span>
                    <Pill tone={d.status === "verified" ? "ok" : d.status === "missing" ? "crit" : "warn"}>{d.status}</Pill>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 grid grid-cols-2 gap-2">
            <ActionBtn icon={MessageSquare} label="Message" to="/hr/messages" />
            <ActionBtn icon={CalendarPlus} label="Orientation" to="/hr/orientation-queue" />
            <ActionBtn icon={BookOpen} label="Assign training" to="/hr/training-center" />
            <ActionBtn icon={FileText} label="Add note" onClick={async () => {
              const note = window.prompt(`Add HR note for ${item.name}:`, "");
              if (!note) return;
              const { error } = await logHrEvent({
                eventType: "new_hire_note",
                title: `Note added to ${item.name}`,
                description: note,
                employeeId: emp?.id ?? null,
                onboardingId: onb?.id ?? null,
              });
              toast({ title: error ? "Could not save note" : "Note saved", description: error?.message });
            }} />
            <ActionBtn icon={Heart} label="Open support" to="/hr/employee-support" />
            <ActionBtn
              icon={CheckCircle2}
              label="Mark ready"
              primary
              onClick={async () => {
                if (emp) {
                  const blockers = getHrReadinessBlockers({
                    onboarding: onb as any,
                    documents: docs as any,
                    trainings: trs as any,
                    orientationRequired: !!orient,
                    orientationCompleted: orient?.status === "completed",
                    employeeRole: emp.job_title,
                  });
                  if (blockers.length) {
                    toast({ title: "Cannot mark ready — blockers exist", description: blockers.join(", ") });
                    await logHrEvent({
                      eventType: "ready_blocked",
                      title: `${item.name} blocked from activation`,
                      description: blockers.join(", "),
                      employeeId: emp.id, onboardingId: onb?.id ?? null,
                      metadata: { blockers },
                    });
                    return;
                  }
                  // "Mark ready" only advances the onboarding record. Activation
                  // of the employee row is a separate downstream action.
                  const { error } = onb
                    ? await supabase.from("employee_onboarding").update({ status: "ready_for_start" as never }).eq("id", onb.id)
                    : { error: null } as any;
                  if (!error) await logHrEvent({
                    eventType: "new_hire_marked_ready",
                    title: `${item.name} marked ready for staffing`,
                    employeeId: emp.id, onboardingId: onb?.id ?? null,
                  });
                  hr.reload();
                  toast({ title: error ? "Could not update" : "Marked ready for staffing", description: error?.message ?? `${item.name} onboarding is ready for start.` });
                } else {
                  toast({ title: "Marked ready", description: `${item.name} flagged ready for staffing.` });
                }
                onClose();
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusRow({ label, value, tone }: { label: string; value: string; tone: Tone }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/50 p-2.5">
      <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-1"><Pill tone={tone}>{value}</Pill></div>
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
