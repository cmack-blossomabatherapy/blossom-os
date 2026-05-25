import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, Bell, Flame, CalendarClock, FileSignature, ShieldCheck, GraduationCap,
  AlertTriangle, MessageSquare, Hourglass, ChevronRight, Briefcase, Inbox, Eye, Users, BarChart3,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  useRecruitingCandidates,
  useRecruitingInterviews,
  useRecruitingOffers,
  useRecruitingBackgroundChecks,
  useRecruitingOrientation,
  useRecruitingFollowups,
  useRecruitingEscalations,
  useRecruitingStaffingNeeds,
  fullName,
  daysInStage,
  type RecruitingCandidate,
  type PipelineStage,
} from "@/hooks/useRecruitingCandidates";

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
function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}
function todayLabel() {
  return new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

export default function OSRecruitingTeam() {
  const { user } = useAuth();
  const { candidates } = useRecruitingCandidates();
  const { items: interviews } = useRecruitingInterviews();
  const { items: offers } = useRecruitingOffers();
  const { items: bgChecks } = useRecruitingBackgroundChecks();
  const { items: orientation } = useRecruitingOrientation();
  const { items: followups } = useRecruitingFollowups();
  const { items: escalations } = useRecruitingEscalations();
  const { items: staffingNeeds } = useRecruitingStaffingNeeds();

  const [stateFilter, setStateFilter] = useState<string>(ALL);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return candidates
      .filter((c) => stateFilter === ALL || c.state === stateFilter)
      .filter((c) => !q || [fullName(c), c.recruiter, c.pipeline_stage, c.role, c.state, c.next_action]
        .some((v) => String(v ?? "").toLowerCase().includes(q)));
  }, [candidates, stateFilter, query]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();
  const displayName = (user?.user_metadata?.display_name as string) || user?.email?.split("@")[0] || "there";

  const inStages = (stages: PipelineStage[]) => filtered.filter((c) => stages.includes(c.pipeline_stage));

  // Attention cards
  const attention = useMemo(() => {
    const reviews = inStages(["New Applicant", "Phone Screen"]);
    const interviewsToday = filtered.filter((c) => c.pipeline_stage === "Interview Scheduled");
    const offersPending = filtered.filter((c) => c.pipeline_stage === "Offer Sent");
    const bgFlagged = bgChecks.filter((b) => b.status === "Needs Review" || !!b.blocker);
    const orientationIncomplete = orientation.filter((o) => o.status === "Scheduled");
    const openStaffing = staffingNeeds.filter((n) => n.status === "Open");
    const overdueFollowups = followups.filter((f) => f.status === "Open" && f.due_date && new Date(f.due_date) <= new Date());
    const stalled = filtered.filter((c) => daysInStage(c) >= 7 && !["Withdrawn", "Rejected"].includes(c.pipeline_stage));
    return [
      { key: "review", label: "Awaiting Review",       count: reviews.length,              hint: "Phone screen / file review",     icon: Eye,           tone: reviews.length > 5 ? "warn" : "ok" as Tone,        href: "/recruiting/pipeline?stage=New%20Applicant" },
      { key: "today",  label: "Interviews Scheduled",  count: interviewsToday.length,      hint: "Upcoming panel interviews",       icon: CalendarClock, tone: interviewsToday.length > 0 ? "warn" : "ok" as Tone, href: "/recruiting/interviews" },
      { key: "offer",  label: "Offers Pending",        count: offersPending.length,        hint: "Awaiting candidate response",     icon: FileSignature, tone: offersPending.length > 0 ? "warn" : "ok" as Tone,  href: "/recruiting/offers" },
      { key: "bg",     label: "Background Flags",      count: bgFlagged.length,            hint: "Needs adjudication",              icon: ShieldCheck,   tone: bgFlagged.length > 0 ? "crit" : "ok" as Tone,      href: "/recruiting/background" },
      { key: "orient", label: "Orientation Pending",   count: orientationIncomplete.length, hint: "Scheduled, not completed",        icon: GraduationCap, tone: orientationIncomplete.length > 3 ? "warn" : "ok" as Tone, href: "/recruiting/orientation" },
      { key: "staff",  label: "Open Staffing Needs",   count: openStaffing.length,         hint: "Clients awaiting RBT/BCBA match", icon: AlertTriangle, tone: openStaffing.length > 3 ? "crit" : "warn" as Tone, href: "/recruiting/staffing-needs" },
      { key: "follow", label: "Follow-Ups Overdue",    count: overdueFollowups.length,     hint: "Tasks past due",                  icon: MessageSquare, tone: overdueFollowups.length > 5 ? "warn" : "ok" as Tone, href: "/recruiting/follow-ups" },
      { key: "stall",  label: "Stalled 7+ Days",       count: stalled.length,              hint: "Aging without movement",          icon: Hourglass,     tone: stalled.length > 3 ? "warn" : "ok" as Tone,        href: "/recruiting/pipeline?queue=stalled" },
    ];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, bgChecks, orientation, staffingNeeds, followups]);

  // Pipeline snapshot
  const pipelineStages = useMemo(() => {
    const groups: { name: string; stages: PipelineStage[] }[] = [
      { name: "Applied",       stages: ["New Applicant"] },
      { name: "Reviewing",     stages: ["Phone Screen"] },
      { name: "Interviewing",  stages: ["Interview Scheduled", "Interview Complete"] },
      { name: "Offer",         stages: ["Offer Sent", "Offer Accepted"] },
      { name: "Background",    stages: ["Background Check"] },
      { name: "Orientation",   stages: ["Orientation Scheduled"] },
      { name: "Onboarding",    stages: ["Onboarding"] },
      { name: "Ready",         stages: ["Ready to Staff"] },
      { name: "Staffed",       stages: ["Staffed"] },
    ];
    return groups.map((g) => {
      const rows = filtered.filter((c) => g.stages.includes(c.pipeline_stage));
      const stalled = rows.filter((c) => daysInStage(c) >= 7).length;
      const oldest = rows.reduce((m, c) => Math.max(m, daysInStage(c)), 0);
      const tone: Tone = stalled > 0 ? "warn" : oldest > 10 ? "warn" : "ok";
      return { name: g.name, count: rows.length, stalled, oldest, tone, stage: g.stages[0] };
    });
  }, [filtered]);

  // Upcoming interviews
  const upcomingInterviews = useMemo(() => {
    const candidateMap = new Map(candidates.map((c) => [c.id, c]));
    return interviews
      .filter((i) => i.status === "Scheduled" && i.scheduled_at && new Date(i.scheduled_at) >= new Date())
      .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())
      .map((i) => ({ ...i, candidate: candidateMap.get(i.candidate_id) }))
      .filter((i) => i.candidate);
  }, [interviews, candidates]);

  // Staffing rows
  const staffingRows = useMemo(() => {
    return staffingNeeds
      .filter((n) => stateFilter === ALL || n.state === stateFilter)
      .sort((a, b) => (a.status === "Open" ? -1 : 1) - (b.status === "Open" ? -1 : 1));
  }, [staffingNeeds, stateFilter]);

  // Insights
  const insights = useMemo(() => {
    const sources: Record<string, number> = {};
    for (const c of candidates) {
      const s = c.source ?? "Unknown";
      sources[s] = (sources[s] ?? 0) + 1;
    }
    const acceptedOffers = offers.filter((o) => o.status === "Accepted").length;
    const sentOffers = offers.filter((o) => o.status === "Sent" || o.status === "Accepted").length;
    const ready = candidates.filter((c) => c.pipeline_stage === "Ready to Staff").length;
    return {
      avgDaysInStage: candidates.length
        ? Math.round(candidates.reduce((s, c) => s + daysInStage(c), 0) / candidates.length)
        : 0,
      offerAcceptRate: sentOffers ? Math.round((acceptedOffers / sentOffers) * 100) : 0,
      readyToStaff: ready,
      topSources: Object.entries(sources).sort((a, b) => b[1] - a[1]).slice(0, 4),
    };
  }, [candidates, offers]);

  return (
    <OSShell>
      <div className="p-6 md:p-8 space-y-8 max-w-[1400px] mx-auto">
        {/* HERO */}
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
              {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="h-10 w-10 rounded-full bg-muted/60 border border-border grid place-items-center hover:bg-muted transition" aria-label="Notifications">
              <Bell className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
            </button>
          </div>
        </header>

        {/* ATTENTION */}
        <section>
          <SectionHeader icon={Flame} title="Attention Required" subtitle="What needs you, right now" />
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {attention.map((a) => (
              <Card key={a.key} className="p-4 hover:-translate-y-0.5 transition-all duration-300 hover:border-border group">
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

        {/* PIPELINE SNAPSHOT */}
        <section>
          <SectionHeader icon={Briefcase} title="Recruiting Pipeline" subtitle="Where every candidate stands"
            action={<Link to="/recruiting/pipeline" className="text-xs font-medium text-primary hover:underline inline-flex items-center">Open pipeline <ChevronRight className="h-3 w-3 ml-0.5" /></Link>} />
          <Card className="p-4">
            <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
              {pipelineStages.map((s, idx) => (
                <div key={s.name} className="flex items-center gap-2 shrink-0">
                  <Link to={`/recruiting/pipeline?stage=${encodeURIComponent(s.stage)}`} className="block min-w-[148px] rounded-xl border border-border/60 bg-muted/40 hover:bg-muted hover:border-border transition p-3">
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

        {/* INTERVIEWS + STAFFING */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div>
            <SectionHeader icon={CalendarClock} title="Upcoming Interviews" subtitle={`${upcomingInterviews.length} scheduled`} />
            <Card className="divide-y divide-border/60">
              {upcomingInterviews.length === 0 ? (
                <EmptyState icon={CalendarClock} title="No upcoming interviews. You're all clear." />
              ) : (
                upcomingInterviews.slice(0, 6).map((i) => (
                  <div key={i.id} className="p-4 flex items-center gap-4 hover:bg-muted/40 transition">
                    <div className="h-9 w-9 rounded-full bg-muted grid place-items-center text-xs font-medium shrink-0">{initials(fullName(i.candidate!))}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{fullName(i.candidate!)}</p>
                        <Pill tone="ok">{i.interview_type}</Pill>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{i.candidate!.role} · {i.candidate!.state} · {i.panel ?? "—"}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-medium">{new Date(i.scheduled_at!).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                    </div>
                    <Link to="/recruiting/interviews" className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition">Open</Link>
                  </div>
                ))
              )}
            </Card>
          </div>

          <div>
            <SectionHeader icon={AlertTriangle} title="Staffing Needs" subtitle={`${staffingRows.filter(s => s.status === "Open").length} open`}
              action={<Link to="/recruiting/staffing-needs" className="text-xs font-medium text-primary hover:underline inline-flex items-center">All needs <ChevronRight className="h-3 w-3 ml-0.5" /></Link>} />
            <Card className="divide-y divide-border/60">
              {staffingRows.length === 0 ? (
                <EmptyState icon={Users} title="No open staffing needs." />
              ) : (
                staffingRows.slice(0, 6).map((n) => (
                  <div key={n.id} className="p-4 flex items-center gap-4 hover:bg-muted/40 transition">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{n.client_label}</p>
                      <p className="text-xs text-muted-foreground">{n.role_needed} · {n.state} · {n.hours_per_week ?? "—"} hr/wk · opened {Math.max(0, Math.floor((Date.now() - new Date(n.opened_at).getTime()) / 86400000))}d ago</p>
                    </div>
                    <Pill tone={(n.priority === "Critical" ? "crit" : n.priority === "High" ? "warn" : "ok") as Tone}>{n.priority ?? "Normal"}</Pill>
                    <Pill tone={n.status === "Open" ? "warn" : "ok"}>{n.status}</Pill>
                  </div>
                ))
              )}
            </Card>
          </div>
        </section>

        {/* FOLLOW-UPS + INSIGHTS */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <SectionHeader icon={MessageSquare} title="Follow-Ups" subtitle={`${followups.filter(f=>f.status==="Open").length} open`}
              action={<Link to="/recruiting/follow-ups" className="text-xs font-medium text-primary hover:underline inline-flex items-center">Open feed <ChevronRight className="h-3 w-3 ml-0.5" /></Link>} />
            <Card className="divide-y divide-border/60">
              {followups.length === 0 ? (
                <EmptyState icon={Inbox} title="Nothing to follow up on." />
              ) : (
                followups.slice(0, 8).map((f) => {
                  const cand = candidates.find((c) => c.id === f.candidate_id);
                  const overdue = f.due_date && new Date(f.due_date) < new Date();
                  const tone: Tone = overdue ? "crit" : f.status === "Done" ? "ok" : "warn";
                  return (
                    <div key={f.id} className="p-4 flex items-center gap-4 hover:bg-muted/40 transition">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{f.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{cand ? fullName(cand) : "Unattached"} · {f.owner ?? "—"} · {f.due_date ? `Due ${new Date(f.due_date).toLocaleDateString()}` : "No due date"}</p>
                      </div>
                      <Pill tone={tone}>{f.status === "Done" ? "Done" : overdue ? "Overdue" : "Open"}</Pill>
                    </div>
                  );
                })
              )}
            </Card>
          </div>

          <div>
            <SectionHeader icon={BarChart3} title="Insights" subtitle="Snapshot" />
            <Card className="p-4 space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-2xl font-semibold tracking-tight">{insights.avgDaysInStage}d</p>
                  <p className="text-[11px] text-muted-foreground">Avg in stage</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold tracking-tight">{insights.offerAcceptRate}%</p>
                  <p className="text-[11px] text-muted-foreground">Offer accept</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold tracking-tight">{insights.readyToStaff}</p>
                  <p className="text-[11px] text-muted-foreground">Ready to staff</p>
                </div>
              </div>
              <div className="pt-2 border-t border-border/60">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Top sources</p>
                <ul className="space-y-1.5">
                  {insights.topSources.map(([src, n]) => (
                    <li key={src} className="flex items-center justify-between text-sm">
                      <span className="text-foreground truncate">{src}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">{n}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-2 border-t border-border/60">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Active escalations</p>
                <p className="text-sm">{escalations.filter(e => e.status === "Open").length} open</p>
              </div>
            </Card>
          </div>
        </section>
      </div>
    </OSShell>
  );
}