import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, CalendarClock, FileSignature, GraduationCap,
  Flame, MessageSquare, Sparkles, ChevronRight, Inbox, Filter, X,
  Phone, Send, Eye, UserCheck, CheckCircle2, Clock, AlertTriangle,
  Brain, ChevronDown, UserPlus,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { recruitingCandidates, type RecruitingCandidate } from "@/data/recruitingDashboard";
import { useSlideout } from "@/hooks/useSlideout";
import { cn } from "@/lib/utils";

// Recruiting Workspace — execution hub for the Recruiting Team.
// Calm, queue-first. Wired to recruitingDashboard.ts (pending Apploi ingest).

type Tone = "ok" | "warn" | "crit";
type QueueKey = "today" | "followup" | "offers" | "onboarding" | "escalation";

function todayLabel() {
  return new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}
function timeLabel(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
function initials(n: string) {
  return n.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
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
function EmptyState({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-6">
      <div className="h-10 w-10 rounded-full bg-muted grid place-items-center mb-2">
        <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
      </div>
      <p className="text-sm text-muted-foreground">{title}</p>
    </div>
  );
}

const QUEUE_DEFS: { key: QueueKey; label: string; icon: React.ElementType; tone: Tone }[] = [
  { key: "today",      label: "Today",            icon: CalendarClock,  tone: "warn" },
  { key: "followup",   label: "Follow-Ups",       icon: MessageSquare,  tone: "warn" },
  { key: "offers",     label: "Offers",           icon: FileSignature,  tone: "warn" },
  { key: "onboarding", label: "Onboarding",       icon: GraduationCap,  tone: "warn" },
  { key: "escalation", label: "Escalations",      icon: Flame,          tone: "crit" },
];

function classifyCandidate(c: RecruitingCandidate): QueueKey | null {
  // Escalations
  if (
    c.readinessStatus === "Blocked" ||
    c.daysInStage >= 7 && (c.candidateStatus === "Onboarding Handoff" || c.candidateStatus === "Background Check") ||
    c.backgroundCheck === "Delayed" ||
    c.noShow
  ) return "escalation";

  if (c.interviewStatus === "Today" || c.interviewStatus === "Needs Outcome") return "today";

  if (c.offerStatus === "Sent" || c.offerStatus === "Unsigned") return "offers";

  if (
    c.onboardingStatus === "Handoff Needed" ||
    c.onboardingStatus === "Viventium Sent" ||
    c.onboardingStatus === "Background Pending" ||
    c.onboardingStatus === "Orientation Scheduled" ||
    c.onboardingStatus === "Training Assigned"
  ) return "onboarding";

  if (c.candidateStatus === "New Applicant" || c.candidateStatus === "Screening") return "followup";

  if (c.readinessStatus === "Ready for Staffing") return null;
  return null;
}

function candidateTone(c: RecruitingCandidate): Tone {
  if (c.readinessStatus === "Blocked" || c.noShow || c.daysInStage >= 10) return "crit";
  if (c.daysInStage >= 5 || c.offerStatus === "Unsigned") return "warn";
  return "ok";
}

function nextActionFor(c: RecruitingCandidate, key: QueueKey): string {
  if (key === "today" && c.interviewStatus === "Today") return `Interview at ${timeLabel(c.interviewAt)}`;
  if (key === "today" && c.interviewStatus === "Needs Outcome") return "Enter interview outcome";
  if (key === "offers" && c.offerStatus === "Unsigned") return "Follow up on unsigned offer";
  if (key === "offers") return "Track signature";
  if (key === "onboarding") return c.nextAction;
  if (key === "escalation") return c.blockers[0] ?? c.nextAction;
  if (key === "followup") return c.nextAction;
  return c.nextAction;
}

export default function OSRecruitingWorkspace() {
  const items = recruitingCandidates;
  const [activeQueue, setActiveQueue] = useState<QueueKey>("today");
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [recruiterFilter, setRecruiterFilter] = useState<string>("all");
  const [selected, setSelected] = useState<RecruitingCandidate | null>(null);

  const buckets = useMemo(() => {
    const b: Record<QueueKey, RecruitingCandidate[]> = {
      today: [], followup: [], offers: [], onboarding: [], escalation: [],
    };
    items.forEach((c) => {
      const k = classifyCandidate(c);
      if (k) b[k].push(c);
    });
    Object.keys(b).forEach((k) => {
      b[k as QueueKey].sort((a, x) => {
        const rank = (y: RecruitingCandidate) =>
          (y.readinessStatus === "Blocked" ? 3 : y.daysInStage >= 7 ? 2 : 1);
        return rank(x) - rank(a) || x.daysInStage - a.daysInStage;
      });
    });
    return b;
  }, [items]);

  const states = useMemo(() => Array.from(new Set(items.map((c) => c.state))).sort(), [items]);
  const recruiters = useMemo(() => Array.from(new Set(items.map((c) => c.recruiter))).sort(), [items]);

  const feed = useMemo(() => {
    const list = buckets[activeQueue];
    const q = query.trim().toLowerCase();
    return list.filter((c) => {
      if (stateFilter !== "all" && c.state !== stateFilter) return false;
      if (roleFilter !== "all" && c.role !== roleFilter) return false;
      if (recruiterFilter !== "all" && c.recruiter !== recruiterFilter) return false;
      if (q && !(
        c.name.toLowerCase().includes(q) ||
        c.recruiter.toLowerCase().includes(q) ||
        c.region.toLowerCase().includes(q) ||
        c.candidateStatus.toLowerCase().includes(q)
      )) return false;
      return true;
    });
  }, [buckets, activeQueue, query, stateFilter, roleFilter, recruiterFilter]);

  const priorities = useMemo(() => [
    ...buckets.escalation.slice(0, 3),
    ...buckets.today.slice(0, 3),
    ...buckets.offers.filter((c) => c.offerStatus === "Unsigned").slice(0, 2),
  ].slice(0, 6), [buckets]);

  const recruiterLoad = useMemo(() => {
    const m = new Map<string, number>();
    items.forEach((c) => {
      if (classifyCandidate(c)) m.set(c.recruiter, (m.get(c.recruiter) ?? 0) + 1);
    });
    return Array.from(m.entries())
      .map(([recruiter, count]) => ({ recruiter, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [items]);

  const workloadCount = items.filter((c) => classifyCandidate(c) !== null).length;

  return (
    <OSShell>
      <div className="mx-auto w-full max-w-[1500px] px-4 md:px-8 pb-24 pt-6 md:pt-10 space-y-6">

        {/* HEADER */}
        <header>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{todayLabel()}</p>
              <h1 className="mt-1 text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
                Recruiting Workspace
              </h1>
              <p className="mt-1.5 text-[15px] text-muted-foreground max-w-2xl">
                Manage candidates, follow-ups, offers, and onboarding from one calm queue.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-2 px-3 h-9 rounded-full border border-border/70 bg-card text-xs font-medium text-foreground">
                <Inbox className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                {workloadCount} active
              </span>
              <span className="inline-flex items-center gap-2 px-3 h-9 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-primary/40 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                Focused mode
              </span>
            </div>
          </div>

          {/* Search + filters */}
          <div className="mt-5 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search candidates, recruiters, regions…"
                className="w-full h-11 pl-11 pr-4 rounded-2xl bg-card border border-border/70 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <FilterSelect icon={Filter} value={stateFilter} onChange={setStateFilter}
                options={[{ v: "all", l: "All states" }, ...states.map((s) => ({ v: s, l: s }))]} />
              <FilterSelect icon={UserCheck} value={roleFilter} onChange={setRoleFilter}
                options={[{ v: "all", l: "All roles" }, { v: "RBT", l: "RBT" }, { v: "BCBA", l: "BCBA" }]} />
              <FilterSelect icon={UserPlus} value={recruiterFilter} onChange={setRecruiterFilter}
                options={[{ v: "all", l: "All recruiters" }, ...recruiters.map((r) => ({ v: r, l: r }))]} />
            </div>
          </div>
        </header>

        {/* QUEUE TABS */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {QUEUE_DEFS.map((q) => {
            const count = buckets[q.key].length;
            const active = activeQueue === q.key;
            return (
              <button
                key={q.key}
                onClick={() => setActiveQueue(q.key)}
                className={cn(
                  "inline-flex items-center gap-2 px-4 h-10 rounded-full text-sm font-medium border whitespace-nowrap transition",
                  active
                    ? "bg-foreground text-background border-foreground"
                    : "bg-card border-border/70 text-foreground hover:bg-muted/40",
                )}
              >
                <q.icon className="h-4 w-4" strokeWidth={1.75} />
                {q.label}
                <span className={cn(
                  "ml-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold",
                  active ? "bg-background/20 text-background" : "bg-muted text-muted-foreground",
                )}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">

          {/* FEED */}
          <div className="space-y-3 min-w-0">
            {feed.length === 0 ? (
              <Card>
                <EmptyState icon={CheckCircle2} title="You're all caught up on this queue." />
              </Card>
            ) : feed.map((c) => {
              const tone = candidateTone(c);
              const next = nextActionFor(c, activeQueue);
              return (
                <Card key={c.id} className="p-4 hover:bg-muted/20 transition cursor-pointer" >
                  <button onClick={() => setSelected(c)} className="w-full text-left">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 text-primary grid place-items-center text-sm font-semibold shrink-0">
                        {initials(c.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground truncate">{c.name}</h3>
                          <Pill tone="ok">{c.role}</Pill>
                          <span className="text-xs text-muted-foreground">{c.state} · {c.region}</span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground truncate">{next}</p>
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <Pill tone={tone}>
                            <Clock className="h-3 w-3" />
                            {c.daysInStage}d in stage
                          </Pill>
                          <span className="text-[11px] text-muted-foreground">· {c.candidateStatus}</span>
                          <span className="text-[11px] text-muted-foreground">· {c.recruiter}</span>
                          {c.source === "Apploi" && (
                            <span className="text-[10px] uppercase font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded">Apploi</span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                    </div>
                  </button>
                </Card>
              );
            })}
          </div>

          {/* RIGHT RAIL */}
          <aside className="space-y-4">
            {/* Today's priorities */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground inline-flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> Today's priorities
                </h3>
                <span className="text-[11px] text-muted-foreground">{priorities.length}</span>
              </div>
              {priorities.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Nothing urgent right now.</p>
              ) : (
                <ul className="space-y-2">
                  {priorities.map((c) => (
                    <li key={c.id}>
                      <button onClick={() => setSelected(c)} className="w-full text-left p-2 rounded-lg hover:bg-muted/40 transition">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-foreground truncate">{c.name}</span>
                          <span className="text-[10px] text-muted-foreground shrink-0">{c.daysInStage}d</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">{c.nextAction}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Recruiter load */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3 inline-flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-muted-foreground" /> Recruiter load
              </h3>
              {recruiterLoad.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">No active workload.</p>
              ) : (
                <ul className="space-y-2">
                  {recruiterLoad.map((r) => (
                    <li key={r.recruiter} className="flex items-center justify-between text-sm">
                      <span className="text-foreground truncate">{r.recruiter}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">{r.count} active</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* AI prompts */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3 inline-flex items-center gap-1.5">
                <Brain className="h-3.5 w-3.5 text-primary" /> Ask Blossom AI
              </h3>
              <div className="space-y-1.5">
                {[
                  "Which candidates are stalled the longest?",
                  "Summarize today's interviews and outcomes.",
                  "Which offers are unsigned past 48 hours?",
                  "What regions have the biggest staffing gap?",
                ].map((p) => (
                  <Link
                    key={p}
                    to={`/ai/assistant?q=${encodeURIComponent(p)}`}
                    className="block px-3 py-2 rounded-lg text-xs text-foreground bg-muted/40 hover:bg-muted/60 transition"
                  >
                    {p}
                  </Link>
                ))}
              </div>
            </Card>
          </aside>
        </div>
      </div>

      {/* SLIDEOUT */}
      <CandidateSlideout candidate={selected} onClose={() => setSelected(null)} />
    </OSShell>
  );
}

/* ---------- FilterSelect ---------- */
function FilterSelect({
  icon: Icon, value, onChange, options,
}: {
  icon: React.ElementType;
  value: string;
  onChange: (v: string) => void;
  options: { v: string; l: string }[];
}) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none h-11 pl-9 pr-8 rounded-2xl bg-card border border-border/70 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
    </div>
  );
}

/* ---------- Slideout ---------- */
function CandidateSlideout({ candidate, onClose }: { candidate: RecruitingCandidate | null; onClose: () => void }) {
  useSlideout(!!candidate, onClose);
  if (!candidate) return null;
  const c = candidate;
  const tone = candidateTone(c);
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-foreground/10 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-background border-l border-border shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-background/95 backdrop-blur border-b border-border px-5 py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold text-foreground truncate">{c.name}</h2>
              <Pill tone="ok">{c.role}</Pill>
              <Pill tone={tone}>{c.candidateStatus}</Pill>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{c.state} · {c.region} · {c.city}</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full hover:bg-muted grid place-items-center">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Next action */}
          <section>
            <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Next action</h3>
            <p className="text-sm text-foreground">{c.nextAction}</p>
          </section>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-2">
            <QuickAction icon={Send} label="Message" />
            <QuickAction icon={Phone} label="Call" />
            <QuickAction icon={CalendarClock} label="Schedule" />
            <QuickAction icon={Eye} label="Open profile" />
          </div>

          {/* Pipeline */}
          <section className="space-y-2">
            <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground">Pipeline status</h3>
            <Row label="Interview"   value={c.interviewStatus}   />
            <Row label="Offer"       value={c.offerStatus}       />
            <Row label="Onboarding"  value={c.onboardingStatus}  />
            <Row label="Readiness"   value={c.readinessStatus}   />
            <Row label="Background"  value={c.backgroundCheck}   />
            <Row label="Orientation" value={c.orientation}       />
            <Row label="Training"    value={c.training}          />
          </section>

          {/* Blockers */}
          {c.blockers.length > 0 && (
            <section>
              <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 inline-flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3 text-destructive" /> Blockers
              </h3>
              <ul className="space-y-1.5">
                {c.blockers.map((b, i) => (
                  <li key={i} className="text-sm text-foreground bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">{b}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Tasks */}
          {c.tasks.length > 0 && (
            <section>
              <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Tasks</h3>
              <ul className="space-y-1.5">
                {c.tasks.map((t) => (
                  <li key={t.id} className="flex items-center justify-between text-sm border border-border/60 rounded-lg px-3 py-2">
                    <span className={cn("text-foreground", t.completed && "line-through text-muted-foreground")}>{t.title}</span>
                    <span className="text-[11px] text-muted-foreground">{t.owner}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Meta */}
          <section className="grid grid-cols-2 gap-3 text-xs">
            <Meta label="Recruiter"    value={c.recruiter} />
            <Meta label="Interviewer"  value={c.interviewer} />
            <Meta label="Source"       value={c.source} />
            <Meta label="Applied"      value={c.appliedDate} />
            <Meta label="Days in stage" value={`${c.daysInStage}d`} />
            <Meta label="Availability" value={c.availability} />
          </section>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
  );
}
function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-foreground mt-0.5">{value}</p>
    </div>
  );
}
function QuickAction({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <button className="inline-flex items-center justify-center gap-1.5 h-9 rounded-xl border border-border/70 bg-card text-xs font-medium text-foreground hover:bg-muted/40 transition">
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
      {label}
    </button>
  );
}