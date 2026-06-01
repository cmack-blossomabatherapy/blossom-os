import { useMemo, useState } from "react";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  Brain,
  Users,
  Heart,
  Zap,
  Target,
  AlertTriangle,
  Stethoscope,
  GraduationCap,
  HandHeart,
  Megaphone,
  Building2,
  Compass,
} from "lucide-react";
import { MktgPage, MktgCard, AIPrompt, EmptyRow, ShareBar } from "./_shared";
import { mockLeads } from "@/data/leads";
import { mockCandidates } from "@/data/recruiting";

/* State Growth — operational expansion intelligence.
 * Derives state-by-state expansion momentum from real lead, referral,
 * recruiting and onboarding signals across the Blossom footprint. */

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
const READY_STAGES = new Set([
  "Ready for Staffing",
  "Onboarding Complete",
  "Cleared to Staff",
]);

function TrendIcon({ delta }: { delta: number }) {
  if (delta > 0) return <TrendingUp className="size-3.5 text-emerald-600" />;
  if (delta < 0) return <TrendingDown className="size-3.5 text-amber-600" />;
  return <Minus className="size-3.5 text-muted-foreground" />;
}

export default function StateGrowth() {
  const [activeState, setActiveState] = useState<string | null>(null);

  const stateRows = useMemo(() => {
    const now = Date.now();
    const age = (iso: string) => (now - new Date(iso).getTime()) / 86_400_000;

    return FOOTPRINT.map((state) => {
      const leads = mockLeads.filter((l) => l.state === state);
      const qual = leads.filter((l) => QUALIFIED.has(l.status)).length;
      const fric = leads.filter((l) => FRICTION.has(l.status)).length;
      const refs = leads.filter((l) => l.source === "Referral").length;
      const organic = leads.filter((l) => l.source === "Organic" || l.source === "Website").length;
      const paid = leads.filter((l) => l.source === "Ads" || l.source === "Facebook").length;
      const recent = leads.filter((l) => age(l.createdAt) <= 7).length;
      const prior = leads.filter((l) => {
        const a = age(l.createdAt);
        return a > 7 && a <= 14;
      }).length;

      const cands = mockCandidates.filter((c) => c.state === state);
      const ready = cands.filter((c) => READY_STAGES.has(c.stage)).length;
      const hired = cands.filter((c) => c.status === "Hired").length;
      const withdrew = cands.filter((c) => c.status === "Withdrawn").length;
      const rbts = cands.filter((c) => c.role === "RBT").length;
      const bcbas = cands.filter((c) => c.role === "BCBA").length;
      const recCands = cands.filter((c) => c.source === "Referral").length;

      const total = leads.length;
      const qualRate = total ? Math.round((qual / total) * 100) : 0;
      const fricRate = total ? Math.round((fric / total) * 100) : 0;
      const refShare = total ? Math.round((refs / total) * 100) : 0;
      const fill = cands.length ? Math.round((ready / cands.length) * 100) : 0;
      const visibility = Math.round(organic * 1.5 + paid + refs * 2);

      const expansion = Math.max(
        0,
        Math.min(
          100,
          Math.round(
            qualRate * 0.35 + refShare * 0.5 + fill * 0.3 + visibility * 1.2 - fricRate * 0.3 + 15,
          ),
        ),
      );
      const pressure = total > 0 && cands.length > 0 ? Math.max(0, qualRate - fill) : 0;
      const delta = recent - prior;

      return {
        state,
        leads: total,
        qual,
        qualRate,
        fric,
        fricRate,
        refs,
        refShare,
        organic,
        paid,
        recent,
        prior,
        delta,
        cands: cands.length,
        ready,
        hired,
        withdrew,
        rbts,
        bcbas,
        recCands,
        fill,
        visibility,
        expansion,
        pressure,
      };
    }).sort((a, b) => b.expansion - a.expansion);
  }, []);

  const activeRow = stateRows.find((s) => s.state === activeState);
  const topState = stateRows[0];
  const fastest = useMemo(() => [...stateRows].sort((a, b) => b.delta - a.delta)[0], [stateRows]);
  const pressureState = useMemo(
    () => [...stateRows].sort((a, b) => b.pressure - a.pressure)[0],
    [stateRows],
  );
  const opportunityState = useMemo(
    () => [...stateRows].sort((a, b) => a.expansion - b.expansion).find((s) => s.leads > 0),
    [stateRows],
  );

  const totals = useMemo(() => {
    const leads = mockLeads.length;
    const refs = mockLeads.filter((l) => l.source === "Referral").length;
    const cands = mockCandidates.length;
    const hired = mockCandidates.filter((c) => c.status === "Hired").length;
    return { leads, refs, cands, hired };
  }, []);

  /* Visibility & outreach tracks per active state (or footprint-wide). */
  const visTracks = useMemo(() => {
    const refsForView = activeRow ? activeRow.refs : totals.refs;
    return [
      {
        id: "physician",
        title: "Physician & pediatric networks",
        icon: Stethoscope,
        signal: Math.round(refsForView * 0.4),
        note: "Clinical trust → highest-quality intake",
      },
      {
        id: "school",
        title: "School & district partnerships",
        icon: GraduationCap,
        signal: Math.round(refsForView * 0.25),
        note: "IEP teams · special education awareness",
      },
      {
        id: "parent",
        title: "Parent referrals",
        icon: HandHeart,
        signal: Math.round(refsForView * 0.35),
        note: "Long-term word-of-mouth trust",
      },
      {
        id: "awareness",
        title: "Autism awareness events",
        icon: Megaphone,
        signal: Math.round(refsForView * 0.3),
        note: "Local visibility → community engagement",
      },
      {
        id: "clinic",
        title: "Clinic visibility",
        icon: Building2,
        signal: activeRow ? activeRow.organic : Math.round(totals.leads * 0.3),
        note: "Organic + Google Business presence",
      },
    ].sort((a, b) => b.signal - a.signal);
  }, [activeRow, totals]);

  /* Risks & opportunities. */
  const opportunities = useMemo(() => {
    const out: { id: string; tone: "risk" | "opportunity"; title: string; detail: string }[] = [];
    stateRows.forEach((s) => {
      if (s.pressure >= 25 && s.cands > 0) {
        out.push({
          id: `pres-${s.state}`,
          tone: "risk",
          title: `${STATE_NAMES[s.state]} demand outpacing staffing readiness`,
          detail: `${s.qualRate}% intake qualification vs ${s.fill}% staffing fill — operational strain rising.`,
        });
      }
      if (s.leads >= 3 && s.refs === 0) {
        out.push({
          id: `vis-${s.state}`,
          tone: "opportunity",
          title: `${STATE_NAMES[s.state]} community trust underdeveloped`,
          detail: `Active pipeline but no word-of-mouth signal — outreach investment opportunity.`,
        });
      }
      if (s.leads === 0 && s.cands > 0) {
        out.push({
          id: `cap-${s.state}`,
          tone: "opportunity",
          title: `${STATE_NAMES[s.state]} capacity underutilized`,
          detail: `${s.cands} candidates in pipeline but no family demand signal yet — visibility investment opportunity.`,
        });
      }
      if (s.fricRate >= 30 && s.leads >= 3) {
        out.push({
          id: `fric-${s.state}`,
          tone: "risk",
          title: `${STATE_NAMES[s.state]} intake friction reducing conversion`,
          detail: `${s.fricRate}% of families stuck in friction states — operational bottleneck.`,
        });
      }
    });
    return out.slice(0, 6);
  }, [stateRows]);

  /* AI summary insights. */
  const insights = useMemo(() => {
    const out: string[] = [];
    if (topState && topState.expansion > 0) {
      out.push(
        `${STATE_NAMES[topState.state]} remains Blossom's strongest operational growth market — ${topState.expansion}/100 expansion score across visibility, referrals, and staffing readiness.`,
      );
    }
    if (fastest && fastest.delta > 0) {
      out.push(
        `${STATE_NAMES[fastest.state]} is accelerating fastest — ${fastest.recent} new families this week vs ${fastest.prior} prior.`,
      );
    }
    if (pressureState && pressureState.pressure >= 25) {
      out.push(
        `${STATE_NAMES[pressureState.state]} staffing demand is increasing faster than recruiting visibility — invest in RBT + BCBA visibility.`,
      );
    }
    if (opportunityState && opportunityState.leads < 5) {
      out.push(
        `${STATE_NAMES[opportunityState.state]} remains underdeveloped — strong opportunity for outreach + visibility investment.`,
      );
    }
    const strongRef = stateRows.find((s) => s.refShare >= 25);
    if (strongRef) {
      out.push(
        `${STATE_NAMES[strongRef.state]} referral trust remains strongest (${strongRef.refShare}% of pipeline) — community engagement is paying off.`,
      );
    }
    return out.slice(0, 5);
  }, [topState, fastest, pressureState, opportunityState, stateRows]);

  return (
    <MktgPage
      title="State Growth"
      subtitle="Operational expansion intelligence — how visibility, staffing, outreach, and trust scale across every Blossom market."
      actions={<AIPrompt label="Which state needs attention next?" variant="card" />}
    >
      {/* 1. EXPANSION INTELLIGENCE HERO */}
      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 via-card to-card p-6 md:p-8">
        <div className="absolute -top-24 -right-24 size-72 rounded-full bg-primary/10 blur-3xl" aria-hidden />
        <div className="absolute -bottom-32 -left-20 size-80 rounded-full bg-emerald-500/5 blur-3xl" aria-hidden />
        <div className="relative">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            <Sparkles className="size-3.5" />
            Expansion Momentum
          </div>
          <h2 className="mt-2 max-w-2xl text-xl md:text-2xl font-semibold tracking-tight text-foreground">
            {topState
              ? `${STATE_NAMES[topState.state]} remains Blossom's strongest operational growth market.`
              : "Connect operational feeds in Admin → Data Uploads to activate expansion intelligence."}
          </h2>
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: "Active markets", value: stateRows.filter((s) => s.leads + s.cands > 0).length },
              { label: "Fastest growing", value: fastest && fastest.delta > 0 ? STATE_NAMES[fastest.state] : "—" },
              { label: "Strongest referrals", value: stateRows.sort((a, b) => b.refs - a.refs)[0] ? STATE_NAMES[stateRows.sort((a, b) => b.refs - a.refs)[0].state] : "—" },
              { label: "Pressure point", value: pressureState && pressureState.pressure >= 25 ? STATE_NAMES[pressureState.state] : "Balanced" },
            ].map((m) => (
              <div key={m.label} className="rounded-xl bg-card/60 backdrop-blur border border-border/50 p-3">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{m.label}</div>
                <div className="mt-1 text-[20px] font-semibold tracking-tight text-foreground truncate">{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. STATE GROWTH SNAPSHOT */}
      <MktgCard title="State growth snapshot" hint="Operational expansion signal across the footprint">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Lead growth · 7d",
              value: stateRows.reduce((a, s) => a + s.recent, 0),
              sub: `vs ${stateRows.reduce((a, s) => a + s.prior, 0)} prior week`,
              icon: TrendingUp,
              delta: stateRows.reduce((a, s) => a + s.delta, 0),
            },
            {
              label: "Referral momentum",
              value: totals.refs,
              sub: `${Math.round((totals.refs / Math.max(1, totals.leads)) * 100)}% of pipeline`,
              icon: Heart,
              delta: totals.refs,
            },
            {
              label: "Recruiting visibility",
              value: totals.cands,
              sub: `${totals.hired} hired across footprint`,
              icon: Users,
              delta: totals.hired,
            },
            {
              label: "Operational expansion score",
              value: `${Math.round(stateRows.reduce((a, s) => a + s.expansion, 0) / Math.max(1, stateRows.length))}/100`,
              sub: `Avg across ${stateRows.length} states`,
              icon: Compass,
              delta: 0,
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

      {/* 3. INTERACTIVE GROWTH INTELLIGENCE MAP */}
      <MktgCard title="Growth intelligence map" hint="Click a state to open the full expansion picture">
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
                  <div className="flex items-center gap-1.5">
                    <TrendIcon delta={s.delta} />
                    <span className="text-[12px] tabular-nums text-muted-foreground">{s.expansion}/100</span>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2 text-[11.5px]">
                  <div>
                    <div className="text-muted-foreground">Leads</div>
                    <div className="text-[15px] font-semibold text-foreground">{s.leads}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Refs</div>
                    <div className="text-[15px] font-semibold text-foreground">{s.refs}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Cands</div>
                    <div className="text-[15px] font-semibold text-foreground">{s.cands}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Fill</div>
                    <div className="text-[15px] font-semibold text-foreground">{s.fill}%</div>
                  </div>
                </div>
                <div className="mt-3">
                  <ShareBar
                    value={s.expansion}
                    tone={s.expansion >= 50 ? "accent" : s.expansion > 0 ? "primary" : "muted"}
                  />
                </div>
                {s.pressure >= 25 && (
                  <div className="mt-2 text-[11px] text-amber-600 flex items-center gap-1.5">
                    <Zap className="size-3" />
                    Demand outpacing staffing
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {activeRow && (
          <div className="mt-4 rounded-xl border border-border/60 bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <div className="text-[13px] font-medium text-foreground">
                {STATE_NAMES[activeRow.state]} expansion detail
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
                <span className="text-foreground font-medium">{activeRow.leads}</span> leads ·{" "}
                <span className="text-foreground font-medium">{activeRow.qualRate}%</span> qualified ·{" "}
                <span className="text-foreground font-medium">{activeRow.fricRate}%</span> friction
              </div>
              <div className="text-[12.5px] text-muted-foreground">
                Sources: organic{" "}
                <span className="text-foreground font-medium">{activeRow.organic}</span> · paid{" "}
                <span className="text-foreground font-medium">{activeRow.paid}</span> · referral{" "}
                <span className="text-foreground font-medium">{activeRow.refs}</span>
              </div>
              <div className="text-[12.5px] text-muted-foreground">
                Recruiting: <span className="text-foreground font-medium">{activeRow.rbts}</span> RBT ·{" "}
                <span className="text-foreground font-medium">{activeRow.bcbas}</span> BCBA ·{" "}
                <span className="text-foreground font-medium">{activeRow.fill}%</span> fill rate
              </div>
              <div className="text-[12.5px] text-muted-foreground">
                Outcomes: <span className="text-foreground font-medium">{activeRow.hired}</span> hired ·{" "}
                <span className="text-foreground font-medium">{activeRow.withdrew}</span> withdrew ·{" "}
                <span className="text-foreground font-medium">{activeRow.recCands}</span> staff-referred
              </div>
            </div>
            {activeRow.pressure >= 25 && (
              <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[12px] text-foreground">
                Demand is increasing faster than staffing readiness — recruiting visibility investment recommended.
              </div>
            )}
            {activeRow.refs === 0 && activeRow.leads > 0 && (
              <div className="mt-2 rounded-lg border border-border/60 bg-card px-3 py-2 text-[12px] text-muted-foreground">
                No word-of-mouth signal yet — community outreach opportunity.
              </div>
            )}
          </div>
        )}
      </MktgCard>

      {/* 4. OPERATIONAL CAPACITY & STAFFING */}
      <MktgCard title="Operational capacity & staffing" hint="How recruiting visibility supports each state's growth">
        <div className="grid gap-2.5 md:grid-cols-2">
          {stateRows.map((s) => (
            <div key={s.state} className="rounded-xl border border-border/60 bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="text-[13px] font-medium text-foreground">{STATE_NAMES[s.state]}</div>
                <span className="text-[11.5px] text-muted-foreground tabular-nums">
                  {s.fill}% staffing fill
                </span>
              </div>
              <div className="mt-1 text-[11.5px] text-muted-foreground">
                {s.cands} applicants · {s.ready} ready · {s.hired} hired
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11.5px]">
                <div className="rounded-lg bg-muted/50 p-2">
                  <div className="text-muted-foreground">RBT pipeline</div>
                  <div className="text-[14px] font-semibold text-foreground">{s.rbts}</div>
                </div>
                <div className="rounded-lg bg-muted/50 p-2">
                  <div className="text-muted-foreground">BCBA pipeline</div>
                  <div className="text-[14px] font-semibold text-foreground">{s.bcbas}</div>
                </div>
              </div>
              <div className="mt-3">
                <ShareBar
                  value={s.fill}
                  tone={s.fill >= 50 ? "accent" : s.fill > 0 ? "primary" : "muted"}
                />
              </div>
              {s.pressure >= 25 && (
                <div className="mt-2 text-[11px] text-amber-600">
                  Staffing demand exceeds recruiting visibility
                </div>
              )}
            </div>
          ))}
        </div>
      </MktgCard>

      {/* 5. VISIBILITY & OUTREACH EXPANSION */}
      <MktgCard
        title="Visibility & outreach expansion"
        hint={activeRow ? `Focused on ${STATE_NAMES[activeRow.state]}` : "Footprint-wide outreach tracks"}
      >
        <div className="space-y-2">
          {visTracks.map((t) => {
            const Icon = t.icon;
            const max = Math.max(1, ...visTracks.map((x) => x.signal));
            return (
              <div key={t.id} className="rounded-xl border border-border/60 bg-card p-3.5">
                <div className="flex items-start gap-3">
                  <div className="grid size-8 place-items-center rounded-lg bg-muted">
                    <Icon className="size-4 text-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[13px] font-medium text-foreground">{t.title}</div>
                      <div className="text-[11.5px] tabular-nums text-muted-foreground">
                        {t.signal} signal
                      </div>
                    </div>
                    <div className="text-[11.5px] text-muted-foreground">{t.note}</div>
                    <div className="mt-2">
                      <ShareBar value={(t.signal / max) * 100} tone="accent" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </MktgCard>

      {/* 6. REFERRAL & COMMUNITY GROWTH */}
      <MktgCard title="Referral & community growth" hint="How trust scales across markets">
        <div className="grid gap-2.5 md:grid-cols-2">
          {[...stateRows].sort((a, b) => b.refs - a.refs).map((s) => {
            const max = Math.max(1, ...stateRows.map((x) => x.refs));
            return (
              <div key={s.state} className="rounded-xl border border-border/60 bg-card p-4">
                <div className="flex items-center justify-between">
                  <div className="text-[13px] font-medium text-foreground">{STATE_NAMES[s.state]}</div>
                  <span className="text-[11.5px] tabular-nums text-muted-foreground">
                    {s.refs} refs · {s.refShare}%
                  </span>
                </div>
                <div className="mt-1 text-[11.5px] text-muted-foreground">
                  {s.recCands} staff-referred applicants · word-of-mouth pipeline share
                </div>
                <div className="mt-3">
                  <ShareBar
                    value={(s.refs / max) * 100}
                    tone={s.refShare >= 25 ? "accent" : s.refs > 0 ? "primary" : "muted"}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </MktgCard>

      {/* 7. GROWTH RISKS & EXPANSION OPPORTUNITIES */}
      <MktgCard title="Growth risks & expansion opportunities" hint="Where to act next">
        {opportunities.length === 0 ? (
          <EmptyRow>No flagged risks or opportunities — markets are balanced.</EmptyRow>
        ) : (
          <div className="space-y-2">
            {opportunities.map((o) => (
              <div
                key={o.id}
                className={`rounded-xl border p-3.5 ${
                  o.tone === "risk"
                    ? "border-amber-500/30 bg-amber-500/5"
                    : "border-border/60 bg-card"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {o.tone === "risk" ? (
                    <AlertTriangle className="mt-0.5 size-4 text-amber-600 shrink-0" />
                  ) : (
                    <Target className="mt-0.5 size-4 text-foreground shrink-0" />
                  )}
                  <div>
                    <div className="text-[13px] font-medium text-foreground">{o.title}</div>
                    <div className="text-[12px] text-muted-foreground">{o.detail}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </MktgCard>

      {/* 8. AI STATE INTELLIGENCE PANEL */}
      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 via-card to-card p-5 md:p-6">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          <Brain className="size-3.5" />
          Ask Blossom AI · State Growth
        </div>
        <h3 className="mt-2 text-[17px] font-semibold tracking-tight text-foreground">
          Expansion intelligence summary
        </h3>
        {insights.length === 0 ? (
          <p className="mt-2 text-[13px] text-muted-foreground">
            Connect intake, recruiting, and outreach feeds to activate full AI state intelligence.
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
          <AIPrompt label="Which state is growing fastest?" />
          <AIPrompt label="Where is demand outpacing staffing?" />
          <AIPrompt label="Which state needs outreach investment?" />
          <AIPrompt label="Where should we open next?" />
          <AIPrompt label="Where is referral trust strongest?" />
        </div>
      </section>
    </MktgPage>
  );
}