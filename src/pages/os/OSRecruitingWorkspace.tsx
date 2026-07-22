import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, CalendarClock, FileSignature, GraduationCap,
  Flame, MessageSquare, Sparkles, ChevronRight, Inbox, Filter, X,
  Phone, Send, Eye, UserCheck, CheckCircle2, Clock, AlertTriangle,
  Brain, ChevronDown, UserPlus,
} from "lucide-react";
import { OSShell } from "./OSShell";
import {
  useRecruitingCandidates,
  useRecruitingInterviews,
  useRecruitingOffers,
  useRecruitingFollowups,
  useRecruitingEscalations,
  useRecruitingOnboarding,
  useRecruitingBackgroundChecks,
  useRecruitingOrientation,
  daysInStage,
  fullName,
  type RecruitingCandidate,
} from "@/hooks/useRecruitingCandidates";
import { useSlideout } from "@/hooks/useSlideout";
import { cn } from "@/lib/utils";
import { IntegrationsHubPointer } from "@/components/integrations/IntegrationsHubPointer";
import { useRecruitingActivity, useRecruitingMutations } from "@/hooks/useRecruitingMutations";
import { toast } from "sonner";

type Tone = "ok" | "warn" | "crit";
type QueueKey = "today" | "followup" | "offers" | "onboarding" | "escalation";

function todayLabel() {
  return new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}
function timeLabel(iso?: string | null) {
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
  { key: "today",      label: "Today",       icon: CalendarClock,  tone: "warn" },
  { key: "followup",   label: "Follow-Ups",  icon: MessageSquare,  tone: "warn" },
  { key: "offers",     label: "Offers",      icon: FileSignature,  tone: "warn" },
  { key: "onboarding", label: "Onboarding",  icon: GraduationCap,  tone: "warn" },
  { key: "escalation", label: "Escalations", icon: Flame,          tone: "crit" },
];

function candidateTone(c: RecruitingCandidate): Tone {
  const d = daysInStage(c);
  if (c.pipeline_stage === "On Hold" || d >= 10) return "crit";
  if (d >= 5) return "warn";
  return "ok";
}

export default function OSRecruitingWorkspace() {
  const { candidates } = useRecruitingCandidates();
  const { items: interviews } = useRecruitingInterviews();
  const { items: offers } = useRecruitingOffers();
  const { items: followups, resolve: resolveFollowup } = useRecruitingFollowups();
  const { items: escalations } = useRecruitingEscalations();
  const { items: onboardingTasks } = useRecruitingOnboarding();
  const { items: bgChecks } = useRecruitingBackgroundChecks();
  const { items: orientation } = useRecruitingOrientation();

  const [activeQueue, setActiveQueue] = useState<QueueKey>("today");
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [recruiterFilter, setRecruiterFilter] = useState<string>("all");
  const [selected, setSelected] = useState<RecruitingCandidate | null>(null);

  const byId = useMemo(() => {
    const m = new Map<string, RecruitingCandidate>();
    candidates.forEach((c) => m.set(c.id, c));
    return m;
  }, [candidates]);

  const todayStart = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime();
  }, []);
  const todayEnd = todayStart + 86400000;

  const todayCandidates = useMemo(() => {
    const ids = new Set<string>();
    interviews.forEach((iv) => {
      if (!iv.scheduled_at) return;
      const t = new Date(iv.scheduled_at).getTime();
      if (t >= todayStart && t < todayEnd && iv.status !== "Cancelled") ids.add(iv.candidate_id);
      if (iv.status === "Completed" && !iv.outcome) ids.add(iv.candidate_id);
    });
    return candidates.filter((c) => ids.has(c.id));
  }, [interviews, candidates, todayStart, todayEnd]);

  const offerCandidates = useMemo(() => {
    const ids = new Set<string>();
    offers.forEach((o) => {
      if (["Sent", "Unsigned", "Pending"].includes(o.status)) ids.add(o.candidate_id);
    });
    return candidates.filter((c) => ids.has(c.id));
  }, [offers, candidates]);

  const onboardingCandidates = useMemo(() => {
    return candidates.filter((c) =>
      ["Offer Accepted", "Background Check", "Orientation Scheduled", "Onboarding"].includes(c.pipeline_stage),
    );
  }, [candidates]);

  const followupCandidates = useMemo(() => {
    const ids = new Set<string>();
    followups.forEach((f) => {
      if (f.status === "Done" || !f.candidate_id) return;
      ids.add(f.candidate_id);
    });
    candidates.forEach((c) => {
      if (["New Applicant", "Phone Screen"].includes(c.pipeline_stage)) ids.add(c.id);
    });
    return candidates.filter((c) => ids.has(c.id));
  }, [followups, candidates]);

  const escalationCandidates = useMemo(() => {
    const ids = new Set<string>();
    escalations.forEach((e) => {
      if (e.status === "Resolved" || !e.candidate_id) return;
      ids.add(e.candidate_id);
    });
    bgChecks.forEach((b) => {
      if (["Flagged", "Delayed"].includes(b.status)) ids.add(b.candidate_id);
    });
    candidates.forEach((c) => {
      if (c.pipeline_stage === "On Hold" || daysInStage(c) >= 10) ids.add(c.id);
    });
    return candidates.filter((c) => ids.has(c.id));
  }, [escalations, bgChecks, candidates]);

  const buckets: Record<QueueKey, RecruitingCandidate[]> = useMemo(() => ({
    today: todayCandidates,
    followup: followupCandidates,
    offers: offerCandidates,
    onboarding: onboardingCandidates,
    escalation: escalationCandidates,
  }), [todayCandidates, followupCandidates, offerCandidates, onboardingCandidates, escalationCandidates]);

  const states = useMemo(() => Array.from(new Set(candidates.map((c) => c.state))).sort(), [candidates]);
  const recruiters = useMemo(
    () => Array.from(new Set(candidates.map((c) => c.recruiter).filter(Boolean) as string[])).sort(),
    [candidates],
  );

  const feed = useMemo(() => {
    const list = buckets[activeQueue];
    const q = query.trim().toLowerCase();
    return list.filter((c) => {
      if (stateFilter !== "all" && c.state !== stateFilter) return false;
      if (roleFilter !== "all" && c.role !== roleFilter) return false;
      if (recruiterFilter !== "all" && c.recruiter !== recruiterFilter) return false;
      if (q) {
        const name = fullName(c).toLowerCase();
        if (!name.includes(q) && !(c.recruiter ?? "").toLowerCase().includes(q) && !(c.city ?? "").toLowerCase().includes(q)) return false;
      }
      return true;
    }).sort((a, b) => daysInStage(b) - daysInStage(a));
  }, [buckets, activeQueue, query, stateFilter, roleFilter, recruiterFilter]);

  const priorities = useMemo(() => {
    const seen = new Set<string>();
    const out: RecruitingCandidate[] = [];
    [...escalationCandidates, ...todayCandidates, ...offerCandidates].forEach((c) => {
      if (seen.has(c.id)) return;
      seen.add(c.id);
      out.push(c);
    });
    return out.slice(0, 6);
  }, [escalationCandidates, todayCandidates, offerCandidates]);

  const recruiterLoad = useMemo(() => {
    const activeIds = new Set<string>([
      ...todayCandidates.map((c) => c.id),
      ...followupCandidates.map((c) => c.id),
      ...offerCandidates.map((c) => c.id),
      ...onboardingCandidates.map((c) => c.id),
      ...escalationCandidates.map((c) => c.id),
    ]);
    const m = new Map<string, number>();
    candidates.forEach((c) => {
      if (!c.recruiter || !activeIds.has(c.id)) return;
      m.set(c.recruiter, (m.get(c.recruiter) ?? 0) + 1);
    });
    return Array.from(m.entries())
      .map(([recruiter, count]) => ({ recruiter, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [candidates, todayCandidates, followupCandidates, offerCandidates, onboardingCandidates, escalationCandidates]);

  const workloadCount = new Set([
    ...todayCandidates, ...followupCandidates, ...offerCandidates, ...onboardingCandidates, ...escalationCandidates,
  ].map((c) => c.id)).size;

  const offersByCandidate = useMemo(() => {
    const m = new Map<string, typeof offers[number]>();
    offers.forEach((o) => { if (!m.has(o.candidate_id)) m.set(o.candidate_id, o); });
    return m;
  }, [offers]);

  const nextInterviewByCandidate = useMemo(() => {
    const m = new Map<string, typeof interviews[number]>();
    interviews.forEach((iv) => {
      if (!iv.scheduled_at) return;
      const cur = m.get(iv.candidate_id);
      if (!cur || new Date(iv.scheduled_at) > new Date(cur.scheduled_at!)) m.set(iv.candidate_id, iv);
    });
    return m;
  }, [interviews]);

  function nextActionFor(c: RecruitingCandidate, key: QueueKey): string {
    if (key === "today") {
      const iv = nextInterviewByCandidate.get(c.id);
      if (iv?.status === "Completed" && !iv.outcome) return "Enter interview outcome";
      if (iv?.scheduled_at) return `Interview ${timeLabel(iv.scheduled_at)}`;
    }
    if (key === "offers") {
      const o = offersByCandidate.get(c.id);
      if (o?.status === "Unsigned") return "Follow up on unsigned offer";
      if (o?.status === "Sent") return "Track signature";
    }
    if (key === "escalation") {
      const esc = escalations.find((e) => e.candidate_id === c.id && e.status !== "Resolved");
      if (esc) return esc.title;
      const bg = bgChecks.find((b) => b.candidate_id === c.id && ["Flagged", "Delayed"].includes(b.status));
      if (bg) return `Background ${bg.status}${bg.blocker ? ` — ${bg.blocker}` : ""}`;
    }
    if (key === "followup") {
      const f = followups.find((x) => x.candidate_id === c.id && x.status !== "Done");
      if (f) return f.title;
    }
    return c.next_action ?? `Stage: ${c.pipeline_stage}`;
  }

  return (
    <OSShell>
      <div className="mx-auto w-full max-w-[1500px] px-4 md:px-8 pb-24 pt-6 md:pt-10 space-y-6">
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
                options={[{ v: "all", l: "All roles" }, { v: "RBT", l: "RBT" }, { v: "BCBA", l: "BCBA" }, { v: "BT", l: "BT" }]} />
              <FilterSelect icon={UserPlus} value={recruiterFilter} onChange={setRecruiterFilter}
                options={[{ v: "all", l: "All recruiters" }, ...recruiters.map((r) => ({ v: r, l: r }))]} />
            </div>
          </div>
        </header>

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
                  active ? "bg-foreground text-background border-foreground" : "bg-card border-border/70 text-foreground hover:bg-muted/40",
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

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          <div className="space-y-3 min-w-0">
            {feed.length === 0 ? (
              <Card><EmptyState icon={CheckCircle2} title="You're all caught up on this queue." /></Card>
            ) : feed.map((c) => {
              const tone = candidateTone(c);
              const next = nextActionFor(c, activeQueue);
              const d = daysInStage(c);
              return (
                <Card key={c.id} className="p-4 hover:bg-muted/20 transition cursor-pointer">
                  <button onClick={() => setSelected(c)} className="w-full text-left">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 text-primary grid place-items-center text-sm font-semibold shrink-0">
                        {initials(fullName(c))}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground truncate">{fullName(c)}</h3>
                          <Pill tone="ok">{c.role}</Pill>
                          <span className="text-xs text-muted-foreground">{c.state}{c.city ? ` · ${c.city}` : ""}</span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground truncate">{next}</p>
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <Pill tone={tone}><Clock className="h-3 w-3" />{d}d in stage</Pill>
                          <span className="text-[11px] text-muted-foreground">· {c.pipeline_stage}</span>
                          {c.recruiter && <span className="text-[11px] text-muted-foreground">· {c.recruiter}</span>}
                          {c.source && (
                            <span className="text-[10px] uppercase font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded">{c.source}</span>
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

          <aside className="space-y-4">
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
                          <span className="text-sm font-medium text-foreground truncate">{fullName(c)}</span>
                          <span className="text-[10px] text-muted-foreground shrink-0">{daysInStage(c)}d</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">{c.next_action ?? c.pipeline_stage}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

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

            <Card className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3 inline-flex items-center gap-1.5">
                <Brain className="h-3.5 w-3.5 text-primary" /> Operational Insights
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

            <IntegrationsHubPointer
              scope="Recruiting"
              description="Apploi, Outlook, and Viventium connection state now lives in Admin → Integrations so every department sees the same readiness signals."
            />

            <RecruitingActivityCard />
          </aside>
        </div>
      </div>

      <CandidateSlideout
        candidate={selected}
        onClose={() => setSelected(null)}
        interview={selected ? nextInterviewByCandidate.get(selected.id) : undefined}
        offer={selected ? offersByCandidate.get(selected.id) : undefined}
        bgCheck={selected ? bgChecks.find((b) => b.candidate_id === selected.id) : undefined}
        orientationSlot={selected ? orientation.find((o) => o.candidate_id === selected.id) : undefined}
        onboardingTasks={selected ? onboardingTasks.filter((t) => t.candidate_id === selected.id) : []}
        followups={selected ? followups.filter((f) => f.candidate_id === selected.id && f.status !== "Done") : []}
      />
    </OSShell>
  );
}

function RecruitingActivityCard() {
  const { items, loading } = useRecruitingActivity(undefined, 12);
  return (
    <Card className="p-5">
      <div className="mb-3">
        <h3 className="text-base font-semibold">Recent activity</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Live audit trail of recruiting workflow events.</p>
      </div>
      {loading ? (
        <div className="text-xs text-muted-foreground">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-xs text-muted-foreground">No activity yet.</div>
      ) : (
        <ul className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
          {items.map((e) => (
            <li key={e.id} className="text-[11.5px] leading-snug flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/70 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="font-medium text-foreground">
                  {e.event_type === "stage_change"
                    ? `Stage: ${e.from_value ?? "—"} → ${e.to_value ?? "—"}`
                    : `${e.event_type} · ${e.entity_table.replace("recruiting_", "")}`}
                </span>
                <span className="block text-muted-foreground">
                  {new Date(e.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

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

function CandidateSlideout({
  candidate, onClose, interview, offer, bgCheck, orientationSlot, onboardingTasks, followups,
}: {
  candidate: RecruitingCandidate | null;
  onClose: () => void;
  interview?: any;
  offer?: any;
  bgCheck?: any;
  orientationSlot?: any;
  onboardingTasks: any[];
  followups: any[];
}) {
  useSlideout(!!candidate, onClose);
  if (!candidate) return null;
  const c = candidate;
  const tone = candidateTone(c);
  const d = daysInStage(c);
  const completedTasks = onboardingTasks.filter((t) => t.completed).length;
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-foreground/10 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-background border-l border-border shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-background/95 backdrop-blur border-b border-border px-5 py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold text-foreground truncate">{fullName(c)}</h2>
              <Pill tone="ok">{c.role}</Pill>
              <Pill tone={tone}>{c.pipeline_stage}</Pill>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{c.state}{c.city ? ` · ${c.city}` : ""}</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full hover:bg-muted grid place-items-center">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <section>
            <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Next action</h3>
            <p className="text-sm text-foreground">{c.next_action ?? `Continue ${c.pipeline_stage}`}</p>
          </section>

          <div className="grid grid-cols-2 gap-2">
            <WorkspaceQuickActions candidate={c} />
          </div>

          <section className="space-y-2">
            <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground">Pipeline status</h3>
            <Row label="Stage" value={c.pipeline_stage} />
            <Row label="Days in stage" value={`${d}d`} />
            <Row label="Interview" value={interview ? `${interview.status}${interview.scheduled_at ? ` · ${timeLabel(interview.scheduled_at)}` : ""}` : "—"} />
            <Row label="Offer" value={offer ? offer.status : "—"} />
            <Row label="Background" value={bgCheck ? bgCheck.status : "—"} />
            <Row label="Orientation" value={orientationSlot ? `${orientationSlot.status}${orientationSlot.scheduled_date ? ` · ${orientationSlot.scheduled_date}` : ""}` : "—"} />
            <Row label="Onboarding tasks" value={onboardingTasks.length ? `${completedTasks} / ${onboardingTasks.length}` : "—"} />
          </section>

          {followups.length > 0 && (
            <section>
              <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 inline-flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3 text-amber-500" /> Open follow-ups
              </h3>
              <ul className="space-y-1.5">
                {followups.map((f) => (
                  <li key={f.id} className="text-sm text-foreground bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                    <span className="truncate">{f.title}</span>
                    {f.due_date && <span className="text-[11px] text-muted-foreground shrink-0">{f.due_date}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {onboardingTasks.length > 0 && (
            <section>
              <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Onboarding tasks</h3>
              <ul className="space-y-1.5">
                {onboardingTasks.slice(0, 8).map((t) => (
                  <li key={t.id} className="flex items-center justify-between text-sm border border-border/60 rounded-lg px-3 py-2">
                    <span className={cn("text-foreground", t.completed && "line-through text-muted-foreground")}>{t.title}</span>
                    {t.category && <span className="text-[11px] text-muted-foreground">{t.category}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="grid grid-cols-2 gap-3 text-xs">
            <Meta label="Recruiter" value={c.recruiter ?? "—"} />
            <Meta label="Source" value={c.source ?? "—"} />
            <Meta label="Applied" value={c.applied_date} />
            <Meta label="Email" value={c.email ?? "—"} />
            <Meta label="Phone" value={c.phone ?? "—"} />
            <Meta label="Rating" value={c.rating ? `${c.rating}/5` : "—"} />
          </section>
          {c.notes && (
            <section>
              <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Notes</h3>
              <p className="text-sm text-foreground whitespace-pre-wrap">{c.notes}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-medium text-right truncate ml-2">{value}</span>
    </div>
  );
}
function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-foreground mt-0.5 break-words">{value}</p>
    </div>
  );
}
function QuickAction({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick?: () => void }) {
  const disabled = !onClick;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? "Not available" : undefined}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 h-9 rounded-xl border border-border/70 bg-card text-xs font-medium text-foreground hover:bg-muted/40 transition",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
      {label}
    </button>
  );
}

function WorkspaceQuickActions({ candidate }: { candidate: RecruitingCandidate }) {
  const mut = useRecruitingMutations();
  const log = async (kind: string, extra?: Record<string, unknown>) => {
    await mut.logActivity(candidate.id, "recruiting_candidates", candidate.id, kind, null, null, extra);
    toast.success(`Logged: ${kind.replace(/_/g, " ")}`);
  };
  return (
    <>
      <QuickAction icon={Send} label="Message" onClick={() => {
        const email = (candidate as any).email;
        if (email) window.location.href = `mailto:${email}`;
        void log("message_sent");
      }} />
      <QuickAction icon={Phone} label="Call" onClick={() => {
        const phone = (candidate as any).phone;
        if (phone) window.location.href = `tel:${phone}`;
        void log("call_placed");
      }} />
      <QuickAction icon={CalendarClock} label="Schedule" onClick={() => log("schedule_requested")} />
      <QuickAction icon={Eye} label="Open profile" onClick={() => log("profile_opened")} />
    </>
  );
}
