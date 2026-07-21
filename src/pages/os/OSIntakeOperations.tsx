import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search, Plus, Send, ShieldCheck, ClipboardList, Sparkles, Phone, Mail,
  MessageSquare, StickyNote, AlertTriangle, ChevronRight, Loader2, RefreshCw,
  CalendarClock, FileWarning, FileCheck2, UserCheck, Users, Activity,
  ArrowUpRight, CircleDot, BellRing, ListTodo, Wand2, X, Flag, BookOpen, Clock,
  TrendingUp, Inbox, PhoneCall, FileText, Stethoscope, Heart, Zap,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";
import { OSShell } from "./OSShell";
import { useLeads } from "@/contexts/LeadsContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { scopeLeadsForUser } from "@/lib/leads/scoping";
import {
  getReadinessStatus, getBlockers, primaryBlocker, getUrgency,
  READINESS_STAGES, READINESS_TONE, type BlockerKey,
} from "@/lib/leads/readiness";
import { LeadDetailDrawer } from "@/components/leads/LeadDetailDrawer";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Lead } from "@/data/leads";
import { IntakeModalsProvider, useIntakeModals } from "@/components/intake/IntakeModals";

/* ─────────────────────── helpers ─────────────────────── */

function relTime(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  const day = 86_400_000;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m`;
  if (diff < day) return `${Math.round(diff / 3_600_000)}h`;
  if (diff < 30 * day) return `${Math.round(diff / day)}d`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function urgencyDot(u: "low" | "medium" | "high") {
  return (
    <span
      className={cn(
        "inline-block h-1.5 w-1.5 rounded-full",
        u === "high" ? "bg-destructive" : u === "medium" ? "bg-amber-500" : "bg-emerald-500",
      )}
    />
  );
}

/* ─────────────────────── page ─────────────────────── */

interface OSIntakeOperationsProps {
  title?: string;
  subtitle?: string;
}

export default function OSIntakeOperations({
  title = "Leads",
  subtitle = "Manage family onboarding and intake readiness from inquiry to operational handoff.",
}: OSIntakeOperationsProps = {}) {
  return (
    <IntakeModalsProvider>
      <OSIntakeOperationsInner title={title} subtitle={subtitle} />
    </IntakeModalsProvider>
  );
}

function OSIntakeOperationsInner({ title, subtitle }: Required<OSIntakeOperationsProps>) {
  const { leads, loading, error, refresh, updateLead } = useLeads();
  const { user, roles } = useAuth();
  const [profileState, setProfileState] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [openLeadId, setOpenLeadId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const modals = useIntakeModals();

  const filterKey = searchParams.get("filter");
  const stageKey = searchParams.get("stage");
  const blockerKey = searchParams.get("blocker");
  const queueKey = searchParams.get("queue");
  const aiQuery = searchParams.get("q");

  // Apply the AI prompt deep-link by redirecting (handled by NavLink). Nothing to do here.
  void aiQuery;

  useEffect(() => {
    if (!user?.id) return;
    supabase.from("profiles")
      .select("state, display_name")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setProfileState((data?.state as string) ?? null);
        setDisplayName((data?.display_name as string) ?? null);
      });
  }, [user?.id]);

  const scopedLeads = useMemo(
    () => scopeLeadsForUser(leads, { state: profileState, displayName, roles: roles as string[] }),
    [leads, profileState, displayName, roles],
  );

  // URL-driven filter (KPI, pipeline stage, blocker, queue) applied on top of scope.
  const filteredByUrl = useMemo(() => {
    let out = scopedLeads;
    if (filterKey) {
      const fn = FILTER_PREDICATES[filterKey];
      if (fn) out = out.filter(fn);
    }
    if (stageKey) {
      const stage = READINESS_STAGES.find((s) => s.key === stageKey);
      if (stage) out = out.filter(stage.match);
    }
    if (blockerKey) {
      const tile = MISSING_TILES.find((t) => t.key === blockerKey);
      if (tile) out = out.filter(tile.match);
    }
    if (queueKey) {
      const q = QUEUES.find((qq) => qq.key === queueKey);
      if (q) out = out.filter(q.match);
    }
    return out;
  }, [scopedLeads, filterKey, stageKey, blockerKey, queueKey]);

  const activeFilterChip = useMemo(() => {
    if (filterKey && FILTER_LABELS[filterKey]) return FILTER_LABELS[filterKey];
    if (stageKey) return READINESS_STAGES.find((s) => s.key === stageKey)?.label;
    if (blockerKey) return MISSING_TILES.find((t) => t.key === blockerKey)?.label;
    if (queueKey) return QUEUES.find((q) => q.key === queueKey)?.label;
    return null;
  }, [filterKey, stageKey, blockerKey, queueKey]);

  const clearFilters = () => {
    const next = new URLSearchParams(searchParams);
    ["filter", "stage", "blocker", "queue"].forEach((k) => next.delete(k));
    setSearchParams(next, { replace: true });
  };

  const visibleLeads = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return filteredByUrl;
    return filteredByUrl.filter((l) =>
      [l.childName, l.parentName, l.phone, l.email, l.primaryInsurance, l.state]
        .map((s) => String(s ?? "").toLowerCase())
        .join(" ")
        .includes(q),
    );
  }, [filteredByUrl, query]);

  const setFilter = (key: string) => {
    const next = new URLSearchParams(searchParams);
    ["filter", "stage", "blocker", "queue"].forEach((k) => next.delete(k));
    next.set("filter", key);
    setSearchParams(next, { replace: false });
  };
  const setStage = (key: string) => {
    const next = new URLSearchParams(searchParams);
    ["filter", "stage", "blocker", "queue"].forEach((k) => next.delete(k));
    next.set("stage", key);
    setSearchParams(next, { replace: false });
  };
  const setBlocker = (key: string) => {
    const next = new URLSearchParams(searchParams);
    ["filter", "stage", "blocker", "queue"].forEach((k) => next.delete(k));
    next.set("blocker", key);
    setSearchParams(next, { replace: false });
  };

  return (
    <OSShell rightRail={<AskBlossomIntakeRail leads={visibleLeads} onOpen={setOpenLeadId} />}>
      <div className="space-y-10 pb-12">
        {/* Header */}
        <header className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-xl">{subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/vob-decision-center"><ShieldCheck className="mr-1.5 h-4 w-4" /> Open VOB Center</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/resource-library?category=intake"><BookOpen className="mr-1.5 h-4 w-4" /> Open SOPs</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => modals.open({ kind: "sendPacket" })}>
              <Send className="mr-1.5 h-4 w-4" /> Send Intake Packet
            </Button>
            <Button variant="ghost" size="sm" onClick={() => modals.open({ kind: "followUp" })}>
              <CalendarClock className="mr-1.5 h-4 w-4" /> Create Follow-Up
            </Button>
            <Button variant="ghost" size="sm" onClick={() => modals.open({ kind: "note" })}>
              <StickyNote className="mr-1.5 h-4 w-4" /> Add Note
            </Button>
            <Button size="sm" asChild>
              <Link to="/leads?new=1"><Plus className="mr-1.5 h-4 w-4" /> Add Lead</Link>
            </Button>
          </div>
        </header>

        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search family, patient, insurance, phone, email…"
            className="h-11 w-full rounded-xl bg-muted/60 border border-border pl-10 pr-4 text-sm placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-ring focus:border-transparent transition outline-none"
          />
        </div>

        {activeFilterChip && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Filtered by</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 px-2.5 h-7 font-medium">
              {activeFilterChip}
              <span className="text-primary/70 tabular-nums">· {filteredByUrl.length}</span>
              <button onClick={clearFilters} className="ml-0.5 rounded-full hover:bg-primary/10" aria-label="Clear filter">
                <X className="h-3 w-3" />
              </button>
            </span>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive flex gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5" /> {error}
          </div>
        )}

        {loading && leads.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-card p-12 text-center">
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Loading families…</p>
          </div>
        ) : (
          <>
            <IntakePulse leads={scopedLeads} onRefresh={refresh} loading={loading} onFilter={setFilter} active={filterKey} />
            <IntakeCharts leads={scopedLeads} onFilter={setFilter} onStage={setStage} />
            <FamiliesNeedingAction
              leads={visibleLeads}
              onOpen={setOpenLeadId}
              onMarkPacketSent={(id) => { updateLead(id, { formStatus: "Sent" }); toast.success("Intake packet marked sent"); }}
            />
            <DailyFollowUps leads={scopedLeads} onOpen={setOpenLeadId} initialQueue={queueKey as QueueKey | null} />
            <AssessmentCoordination leads={visibleLeads} onOpen={setOpenLeadId} />
            <MissingInfoCenter leads={scopedLeads} onOpen={setOpenLeadId} onFilter={setBlocker} active={blockerKey} />
            <ServiceReadinessPipeline leads={scopedLeads} onOpen={setOpenLeadId} onFilter={setStage} active={stageKey} />
            <RecentActivityFeed leads={visibleLeads} onOpen={setOpenLeadId} />
          </>
        )}
      </div>

      {openLeadId && (
        <LeadDetailDrawer leadId={openLeadId} onClose={() => setOpenLeadId(null)} />
      )}
    </OSShell>
  );
}

/* ─────────────────────── KPI filter predicates ─────────────────────── */

const FILTER_PREDICATES: Record<string, (l: Lead) => boolean> = {
  new_inquiries: (l) => l.status === "New Lead",
  awaiting_contact: (l) => getReadinessStatus(l) === "Awaiting Contact",
  missing_info: (l) => l.status === "Missing Information" || l.formReviewStatus === "Missing Information",
  vob_pending: (l) => l.status === "Sent to VOB" || l.vobStatus === "Sent",
  assessment: (l) => l.status === "Getting DX" || l.status === "Needs DX",
  ready: (l) => getReadinessStatus(l) === "Operationally Ready",
};
const FILTER_LABELS: Record<string, string> = {
  new_inquiries: "New Inquiries",
  awaiting_contact: "Awaiting Contact",
  missing_info: "Missing Information",
  vob_pending: "VOB Pending",
  assessment: "Assessment Coordination",
  ready: "Ready for Next Step",
};

/* ─────────────────────── Intake Pulse ─────────────────────── */

function IntakePulse({
  leads, onRefresh, loading, onFilter, active,
}: {
  leads: Lead[]; onRefresh: () => void; loading: boolean;
  onFilter: (key: string) => void; active: string | null;
}) {
  const pulse = useMemo(() => {
    const c = {
      new: 0, awaiting_contact: 0, missing_info: 0, vob_pending: 0,
      assessment: 0, ready: 0,
    };
    for (const l of leads) {
      const r = getReadinessStatus(l);
      if (l.status === "New Lead") c.new++;
      if (r === "Awaiting Contact") c.awaiting_contact++;
      if (l.status === "Missing Information" || l.formReviewStatus === "Missing Information") c.missing_info++;
      if (l.status === "Sent to VOB" || l.vobStatus === "Sent") c.vob_pending++;
      if (l.status === "Getting DX" || l.status === "Needs DX") c.assessment++;
      if (r === "Operationally Ready") c.ready++;
    }
    return c;
  }, [leads]);

  const pills: {
    key: string; label: string; value: number; icon: any;
    tone: "sky" | "amber" | "rose" | "violet" | "indigo" | "emerald";
  }[] = [
    { key: "new_inquiries",    label: "New Inquiries",       value: pulse.new,              icon: Inbox,        tone: "sky" },
    { key: "awaiting_contact", label: "Awaiting Contact",    value: pulse.awaiting_contact, icon: PhoneCall,    tone: "amber" },
    { key: "missing_info",     label: "Missing Information", value: pulse.missing_info,     icon: FileWarning,  tone: "rose" },
    { key: "vob_pending",      label: "VOB Pending",         value: pulse.vob_pending,      icon: ShieldCheck,  tone: "violet" },
    { key: "assessment",       label: "Assessment Coord.",   value: pulse.assessment,       icon: Stethoscope,  tone: "indigo" },
    { key: "ready",            label: "Ready for Next Step", value: pulse.ready,            icon: Heart,        tone: "emerald" },
  ];

  const toneClass: Record<string, { bg: string; ring: string; icon: string; number: string; bar: string }> = {
    sky:     { bg: "bg-sky-500/[0.06]",     ring: "ring-sky-500/30",     icon: "bg-sky-500/15 text-sky-600 dark:text-sky-400",         number: "text-sky-700 dark:text-sky-300",         bar: "bg-sky-500" },
    amber:   { bg: "bg-amber-500/[0.06]",   ring: "ring-amber-500/30",   icon: "bg-amber-500/15 text-amber-600 dark:text-amber-400",   number: "text-amber-700 dark:text-amber-300",     bar: "bg-amber-500" },
    rose:    { bg: "bg-rose-500/[0.06]",    ring: "ring-rose-500/30",    icon: "bg-rose-500/15 text-rose-600 dark:text-rose-400",      number: "text-rose-700 dark:text-rose-300",       bar: "bg-rose-500" },
    violet:  { bg: "bg-violet-500/[0.06]",  ring: "ring-violet-500/30",  icon: "bg-violet-500/15 text-violet-600 dark:text-violet-400", number: "text-violet-700 dark:text-violet-300",   bar: "bg-violet-500" },
    indigo:  { bg: "bg-indigo-500/[0.06]",  ring: "ring-indigo-500/30",  icon: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400", number: "text-indigo-700 dark:text-indigo-300",   bar: "bg-indigo-500" },
    emerald: { bg: "bg-emerald-500/[0.06]", ring: "ring-emerald-500/30", icon: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400", number: "text-emerald-700 dark:text-emerald-300", bar: "bg-emerald-500" },
  };

  const total = pills.reduce((s, p) => s + p.value, 0) || 1;

  return (
    <section>
      <SectionHeader
        icon={Zap}
        tone="primary"
        title="Intake Pulse"
        subtitle="Live snapshot of today's intake — tap a tile to drill in."
        right={
          <button onClick={onRefresh} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} /> Refresh
          </button>
        }
      />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {pills.map((p) => {
          const t = toneClass[p.tone];
          const pct = Math.round((p.value / total) * 100);
          return (
            <button
              key={p.label}
              onClick={() => onFilter(p.key)}
              className={cn(
                "group text-left rounded-2xl border border-border/70 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm",
                t.bg,
                active === p.key && `ring-2 ${t.ring} border-transparent`,
              )}
            >
              <div className="flex items-center justify-between">
                <div className={cn("grid place-items-center h-8 w-8 rounded-xl", t.icon)}>
                  <p.icon className="h-4 w-4" />
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-foreground transition" />
              </div>
              <p className="mt-3 text-[11px] uppercase tracking-wide text-muted-foreground">{p.label}</p>
              <p className={cn("mt-1 text-2xl font-semibold tabular-nums", t.number)}>
                {p.value.toLocaleString()}
              </p>
              <div className="mt-2 h-1 rounded-full bg-muted/60 overflow-hidden">
                <div className={cn("h-full rounded-full transition-all", t.bar)} style={{ width: `${Math.max(pct, 4)}%` }} />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ─────────────────────── Section Header ─────────────────────── */

function SectionHeader({
  icon: Icon, tone = "primary", title, subtitle, right,
}: {
  icon: any;
  tone?: "primary" | "sky" | "amber" | "rose" | "violet" | "indigo" | "emerald";
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    sky:     "bg-sky-500/15 text-sky-600 dark:text-sky-400",
    amber:   "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    rose:    "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    violet:  "bg-violet-500/15 text-violet-600 dark:text-violet-400",
    indigo:  "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
    emerald: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  };
  return (
    <div className="flex items-end justify-between gap-3 mb-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn("grid place-items-center h-9 w-9 rounded-xl shrink-0", tones[tone])}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight leading-tight">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

/* ─────────────────────── Intake Charts ─────────────────────── */

function IntakeCharts({
  leads, onFilter, onStage,
}: { leads: Lead[]; onFilter: (key: string) => void; onStage: (key: string) => void }) {
  // Funnel-by-stage bar chart (clickable → stage filter)
  const funnel = useMemo(
    () => READINESS_STAGES.map((s) => ({
      stage: s.label,
      key: s.key,
      count: leads.filter(s.match).length,
    })),
    [leads],
  );

  // Stage aging stacked bar (Fresh / Waiting / Overdue per readiness stage)
  const aging = useMemo(
    () => READINESS_STAGES.slice(0, 6).map((s) => {
      const items = leads.filter(s.match);
      return {
        stage: s.label.split(" ").slice(0, 2).join(" "),
        key: s.key,
        Fresh: items.filter((l) => (l.daysInStage ?? 0) <= 1).length,
        Waiting: items.filter((l) => (l.daysInStage ?? 0) > 1 && (l.daysInStage ?? 0) < 7).length,
        Overdue: items.filter((l) => (l.daysInStage ?? 0) >= 7).length,
      };
    }),
    [leads],
  );

  // Source mix donut → drill to filter where possible
  const sources = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of leads) {
      const src = (l.source || "Unknown").trim() || "Unknown";
      counts.set(src, (counts.get(src) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));
  }, [leads]);

  const PIE_COLORS = [
    "hsl(265 70% 55%)", "hsl(195 80% 50%)", "hsl(150 65% 45%)",
    "hsl(30 90% 55%)", "hsl(340 75% 55%)", "hsl(220 70% 55%)",
  ];

  const maxFunnel = Math.max(...funnel.map((f) => f.count), 1);

  return (
    <section>
      <SectionHeader
        icon={TrendingUp}
        tone="indigo"
        title="Pipeline Insights"
        subtitle="Click any bar or slice to drill into the matching families."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Funnel */}
        <article className="rounded-2xl border border-border/70 bg-card p-4">
          <div className="flex items-baseline justify-between mb-2">
            <p className="text-sm font-medium">Readiness Funnel</p>
            <p className="text-[11px] text-muted-foreground">Families per stage</p>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="stage"
                  width={130}
                  tick={{ fontSize: 10 }}
                  interval={0}
                />
                <Tooltip
                  wrapperStyle={{ fontSize: 12 }}
                  cursor={{ fill: "hsl(var(--muted) / 0.6)" }}
                />
                <Bar
                  dataKey="count"
                  radius={[0, 6, 6, 0]}
                  onClick={(d: any) => d?.key && onStage(d.key)}
                  className="cursor-pointer"
                >
                  {funnel.map((f, i) => (
                    <Cell
                      key={i}
                      fill={`hsl(${230 + i * 8} 70% ${50 + (f.count === maxFunnel ? 0 : 6)}%)`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Aging stacked */}
        <article className="rounded-2xl border border-border/70 bg-card p-4">
          <div className="flex items-baseline justify-between mb-2">
            <p className="text-sm font-medium">Stage Aging</p>
            <p className="text-[11px] text-muted-foreground">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 mr-1" />Fresh
              <span className="inline-block h-2 w-2 rounded-full bg-amber-500 ml-2 mr-1" />Waiting
              <span className="inline-block h-2 w-2 rounded-full bg-rose-500 ml-2 mr-1" />Overdue
            </p>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aging} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="stage" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} width={28} />
                <Tooltip wrapperStyle={{ fontSize: 12 }} cursor={{ fill: "hsl(var(--muted) / 0.6)" }} />
                <Bar dataKey="Fresh"   stackId="a" fill="hsl(150 65% 45%)" radius={[0, 0, 0, 0]} onClick={(d: any) => d?.key && onStage(d.key)} className="cursor-pointer" />
                <Bar dataKey="Waiting" stackId="a" fill="hsl(40 90% 55%)"  onClick={(d: any) => d?.key && onStage(d.key)} className="cursor-pointer" />
                <Bar dataKey="Overdue" stackId="a" fill="hsl(355 75% 55%)" radius={[6, 6, 0, 0]} onClick={(d: any) => d?.key && onStage(d.key)} className="cursor-pointer" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Source mix */}
        <article className="rounded-2xl border border-border/70 bg-card p-4">
          <div className="flex items-baseline justify-between mb-2">
            <p className="text-sm font-medium">Source Mix</p>
            <p className="text-[11px] text-muted-foreground">Top 6 attribution sources</p>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sources}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={84}
                  paddingAngle={2}
                  onClick={() => onFilter("new_inquiries")}
                  className="cursor-pointer"
                >
                  {sources.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
            {sources.map((s, i) => (
              <div key={s.name} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="truncate max-w-[100px]">{s.name}</span>
                <span className="tabular-nums text-foreground/80">{s.value}</span>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

/* ─────────────────────── Families Needing Action ─────────────────────── */

function FamiliesNeedingAction({
  leads, onOpen, onMarkPacketSent,
}: { leads: Lead[]; onOpen: (id: string) => void; onMarkPacketSent: (id: string) => void }) {
  const modals = useIntakeModals();
  const actionable = useMemo(() => {
    return leads
      .map((l) => ({ lead: l, blocker: primaryBlocker(l), urgency: getUrgency(l) }))
      .filter((x) => x.blocker)
      .sort((a, b) => {
        const w = { high: 0, medium: 1, low: 2 } as const;
        if (w[a.urgency] !== w[b.urgency]) return w[a.urgency] - w[b.urgency];
        return (b.lead.daysInStage || 0) - (a.lead.daysInStage || 0);
      })
      .slice(0, 8);
  }, [leads]);

  return (
    <section>
      <SectionHeader
        icon={AlertTriangle}
        tone="rose"
        title="Action Required"
        subtitle="Active blockers keeping families from service readiness."
        right={
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 h-7 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 tabular-nums">
            <BellRing className="h-3 w-3" /> {actionable.length} need attention
          </span>
        }
      />

      {actionable.length === 0 ? (
        <EmptyTile message="All caught up. No families are currently blocked." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {actionable.map(({ lead, blocker, urgency }) => (
            <article
              key={lead.id}
              className={cn(
                "group relative overflow-hidden rounded-2xl border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md",
                urgency === "high"   && "border-rose-500/30 bg-rose-500/[0.03]",
                urgency === "medium" && "border-amber-500/30 bg-amber-500/[0.03]",
                urgency === "low"    && "border-emerald-500/30 bg-emerald-500/[0.03]",
              )}
            >
              <div
                className={cn(
                  "absolute left-0 top-0 bottom-0 w-1",
                  urgency === "high"   && "bg-rose-500",
                  urgency === "medium" && "bg-amber-500",
                  urgency === "low"    && "bg-emerald-500",
                )}
              />
              <div className="flex items-start justify-between gap-3 pl-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 h-5 rounded-full",
                        urgency === "high"   && "bg-rose-500/15 text-rose-600 dark:text-rose-400",
                        urgency === "medium" && "bg-amber-500/15 text-amber-600 dark:text-amber-400",
                        urgency === "low"    && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
                      )}
                    >
                      {urgency}
                    </span>
                    <span className="text-[11px] uppercase tracking-wide text-muted-foreground truncate">
                      {blocker?.label}
                    </span>
                  </div>
                  <button
                    onClick={() => onOpen(lead.id)}
                    className="text-base font-medium text-left hover:text-primary transition"
                  >
                    {lead.parentName || lead.childName}
                  </button>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    Patient: {lead.childName} · {lead.state || "—"} · {lead.owner || "Unassigned"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] text-muted-foreground">Days waiting</p>
                  <p className={cn(
                    "text-2xl font-semibold tabular-nums leading-none mt-0.5",
                    urgency === "high"   && "text-rose-600 dark:text-rose-400",
                    urgency === "medium" && "text-amber-600 dark:text-amber-400",
                    urgency === "low"    && "text-emerald-600 dark:text-emerald-400",
                  )}>{lead.daysInStage ?? 0}</p>
                </div>
              </div>

              <div className="mt-3 ml-2 rounded-xl bg-background/60 border border-border/60 px-3 py-2 text-xs text-muted-foreground">
                {blocker?.reason} · Stage: <span className="text-foreground">{lead.status}</span>
              </div>

              <div className="mt-4 ml-2 flex flex-wrap items-center gap-1">
                <QuickAction icon={Phone} label="Call Parent" onClick={() => { void import("@/lib/integrations/communications/communicationAdapters").then(async (m) => m.notifyCommunicationResult(await m.callParent({ leadId: lead.id, phone: lead.phone, email: lead.email, parentName: lead.parentName, childName: lead.childName, state: lead.state }))); }} disabled={!lead.phone} />
                <QuickAction icon={MessageSquare} label="Text" onClick={() => modals.open({ kind: "comm", channel: "text", lead })} />
                <QuickAction icon={Mail} label="Email" onClick={() => modals.open({ kind: "comm", channel: "email", lead })} disabled={!lead.email} />
                <QuickAction icon={Send} label="Packet" onClick={() => onMarkPacketSent(lead.id)} />
                <QuickAction icon={StickyNote} label="Note" onClick={() => modals.open({ kind: "note", lead })} />
                <QuickAction icon={Flag} label="Escalate" onClick={() => modals.open({ kind: "escalate", lead })} />
                <button
                  onClick={() => onOpen(lead.id)}
                  className="ml-auto inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
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

function QuickAction({
  icon: Icon, label, onClick, disabled,
}: { icon: any; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1 h-8 rounded-full px-3 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition",
        disabled && "opacity-40 pointer-events-none",
      )}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

/* ─────────────────────── Daily Follow-Ups ─────────────────────── */

type QueueKey = "due_today" | "overdue" | "waiting_family" | "missing_docs" | "assessment" | "final_attempts" | "waiting_vob";

const QUEUES: { key: QueueKey; label: string; match: (l: Lead) => boolean }[] = [
  { key: "due_today", label: "Due Today", match: (l) => (l.daysInStage ?? 0) === 1 && l.status !== "VOB Completed" && l.status !== "Non-Qualified" },
  { key: "overdue", label: "Overdue", match: (l) => (l.daysInStage ?? 0) >= 3 && l.status !== "VOB Completed" && l.status !== "Non-Qualified" },
  { key: "waiting_family", label: "Waiting on Family", match: (l) => l.status === "Sent Form" || l.formStatus === "Sent" || l.formStatus === "Viewed" },
  { key: "missing_docs", label: "Missing Docs", match: (l) => l.status === "Missing Information" || l.formReviewStatus === "Missing Information" },
  { key: "assessment", label: "Assessment Coord.", match: (l) => l.status === "Getting DX" || l.status === "Needs DX" },
  { key: "final_attempts", label: "Final Attempts", match: (l) => (l.status === "Can't Reach" || l.status === "Sent Packet - Can't Reach") && (l.daysInStage ?? 0) >= 5 },
  { key: "waiting_vob", label: "Waiting on VOB", match: (l) => l.status === "Sent to VOB" || l.vobStatus === "Sent" },
];

function DailyFollowUps({
  leads, onOpen, initialQueue,
}: { leads: Lead[]; onOpen: (id: string) => void; initialQueue?: QueueKey | null }) {
  const [active, setActive] = useState<QueueKey>(initialQueue || "due_today");
  useEffect(() => { if (initialQueue) setActive(initialQueue); }, [initialQueue]);
  const modals = useIntakeModals();
  const counts = useMemo(() => {
    const c: Record<QueueKey, number> = {} as any;
    for (const q of QUEUES) c[q.key] = leads.filter(q.match).length;
    return c;
  }, [leads]);
  const activeQueue = QUEUES.find((q) => q.key === active)!;
  const rows = useMemo(
    () => leads.filter(activeQueue.match).sort((a, b) => (b.daysInStage ?? 0) - (a.daysInStage ?? 0)).slice(0, 12),
    [leads, activeQueue],
  );

  return (
    <section>
      <SectionHeader
        icon={CalendarClock}
        tone="amber"
        title="Daily Follow-Ups"
        subtitle="Today's queues, by what's due."
      />

      <div className="rounded-2xl border border-border/70 bg-card overflow-hidden">
        <div className="flex items-center gap-1 px-3 py-2 overflow-x-auto border-b border-border/60">
          {QUEUES.map((q) => (
            <button
              key={q.key}
              onClick={() => setActive(q.key)}
              className={cn(
                "h-8 px-3 rounded-lg text-xs font-medium whitespace-nowrap transition",
                active === q.key ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {q.label}
              <span className="ml-1.5 tabular-nums text-muted-foreground">{counts[q.key]}</span>
            </button>
          ))}
        </div>

        {rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Nothing in this queue.</div>
        ) : (
          <ul className="divide-y divide-border/50">
            {rows.map((l) => (
              <li
                key={l.id}
                onClick={() => onOpen(l.id)}
                className="px-5 py-3 hover:bg-muted/40 cursor-pointer flex items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {l.parentName || l.childName}
                    <span className="ml-2 text-xs text-muted-foreground font-normal">{l.childName}</span>
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {l.primaryInsurance || "No insurance"} · Last contact {relTime(l.lastContacted)} · {l.owner || "Unassigned"}
                  </p>
                </div>
                <span className={cn("text-[11px] px-2 py-0.5 rounded-full whitespace-nowrap", READINESS_TONE[getReadinessStatus(l)])}>
                  {getReadinessStatus(l)}
                </span>
                <div className="hidden md:flex items-center gap-0.5">
                  <IconBtn icon={Phone} onClick={(e) => { e.stopPropagation(); void import("@/lib/integrations/communications/communicationAdapters").then(async (m) => m.notifyCommunicationResult(await m.callParent({ leadId: l.id, phone: l.phone, email: l.email, parentName: l.parentName, childName: l.childName, state: l.state }))); }} />
                  <IconBtn icon={MessageSquare} onClick={(e) => { e.stopPropagation(); modals.open({ kind: "comm", channel: "text", lead: l }); }} />
                  <IconBtn icon={Mail} onClick={(e) => { e.stopPropagation(); modals.open({ kind: "comm", channel: "email", lead: l }); }} />
                  <IconBtn icon={StickyNote} onClick={(e) => { e.stopPropagation(); modals.open({ kind: "note", lead: l }); }} />
                  <IconBtn icon={Clock} onClick={(e) => { e.stopPropagation(); modals.open({ kind: "snooze", lead: l, followUpLabel: activeQueue.label }); }} />
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function IconBtn({ icon: Icon, onClick }: { icon: any; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full size-8 grid place-items-center text-muted-foreground hover:bg-muted hover:text-foreground transition"
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

/* ─────────────────────── Assessment Coordination ─────────────────────── */

function AssessmentCoordination({ leads, onOpen }: { leads: Lead[]; onOpen: (id: string) => void }) {
  const modals = useIntakeModals();
  const columns = useMemo(() => {
    const dx = leads.filter((l) => l.status === "Needs DX" || l.status === "Getting DX");
    return [
      { key: "needs", label: "Needs Assessment", items: dx.filter((l) => l.status === "Needs DX") },
      { key: "scheduled", label: "Scheduled", items: dx.filter((l) => l.status === "Getting DX" && (l.daysInStage ?? 0) <= 3) },
      { key: "clinician", label: "Clinician Assigned", items: dx.filter((l) => l.status === "Getting DX" && (l.daysInStage ?? 0) > 3 && (l.daysInStage ?? 0) <= 7) },
      { key: "waiting", label: "Awaiting Family Availability", items: dx.filter((l) => l.status === "Getting DX" && (l.daysInStage ?? 0) > 7) },
      { key: "done", label: "Completed", items: leads.filter((l) => l.status === "Form Received" && (l.tags ?? []).some((t) => /assessment/i.test(t))) },
    ];
  }, [leads]);

  const total = columns.reduce((s, c) => s + c.items.length, 0);
  if (total === 0) return null;

  return (
    <section>
      <SectionHeader
        icon={Stethoscope}
        tone="indigo"
        title="Assessment Coordination"
        subtitle="Diagnostic and assessment scheduling pipeline."
        right={<span className="text-xs text-muted-foreground tabular-nums">{total} families</span>}
      />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {columns.map((col) => (
          <div key={col.key} className="rounded-2xl border border-border/70 bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{col.label}</p>
              <span className="text-sm font-semibold tabular-nums">{col.items.length}</span>
            </div>
            <ul className="space-y-1.5">
              {col.items.slice(0, 4).map((l) => (
                <li key={l.id}>
                  <button
                    onClick={() => onOpen(l.id)}
                    className="w-full text-left rounded-lg px-2 py-1.5 hover:bg-muted text-xs"
                  >
                    <p className="truncate font-medium">{l.parentName || l.childName}</p>
                    <p className="truncate text-muted-foreground text-[11px]">{l.state} · {l.daysInStage}d</p>
                  </button>
                </li>
              ))}
              {col.items.length > 4 && (
                <li className="text-[11px] text-muted-foreground px-2">+{col.items.length - 4} more</li>
              )}
              {col.items.length === 0 && (
                <li className="text-[11px] text-muted-foreground/70 px-2">None</li>
              )}
            </ul>
            {col.items[0] && (
              <div className="mt-3 flex flex-wrap gap-1">
                <button onClick={() => modals.open({ kind: "schedule", lead: col.items[0] })} className="text-[11px] px-2 h-6 rounded-full bg-muted hover:bg-muted/80">Schedule</button>
                <button onClick={() => modals.open({ kind: "assignBcba", lead: col.items[0] })} className="text-[11px] px-2 h-6 rounded-full bg-muted hover:bg-muted/80">Assign BCBA</button>
                <button onClick={() => modals.open({ kind: "comm", channel: "email", lead: col.items[0] })} className="text-[11px] px-2 h-6 rounded-full bg-muted hover:bg-muted/80">Message</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────── Missing Information Center ─────────────────────── */

const MISSING_TILES: { key: string; label: string; icon: any; match: (l: Lead) => boolean }[] = [
  { key: "insurance", label: "Insurance card", icon: ShieldCheck, match: (l) => !l.primaryInsurance || /missing|incomplete/i.test(l.notes ?? "") },
  { key: "form", label: "Intake form", icon: ClipboardList, match: (l) => l.formStatus === "Not Sent" || l.formStatus === "Sent" || l.formStatus === "Viewed" },
  { key: "consent", label: "Consent", icon: FileCheck2, match: (l) => l.consentStatus === "Not Sent" && l.status !== "New Lead" },
  { key: "diagnosis", label: "Diagnosis", icon: FileWarning, match: (l) => l.status === "Needs DX" || l.status === "Getting DX" },
  { key: "availability", label: "Availability", icon: CalendarClock, match: (l) => l.status === "Getting DX" && (l.daysInStage ?? 0) > 5 },
  { key: "referral", label: "Referral", icon: UserCheck, match: (l) => l.source === "Referral" && !l.notes },
];

function MissingInfoCenter({
  leads, onOpen, onFilter, active,
}: { leads: Lead[]; onOpen: (id: string) => void; onFilter: (key: string) => void; active: string | null }) {
  const tiles = useMemo(() => MISSING_TILES.map((t) => ({
    ...t,
    items: leads.filter(t.match).slice(0, 50),
  })).filter((t) => t.items.length > 0), [leads]);

  if (tiles.length === 0) return null;

  return (
    <section>
      <SectionHeader
        icon={FileWarning}
        tone="rose"
        title="Missing Information Center"
        subtitle="What's preventing readiness — tap a tile to drill in."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {tiles.map((t) => (
          <div
            key={t.key}
            className={cn(
              "rounded-2xl border border-border/70 bg-card p-5",
              active === t.key && "ring-2 ring-primary/40 border-primary/40",
            )}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="grid place-items-center h-9 w-9 rounded-xl bg-muted">
                <t.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{t.label}</p>
                <p className="text-xs text-muted-foreground">{t.items.length} families</p>
              </div>
              <button
                onClick={() => onFilter(t.key)}
                className="text-2xl font-semibold tabular-nums hover:text-primary"
              >
                {t.items.length}
              </button>
            </div>
            <ul className="space-y-1">
              {t.items.slice(0, 3).map((l) => (
                <li key={l.id}>
                  <button
                    onClick={() => onOpen(l.id)}
                    className="w-full text-left flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-muted text-xs"
                  >
                    <span className="truncate">{l.parentName || l.childName}</span>
                    <span className="text-muted-foreground shrink-0 ml-2">{l.state}</span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => onFilter(t.key)}
                className="flex-1 inline-flex items-center justify-center gap-1 h-8 rounded-xl text-xs hover:bg-muted transition"
              >
                View {t.items.length} <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────── Service Readiness Pipeline ─────────────────────── */

function ServiceReadinessPipeline({
  leads, onOpen, onFilter, active,
}: { leads: Lead[]; onOpen: (id: string) => void; onFilter: (key: string) => void; active: string | null }) {
  const stages = useMemo(() => READINESS_STAGES.map((s) => {
    const items = leads.filter(s.match);
    const overdue = items.filter((l) => (l.daysInStage ?? 0) >= 7).length;
    const waiting = items.filter((l) => (l.daysInStage ?? 0) >= 3 && (l.daysInStage ?? 0) < 7).length;
    const avg = items.length
      ? Math.round(items.reduce((s, l) => s + (l.daysInStage ?? 0), 0) / items.length)
      : 0;
    return { ...s, items, overdue, waiting, avg };
  }), [leads]);

  return (
    <section>
      <SectionHeader
        icon={TrendingUp}
        tone="violet"
        title="Service Readiness Pipeline"
        subtitle="Operational progression from inquiry to staffing."
      />
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {stages.map((s, i) => (
          <button
            key={s.key}
            onClick={() => onFilter(s.key)}
            className={cn(
              "text-left flex-shrink-0 w-[220px] rounded-2xl border border-border/70 bg-card p-4 hover:-translate-y-0.5 hover:border-border transition-all duration-300",
              active === s.key && "ring-2 ring-primary/40 border-primary/40",
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{String(i + 1).padStart(2, "0")}</p>
              <CircleDot className="h-3 w-3 text-muted-foreground/60" />
            </div>
            <p className="text-sm font-medium leading-tight mb-3">{s.label}</p>
            <p className="text-3xl font-semibold tabular-nums">{s.items.length}</p>
            <div className="mt-3 space-y-1 text-[11px] text-muted-foreground">
              <div className="flex justify-between"><span>Overdue</span><span className={cn("tabular-nums", s.overdue > 0 && "text-destructive")}>{s.overdue}</span></div>
              <div className="flex justify-between"><span>Waiting</span><span className="tabular-nums">{s.waiting}</span></div>
              <div className="flex justify-between"><span>Avg days</span><span className="tabular-nums">{s.avg}</span></div>
            </div>
            {s.items.length > 0 && (
              <span className="mt-3 w-full text-[11px] text-primary inline-flex items-center gap-1">
                View {s.items.length} <ArrowUpRight className="h-3 w-3" />
              </span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────── Recent Activity ─────────────────────── */

interface UpdateRow {
  id: string;
  author: string | null;
  posted_at: string | null;
  body: string | null;
  parent_item_name: string | null;
}

function RecentActivityFeed({ leads, onOpen }: { leads: Lead[]; onOpen: (id: string) => void }) {
  const [updates, setUpdates] = useState<UpdateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const nameIndex = useMemo(() => {
    const m = new Map<string, Lead>();
    for (const l of leads) m.set(l.childName, l);
    return m;
  }, [leads]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .from("monday_updates_raw")
      .select("id, author, posted_at, body, parent_item_name")
      .eq("parent_board", "leads")
      .order("posted_at", { ascending: false })
      .limit(25)
      .then(({ data }) => {
        if (cancelled) return;
        setUpdates((data ?? []) as UpdateRow[]);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <section>
      <SectionHeader
        icon={Activity}
        tone="sky"
        title="Historical Import — Recent Activity"
        subtitle="Legacy Monday updates for already-matched leads. Not current truth."
      />
      <div className="rounded-2xl border border-border/70 bg-card divide-y divide-border/50">
        {loading ? (
          <div className="p-10 text-center"><Loader2 className="mx-auto h-4 w-4 animate-spin text-muted-foreground" /></div>
        ) : updates.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No historical import activity for matched leads.</div>
        ) : (
          updates
            .filter((u) => u.parent_item_name && nameIndex.has(u.parent_item_name))
            .slice(0, 12)
            .map((u) => {
              const lead = u.parent_item_name ? nameIndex.get(u.parent_item_name) : null;
            return (
              <div
                key={u.id}
                className={cn("px-5 py-3 flex items-start gap-3", lead && "hover:bg-muted/40 cursor-pointer")}
                onClick={() => lead && onOpen(lead.id)}
              >
                <div className="grid place-items-center h-8 w-8 rounded-full bg-muted shrink-0 mt-0.5">
                  <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-medium truncate">
                      {u.parent_item_name || "Unknown family"}
                      <span className="ml-2 text-xs text-muted-foreground font-normal">{u.author || ""}</span>
                    </p>
                    <span className="text-[11px] text-muted-foreground shrink-0">{relTime(u.posted_at)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{u.body || ""}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

/* ─────────────────────── Insights Rail ─────────────────────── */

function AskBlossomIntakeRail({ leads, onOpen }: { leads: Lead[]; onOpen: (id: string) => void }) {
  const priorities = useMemo(() => {
    return [...leads]
      .filter((l) => primaryBlocker(l))
      .sort((a, b) => (b.daysInStage ?? 0) - (a.daysInStage ?? 0))
      .slice(0, 5);
  }, [leads]);

  const insights = [
    { icon: AlertTriangle, text: "Families are stalling at intake forms.", tone: "amber" as const },
    { icon: CalendarClock, text: "Assessment coordination delays are increasing.", tone: "violet" as const },
    { icon: ShieldCheck, text: "VOB turnaround is slowing this week.", tone: "sky" as const },
  ];

  const prompts = [
    "Summarize today's intake priorities",
    "Which families are stuck?",
    "Find missing documents",
    "Show overdue follow-ups",
    "Draft parent follow-up",
  ];

  return (
    <div className="p-5 space-y-6">
      <div className="flex items-center gap-2">
        <div className="grid place-items-center h-8 w-8 rounded-xl bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium">Insights</p>
          <p className="text-[11px] text-muted-foreground">Intake operations assistant</p>
        </div>
      </div>

      <div>
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Try</p>
        <div className="flex flex-wrap gap-1.5">
          {prompts.map((p) => (
            <Link
              key={p}
              to={`/ai/assistant?q=${encodeURIComponent(p)}`}
              className="text-[11px] px-2.5 h-7 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition"
            >
              {p}
            </Link>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
          <Wand2 className="h-3 w-3" /> Insights
        </p>
        <div className="space-y-2">
          {insights.map((i) => (
            <div key={i.text} className="rounded-xl border border-border/60 bg-card p-3 flex gap-2.5">
              <i.icon className={cn(
                "h-4 w-4 mt-0.5 shrink-0",
                i.tone === "amber" && "text-amber-500",
                i.tone === "violet" && "text-violet-500",
                i.tone === "sky" && "text-sky-500",
              )} />
              <p className="text-xs text-foreground leading-snug">{i.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
          <ListTodo className="h-3 w-3" /> Daily Priorities
        </p>
        {priorities.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nothing urgent today.</p>
        ) : (
          <div className="space-y-1">
            {priorities.map((l, i) => (
              <button
                key={l.id}
                onClick={() => onOpen(l.id)}
                className="w-full text-left rounded-xl p-2.5 hover:bg-muted transition flex items-center gap-2.5"
              >
                <span className="grid place-items-center h-6 w-6 rounded-full bg-muted text-[11px] font-medium shrink-0">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{l.parentName || l.childName}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{l.daysInStage}d · {l.status}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────── Empty state ─────────────────────── */

function EmptyTile({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-10 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}