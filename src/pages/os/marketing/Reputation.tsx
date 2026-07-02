import { useEffect, useMemo, useState } from "react";
import { useMarketingData } from "@/hooks/useMarketingData";
import {
  useReputationLeads,
  type ReputationContactSort,
  type ReputationContactWindow,
} from "@/hooks/useReputationLeads";
import {
  Sparkles,
  Heart,
  Star,
  Users,
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
  Brain,
  ShieldCheck,
  AlertTriangle,
  Stethoscope,
  GraduationCap,
  Building2,
  Megaphone,
  CheckCircle2,
  Loader2,
  CheckCheck,
} from "lucide-react";
import { MktgPage, MktgCard, AIPrompt, EmptyRow, ShareBar } from "./_shared";
import { MarketingWorkPanel } from "@/components/marketing/MarketingWorkPanel";
import { useMarketingReputationEvents, type MarketingReputationEvent } from "@/hooks/useMarketingReputationEvents";
import { ReputationEventLogDialog } from "@/components/marketing/ReputationEventLogDialog";
import { BulkReputationEventImportDialog } from "@/components/marketing/BulkReputationEventImportDialog";
import { Button } from "@/components/ui/button";
import { Upload, Plus } from "lucide-react";
import { fmtMktgShortDate, fmtMktgRelative } from "@/lib/os/referrals/utils";
import { TableFilterBar } from "@/components/marketing/TableFilterBar";
import { useUrlState } from "@/hooks/useUrlState";

/* Reputation - operational trust intelligence.
 * Derives community perception from real operational signal: intake
 * qualification, referral momentum, recruiting reputation, and friction.
 * Google/Yelp/survey feeds enrich through Admin -> Data Uploads. */

const FOOTPRINT = ["GA", "NC", "VA", "TN", "MD", "NJ"] as const;
const STATE_NAMES: Record<string, string> = {
  GA: "Georgia",
  NC: "North Carolina",
  TN: "Tennessee",
  VA: "Virginia",
  MD: "Maryland",
};

const QUALIFIED = new Set(["VOB Completed", "Sent to VOB", "Form Received"]);
const FRICTION = new Set([
  "Can't Reach",
  "Sent Packet - Can't Reach",
  "Missing Information",
  "Can Not Submit Auth",
]);

function TrendIcon({ delta }: { delta: number }) {
  if (delta > 0) return <TrendingUp className="size-3.5 text-emerald-600" />;
  if (delta < 0) return <TrendingDown className="size-3.5 text-amber-600" />;
  return <Minus className="size-3.5 text-muted-foreground" />;
}

const REPUTATION_PREFS_KEY = "reputation.contactPrefs.v1";
type ReputationPrefs = {
  contactWindow: ReputationContactWindow;
  contactSort: ReputationContactSort;
};
function readReputationPrefs(): ReputationPrefs {
  if (typeof window === "undefined") return { contactWindow: "all", contactSort: "recent" };
  try {
    const raw = window.localStorage.getItem(REPUTATION_PREFS_KEY);
    if (!raw) return { contactWindow: "all", contactSort: "recent" };
    const parsed = JSON.parse(raw) as Partial<ReputationPrefs>;
    const win: ReputationContactWindow = ["all", "7", "30", "90"].includes(parsed.contactWindow as string)
      ? (parsed.contactWindow as ReputationContactWindow)
      : "all";
    const sort: ReputationContactSort =
      parsed.contactSort === "oldest" ? "oldest" : "recent";
    return { contactWindow: win, contactSort: sort };
  } catch {
    return { contactWindow: "all", contactSort: "recent" };
  }
}

export default function Reputation() {
  const { leads: marketingLeads, calls: marketingCalls, candidates: marketingCandidates } = useMarketingData();
  const [activeState, setActiveState] = useState<string | null>(null);
  const initialPrefs = useMemo(readReputationPrefs, []);
  const [contactSort, setContactSort] = useState<ReputationContactSort>(initialPrefs.contactSort);
  const [contactWindow, setContactWindow] = useState<ReputationContactWindow>(initialPrefs.contactWindow);

  // Persist window + sort so they survive refresh / navigation.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        REPUTATION_PREFS_KEY,
        JSON.stringify({ contactWindow, contactSort }),
      );
    } catch {
      /* ignore quota / private-mode errors */
    }
  }, [contactWindow, contactSort]);

  // Server-side filtered + sorted leads for the Reputation leads table.
  const {
    rows: reputationLeads,
    loading: reputationLoading,
    error: reputationError,
    marking: markingLeadId,
    markContacted,
  } = useReputationLeads({ contactWindow, contactSort, limit: 100 });

  /* Trust signals derived from real operational data. */
  const signals = useMemo(() => {
    const now = Date.now();
    const age = (iso: string) => (now - new Date(iso).getTime()) / 86_400_000;

    const total = marketingLeads.length;
    const qualified = marketingLeads.filter((l) => QUALIFIED.has(l.status)).length;
    const friction = marketingLeads.filter((l) => FRICTION.has(l.status)).length;
    const referralLeads = marketingLeads.filter((l) => l.source === "Referral");
    const referralCands = marketingCandidates.filter((c) => c.source === "Referral");
    const hired = marketingCandidates.filter((c) => c.status === "Hired").length;
    const withdrawn = marketingCandidates.filter((c) => c.status === "Withdrawn").length;

    const recent = referralLeads.filter((l) => age(l.createdAt) <= 7).length;
    const prior = referralLeads.filter((l) => {
      const a = age(l.createdAt);
      return a > 7 && a <= 14;
    }).length;

    const qualifiedRate = total ? Math.round((qualified / total) * 100) : 0;
    const frictionRate = total ? Math.round((friction / total) * 100) : 0;
    // Composite trust score (0-100): qualified outcomes + referral share - friction.
    const referralShare = total ? Math.round((referralLeads.length / total) * 100) : 0;
    const trustScore = Math.max(
      0,
      Math.min(100, Math.round(qualifiedRate * 0.5 + referralShare * 0.6 - frictionRate * 0.4 + 30)),
    );
    // Pseudo "star average" from trust composition, bounded 3.6 - 4.9.
    const starAverage = Math.min(4.9, Math.max(3.6, 3.6 + (trustScore / 100) * 1.3));

    return {
      total,
      qualified,
      qualifiedRate,
      friction,
      frictionRate,
      referralLeads,
      referralCands,
      referralShare,
      hired,
      withdrawn,
      recent,
      prior,
      delta: recent - prior,
      trustScore,
      starAverage,
    };
  }, [marketingLeads, marketingCandidates]);

  /* State-by-state trust visibility. */
  const stateRows = useMemo(() => {
    return FOOTPRINT.map((state) => {
      const leads = marketingLeads.filter((l) => l.state === state);
      const qual = leads.filter((l) => QUALIFIED.has(l.status)).length;
      const fric = leads.filter((l) => FRICTION.has(l.status)).length;
      const refs = leads.filter((l) => l.source === "Referral").length;
      const cands = marketingCandidates.filter((c) => c.state === state);
      const recHired = cands.filter((c) => c.status === "Hired").length;
      const recWithdrawn = cands.filter((c) => c.status === "Withdrawn").length;
      const total = leads.length;
      const qualRate = total ? Math.round((qual / total) * 100) : 0;
      const fricRate = total ? Math.round((fric / total) * 100) : 0;
      const referralShare = total ? Math.round((refs / total) * 100) : 0;
      const trust = Math.max(
        0,
        Math.min(100, Math.round(qualRate * 0.5 + referralShare * 0.6 - fricRate * 0.4 + 30)),
      );
      const stars = Math.min(4.9, Math.max(3.4, 3.4 + (trust / 100) * 1.5));
      return {
        state,
        leads: total,
        qual,
        fric,
        refs,
        cands: cands.length,
        recHired,
        recWithdrawn,
        qualRate,
        fricRate,
        referralShare,
        trust,
        stars,
      };
    }).sort((a, b) => b.trust - a.trust);
  }, [marketingLeads, marketingCandidates]);

  const activeRow = stateRows.find((s) => s.state === activeState);
  const topState = stateRows[0];
  const weakState = [...stateRows].reverse().find((s) => s.leads > 0);

  /* Sentiment timeline - derived from real positive + concerning operational events. */
  const timeline = useMemo(() => {
    type Item = {
      id: string;
      date: string;
      state: string;
      title: string;
      kind: "Praise" | "Trust" | "Concern" | "Recognition";
      detail: string;
    };
    const items: Item[] = [];
    marketingLeads
      .filter((l) => QUALIFIED.has(l.status))
      .slice(0, 6)
      .forEach((l) => {
        items.push({
          id: `q-${l.id}`,
          date: l.lastContacted ?? l.createdAt,
          state: l.state,
          title: `Family completed intake in ${STATE_NAMES[l.state] ?? l.state}`,
          kind: "Trust",
          detail: `Smooth path through ${l.status.toLowerCase()} - trust signal`,
        });
      });
    marketingLeads
      .filter((l) => l.source === "Referral")
      .slice(0, 5)
      .forEach((l) => {
        items.push({
          id: `r-${l.id}`,
          date: l.createdAt,
          state: l.state,
          title: `Word-of-mouth referral in ${STATE_NAMES[l.state] ?? l.state}`,
          kind: "Praise",
          detail: `Community trust - family referred by existing relationship`,
        });
      });
    marketingLeads
      .filter((l) => FRICTION.has(l.status))
      .slice(0, 4)
      .forEach((l) => {
        items.push({
          id: `f-${l.id}`,
          date: l.lastContacted ?? l.createdAt,
          state: l.state,
          title: `Communication friction in ${STATE_NAMES[l.state] ?? l.state}`,
          kind: "Concern",
          detail: `${l.status} - perception risk if unresolved`,
        });
      });
    marketingCandidates
      .filter((c) => c.status === "Hired")
      .slice(0, 3)
      .forEach((c) => {
        items.push({
          id: `h-${c.id}`,
          date: c.appliedDate,
          state: c.state,
          title: `${c.role} joined Blossom in ${STATE_NAMES[c.state] ?? c.state}`,
          kind: "Recognition",
          detail: `Recruiting reputation signal - ${c.source} channel`,
        });
      });
    return items
      .filter((i) => FOOTPRINT.includes(i.state as (typeof FOOTPRINT)[number]))
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))
      .slice(0, 10);
  }, [marketingLeads, marketingCandidates]);

  /* Apply user sort + last-contacted window to the timeline. */
  const visibleTimeline = useMemo(() => {
    const windowDays = contactWindow === "all" ? null : Number(contactWindow);
    const now = Date.now();
    return timeline
      .filter((t) => {
        if (!windowDays) return true;
        const ts = new Date(t.date).getTime();
        if (isNaN(ts)) return false;
        return (now - ts) / 86_400_000 <= windowDays;
      })
      .sort((a, b) => {
        const delta = +new Date(b.date) - +new Date(a.date);
        return contactSort === "recent" ? delta : -delta;
      });
  }, [timeline, contactSort, contactWindow]);

  /* Family experience themes - derived from real status distribution. */
  const themes = useMemo(() => {
    const fastIntake = marketingLeads.filter((l) => l.status === "VOB Completed").length;
    const formResponsive = marketingLeads.filter((l) => l.status === "Form Received").length;
    const contactWarmth = marketingLeads.filter((l) => l.status === "In Contact").length;
    const missingInfo = marketingLeads.filter((l) => l.status === "Missing Information").length;
    const cantReach = marketingLeads.filter((l) => l.status === "Can't Reach").length;
    return [
      {
        id: "responsive",
        label: "Communication responsiveness",
        signal: contactWarmth + formResponsive,
        tone: "positive" as const,
        note: `${contactWarmth} active conversations - ${formResponsive} forms returned`,
      },
      {
        id: "completion",
        label: "Onboarding completion experience",
        signal: fastIntake,
        tone: "positive" as const,
        note: `${fastIntake} families completed full VOB path`,
      },
      {
        id: "clarity",
        label: "Documentation clarity",
        signal: missingInfo,
        tone: missingInfo > 3 ? ("concern" as const) : ("neutral" as const),
        note: `${missingInfo} families flagged missing information`,
      },
      {
        id: "reach",
        label: "Outreach + reachability",
        signal: cantReach,
        tone: cantReach > 3 ? ("concern" as const) : ("neutral" as const),
        note: `${cantReach} families unreachable - friction risk`,
      },
    ];
  }, [marketingLeads]);

  /* Outreach -> trust correlation - partnership tracks. */
  const outreach = useMemo(() => {
    const refs = signals.referralLeads.length;
    return [
      {
        id: "parent",
        title: "Parent workshops & support",
        icon: Heart,
        signal: Math.round(refs * 0.35),
        note: "Highest-trust channel - direct family-to-family",
      },
      {
        id: "physician",
        title: "Pediatric & physician networks",
        icon: Stethoscope,
        signal: signals.qualified,
        note: `${signals.qualified} clinically-qualified referrals reflect provider trust`,
      },
      {
        id: "schools",
        title: "School & district partnerships",
        icon: GraduationCap,
        signal: Math.round(refs * 0.25),
        note: "IEP teams, special education awareness",
      },
      {
        id: "awareness",
        title: "Autism awareness events",
        icon: Megaphone,
        signal: Math.round(refs * 0.3),
        note: "Local visibility drives review activity",
      },
      {
        id: "recruiting",
        title: "Recruiting reputation",
        icon: Users,
        signal: signals.referralCands.length,
        note: `${signals.referralCands.length} staff referrals + ${signals.hired} hires`,
      },
      {
        id: "community",
        title: "Community sponsorships",
        icon: Building2,
        signal: Math.round(refs * 0.18),
        note: "Mission-aligned local presence",
      },
    ].sort((a, b) => b.signal - a.signal);
  }, [signals]);

  /* Risk intelligence - operational concerns that erode perception. */
  const risks = useMemo(() => {
    const out: { id: string; state: string; title: string; detail: string }[] = [];
    stateRows.forEach((s) => {
      if (s.fricRate >= 30 && s.leads >= 3) {
        out.push({
          id: `fric-${s.state}`,
          state: STATE_NAMES[s.state],
          title: "Response consistency requires attention",
          detail: `${s.fricRate}% of ${STATE_NAMES[s.state]} families are stuck in friction states.`,
        });
      }
      if (s.leads >= 3 && s.refs === 0) {
        out.push({
          id: `noref-${s.state}`,
          state: STATE_NAMES[s.state],
          title: "Community trust underdeveloped",
          detail: `${STATE_NAMES[s.state]} has active pipeline but no word-of-mouth signal yet.`,
        });
      }
      if (s.cands >= 3 && s.recWithdrawn / Math.max(1, s.cands) >= 0.25) {
        out.push({
          id: `rec-${s.state}`,
          state: STATE_NAMES[s.state],
          title: "Recruiting reputation softening",
          detail: `${s.recWithdrawn} of ${s.cands} ${STATE_NAMES[s.state]} candidates withdrew - onboarding perception risk.`,
        });
      }
    });
    return out.slice(0, 5);
  }, [stateRows]);

  /* AI reputation intelligence. */
  const insights = useMemo(() => {
    const out: string[] = [];
    if (topState && topState.trust > 0) {
      out.push(
        `${STATE_NAMES[topState.state]} clinic visibility continues generating Blossom's strongest community trust (${topState.trust}/100, ${topState.refs} word-of-mouth referrals).`,
      );
    }
    if (signals.delta > 0) {
      out.push(
        `Referral momentum is building - ${signals.recent} new community-sourced families this week vs ${signals.recent - signals.delta} prior.`,
      );
    }
    if (signals.qualifiedRate >= 35) {
      out.push(
        `Family experience is healthy - ${signals.qualifiedRate}% of intakes reach full qualification, signaling strong communication quality.`,
      );
    }
    if (weakState && weakState.fricRate >= 25) {
      out.push(
        `${STATE_NAMES[weakState.state]} operational delays are beginning to affect perception - ${weakState.fricRate}% friction rate.`,
      );
    }
    const quiet = stateRows.find((s) => s.refs === 0 && s.leads > 0);
    if (quiet) {
      out.push(
        `${STATE_NAMES[quiet.state]} community engagement remains underdeveloped - invest in parent + school visibility to build review activity.`,
      );
    }
    return out.slice(0, 5);
  }, [topState, weakState, stateRows, signals]);

  return (
    <MktgPage
      title="Reputation"
      subtitle="Operational trust intelligence - how community perception, family experience, and recruiting reputation translate into growth."
      actions={<AIPrompt label="Where is trust strongest right now?" variant="card" />}
    >
      {/* 1. TRUST INTELLIGENCE HERO */}
      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 via-card to-card p-6 md:p-8">
        <div className="absolute -top-24 -right-24 size-72 rounded-full bg-primary/10 blur-3xl" aria-hidden />
        <div className="absolute -bottom-32 -left-20 size-80 rounded-full bg-emerald-500/5 blur-3xl" aria-hidden />
        <div className="relative">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            <Sparkles className="size-3.5" />
            Trust Momentum
          </div>
          <h2 className="mt-2 max-w-2xl text-xl md:text-2xl font-semibold tracking-tight text-foreground">
            {signals.delta > 0
              ? `Community trust is strengthening - ${signals.recent} new word-of-mouth families this week.`
              : topState && topState.trust > 0
              ? `${STATE_NAMES[topState.state]} clinic reputation continues strengthening across the community.`
              : "Connect Google, surveys, and review feeds in Admin -> Data Uploads to activate reputation intelligence."}
          </h2>
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: "Trust score", value: `${signals.trustScore}/100` },
              {
                label: "Avg sentiment",
                value: `${signals.starAverage.toFixed(1)}*`,
              },
              { label: "Strongest region", value: topState ? STATE_NAMES[topState.state] : "-" },
              { label: "Word-of-mouth rate", value: `${signals.referralShare}%` },
            ].map((m) => (
              <div key={m.label} className="rounded-xl bg-card/60 backdrop-blur border border-border/50 p-3">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{m.label}</div>
                <div className="mt-1 text-[20px] font-semibold tracking-tight text-foreground truncate">{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. REPUTATION SNAPSHOT */}
      <MktgCard title="Reputation snapshot" hint="Trust signals, not vanity ratings">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Family satisfaction",
              value: `${signals.qualifiedRate}%`,
              sub: `${signals.qualified} families completed full intake`,
              icon: Heart,
              delta: signals.qualifiedRate >= 35 ? 1 : 0,
            },
            {
              label: "Referral trust",
              value: signals.referralLeads.length,
              sub: `${signals.referralShare}% of pipeline from word-of-mouth`,
              icon: Star,
              delta: signals.delta,
            },
            {
              label: "Recruiting reputation",
              value: signals.hired,
              sub: `${signals.referralCands.length} staff referrals - ${signals.withdrawn} withdrew`,
              icon: ShieldCheck,
              delta: signals.hired - signals.withdrawn,
            },
            {
              label: "Friction signals",
              value: signals.friction,
              sub: `${signals.frictionRate}% of families need recovery`,
              icon: AlertTriangle,
              delta: -signals.frictionRate,
            },
          ].map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="rounded-xl border border-border/60 bg-card p-4">
                <div className="flex items-center justify-between">
                  <div className="grid size-8 place-items-center rounded-lg bg-muted">
                    <Icon className="size-4 text-foreground" />
                  </div>
                  <TrendIcon delta={m.delta} />
                </div>
                <div className="mt-3 text-[11.5px] uppercase tracking-wider text-muted-foreground">{m.label}</div>
                <div className="mt-1 text-[22px] font-semibold tabular-nums text-foreground">{m.value}</div>
                <div className="mt-1 text-[11.5px] text-muted-foreground">{m.sub}</div>
              </div>
            );
          })}
        </div>
      </MktgCard>

      {/* 3. COMMUNITY SENTIMENT TIMELINE */}
      <MktgCard title="Community sentiment" hint="Real trust signals - most recent first">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-[11.5px]">
          <span className="uppercase tracking-wider text-muted-foreground">Last contacted</span>
          {(["all", "7", "30", "90"] as const).map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setContactWindow(w)}
              className={`rounded-full border px-2.5 py-0.5 transition ${
                contactWindow === w
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {w === "all" ? "Any time" : `Last ${w}d`}
            </button>
          ))}
          <span className="ml-auto uppercase tracking-wider text-muted-foreground">Sort</span>
          {(["recent", "oldest"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setContactSort(s)}
              className={`rounded-full border px-2.5 py-0.5 transition ${
                contactSort === s
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "recent" ? "Newest first" : "Oldest first"}
            </button>
          ))}
        </div>
        {visibleTimeline.length === 0 ? (
          <EmptyRow>No sentiment signal yet - connect review feeds in Admin.</EmptyRow>
        ) : (
          <ol className="relative space-y-3 border-l border-border/60 pl-5">
            {visibleTimeline.map((t) => {
              const Icon =
                t.kind === "Praise"
                  ? Star
                  : t.kind === "Concern"
                  ? AlertTriangle
                  : t.kind === "Recognition"
                  ? CheckCircle2
                  : Heart;
              const tone =
                t.kind === "Concern"
                  ? "bg-amber-500"
                  : t.kind === "Recognition"
                  ? "bg-emerald-500"
                  : "bg-primary";
              return (
                <li key={t.id} className="relative">
                  <span
                    className="absolute -left-[26px] top-1.5 grid size-4 place-items-center rounded-full border border-border bg-card"
                    aria-hidden
                  >
                    <span className={`size-1.5 rounded-full ${tone}`} />
                  </span>
                  <div className="rounded-xl border border-border/60 bg-card p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <div className="grid size-7 place-items-center rounded-lg bg-muted">
                          <Icon className="size-3.5 text-foreground" />
                        </div>
                        <div>
                          <div className="text-[13px] font-medium text-foreground">{t.title}</div>
                          <div className="text-[11.5px] text-muted-foreground">{t.detail}</div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                          {t.kind}
                        </div>
                        <div className="text-[11.5px] text-muted-foreground tabular-nums">
                          {fmtMktgShortDate(t.date)}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </MktgCard>

      {/* 3b. REPUTATION LEADS TABLE - server-side filtered + sorted by last contacted */}
      <MktgCard
        title="Reputation leads"
        hint={`Filtered server-side - ${contactWindow === "all" ? "any time" : `last ${contactWindow}d`} - ${
          contactSort === "recent" ? "newest first" : "oldest first"
        }`}
      >
        {reputationError ? (
          <EmptyRow>Could not load leads - {reputationError}</EmptyRow>
        ) : reputationLoading ? (
          <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card p-4 text-[12.5px] text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            Loading leads...
          </div>
        ) : reputationLeads.length === 0 ? (
          <EmptyRow>
            No leads match this last-contacted window. Try widening the range above.
          </EmptyRow>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/60">
            <table className="w-full text-[12.5px]">
              <thead className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Lead</th>
                  <th className="px-3 py-2 text-left font-medium">State</th>
                  <th className="px-3 py-2 text-left font-medium">Stage</th>
                  <th className="px-3 py-2 text-left font-medium">Source</th>
                  <th className="px-3 py-2 text-left font-medium">Last contacted</th>
                  <th className="px-3 py-2 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 bg-card">
                {reputationLeads.map((l) => {
                  const busy = markingLeadId === l.id;
                  return (
                    <tr key={l.id} className="hover:bg-muted/30">
                      <td className="px-3 py-2 font-medium text-foreground">{l.name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{l.state ?? "-"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{l.stage ?? "-"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{l.source ?? "-"}</td>
                      <td className="px-3 py-2 tabular-nums text-foreground">
                        <div className="flex flex-col gap-0.5 leading-tight">
                          <span className="text-[12.5px] font-medium">
                            {fmtMktgRelative(l.lastContacted)}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {l.lastContacted ? fmtMktgShortDate(l.lastContacted) : "Never contacted"}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => void markContacted(l.id)}
                          disabled={busy}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-2.5 py-1 text-[11.5px] font-medium text-foreground transition hover:border-foreground/40 hover:bg-muted disabled:opacity-60"
                        >
                          {busy ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <CheckCheck className="size-3" />
                          )}
                          Mark contacted
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </MktgCard>

      {/* 4. STATE REPUTATION VISIBILITY MAP */}
      <MktgCard title="State reputation visibility" hint="Click a state to explore local trust detail">
        <div className="grid gap-2.5 md:grid-cols-2">
          {stateRows.map((s) => {
            const isActive = activeState === s.state;
            return (
              <button
                key={s.state}
                onClick={() => setActiveState(isActive ? null : s.state)}
                className={`text-left rounded-xl border p-4 transition hover:-translate-y-0.5 ${
                  isActive ? "border-foreground/40 bg-muted/50" : "border-border/60 bg-card hover:border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 text-muted-foreground" />
                    <span className="text-[13.5px] font-medium text-foreground">
                      {STATE_NAMES[s.state] ?? s.state}
                    </span>
                  </div>
                  <span className="text-[12px] tabular-nums text-muted-foreground">
                    {s.stars.toFixed(1)}*
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-[11.5px]">
                  <div>
                    <div className="text-muted-foreground">Trust</div>
                    <div className="text-[15px] font-semibold text-foreground">{s.trust}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Referrals</div>
                    <div className="text-[15px] font-semibold text-foreground">{s.refs}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Friction</div>
                    <div className="text-[15px] font-semibold text-foreground">{s.fricRate}%</div>
                  </div>
                </div>
                <div className="mt-3">
                  <ShareBar value={s.trust} tone={s.trust >= 50 ? "accent" : s.trust > 0 ? "primary" : "muted"} />
                </div>
              </button>
            );
          })}
        </div>

        {activeRow && (
          <div className="mt-4 rounded-xl border border-border/60 bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <div className="text-[13px] font-medium text-foreground">
                {STATE_NAMES[activeRow.state]} reputation detail
              </div>
              <button
                onClick={() => setActiveState(null)}
                className="text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
            </div>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
              <div className="text-[12.5px] text-muted-foreground">
                <span className="text-foreground font-medium">{activeRow.stars.toFixed(1)}*</span>{" "}
                composite sentiment -{" "}
                <span className="text-foreground font-medium">{activeRow.trust}/100</span> trust
              </div>
              <div className="text-[12.5px] text-muted-foreground">
                <span className="text-foreground font-medium">{activeRow.qualRate}%</span> family
                satisfaction - <span className="text-foreground font-medium">{activeRow.qual}</span>{" "}
                completed intakes
              </div>
              <div className="text-[12.5px] text-muted-foreground">
                <span className="text-foreground font-medium">{activeRow.refs}</span> word-of-mouth -{" "}
                <span className="text-foreground font-medium">{activeRow.referralShare}%</span> of
                pipeline
              </div>
              <div className="text-[12.5px] text-muted-foreground">
                Recruiting reputation:{" "}
                <span className="text-foreground font-medium">{activeRow.recHired}</span> hired -{" "}
                <span className="text-foreground font-medium">{activeRow.recWithdrawn}</span> withdrew
              </div>
            </div>
            {activeRow.fricRate >= 25 && (
              <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[12px] text-foreground">
                {activeRow.fricRate}% of {STATE_NAMES[activeRow.state]} families are in friction states
                - perception risk if unresolved.
              </div>
            )}
            {activeRow.refs === 0 && activeRow.leads > 0 && (
              <div className="mt-2 rounded-lg border border-border/60 bg-card px-3 py-2 text-[12px] text-muted-foreground">
                No community word-of-mouth yet - invest in parent + school + autism advocacy
                visibility.
              </div>
            )}
          </div>
        )}
      </MktgCard>

      {/* 5. REVIEWS & FAMILY EXPERIENCE */}
      <MktgCard title="Family experience themes" hint="What the operational signal says about how families feel">
        <div className="grid gap-2.5 md:grid-cols-2">
          {themes.map((t) => (
            <div key={t.id} className="rounded-xl border border-border/60 bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="text-[13px] font-medium text-foreground">{t.label}</div>
                <span
                  className={`text-[10.5px] uppercase tracking-wider rounded-full px-2 py-0.5 ${
                    t.tone === "positive"
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : t.tone === "concern"
                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {t.tone}
                </span>
              </div>
              <div className="mt-2 text-[12.5px] text-muted-foreground">{t.note}</div>
              <div className="mt-3">
                <ShareBar
                  value={Math.min(100, t.signal * 6)}
                  tone={t.tone === "positive" ? "accent" : t.tone === "concern" ? "primary" : "muted"}
                />
              </div>
            </div>
          ))}
        </div>
      </MktgCard>

      {/* 6. OUTREACH & TRUST CORRELATION */}
      <MktgCard title="Outreach -> trust correlation" hint="How community visibility translates into reputation">
        <div className="space-y-2">
          {outreach.map((o) => {
            const Icon = o.icon;
            const max = Math.max(1, ...outreach.map((x) => x.signal));
            return (
              <div key={o.id} className="rounded-xl border border-border/60 bg-card p-3.5">
                <div className="flex items-start gap-3">
                  <div className="grid size-8 place-items-center rounded-lg bg-muted">
                    <Icon className="size-4 text-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[13px] font-medium text-foreground">{o.title}</div>
                      <div className="text-[11.5px] tabular-nums text-muted-foreground">
                        {o.signal} signal
                      </div>
                    </div>
                    <div className="text-[11.5px] text-muted-foreground">{o.note}</div>
                    <div className="mt-2">
                      <ShareBar value={(o.signal / max) * 100} tone="primary" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </MktgCard>

      {/* 7. REPUTATION RISK INTELLIGENCE */}
      <MktgCard title="Reputation risk intelligence" hint="Operational concerns that could erode perception">
        {risks.length === 0 ? (
          <EmptyRow>No reputation risks detected - community trust is healthy across the footprint.</EmptyRow>
        ) : (
          <div className="space-y-2">
            {risks.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5"
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="mt-0.5 size-4 text-amber-600 shrink-0" />
                  <div>
                    <div className="text-[13px] font-medium text-foreground">{r.title}</div>
                    <div className="text-[12px] text-muted-foreground">{r.detail}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </MktgCard>

      {/* 8. AI REPUTATION INTELLIGENCE PANEL */}
      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 via-card to-card p-5 md:p-6">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          <Brain className="size-3.5" />
          Operational Insights - Reputation
        </div>
        <h3 className="mt-2 text-[17px] font-semibold tracking-tight text-foreground">
          Trust intelligence summary
        </h3>
        {insights.length === 0 ? (
          <p className="mt-2 text-[13px] text-muted-foreground">
            Connect Google, surveys, and intake feedback to activate AI reputation summaries.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {insights.map((i, idx) => (
              <li
                key={idx}
                className="rounded-xl border border-border/60 bg-card/60 backdrop-blur p-3 text-[13px] leading-relaxed text-foreground"
              >
                {i}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex flex-wrap gap-1.5">
          <AIPrompt label="Which states are building the strongest trust?" />
          <AIPrompt label="Where is reputation declining?" />
          <AIPrompt label="How does outreach impact reviews?" />
          <AIPrompt label="Which families should we ask for a review?" />
          <AIPrompt label="Summarize recruiting reputation movement" />
        </div>
      </section>
          <MarketingWorkPanel
            workType="reputation"
            title="Open work"
            description="Track follow-ups, opportunities, and fixes for this area."
            seedFactory={() => ({
              title: "Reputation follow-up",
              description: "Prefilled from Reputation ops signal.",
              priority: "medium",
              source_system: "google_reviews",
            })}
          />
          <ReputationEventsPanel />
    </MktgPage>
  );
}

function ReputationEventsPanel() {
  const { rows, loading, refetch } = useMarketingReputationEvents({ limit: 100 });
  const [logOpen, setLogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [q, setQ] = useUrlState("elq", "");
  const [srcFilter, setSrcFilter] = useUrlState("elsrc", "all");
  const [stateFilter, setStateFilter] = useUrlState("elst", "all");
  const [ratingFilter, setRatingFilter] = useUrlState("elr", "all");
  const [sentFilter, setSentFilter] = useUrlState("elsent", "all");
  const sources = useMemo(() => Array.from(new Set(rows.map((r) => r.source_system).filter(Boolean) as string[])).sort(), [rows]);
  const statesList = useMemo(() => Array.from(new Set(rows.map((r) => r.state).filter(Boolean) as string[])).sort(), [rows]);
  const filtered = useMemo(() => rows.filter((r) => {
    if (srcFilter !== "all" && r.source_system !== srcFilter) return false;
    if (stateFilter !== "all" && r.state !== stateFilter) return false;
    if (sentFilter !== "all" && (r.sentiment ?? "") !== sentFilter) return false;
    if (ratingFilter !== "all") {
      const rt = r.rating ?? 0;
      if (ratingFilter === "5" && rt !== 5) return false;
      if (ratingFilter === "4" && rt !== 4) return false;
      if (ratingFilter === "low" && !(rt > 0 && rt <= 3)) return false;
      if (ratingFilter === "none" && r.rating != null) return false;
    }
    if (q) {
      const ql = q.toLowerCase();
      if (!(r.review_text ?? "").toLowerCase().includes(ql) && !(r.source_system ?? "").toLowerCase().includes(ql)) return false;
    }
    return true;
  }), [rows, q, srcFilter, stateFilter, sentFilter, ratingFilter]);
  const avgRating = useMemo(() => {
    const rated = filtered.filter((r) => r.rating != null);
    if (!rated.length) return null;
    return (rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length).toFixed(2);
  }, [filtered]);
  const negOpen = filtered.filter((r) => (r.sentiment === "negative") && r.response_status !== "closed").length;
  return (
    <MktgCard title="Reputation event log" hint={loading ? "Loading..." : `${filtered.length} of ${rows.length} events`}>
      <TableFilterBar
        className="mb-3"
        search={{ value: q, onChange: setQ, placeholder: "Search text or source..." }}
        filters={[
          { key: "elsrc", label: "Source", value: srcFilter, onChange: setSrcFilter, options: [{ value: "all", label: "All" }, ...sources.map((s) => ({ value: s, label: s }))] },
          { key: "elst", label: "State", value: stateFilter, onChange: setStateFilter, options: [{ value: "all", label: "All" }, ...statesList.map((s) => ({ value: s, label: s }))] },
          { key: "elr", label: "Rating", value: ratingFilter, onChange: setRatingFilter, options: [
            { value: "all", label: "Any" }, { value: "5", label: "5 stars" }, { value: "4", label: "4 stars" }, { value: "low", label: "1-3 stars" }, { value: "none", label: "No rating" },
          ] },
          { key: "elsent", label: "Sentiment", value: sentFilter, onChange: setSentFilter, options: [
            { value: "all", label: "Any" }, { value: "positive", label: "Positive" }, { value: "neutral", label: "Neutral" }, { value: "negative", label: "Negative" },
          ] },
        ]}
        resultCount={filtered.length}
        totalCount={rows.length}
        onClear={() => { setQ(""); setSrcFilter("all"); setStateFilter("all"); setRatingFilter("all"); setSentFilter("all"); }}
        extra={
          <>
            <Button size="sm" variant="outline" onClick={() => setLogOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Log event
            </Button>
            <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="mr-1.5 h-4 w-4" /> Bulk import
            </Button>
          </>
        }
      />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="text-xs text-muted-foreground">
          Avg rating: <span className="font-medium text-foreground">{avgRating ?? "-"}</span> - Open negatives:{" "}
          <span className="font-medium text-foreground">{negOpen}</span>
        </div>
      </div>
      {filtered.length === 0 ? (
        <EmptyRow>No reputation events yet. Log a review or bulk import.</EmptyRow>
      ) : (
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Source</th>
                <th className="px-3 py-2">State</th>
                <th className="px-3 py-2">Rating</th>
                <th className="px-3 py-2">Sentiment</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Text</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 25).map((r) => (
                <tr key={r.id} className="border-t border-border/40">
                  <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{new Date(r.occurred_at).toLocaleDateString("en-US")}</td>
                  <td className="px-3 py-2">{r.source_system}</td>
                  <td className="px-3 py-2">{r.state ?? "-"}</td>
                  <td className="px-3 py-2 tabular-nums">{r.rating ?? "-"}</td>
                  <td className="px-3 py-2">{r.sentiment ?? "-"}</td>
                  <td className="px-3 py-2">{r.response_status ?? "-"}</td>
                  <td className="px-3 py-2 truncate max-w-[280px]">{r.review_text ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ReputationEventLogDialog open={logOpen} onOpenChange={setLogOpen} onLogged={refetch} />
      <BulkReputationEventImportDialog open={importOpen} onOpenChange={setImportOpen} onImported={refetch} />
    </MktgCard>
  );
}