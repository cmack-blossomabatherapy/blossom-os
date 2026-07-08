import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle, Flame, ArrowRight, Sparkles, Activity, Users, UserPlus,
  CalendarDays, FileCheck2, ClipboardCheck, Bot, MapPin,
  Zap, ShieldAlert, Clock, CheckCircle2, ChevronRight, Hash, Radio,
  TrendingUp, PhoneCall, FileText, UserCog, Building2, Inbox, ListChecks,
  PlusCircle, Send, Search, Command,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { useAuth } from "@/contexts/AuthContext";
import { useOSRole } from "@/contexts/OSRoleContext";
import { cn } from "@/lib/utils";
import { useStateOps } from "@/hooks/useStateOps";
import { weeklySeries, quickStats } from "@/lib/analytics/stateOps";
import { HoursVsClientsChart } from "@/components/state-director/HoursVsClientsChart";
import { useStateWorkforce } from "@/hooks/useStateWorkforce";
import { useLiveAuthorizations } from "@/hooks/useLiveAuthorizations";
import { daysUntil } from "@/data/authorizations";
import { useRecruitingCandidates } from "@/hooks/useRecruitingCandidates";
import { useExecutiveActivity } from "@/hooks/useExecutiveActivity";

/* ---------- design atoms ---------- */

const STATE_NAMES: Record<string, string> = {
  NC: "North Carolina", GA: "Georgia", VA: "Virginia", TN: "Tennessee", MD: "Maryland",
};

const REGIONS_BY_STATE: Record<string, string[]> = {
  NC: ["Charlotte", "Raleigh", "Greensboro", "Durham", "Wilmington"],
  GA: ["Atlanta", "Savannah", "Augusta", "Columbus", "Athens"],
  VA: ["Richmond", "Norfolk", "Arlington", "Roanoke", "Charlottesville"],
  TN: ["Nashville", "Memphis", "Knoxville", "Chattanooga", "Clarksville"],
  MD: ["Baltimore", "Bethesda", "Annapolis", "Frederick", "Rockville"],
};

type Urgency = "critical" | "high" | "watch";

function urgencyTone(u: Urgency) {
  if (u === "critical")
    return {
      dot: "bg-[hsl(355_75%_55%)]",
      pill: "bg-[hsl(355_100%_95%)] text-[hsl(355_72%_48%)]",
      glow: "shadow-[0_0_0_1px_hsl(355_75%_70%/0.30),0_20px_50px_-26px_hsl(355_72%_55%/0.45)]",
      label: "Critical",
    };
  if (u === "high")
    return {
      dot: "bg-[hsl(30_90%_55%)]",
      pill: "bg-[hsl(30_100%_94%)] text-[hsl(28_85%_42%)]",
      glow: "shadow-[0_0_0_1px_hsl(30_90%_70%/0.28),0_20px_50px_-26px_hsl(28_85%_50%/0.40)]",
      label: "High",
    };
  return {
    dot: "bg-[hsl(220_60%_60%)]",
    pill: "bg-[hsl(220_70%_95%)] text-[hsl(220_60%_45%)]",
    glow: "shadow-[0_0_0_1px_hsl(220_60%_75%/0.28),0_18px_44px_-26px_hsl(220_60%_50%/0.35)]",
    label: "Watch",
  };
}

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-white/70 bg-white/80 backdrop-blur",
        "shadow-[0_1px_0_hsl(0_0%_100%/0.6)_inset,0_22px_50px_-34px_hsl(220_40%_30%/0.18)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

function SectionHeader({ icon: Icon, title, sub, action }: {
  icon: React.ComponentType<{ className?: string }>; title: string; sub?: string; action?: React.ReactNode;
}) {
  return (
    <header className="flex items-end justify-between gap-3 px-5 pt-5">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[hsl(265_85%_96%)] to-white text-[hsl(265_70%_55%)] ring-1 ring-[hsl(265_60%_88%)]">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-[15.5px] font-semibold tracking-tight leading-tight">{title}</h3>
          {sub && <p className="mt-0.5 text-[11.5px] text-muted-foreground leading-snug">{sub}</p>}
        </div>
      </div>
      {action}
    </header>
  );
}

function MiniStat({ label, value, tone = "neutral" }: { label: string; value: string | number; tone?: "ok" | "warn" | "bad" | "neutral" }) {
  const cls =
    tone === "ok" ? "text-[hsl(155_55%_38%)]" :
    tone === "warn" ? "text-[hsl(28_85%_45%)]" :
    tone === "bad" ? "text-[hsl(355_72%_52%)]" : "text-foreground";
  return (
    <div className="rounded-xl border border-foreground/[0.06] bg-white/60 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-[20px] font-semibold tracking-tight tabular-nums leading-none", cls)}>{value}</p>
    </div>
  );
}

function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "ok" | "warn" | "bad" | "neutral" }) {
  const cls =
    tone === "ok" ? "bg-[hsl(150_70%_94%)] text-[hsl(155_55%_32%)]" :
    tone === "warn" ? "bg-[hsl(40_100%_94%)] text-[hsl(30_80%_42%)]" :
    tone === "bad" ? "bg-[hsl(355_100%_95%)] text-[hsl(355_70%_48%)]" :
    "bg-foreground/[0.05] text-foreground/70";
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold", cls)}>{children}</span>;
}

function QuickAction({ icon: Icon, label, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group inline-flex items-center gap-1.5 rounded-full border border-foreground/10 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-foreground/75 transition hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-white hover:text-foreground"
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}

/* ---------- live-derived operational data (scoped by state) ---------- */

type AttentionItem = {
  id: string; urgency: Urgency; title: string; detail: string; owner: string;
  region: string; daysOverdue?: number; impact: string;
  actions: { label: string; icon: React.ComponentType<{ className?: string }> }[];
};

type Task = { id: string; title: string; meta: string; due: string; urgency: Urgency; category: string };
// Hardcoded MESSAGES sample data was removed as part of Executive Leadership
// persistence hardening. Any leadership-facing feed on this page must come
// from durable Supabase records (executive activity, system_issues, or
// leadership updates) — never from a static array pretending to be live.

/* ---------- page ---------- */

export default function OSCommandCenter() {
  const { user } = useAuth();
  const { activeState, role } = useOSRole();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const stateName = STATE_NAMES[activeState] ?? activeState;
  const regions = REGIONS_BY_STATE[activeState] ?? REGIONS_BY_STATE.NC;

  const { sessions, hasAnyData } = useStateOps(activeState, "4w");
  const series = useMemo(() => weeklySeries(sessions), [sessions]);
  const stats = useMemo(() => quickStats(sessions), [sessions]);

  // Live BCBA roster + caseload signals for the active state.
  const workforce = useStateWorkforce(activeState);
  const liveBcbas = useMemo(() => {
    const ranked = [...workforce.bcbas].sort((a, b) => {
      const score = (x: typeof a) =>
        (x.status === "Overloaded" ? 4 : x.status === "Near Capacity" ? 3 : x.status === "Needs Attention" ? 1 : 0) +
        x.authRisks * 2 + x.staffingGaps;
      return score(b) - score(a);
    });
    return ranked.slice(0, 6).map((b) => {
      const risk: Urgency =
        b.status === "Overloaded" || b.authRisks >= 2 ? "critical" :
        b.status === "Near Capacity" || b.authRisks >= 1 || b.staffingGaps >= 2 ? "high" : "watch";
      return { name: b.name, caseload: b.caseload, supervisionPct: b.supervisionPct, overduePRs: b.authRisks, risk, region: b.region };
    });
  }, [workforce.bcbas]);

  // Live auth / PR risk items for the active state.
  const liveAuths = useLiveAuthorizations();
  const liveRisks = useMemo(() => {
    const inState = liveAuths.items.filter((a) => !activeState || a.state === activeState);
    const items = inState.flatMap((a) => {
      const d = daysUntil(a.expirationDate);
      const out: { client: string; bcba: string; type: string; daysRemaining: number; urgency: Urgency }[] = [];
      if (d !== null && d <= 30) {
        const urgency: Urgency = d < 0 || d <= 7 ? "critical" : d <= 14 ? "high" : "watch";
        out.push({ client: a.clientName, bcba: liveAuths.bcbaById.get(a.id) ?? a.coordinator ?? "—", type: "Auth expires", daysRemaining: d, urgency });
      }
      if (a.stage === "In QA Review" && a.daysInStage >= 3) {
        out.push({ client: a.clientName, bcba: liveAuths.bcbaById.get(a.id) ?? a.coordinator ?? "—", type: "QA stalled", daysRemaining: -a.daysInStage, urgency: a.daysInStage >= 7 ? "critical" : "high" });
      }
      if (a.missingInfo) {
        out.push({ client: a.clientName, bcba: liveAuths.bcbaById.get(a.id) ?? a.coordinator ?? "—", type: "Missing documentation", daysRemaining: 0, urgency: "high" });
      }
      return out;
    });
    const rank = (u: Urgency) => (u === "critical" ? 0 : u === "high" ? 1 : 2);
    return items.sort((x, y) => rank(x.urgency) - rank(y.urgency) || x.daysRemaining - y.daysRemaining).slice(0, 6);
  }, [liveAuths.items, liveAuths.bcbaById, activeState]);

  // Live recruiting candidates scoped to active state.
  const { candidates: allCandidates } = useRecruitingCandidates();
  const recruitingScoped = useMemo(
    () => allCandidates.filter((c) => !activeState || c.state === activeState),
    [allCandidates, activeState],
  );
  const recruitingStats = useMemo(() => {
    const countStage = (...stages: string[]) =>
      recruitingScoped.filter((c) => stages.includes(c.pipeline_stage)).length;
    const activeApplicants = recruitingScoped.filter(
      (c) => !["Staffed", "Withdrawn", "Rejected", "On Hold"].includes(c.pipeline_stage),
    ).length;
    const onboardingPending = countStage("Background Check", "Onboarding");
    const orientationScheduled = countStage("Orientation Scheduled");
    const interviewsActive = countStage("Interview Scheduled");
    const bcbaPipeline = recruitingScoped.filter((c) => c.role === "BCBA" && !["Staffed", "Withdrawn", "Rejected"].includes(c.pipeline_stage)).length;
    const rbtPipeline = recruitingScoped.filter((c) => (c.role === "RBT" || c.role === "BT") && !["Staffed", "Withdrawn", "Rejected"].includes(c.pipeline_stage)).length;
    const stalled = recruitingScoped.filter((c) => {
      const ms = Date.now() - new Date(c.stage_entered_at).getTime();
      return ms / 86400000 > 10 && ["Background Check", "Onboarding", "Orientation Scheduled"].includes(c.pipeline_stage);
    }).length;
    return { activeApplicants, interviewsActive, onboardingPending, orientationScheduled, bcbaPipeline, rbtPipeline, stalled };
  }, [recruitingScoped]);

  // Staffing stats derived from workforce + auth signals.
  const staffingStats = useMemo(() => {
    const needs = workforce.staffingNeeds ?? [];
    const unstaffed = needs.filter((n) => n.urgency === "critical").length;
    const partial = needs.filter((n) => n.urgency === "high" || n.need === "Partial").length;
    const totalClients = workforce.bcbas.reduce((sum, b) => sum + b.caseload, 0);
    const staffed = Math.max(0, totalClients - unstaffed - partial);
    const bcbaCap = workforce.bcbas.length === 0 ? 0 :
      Math.round((workforce.bcbas.reduce((s, b) => s + b.caseload, 0) / (workforce.bcbas.length * 12)) * 100);
    const rbtUtil = workforce.rbts.length === 0 ? 0 :
      Math.round(workforce.rbts.reduce((s, r) => s + (r.utilization ?? 0), 0) / workforce.rbts.length);
    const urgentPct = totalClients === 0 ? 0 : Math.round((unstaffed / totalClients) * 100);
    return { staffed, partial, unstaffed, bcbaCap, rbtUtil, urgentPct };
  }, [workforce.staffingNeeds, workforce.bcbas, workforce.rbts]);

  // Live ATTENTION items derived from auths + workforce + recruiting.
  const attention = useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = [];
    const inState = liveAuths.items.filter((a) => !activeState || a.state === activeState);

    const expiringSoon = inState.filter((a) => {
      const d = daysUntil(a.expirationDate);
      return d !== null && d <= 14 && d >= 0;
    });
    if (expiringSoon.length > 0) {
      items.push({
        id: "att-exp",
        urgency: expiringSoon.some((a) => (daysUntil(a.expirationDate) ?? 99) <= 7) ? "critical" : "high",
        title: `${expiringSoon.length} authorization${expiringSoon.length === 1 ? "" : "s"} expire in ≤14 days`,
        detail: "Reauth packets not yet submitted — service interruption risk.",
        owner: "Auth Coordinator", region: regions[0],
        impact: `${expiringSoon.length} famil${expiringSoon.length === 1 ? "y" : "ies"} at risk`,
        actions: [
          { label: "Open Auths", icon: FileCheck2 },
          { label: "Assign", icon: UserCog },
        ],
      });
    }

    const qaStalled = inState.filter((a) => a.stage === "In QA Review" && a.daysInStage >= 3);
    if (qaStalled.length > 0) {
      const worst = Math.max(...qaStalled.map((a) => a.daysInStage));
      items.push({
        id: "att-qa",
        urgency: worst >= 7 ? "critical" : "high",
        title: `${qaStalled.length} progress report${qaStalled.length === 1 ? "" : "s"} stalled in QA`,
        detail: `Oldest in QA review ${worst} days. SLA past 48h.`,
        owner: "QA / Compliance", region: regions[1], daysOverdue: worst,
        impact: "QA + billing held",
        actions: [
          { label: "Open QA Queue", icon: ClipboardCheck },
          { label: "Escalate", icon: ShieldAlert },
        ],
      });
    }

    const missing = inState.filter((a) => a.missingInfo);
    if (missing.length > 0) {
      items.push({
        id: "att-miss",
        urgency: "high",
        title: `${missing.length} auth${missing.length === 1 ? "" : "s"} missing documentation`,
        detail: "Required documents not on file — blocks submission.",
        owner: "Auth Coordinator", region: regions[2],
        impact: "Submission blocked",
        actions: [
          { label: "Open Auths", icon: FileCheck2 },
          { label: "Create Task", icon: PlusCircle },
        ],
      });
    }

    const overloaded = workforce.bcbas.filter((b) => b.status === "Overloaded" || b.status === "Near Capacity");
    if (overloaded.length > 0) {
      items.push({
        id: "att-bcba",
        urgency: overloaded.some((b) => b.status === "Overloaded") ? "high" : "watch",
        title: `${overloaded.length} BCBA caseload${overloaded.length === 1 ? "" : "s"} at or above capacity`,
        detail: "Supervision quality + coverage flexibility at risk.",
        owner: "State Director", region: regions[3],
        impact: "Burnout + supervision gaps",
        actions: [
          { label: "Review Caseload", icon: Users },
          { label: "Schedule 1:1", icon: CalendarDays },
        ],
      });
    }

    const criticalStaffing = (workforce.staffingNeeds ?? []).filter((n) => n.urgency === "critical");
    if (criticalStaffing.length > 0) {
      items.push({
        id: "att-staff",
        urgency: "critical",
        title: `${criticalStaffing.length} unstaffed client${criticalStaffing.length === 1 ? "" : "s"} · approved for services`,
        detail: "Awaiting RBT assignment. Auth clocks ticking.",
        owner: "Scheduling Team", region: criticalStaffing[0].region || regions[0],
        impact: `~${criticalStaffing.reduce((s, n) => s + (n.hoursNeeded || 0), 0)} hrs/wk unbooked`,
        actions: [
          { label: "Open Scheduling", icon: CalendarDays },
          { label: "Escalate", icon: ShieldAlert },
        ],
      });
    }

    if (recruitingStats.stalled > 0) {
      items.push({
        id: "att-rec",
        urgency: "high",
        title: `${recruitingStats.stalled} candidate${recruitingStats.stalled === 1 ? "" : "s"} stalled in onboarding`,
        detail: "Background check or orientation incomplete > 10 days.",
        owner: "Recruiting", region: regions[0], daysOverdue: 10,
        impact: `${recruitingStats.bcbaPipeline + recruitingStats.rbtPipeline} active in pipeline`,
        actions: [{ label: "Open Recruiting", icon: UserPlus }],
      });
    }

    const rank = (u: Urgency) => (u === "critical" ? 0 : u === "high" ? 1 : 2);
    return items.sort((a, b) => rank(a.urgency) - rank(b.urgency));
  }, [liveAuths.items, workforce.bcbas, workforce.staffingNeeds, recruitingStats, activeState, regions]);

  // Live AI insights derived from real counts.
  const aiInsights = useMemo(() => {
    const list: { id: string; icon: React.ComponentType<{ className?: string }>; text: string }[] = [];
    const expiring = liveAuths.items.filter((a) => {
      const d = daysUntil(a.expirationDate);
      return d !== null && d >= 0 && d <= 14 && (!activeState || a.state === activeState);
    }).length;
    const qa = liveAuths.items.filter((a) => a.stage === "In QA Review" && a.daysInStage >= 3 && (!activeState || a.state === activeState)).length;
    const missing = liveAuths.items.filter((a) => a.missingInfo && (!activeState || a.state === activeState)).length;
    const overloaded = workforce.bcbas.filter((b) => b.status === "Overloaded").length;
    if (expiring) list.push({ id: "ai-exp", icon: ShieldAlert, text: `Auth risk: ${expiring} authorization${expiring === 1 ? "" : "s"} expire within 14 days.` });
    if (qa) list.push({ id: "ai-qa", icon: AlertTriangle, text: `${qa} progress report${qa === 1 ? "" : "s"} stalled in QA > 3 days. Recommend escalation.` });
    if (overloaded) list.push({ id: "ai-bcba", icon: TrendingUp, text: `${overloaded} BCBA${overloaded === 1 ? "" : "s"} above capacity — caseload rebalance suggested.` });
    if (recruitingStats.stalled) list.push({ id: "ai-rec", icon: UserPlus, text: `${recruitingStats.stalled} candidate${recruitingStats.stalled === 1 ? "" : "s"} stalled in onboarding > 10 days.` });
    if (missing) list.push({ id: "ai-miss", icon: AlertTriangle, text: `${missing} auth${missing === 1 ? "" : "s"} blocked on missing documentation.` });
    if (list.length === 0) list.push({ id: "ai-ok", icon: Activity, text: `Operations look healthy in ${stateName}. No critical risks detected.` });
    return list.slice(0, 5);
  }, [liveAuths.items, workforce.bcbas, recruitingStats, activeState, stateName]);

  // Action Queue derived from live signals, grouped operationally.
  const actionGroups = useMemo(() => {
    const today: Task[] = [];
    const waiting: Task[] = [];
    const approvals: Task[] = [];
    const escalations: Task[] = [];
    const inState = liveAuths.items.filter((a) => !activeState || a.state === activeState);

    inState.forEach((a) => {
      const d = daysUntil(a.expirationDate);
      if (d !== null && d >= 0 && d <= 7) {
        today.push({
          id: `tk-exp-${a.id}`,
          title: `Reauth · ${a.clientName}`,
          meta: `Auth expires in ${d}d · ${a.payor}`,
          due: d === 0 ? "Today" : `In ${d}d`,
          urgency: d <= 3 ? "critical" : "high",
          category: "Auth",
        });
      }
      if (a.stage === "In QA Review" && a.daysInStage >= 3) {
        waiting.push({
          id: `tk-qa-${a.id}`,
          title: `PR in QA · ${a.clientName}`,
          meta: `Waiting on ${a.qaOwner ?? "QA"} · ${a.daysInStage}d`,
          due: `Waiting ${a.daysInStage}d`,
          urgency: a.daysInStage >= 7 ? "high" : "watch",
          category: "QA",
        });
      }
      if (a.stage === "Awaiting Submission" && a.treatmentPlanReceived && !a.missingInfo) {
        approvals.push({
          id: `tk-app-${a.id}`,
          title: `Approve submission · ${a.clientName}`,
          meta: `${a.authType} · ${a.payor}`,
          due: "Awaiting",
          urgency: "high",
          category: "Auth",
        });
      }
    });

    (workforce.staffingNeeds ?? []).filter((n) => n.urgency === "critical").slice(0, 3).forEach((n) => {
      escalations.push({
        id: `tk-staff-${n.id}`,
        title: `Staff ${n.client}`,
        meta: `${n.region} · ${n.hoursNeeded}h/wk · ${n.need} needed`,
        due: "Open",
        urgency: "critical",
        category: "Staffing",
      });
    });

    workforce.bcbas.filter((b) => b.status === "Overloaded").slice(0, 2).forEach((b) => {
      escalations.push({
        id: `tk-bcba-${b.id ?? b.name}`,
        title: `Caseload overload · ${b.name}`,
        meta: `${b.region} · ${b.caseload} clients`,
        due: "Open",
        urgency: "high",
        category: "BCBA",
      });
    });

    return [
      { id: "today", label: "Due Today", icon: Clock, tasks: today.slice(0, 4) },
      { id: "waiting", label: "Waiting on Others", icon: Inbox, tasks: waiting.slice(0, 4) },
      { id: "approvals", label: "Approvals Needed", icon: CheckCircle2, tasks: approvals.slice(0, 4) },
      { id: "escalations", label: "Escalations", icon: Flame, tasks: escalations.slice(0, 4) },
    ];
  }, [liveAuths.items, workforce.staffingNeeds, workforce.bcbas, activeState]);

  // Recent operational feed from auths activity.
  const feed = useMemo(() => {
    const inState = liveAuths.items.filter((a) => !activeState || a.state === activeState);
    const sorted = [...inState]
      .filter((a) => a.lastActivity)
      .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
      .slice(0, 6);
    const fmt = (d: string) => {
      const ms = Date.now() - new Date(d).getTime();
      const m = Math.floor(ms / 60000);
      if (m < 60) return `${m}m ago`;
      const h = Math.floor(m / 60);
      if (h < 24) return `${h}h ago`;
      return `${Math.floor(h / 24)}d ago`;
    };
    return sorted.map((a) => {
      const stage = a.stage;
      const tone: "ok" | "warn" | "neutral" =
        stage === "Approved" ? "ok" :
        stage === "Denied" || stage === "Expiring Soon" ? "warn" : "neutral";
      const icon =
        stage === "Approved" ? CheckCircle2 :
        stage === "Denied" ? ShieldAlert :
        stage === "In QA Review" ? ClipboardCheck :
        stage === "Submitted" ? Send : FileCheck2;
      return {
        id: `feed-${a.id}`,
        icon,
        text: `${stage} · ${a.clientName} · ${a.payor}`,
        meta: `${fmt(a.lastActivity)} · Auth`,
        tone,
      };
    });
  }, [liveAuths.items, activeState]);

  const name = ((user?.user_metadata?.display_name as string) || user?.email?.split("@")[0] || "Director").split(" ")[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  const criticalCount = attention.filter((a) => a.urgency === "critical").length;
  const highCount = attention.filter((a) => a.urgency === "high").length;

  /* ---------- right rail: AI assistant ---------- */
  const rightRail = (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-[hsl(265_100%_97%)] via-white to-[hsl(285_100%_97%)] px-5 py-5">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(285_85%_70%)] text-white shadow-[0_8px_24px_-10px_hsl(265_85%_55%/0.7)]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[13.5px] font-semibold tracking-tight">AI State Insights</p>
              <p className="text-[11px] text-muted-foreground">{stateName} · live</p>
            </div>
          </div>
          <div className="mt-4 space-y-2.5">
            {aiInsights.map((i) => (
              <div key={i.id} className="flex items-start gap-2.5 rounded-xl border border-white/70 bg-white/70 p-2.5">
                <i.icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(265_70%_55%)]" />
                <p className="text-[12px] leading-snug text-foreground/85">{i.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-1.5">
            {[
              { label: "Prioritize my day", icon: ListChecks },
              { label: "Find op risks", icon: ShieldAlert },
              { label: "Summarize staffing", icon: Users },
              { label: "Action list", icon: Zap },
            ].map((b) => (
              <button key={b.label} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[hsl(265_60%_88%)] bg-white/80 px-2.5 py-1.5 text-[11px] font-semibold text-[hsl(265_70%_50%)] transition hover:bg-white">
                <b.icon className="h-3 w-3" />
                <span className="truncate">{b.label}</span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="px-5 py-5">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-[hsl(355_72%_55%)]" />
          <p className="text-[13px] font-semibold tracking-tight">Urgent now</p>
        </div>
        <p className="mt-1 text-[11.5px] text-muted-foreground">{criticalCount} critical · {highCount} high</p>
        <div className="mt-3 space-y-2">
          {attention.filter((a) => a.urgency === "critical").map((a) => (
            <div key={a.id} className="rounded-xl bg-[hsl(355_100%_97%)] p-2.5">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[hsl(355_75%_55%)]" />
                <p className="text-[12px] font-semibold leading-snug">{a.title}</p>
              </div>
              <p className="mt-0.5 text-[10.5px] text-muted-foreground">{a.owner} · {a.region}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  return (
    <OSShell rightRail={rightRail}>
      <div className="space-y-5 pb-24">
        {/* ============ HEADER ============ */}
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {today} · {stateName} · Command Center
            </p>
            <h1 className="mt-1 text-[26px] font-semibold tracking-tight md:text-[30px]">
              {greet}, {name}.
            </h1>
            <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
              {hasAnyData ? `This week · ${stats.hoursThisWeek.toFixed(0)} hours across ${stats.clientsThisWeek} active patients.` : "Your operational workspace — everything you need to run the state."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-foreground/10 bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-foreground/70 backdrop-blur">
              <Activity className="h-3 w-3 text-[hsl(155_55%_45%)]" /> All systems live
            </span>
          </div>
        </header>

        {/* ============ COMMAND BAR ============ */}
        <Card className="px-4 py-3">
          <div className="flex items-center gap-3">
            <Search className="h-4 w-4 shrink-0 text-foreground/60" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients, staff, auths, candidates, reports…"
              className="flex-1 bg-transparent text-[13.5px] placeholder:text-foreground/40 focus:outline-none"
            />
            <div className="hidden items-center gap-1 rounded-md border border-foreground/10 bg-foreground/[0.04] px-1.5 py-0.5 text-[10.5px] font-semibold text-foreground/60 sm:flex">
              <Command className="h-3 w-3" /> K
            </div>
          </div>
        </Card>

        {/* ============ OPERATIONAL PULSE ============ */}
        <Card>
          <SectionHeader
            icon={Activity}
            title="Operational Pulse"
            sub="Active clients vs total service hours — operational health at a glance"
            action={<Pill tone="ok">Healthy</Pill>}
          />
          <div className="grid gap-3 px-5 pt-4 sm:grid-cols-2 lg:grid-cols-5">
            <MiniStat label="Active clients" value={hasAnyData ? stats.clientsThisWeek : 47} tone="neutral" />
            <MiniStat label="Hours this week" value={hasAnyData ? stats.hoursThisWeek.toFixed(0) : 728} tone="ok" />
            <MiniStat label="Staffed %" value={`${staffingStats.staffed + staffingStats.partial + staffingStats.unstaffed === 0 ? 0 : Math.round((staffingStats.staffed / (staffingStats.staffed + staffingStats.partial + staffingStats.unstaffed)) * 100)}%`} tone="ok" />
            <MiniStat label="Recruiting" value={recruitingStats.activeApplicants} tone="neutral" />
            <MiniStat label="Auths at risk" value={liveRisks.length} tone="warn" />
          </div>
          <div className="px-5 pb-5 pt-4">
            <HoursVsClientsChart data={series} />
          </div>
        </Card>

        {/* ============ ATTENTION REQUIRED ============ */}
        <Card>
          <SectionHeader
            icon={AlertTriangle}
            title="Attention Required"
            sub="The operational signals that need a decision today"
            action={<Pill tone="bad">{criticalCount} critical · {highCount} high</Pill>}
          />
          <div className="grid gap-3 px-5 pb-5 pt-4 md:grid-cols-2">
            {attention.length === 0 && (
              <p className="text-[12px] text-muted-foreground px-1 py-3 md:col-span-2">No operational risks flagged for {stateName}. All clear.</p>
            )}
            {attention.map((a) => {
              const t = urgencyTone(a.urgency);
              const Icon = a.urgency === "critical" ? Flame : a.urgency === "high" ? AlertTriangle : Activity;
              return (
                <article
                  key={a.id}
                  className={cn(
                    "group rounded-2xl border border-white/70 bg-white/85 p-4 backdrop-blur transition hover:-translate-y-0.5",
                    t.glow,
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", t.pill)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", t.pill)}>
                          {t.label}
                        </span>
                        <span className="text-[10.5px] text-muted-foreground">{a.region}</span>
                        {typeof a.daysOverdue === "number" && a.daysOverdue > 0 && (
                          <span className="text-[10.5px] font-semibold text-[hsl(355_72%_55%)]">· {a.daysOverdue}d overdue</span>
                        )}
                      </div>
                      <p className="mt-1.5 text-[13.5px] font-semibold leading-snug">{a.title}</p>
                      <p className="mt-0.5 text-[11.5px] text-muted-foreground">{a.detail}</p>
                      <div className="mt-2 flex items-center gap-2 text-[10.5px] text-muted-foreground">
                        <UserCog className="h-3 w-3" /> {a.owner}
                        <span>·</span>
                        <TrendingUp className="h-3 w-3" /> {a.impact}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {a.actions.map((act) => (
                          <QuickAction key={act.label} icon={act.icon} label={act.label} />
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </Card>

        {/* ============ MY ACTION QUEUE ============ */}
        <Card>
          <SectionHeader icon={ListChecks} title="My Action Queue" sub="Your daily operational workspace" />
          <div className="grid gap-4 px-5 pb-5 pt-4 md:grid-cols-2 xl:grid-cols-4">
            {actionGroups.map((g) => (
              <div key={g.id} className="rounded-2xl border border-foreground/[0.06] bg-white/60 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <g.icon className="h-3.5 w-3.5 text-foreground/60" />
                    <p className="text-[12px] font-semibold tracking-tight">{g.label}</p>
                  </div>
                  <span className="rounded-full bg-foreground/[0.05] px-1.5 py-0.5 text-[10px] font-semibold text-foreground/70">{g.tasks.length}</span>
                </div>
                <div className="mt-2.5 space-y-2">
                  {g.tasks.length === 0 && (
                    <p className="text-[11px] text-muted-foreground py-2">Nothing here.</p>
                  )}
                  {g.tasks.map((t) => {
                    const tone = urgencyTone(t.urgency);
                    return (
                      <div key={t.id} className="rounded-xl border border-white/70 bg-white/90 p-2.5 transition hover:shadow-sm">
                        <div className="flex items-center gap-1.5">
                          <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t.category}</span>
                        </div>
                        <p className="mt-1 text-[12.5px] font-semibold leading-snug">{t.title}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{t.meta}</p>
                        <div className="mt-1.5 flex items-center justify-between text-[10.5px] text-muted-foreground">
                          <span>{t.due}</span>
                          <button className="inline-flex items-center gap-0.5 font-semibold text-foreground/80 hover:text-foreground">
                            Open <ChevronRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* ============ STAFFING + BCBA OVERSIGHT ============ */}
        <div className="grid gap-5 xl:grid-cols-2">
          <Card>
            <SectionHeader
              icon={Users}
              title="Staffing Control Center"
              sub={`Live staffing mission control across ${stateName}`}
              action={<button onClick={() => navigate("/scheduling")} className="inline-flex items-center gap-0.5 text-[11.5px] font-semibold text-foreground/70 hover:text-foreground">Open <ChevronRight className="h-3 w-3" /></button>}
            />
            <div className="grid grid-cols-3 gap-3 px-5 pt-4">
              <MiniStat label="Staffed" value={staffingStats.staffed} tone="ok" />
              <MiniStat label="Partial" value={staffingStats.partial} tone="warn" />
              <MiniStat label="Unstaffed" value={staffingStats.unstaffed} tone="bad" />
            </div>
            <div className="px-5 pb-5 pt-4">
              <div className="space-y-2">
                {[
                  { label: "BCBA capacity", pct: staffingStats.bcbaCap, tone: (staffingStats.bcbaCap >= 90 ? "bad" : staffingStats.bcbaCap >= 75 ? "warn" : "ok") as "ok" | "warn" | "bad" },
                  { label: "RBT utilization", pct: staffingStats.rbtUtil, tone: (staffingStats.rbtUtil >= 75 ? "ok" : staffingStats.rbtUtil >= 50 ? "warn" : "bad") as "ok" | "warn" | "bad" },
                  { label: "Urgent staffing", pct: staffingStats.urgentPct, tone: (staffingStats.urgentPct >= 15 ? "bad" : staffingStats.urgentPct >= 5 ? "warn" : "ok") as "ok" | "warn" | "bad" },
                ].map((b) => (
                  <div key={b.label}>
                    <div className="flex items-center justify-between text-[11.5px]">
                      <span className="text-foreground/80">{b.label}</span>
                      <span className="tabular-nums text-foreground/60">{b.pct}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-foreground/[0.06]">
                      <div
                        className={cn("h-full rounded-full transition-all",
                          b.tone === "ok" && "bg-[hsl(155_60%_50%)]",
                          b.tone === "warn" && "bg-[hsl(30_90%_55%)]",
                          b.tone === "bad" && "bg-[hsl(355_75%_60%)]")}
                        style={{ width: `${b.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <QuickAction icon={CalendarDays} label="Open Scheduling" onClick={() => navigate("/scheduling")} />
                <QuickAction icon={UserPlus} label="Open Recruiting" onClick={() => navigate("/recruiting/workspace")} />
                <QuickAction icon={ShieldAlert} label="Escalate" />
              </div>
            </div>
          </Card>

          <Card>
            <SectionHeader icon={ShieldAlert} title="BCBA Oversight" sub="Caseload, supervision, and overload signals" />
            <div className="px-5 pb-5 pt-4">
              <div className="space-y-2">
                {liveBcbas.length === 0 && (
                  <p className="text-[12px] text-muted-foreground px-1 py-3">No BCBAs found in {stateName}.</p>
                )}
                {liveBcbas.map((b) => {
                  const tone = urgencyTone(b.risk);
                  return (
                    <div key={b.name} className="flex items-center gap-3 rounded-xl border border-foreground/[0.06] bg-white/70 p-3">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[hsl(265_85%_92%)] to-white text-[11px] font-bold text-[hsl(265_70%_50%)] ring-1 ring-[hsl(265_60%_88%)]">
                        {b.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-[12.5px] font-semibold">{b.name}</p>
                          <span className={cn("inline-flex items-center rounded-full px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider", tone.pill)}>{tone.label}</span>
                        </div>
                        <p className="text-[10.5px] text-muted-foreground">{b.region} · {b.caseload} clients · {b.supervisionPct}% supervision · {b.overduePRs} overdue PR</p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button title="Open caseload" className="grid h-7 w-7 place-items-center rounded-lg bg-foreground/[0.04] text-foreground/70 hover:bg-foreground/[0.08]"><Users className="h-3 w-3" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>

        {/* ============ RECRUITING + AUTH RISK ============ */}
        <div className="grid gap-5 xl:grid-cols-2">
          <Card>
            <SectionHeader
              icon={UserPlus}
              title="Recruiting Snapshot"
              sub="Lightweight visibility — not an ATS"
              action={<button onClick={() => navigate("/recruiting/workspace")} className="inline-flex items-center gap-0.5 text-[11.5px] font-semibold text-foreground/70 hover:text-foreground">Open <ChevronRight className="h-3 w-3" /></button>}
            />
            <div className="grid grid-cols-2 gap-3 px-5 pb-5 pt-4 sm:grid-cols-3">
              <MiniStat label="Active applicants" value={recruitingStats.activeApplicants} tone="neutral" />
              <MiniStat label="Interviews scheduled" value={recruitingStats.interviewsActive} tone="neutral" />
              <MiniStat label="Onboarding pending" value={recruitingStats.onboardingPending} tone={recruitingStats.onboardingPending > 5 ? "warn" : "neutral"} />
              <MiniStat label="Orientation scheduled" value={recruitingStats.orientationScheduled} tone="neutral" />
              <MiniStat label="BCBA pipeline" value={recruitingStats.bcbaPipeline} tone={recruitingStats.bcbaPipeline > 0 ? "ok" : "warn"} />
              <MiniStat label="RBT pipeline" value={recruitingStats.rbtPipeline} tone={recruitingStats.rbtPipeline > 0 ? "ok" : "warn"} />
            </div>
            <div className="flex flex-wrap gap-1.5 px-5 pb-5">
              <QuickAction icon={CalendarDays} label="Schedule Interview" />
              <QuickAction icon={UserCog} label="Review Candidate" />
            </div>
          </Card>

          <Card>
            <SectionHeader icon={FileCheck2} title="Auth & PR Risk Center" sub="Expirations, overdue PRs, and supervision gaps" />
            <div className="px-5 pb-5 pt-4">
              <div className="divide-y divide-foreground/[0.06] rounded-xl border border-foreground/[0.06] bg-white/60">
                {liveRisks.length === 0 && (
                  <div className="px-3 py-4 text-[12px] text-muted-foreground">No auth or PR risks flagged right now.</div>
                )}
                {liveRisks.map((r) => {
                  const t = urgencyTone(r.urgency);
                  const overdue = r.daysRemaining < 0;
                  return (
                    <div key={`${r.client}-${r.type}`} className="flex items-center gap-3 px-3 py-2.5">
                      <span className={cn("h-1.5 w-1.5 rounded-full", t.dot)} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-semibold leading-tight">{r.client} <span className="font-normal text-muted-foreground">· {r.bcba}</span></p>
                        <p className="text-[10.5px] text-muted-foreground">{r.type}</p>
                      </div>
                      <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold tabular-nums", t.pill)}>
                        {overdue ? `${Math.abs(r.daysRemaining)}d overdue` : `${r.daysRemaining}d left`}
                      </span>
                      <button className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-foreground/[0.04] text-foreground/70 hover:bg-foreground/[0.08]"><ArrowRight className="h-3 w-3" /></button>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>

        {/* ============ FEED ============ */}
        <Card>
          <SectionHeader icon={Radio} title="Live Operations Feed" sub="Everything that moved in your state" />
          <div className="px-5 pb-5 pt-4">
            <div className="space-y-2">
              {feed.length === 0 && (
                <p className="text-[12px] text-muted-foreground px-1 py-3">No recent activity.</p>
              )}
              {feed.map((f) => (
                <div key={f.id} className="flex items-start gap-3 rounded-xl border border-foreground/[0.06] bg-white/70 p-3">
                  <div className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                    f.tone === "ok" && "bg-[hsl(150_70%_94%)] text-[hsl(155_55%_38%)]",
                    f.tone === "warn" && "bg-[hsl(30_100%_94%)] text-[hsl(28_85%_42%)]",
                    f.tone === "neutral" && "bg-foreground/[0.05] text-foreground/70",
                  )}>
                    <f.icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-semibold leading-snug">{f.text}</p>
                    <p className="mt-0.5 text-[10.5px] text-muted-foreground">{f.meta}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* ============ STATE SNAPSHOT ============ */}
        <Card>
          <SectionHeader icon={MapPin} title={`${stateName} Region Snapshot`} sub="Operational health by region" />
          <div className="grid gap-3 px-5 pb-5 pt-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {regions.map((r, idx) => {
              const risk = idx === 0 ? "high" : idx === 2 ? "watch" : "ok";
              const tone = risk === "ok" ? "ok" : risk === "watch" ? "warn" : "bad";
              return (
                <div key={r} className="rounded-2xl border border-foreground/[0.06] bg-white/70 p-3.5 transition hover:-translate-y-0.5 hover:shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-semibold tracking-tight">{r}</p>
                    <Pill tone={tone as any}>{risk === "ok" ? "Healthy" : risk === "watch" ? "Watch" : "Risk"}</Pill>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-1.5 text-[11px]">
                    <div><p className="text-muted-foreground">Clients</p><p className="font-semibold tabular-nums">{12 + idx * 3}</p></div>
                    <div><p className="text-muted-foreground">Staffing</p><p className="font-semibold tabular-nums">{72 + idx * 4}%</p></div>
                    <div><p className="text-muted-foreground">Recruiting</p><p className="font-semibold tabular-nums">{5 + idx}</p></div>
                    <div><p className="text-muted-foreground">Sessions</p><p className="font-semibold tabular-nums">{82 + idx * 2}%</p></div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <p className="pt-2 text-center text-[11px] text-muted-foreground">
          <Sparkles className="mr-1 inline h-3 w-3" /> One operational workspace · {stateName} · {role.replace(/_/g, " ")}
        </p>
      </div>

      {/* ============ FLOATING QUICK ACTION BAR ============ */}
      <div className="pointer-events-none fixed bottom-5 left-1/2 z-30 hidden -translate-x-1/2 md:block">
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/70 bg-white/90 px-2 py-2 shadow-[0_18px_40px_-18px_hsl(220_40%_30%/0.3)] backdrop-blur">
          {[
            { icon: UserCog, label: "Staff" },
            { icon: UserPlus, label: "Candidate" },
            { icon: ShieldAlert, label: "Escalate" },
            { icon: CalendarDays, label: "Schedule", onClick: () => navigate("/scheduling") },
            { icon: PlusCircle, label: "Task" },
            { icon: FileText, label: "Reports", onClick: () => navigate("/reports") },
            { icon: Bot, label: "Ask AI" },
          ].map((b) => (
            <button
              key={b.label}
              onClick={b.onClick}
              className="group inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-semibold text-foreground/75 transition hover:bg-foreground/[0.06] hover:text-foreground"
            >
              <b.icon className="h-3.5 w-3.5" />
              <span>{b.label}</span>
            </button>
          ))}
        </div>
      </div>
    </OSShell>
  );
}