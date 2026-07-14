import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, ClipboardCheck, FileWarning, MessageSquare, CalendarClock,
  Flame, ChevronRight, Sparkles, ShieldCheck, CheckCircle2, Send,
  ExternalLink, StickyNote, UserCheck, Brain, Clock, ChevronDown,
  ChevronUp, Inbox, FileSignature, ScrollText, AlertTriangle, Eye, Filter,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { useLiveAuthorizations } from "@/hooks/useLiveAuthorizations";
import type { Authorization } from "@/data/authorizations";
import { QAActionsPanel } from "@/components/qa/QAActionsPanel";
import { cn } from "@/lib/utils";

// QA Workspace — operational execution hub.
// Real data only via useLiveAuthorizations (monday_authorizations_raw).

type Tone = "ok" | "warn" | "crit";
type QueueKey = "review" | "missing" | "followup" | "expiring" | "escalation";

function todayLabel() {
  return new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}
function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return null;
  return Math.ceil((d - Date.now()) / 86_400_000);
}
function relTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.round(ms / 60_000);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
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
    )}>
      {children}
    </div>
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
    <div className="flex flex-col items-center justify-center text-center py-8 px-6">
      <div className="h-9 w-9 rounded-full bg-muted grid place-items-center mb-2">
        <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
      </div>
      <p className="text-sm text-muted-foreground">{title}</p>
    </div>
  );
}

const QUEUE_DEFS: { key: QueueKey; label: string; icon: React.ElementType; tone: Tone }[] = [
  { key: "review",     label: "Needs Review",       icon: ClipboardCheck, tone: "warn" },
  { key: "missing",    label: "Missing Information",icon: FileWarning,    tone: "warn" },
  { key: "followup",   label: "Follow-Ups Needed",  icon: MessageSquare,  tone: "warn" },
  { key: "expiring",   label: "Expiring Soon",      icon: CalendarClock,  tone: "warn" },
  { key: "escalation", label: "Escalations",        icon: Flame,          tone: "crit" },
];

function classifyAuth(a: Authorization): QueueKey | null {
  // Escalations: highest precedence
  if (
    a.stage === "Denied" ||
    (a.stage === "Expiring Soon" && (daysUntil(a.expirationDate) ?? 999) <= 14) ||
    (a.daysInStage > 10 && (a.stage === "In QA Review" || a.stage === "Awaiting Submission"))
  ) return "escalation";

  if (a.missingInfo) return "missing";
  if (a.stage === "In QA Review") return "review";

  const d = daysUntil(a.expirationDate);
  if (d !== null && d >= 0 && d <= 90 && a.stage !== "Approved") return "expiring";

  if (a.stage === "Awaiting Submission" && a.daysInStage > 3) return "followup";
  return null;
}

function workflowLabel(a: Authorization): string {
  if (a.stage === "In QA Review") return a.authType === "Reauth" ? "Treatment Plan Review" : "Authorization Review";
  if (a.missingInfo) return "Missing Documentation";
  if (a.stage === "Awaiting Submission") return "Ready for Submission";
  if (a.stage === "Expiring Soon") return "Expiring Authorization";
  if (a.stage === "Denied") return "Escalated Review";
  return "Progress Report Collection";
}

function stageTone(a: Authorization): Tone {
  if (a.stage === "Denied") return "crit";
  if (a.riskLevel === "High") return "crit";
  if (a.riskLevel === "Medium") return "warn";
  return "ok";
}

export default function OSQAWorkspace() {
  const { qaItems: items, loading, refresh, sourceById } = useLiveAuthorizations();
  const [activeQueue, setActiveQueue] = useState<QueueKey>("review");
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Classify all items into queues
  const buckets = useMemo(() => {
    const b: Record<QueueKey, Authorization[]> = {
      review: [], missing: [], followup: [], expiring: [], escalation: [],
    };
    items.forEach(a => {
      const k = classifyAuth(a);
      if (k) b[k].push(a);
    });
    Object.keys(b).forEach(k => {
      b[k as QueueKey].sort((a, x) => {
        const rank = (y: Authorization) =>
          (y.riskLevel === "High" ? 3 : y.riskLevel === "Medium" ? 2 : 1);
        return rank(x) - rank(a) || x.daysInStage - a.daysInStage;
      });
    });
    return b;
  }, [items]);

  // Filter active queue
  const states = useMemo(() => {
    const s = new Set<string>();
    items.forEach(a => a.state && s.add(a.state));
    return Array.from(s).sort();
  }, [items]);

  const feed = useMemo(() => {
    const list = buckets[activeQueue];
    const q = query.trim().toLowerCase();
    return list.filter(a => {
      if (stateFilter !== "all" && a.state !== stateFilter) return false;
      if (urgencyFilter !== "all" && a.riskLevel.toLowerCase() !== urgencyFilter) return false;
      if (q && !(
        a.clientName.toLowerCase().includes(q) ||
        a.payor.toLowerCase().includes(q) ||
        (a.qaOwner ?? "").toLowerCase().includes(q) ||
        a.stage.toLowerCase().includes(q) ||
        a.state.toLowerCase().includes(q)
      )) return false;
      return true;
    });
  }, [buckets, activeQueue, query, stateFilter, urgencyFilter]);

  // Sidebar — Today's Priorities (cross-queue)
  const priorities = useMemo(() => {
    return [
      ...buckets.escalation.slice(0, 3),
      ...buckets.expiring.filter(a => (daysUntil(a.expirationDate) ?? 999) <= 30).slice(0, 3),
      ...buckets.review.filter(a => a.daysInStage > 5).slice(0, 2),
    ].slice(0, 6);
  }, [buckets]);

  // BCBA follow-up tracker
  const bcbaFollowups = useMemo(() => {
    const need = [...buckets.missing, ...buckets.followup, ...buckets.escalation];
    const grouped = new Map<string, { bcba: string; client: string; reason: string; days: number; level: Tone; id: string }>();
    need.forEach(a => {
      const bcba = a.coordinator;
      if (!bcba || bcba === "Unassigned") return;
      const key = `${bcba}-${a.id}`;
      if (grouped.has(key)) return;
      const level: Tone = a.daysInStage > 7 ? "crit" : a.daysInStage > 3 ? "warn" : "ok";
      grouped.set(key, {
        bcba,
        client: a.clientName,
        reason: a.missingInfo ? "Missing info" : a.stage,
        days: a.daysInStage,
        level,
        id: a.id,
      });
    });
    return Array.from(grouped.values())
      .sort((a, b) => b.days - a.days)
      .slice(0, 6);
  }, [buckets]);

  const workloadCount = items.filter(a =>
    a.stage === "In QA Review" || a.stage === "Awaiting Submission" || a.missingInfo,
  ).length;

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <OSShell>
      <div className="mx-auto w-full max-w-[1500px] px-4 md:px-8 pb-24 pt-6 md:pt-10 space-y-6">

        {/* HEADER */}
        <header>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{todayLabel()}</p>
              <h1 className="mt-1 text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
                QA Workspace
              </h1>
              <p className="mt-1.5 text-[15px] text-muted-foreground max-w-2xl">
                Manage reviews, blockers, follow-ups, and operational QA workflows.
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
                onChange={e => setQuery(e.target.value)}
                placeholder="Search clients, workflows, authorizations, BCBAs, or statuses..."
                className="w-full h-11 rounded-xl bg-muted/60 border border-border pl-11 pr-4 text-[15px] placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={stateFilter}
                onChange={e => setStateFilter(e.target.value)}
                className="h-11 rounded-xl bg-muted/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All states</option>
                {states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                value={urgencyFilter}
                onChange={e => setUrgencyFilter(e.target.value)}
                className="h-11 rounded-xl bg-muted/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All urgency</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </header>

        {/* WORKSPACE GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_300px] gap-6">

          {/* LEFT — QUEUES */}
          <aside className="space-y-2 lg:sticky lg:top-6 lg:self-start">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground px-2 mb-2">
              Work queues
            </div>
            {QUEUE_DEFS.map(q => {
              const count = buckets[q.key].length;
              const isActive = activeQueue === q.key;
              const oldest = buckets[q.key][0]?.daysInStage ?? 0;
              const Icon = q.icon;
              return (
                <button
                  key={q.key}
                  onClick={() => setActiveQueue(q.key)}
                  className={cn(
                    "w-full text-left rounded-xl border p-3 transition-all duration-200",
                    isActive
                      ? "border-primary/30 bg-primary/5 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset]"
                      : "border-border/60 bg-card hover:border-border hover:-translate-y-0.5",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={cn(
                        "h-7 w-7 rounded-lg grid place-items-center border shrink-0",
                        isActive ? "bg-primary/10 text-primary border-primary/20" : toneClasses(q.tone),
                      )}>
                        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </div>
                      <span className={cn(
                        "text-sm font-medium truncate",
                        isActive ? "text-foreground" : "text-foreground",
                      )}>{q.label}</span>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-foreground">{count}</span>
                  </div>
                  {count > 0 && (
                    <div className="mt-2 text-[11px] text-muted-foreground pl-9">
                      Oldest {oldest}d
                    </div>
                  )}
                </button>
              );
            })}

            {/* Quick actions */}
            <div className="pt-4">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground px-2 mb-2">
                Quick actions
              </div>
              <div className="space-y-1">
                {[
                  { label: "Open QA Queue", icon: Inbox, to: "/qa-queue" },
                  { label: "Open Missing Info", icon: FileWarning, to: "/missing-information" },
                  { label: "Send Follow-Ups", icon: Send, to: "/qa-messages" },
                  { label: "Open Escalations", icon: Flame, to: "/escalations-followups" },
                  { label: "View Expiring Items", icon: CalendarClock, to: "/expiring-items" },
                  { label: "Open Progress Reports", icon: ScrollText, to: "/reports" },
                ].map(a => (
                  <Link key={a.label} to={a.to}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition">
                    <a.icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                    {a.label}
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          {/* CENTER — FEED */}
          <main>
            <div className="flex items-center justify-between mb-3 px-1">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  {QUEUE_DEFS.find(q => q.key === activeQueue)?.label}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {feed.length} {feed.length === 1 ? "workflow" : "workflows"}
                  {(stateFilter !== "all" || urgencyFilter !== "all" || query) && " (filtered)"}
                </p>
              </div>
              <Link to="/qa-queue" className="text-xs font-medium text-primary hover:opacity-80 transition inline-flex items-center gap-1">
                Full queue <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1,2,3,4].map(i => <Card key={i} className="p-5"><div className="h-16 rounded-lg bg-muted animate-pulse" /></Card>)}
              </div>
            ) : feed.length === 0 ? (
              <Card>
                <EmptyState
                  icon={CheckCircle2}
                  title={
                    activeQueue === "missing"    ? "No blocked workflows right now." :
                    activeQueue === "escalation" ? "No urgent escalations today." :
                    activeQueue === "expiring"   ? "No expiring items in this range." :
                    activeQueue === "followup"   ? "No follow-ups needed right now." :
                                                   "Nothing in this queue. You're caught up."
                  }
                />
              </Card>
            ) : (
              <div className="space-y-3">
                {feed.map(a => {
                  const tone = stageTone(a);
                  const due = daysUntil(a.nextTaskDue);
                  const exp = daysUntil(a.expirationDate);
                  const isOpen = expanded.has(a.id);
                  return (
                    <Card key={a.id} className="overflow-hidden">
                      <button
                        onClick={() => toggleExpand(a.id)}
                        className="w-full text-left p-5 hover:bg-muted/30 transition"
                      >
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            "h-10 w-10 rounded-xl grid place-items-center border shrink-0",
                            toneClasses(tone),
                          )}>
                            <FileSignature className="h-4.5 w-4.5" strokeWidth={1.75} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[15px] font-semibold text-foreground truncate">{a.clientName}</span>
                              <span className="text-xs text-muted-foreground">·</span>
                              <span className="text-xs text-muted-foreground">{workflowLabel(a)}</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 truncate">
                              {a.payor} · {a.state} · {a.stage}
                            </div>
                            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                              <Pill tone={tone}>{a.riskLevel} urgency</Pill>
                              {a.missingInfo && <Pill tone="warn">Missing info</Pill>}
                              {exp !== null && exp <= 30 && exp >= 0 && (
                                <Pill tone={exp <= 14 ? "crit" : "warn"}>Exp in {exp}d</Pill>
                              )}
                              <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                                <UserCheck className="h-3 w-3" /> QA: {a.qaOwner ?? a.coordinator}
                              </span>
                              {due !== null && (
                                <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {due < 0 ? `${Math.abs(due)}d overdue` : due === 0 ? "Due today" : `Due in ${due}d`}
                                </span>
                              )}
                              <span className="text-[11px] text-muted-foreground">· Updated {relTime(a.lastActivity)} ago</span>
                            </div>
                          </div>
                          {isOpen
                            ? <ChevronUp className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                            : <ChevronDown className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="border-t border-border/60 bg-muted/30 p-5 space-y-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                            <div>
                              <div className="text-muted-foreground">BCBA</div>
                              <div className="text-foreground font-medium mt-0.5">{a.coordinator}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Days in stage</div>
                              <div className="text-foreground font-medium mt-0.5">{a.daysInStage}d</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Auth type</div>
                              <div className="text-foreground font-medium mt-0.5">{a.authType}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Expires</div>
                              <div className="text-foreground font-medium mt-0.5">{a.expirationDate ?? "—"}</div>
                            </div>
                          </div>

                          <div className="text-xs">
                            <div className="text-muted-foreground mb-1">Next action</div>
                            <div className="text-foreground">{a.nextAction}</div>
                            {a.denialReason && (
                              <div className="mt-2 text-destructive">Denial: {a.denialReason}</div>
                            )}
                            {a.missingRequirements.length > 0 && (
                              <div className="mt-2 text-muted-foreground">
                                Blockers: {a.missingRequirements.join(", ")}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-wrap pt-1">
                            <Link to="/qa-queue"
                              className="h-8 px-3 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 transition inline-flex items-center gap-1.5">
                              <ExternalLink className="h-3 w-3" /> Open record
                            </Link>
                          </div>
                          <QAActionsPanel
                            auth={a}
                            variant={a.missingInfo ? "missing-info" : "default"}
                            sourceSystem={sourceById?.get(a.id) ?? "monday"}
                            onChanged={refresh}
                          />
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </main>

          {/* RIGHT — SIDEBAR */}
          <aside className="space-y-5">

            {/* Today's Priorities */}
            <section>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground px-2 mb-2">
                Today's priorities
              </div>
              <Card>
                {priorities.length === 0 ? (
                  <EmptyState icon={CheckCircle2} title="No urgent priorities." />
                ) : (
                  <ul className="divide-y divide-border/60">
                    {priorities.map(a => {
                      const tone = stageTone(a);
                      const exp = daysUntil(a.expirationDate);
                      return (
                        <li key={a.id} className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">{a.clientName}</div>
                              <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                {workflowLabel(a)} · {a.state}
                              </div>
                            </div>
                            <Pill tone={tone}>
                              {a.stage === "Denied" ? "Denied" :
                               exp !== null && exp <= 14 ? `${exp}d` :
                               a.daysInStage > 7 ? `${a.daysInStage}d` :
                               "Action"}
                            </Pill>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            </section>

            {/* BCBA Follow-Up Tracker */}
            <section>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground px-2 mb-2">
                BCBA follow-up tracker
              </div>
              <Card>
                {bcbaFollowups.length === 0 ? (
                  <EmptyState icon={CheckCircle2} title="All BCBAs are responsive." />
                ) : (
                  <ul className="divide-y divide-border/60">
                    {bcbaFollowups.map(f => (
                      <li key={f.id} className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">{f.bcba}</div>
                            <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                              {f.client} · {f.reason}
                            </div>
                          </div>
                          <Pill tone={f.level}>{f.days}d</Pill>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </section>

            {/* Operational Insights */}
            <section>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground px-2 mb-2">
                Operational Insights
              </div>
              <Card className="p-4 bg-gradient-to-br from-primary/5 via-card to-card">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary grid place-items-center">
                    <Brain className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </div>
                  <div className="text-xs text-muted-foreground">QA operational copilot</div>
                </div>
                <div className="space-y-1">
                  {[
                    "What needs attention first?",
                    "Which workflows are blocked?",
                    "What is overdue?",
                    "Which authorizations are expiring?",
                    "Show unresolved escalations.",
                    "Which BCBAs need follow-up?",
                  ].map(p => (
                    <Link key={p} to={`/ai/assistant?q=${encodeURIComponent(p)}`}
                      className="block text-[12px] px-2.5 py-1.5 rounded-lg bg-muted/60 hover:bg-muted transition text-foreground">
                      <Sparkles className="h-3 w-3 inline mr-1.5 text-primary" strokeWidth={2} />
                      {p}
                    </Link>
                  ))}
                </div>
              </Card>
            </section>
          </aside>
        </div>
      </div>
    </OSShell>
  );
}
