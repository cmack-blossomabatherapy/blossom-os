import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, Bell, Flame, ChevronRight, Users, UserPlus, CalendarClock, GraduationCap,
  ClipboardCheck, ShieldCheck, Inbox, HeartHandshake, Sparkles, BookOpen, Workflow,
  AlertTriangle, CheckCircle2, FileText, Hourglass,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useEmployeeDirectory } from "@/hooks/useEmployeeDirectory";
import {
  useRecruitingCandidates,
  useRecruitingOrientation,
  useRecruitingBackgroundChecks,
  fullName,
  daysInStage,
  type RecruitingCandidate,
  type PipelineStage,
} from "@/hooks/useRecruitingCandidates";
import { supabase } from "@/integrations/supabase/client";

// ============================================================================
// HR Team — Dashboard (awareness layer)
// Calm, Apple-style people-ops overview. Real data from employees +
// recruiting_candidates + recruiting_orientation_slots + recruiting_background_checks
// + employee_documents_hr + employee_reviews. Empty states stay calm where data
// is not yet flowing.
// ============================================================================

type Tone = "ok" | "warn" | "crit";

const STATES = ["GA", "NC", "TN", "VA", "MD", "FL", "TX", "SC"] as const;
const ALL = "All";

function toneClasses(t: Tone) {
  switch (t) {
    case "crit": return "bg-destructive/10 text-destructive border-destructive/20";
    case "warn": return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
    default:    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
  }
}

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn(
      "rounded-2xl border border-border/70 bg-card",
      "shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]",
      className,
    )}>{children}</div>
  );
}

function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border whitespace-nowrap",
      toneClasses(tone),
    )}>{children}</span>
  );
}

function SectionHeader({
  icon: Icon, title, subtitle, action,
}: { icon: React.ElementType; title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-9 w-9 rounded-full bg-muted grid place-items-center shrink-0">
          <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight truncate">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground truncate">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

function EmptyState({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-8 px-6">
      <div className="h-9 w-9 rounded-full bg-muted grid place-items-center mb-2">
        <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
      </div>
      <p className="text-sm text-muted-foreground">{title}</p>
    </div>
  );
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase();
}
function todayLabel() {
  return new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

// Small live counters that don't need their own hook — keeps the dashboard
// self-contained while we wait for shared HR hooks in Phase 2.
function useHrCounts() {
  const [counts, setCounts] = useState({
    expiringDocs: 0,
    missingDocs: 0,
    reviewsDue: 0,
    reviewsOverdue: 0,
  });
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const in30 = new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10);
      const today = new Date().toISOString().slice(0, 10);
      const [{ count: expiring }, { count: missing }, { count: due }, { count: overdue }] = await Promise.all([
        supabase.from("employee_documents_hr").select("*", { count: "exact", head: true })
          .gte("expires_on", today).lte("expires_on", in30),
        supabase.from("employee_documents_hr").select("*", { count: "exact", head: true })
          .eq("required", true).eq("status", "requested"),
        supabase.from("employee_reviews").select("*", { count: "exact", head: true })
          .eq("status", "scheduled" as never).gte("scheduled_for", today),
        supabase.from("employee_reviews").select("*", { count: "exact", head: true })
          .eq("status", "scheduled" as never).lt("scheduled_for", today),
      ]).catch(() => [{ count: 0 }, { count: 0 }, { count: 0 }, { count: 0 }]);
      if (cancelled) return;
      setCounts({
        expiringDocs: expiring ?? 0,
        missingDocs: missing ?? 0,
        reviewsDue: due ?? 0,
        reviewsOverdue: overdue ?? 0,
      });
    }
    void load();
    return () => { cancelled = true; };
  }, []);
  return counts;
}

export default function OSHRTeam() {
  const { user } = useAuth();
  const { members } = useEmployeeDirectory();
  const { candidates } = useRecruitingCandidates();
  const { items: orientation } = useRecruitingOrientation();
  const { items: bgChecks } = useRecruitingBackgroundChecks();
  const hr = useHrCounts();

  const [stateFilter, setStateFilter] = useState<string>(ALL);
  const [query, setQuery] = useState("");

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();
  const displayName = (user?.user_metadata?.display_name as string) || user?.email?.split("@")[0] || "there";

  // ------------------ filtered candidates (HR view of onboarding pipeline) ------------------
  const filteredCandidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return candidates
      .filter((c) => stateFilter === ALL || c.state === stateFilter)
      .filter((c) => !q || [fullName(c), c.role, c.state, c.pipeline_stage, c.recruiter]
        .some((v) => String(v ?? "").toLowerCase().includes(q)));
  }, [candidates, stateFilter, query]);

  const inStages = (stages: PipelineStage[]) =>
    filteredCandidates.filter((c) => stages.includes(c.pipeline_stage));

  // ------------------ Snapshot cards ------------------
  const newHiresInProgress = inStages(["Offer Accepted", "Background Check", "Onboarding"]);
  const orientationThisWeek = useMemo(() => {
    const now = new Date();
    const weekEnd = new Date(now.getTime() + 7 * 86400_000);
    return orientation.filter((o) => {
      if (!o.scheduled_date || o.status === "Completed" || o.status === "Cancelled") return false;
      const d = new Date(o.scheduled_date);
      return d >= now && d <= weekEnd;
    });
  }, [orientation]);
  const trainingOverdue = 0; // wires to training_assignments + completions in Phase 2
  const openRequests = 0;    // wires to hr_requests in Phase 2

  const snapshot = [
    { label: "New Hires In Progress",         value: newHiresInProgress.length, hint: `${newHiresInProgress.length === 1 ? "employee" : "employees"} moving through onboarding`,            icon: UserPlus,       href: "/hr/new-hires",                tone: (newHiresInProgress.length > 0 ? "warn" : "ok") as Tone },
    { label: "Orientation This Week",         value: orientationThisWeek.length, hint: "Sessions scheduled in the next 7 days",                                                              icon: CalendarClock,  href: "/hr/orientation-queue",        tone: (orientationThisWeek.length > 0 ? "warn" : "ok") as Tone },
    { label: "Training Overdue",              value: trainingOverdue,            hint: trainingOverdue === 0 ? "No overdue trainings" : "Across departments",                                icon: GraduationCap,  href: "/hr/training-certifications",  tone: (trainingOverdue > 0 ? "crit" : "ok") as Tone },
    { label: "Certifications Expiring",       value: hr.expiringDocs,            hint: hr.expiringDocs === 0 ? "Nothing in the next 30 days" : "Within 30 days",                              icon: ShieldCheck,    href: "/hr/compliance",               tone: (hr.expiringDocs > 0 ? "warn" : "ok") as Tone },
    { label: "Open HR Requests",              value: openRequests,               hint: openRequests === 0 ? "Inbox clear" : "Awaiting HR review",                                              icon: Inbox,          href: "/hr/requests",                 tone: (openRequests > 5 ? "warn" : openRequests > 0 ? "warn" : "ok") as Tone },
    { label: "Evaluations Pending",           value: hr.reviewsDue,              hint: hr.reviewsOverdue > 0 ? `${hr.reviewsOverdue} overdue` : "All on track",                                icon: ClipboardCheck, href: "/hr/evaluations",              tone: (hr.reviewsOverdue > 0 ? "crit" : hr.reviewsDue > 0 ? "warn" : "ok") as Tone },
  ];

  // ------------------ Needs HR Attention ------------------
  const attention = useMemo(() => {
    const stalled = filteredCandidates.filter((c) =>
      ["Onboarding", "Background Check", "Orientation Scheduled"].includes(c.pipeline_stage)
      && daysInStage(c) >= 4);
    const bgFlagged = bgChecks.filter((b) => b.status === "Needs Review" || !!b.blocker);
    const orientationRisk = orientation.filter((o) => o.status === "Scheduled" && o.scheduled_date && new Date(o.scheduled_date) <= new Date(Date.now() + 2 * 86400_000));
    const candidatesById = new Map(candidates.map((c) => [c.id, c]));
    type Row = { id: string; name: string; role: string; state: string; blocker: string; waiting: string; tone: Tone; href: string };
    const rows: Row[] = [];
    stalled.slice(0, 4).forEach((c) => rows.push({
      id: `s-${c.id}`, name: fullName(c), role: c.role ?? "—", state: c.state ?? "—",
      blocker: `Stalled in ${c.pipeline_stage}`, waiting: `${daysInStage(c)}d`,
      tone: daysInStage(c) >= 7 ? "crit" : "warn",
      href: `/recruiting/pipeline?stage=${encodeURIComponent(c.pipeline_stage)}`,
    }));
    bgFlagged.slice(0, 3).forEach((b) => {
      const c = candidatesById.get(b.candidate_id);
      rows.push({
        id: `b-${b.id}`, name: c ? fullName(c) : "Background check", role: c?.role ?? "—", state: c?.state ?? "—",
        blocker: b.blocker ?? "Needs adjudication", waiting: "Review",
        tone: "crit", href: "/hr/compliance",
      });
    });
    orientationRisk.slice(0, 3).forEach((o) => {
      const c = candidatesById.get(o.candidate_id);
      rows.push({
        id: `o-${o.id}`, name: c ? fullName(c) : "Orientation seat", role: c?.role ?? "—", state: c?.state ?? "—",
        blocker: `Orientation ${o.scheduled_date ? new Date(o.scheduled_date).toLocaleDateString() : ""}`,
        waiting: "Soon", tone: "warn", href: "/hr/orientation-queue",
      });
    });
    return rows;
  }, [filteredCandidates, bgChecks, orientation, candidates]);

  // ------------------ Onboarding pipeline overview ------------------
  const pipeline = useMemo(() => {
    const stages: { name: string; stages: PipelineStage[]; href: string }[] = [
      { name: "Offer Accepted",     stages: ["Offer Accepted"],         href: "/recruiting/offers" },
      { name: "Viventium Sent",     stages: ["Onboarding"],             href: "/recruiting/onboarding" },
      { name: "Onboarding",         stages: ["Onboarding"],             href: "/recruiting/onboarding" },
      { name: "Background Check",   stages: ["Background Check"],       href: "/recruiting/background" },
      { name: "Orientation",        stages: ["Orientation Scheduled"],  href: "/hr/orientation-queue" },
      { name: "Ready to Staff",     stages: ["Ready to Staff"],         href: "/recruiting/pipeline?stage=Ready+to+Staff" },
    ];
    return stages.map((g) => {
      const rows = filteredCandidates.filter((c) => g.stages.includes(c.pipeline_stage));
      const stalled = rows.filter((c) => daysInStage(c) >= 7).length;
      const tone: Tone = stalled > 0 ? "warn" : "ok";
      return { ...g, count: rows.length, stalled, tone };
    });
  }, [filteredCandidates]);

  // ------------------ Orientation readiness rows ------------------
  const orientationRows = useMemo(() => {
    const candidatesById = new Map(candidates.map((c) => [c.id, c]));
    const bgByCandidate = new Map(bgChecks.map((b) => [b.candidate_id, b]));
    return orientation
      .filter((o) => stateFilter === ALL || candidatesById.get(o.candidate_id)?.state === stateFilter)
      .sort((a, b) => (a.scheduled_date ?? "").localeCompare(b.scheduled_date ?? ""))
      .slice(0, 6)
      .map((o) => {
        const c = candidatesById.get(o.candidate_id);
        const bg = bgByCandidate.get(o.candidate_id);
        const ready = o.status === "Completed";
        const bgOk = bg?.status === "Cleared" || bg?.status === "Pass";
        const label: { text: string; tone: Tone } = ready
          ? { text: "Completed", tone: "ok" }
          : !bgOk && bg ? { text: "Needs HR Review", tone: "crit" }
          : !bg ? { text: "Missing Documents", tone: "warn" }
          : { text: "Ready", tone: "ok" };
        return { o, c, bg, label };
      });
  }, [orientation, candidates, bgChecks, stateFilter]);

  // ------------------ Header / quick actions ------------------
  return (
    <OSShell>
      <div className="p-6 md:p-8 space-y-8 max-w-[1400px] mx-auto">
        {/* HERO */}
        <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{todayLabel()}</p>
            <h1 className="mt-1 text-3xl md:text-4xl font-semibold tracking-tight">HR Dashboard</h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
              {greeting}, {displayName}. Monitor onboarding, training, readiness, employee support, and operational progress across Blossom.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search employees, roles, stages…"
                className="h-10 w-[260px] rounded-xl bg-muted/60 border border-border pl-9 pr-4 text-sm placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-ring focus:border-transparent outline-none"
              />
            </div>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="h-10 rounded-xl bg-muted/60 border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value={ALL}>All states</option>
              {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="h-10 w-10 rounded-full bg-muted/60 border border-border grid place-items-center hover:bg-muted transition" aria-label="Notifications">
              <Bell className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
            </button>
          </div>
        </header>

        {/* QUICK ACTIONS */}
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/hr/new-hires"             className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition inline-flex items-center gap-2"><UserPlus className="h-4 w-4" strokeWidth={1.75} /> Add new hire</Link>
          <Link to="/hr/orientation-queue"     className="h-9 px-4 rounded-xl bg-muted/60 border border-border text-sm hover:bg-muted transition inline-flex items-center gap-2"><CalendarClock className="h-4 w-4" strokeWidth={1.75} /> Review orientation queue</Link>
          <Link to="/hr/training-certifications" className="h-9 px-4 rounded-xl bg-muted/60 border border-border text-sm hover:bg-muted transition inline-flex items-center gap-2"><GraduationCap className="h-4 w-4" strokeWidth={1.75} /> Assign training</Link>
          <Link to="/hr/requests"              className="h-9 px-4 rounded-xl bg-muted/60 border border-border text-sm hover:bg-muted transition inline-flex items-center gap-2"><Inbox className="h-4 w-4" strokeWidth={1.75} /> Open HR requests</Link>
          <Link to="/ai/assistant"             className="h-9 px-4 rounded-xl bg-muted/60 border border-border text-sm hover:bg-muted transition inline-flex items-center gap-2"><Sparkles className="h-4 w-4" strokeWidth={1.75} /> Ask Blossom AI</Link>
        </div>

        {/* SNAPSHOT */}
        <section>
          <SectionHeader icon={Workflow} title="HR Snapshot" subtitle={`${members.length} employees across ${new Set(members.map(m => m.states?.[0])).size} states`} />
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {snapshot.map((s) => (
              <Link key={s.label} to={s.href}>
                <Card className="p-4 hover:-translate-y-0.5 transition-all duration-300 hover:border-border group">
                  <div className="flex items-start justify-between">
                    <div className={cn("h-8 w-8 rounded-full grid place-items-center border", toneClasses(s.tone))}>
                      <s.icon className="h-4 w-4" strokeWidth={1.75} />
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition" />
                  </div>
                  <div className="mt-3 text-3xl font-semibold tracking-tight">{s.value}</div>
                  <p className="text-sm font-medium mt-0.5 truncate">{s.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{s.hint}</p>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* NEEDS HR ATTENTION */}
        <section>
          <SectionHeader icon={Flame} title="Needs HR Attention" subtitle="The most important operational blockers right now" />
          <Card className="divide-y divide-border/60">
            {attention.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="Everyone is progressing smoothly. No urgent blockers." />
            ) : (
              attention.slice(0, 8).map((r) => (
                <div key={r.id} className="p-4 flex items-center gap-4 hover:bg-muted/40 transition">
                  <div className="h-9 w-9 rounded-full bg-muted grid place-items-center text-xs font-medium shrink-0">{initials(r.name)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="text-sm font-medium truncate">{r.name}</p>
                      <span className="text-xs text-muted-foreground">·</span>
                      <p className="text-xs text-muted-foreground truncate">{r.role} · {r.state}</p>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{r.blocker}</p>
                  </div>
                  <Pill tone={r.tone}>{r.waiting}</Pill>
                  <Link to={r.href} className="h-8 px-3 rounded-lg bg-muted/60 border border-border text-xs font-medium hover:bg-muted transition">Review</Link>
                </div>
              ))
            )}
          </Card>
        </section>

        {/* ONBOARDING PIPELINE OVERVIEW */}
        <section>
          <SectionHeader
            icon={Workflow} title="Onboarding Pipeline" subtitle="Where every new hire stands"
            action={<Link to="/hr/new-hires" className="text-xs font-medium text-primary hover:underline inline-flex items-center">Open new hires <ChevronRight className="h-3 w-3 ml-0.5" /></Link>}
          />
          <Card className="p-4">
            <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
              {pipeline.map((s, idx) => (
                <div key={s.name} className="flex items-center gap-2 shrink-0">
                  <Link to={s.href} className="block min-w-[150px] rounded-xl border border-border/60 bg-muted/40 hover:bg-muted hover:border-border transition p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] uppercase tracking-wider text-muted-foreground truncate">{s.name}</span>
                      <span className={cn("h-1.5 w-1.5 rounded-full",
                        s.tone === "crit" ? "bg-destructive" : s.tone === "warn" ? "bg-amber-500" : "bg-emerald-500")} />
                    </div>
                    <div className="mt-1 text-2xl font-semibold tracking-tight">{s.count}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {s.stalled > 0 ? `${s.stalled} stalled` : s.count === 0 ? "Empty" : "All moving"}
                    </div>
                  </Link>
                  {idx < pipeline.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />}
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* ORIENTATION READINESS + EMPLOYEE SUPPORT */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div>
            <SectionHeader
              icon={CalendarClock} title="Orientation Readiness" subtitle={`${orientationRows.length} upcoming`}
              action={<Link to="/hr/orientation-queue" className="text-xs font-medium text-primary hover:underline inline-flex items-center">All sessions <ChevronRight className="h-3 w-3 ml-0.5" /></Link>}
            />
            <Card className="divide-y divide-border/60">
              {orientationRows.length === 0 ? (
                <EmptyState icon={CalendarClock} title="No upcoming orientation sessions." />
              ) : (
                orientationRows.map(({ o, c, label }) => (
                  <div key={o.id} className="p-4 flex items-center gap-4 hover:bg-muted/40 transition">
                    <div className="h-9 w-9 rounded-full bg-muted grid place-items-center text-xs font-medium shrink-0">
                      {c ? initials(fullName(c)) : "OR"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{c ? fullName(c) : "Orientation seat"}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {c?.role ?? "—"} · {c?.state ?? "—"} · {o.scheduled_date ? new Date(o.scheduled_date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) : "TBD"}
                        {o.scheduled_time ? ` · ${o.scheduled_time}` : ""}
                      </p>
                    </div>
                    <Pill tone={label.tone}>{label.text}</Pill>
                  </div>
                ))
              )}
            </Card>
          </div>

          <div>
            <SectionHeader
              icon={HeartHandshake} title="Employee Support" subtitle="Open conversations and follow-ups"
              action={<Link to="/hr/employee-support" className="text-xs font-medium text-primary hover:underline inline-flex items-center">Support queue <ChevronRight className="h-3 w-3 ml-0.5" /></Link>}
            />
            <Card>
              <EmptyState icon={HeartHandshake} title="No urgent employee support requests. People are doing well." />
            </Card>
          </div>
        </section>

        {/* TRAINING & CERTS + EVALUATIONS */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div>
            <SectionHeader
              icon={GraduationCap} title="Training & Certifications" subtitle="Overdue, expiring, and at risk"
              action={<Link to="/hr/training-certifications" className="text-xs font-medium text-primary hover:underline inline-flex items-center">Manage training <ChevronRight className="h-3 w-3 ml-0.5" /></Link>}
            />
            <Card className="p-4 space-y-3">
              <Row label="Overdue trainings" value={trainingOverdue} tone={trainingOverdue > 0 ? "crit" : "ok"} icon={AlertTriangle} />
              <Row label="Certifications expiring (30d)" value={hr.expiringDocs} tone={hr.expiringDocs > 0 ? "warn" : "ok"} icon={ShieldCheck} />
              <Row label="Missing required documents" value={hr.missingDocs} tone={hr.missingDocs > 0 ? "warn" : "ok"} icon={FileText} />
              <Row label="Readiness blocked by training" value={0} tone="ok" icon={Hourglass} />
            </Card>
          </div>

          <div>
            <SectionHeader
              icon={ClipboardCheck} title="Evaluations & Growth" subtitle="Coaching and review pipeline"
              action={<Link to="/hr/evaluations" className="text-xs font-medium text-primary hover:underline inline-flex items-center">Open evaluations <ChevronRight className="h-3 w-3 ml-0.5" /></Link>}
            />
            <Card className="p-4 space-y-3">
              <Row label="Evaluations pending" value={hr.reviewsDue} tone={hr.reviewsDue > 0 ? "warn" : "ok"} icon={ClipboardCheck} />
              <Row label="Evaluations overdue" value={hr.reviewsOverdue} tone={hr.reviewsOverdue > 0 ? "crit" : "ok"} icon={AlertTriangle} />
              <Row label="Active coaching plans" value={0} tone="ok" icon={HeartHandshake} />
              <Row label="Growth conversations due" value={0} tone="ok" icon={Sparkles} />
            </Card>
          </div>
        </section>

        {/* CONTENT MANAGEMENT + ASK BLOSSOM AI */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <SectionHeader icon={BookOpen} title="Content Updates" subtitle="Training Academy & Resource Library" />
            <Card className="divide-y divide-border/60">
              <ContentLine label="Draft modules pending publish" value={0} href="/hr/training-center" />
              <ContentLine label="SOPs needing review" value={0} href="/hr/resources" />
              <ContentLine label="Resources missing visibility tags" value={0} href="/hr/resources" />
              <ContentLine label="Outdated training modules" value={0} href="/hr/training-center" />
              <ContentLine label="Quizzes needing updates" value={0} href="/hr/training-center" />
            </Card>
          </div>

          <div>
            <SectionHeader icon={Sparkles} title="Ask Blossom AI" subtitle="Operational copilot" />
            <Card className="p-5 space-y-3">
              <p className="text-sm text-muted-foreground">Try one of these:</p>
              <ul className="space-y-2">
                {[
                  "Who is blocked from onboarding?",
                  "Which certifications expire this month?",
                  "Show overdue training for RBTs.",
                  "Which employees missed orientation?",
                  "Summarize open HR requests.",
                ].map((q) => (
                  <li key={q}>
                    <Link to={`/ai/assistant?q=${encodeURIComponent(q)}`}
                      className="block rounded-xl border border-border/60 bg-muted/40 hover:bg-muted hover:border-border transition px-3 py-2 text-sm">
                      “{q}”
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </section>
      </div>
    </OSShell>
  );
}

// ------------------ small row primitives ------------------
function Row({ label, value, tone, icon: Icon }: { label: string; value: number; tone: Tone; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn("h-8 w-8 rounded-full grid place-items-center border", toneClasses(tone))}>
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{label}</p>
      </div>
      <span className="text-lg font-semibold tabular-nums">{value}</span>
    </div>
  );
}
function ContentLine({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link to={href} className="flex items-center justify-between gap-4 p-4 hover:bg-muted/40 transition">
      <p className="text-sm">{label}</p>
      <div className="flex items-center gap-2">
        {value === 0
          ? <span className="text-xs text-muted-foreground">All clear</span>
          : <span className="text-sm font-semibold tabular-nums">{value}</span>}
        <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
      </div>
    </Link>
  );
}

void Users; void Hourglass;
export type { RecruitingCandidate };