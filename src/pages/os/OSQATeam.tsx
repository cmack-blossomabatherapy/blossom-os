import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search, ClipboardCheck, FileWarning, CalendarClock, AlertTriangle,
  Flame, ChevronRight, Sparkles, ShieldCheck, CheckCircle2, Send,
  ExternalLink, MessageSquare, FileSignature, ScrollText, Clock, Brain, X,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { StateDirectorSnapshotBanner } from "@/components/stateDirector/StateDirectorSnapshotBanner";
import { useAuth } from "@/contexts/AuthContext";
import { useLiveAuthorizations } from "@/hooks/useLiveAuthorizations";
import { QAActionsPanel } from "@/components/qa/QAActionsPanel";
import { useSlideout } from "@/hooks/useSlideout";
import type { Authorization } from "@/data/authorizations";
import { cn } from "@/lib/utils";

// QA / Compliance — operational awareness dashboard.
// Real data only: sourced from monday_authorizations_raw via useLiveAuthorizations.

const QA_TEAM = [
  "Rochel Walzman",
  "Amanda Avalos",
  "Julianne Rodriguez",
  "Anje Grobler",
  "Raizy Folger",
  "Rebecca Bailey",
];

// Progress Report escalation thresholds (weeks until expiration)
const PR_OUTREACH_GA = 9;        // Rivky Weissman starts outreach
const PR_ESCALATION_WEEKS = 6;   // SD / Shira+Rachel loop-in

function todayLabel() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric",
  });
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
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

type Tone = "ok" | "warn" | "crit";

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

function SectionHeader({
  title, hint, action,
}: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 px-1 mb-3">
      <div>
        <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

function PriorityCard({
  icon: Icon, label, count, hint, tone, to,
}: {
  icon: React.ElementType; label: string; count: number; hint: string;
  tone: Tone; to: string;
}) {
  return (
    <Link to={to} className="group">
      <Card className="p-5 h-full transition-all duration-300 hover:-translate-y-0.5 hover:border-border">
        <div className="flex items-start justify-between">
          <div className={cn("h-10 w-10 rounded-xl grid place-items-center border", toneClasses(tone))}>
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
        </div>
        <div className="mt-4">
          <div className="text-3xl font-semibold tracking-tight text-foreground tabular-nums">
            {count}
          </div>
          <div className="text-sm font-medium text-foreground mt-0.5">{label}</div>
          <div className="text-xs text-muted-foreground mt-1">{hint}</div>
        </div>
      </Card>
    </Link>
  );
}

function StatusPill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border",
      toneClasses(tone),
    )}>
      {children}
    </span>
  );
}

function EmptyState({ icon: Icon, title, hint }: { icon: React.ElementType; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-6">
      <div className="h-10 w-10 rounded-full bg-muted grid place-items-center mb-3">
        <Icon className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1 max-w-xs">{hint}</p>}
    </div>
  );
}

export default function OSQATeam() {
  const { user } = useAuth();
  const { qaItems: items, loading, refresh, sourceById } = useLiveAuthorizations();
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const openAuth = useMemo(() => items.find(a => a.id === openId) ?? null, [items, openId]);

  const data = useMemo(() => {
    const all = items;

    const needsReview = all.filter(a => a.stage === "In QA Review");
    const missingInfo = all.filter(a => a.missingInfo);
    const expiringSoon = all.filter(a => {
      const d = daysUntil(a.expirationDate);
      return d !== null && d >= 0 && d <= 90;
    });
    const overdue = all.filter(a => {
      // Active workflow with no movement >5d, or stuck in QA/Awaiting >5d
      const active = a.stage === "In QA Review" || a.stage === "Awaiting Submission";
      return active && a.daysInStage > 5;
    });
    const escalations = all.filter(a =>
      a.stage === "Denied" ||
      (a.stage === "Expiring Soon" && (daysUntil(a.expirationDate) ?? 999) <= 14) ||
      (a.daysInStage > 10 && (a.stage === "In QA Review" || a.stage === "Awaiting Submission")),
    );

    // Priorities: highest-risk active QA items
    const priorities = [...all]
      .filter(a => a.stage === "In QA Review" || a.stage === "Awaiting Submission" || a.missingInfo)
      .sort((a, b) => {
        const rank = (x: Authorization) =>
          (x.riskLevel === "High" ? 3 : x.riskLevel === "Medium" ? 2 : 1) +
          (x.missingInfo ? 1 : 0);
        return rank(b) - rank(a) || b.daysInStage - a.daysInStage;
      })
      .slice(0, 10);

    // Blocked = missingInfo or stalled awaiting submission
    const blocked = all
      .filter(a => a.missingInfo || (a.stage === "Awaiting Submission" && a.daysInStage > 3))
      .sort((a, b) => b.daysInStage - a.daysInStage)
      .slice(0, 6);

    const expiringBuckets = {
      d30:  expiringSoon.filter(a => (daysUntil(a.expirationDate) ?? 999) <= 30),
      d60:  expiringSoon.filter(a => { const d = daysUntil(a.expirationDate) ?? 999; return d > 30 && d <= 60; }),
      d90:  expiringSoon.filter(a => { const d = daysUntil(a.expirationDate) ?? 999; return d > 60 && d <= 90; }),
    };

    // Progress report watchlist: items expiring soon -> weeks until PR-style deadline
    const prWatch = expiringSoon
      .map(a => {
        const days = daysUntil(a.expirationDate) ?? 0;
        const weeks = Math.ceil(days / 7);
        let escalation: { tone: Tone; label: string; owner: string };
        if (weeks <= PR_ESCALATION_WEEKS) {
          escalation = {
            tone: "crit",
            label: "State Director escalation",
            owner: a.state.startsWith("GA") ? "Shira / Rachel" : "Julianne / State Dir",
          };
        } else if (weeks <= PR_OUTREACH_GA) {
          escalation = {
            tone: "warn",
            label: "Outreach window",
            owner: a.state.startsWith("GA") ? "Rivky Weissman" : "Rikki Wallach",
          };
        } else {
          escalation = { tone: "ok", label: "Tracking", owner: a.qaOwner ?? a.coordinator };
        }
        return { auth: a, weeks, escalation };
      })
      .sort((a, b) => a.weeks - b.weeks)
      .slice(0, 8);

    // Workload by QA owner (real)
    const ownerStats = new Map<string, { open: number; overdue: number; blocked: number }>();
    QA_TEAM.forEach(n => ownerStats.set(n, { open: 0, overdue: 0, blocked: 0 }));
    all.forEach(a => {
      const owner = a.qaOwner ?? a.coordinator;
      if (!owner) return;
      // Match by first name / contains
      const match = QA_TEAM.find(n =>
        owner.toLowerCase().includes(n.split(" ")[0].toLowerCase()),
      );
      if (!match) return;
      const s = ownerStats.get(match)!;
      if (a.stage === "In QA Review" || a.stage === "Awaiting Submission") s.open++;
      if (a.daysInStage > 5 && (a.stage === "In QA Review" || a.stage === "Awaiting Submission")) s.overdue++;
      if (a.missingInfo) s.blocked++;
    });

    // Recent activity: most-recent lastActivity events
    const activity = [...all]
      .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
      .slice(0, 8)
      .map(a => ({
        id: a.id,
        ts: a.lastActivity,
        client: a.clientName,
        owner: a.qaOwner ?? a.coordinator,
        action:
          a.stage === "Approved"           ? "Authorization approved" :
          a.stage === "Denied"             ? "Denial received" :
          a.stage === "Submitted"          ? "Submitted to payor" :
          a.stage === "In QA Review"       ? "QA review in progress" :
          a.stage === "Expiring Soon"      ? "Flagged expiring" :
          a.stage === "Awaiting Submission"? "Awaiting submission" :
          "Status updated",
        workflow: a.authType,
      }));

    return {
      counts: {
        needsReview: needsReview.length,
        missingInfo: missingInfo.length,
        expiringSoon: expiringSoon.length,
        overdue: overdue.length,
        escalations: escalations.length,
      },
      priorities, blocked, expiringBuckets, prWatch, ownerStats, activity,
    };
  }, [items]);

  // Search across all items
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return items
      .filter(a =>
        a.clientName.toLowerCase().includes(q) ||
        a.payor.toLowerCase().includes(q) ||
        (a.qaOwner ?? "").toLowerCase().includes(q) ||
        a.stage.toLowerCase().includes(q) ||
        a.state.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [items, query]);

  const attentionTotal =
    data.counts.needsReview + data.counts.missingInfo +
    data.counts.overdue + data.counts.escalations;

  return (
    <OSShell>
      <div className="mx-auto w-full max-w-6xl px-4 md:px-8 pb-24 pt-6 md:pt-10 space-y-8">

        {/* HEADER */}
        <header>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{todayLabel()}</p>
              <h1 className="mt-1 text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
                QA Dashboard
              </h1>
              <p className="mt-1.5 text-[15px] text-muted-foreground max-w-2xl">
                Today's quality review priorities and operational follow-ups.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {attentionTotal > 0 && (
                <span className="inline-flex items-center gap-2 px-3 h-9 rounded-full border border-border/70 bg-card text-xs font-medium text-foreground">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-primary/50 animate-ping" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                  </span>
                  {attentionTotal} need attention
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-medium">
                <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
                QA / Compliance
              </span>
            </div>
          </div>

          {/* Search */}
          <div className="mt-5 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search client, authorization, BCBA, workflow, or QA status..."
              className="w-full h-11 rounded-xl bg-muted/60 border border-border pl-11 pr-4 text-[15px] placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
            {searchResults.length > 0 && (
              <Card className="absolute top-full mt-2 w-full z-20 p-2 max-h-80 overflow-auto">
                {searchResults.map(a => (
                  <button
                    key={a.id}
                    onClick={() => setOpenId(a.id)}
                    className="flex w-full text-left items-center justify-between gap-4 px-3 py-2 rounded-lg hover:bg-muted transition"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{a.clientName}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {a.payor} · {a.state} · {a.stage}
                      </div>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </Card>
            )}
          </div>
        </header>

        <StateDirectorSnapshotBanner
          ownerDepartment="QA"
          sourceModule="qa_team"
          openBlockers={data.counts.needsReview + data.counts.missingInfo}
          overdueCount={data.counts.overdue}
          topRisks={[
            data.counts.needsReview ? `${data.counts.needsReview} needs QA review` : "",
            data.counts.overdue ? `${data.counts.overdue} overdue` : "",
            data.counts.escalations ? `${data.counts.escalations} escalations` : "",
          ].filter(Boolean)}
        />

        {/* PRIORITY CARDS */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <PriorityCard
              icon={ClipboardCheck}
              label="Needs QA Review"
              count={data.counts.needsReview}
              hint="Treatment plans & PRs awaiting review"
              tone={data.counts.needsReview > 10 ? "warn" : "ok"}
              to="/qa-queue"
            />
            <PriorityCard
              icon={FileWarning}
              label="Missing Information"
              count={data.counts.missingInfo}
              hint="Incomplete packets & signatures"
              tone={data.counts.missingInfo > 0 ? "warn" : "ok"}
              to="/missing-information"
            />
            <PriorityCard
              icon={CalendarClock}
              label="Expiring Soon"
              count={data.counts.expiringSoon}
              hint="Within next 90 days"
              tone={data.counts.expiringSoon > 5 ? "warn" : "ok"}
              to="/expiring-items"
            />
            <PriorityCard
              icon={AlertTriangle}
              label="Overdue Follow-Ups"
              count={data.counts.overdue}
              hint="Stalled more than 5 days"
              tone={data.counts.overdue > 0 ? "warn" : "ok"}
              to="/qa-queue"
            />
            <PriorityCard
              icon={Flame}
              label="Escalations Needed"
              count={data.counts.escalations}
              hint="Denials, expiring <14d, stuck >10d"
              tone={data.counts.escalations > 0 ? "crit" : "ok"}
              to="/escalations-followups"
            />
          </div>
        </section>

        {/* MAIN 2-COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT — main column */}
          <div className="lg:col-span-2 space-y-8">

            {/* SECTION 1 — Priorities */}
            <section>
              <SectionHeader
                title="Today's QA Priorities"
                hint="Highest-risk items needing your attention now"
                action={
                  <Link to="/qa-queue" className="text-xs font-medium text-primary hover:opacity-80 transition inline-flex items-center gap-1">
                    View full QA queue <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                }
              />
              <Card>
                {loading ? (
                  <div className="p-6 space-y-3">
                    {[1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}
                  </div>
                ) : data.priorities.length === 0 ? (
                  <EmptyState icon={CheckCircle2} title="No QA priorities right now." hint="You're caught up — new items will appear here as they arrive." />
                ) : (
                  <div className="divide-y divide-border/60">
                    {data.priorities.map(a => {
                      const tone: Tone = a.riskLevel === "High" ? "crit" : a.riskLevel === "Medium" ? "warn" : "ok";
                      const due = daysUntil(a.nextTaskDue);
                      const dueLabel = due === null ? null : due < 0 ? `${Math.abs(due)}d overdue` : due === 0 ? "Due today" : `Due in ${due}d`;
                      return (
                        <button key={a.id} onClick={() => setOpenId(a.id)} className="w-full text-left flex items-start gap-4 p-4 hover:bg-muted/40 transition">
                          <div className={cn("h-9 w-9 rounded-xl grid place-items-center border shrink-0", toneClasses(tone))}>
                            <FileSignature className="h-4 w-4" strokeWidth={1.75} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-foreground truncate">{a.clientName}</span>
                              <span className="text-xs text-muted-foreground">·</span>
                              <span className="text-xs text-muted-foreground">{a.payor} · {a.state}</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5 truncate">
                              {a.stage} · {a.nextAction}
                            </div>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <StatusPill tone={tone}>{a.riskLevel} risk</StatusPill>
                              {a.missingInfo && <StatusPill tone="warn">Missing info</StatusPill>}
                              {dueLabel && <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1"><Clock className="h-3 w-3" />{dueLabel}</span>}
                              {a.qaOwner && <span className="text-[11px] text-muted-foreground">· {a.qaOwner}</span>}
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </Card>
            </section>

            {/* SECTION 2 — Blocked */}
            <section>
              <SectionHeader title="Blocked Workflows" hint="Waiting on missing items or follow-up" />
              <Card>
                {data.blocked.length === 0 ? (
                  <EmptyState icon={CheckCircle2} title="No blocked QA items right now." />
                ) : (
                  <div className="divide-y divide-border/60">
                    {data.blocked.map(a => (
                      <div key={a.id} className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-foreground">{a.clientName}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {a.missingInfo ? "Missing information" : "Awaiting submission"} · {a.payor} · {a.state}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Owner: {a.qaOwner ?? a.coordinator} · Blocked {a.daysInStage}d
                            </div>
                          </div>
                          <StatusPill tone={a.daysInStage > 7 ? "crit" : "warn"}>
                            {a.daysInStage}d
                          </StatusPill>
                        </div>
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          <button onClick={() => setOpenId(a.id)} className="h-8 px-3 rounded-lg text-xs font-medium bg-secondary text-secondary-foreground border border-border/70 hover:bg-muted transition inline-flex items-center gap-1.5">
                            <Send className="h-3 w-3" /> Send follow-up
                          </button>
                          <button onClick={() => setOpenId(a.id)} className="h-8 px-3 rounded-lg text-xs font-medium hover:bg-muted transition inline-flex items-center gap-1.5 text-foreground">
                            <Flame className="h-3 w-3" /> Escalate
                          </button>
                          <button onClick={() => setOpenId(a.id)} className="h-8 px-3 rounded-lg text-xs font-medium hover:bg-muted transition inline-flex items-center gap-1.5 text-foreground">
                            <ExternalLink className="h-3 w-3" /> Open record
                          </button>
                          <button onClick={() => setOpenId(a.id)} className="h-8 px-3 rounded-lg text-xs font-medium hover:bg-muted transition inline-flex items-center gap-1.5 text-foreground">
                            <CheckCircle2 className="h-3 w-3" /> Mark updated
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </section>

            {/* SECTION 3 — Expiring */}
            <section>
              <SectionHeader title="Expiring Soon" hint="Authorization expirations by window" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: "Next 30 days", tone: "crit" as Tone, list: data.expiringBuckets.d30 },
                  { label: "31–60 days",   tone: "warn" as Tone, list: data.expiringBuckets.d60 },
                  { label: "61–90 days",   tone: "ok"   as Tone, list: data.expiringBuckets.d90 },
                ].map(bucket => (
                  <Card key={bucket.label} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{bucket.label}</span>
                      <StatusPill tone={bucket.tone}>{bucket.list.length}</StatusPill>
                    </div>
                    {bucket.list.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-4">No expiring items in this range.</p>
                    ) : (
                      <ul className="space-y-2">
                        {bucket.list.slice(0, 5).map(a => (
                          <li key={a.id} className="text-xs">
                            <div className="font-medium text-foreground truncate">{a.clientName}</div>
                            <div className="text-muted-foreground truncate">
                              {a.payor} · exp {a.expirationDate}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card>
                ))}
              </div>
            </section>

            {/* SECTION 4 — PR Watchlist */}
            <section>
              <SectionHeader
                title="Progress Report Watchlist"
                hint="GA: outreach @9w (Rivky) · escalation @6w (Shira/Rachel). Other states: weekly notifications (Rikki) · SD escalation @6w."
              />
              <Card>
                {data.prWatch.length === 0 ? (
                  <EmptyState icon={ScrollText} title="No progress reports on the watchlist." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs uppercase tracking-wider text-muted-foreground border-b border-border/60">
                          <th className="text-left font-medium px-4 py-3">Client</th>
                          <th className="text-left font-medium px-4 py-3">State</th>
                          <th className="text-left font-medium px-4 py-3">BCBA</th>
                          <th className="text-left font-medium px-4 py-3">Weeks to exp.</th>
                          <th className="text-left font-medium px-4 py-3">Escalation</th>
                          <th className="text-left font-medium px-4 py-3">Next owner</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {data.prWatch.map(({ auth, weeks, escalation }) => (
                          <tr key={auth.id} className="hover:bg-muted/40 transition">
                            <td className="px-4 py-3 font-medium text-foreground">{auth.clientName}</td>
                            <td className="px-4 py-3 text-muted-foreground">{auth.state}</td>
                            <td className="px-4 py-3 text-muted-foreground">{auth.coordinator}</td>
                            <td className="px-4 py-3 text-foreground tabular-nums">{weeks}w</td>
                            <td className="px-4 py-3"><StatusPill tone={escalation.tone}>{escalation.label}</StatusPill></td>
                            <td className="px-4 py-3 text-muted-foreground">{escalation.owner}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </section>
          </div>

          {/* RIGHT — sidebar */}
          <div className="space-y-8">

            {/* Operational Insights */}
            <section>
              <Card className="p-5 bg-gradient-to-br from-primary/5 via-card to-card">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary grid place-items-center">
                    <Brain className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">Operational Insights</div>
                    <div className="text-xs text-muted-foreground">Operational copilot for QA</div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {[
                    "What needs attention today?",
                    "Which reviews are blocked?",
                    "What is expiring soon?",
                    "Which BCBAs need follow-up?",
                    "Show overdue progress reports.",
                  ].map(p => (
                    <Link
                      key={p}
                      to={`/ai/assistant?q=${encodeURIComponent(p)}`}
                      className="block w-full text-left text-xs px-3 py-2 rounded-lg bg-muted/60 hover:bg-muted transition text-foreground"
                    >
                      <Sparkles className="h-3 w-3 inline mr-1.5 text-primary" strokeWidth={2} />
                      {p}
                    </Link>
                  ))}
                </div>
              </Card>
            </section>

            {/* SECTION 5 — Team Workload */}
            <section>
              <SectionHeader title="QA / Compliance Workload" />
              <Card className="divide-y divide-border/60">
                {QA_TEAM.map(name => {
                  const s = data.ownerStats.get(name)!;
                  const first = name.split(" ")[0];
                  const initials = name.split(" ").map(p => p[0]).join("");
                  return (
                    <div key={name} className="flex items-center gap-3 p-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 text-primary grid place-items-center text-xs font-semibold">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-foreground truncate">{first}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {s.open} open · {s.overdue} overdue · {s.blocked} blocked
                        </div>
                      </div>
                    </div>
                  );
                })}
              </Card>
            </section>

            {/* SECTION 6 — Recent Activity */}
            <section>
              <SectionHeader title="Recent QA Activity" />
              <Card>
                {data.activity.length === 0 ? (
                  <EmptyState icon={MessageSquare} title="No recent activity." />
                ) : (
                  <ul className="divide-y divide-border/60">
                    {data.activity.map(a => (
                      <li key={a.id} className="p-3">
                        <div className="text-xs text-muted-foreground">{relTime(a.ts)}</div>
                        <div className="text-sm text-foreground mt-0.5">{a.action}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 truncate">
                          {a.client} · {a.owner}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </section>
          </div>
        </div>
      </div>
      {openAuth && (
        <TeamSlideout
          auth={openAuth}
          onClose={() => setOpenId(null)}
          onChanged={refresh}
          sourceSystem={sourceById.get(openAuth.id)}
        />
      )}
    </OSShell>
  );
}

function TeamSlideout({
  auth, onClose, onChanged, sourceSystem,
}: {
  auth: Authorization;
  onClose: () => void;
  onChanged?: () => void | Promise<void>;
  sourceSystem?: "monday" | "manual" | "centralreach";
}) {
  useSlideout(true, onClose);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-[2px]" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full sm:w-[480px] bg-card border-l border-border/70 shadow-2xl overflow-y-auto">
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border/60 px-5 py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground truncate">{auth.clientName}</h2>
            <p className="text-xs text-muted-foreground truncate">
              {auth.payor} · {auth.state} · {auth.stage}
            </p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-muted grid place-items-center shrink-0">
            <X className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <QAActionsPanel auth={auth} sourceSystem={sourceSystem} onChanged={onChanged} />
        </div>
      </aside>
    </div>
  );
}
