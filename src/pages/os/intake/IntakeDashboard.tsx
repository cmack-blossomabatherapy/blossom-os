import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LeadNameLink } from "@/contexts/LeadDrawerContext";
import {
  ClipboardList, TrendingUp, MessageSquare, AlertCircle, ShieldCheck, Plus,
  ArrowRightLeft, Users, MapPin, Signal, Clock, HeartHandshake, List,
  Inbox, ArrowUpRight, Zap, BarChart3, HeartPulse, PieChart as PieIcon,
  AlertTriangle, Phone, Mail, Send,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";
import { GrowthPageShell, ReadyForDataNotice } from "@/components/os/growth/GrowthPageShell";
import { useLeads } from "@/contexts/LeadsContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NewLeadDialog } from "@/components/leads/NewLeadDialog";
import { buildLeadSourceDefaults } from "@/lib/leads/leadSourceConfig";
import { cn } from "@/lib/utils";
// Send-to-State-Support has been retired here in favor of the
// floating escalation chat available site-wide from OSShell.
import { StateDirectorSnapshotBanner } from "@/components/stateDirector/StateDirectorSnapshotBanner";
import { IntakeSystemHealthPanel } from "@/components/intake/IntakeSystemHealthPanel";
import { useIntakeTasksLive } from "@/hooks/useIntakeTasksLive";
import {
  callParent,
  sendLeadEmail,
  sendLeadSms,
  notifyCommunicationResult,
} from "@/lib/integrations/communications/communicationAdapters";
import {
  getLeadWorkflowRisk,
  isReadyToStartStage,
  canonicalFamilyLeadStage,
  FAMILY_LEAD_PIPELINE_STAGES,
  isLeadOutOfPipeline,
} from "@/lib/intake/intakeWorkflow";
import { IntakeStateFilterToggle, useIntakeStateFilter } from "@/lib/intake/intakeStateFilter";

// Export 88 — every dashboard count is computed off the canonical Family /
// Lead Workflow via `canonicalFamilyLeadStage`. We do NOT keep
// MISSING_STAGES / AWAITING_VOB_STAGES / LEAD_CAPTURED_STAGES sets here,
// because those sets were silently re-introducing legacy Monday-era labels
// (e.g. "Missing Information", "Sent to VOB", "New Lead") as live stages.
// Open-pipeline = any canonical stage that isn't a Ready-to-Start, Cannot
// Reach, or Non-Qualified outcome.
const isOpenFamilyPipeline = (status: string) => !isLeadOutOfPipeline(status);
const AGING_STAGES = FAMILY_LEAD_PIPELINE_STAGES;

type Tone = "sky" | "amber" | "rose" | "violet" | "indigo" | "emerald" | "primary";
const TONE: Record<Tone, { bg: string; ring: string; icon: string; number: string; bar: string }> = {
  primary: { bg: "bg-primary/[0.06]",      ring: "ring-primary/30",     icon: "bg-primary/15 text-primary",                                  number: "text-primary",                          bar: "bg-primary" },
  sky:     { bg: "bg-sky-500/[0.06]",      ring: "ring-sky-500/30",     icon: "bg-sky-500/15 text-sky-600 dark:text-sky-400",                number: "text-sky-700 dark:text-sky-300",        bar: "bg-sky-500" },
  amber:   { bg: "bg-amber-500/[0.06]",    ring: "ring-amber-500/30",   icon: "bg-amber-500/15 text-amber-600 dark:text-amber-400",          number: "text-amber-700 dark:text-amber-300",    bar: "bg-amber-500" },
  rose:    { bg: "bg-rose-500/[0.06]",     ring: "ring-rose-500/30",    icon: "bg-rose-500/15 text-rose-600 dark:text-rose-400",             number: "text-rose-700 dark:text-rose-300",      bar: "bg-rose-500" },
  violet:  { bg: "bg-violet-500/[0.06]",   ring: "ring-violet-500/30",  icon: "bg-violet-500/15 text-violet-600 dark:text-violet-400",       number: "text-violet-700 dark:text-violet-300",  bar: "bg-violet-500" },
  indigo:  { bg: "bg-indigo-500/[0.06]",   ring: "ring-indigo-500/30",  icon: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",       number: "text-indigo-700 dark:text-indigo-300",  bar: "bg-indigo-500" },
  emerald: { bg: "bg-emerald-500/[0.06]",  ring: "ring-emerald-500/30", icon: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",    number: "text-emerald-700 dark:text-emerald-300", bar: "bg-emerald-500" },
};

function SectionHeader({
  icon: Icon, tone = "primary", title, subtitle, right,
}: {
  icon: any; tone?: Tone; title: string; subtitle?: string; right?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3 mb-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn("grid place-items-center h-9 w-9 rounded-xl shrink-0", TONE[tone].icon)}>
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

export default function IntakeDashboard() {
  const { leads: allLeads, loading } = useLeads();
  const [addOpen, setAddOpen] = useState(false);
  // Shared cross-page intake state filter (also drives /intake/tasks,
  // /intake/lead-to-active, /intake/missing-information, etc.).
  const { matches: matchesIntakeState } = useIntakeStateFilter();
  const leads = useMemo(
    () => allLeads.filter((l) => matchesIntakeState(l.state)),
    [allLeads, matchesIntakeState],
  );

  const counts = useMemo(() => {
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const newReferrals = leads.filter((l) => canonicalFamilyLeadStage(l.status) === "Lead Captured").length;
    const inPipeline = leads.filter((l) => isOpenFamilyPipeline(l.status)).length;
    const missing = leads.filter((l) => canonicalFamilyLeadStage(l.status) === "Intake Packet Follow Up").length;
    const followUps = leads.filter((l) => l.tasks?.some((t) => !t.completed)).length;
    const awaiting = leads.filter((l) => canonicalFamilyLeadStage(l.status) === "Benefits Verification").length;
    const converted = leads.filter((l) => {
      if (!isReadyToStartStage(l.status)) return false;
      const d = new Date(l.updatedAt).getTime();
      return Number.isFinite(d) && now - d <= thirtyDays;
    }).length;
    return { newReferrals, inPipeline, missing, followUps, awaiting, converted };
  }, [leads]);

  const fmt = (n: number) => (loading ? "..." : n.toLocaleString());

  const actionRequired = useMemo(() => {
    return leads
      .map((l) => ({ lead: l, risk: getLeadWorkflowRisk(l) }))
      .filter((r) => r.risk.level === "urgent" || r.risk.level === "risk")
      .sort((a, b) => (a.risk.level === "urgent" ? -1 : 1) - (b.risk.level === "urgent" ? -1 : 1))
      .slice(0, 6);
  }, [leads]);

  // Owner workload - count of in-pipeline leads per owner.
  const ownerWorkload = useMemo(() => {
    const map = new Map<string, { total: number; risk: number }>();
    leads.forEach((l) => {
      if (!isOpenFamilyPipeline(l.status)) return;
      const k = l.owner || "Unassigned";
      const r = getLeadWorkflowRisk(l).level;
      const cur = map.get(k) ?? { total: 0, risk: 0 };
      cur.total += 1;
      if (r === "risk" || r === "urgent") cur.risk += 1;
      map.set(k, cur);
    });
    return [...map.entries()]
      .map(([owner, v]) => ({ owner, ...v }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [leads]);

  const stateBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    leads.forEach((l) => {
      if (!isOpenFamilyPipeline(l.status)) return;
      const k = l.state || "-";
      map.set(k, (map.get(k) ?? 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [leads]);

  const sourceBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    leads.forEach((l) => {
      if (!isOpenFamilyPipeline(l.status)) return;
      const k = l.source || "Unknown";
      map.set(k, (map.get(k) ?? 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [leads]);

  const agingByStage = useMemo(() => {
    return AGING_STAGES.map((stage) => {
      const inStage = leads.filter((l) => canonicalFamilyLeadStage(l.status) === stage);
      const oldest = inStage.reduce((m, l) => Math.max(m, l.daysInStage ?? 0), 0);
      const avg = inStage.length
        ? Math.round(inStage.reduce((s, l) => s + (l.daysInStage ?? 0), 0) / inStage.length)
        : 0;
      return { stage, count: inStage.length, avg, oldest };
    });
  }, [leads]);

  const handoffReady = useMemo(
    () => leads.filter((l) => isReadyToStartStage(l.status)).slice(0, 6),
    [leads],
  );

  const maxOwner = Math.max(1, ...ownerWorkload.map((o) => o.total));
  const maxState = Math.max(1, ...stateBreakdown.map(([, n]) => n));
  const maxSource = Math.max(1, ...sourceBreakdown.map(([, n]) => n));

  const pulseTiles: { key: string; label: string; value: number; hint: string; icon: any; tone: Tone; to: string }[] = [
    { key: "captured",  label: "Lead Captured",        value: counts.newReferrals, hint: "New family leads",                       icon: Inbox,         tone: "sky",     to: "/leads?stage=Lead Captured" },
    { key: "pipeline",  label: "Open Family Pipeline", value: counts.inPipeline,   hint: "Lead Captured -> Ready to Start Services", icon: TrendingUp,  tone: "indigo",  to: "/leads" },
    { key: "missing",   label: "Packet Follow Up / Missing Info", value: counts.missing, hint: "Blocked on packet, docs, or family", icon: AlertCircle, tone: "rose",    to: "/intake/missing-information" },
    { key: "tasks",     label: "Open Follow-Ups",      value: counts.followUps,    hint: "Open tasks across leads",                icon: MessageSquare, tone: "amber",   to: "/intake/tasks" },
    { key: "benefits",  label: "Benefits Verification",value: counts.awaiting,     hint: "Eligibility and payer review",           icon: ShieldCheck,   tone: "violet",  to: "/vob-decision-center" },
    { key: "ready",     label: "Ready to Start (30d)", value: counts.converted,    hint: "Reached handoff for active services",    icon: ArrowRightLeft,tone: "emerald", to: "/leads?stage=Ready to Start Services" },
  ];
  const pulseTotal = pulseTiles.reduce((s, t) => s + t.value, 0) || 1;

  // Charts data
  const funnelData = AGING_STAGES.map((stage) => ({
    stage,
    short: stage.length > 18 ? stage.slice(0, 16) + "…" : stage,
    count: leads.filter((l) => canonicalFamilyLeadStage(l.status) === stage).length,
  }));
  const maxFunnel = Math.max(1, ...funnelData.map((d) => d.count));

  const agingChartData = AGING_STAGES.slice(0, 8).map((stage) => {
    const items = leads.filter((l) => canonicalFamilyLeadStage(l.status) === stage);
    return {
      stage,
      short: stage.split(" ").slice(0, 2).join(" "),
      Fresh: items.filter((l) => (l.daysInStage ?? 0) <= 1).length,
      Waiting: items.filter((l) => (l.daysInStage ?? 0) > 1 && (l.daysInStage ?? 0) < 7).length,
      Overdue: items.filter((l) => (l.daysInStage ?? 0) >= 7).length,
    };
  });

  const sourcePieData = sourceBreakdown.map(([name, value]) => ({ name, value }));
  const PIE_COLORS = [
    "hsl(265 70% 55%)", "hsl(195 80% 50%)", "hsl(150 65% 45%)",
    "hsl(30 90% 55%)", "hsl(340 75% 55%)", "hsl(220 70% 55%)",
    "hsl(180 65% 45%)", "hsl(45 90% 55%)",
  ];

  return (
    <GrowthPageShell
      eyebrow="Growth & Admissions"
      title="Intake Dashboard"
      description="Manage new referrals, parent communication, missing information, insurance checks, and movement from lead capture to ready to start services."
      headerRight={
        <div className="flex items-center gap-2">
          <IntakeStateFilterToggle />
        </div>
      }
      actions={[
        { label: "Add Lead", icon: Plus, variant: "default", onClick: () => setAddOpen(true) },
        { label: "Open Leads", icon: List, to: "/leads" },
      ]}
    >
      {/* Quick links — Lead to Ready-to-Start Pipeline */}
      <div className="flex flex-wrap gap-2">
        <Link
          to="/intake/parent-communication"
          title="Intake Communications"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-card px-3 py-1.5 text-xs hover:bg-muted transition"
        >
          <MessageSquare className="h-3.5 w-3.5" /> Intake Communications
        </Link>
        <Link
          to="/leads?view=pipeline"
          title="Lead to Ready-to-Start Pipeline"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-card px-3 py-1.5 text-xs hover:bg-muted transition"
        >
          <TrendingUp className="h-3.5 w-3.5" /> Lead to Ready-to-Start Pipeline
        </Link>
      </div>
      <StateDirectorSnapshotBanner
        ownerDepartment="Intake"
        sourceModule="intake_dashboard"
        overdueCount={counts.missing}
        openBlockers={counts.followUps}
        topRisks={[
          counts.missing ? `${counts.missing} packet follow-up` : null,
          counts.awaiting ? `${counts.awaiting} awaiting VOB` : null,
          counts.inPipeline ? `${counts.inPipeline} open pipeline` : null,
        ].filter(Boolean) as string[]}
      />
      <IntakeSystemHealthPanel />
      {/* Intake Pulse */}
      <section>
        <SectionHeader icon={Zap} tone="primary" title="Intake Pulse" subtitle="Live snapshot of where families are right now — tap a tile to drill in." />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {pulseTiles.map((p) => {
            const t = TONE[p.tone];
            const pct = Math.round((p.value / pulseTotal) * 100);
            return (
              <Link
                key={p.key}
                to={p.to}
                className={cn(
                  "group text-left rounded-2xl border border-border/70 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm",
                  t.bg,
                )}
              >
                <div className="flex items-center justify-between">
                  <div className={cn("grid place-items-center h-8 w-8 rounded-xl", t.icon)}>
                    <p.icon className="h-4 w-4" />
                  </div>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-foreground transition" />
                </div>
                <p className="mt-3 text-[11px] uppercase tracking-wide text-muted-foreground">{p.label}</p>
                <p className={cn("mt-1 text-2xl font-semibold tabular-nums", t.number)}>{loading ? "…" : p.value.toLocaleString()}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground/80 line-clamp-1">{p.hint}</p>
                <div className="mt-2 h-1 rounded-full bg-muted/60 overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all", t.bar)} style={{ width: `${Math.max(pct, 4)}%` }} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Pipeline Insights — charts */}
      <section>
        <SectionHeader icon={BarChart3} tone="indigo" title="Pipeline Insights" subtitle="Click a bar or slice to drill into matching families." />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Readiness Funnel */}
          <article className="rounded-2xl border border-border/70 bg-card p-4">
            <div className="flex items-baseline justify-between mb-2">
              <p className="text-sm font-medium">Readiness Funnel</p>
              <p className="text-[11px] text-muted-foreground">Families per stage</p>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="short" width={130} tick={{ fontSize: 10 }} interval={0} />
                  <Tooltip wrapperStyle={{ fontSize: 12 }} cursor={{ fill: "hsl(var(--muted) / 0.6)" }} />
                  <Bar
                    dataKey="count"
                    radius={[0, 6, 6, 0]}
                    className="cursor-pointer"
                    onClick={(d: any) => d?.stage && (window.location.href = `/leads?stage=${encodeURIComponent(d.stage)}`)}
                  >
                    {funnelData.map((f, i) => (
                      <Cell key={i} fill={`hsl(${230 + i * 8} 70% ${50 + (f.count === maxFunnel ? 0 : 6)}%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>

          {/* Stage Aging */}
          <article className="rounded-2xl border border-border/70 bg-card p-4">
            <div className="flex items-baseline justify-between mb-2">
              <p className="text-sm font-medium">Stage Aging</p>
              <p className="text-[11px] text-muted-foreground">Fresh · Waiting · Overdue</p>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agingChartData} margin={{ top: 4, right: 8, left: -16, bottom: 24 }}>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                  <XAxis dataKey="short" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip wrapperStyle={{ fontSize: 12 }} cursor={{ fill: "hsl(var(--muted) / 0.6)" }} />
                  <Bar dataKey="Fresh"   stackId="a" fill="hsl(150 65% 50%)" radius={[0, 0, 0, 0]}
                       onClick={(d: any) => d?.stage && (window.location.href = `/leads?stage=${encodeURIComponent(d.stage)}`)}
                       className="cursor-pointer" />
                  <Bar dataKey="Waiting" stackId="a" fill="hsl(38 92% 55%)"  radius={[0, 0, 0, 0]}
                       onClick={(d: any) => d?.stage && (window.location.href = `/leads?stage=${encodeURIComponent(d.stage)}`)}
                       className="cursor-pointer" />
                  <Bar dataKey="Overdue" stackId="a" fill="hsl(0 75% 58%)"   radius={[6, 6, 0, 0]}
                       onClick={(d: any) => d?.stage && (window.location.href = `/leads?stage=${encodeURIComponent(d.stage)}`)}
                       className="cursor-pointer" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>

          {/* Source Mix */}
          <article className="rounded-2xl border border-border/70 bg-card p-4">
            <div className="flex items-baseline justify-between mb-2">
              <p className="text-sm font-medium">Source Mix</p>
              <p className="text-[11px] text-muted-foreground">Top referral sources</p>
            </div>
            <div className="h-72">
              {sourcePieData.length === 0 ? (
                <div className="h-full grid place-items-center text-xs text-muted-foreground">No data yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip wrapperStyle={{ fontSize: 12 }} />
                    <Pie data={sourcePieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                      {sourcePieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} className="cursor-pointer" />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            {sourcePieData.length > 0 && (
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {sourcePieData.slice(0, 6).map((s, i) => (
                  <div key={s.name} className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="flex items-center gap-1.5 min-w-0 truncate">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="truncate">{s.name}</span>
                    </span>
                    <span className="tabular-nums text-muted-foreground">{s.value}</span>
                  </div>
                ))}
              </div>
            )}
          </article>
        </div>
      </section>

      {/* Action Required */}
      {actionRequired.length > 0 && (
        <section>
          <SectionHeader
            icon={AlertTriangle}
            tone="rose"
            title={`Action Required (${actionRequired.length})`}
            subtitle="Highest-risk families in your queue right now."
          />
          <div className="space-y-2">
            {actionRequired.map(({ lead, risk }) => {
              const urgent = risk.level === "urgent";
              const tone: Tone = urgent ? "rose" : "amber";
              const t = TONE[tone];
              const hasPhone = Boolean(lead.phone?.trim());
              const hasEmail = Boolean(lead.email?.trim());
              const primaryReason = risk.reasons[0];
              const leadContext = {
                leadId: lead.id,
                phone: lead.phone,
                email: lead.email,
                parentName: lead.parentName,
                childName: lead.childName,
                state: lead.state,
                insurance: lead.insurance,
              };
              return (
                <article
                  key={lead.id}
                  className={cn(
                    "group relative flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-border/70 bg-card p-3 pl-5 transition-all hover:-translate-y-0.5 hover:shadow-sm hover:border-primary/30",
                    t.bg,
                  )}
                >
                  <span className={cn("absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl", t.bar)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-3">
                      <LeadNameLink leadId={lead.id} className="font-semibold hover:underline truncate">
                        {lead.childName}
                      </LeadNameLink>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {lead.status} · {lead.owner || "Unassigned"} · {lead.daysInStage ?? 0}d waiting
                        {primaryReason && <span className="text-foreground/80"> · {primaryReason}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center flex-wrap gap-2 shrink-0">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] border-transparent",
                        urgent ? "bg-rose-500/15 text-rose-700 dark:text-rose-300" : "bg-amber-500/15 text-amber-700 dark:text-amber-300",
                      )}
                    >
                      {urgent ? "Urgent" : "At risk"}
                    </Badge>
                    <Button asChild size="sm" variant="default">
                      <LeadNameLink leadId={lead.id}>Open</LeadNameLink>
                    </Button>
                    {hasPhone && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        title="Call parent"
                        onClick={async () => notifyCommunicationResult(await callParent(leadContext))}
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                    )}
                    {hasPhone && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        title="Send SMS"
                        onClick={async () => notifyCommunicationResult(await sendLeadSms(leadContext))}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                    {hasEmail && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        title="Send email"
                        onClick={async () => notifyCommunicationResult(await sendLeadEmail(leadContext))}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Handoff Readiness */}
      <section>
        <SectionHeader
          icon={HeartPulse}
          tone="emerald"
          title={`Handoff Readiness (${handoffReady.length})`}
          subtitle="Ready to Start Services — active patient operations begin here."
        />
        {handoffReady.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-card/50 p-6 text-xs text-muted-foreground text-center">
            No families currently ready for handoff.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {handoffReady.map((lead) => (
              <article key={lead.id} className={cn("rounded-2xl border border-border/70 p-4", TONE.emerald.bg)}>
                <div className="flex items-start justify-between gap-2">
                  <LeadNameLink leadId={lead.id} className="font-semibold hover:underline truncate">{lead.childName}</LeadNameLink>
                  <Badge variant="outline" className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-transparent">
                    <HeartHandshake className="h-3 w-3 mr-1" /> Ready
                  </Badge>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{lead.state || "—"} · {lead.owner || "Unassigned"}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link to="/authorizations" className="text-[11px] text-primary hover:underline">→ Authorizations</Link>
                  <Link to="/ops/scheduling" className="text-[11px] text-primary hover:underline">→ Scheduling</Link>
                  <Link to="/qa-team" className="text-[11px] text-primary hover:underline">→ Clinical</Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Workload + Aging */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <SectionHeader icon={Users} tone="violet" title="Owner Workload" subtitle="In-pipeline leads per owner." />
          {ownerWorkload.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 bg-card/50 p-6 text-xs text-muted-foreground text-center">
              No active leads in pipeline.
            </div>
          ) : (
            <div className="space-y-2">
              {ownerWorkload.map((o) => (
                <Link
                  key={o.owner}
                  to={`/leads?owner=${encodeURIComponent(o.owner)}`}
                  className="group block rounded-xl border border-border/60 bg-card p-3 transition-all hover:-translate-y-0.5 hover:shadow-sm hover:border-violet-500/40"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 truncate">
                      <span className={cn("grid place-items-center h-7 w-7 rounded-lg text-[10px] font-semibold ring-1 ring-violet-500/20", TONE.violet.icon)}>
                        {o.owner.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                      </span>
                      <span className="truncate font-medium">{o.owner}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="tabular-nums text-xs text-muted-foreground">
                        {o.total}{o.risk > 0 && <span className="text-amber-600 ml-1">· {o.risk} at risk</span>}
                      </span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-violet-500 transition" />
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all"
                      style={{ width: `${(o.total / maxOwner) * 100}%` }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionHeader icon={Clock} tone="amber" title="Aging by Stage" subtitle="Average and oldest days in each canonical stage." />
          <div className="space-y-1.5">
            {agingByStage.map((s) => {
              const hot = s.oldest >= 14;
              const warn = !hot && s.oldest >= 7;
              return (
                <Link
                  key={s.stage}
                  to={`/leads?stage=${encodeURIComponent(s.stage)}`}
                  className={cn(
                    "group flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition-all hover:-translate-y-0.5 hover:shadow-sm",
                    hot
                      ? "bg-rose-500/[0.06] border-rose-500/30 hover:border-rose-500/60"
                      : warn
                      ? "bg-amber-500/[0.06] border-amber-500/30 hover:border-amber-500/60"
                      : "bg-card border-border/60 hover:border-amber-500/40",
                  )}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className={cn(
                      "grid place-items-center h-7 w-7 rounded-lg shrink-0",
                      hot ? "bg-rose-500/15 text-rose-600" : warn ? "bg-amber-500/15 text-amber-600" : "bg-muted text-muted-foreground",
                    )}>
                      <Clock className="h-3.5 w-3.5" />
                    </span>
                    <span className="truncate font-medium">{s.stage}</span>
                  </span>
                  <span className="flex items-center gap-2 shrink-0">
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {s.count} · avg {s.avg}d · oldest{" "}
                      <span className={hot ? "text-rose-600 font-semibold" : warn ? "text-amber-600 font-semibold" : ""}>{s.oldest}d</span>
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-foreground transition" />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      {/* States + Sources lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <SectionHeader icon={MapPin} tone="sky" title="State Breakdown" subtitle="Active in-pipeline leads by state." />
          {stateBreakdown.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 bg-card/50 p-6 text-xs text-muted-foreground text-center">No data yet.</div>
          ) : (
            <div className="space-y-2">
              {stateBreakdown.map(([state, n]) => (
                <Link
                  key={state}
                  to={`/leads?state=${encodeURIComponent(state)}`}
                  className="group block rounded-xl border border-border/60 bg-card p-3 transition-all hover:-translate-y-0.5 hover:shadow-sm hover:border-sky-500/40"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium">
                      <span className="grid place-items-center h-7 w-7 rounded-lg bg-sky-500/15 text-sky-600">
                        <MapPin className="h-3.5 w-3.5" />
                      </span>
                      {state}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="tabular-nums text-xs text-muted-foreground">{n}</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-sky-500 transition" />
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 transition-all"
                      style={{ width: `${(n / maxState) * 100}%` }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionHeader icon={Signal} tone="emerald" title="Lead Source Breakdown" subtitle="Where active leads are coming from." />
          {sourceBreakdown.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 bg-card/50 p-6 text-xs text-muted-foreground text-center">No data yet.</div>
          ) : (
            <div className="space-y-2">
              {sourceBreakdown.map(([src, n]) => (
                <Link
                  key={src}
                  to={`/leads?source=${encodeURIComponent(src)}`}
                  className="group block rounded-xl border border-border/60 bg-card p-3 transition-all hover:-translate-y-0.5 hover:shadow-sm hover:border-emerald-500/40"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium">
                      <span className="grid place-items-center h-7 w-7 rounded-lg bg-emerald-500/15 text-emerald-600">
                        <Signal className="h-3.5 w-3.5" />
                      </span>
                      {src}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="tabular-nums text-xs text-muted-foreground">{n}</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-emerald-500 transition" />
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                      style={{ width: `${(n / maxSource) * 100}%` }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {leads.length === 0 && (
        <ReadyForDataNotice message="This workspace is ready for live data. Create your first lead with Add Lead, or connect a source to populate intake queues automatically." />
      )}
      <NewLeadDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        defaults={buildLeadSourceDefaults("Website", { sourcePage: "intake-dashboard" })}
      />
    </GrowthPageShell>
  );
}