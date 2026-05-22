import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, Plus, Sparkles, AlertTriangle, ChevronRight, ClipboardCheck,
  MessageSquare, StickyNote, Download, X, Wand2, ListTodo, FileWarning,
  Activity, UserCog, CalendarClock, Send, Filter, Users,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  mockAuths, type Authorization,
  daysUntil, getAuthAlert,
} from "@/data/authorizations";

/* helpers */
function hash(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
function supervisionPct(a: Authorization) { return 55 + (hash(a.id) % 45); }
function lastPRDays(a: Authorization) { return hash(a.id + "pr") % 95; }
function bcbaName(a: Authorization) {
  const list = ["Dr. Kim", "Dr. Lee", "Dr. Patel", "Dr. Rivera", "Dr. Wright"];
  return list[hash(a.id + "b") % list.length];
}
function relTime(iso: string) {
  const d = new Date(iso); const diff = Date.now() - d.getTime();
  const day = 86_400_000;
  if (diff < 3_600_000) return `${Math.max(1, Math.round(diff / 60_000))}m`;
  if (diff < day) return `${Math.round(diff / 3_600_000)}h`;
  if (diff < 30 * day) return `${Math.round(diff / day)}d`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
function urgencyDot(u: "low" | "medium" | "high") {
  return (
    <span className={cn(
      "inline-block h-1.5 w-1.5 rounded-full",
      u === "high" ? "bg-destructive" : u === "medium" ? "bg-amber-500" : "bg-emerald-500",
    )} />
  );
}

type EnrichedAuth = Authorization & {
  bcba: string;
  supervisionPct: number;
  lastPRDays: number;
  daysToExpire: number | null;
  alert: ReturnType<typeof getAuthAlert>;
  urgency: "low" | "medium" | "high";
  primaryBlocker: string | null;
};

function enrich(a: Authorization): EnrichedAuth {
  const days = daysUntil(a.expirationDate);
  const alert = getAuthAlert(a);
  const sup = supervisionPct(a);
  const pr = lastPRDays(a);
  let urgency: "low" | "medium" | "high" = "low";
  if (alert?.type === "red" || (days !== null && days < 15) || sup < 70 || pr > 45) urgency = "high";
  else if (alert?.type === "yellow" || (days !== null && days < 45) || sup < 80 || pr > 30) urgency = "medium";

  let blocker: string | null = null;
  if (a.missingInfo) blocker = "Missing documentation";
  else if (days !== null && days < 15) blocker = "Expiring in <15 days";
  else if (sup < 70) blocker = "Supervision below 80%";
  else if (pr > 45) blocker = "PR overdue 45d+";
  else if (a.stage === "In QA Review" && a.daysInStage >= 3) blocker = "QA review pending";
  else if (!a.treatmentPlanReceived && a.stage !== "Approved") blocker = "Treatment plan missing";
  else if (a.stage === "Awaiting Submission" && a.daysInStage >= 2) blocker = "Awaiting submission";
  else if (days !== null && days < 45) blocker = "Expiring soon";

  return { ...a, bcba: bcbaName(a), supervisionPct: sup, lastPRDays: pr, daysToExpire: days, alert, urgency, primaryBlocker: blocker };
}

/* page */
export default function OSAuthorizations() {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const enriched = useMemo(() => mockAuths.map(enrich), []);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return enriched;
    return enriched.filter((a) =>
      [a.clientName, a.id, a.bcba, a.payor, a.stage, a.authType, a.state]
        .map((s) => String(s ?? "").toLowerCase()).join(" ").includes(q),
    );
  }, [enriched, query]);

  return (
    <OSShell rightRail={<AskBlossomAuthRail auths={visible} onOpen={setOpenId} />}>
      <div className="space-y-10 pb-12">
        <header className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Authorizations</h1>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-xl">
              Track authorization readiness, PR workflows, supervision, and operational risks.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => toast("Request PR — coming soon")}>
              <Send className="mr-1.5 h-4 w-4" /> Request PR
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/clients"><Users className="mr-1.5 h-4 w-4" /> Open Client</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => toast("Filters — coming soon")}>
              <Filter className="mr-1.5 h-4 w-4" /> Filters
            </Button>
            <Button variant="ghost" size="sm" onClick={() => toast("Export — coming soon")}>
              <Download className="mr-1.5 h-4 w-4" /> Export
            </Button>
            <Button size="sm" onClick={() => toast("Add Authorization — coming soon")}>
              <Plus className="mr-1.5 h-4 w-4" /> Add Authorization
            </Button>
          </div>
        </header>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search client, auth, BCBA, insurance…"
            className="h-11 w-full rounded-xl bg-muted/60 border border-border pl-10 pr-4 text-sm placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-ring focus:border-transparent transition outline-none"
          />
        </div>

        <AuthPulse auths={visible} />
        <AuthsNeedingAttention auths={visible} onOpen={setOpenId} />
        <PrSupervisionRisks auths={visible} onOpen={setOpenId} />
        <QABlockers auths={visible} onOpen={setOpenId} />
        <AuthHealth auths={visible} onOpen={setOpenId} />
        <LifecyclePipeline auths={visible} onOpen={setOpenId} />
        <AuthList auths={visible} onOpen={setOpenId} />
        <RecentActivity auths={visible} onOpen={setOpenId} />
      </div>

      {openId && <AuthDrawer authId={openId} onClose={() => setOpenId(null)} />}
    </OSShell>
  );
}

/* Pulse */
function AuthPulse({ auths }: { auths: EnrichedAuth[] }) {
  const pulse = useMemo(() => {
    const c = { pending: 0, expiring: 0, prOverdue: 0, missingSup: 0, qaPending: 0, readySubmit: 0 };
    for (const a of auths) {
      if (a.stage === "Awaiting Submission") c.pending++;
      if (a.daysToExpire !== null && a.daysToExpire < 45 && a.daysToExpire >= 0) c.expiring++;
      if (a.lastPRDays > 45) c.prOverdue++;
      if (a.supervisionPct < 80) c.missingSup++;
      if (a.stage === "In QA Review") c.qaPending++;
      if (a.stage === "Awaiting Submission" && !a.missingInfo && a.treatmentPlanReceived) c.readySubmit++;
    }
    return c;
  }, [auths]);

  const pills = [
    { label: "Auths Pending", value: pulse.pending, accent: true },
    { label: "Expiring Soon", value: pulse.expiring },
    { label: "PRs Overdue", value: pulse.prOverdue },
    { label: "Missing Supervision", value: pulse.missingSup },
    { label: "QA Review Pending", value: pulse.qaPending },
    { label: "Ready for Submission", value: pulse.readySubmit },
  ];

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground">Authorization Operational Pulse</h2>
        <span className="text-xs text-muted-foreground tabular-nums">{auths.length} total</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {pills.map((p) => (
          <div key={p.label} className={cn(
            "rounded-2xl border border-border/70 bg-card p-4",
            p.accent && "bg-primary/[0.04] border-primary/20",
          )}>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{p.label}</p>
            <p className={cn("mt-1.5 text-2xl font-semibold tabular-nums", p.accent && "text-primary")}>
              {p.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* Attention */
function AuthsNeedingAttention({ auths, onOpen }: { auths: EnrichedAuth[]; onOpen: (id: string) => void }) {
  const items = useMemo(() => auths
    .filter((a) => a.primaryBlocker)
    .sort((a, b) => {
      const w = { high: 0, medium: 1, low: 2 } as const;
      if (w[a.urgency] !== w[b.urgency]) return w[a.urgency] - w[b.urgency];
      return (a.daysToExpire ?? 999) - (b.daysToExpire ?? 999);
    })
    .slice(0, 8), [auths]);

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Authorizations Needing Attention</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Operational blockers preventing authorization progression.</p>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">{items.length} surfaced</span>
      </div>
      {items.length === 0 ? (
        <EmptyTile message="All clear. No active authorization blockers." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((a) => (
            <article key={a.id} className="group rounded-2xl border border-border/70 bg-card p-5 hover:border-border hover:-translate-y-0.5 transition-all duration-300">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    {urgencyDot(a.urgency)}
                    <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{a.primaryBlocker}</span>
                  </div>
                  <button onClick={() => onOpen(a.id)} className="text-base font-medium text-left hover:text-primary transition">
                    {a.clientName}
                  </button>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {a.authType} · BCBA: {a.bcba} · {a.payor} · {a.state}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] text-muted-foreground">
                    {a.daysToExpire !== null ? "Expires" : "In stage"}
                  </p>
                  <p className={cn("text-lg font-semibold tabular-nums",
                    a.daysToExpire !== null && a.daysToExpire < 15 && "text-destructive",
                    a.daysToExpire !== null && a.daysToExpire >= 15 && a.daysToExpire < 45 && "text-amber-600",
                  )}>
                    {a.daysToExpire !== null ? `${a.daysToExpire}d` : `${a.daysInStage}d`}
                  </p>
                </div>
              </div>
              <div className="mt-3 rounded-xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                {a.nextAction} · Stage: <span className="text-foreground">{a.stage}</span>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-1">
                <QuickAction icon={Send} label="Request PR" onClick={() => toast(`PR requested for ${a.clientName}`)} />
                <QuickAction icon={MessageSquare} label="Message BCBA" onClick={() => toast(`Message sent to ${a.bcba}`)} />
                <QuickAction icon={ClipboardCheck} label="Open QA" onClick={() => toast("Open QA")} />
                <QuickAction icon={StickyNote} label="Note" onClick={() => toast("Note added")} />
                <QuickAction icon={AlertTriangle} label="Escalate" onClick={() => toast("Escalated")} />
                <button onClick={() => onOpen(a.id)} className="ml-auto inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  Open <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function QuickAction({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: (e?: any) => void }) {
  return (
    <button onClick={onClick}
      className="inline-flex items-center gap-1 h-8 rounded-full px-3 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition">
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

/* PR & Supervision */
function PrSupervisionRisks({ auths, onOpen }: { auths: EnrichedAuth[]; onOpen: (id: string) => void }) {
  const items = useMemo(() => auths
    .filter((a) => a.lastPRDays > 30 || a.supervisionPct < 80)
    .sort((a, b) => a.supervisionPct - b.supervisionPct)
    .slice(0, 8), [auths]);

  if (items.length === 0) return null;

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">PR & Supervision Risks</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Clients below supervision target or with overdue progress reports.</p>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">{items.length} flagged</span>
      </div>
      <div className="rounded-2xl border border-border/70 bg-card divide-y divide-border/50 overflow-hidden">
        {items.map((a) => {
          const supTone = a.supervisionPct < 70 ? "text-destructive" : a.supervisionPct < 80 ? "text-amber-600" : "text-emerald-600";
          const prTone = a.lastPRDays > 45 ? "text-destructive" : a.lastPRDays > 30 ? "text-amber-600" : "text-muted-foreground";
          return (
            <div key={a.id} className="px-5 py-3.5 hover:bg-muted/40 cursor-pointer flex items-center gap-4" onClick={() => onOpen(a.id)}>
              <UserCog className="h-4 w-4 text-amber-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{a.clientName}
                  <span className="ml-2 text-xs text-muted-foreground font-normal">{a.bcba} · {a.payor}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  Auth exp: {a.expirationDate ?? "—"}
                  {a.daysToExpire !== null && ` (${a.daysToExpire}d)`}
                </p>
              </div>
              <div className="hidden md:flex items-center gap-5 text-[11px]">
                <div className="text-right">
                  <p className="text-muted-foreground">Supervision</p>
                  <p className={cn("text-sm font-semibold tabular-nums", supTone)}>{a.supervisionPct}%</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground">Last PR</p>
                  <p className={cn("text-sm font-semibold tabular-nums", prTone)}>{a.lastPRDays}d ago</p>
                </div>
              </div>
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <QuickAction icon={Send} label="PR" onClick={() => toast(`PR requested for ${a.clientName}`)} />
                <QuickAction icon={MessageSquare} label="BCBA" onClick={() => toast(`Message sent to ${a.bcba}`)} />
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* QA Blockers */
function QABlockers({ auths, onOpen }: { auths: EnrichedAuth[]; onOpen: (id: string) => void }) {
  const items = useMemo(() => auths.filter((a) =>
    a.missingInfo || !a.treatmentPlanReceived || a.stage === "In QA Review" || a.missingRequirements.length > 0
  ).slice(0, 8), [auths]);

  if (items.length === 0) return null;

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">QA & Documentation Blockers</h2>
          <p className="text-sm text-muted-foreground mt-0.5">What is preventing authorization progression.</p>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">{items.length} blocked</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((a) => {
          const missing = a.missingRequirements.length > 0
            ? a.missingRequirements
            : !a.treatmentPlanReceived ? ["Treatment Plan"]
            : a.stage === "In QA Review" ? ["Awaiting QA reviewer sign-off"]
            : ["Missing documentation"];
          return (
            <article key={a.id} className="rounded-2xl border border-border/70 bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <button onClick={() => onOpen(a.id)} className="text-sm font-medium hover:text-primary">{a.clientName}</button>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{a.bcba} · {a.payor}</p>
                </div>
                <span className="text-[11px] uppercase tracking-wide text-amber-600">{a.stage}</span>
              </div>
              <ul className="mt-3 space-y-1.5">
                {missing.slice(0, 3).map((m, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <FileWarning className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{m}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap gap-1">
                <QuickAction icon={ClipboardCheck} label="Open QA" onClick={() => toast("Open QA")} />
                <QuickAction icon={Send} label="Request PR" onClick={() => toast(`PR requested for ${a.clientName}`)} />
                <QuickAction icon={MessageSquare} label="BCBA" onClick={() => toast(`Message sent to ${a.bcba}`)} />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

/* Health */
function AuthHealth({ auths, onOpen }: { auths: EnrichedAuth[]; onOpen: (id: string) => void }) {
  const groups = useMemo(() => {
    const expiring = auths.filter((a) => a.daysToExpire !== null && a.daysToExpire >= 0 && a.daysToExpire < 45);
    const waitingPR = auths.filter((a) => a.lastPRDays > 30);
    const waitingQA = auths.filter((a) => a.stage === "In QA Review");
    const blocked = auths.filter((a) => a.missingInfo);
    const atRisk = auths.filter((a) => a.urgency === "high" && a.stage !== "Approved");
    const healthy = auths.filter((a) => a.stage === "Approved" && !a.alert);
    return [
      { key: "blocked", label: "Blocked", tone: "destructive", items: blocked },
      { key: "atRisk", label: "At Risk", tone: "destructive", items: atRisk },
      { key: "expiring", label: "Expiring", tone: "amber", items: expiring },
      { key: "qa", label: "Waiting on QA", tone: "amber", items: waitingQA },
      { key: "pr", label: "Waiting on PR", tone: "amber", items: waitingPR },
      { key: "healthy", label: "Healthy", tone: "emerald", items: healthy },
    ];
  }, [auths]);

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Operational Auth Health</h2>
          <p className="text-sm text-muted-foreground mt-0.5">At-a-glance authorization status across operations.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {groups.map((g) => (
          <div key={g.key} className="rounded-2xl border border-border/70 bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{g.label}</p>
              <span className={cn(
                "text-sm font-semibold tabular-nums",
                g.tone === "destructive" && "text-destructive",
                g.tone === "amber" && "text-amber-600",
                g.tone === "emerald" && "text-emerald-600",
              )}>{g.items.length}</span>
            </div>
            <ul className="space-y-1">
              {g.items.slice(0, 3).map((a) => (
                <li key={a.id}>
                  <button onClick={() => onOpen(a.id)} className="w-full text-left rounded-lg px-2 py-1.5 hover:bg-muted text-xs">
                    <p className="truncate font-medium">{a.clientName}</p>
                    <p className="truncate text-muted-foreground text-[11px]">{a.payor}</p>
                  </button>
                </li>
              ))}
              {g.items.length > 3 && <li className="text-[11px] text-muted-foreground px-2">+{g.items.length - 3} more</li>}
              {g.items.length === 0 && <li className="text-[11px] text-muted-foreground/70 px-2">None</li>}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

/* Pipeline */
const PIPELINE: { name: string; match: (a: EnrichedAuth) => boolean }[] = [
  { name: "Ready for Assessment", match: (a) => a.authType === "Initial" && a.stage === "Awaiting Submission" },
  { name: "Assessment Completed", match: (a) => a.authType === "Initial" && a.stage === "Submitted" },
  { name: "Waiting on Treatment Plan", match: (a) => !a.treatmentPlanReceived && a.authType === "Treatment" && a.stage === "Awaiting Submission" },
  { name: "Waiting on PR", match: (a) => a.lastPRDays > 30 && a.stage !== "Approved" },
  { name: "QA Review", match: (a) => a.stage === "In QA Review" },
  { name: "Ready for Submission", match: (a) => a.stage === "Awaiting Submission" && !a.missingInfo && a.treatmentPlanReceived },
  { name: "Submitted", match: (a) => a.stage === "Submitted" },
  { name: "Approved", match: (a) => a.stage === "Approved" && (a.daysToExpire === null || a.daysToExpire >= 45) },
  { name: "Expiring Soon", match: (a) => (a.daysToExpire !== null && a.daysToExpire >= 0 && a.daysToExpire < 45) || a.stage === "Expiring Soon" },
  { name: "Reassessment Needed", match: (a) => a.daysToExpire !== null && a.daysToExpire < 0 },
];

function LifecyclePipeline({ auths, onOpen }: { auths: EnrichedAuth[]; onOpen: (id: string) => void }) {
  const stages = useMemo(() => PIPELINE.map((s) => {
    const items = auths.filter(s.match);
    const overdue = items.filter((a) => (a.daysInStage ?? 0) >= 7).length;
    const avg = items.length ? Math.round(items.reduce((sum, a) => sum + (a.daysInStage ?? 0), 0) / items.length) : 0;
    return { ...s, items, overdue, avg };
  }), [auths]);

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Authorization Lifecycle Pipeline</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Operational progression across authorization stages.</p>
        </div>
      </div>
      <div className="overflow-x-auto -mx-2 px-2">
        <div className="flex gap-3 min-w-max pb-2">
          {stages.map((s) => (
            <div key={s.name} className="w-56 shrink-0 rounded-2xl border border-border/70 bg-card p-4">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground truncate">{s.name}</p>
              <div className="mt-1.5 flex items-baseline gap-2">
                <p className="text-2xl font-semibold tabular-nums">{s.items.length}</p>
                {s.overdue > 0 && (
                  <span className="text-[11px] text-destructive font-medium">{s.overdue} overdue</span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Avg {s.avg}d in stage</p>
              {s.items.length > 0 && (
                <ul className="mt-3 space-y-1 border-t border-border/50 pt-2.5">
                  {s.items.slice(0, 3).map((a) => (
                    <li key={a.id}>
                      <button onClick={() => onOpen(a.id)} className="w-full text-left rounded-lg px-1.5 py-1 hover:bg-muted text-xs">
                        <p className="truncate font-medium">{a.clientName}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{a.payor}</p>
                      </button>
                    </li>
                  ))}
                  {s.items.length > 3 && <li className="text-[11px] text-muted-foreground px-1.5">+{s.items.length - 3} more</li>}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* List */
function AuthList({ auths, onOpen }: { auths: EnrichedAuth[]; onOpen: (id: string) => void }) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">All Authorizations</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Operational list view.</p>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">{auths.length} total</span>
      </div>
      <div className="rounded-2xl border border-border/70 bg-card overflow-hidden">
        <div className="hidden lg:grid grid-cols-[1.5fr_1fr_1fr_1fr_0.7fr_0.7fr_0.8fr_0.8fr] gap-4 px-5 py-2.5 border-b border-border/60 text-[11px] uppercase tracking-wide text-muted-foreground">
          <span>Client</span><span>BCBA</span><span>Payor</span><span>Stage</span>
          <span className="text-right">Exp</span><span className="text-right">Sup%</span>
          <span className="text-right">Last PR</span><span>Risk</span>
        </div>
        <div className="divide-y divide-border/50">
          {auths.slice(0, 30).map((a) => (
            <div key={a.id} onClick={() => onOpen(a.id)} className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr_1fr_1fr_0.7fr_0.7fr_0.8fr_0.8fr] gap-2 lg:gap-4 px-5 py-3 hover:bg-muted/40 cursor-pointer text-sm">
              <div className="min-w-0">
                <p className="font-medium truncate">{a.clientName}</p>
                <p className="text-[11px] text-muted-foreground truncate lg:hidden">{a.bcba} · {a.payor} · {a.stage}</p>
              </div>
              <span className="hidden lg:block text-xs text-muted-foreground truncate">{a.bcba}</span>
              <span className="hidden lg:block text-xs text-muted-foreground truncate">{a.payor}</span>
              <span className="hidden lg:block text-xs text-muted-foreground truncate">{a.stage}</span>
              <span className={cn("hidden lg:block text-xs text-right tabular-nums",
                a.daysToExpire !== null && a.daysToExpire < 15 && "text-destructive",
                a.daysToExpire !== null && a.daysToExpire >= 15 && a.daysToExpire < 45 && "text-amber-600",
              )}>{a.daysToExpire !== null ? `${a.daysToExpire}d` : "—"}</span>
              <span className={cn("hidden lg:block text-xs text-right tabular-nums",
                a.supervisionPct < 70 ? "text-destructive" : a.supervisionPct < 80 ? "text-amber-600" : "text-muted-foreground",
              )}>{a.supervisionPct}%</span>
              <span className={cn("hidden lg:block text-xs text-right tabular-nums",
                a.lastPRDays > 45 ? "text-destructive" : a.lastPRDays > 30 ? "text-amber-600" : "text-muted-foreground",
              )}>{a.lastPRDays}d</span>
              <span className="hidden lg:flex items-center gap-1.5 text-xs">
                {urgencyDot(a.urgency)} <span className="capitalize text-muted-foreground">{a.urgency}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* Activity */
function RecentActivity({ auths, onOpen }: { auths: EnrichedAuth[]; onOpen: (id: string) => void }) {
  const events = useMemo(() => {
    const all = auths.flatMap((a) => a.timeline.slice(0, 2).map((t) => ({ ...t, auth: a })));
    return all.sort((x, y) => new Date(y.timestamp).getTime() - new Date(x.timestamp).getTime()).slice(0, 10);
  }, [auths]);

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-xl font-semibold tracking-tight">Recent Activity</h2>
      </div>
      <div className="rounded-2xl border border-border/70 bg-card divide-y divide-border/50">
        {events.map((e) => (
          <div key={e.id + e.auth.id} onClick={() => onOpen(e.auth.id)} className="px-5 py-3 hover:bg-muted/40 cursor-pointer flex items-start gap-3">
            <Activity className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">
                <span className="font-medium">{e.auth.clientName}</span>
                <span className="text-muted-foreground"> · {e.description}</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{relTime(e.timestamp)} ago · {e.user || "System"}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* Drawer */
function AuthDrawer({ authId, onClose }: { authId: string; onClose: () => void }) {
  const a = useMemo(() => mockAuths.find((x) => x.id === authId), [authId]);
  if (!a) return null;
  const e = enrich(a);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
      <aside className="w-full max-w-xl bg-card border-l border-border overflow-y-auto">
        <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-border/60 px-6 py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold truncate">{a.clientName}</h3>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {a.id} · {a.authType} · {a.payor} · {a.state}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "rounded-full border px-2 py-0.5 text-[11px]",
              e.urgency === "high" ? "border-destructive/30 text-destructive bg-destructive/5"
                : e.urgency === "medium" ? "border-amber-500/30 text-amber-600 bg-amber-500/5"
                : "border-emerald-500/30 text-emerald-600 bg-emerald-500/5",
            )}>{e.stage}</span>
            <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => toast(`PR requested for ${a.clientName}`)}><Send className="mr-1.5 h-3.5 w-3.5" /> Request PR</Button>
            <Button size="sm" variant="outline" onClick={() => toast(`Message sent to ${e.bcba}`)}><MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Message BCBA</Button>
            <Button size="sm" variant="outline" onClick={() => toast("Open QA")}><ClipboardCheck className="mr-1.5 h-3.5 w-3.5" /> Open QA</Button>
            <Button size="sm" variant="outline" onClick={() => toast("Note added")}><StickyNote className="mr-1.5 h-3.5 w-3.5" /> Note</Button>
            <Button size="sm" variant="outline" onClick={() => toast("Escalated")}><AlertTriangle className="mr-1.5 h-3.5 w-3.5" /> Escalate</Button>
          </div>

          <Section title="Authorization Info">
            <KV label="Type" value={a.authType} />
            <KV label="Stage" value={a.stage} />
            <KV label="Hours" value={a.hours ?? "—"} />
            <KV label="Submitted" value={a.submittedDate ?? "—"} />
            <KV label="Approved" value={a.approvedDate ?? "—"} />
            <KV label="Expires" value={a.expirationDate ? `${a.expirationDate}${e.daysToExpire !== null ? ` (${e.daysToExpire}d)` : ""}` : "—"} />
            <KV label="Days in stage" value={String(a.daysInStage)} />
            <KV label="Next action" value={a.nextAction} />
          </Section>

          <Section title="BCBA & Supervision">
            <KV label="BCBA" value={e.bcba} />
            <KV label="Supervision %" value={`${e.supervisionPct}%`} />
            <KV label="Last PR" value={`${e.lastPRDays}d ago`} />
            <KV label="QA Owner" value={a.qaOwner ?? "—"} />
            <KV label="QA Status" value={a.qaStatus} />
          </Section>

          {a.missingRequirements.length > 0 && (
            <Section title="Missing Requirements">
              <ul className="space-y-1.5">
                {a.missingRequirements.map((m) => (
                  <li key={m} className="flex items-start gap-2 text-xs">
                    <FileWarning className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{m}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section title="Documents">
            <ul className="space-y-1">
              {a.documents.map((d) => (
                <li key={d.name} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{d.name}</span>
                  <span className={cn("text-[11px]", d.received ? "text-emerald-600" : "text-amber-600")}>
                    {d.received ? "Received" : "Missing"}
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Timeline">
            <ul className="space-y-2">
              {a.timeline.map((t) => (
                <li key={t.id} className="text-xs">
                  <p>{t.description}</p>
                  <p className="text-muted-foreground mt-0.5">{relTime(t.timestamp)} ago · {t.user ?? "System"}</p>
                </li>
              ))}
            </ul>
          </Section>

          {a.qaNotes && (
            <Section title="Internal Notes">
              <p className="text-xs text-muted-foreground">{a.qaNotes}</p>
            </Section>
          )}
        </div>
      </aside>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}
function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right truncate">{value}</span>
    </div>
  );
}
function EmptyTile({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-10 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

/* Ask Blossom rail */
function AskBlossomAuthRail({ auths, onOpen }: { auths: EnrichedAuth[]; onOpen: (id: string) => void }) {
  const priorities = useMemo(() => auths
    .filter((a) => a.urgency === "high")
    .sort((x, y) => (x.daysToExpire ?? 999) - (y.daysToExpire ?? 999))
    .slice(0, 5), [auths]);

  const insights = useMemo(() => {
    const expiring = auths.filter((a) => a.daysToExpire !== null && a.daysToExpire < 30 && a.daysToExpire >= 0).length;
    const lowSup = auths.filter((a) => a.supervisionPct < 80).length;
    const prOverdue = auths.filter((a) => a.lastPRDays > 45).length;
    return [
      expiring > 0 && { icon: CalendarClock, text: `${expiring} auth${expiring === 1 ? "" : "s"} expiring in 30 days.`, tone: "amber" as const },
      lowSup > 0 && { icon: UserCog, text: `${lowSup} client${lowSup === 1 ? "" : "s"} below supervision target.`, tone: "violet" as const },
      prOverdue > 0 && { icon: AlertTriangle, text: `${prOverdue} PR${prOverdue === 1 ? "" : "s"} overdue 45 days or more.`, tone: "sky" as const },
    ].filter(Boolean) as { icon: any; text: string; tone: "amber" | "violet" | "sky" }[];
  }, [auths]);

  const prompts = [
    "Which auths are at risk?",
    "Show overdue PRs",
    "Find missing supervision",
    "Which clients need reassessment?",
    "Summarize authorization blockers",
  ];

  return (
    <div className="p-5 space-y-6">
      <div className="flex items-center gap-2">
        <div className="grid place-items-center h-8 w-8 rounded-xl bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium">Ask Blossom</p>
          <p className="text-[11px] text-muted-foreground">Authorization operations assistant</p>
        </div>
      </div>

      <div>
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Try</p>
        <div className="flex flex-wrap gap-1.5">
          {prompts.map((p) => (
            <button key={p} onClick={() => toast(`"${p}" — assistant coming soon`)}
              className="text-[11px] px-2.5 h-7 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition">
              {p}
            </button>
          ))}
        </div>
      </div>

      {insights.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
            <Wand2 className="h-3 w-3" /> Insights
          </p>
          <div className="space-y-2">
            {insights.map((i) => (
              <div key={i.text} className="rounded-xl border border-border/60 bg-card p-3 flex gap-2.5">
                <i.icon className={cn("h-4 w-4 mt-0.5 shrink-0",
                  i.tone === "amber" && "text-amber-500",
                  i.tone === "violet" && "text-violet-500",
                  i.tone === "sky" && "text-sky-500",
                )} />
                <p className="text-xs text-foreground leading-snug">{i.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
          <ListTodo className="h-3 w-3" /> Priorities
        </p>
        {priorities.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nothing urgent today.</p>
        ) : (
          <div className="space-y-1">
            {priorities.map((a, i) => (
              <button key={a.id} onClick={() => onOpen(a.id)}
                className="w-full text-left rounded-xl p-2.5 hover:bg-muted transition flex items-center gap-2.5">
                <span className="grid place-items-center h-6 w-6 rounded-full bg-muted text-[11px] font-medium shrink-0">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{a.clientName}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {a.primaryBlocker} · {a.daysToExpire !== null ? `${a.daysToExpire}d` : a.stage}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
