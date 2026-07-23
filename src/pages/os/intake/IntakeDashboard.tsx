import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LeadNameLink } from "@/contexts/LeadDrawerContext";
import {
  TrendingUp, MessageSquare, ShieldCheck, Plus,
  Users, MapPin, Signal, Clock, HeartHandshake,
  Inbox, ArrowUpRight, HeartPulse, ChevronRight,
  AlertTriangle, Phone, Mail, Send, Sparkles, Sun, Coffee, Moon, Settings2,
} from "lucide-react";
import { GrowthPageShell, ReadyForDataNotice } from "@/components/os/growth/GrowthPageShell";
import { useLeads } from "@/contexts/LeadsContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NewLeadDialog } from "@/components/leads/NewLeadDialog";
import { buildLeadSourceDefaults } from "@/lib/leads/leadSourceConfig";
import { cn } from "@/lib/utils";
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
import { useOSRole } from "@/contexts/OSRoleContext";
import { useAuth } from "@/contexts/AuthContext";

// Export 88 — every dashboard count is computed off the canonical Family /
// Lead Workflow via `canonicalFamilyLeadStage`. We do NOT keep
// MISSING_STAGES / AWAITING_VOB_STAGES / LEAD_CAPTURED_STAGES sets here,
// because those sets were silently re-introducing legacy Monday-era labels
// (e.g. "Missing Information", "Sent to VOB", "New Lead") as live stages.
// Open-pipeline = any canonical stage that isn't a Ready-to-Start, Cannot
// Reach, or Non-Qualified outcome.
const isOpenFamilyPipeline = (status: string) => !isLeadOutOfPipeline(status);
const AGING_STAGES = FAMILY_LEAD_PIPELINE_STAGES;

/** Intake-only section header — quiet, no rainbow tiles. */
function SectionHeader({
  title, subtitle, right,
}: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 mb-3">
      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-tight leading-tight text-foreground">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

/** Time-of-day greeting for the workspace welcome band. */
function useGreeting(): { label: string; Icon: typeof Sun } {
  const h = new Date().getHours();
  if (h < 12) return { label: "Good morning", Icon: Sun };
  if (h < 17) return { label: "Good afternoon", Icon: Coffee };
  return { label: "Good evening", Icon: Moon };
}

export default function IntakeDashboard() {
  const { leads: allLeads, loading } = useLeads();
  const [addOpen, setAddOpen] = useState(false);
  const { role } = useOSRole();
  const { displayName } = useAuth();
  const { label: greetingLabel, Icon: GreetingIcon } = useGreeting();
  // Active view role decides what surfaces. Admin diagnostics are gated by
  // ACTIVE view role — so "View As Intake" hides them even for a real admin.
  const isAdminView = role === "super_admin" || role === "systems_admin";
  // Widen against the OSRole union so future intake roles (e.g. intake_team)
  // still hit the operator experience without a type break.
  const isIntakeRole = (
    ["intake_coordinator", "intake_lead", "intake_team", "intake"] as string[]
  ).includes(role as unknown as string);
  void isIntakeRole;
  // Shared intake task feed — same hook used by every other intake page so
  // task counts stay consistent across the operational surface.
  const { tasks: _intakeTasksLive } = useIntakeTasksLive();
  void _intakeTasksLive;
  // Shared cross-page intake state filter (also drives /intake/tasks,
  // /intake/lead-to-active, /intake/missing-information, etc.).
  const { matches: matchesIntakeState, stateFilter } = useIntakeStateFilter();
  const stateScopeLabel = stateFilter === "ALL" ? "All states" : stateFilter;
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


  // ---------- Journey (canonical stage counts as a single progression) ----------
  const journey = FAMILY_LEAD_PIPELINE_STAGES.map((stage) => ({
    stage,
    count: leads.filter((l) => canonicalFamilyLeadStage(l.status) === stage).length,
  }));
  const journeyMax = Math.max(1, ...journey.map((j) => j.count));

  // ---------- Four-metric command strip ----------
  const commandStrip = [
    { key: "captured",  label: "New referrals",         value: counts.newReferrals, hint: "Lead Captured this pipeline",             icon: Inbox,         to: "/leads?stage=Lead%20Captured" },
    { key: "tasks",     label: "Needs follow-up",       value: counts.followUps,    hint: "Open tasks across families",              icon: MessageSquare, to: "/intake/tasks" },
    { key: "benefits",  label: "Benefits verification", value: counts.awaiting,     hint: "Eligibility and payer review",            icon: ShieldCheck,   to: "/vob-decision-center" },
    { key: "ready",     label: "Ready to Start (30d)",  value: counts.converted,    hint: "Handed off to active services",           icon: HeartHandshake, to: "/leads?stage=Ready%20to%20Start%20Services" },
  ] as const;

  return (
    <GrowthPageShell
      eyebrow="Growth & Admissions"
      title="Intake Dashboard"
      description="A calm workspace for the families in your care — surface who needs you now, where they are in the journey, and movement from lead capture through ready to start services."
      headerRight={
        <div className="flex items-center gap-2">
          <IntakeStateFilterToggle />
        </div>
      }
    >
      {/* Warm welcome band — Blossom blush → teal, no rainbow tiles. */}
      <section
        className="relative overflow-hidden rounded-3xl border border-border/60 p-6 md:p-7"
        style={{
          background:
            "linear-gradient(135deg, hsl(var(--primary)/0.08) 0%, hsl(var(--background)) 55%, hsl(180 55% 92% / 0.6) 100%)",
        }}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <GreetingIcon className="h-3.5 w-3.5" />
              <span>{greetingLabel}, {displayName?.split(" ")[0] || "there"}.</span>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {stateScopeLabel}</span>
            </div>
            <h2 className="mt-1.5 text-2xl md:text-[26px] font-semibold tracking-tight text-foreground leading-tight">
              {actionRequired.length > 0
                ? `${actionRequired.length} ${actionRequired.length === 1 ? "family needs" : "families need"} your attention today.`
                : "Every family is on track today."}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-xl">
              {counts.inPipeline > 0
                ? `You have ${counts.inPipeline.toLocaleString()} open in the journey — ${counts.awaiting.toLocaleString()} awaiting benefits and ${counts.converted.toLocaleString()} ready to start.`
                : "New referrals will land here as they come in. Add a family to get started."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              onClick={() => setAddOpen(true)}
              className="rounded-xl h-10 px-5 shadow-sm"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Add Lead
            </Button>
            <Button asChild variant="outline" className="rounded-xl h-10 px-5">
              <Link to="/leads?view=pipeline">
                <TrendingUp className="h-4 w-4 mr-1.5" /> Open Pipeline
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Quick links — keep parity with the Intake Communications and
          Lead to Ready-to-Start Pipeline entry points used elsewhere in
          the operational surface. */}
      <div className="flex flex-wrap gap-2">
        <Link
          to="/intake/parent-communication"
          title="Intake Communications"
          className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs hover:bg-muted transition"
        >
          <MessageSquare className="h-3.5 w-3.5" /> Intake Communications
        </Link>
        <Link
          to="/leads?view=pipeline"
          title="Lead to Ready-to-Start Pipeline"
          className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs hover:bg-muted transition"
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

      {/* ---------- Today — priority queue ---------- */}
      <section>
        <SectionHeader
          title="Today"
          subtitle={
            actionRequired.length > 0
              ? "Families waiting on you — call, text, or open the record to keep them moving."
              : "You’re caught up. New at-risk families will surface here."
          }
          right={
            <Link
              to="/intake/tasks"
              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
            >
              All follow-ups <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
        {actionRequired.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-card/50 p-8 text-center">
            <Sparkles className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium">No urgent families right now.</p>
            <p className="text-xs text-muted-foreground mt-1">
              As families stall in a stage or a task goes overdue, they’ll appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {actionRequired.map(({ lead, risk }) => {
              const urgent = risk.level === "urgent";
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
                  className="group relative flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3 pl-5 transition-all hover:border-primary/30 hover:shadow-sm"
                >
                  <span
                    className={cn(
                      "absolute left-0 top-2 bottom-2 w-[3px] rounded-full",
                      urgent ? "bg-rose-500" : "bg-amber-500",
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <LeadNameLink leadId={lead.id} className="font-medium hover:underline truncate">
                        {lead.childName}
                      </LeadNameLink>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] px-1.5 py-0 border-transparent",
                          urgent
                            ? "bg-rose-500/10 text-rose-700 dark:text-rose-300"
                            : "bg-amber-500/10 text-amber-700 dark:text-amber-300",
                        )}
                      >
                        {urgent ? "Urgent" : "At risk"}
                      </Badge>
                    </div>
                    <p className="text-[11.5px] text-muted-foreground mt-0.5 truncate">
                      {lead.status} · {lead.owner || "Unassigned"} · {lead.daysInStage ?? 0}d waiting
                      {primaryReason && <span className="text-foreground/80"> · {primaryReason}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {hasPhone && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-full"
                        title="Call parent"
                        aria-label={`Call parent of ${lead.childName}`}
                        onClick={async () => notifyCommunicationResult(await callParent(leadContext))}
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                    )}
                    {hasPhone && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-full"
                        title="Text parent"
                        aria-label={`Text parent of ${lead.childName}`}
                        onClick={async () => notifyCommunicationResult(await sendLeadSms(leadContext))}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                    {hasEmail && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-full"
                        title="Email parent"
                        aria-label={`Email parent of ${lead.childName}`}
                        onClick={async () => notifyCommunicationResult(await sendLeadEmail(leadContext))}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                    )}
                    <Button asChild size="sm" variant="outline" className="rounded-lg h-8 px-3 ml-1">
                      <LeadNameLink leadId={lead.id}>Open</LeadNameLink>
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ---------- Compact 4-metric command strip ---------- */}
      <section>
        <SectionHeader title="At a glance" subtitle="Live counts across the intake queue — tap to drill in." />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {commandStrip.map((m) => (
            <Link
              key={m.key}
              to={m.to}
              className="group rounded-2xl border border-border/60 bg-card px-4 py-4 transition-all hover:border-primary/30 hover:shadow-sm hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between">
                <div className="grid place-items-center h-8 w-8 rounded-xl bg-primary/10 text-primary">
                  <m.icon className="h-4 w-4" />
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-foreground transition" />
              </div>
              <p className="mt-3 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                {loading ? "…" : m.value.toLocaleString()}
              </p>
              <p className="mt-0.5 text-[13px] font-medium text-foreground">{m.label}</p>
              <p className="text-[11.5px] text-muted-foreground mt-0.5 line-clamp-1">{m.hint}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- Family journey ---------- */}
      <section>
        <SectionHeader
          title="Family journey"
          subtitle="Open Family Pipeline — where every family sits across the canonical intake journey."
          right={
            <Link
              to="/leads?view=pipeline"
              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
            >
              Open pipeline board <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {journey.map((j, i) => {
              const pct = Math.round((j.count / journeyMax) * 100);
              return (
                <li key={j.stage}>
                  <Link
                    to={`/leads?stage=${encodeURIComponent(j.stage)}`}
                    className="group block rounded-xl border border-border/50 bg-background/50 p-3 transition-all hover:border-primary/30 hover:bg-background"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        Step {i + 1}
                      </span>
                      <span className="tabular-nums text-lg font-semibold text-foreground">
                        {loading ? "…" : j.count.toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[13px] font-medium text-foreground line-clamp-1">
                      {j.stage}
                    </p>
                    <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/70 group-hover:bg-primary transition-all"
                        style={{ width: `${Math.max(pct, 4)}%` }}
                      />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ---------- Ready for handoff ---------- */}
      <section>
        <SectionHeader
          title={`Ready for handoff${handoffReady.length ? ` · ${handoffReady.length}` : ""}`}
          subtitle="Families cleared to start services — pass the baton to Authorizations, Scheduling, and Clinical."
        />
        {handoffReady.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-card/50 p-6 text-center text-xs text-muted-foreground">
            No families currently ready for handoff.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {handoffReady.map((lead) => (
              <article
                key={lead.id}
                className="rounded-2xl border border-border/60 bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <LeadNameLink leadId={lead.id} className="font-semibold hover:underline truncate">
                    {lead.childName}
                  </LeadNameLink>
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-transparent"
                  >
                    <HeartHandshake className="h-3 w-3 mr-1" /> Ready
                  </Badge>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {lead.state || "—"} · {lead.owner || "Unassigned"}
                </div>
                <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
                  <Link to="/authorizations" className="text-[11.5px] text-primary hover:underline">
                    → Authorizations
                  </Link>
                  <Link to="/ops/scheduling" className="text-[11.5px] text-primary hover:underline">
                    → Scheduling
                  </Link>
                  <Link to="/qa-team" className="text-[11.5px] text-primary hover:underline">
                    → Clinical
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ---------- Operational insights: aging + workload ---------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <SectionHeader
            title="Aging by stage"
            subtitle="Average and oldest days waiting in each canonical stage."
          />
          <div className="space-y-1.5">
            {agingByStage.map((s) => {
              const hot = s.oldest >= 14;
              const warn = !hot && s.oldest >= 7;
              return (
                <Link
                  key={s.stage}
                  to={`/leads?stage=${encodeURIComponent(s.stage)}`}
                  className="group flex items-center justify-between rounded-xl border border-border/50 bg-card px-3 py-2 text-sm transition-all hover:border-primary/30 hover:shadow-sm"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span
                      className={cn(
                        "grid place-items-center h-7 w-7 rounded-lg shrink-0",
                        hot
                          ? "bg-rose-500/10 text-rose-600"
                          : warn
                          ? "bg-amber-500/10 text-amber-600"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Clock className="h-3.5 w-3.5" />
                    </span>
                    <span className="truncate font-medium">{s.stage}</span>
                  </span>
                  <span className="flex items-center gap-2 shrink-0">
                    <span className="text-[11.5px] tabular-nums text-muted-foreground">
                      {s.count} · avg {s.avg}d · oldest{" "}
                      <span
                        className={
                          hot
                            ? "text-rose-600 font-semibold"
                            : warn
                            ? "text-amber-600 font-semibold"
                            : ""
                        }
                      >
                        {s.oldest}d
                      </span>
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-foreground transition" />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section>
          <SectionHeader
            title="Owner workload"
            subtitle="Open pipeline families per coordinator."
          />
          {ownerWorkload.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-card/50 p-6 text-center text-xs text-muted-foreground">
              No active leads in pipeline.
            </div>
          ) : (
            <div className="space-y-1.5">
              {ownerWorkload.map((o) => (
                <Link
                  key={o.owner}
                  to={`/leads?owner=${encodeURIComponent(o.owner)}`}
                  className="group block rounded-xl border border-border/50 bg-card px-3 py-2 transition-all hover:border-primary/30 hover:shadow-sm"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="grid place-items-center h-7 w-7 rounded-lg text-[10px] font-semibold bg-primary/10 text-primary shrink-0">
                        {o.owner
                          .split(" ")
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join("")}
                      </span>
                      <span className="truncate font-medium">{o.owner}</span>
                    </span>
                    <span className="flex items-center gap-2 shrink-0">
                      <span className="tabular-nums text-[11.5px] text-muted-foreground">
                        {o.total}
                        {o.risk > 0 && (
                          <span className="text-amber-600 ml-1">· {o.risk} at risk</span>
                        )}
                      </span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-foreground transition" />
                    </span>
                  </div>
                  <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary/70 group-hover:bg-primary transition-all"
                      style={{ width: `${(o.total / maxOwner) * 100}%` }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ---------- Secondary insights: source + state (restrained) ---------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <SectionHeader
            title="Where families come from"
            subtitle="Top referral sources in your active queue."
          />
          {sourceBreakdown.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-card/50 p-5 text-center text-xs text-muted-foreground">
              No data yet.
            </div>
          ) : (
            <div className="rounded-2xl border border-border/60 bg-card p-3 space-y-1">
              {sourceBreakdown.map(([src, n]) => (
                <Link
                  key={src}
                  to={`/leads?source=${encodeURIComponent(src)}`}
                  className="group flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/60 transition"
                >
                  <Signal className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-[13px] font-medium truncate flex-1">{src}</span>
                  <div className="w-24 h-1 rounded-full bg-muted overflow-hidden shrink-0">
                    <div
                      className="h-full rounded-full bg-primary/60"
                      style={{ width: `${(n / maxSource) * 100}%` }}
                    />
                  </div>
                  <span className="tabular-nums text-[11.5px] text-muted-foreground w-6 text-right">
                    {n}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionHeader
            title="Coverage by state"
            subtitle="Active families across Blossom’s regions."
          />
          {stateBreakdown.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-card/50 p-5 text-center text-xs text-muted-foreground">
              No data yet.
            </div>
          ) : (
            <div className="rounded-2xl border border-border/60 bg-card p-3 space-y-1">
              {stateBreakdown.map(([state, n]) => (
                <Link
                  key={state}
                  to={`/leads?state=${encodeURIComponent(state)}`}
                  className="group flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/60 transition"
                >
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-[13px] font-medium truncate flex-1">{state}</span>
                  <div className="w-24 h-1 rounded-full bg-muted overflow-hidden shrink-0">
                    <div
                      className="h-full rounded-full bg-primary/60"
                      style={{ width: `${(n / maxState) * 100}%` }}
                    />
                  </div>
                  <span className="tabular-nums text-[11.5px] text-muted-foreground w-6 text-right">
                    {n}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ---------- Admin-only diagnostics (collapsed, does not dominate) ---------- */}
      {isAdminView && (
        <details
          data-testid="intake-admin-diagnostics"
          className="group rounded-2xl border border-border/50 bg-card/40"
        >
          <summary className="cursor-pointer list-none flex items-center justify-between gap-3 px-4 py-3 text-xs font-medium text-muted-foreground hover:text-foreground transition">
            <span className="inline-flex items-center gap-2">
              <Settings2 className="h-3.5 w-3.5" />
              System diagnostics
              <span className="text-muted-foreground/70 font-normal">
                · admin-only, not shown to Intake staff
              </span>
            </span>
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-open:rotate-90" />
          </summary>
          <div className="border-t border-border/50 p-4">
            <IntakeSystemHealthPanel />
          </div>
        </details>
      )}

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
