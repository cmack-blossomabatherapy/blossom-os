import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNowStrict } from "date-fns";
import {
  Phone, MessageSquare, Mail, StickyNote, ChevronRight, ExternalLink,
  Search, Plus, Send, Inbox, AlertTriangle, Hourglass, FileX2,
  UserPlus, CheckCircle2, PhoneOff, Sparkles, ArrowRight, AlertCircle,
  Activity, RefreshCw, Loader2, ClipboardList, FileText, ShieldCheck, FilePlus2,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { useOSRole } from "@/contexts/OSRoleContext";
import { useLeads } from "@/contexts/LeadsContext";
import {
  calculateKpis, getInlineAlert, type Lead, type LeadStatus,
} from "@/data/leads";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ============ helpers ============ */

const fmtAgo = (iso?: string | null) => {
  if (!iso) return "—";
  try { return `${formatDistanceToNowStrict(new Date(iso))} ago`; } catch { return "—"; }
};

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";

const STAGES: { id: LeadStatus; label: string; short?: string }[] = [
  { id: "New Lead", label: "New Lead" },
  { id: "In Contact", label: "Contacted" },
  { id: "Sent Form", label: "Form Sent" },
  { id: "Form Received", label: "Form Received" },
  { id: "Missing Information", label: "Missing Info" },
  { id: "Sent to VOB", label: "Sent to VOB" },
  { id: "VOB Completed", label: "VOB Completed" },
  { id: "Can't Reach", label: "Can't Reach" },
];

const URGENCY_ROW = (lead: Lead): "crit" | "warn" | "ok" => {
  const alert = getInlineAlert(lead);
  if (alert?.type === "red") return "crit";
  if (alert?.type === "yellow") return "warn";
  if (!lead.lastContacted && lead.status === "New Lead") return "warn";
  return "ok";
};

const URGENCY_TONE: Record<"crit" | "warn" | "ok", string> = {
  crit: "border-red-200/70 bg-red-50/40 dark:border-red-900/40 dark:bg-red-950/20",
  warn: "border-amber-200/70 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/20",
  ok:   "border-border/60 bg-card",
};

const URGENCY_DOT: Record<"crit" | "warn" | "ok", string> = {
  crit: "bg-red-500", warn: "bg-amber-500", ok: "bg-emerald-500",
};

/* ============ page ============ */

export default function OSIntakeCoordinator() {
  const navigate = useNavigate();
  const { role, scope, activeState } = useOSRole();
  const { leads, loading, error, refresh } = useLeads();
  const [query, setQuery] = useState("");

  // Role scoping — state directors only see their state.
  const scoped = useMemo(() => {
    let pool = leads;
    if (scope === "state" && activeState) {
      pool = pool.filter((l) => (l.state || "").toUpperCase() === activeState);
    }
    return pool;
  }, [leads, scope, activeState]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return scoped;
    return scoped.filter((l) =>
      [l.parentName, l.childName, l.phone, l.email, l.insurance, l.owner, l.status]
        .join(" ").toLowerCase().includes(q),
    );
  }, [scoped, query]);

  const kpis = useMemo(() => calculateKpis(filtered), [filtered]);

  // Operational buckets
  const attention = useMemo(() => {
    return filtered
      .filter((l) => URGENCY_ROW(l) !== "ok")
      .sort((a, b) => {
        const av = URGENCY_ROW(a) === "crit" ? 0 : 1;
        const bv = URGENCY_ROW(b) === "crit" ? 0 : 1;
        if (av !== bv) return av - bv;
        return (b.daysInStage ?? 0) - (a.daysInStage ?? 0);
      })
      .slice(0, 8);
  }, [filtered]);

  const followups = useMemo(() => {
    const dueToday = filtered.filter((l) => !l.lastContacted && l.status === "New Lead").slice(0, 30);
    const overdue = filtered.filter((l) =>
      ["Sent Form", "Missing Information"].includes(l.status) && (l.daysInStage ?? 0) >= 3,
    ).slice(0, 30);
    const waitingParent = filtered.filter((l) =>
      ["Sent Form", "Missing Information", "Sent Packet - Can't Reach"].includes(l.status),
    ).slice(0, 30);
    const waitingVob = filtered.filter((l) => l.status === "Sent to VOB").slice(0, 30);
    const finalAttempts = filtered.filter((l) =>
      ["Can't Reach", "Sent Packet - Can't Reach"].includes(l.status),
    ).slice(0, 30);
    return { dueToday, overdue, waitingParent, waitingVob, finalAttempts };
  }, [filtered]);

  // Pipeline snapshot
  const pipeline = useMemo(() => {
    return STAGES.map((s) => {
      const items = filtered.filter((l) => l.status === s.id);
      const stalled = items.filter((l) => (l.daysInStage ?? 0) >= 3).length;
      return { ...s, count: items.length, stalled };
    });
  }, [filtered]);

  // Daily priorities (concise list)
  const priorities = useMemo(() => {
    const items: { count: number; label: string; tone: "crit" | "warn" | "ok"; to: string }[] = [
      { count: kpis.notContacted, label: "Leads not yet contacted", tone: kpis.notContacted > 0 ? "crit" : "ok", to: "/leads" },
      { count: kpis.missingInfo,  label: "Missing information",     tone: kpis.missingInfo > 0 ? "crit" : "ok", to: "/leads" },
      { count: kpis.sentVob,      label: "VOBs pending response",   tone: kpis.sentVob > 0 ? "warn" : "ok", to: "/leads" },
      { count: kpis.sentForm,     label: "Forms awaiting parents",  tone: kpis.sentForm > 0 ? "warn" : "ok", to: "/leads" },
      { count: kpis.vobCompleted, label: "Ready to move to Clients", tone: kpis.vobCompleted > 0 ? "warn" : "ok", to: "/leads" },
      { count: kpis.cantReach,    label: "Final-attempt outreach",   tone: kpis.cantReach > 0 ? "warn" : "ok", to: "/leads" },
    ];
    return items.filter((i) => i.count > 0).slice(0, 6);
  }, [kpis]);

  // Recent activity from timeline + automation
  const activity = useMemo(() => {
    const events: { id: string; who: string; what: string; when: string; tone: string }[] = [];
    for (const l of filtered) {
      const ev = l.timeline?.[0];
      if (ev) events.push({
        id: `${l.id}-${ev.id}`,
        who: l.parentName || l.childName || "—",
        what: ev.description,
        when: ev.timestamp,
        tone: "os-tone-sky",
      });
    }
    return events
      .sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime())
      .slice(0, 8);
  }, [filtered]);

  /* ============ render ============ */

  return (
    <OSShell rightRail={
      <RightRail
        priorities={priorities}
        kpis={kpis}
        attentionCount={attention.length}
      />
    }>
      <div className="min-w-0 space-y-8">
        <Header
          loading={loading}
          query={query}
          onQuery={setQuery}
          onRefresh={refresh}
          onAddLead={() => navigate("/leads")}
          onOpenQueue={() => navigate("/leads")}
        />

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            Could not load Monday intake board: {error}
          </div>
        )}

        <KpiRow kpis={kpis} loading={loading && leads.length === 0} />

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_1fr]">
          <AttentionSection items={attention} loading={loading && leads.length === 0} />
          <FollowupsSection buckets={followups} loading={loading && leads.length === 0} />
        </section>

        <PipelineSection pipeline={pipeline} total={filtered.length} />

        <ActivitySection activity={activity} loading={loading && leads.length === 0} />
      </div>
    </OSShell>
  );
}

/* ============ header ============ */

function Header({
  loading, query, onQuery, onRefresh, onAddLead, onOpenQueue,
}: {
  loading: boolean;
  query: string;
  onQuery: (v: string) => void;
  onRefresh: () => void;
  onAddLead: () => void;
  onOpenQueue: () => void;
}) {
  return (
    <header>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Intake · Operations Workspace
          </p>
          <h1 className="mt-1.5 text-[26px] font-semibold tracking-tight text-foreground md:text-[30px]">
            Intake Dashboard
          </h1>
          <p className="mt-1 max-w-2xl text-[13.5px] text-muted-foreground">
            Manage leads, forms, VOB handoffs, and intake workflow progress.
          </p>
        </div>
        <div className="hidden gap-2 md:flex">
          <Button size="sm" variant="outline" className="rounded-full" onClick={onRefresh}>
            {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1.5 h-3.5 w-3.5" />}
            Refresh
          </Button>
          <Button size="sm" variant="outline" className="rounded-full" onClick={() => toast.message("Coming soon: send intake packet")}>
            <Send className="mr-1.5 h-3.5 w-3.5" /> Send Intake Packet
          </Button>
          <Button size="sm" variant="outline" className="rounded-full" onClick={() => toast.message("Coming soon: create follow-up")}>
            <FilePlus2 className="mr-1.5 h-3.5 w-3.5" /> Follow-Up
          </Button>
          <Button size="sm" className="rounded-full" onClick={onAddLead}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Lead
          </Button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="relative max-w-xl flex-1">
          <Search className="pointer-events-none absolute z-10 left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search families, leads, insurance, phone numbers…"
            className="os-glass-input h-11 rounded-2xl pl-11 text-[13.5px]"
          />
        </div>
        <Button size="sm" variant="ghost" className="rounded-full" onClick={onOpenQueue}>
          Open Intake Queue <ChevronRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </div>
    </header>
  );
}

/* ============ KPI row ============ */

function KpiRow({ kpis, loading }: { kpis: ReturnType<typeof calculateKpis>; loading: boolean }) {
  const cards = [
    { label: "New Leads",          value: kpis.newToday,     icon: UserPlus,       tone: "ok" as const, to: "/leads" },
    { label: "Follow-Ups Due",     value: kpis.notContacted, icon: Phone,          tone: kpis.notContacted > 0 ? "warn" as const : "ok" as const, to: "/leads" },
    { label: "Forms Missing",      value: kpis.missingInfo,  icon: FileX2,         tone: kpis.missingInfo > 0 ? "crit" as const : "ok" as const, to: "/leads" },
    { label: "VOB Pending",        value: kpis.sentVob,      icon: Hourglass,      tone: kpis.sentVob > 0 ? "warn" as const : "ok" as const, to: "/leads" },
    { label: "Ready for Setup",    value: kpis.vobCompleted, icon: CheckCircle2,   tone: kpis.vobCompleted > 0 ? "warn" as const : "ok" as const, to: "/leads" },
    { label: "Cannot Reach",       value: kpis.cantReach,    icon: PhoneOff,       tone: kpis.cantReach > 0 ? "warn" as const : "ok" as const, to: "/leads" },
  ];
  return (
    <section className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-6">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Link
            key={c.label}
            to={c.to}
            className="group rounded-2xl border border-border/70 bg-card p-3.5 transition-all hover:-translate-y-0.5 hover:border-border"
          >
            <div className="flex items-center justify-between">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-muted text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className={cn("h-1.5 w-1.5 rounded-full",
                c.tone === "crit" ? "bg-red-500" : c.tone === "warn" ? "bg-amber-500" : "bg-emerald-500")} />
            </div>
            <p className="mt-2 text-[22px] font-semibold tabular-nums tracking-tight">
              {loading ? "—" : c.value}
            </p>
            <p className="text-[11.5px] text-muted-foreground">{c.label}</p>
          </Link>
        );
      })}
    </section>
  );
}

/* ============ attention required ============ */

function AttentionSection({ items, loading }: { items: Lead[]; loading: boolean }) {
  return (
    <section>
      <SectionHeader
        title="Attention Required"
        subtitle="Leads that need action right now."
        right={<Badge variant="outline" className="rounded-full text-[10.5px]">{items.length}</Badge>}
      />
      {loading ? (
        <SkeletonRow count={3} h="h-[88px]" />
      ) : items.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="You're all caught up." subtitle="No leads currently require attention." />
      ) : (
        <div className="space-y-2.5">
          {items.map((lead) => <AttentionCard key={lead.id} lead={lead} />)}
        </div>
      )}
    </section>
  );
}

function AttentionCard({ lead }: { lead: Lead }) {
  const urgency = URGENCY_ROW(lead);
  const alert = getInlineAlert(lead);
  return (
    <Link
      to={`/leads/${lead.id}`}
      className={cn("group block rounded-2xl border p-4 transition-all hover:-translate-y-0.5", URGENCY_TONE[urgency])}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted text-[11px] font-semibold text-muted-foreground">
            {initials(lead.parentName || lead.childName || "—")}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-[14px] font-semibold">
                {lead.parentName || lead.childName || "Unknown family"}
              </p>
              <span className={cn("h-1.5 w-1.5 rounded-full", URGENCY_DOT[urgency])} />
              <span className="text-[11.5px] text-muted-foreground">{lead.status}</span>
            </div>
            <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
              {[lead.childName && `Child · ${lead.childName}`, lead.insurance || "No insurance on file", lead.state]
                .filter(Boolean).join(" · ")}
            </p>
            {alert && (
              <p className={cn("mt-1.5 inline-flex items-center gap-1 text-[11.5px] font-medium",
                alert.type === "red" ? "text-red-600" : "text-amber-700")}>
                <AlertCircle className="h-3 w-3" /> {alert.message}
              </p>
            )}
          </div>
        </div>
        <div className="hidden shrink-0 text-right md:block">
          <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">Owner</p>
          <p className="text-[12px] font-medium">{lead.owner || "Unassigned"}</p>
          <p className="mt-1 text-[10.5px] text-muted-foreground">
            {lead.daysInStage ?? 0}d in stage
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-3">
        <p className="text-[12px] text-foreground/80">
          <span className="text-muted-foreground">Next · </span>{lead.nextAction}
        </p>
        <div className="flex items-center gap-1">
          <QuickAction icon={Phone}        label="Call"    onClick={(e) => { stop(e); toast.message(`Call ${lead.phone || "—"}`); }} />
          <QuickAction icon={MessageSquare} label="Text"   onClick={(e) => { stop(e); toast.message(`Text ${lead.phone || "—"}`); }} />
          <QuickAction icon={Mail}         label="Email"   onClick={(e) => { stop(e); toast.message(`Email ${lead.email || "—"}`); }} />
          <QuickAction icon={StickyNote}   label="Note"    onClick={(e) => { stop(e); toast.message("Add a note"); }} />
          <span className="ml-1 inline-flex items-center text-[11.5px] font-medium text-primary">
            Open <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function stop(e: React.MouseEvent) { e.preventDefault(); e.stopPropagation(); }

function QuickAction({ icon: Icon, label, onClick }: {
  icon: React.ElementType; label: string; onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

/* ============ follow-ups ============ */

function FollowupsSection({
  buckets, loading,
}: {
  buckets: { dueToday: Lead[]; overdue: Lead[]; waitingParent: Lead[]; waitingVob: Lead[]; finalAttempts: Lead[] };
  loading: boolean;
}) {
  const tabs: { id: keyof typeof buckets; label: string }[] = [
    { id: "dueToday", label: "Due Today" },
    { id: "overdue", label: "Overdue" },
    { id: "waitingParent", label: "Waiting on Parent" },
    { id: "waitingVob", label: "Waiting on VOB" },
    { id: "finalAttempts", label: "Final Attempts" },
  ];
  return (
    <section>
      <SectionHeader title="My Follow-Ups" subtitle="Your operational inbox." />
      <div className="rounded-2xl border border-border/70 bg-card p-4">
        <Tabs defaultValue="dueToday" className="w-full">
          <TabsList className="flex w-full flex-wrap justify-start gap-1 bg-transparent p-0">
            {tabs.map((t) => (
              <TabsTrigger
                key={t.id}
                value={t.id}
                className="rounded-full border border-transparent px-3 py-1 text-[12px] data-[state=active]:border-border/60 data-[state=active]:bg-muted/40 data-[state=active]:text-foreground"
              >
                {t.label} <span className="ml-1.5 text-muted-foreground">{buckets[t.id].length}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((t) => (
            <TabsContent key={t.id} value={t.id} className="mt-3">
              {loading ? (
                <SkeletonRow count={3} h="h-[56px]" />
              ) : buckets[t.id].length === 0 ? (
                <EmptyState icon={Inbox} title="Nothing here." subtitle="Inbox zero for this bucket." compact />
              ) : (
                <div className="space-y-1">
                  {buckets[t.id].slice(0, 8).map((l) => <FollowupRow key={l.id} lead={l} />)}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}

function FollowupRow({ lead }: { lead: Lead }) {
  const urgency = URGENCY_ROW(lead);
  return (
    <Link
      to={`/leads/${lead.id}`}
      className="group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted/40"
    >
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", URGENCY_DOT[urgency])} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium">{lead.parentName || lead.childName || "—"}</p>
        <p className="truncate text-[11px] text-muted-foreground">
          {lead.status} · {lead.insurance || "No insurance"} · last contact {fmtAgo(lead.lastContacted ?? lead.createdAt)}
        </p>
      </div>
      <span className="hidden shrink-0 text-[10.5px] text-muted-foreground sm:inline">{lead.owner || "Unassigned"}</span>
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

/* ============ pipeline snapshot ============ */

function PipelineSection({ pipeline, total }: { pipeline: { id: LeadStatus; label: string; count: number; stalled: number }[]; total: number }) {
  const max = Math.max(1, ...pipeline.map((s) => s.count));
  return (
    <section>
      <SectionHeader
        title="Pipeline Snapshot"
        subtitle={`${total.toLocaleString()} leads in your view.`}
        right={
          <Link to="/leads" className="text-[11.5px] font-medium text-primary hover:underline">
            Open pipeline <ChevronRight className="inline h-3 w-3" />
          </Link>
        }
      />
      <div className="rounded-2xl border border-border/70 bg-card p-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {pipeline.map((s) => (
            <Link
              key={s.id}
              to={`/leads?status=${encodeURIComponent(s.id)}`}
              className="group rounded-xl border border-border/60 px-3 py-2.5 transition-all hover:-translate-y-0.5 hover:border-border"
            >
              <p className="text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <div className="mt-1 flex items-baseline justify-between">
                <p className="text-[18px] font-semibold tabular-nums">{s.count}</p>
                {s.stalled > 0 && (
                  <span className="text-[10.5px] font-medium text-amber-600">{s.stalled} stuck</span>
                )}
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary/70" style={{ width: `${(s.count / max) * 100}%` }} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============ activity ============ */

function ActivitySection({ activity, loading }: { activity: { id: string; who: string; what: string; when: string; tone: string }[]; loading: boolean }) {
  return (
    <section>
      <SectionHeader title="Recent Activity" subtitle="Live operational feed." />
      <div className="rounded-2xl border border-border/70 bg-card p-2">
        {loading ? (
          <SkeletonRow count={3} h="h-[44px]" />
        ) : activity.length === 0 ? (
          <EmptyState icon={Activity} title="No recent activity yet." subtitle="Updates from Monday will appear here." compact />
        ) : (
          <ul className="divide-y divide-border/40">
            {activity.map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-3 py-2.5">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-muted text-muted-foreground">
                  <Activity className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px]">
                    <span className="font-medium">{a.who}</span>
                    <span className="text-muted-foreground"> · {a.what}</span>
                  </p>
                </div>
                <span className="shrink-0 text-[11px] text-muted-foreground">{fmtAgo(a.when)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/* ============ right rail ============ */

function RightRail({
  priorities, kpis, attentionCount,
}: {
  priorities: { count: number; label: string; tone: "crit" | "warn" | "ok"; to: string }[];
  kpis: ReturnType<typeof calculateKpis>;
  attentionCount: number;
}) {
  const aiInsights = [
    kpis.notContacted > 0 && {
      icon: AlertCircle, tone: "text-red-500" as const,
      title: `${kpis.notContacted} lead${kpis.notContacted === 1 ? "" : "s"} awaiting first contact`,
      body: "Prioritize these before end of day to protect conversion.",
    },
    kpis.sentVob > 0 && {
      icon: Hourglass, tone: "text-amber-500" as const,
      title: `${kpis.sentVob} VOB${kpis.sentVob === 1 ? "" : "s"} pending`,
      body: "Consider pinging the VOB team on anything over 3 days old.",
    },
    kpis.vobCompleted > 0 && {
      icon: CheckCircle2, tone: "text-emerald-500" as const,
      title: `${kpis.vobCompleted} ready to move to Clients`,
      body: "Handoff to client setup to keep the pipeline flowing.",
    },
    attentionCount === 0 && {
      icon: Sparkles, tone: "text-primary" as const,
      title: "All clear",
      body: "No urgent follow-ups detected in your view.",
    },
  ].filter(Boolean) as { icon: React.ElementType; tone: string; title: string; body: string }[];

  const prompts = [
    "Which leads are stuck?",
    "Summarize today's priorities",
    "Find missing forms",
    "Show overdue follow-ups",
    "Summarize VOB risks",
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/70 bg-card p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-[hsl(265_70%_55%)]" />
          <h3 className="text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">Ask Blossom AI</h3>
        </div>
        <div className="mt-3 space-y-1">
          {prompts.map((p) => (
            <Link
              key={p}
              to={`/ai/assistant?q=${encodeURIComponent(p)}`}
              className="flex items-center justify-between rounded-lg px-2 py-1.5 text-[12px] hover:bg-muted/50"
            >
              <span>{p}</span>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
            </Link>
          ))}
        </div>
        {aiInsights.length > 0 && (
          <div className="mt-3 space-y-2 border-t border-border/40 pt-3">
            {aiInsights.slice(0, 3).map((i, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <i.icon className={cn("mt-0.5 h-3.5 w-3.5", i.tone)} />
                <div className="min-w-0">
                  <p className="text-[12px] font-medium">{i.title}</p>
                  <p className="text-[11px] text-muted-foreground">{i.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border/70 bg-card p-4">
        <h3 className="text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">Today's Priorities</h3>
        {priorities.length === 0 ? (
          <p className="mt-3 text-[12px] text-muted-foreground">Nothing urgent — enjoy the calm.</p>
        ) : (
          <ul className="mt-3 space-y-1">
            {priorities.map((p) => (
              <li key={p.label}>
                <Link to={p.to} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-[12px] hover:bg-muted/50">
                  <span className="flex items-center gap-2">
                    <span className={cn("h-1.5 w-1.5 rounded-full",
                      p.tone === "crit" ? "bg-red-500" : p.tone === "warn" ? "bg-amber-500" : "bg-emerald-500")} />
                    <span className="font-medium tabular-nums">{p.count}</span>
                    <span className="text-muted-foreground">{p.label}</span>
                  </span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-border/70 bg-card p-4">
        <h3 className="text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">Quick Actions</h3>
        <div className="mt-3 grid grid-cols-2 gap-1.5">
          <QuickLink to="/leads" icon={ClipboardList} label="Intake Queue" />
          <QuickLink to="/vob"   icon={ShieldCheck}   label="VOB Center" />
          <QuickLink to="/sop"   icon={FileText}      label="SOPs" />
          <QuickLink to="/ai/assistant" icon={Sparkles} label="Ask AI" />
        </div>
      </div>
    </div>
  );
}

function QuickLink({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 rounded-lg border border-border/60 px-2 py-1.5 text-[11.5px] font-medium text-foreground/90 transition-colors hover:bg-muted/40"
    >
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

/* ============ utilities ============ */

function SectionHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-[16px] font-semibold tracking-tight text-foreground">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[12px] text-muted-foreground">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

function EmptyState({ icon: Icon, title, subtitle, compact }: { icon: React.ElementType; title: string; subtitle?: string; compact?: boolean }) {
  return (
    <div className={cn(
      "rounded-2xl border border-dashed border-border/60 bg-muted/20 text-center",
      compact ? "px-4 py-6" : "px-4 py-10",
    )}>
      <Icon className="mx-auto h-5 w-5 text-muted-foreground/70" />
      <p className="mt-2 text-[13px] font-medium">{title}</p>
      {subtitle && <p className="mt-0.5 text-[12px] text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function SkeletonRow({ count = 3, h = "h-[60px]" }: { count?: number; h?: string }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn("animate-pulse rounded-xl bg-muted/40", h)} />
      ))}
    </div>
  );
}
