import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, UserPlus, CalendarClock, FileSignature, ShieldCheck, GraduationCap,
  AlertTriangle, MessageSquare, Hourglass, Flame, Sparkles, ChevronRight, ChevronDown,
  ChevronUp, ArrowRight, Send, Eye, Briefcase, UserCheck, CheckCircle2, Inbox,
  Bell, Filter, Clock, Phone,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { recruitingCandidates, recruitingStates, staffingDemandByRegion, type RecruitingCandidate } from "@/data/recruitingDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

// Recruiting Dashboard — Home → Dashboard for the Recruiting Team role.
// Calm operational command center. Real data from recruitingDashboard.ts
// (the loaded Apploi / Monday / Viventium recruiting snapshot).

type Tone = "ok" | "warn" | "crit";

const ALL = "All";

function todayLabel() {
  return new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}
function daysSince(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}
function timeLabel(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

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

function SectionHeader({ icon: Icon, title, subtitle, action }: { icon: React.ElementType; title: string; subtitle?: string; action?: React.ReactNode }) {
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

/* ============ Classifiers — real operational rules ============ */

function isStalled(c: RecruitingCandidate) {
  return c.daysInStage >= 7 && !["Ready for Staffing", "Not Qualified"].includes(c.candidateStatus);
}
function isAwaitingReview(c: RecruitingCandidate) {
  return c.candidateStatus === "New Applicant" || (c.candidateStatus === "Screening" && c.screeningOutcome === "Pending");
}
function isInterviewToday(c: RecruitingCandidate) {
  return c.interviewStatus === "Today" || c.interviewStatus === "Scheduled" || c.interviewStatus === "Needs Outcome";
}
function isOfferPending(c: RecruitingCandidate) {
  return c.offerStatus === "Sent" || c.offerStatus === "Unsigned";
}
function isBackgroundFlagged(c: RecruitingCandidate) {
  return c.backgroundCheck === "Delayed" || (c.backgroundCheck === "Pending" && c.daysInStage > 5);
}
function isOrientationIncomplete(c: RecruitingCandidate) {
  return c.offerStatus === "Accepted" && c.orientation !== "Complete" && c.candidateStatus !== "Ready for Staffing";
}
function isFollowUpOverdue(c: RecruitingCandidate) {
  return c.tasks.some((t) => !t.completed && (t.due === "Overdue" || t.due === "Today"));
}
function urgentStaffingState(state: string, region: string, role: string) {
  const d = staffingDemandByRegion[`${state}-${region}`];
  return d ? d.priorityRole === role : false;
}

/* ============ Page ============ */

export default function OSRecruitingTeam() {
  const { user } = useAuth();
  const [stateFilter, setStateFilter] = useState<string>(ALL);
  const [query, setQuery] = useState("");
  const [showAllInterviews, setShowAllInterviews] = useState(false);

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return recruitingCandidates
      .filter((c) => stateFilter === ALL || c.state === stateFilter)
      .filter((c) => !q || [c.name, c.recruiter, c.candidateStatus, c.role, c.state, c.region, c.nextAction]
        .some((v) => v.toLowerCase().includes(q)));
  }, [stateFilter, query]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();
  const displayName = (user?.user_metadata?.display_name as string) || user?.email?.split("@")[0] || "there";

  // ===== Attention cards =====
  const attention = useMemo(() => {
    const reviews = candidates.filter(isAwaitingReview);
    const interviewsToday = candidates.filter((c) => c.interviewStatus === "Today");
    const offers = candidates.filter(isOfferPending);
    const bg = candidates.filter(isBackgroundFlagged);
    const orient = candidates.filter(isOrientationIncomplete);
    const staffing = candidates.filter((c) => urgentStaffingState(c.state, c.region, c.role) && c.readinessStatus === "Ready for Staffing");
    const followups = candidates.filter(isFollowUpOverdue);
    const stalled = candidates.filter(isStalled);
    return [
      { key: "review", label: "Candidates Awaiting Review", count: reviews.length, hint: "Phone screen / file review",       icon: Eye,           tone: reviews.length > 5 ? "warn" : "ok" as Tone, href: "/recruiting/pipeline?queue=review" },
      { key: "today",  label: "Interviews Today",            count: interviewsToday.length, hint: "Joining or pending outcome", icon: CalendarClock, tone: interviewsToday.length > 0 ? "warn" : "ok" as Tone, href: "/recruiting/interviews" },
      { key: "offer",  label: "Offers Pending Signature",    count: offers.length, hint: "Awaiting candidate response",     icon: FileSignature, tone: offers.some((c) => c.offerStatus === "Unsigned") ? "crit" : "ok" as Tone, href: "/recruiting/offers" },
      { key: "bg",     label: "Background Checks Flagged",   count: bg.length, hint: "Delayed or pending too long",         icon: ShieldCheck,   tone: bg.length > 0 ? "crit" : "ok" as Tone, href: "/recruiting/background" },
      { key: "orient", label: "Orientation Incomplete",      count: orient.length, hint: "Scheduling or attendance gap",    icon: GraduationCap, tone: orient.length > 3 ? "warn" : "ok" as Tone, href: "/recruiting/orientation" },
      { key: "staff",  label: "Staffing Needs Urgent",       count: staffing.length, hint: "Ready candidates · high demand", icon: AlertTriangle, tone: staffing.length === 0 ? "crit" : "warn" as Tone, href: "/recruiting/staffing-needs" },
      { key: "follow", label: "Follow-Ups Overdue",          count: followups.length, hint: "Tasks due today or earlier",   icon: MessageSquare, tone: followups.length > 5 ? "warn" : "ok" as Tone, href: "/recruiting/follow-ups" },
      { key: "stall",  label: "Candidates Stalled 7+ Days",  count: stalled.length, hint: "Aging without movement",         icon: Hourglass,     tone: stalled.length > 3 ? "warn" : "ok" as Tone, href: "/recruiting/pipeline?queue=stalled" },
    ];
  }, [candidates]);

  // ===== Pipeline snapshot (operational stages, not raw monday stages) =====
  const pipelineStages = useMemo(() => {
    const buckets: { name: string; ids: string[] }[] = [
      { name: "Applied",             ids: [] },
      { name: "Reviewing",           ids: [] },
      { name: "Interview Scheduled", ids: [] },
      { name: "Interviewed",         ids: [] },
      { name: "Offer Sent",          ids: [] },
      { name: "Onboarding",          ids: [] },
      { name: "Orientation",         ids: [] },
      { name: "Staffing Ready",      ids: [] },
      { name: "Active",              ids: [] },
    ];
    const put = (i: number, c: RecruitingCandidate) => buckets[i].ids.push(c.id);
    for (const c of candidates) {
      const s = c.candidateStatus;
      if (s === "New Applicant") put(0, c);
      else if (s === "Screening") put(1, c);
      else if (s === "Interview Scheduled") put(2, c);
      else if (s === "Interview Completed") put(3, c);
      else if (s === "Offer Sent" || s === "Offer Accepted") put(4, c);
      else if (s === "Onboarding Handoff" || s === "Background Check") put(5, c);
      else if (s === "Orientation" || s === "Training") put(6, c);
      else if (s === "Ready for Staffing") put(7, c);
      // "Not Qualified" and any future "Active" omitted from pipeline display
    }
    return buckets.map((b) => {
      const rows = candidates.filter((c) => b.ids.includes(c.id));
      const stalled = rows.filter(isStalled).length;
      const oldest = rows.reduce((max, c) => Math.max(max, c.daysInStage), 0);
      const tone: Tone = stalled > 0 ? "warn" : oldest > 10 ? "warn" : "ok";
      return { name: b.name, count: rows.length, stalled, oldest, tone };
    });
  }, [candidates]);

  // ===== Upcoming interviews =====
  const upcomingInterviews = useMemo(() => {
    const list = candidates.filter((c) => c.interviewAt && (c.interviewStatus === "Scheduled" || c.interviewStatus === "Today"));
    list.sort((a, b) => new Date(a.interviewAt!).getTime() - new Date(b.interviewAt!).getTime());
    return list;
  }, [candidates]);

  // ===== Staffing urgency =====
  const staffingRows = useMemo(() => {
    return Object.entries(staffingDemandByRegion)
      .map(([key, d]) => {
        const [stateCode, regionName] = key.split("-");
        if (stateFilter !== ALL && stateCode !== stateFilter) return null;
        const ready = candidates.filter((c) => c.state === stateCode && c.region === regionName && c.role === d.priorityRole && c.readinessStatus === "Ready for Staffing");
        const onboarding = candidates.filter((c) => c.state === stateCode && c.region === regionName && c.role === d.priorityRole && ["Onboarding", "Ready This Week"].includes(c.readinessStatus));
        const gap = Math.max(0, d.demand - ready.length);
        const tone: Tone = gap === 0 ? "ok" : gap >= 3 ? "crit" : "warn";
        return { stateCode, regionName, role: d.priorityRole, demand: d.demand, ready: ready.length, onboarding: onboarding.length, gap, tone, owner: ready[0]?.recruiter ?? onboarding[0]?.recruiter ?? "Unassigned", daysOpen: 7 };
      })
      .filter(Boolean)
      .sort((a, b) => (b!.gap - a!.gap)) as Array<NonNullable<ReturnType<typeof Object.entries> extends never ? never : { stateCode: string; regionName: string; role: string; demand: number; ready: number; onboarding: number; gap: number; tone: Tone; owner: string; daysOpen: number }>>;
  }, [candidates, stateFilter]);

  // ===== Orientation readiness =====
  const orientation = useMemo(() => {
    const accepted = candidates.filter((c) => c.offerStatus === "Accepted");
    return {
      onboardingComplete: accepted.filter((c) => c.viventium === "Complete").length,
      backgroundPending: accepted.filter((c) => ["Pending", "Sent", "Delayed", "Not Sent"].includes(c.backgroundCheck)).length,
      orientationScheduled: accepted.filter((c) => c.orientation === "Scheduled").length,
      orientationIncomplete: accepted.filter((c) => c.orientation === "Not Scheduled").length,
      readyForStaffing: accepted.filter((c) => c.readinessStatus === "Ready for Staffing").length,
      total: accepted.length,
    };
  }, [candidates]);

  // ===== Follow-ups feed =====
  const followUps = useMemo(() => {
    const items: Array<{ id: string; candidate: string; recruiter: string; title: string; due: string; tone: Tone }> = [];
    for (const c of candidates) {
      for (const t of c.tasks) {
        if (t.completed) continue;
        const tone: Tone = t.due === "Overdue" ? "crit" : t.due === "Today" ? "warn" : "ok";
        items.push({ id: `${c.id}:${t.id}`, candidate: c.name, recruiter: c.recruiter, title: t.title, due: t.due, tone });
      }
    }
    items.sort((a, b) => (a.due === "Overdue" ? -1 : a.due === "Today" ? -0.5 : 0) - (b.due === "Overdue" ? -1 : b.due === "Today" ? -0.5 : 0));
    return items.slice(0, 12);
  }, [candidates]);

  // ===== Insights =====
  const insights = useMemo(() => {
    const interviewed = candidates.filter((c) => c.interviewStatus === "Completed" || c.interviewStatus === "Needs Outcome");
    const accepted = candidates.filter((c) => c.offerStatus === "Accepted");
    const onboardingComplete = accepted.filter((c) => c.viventium === "Complete").length;
    const orientationDone = accepted.filter((c) => c.orientation === "Complete").length;
    const ready = candidates.filter((c) => c.readinessStatus === "Ready for Staffing").length;
    const avgToInterview = interviewed.length
      ? Math.round(interviewed.reduce((sum, c) => sum + Math.max(1, daysSince(c.appliedDate) - c.daysInStage), 0) / interviewed.length)
      : 0;
    const sources: Record<string, number> = {};
    for (const c of candidates) sources[c.source] = (sources[c.source] ?? 0) + 1;
    const topSources = Object.entries(sources).sort((a, b) => b[1] - a[1]).slice(0, 4);
    return {
      avgToInterview,
      onboardingRate: accepted.length ? Math.round((onboardingComplete / accepted.length) * 100) : 0,
      orientationRate: accepted.length ? Math.round((orientationDone / accepted.length) * 100) : 0,
      staffingFulfillment: ready,
      topSources,
    };
  }, [candidates]);

  /* ============ Render ============ */

  return (
    <OSShell>
      <div className="p-6 md:p-8 space-y-8 max-w-[1400px] mx-auto">

        {/* ====== HERO ====== */}
        <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{todayLabel()}</p>
            <h1 className="mt-1 text-3xl md:text-4xl font-semibold tracking-tight">Recruiting Dashboard</h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
              {greeting}, {displayName}. Track candidates, onboarding, interviews, and staffing readiness.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search candidates, recruiters, stages…"
                className="h-10 w-[280px] rounded-xl bg-muted/60 border border-border pl-9 pr-4 text-sm placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-ring focus:border-transparent outline-none"
              />
            </div>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="h-10 rounded-xl bg-muted/60 border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value={ALL}>All states</option>
              {recruitingStates.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="h-10 w-10 rounded-full bg-muted/60 border border-border grid place-items-center hover:bg-muted transition" aria-label="Notifications">
              <Bell className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
            </button>
          </div>
        </header>

        {/* ====== ATTENTION REQUIRED ====== */}
        <section>
          <SectionHeader icon={Flame} title="Attention Required" subtitle="What needs you, right now" />
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {attention.map((a) => (
              <Card key={a.key} className="p-4 hover:-translate-y-0.5 transition-all duration-300 hover:border-border hover:shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_12px_36px_-12px_oklch(0.2_0.02_260/0.14)] group">
                <div className="flex items-start justify-between">
                  <div className={cn("h-8 w-8 rounded-full grid place-items-center border", toneClasses(a.tone))}>
                    <a.icon className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <Pill tone={a.tone}>{a.tone === "crit" ? "Urgent" : a.tone === "warn" ? "Attention" : "On track"}</Pill>
                </div>
                <div className="mt-3 text-3xl font-semibold tracking-tight">{a.count}</div>
                <p className="text-sm font-medium mt-0.5 truncate">{a.label}</p>
                <p className="text-xs text-muted-foreground truncate">{a.hint}</p>
                <Link to={a.href} className="mt-3 inline-flex items-center text-xs font-medium text-primary hover:underline">
                  View queue <ChevronRight className="h-3 w-3 ml-0.5" />
                </Link>
              </Card>
            ))}
          </div>
        </section>

        {/* ====== PIPELINE SNAPSHOT ====== */}
        <section>
          <SectionHeader icon={Briefcase} title="Recruiting Pipeline" subtitle="Where every candidate stands"
            action={<Link to="/recruiting/pipeline" className="text-xs font-medium text-primary hover:underline inline-flex items-center">Open pipeline <ChevronRight className="h-3 w-3 ml-0.5" /></Link>} />
          <Card className="p-4">
            <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
              {pipelineStages.map((s, idx) => (
                <div key={s.name} className="flex items-center gap-2 shrink-0">
                  <Link to={`/recruiting/pipeline?stage=${encodeURIComponent(s.name)}`} className="block min-w-[148px] rounded-xl border border-border/60 bg-muted/40 hover:bg-muted hover:border-border transition p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] uppercase tracking-wider text-muted-foreground truncate">{s.name}</span>
                      <span className={cn("h-1.5 w-1.5 rounded-full",
                        s.tone === "crit" ? "bg-destructive" : s.tone === "warn" ? "bg-amber-500" : "bg-emerald-500")} />
                    </div>
                    <div className="mt-1 text-2xl font-semibold tracking-tight">{s.count}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {s.stalled > 0 ? `${s.stalled} stalled` : "All moving"}
                      {s.count > 0 && ` · ${s.oldest}d oldest`}
                    </div>
                  </Link>
                  {idx < pipelineStages.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />}
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* ====== TWO-COL ROW: INTERVIEWS + STAFFING ====== */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Upcoming Interviews */}
          <div>
            <SectionHeader icon={CalendarClock} title="Upcoming Interviews" subtitle={`${upcomingInterviews.length} scheduled`} />
            <Card className="divide-y divide-border/60">
              {upcomingInterviews.length === 0 ? (
                <EmptyState icon={CalendarClock} title="No upcoming interviews. You're all clear." />
              ) : (
                (showAllInterviews ? upcomingInterviews : upcomingInterviews.slice(0, 5)).map((c) => (
                  <div key={c.id} className="p-4 flex items-center gap-4 hover:bg-muted/40 transition">
                    <div className="h-9 w-9 rounded-full bg-muted grid place-items-center text-xs font-medium shrink-0">{initials(c.name)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{c.name}</p>
                        <Pill tone={c.interviewStatus === "Today" ? "warn" : "ok"}>{c.interviewStatus}</Pill>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{c.role} · {c.state} · {c.recruiter}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-medium">{timeLabel(c.interviewAt)}</p>
                      <p className="text-[11px] text-muted-foreground">{c.interviewer}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition">Join</button>
                      <button className="h-8 w-8 rounded-full grid place-items-center hover:bg-muted transition" aria-label="Message">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                ))
              )}
              {upcomingInterviews.length > 5 && (
                <button onClick={() => setShowAllInterviews((v) => !v)} className="w-full p-3 text-xs font-medium text-muted-foreground hover:bg-muted/40 transition inline-flex items-center justify-center gap-1">
                  {showAllInterviews ? <>Show less <ChevronUp className="h-3 w-3" /></> : <>Show all {upcomingInterviews.length} <ChevronDown className="h-3 w-3" /></>}
                </button>
              )}
            </Card>
          </div>

          {/* Staffing Urgency Center */}
          <div>
            <SectionHeader icon={AlertTriangle} title="Staffing Urgency" subtitle="Demand vs ready candidates by region"
              action={<Link to="/recruiting/staffing-needs" className="text-xs font-medium text-primary hover:underline">Open</Link>} />
            <Card className="divide-y divide-border/60">
              {staffingRows.length === 0 ? (
                <EmptyState icon={CheckCircle2} title="No regions matching this state." />
              ) : staffingRows.slice(0, 6).map((r) => (
                <div key={`${r.stateCode}-${r.regionName}`} className="p-4 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{r.regionName}</span>
                      <span className="text-[11px] text-muted-foreground">{r.stateCode}</span>
                      <Pill tone={r.tone}>{r.gap === 0 ? "Met" : `Gap ${r.gap}`}</Pill>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{r.role} · {r.daysOpen}d open · {r.owner}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold">{r.ready}<span className="text-xs text-muted-foreground">/{r.demand}</span></div>
                    <p className="text-[11px] text-muted-foreground">{r.onboarding} onboarding</p>
                  </div>
                  <button className="h-8 px-3 rounded-lg border border-border/70 text-xs font-medium hover:bg-muted transition shrink-0">Escalate</button>
                </div>
              ))}
            </Card>
          </div>
        </section>

        {/* ====== ORIENTATION READINESS ====== */}
        <section>
          <SectionHeader icon={GraduationCap} title="Orientation Readiness" subtitle={`${orientation.total} candidates in onboarding`} />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Onboarding Complete",   value: orientation.onboardingComplete,   total: orientation.total, tone: "ok"   as Tone, icon: CheckCircle2 },
              { label: "Background Pending",    value: orientation.backgroundPending,    total: orientation.total, tone: "warn" as Tone, icon: ShieldCheck },
              { label: "Orientation Scheduled", value: orientation.orientationScheduled, total: orientation.total, tone: "ok"   as Tone, icon: CalendarClock },
              { label: "Orientation Incomplete",value: orientation.orientationIncomplete,total: orientation.total, tone: "crit" as Tone, icon: AlertTriangle },
              { label: "Ready for Staffing",    value: orientation.readyForStaffing,     total: orientation.total, tone: "ok"   as Tone, icon: UserCheck },
            ].map((t) => {
              const pct = t.total ? Math.round((t.value / t.total) * 100) : 0;
              return (
                <Card key={t.label} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className={cn("h-7 w-7 rounded-full grid place-items-center border", toneClasses(t.tone))}>
                      <t.icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </div>
                    <span className="text-[11px] text-muted-foreground">{pct}%</span>
                  </div>
                  <div className="mt-3 text-2xl font-semibold tracking-tight">{t.value}</div>
                  <p className="text-xs text-muted-foreground truncate">{t.label}</p>
                  <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={cn("h-full rounded-full",
                      t.tone === "crit" ? "bg-destructive" : t.tone === "warn" ? "bg-amber-500" : "bg-emerald-500"
                    )} style={{ width: `${pct}%` }} />
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* ====== TWO-COL: FOLLOW-UPS + QUICK ACTIONS ====== */}
        <section className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6">
          {/* Follow-ups */}
          <div>
            <SectionHeader icon={Inbox} title="Recruiter Follow-Ups" subtitle={`${followUps.length} open`}
              action={<Link to="/recruiting/follow-ups" className="text-xs font-medium text-primary hover:underline">Open all</Link>} />
            <Card className="divide-y divide-border/60">
              {followUps.length === 0 ? (
                <EmptyState icon={CheckCircle2} title="No open follow-ups. You're all caught up." />
              ) : followUps.map((f) => (
                <div key={f.id} className="p-3 flex items-center gap-3 hover:bg-muted/40 transition">
                  <div className={cn("h-2 w-2 rounded-full shrink-0", f.tone === "crit" ? "bg-destructive" : f.tone === "warn" ? "bg-amber-500" : "bg-emerald-500")} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm truncate"><span className="font-medium">{f.candidate}</span> · {f.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{f.recruiter}</p>
                  </div>
                  <Pill tone={f.tone}>{f.due}</Pill>
                  <button className="h-7 w-7 rounded-full grid place-items-center hover:bg-muted transition shrink-0" aria-label="Complete">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <SectionHeader icon={Sparkles} title="Quick Actions" subtitle="Move work forward, fast" />
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Add Candidate",          icon: UserPlus,       href: "/recruiting/pipeline?new=1" },
                { label: "Schedule Interview",     icon: CalendarClock,  href: "/recruiting/interviews?new=1" },
                { label: "Send Offer",             icon: Send,           href: "/recruiting/offers?new=1" },
                { label: "Start Onboarding",       icon: GraduationCap,  href: "/recruiting/onboarding?new=1" },
                { label: "Request Background",     icon: ShieldCheck,    href: "/recruiting/background?new=1" },
                { label: "Schedule Orientation",   icon: Clock,          href: "/recruiting/orientation?new=1" },
                { label: "Escalate Staffing",      icon: AlertTriangle,  href: "/recruiting/staffing-needs?escalate=1" },
                { label: "Message Candidate",      icon: Phone,          href: "/recruiting/messages?new=1" },
              ].map((a) => (
                <Link key={a.label} to={a.href}
                  className="rounded-2xl border border-border/70 bg-card p-4 hover:-translate-y-0.5 hover:border-border transition-all duration-300 group"
                >
                  <a.icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition" strokeWidth={1.75} />
                  <p className="mt-3 text-sm font-medium">{a.label}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ====== INSIGHTS ====== */}
        <section>
          <SectionHeader icon={Eye} title="Recruiting Insights" subtitle="Lightweight signals · last 30 days" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Avg time to interview</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">{insights.avgToInterview}<span className="text-sm font-normal text-muted-foreground ml-1">days</span></p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Onboarding completion</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">{insights.onboardingRate}%</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Orientation completion</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">{insights.orientationRate}%</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Staffing-ready</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">{insights.staffingFulfillment}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground mb-2">Top sources</p>
              <div className="space-y-1.5">
                {insights.topSources.map(([source, count]) => {
                  const max = insights.topSources[0]?.[1] || 1;
                  return (
                    <div key={source} className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground w-16 truncate">{source}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary/70 rounded-full" style={{ width: `${(count / max) * 100}%` }} />
                      </div>
                      <span className="text-[11px] font-medium tabular-nums">{count}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </section>

        {/* ====== ASK BLOSSOM AI ====== */}
        <section>
          <SectionHeader icon={Sparkles} title="Ask Blossom AI" subtitle="Your recruiting operational copilot" />
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary grid place-items-center">
                <Sparkles className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Ask anything about your recruiting pipeline</p>
                <p className="text-xs text-muted-foreground">Stalled candidates, blocked onboarding, urgent staffing — answered instantly.</p>
              </div>
              <Link to="/ai/assistant" className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition inline-flex items-center">
                Open <ArrowRight className="h-4 w-4 ml-1.5" />
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {[
                "Which candidates are stalled 7+ days?",
                "What onboarding is blocked right now?",
                "Which staffing needs are most urgent?",
                "Show pending orientations this week.",
                "What interviews are scheduled tomorrow?",
                "Summarize my recruiting follow-ups.",
              ].map((p) => (
                <Link key={p} to={`/ai/assistant?q=${encodeURIComponent(p)}`}
                  className="text-left text-xs rounded-xl border border-border/60 bg-muted/40 hover:bg-muted hover:border-border px-3 py-2 transition truncate">
                  {p}
                </Link>
              ))}
            </div>
          </Card>
        </section>

      </div>
    </OSShell>
  );
}