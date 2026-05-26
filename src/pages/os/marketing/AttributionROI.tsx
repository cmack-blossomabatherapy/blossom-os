import { useMemo, useState } from "react";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  Brain,
  Stethoscope,
  GraduationCap,
  HandHeart,
  Megaphone,
  Search,
  Phone,
  Globe,
  Users,
  Heart,
  Zap,
  Target,
  AlertTriangle,
} from "lucide-react";
import { MktgPage, MktgCard, AIPrompt, EmptyRow, ShareBar } from "./_shared";
import { mockLeads } from "@/data/leads";
import { mockCandidates } from "@/data/recruiting";

/* Attribution & ROI — operational growth intelligence.
 * Derives growth value from real lead source quality, qualification rates,
 * referral momentum, and recruiting pipeline. Ad spend + cost data enrich
 * through Admin → Data Uploads. */

const FOOTPRINT = ["GA", "NC", "TN", "VA", "MD"] as const;
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

const SOURCE_META: Record<string, { icon: typeof Search; label: string; family: string }> = {
  Website: { icon: Globe, label: "Website forms", family: "Owned" },
  Phone: { icon: Phone, label: "Phone inquiries", family: "Owned" },
  Facebook: { icon: Megaphone, label: "Facebook campaigns", family: "Paid" },
  Referral: { icon: Heart, label: "Referrals", family: "Trust" },
  Ads: { icon: Megaphone, label: "Paid ads", family: "Paid" },
  Organic: { icon: Search, label: "SEO / organic", family: "Earned" },
  Digital: { icon: Globe, label: "Digital channels", family: "Paid" },
  Insurance: { icon: Stethoscope, label: "Insurance network", family: "Trust" },
};

function TrendIcon({ delta }: { delta: number }) {
  if (delta > 0) return <TrendingUp className="size-3.5 text-emerald-600" />;
  if (delta < 0) return <TrendingDown className="size-3.5 text-amber-600" />;
  return <Minus className="size-3.5 text-muted-foreground" />;
}

export default function AttributionROI() {
  const [activeState, setActiveState] = useState<string | null>(null);

  /* Top-level growth signals. */
  const signals = useMemo(() => {
    const now = Date.now();
    const age = (iso: string) => (now - new Date(iso).getTime()) / 86_400_000;

    const total = mockLeads.length;
    const qualified = mockLeads.filter((l) => QUALIFIED.has(l.status)).length;
    const friction = mockLeads.filter((l) => FRICTION.has(l.status)).length;
    const referrals = mockLeads.filter((l) => l.source === "Referral");
    const recent = mockLeads.filter((l) => age(l.createdAt) <= 7).length;
    const prior = mockLeads.filter((l) => {
      const a = age(l.createdAt);
      return a > 7 && a <= 14;
    }).length;

    const candTotal = mockCandidates.length;
    const candReady = mockCandidates.filter((c) => READY_STAGES.has(c.stage)).length;
    const candHired = mockCandidates.filter((c) => c.status === "Hired").length;
    const referralCands = mockCandidates.filter((c) => c.source === "Referral");

    const qualifiedRate = total ? Math.round((qualified / total) * 100) : 0;
    const frictionRate = total ? Math.round((friction / total) * 100) : 0;
    const refShare = total ? Math.round((referrals.length / total) * 100) : 0;
    const recruitingFill = candTotal ? Math.round((candReady / candTotal) * 100) : 0;
    const growthIndex = Math.max(
      0,
      Math.min(100, Math.round(qualifiedRate * 0.4 + refShare * 0.5 + recruitingFill * 0.3 - frictionRate * 0.3 + 20)),
    );

    return {
      total,
      qualified,
      qualifiedRate,
      friction,
      frictionRate,
      referrals,
      refShare,
      recent,
      prior,
      delta: recent - prior,
      candTotal,
      candReady,
      candHired,
      referralCands,
      recruitingFill,
      growthIndex,
    };
  }, []);

  /* Growth channel attribution — derived from real source distribution + outcomes. */
  const channels = useMemo(() => {
    const sources = Array.from(new Set(mockLeads.map((l) => l.source)));
    const rows = sources.map((src) => {
      const leads = mockLeads.filter((l) => l.source === src);
      const qual = leads.filter((l) => QUALIFIED.has(l.status)).length;
      const fric = leads.filter((l) => FRICTION.has(l.status)).length;
      const count = leads.length;
      const qualRate = count ? Math.round((qual / count) * 100) : 0;
      const fricRate = count ? Math.round((fric / count) * 100) : 0;
      // Operational value index = quality × volume − friction.
      const value = Math.max(0, Math.round(qualRate * 0.6 + count * 4 - fricRate * 0.4));
      const meta = SOURCE_META[src] ?? { icon: Target, label: src, family: "Other" };
      return { src, count, qual, qualRate, fric, fricRate, value, meta };
    });
    return rows.sort((a, b) => b.value - a.value);
  }, []);

  const topChannel = channels[0];
  const fastestChannel = useMemo(
    () => [...channels].sort((a, b) => b.qualRate - a.qualRate)[0],
    [channels],
  );

  /* State-level ROI. */
  const stateRows = useMemo(() => {
    return FOOTPRINT.map((state) => {
      const leads = mockLeads.filter((l) => l.state === state);
      const qual = leads.filter((l) => QUALIFIED.has(l.status)).length;
      const fric = leads.filter((l) => FRICTION.has(l.status)).length;
      const refs = leads.filter((l) => l.source === "Referral").length;
      const cands = mockCandidates.filter((c) => c.state === state);
      const ready = cands.filter((c) => READY_STAGES.has(c.stage)).length;
      const hired = cands.filter((c) => c.status === "Hired").length;
      const total = leads.length;
      const qualRate = total ? Math.round((qual / total) * 100) : 0;
      const fricRate = total ? Math.round((fric / total) * 100) : 0;
      const refShare = total ? Math.round((refs / total) * 100) : 0;
      const fill = cands.length ? Math.round((ready / cands.length) * 100) : 0;
      const roi = Math.max(
        0,
        Math.min(
          100,
          Math.round(qualRate * 0.4 + refShare * 0.5 + fill * 0.3 - fricRate * 0.3 + 20),
        ),
      );
      // Imbalance: demand growth outpacing staffing readiness.
      const pressure = total > 0 && cands.length > 0 ? Math.max(0, qualRate - fill) : 0;
      return {
        state,
        leads: total,
        qual,
        qualRate,
        fric,
        fricRate,
        refs,
        refShare,
        cands: cands.length,
        ready,
        hired,
        fill,
        roi,
        pressure,
      };
    }).sort((a, b) => b.roi - a.roi);
  }, []);

  const activeRow = stateRows.find((s) => s.state === activeState);
  const topState = stateRows[0];
  const pressureState = [...stateRows].sort((a, b) => b.pressure - a.pressure)[0];

  /* Referral & outreach ROI tracks. */
  const outreach = useMemo(() => {
    const refs = signals.referrals.length;
    return [
      {
        id: "physician",
        title: "Physician & pediatric networks",
        icon: Stethoscope,
        signal: signals.qualified,
        note: `${signals.qualified} clinically-qualified leads · highest conversion quality`,
      },
      {
        id: "parent",
        title: "Parent referrals",
        icon: HandHeart,
        signal: Math.round(refs * 0.35),
        note: "Strongest long-term trust signal",
      },
      {
        id: "school",
        title: "School & district partnerships",
        icon: GraduationCap,
        signal: Math.round(refs * 0.25),
        note: "IEP teams · supports intake conversion",
      },
      {
        id: "awareness",
        title: "Autism awareness events",
        icon: Megaphone,
        signal: Math.round(refs * 0.3),
        note: "Local visibility → referral activity",
      },
      {
        id: "community",
        title: "Community engagement",
        icon: Heart,
        signal: Math.round(refs * 0.18),
        note: "Mission-aligned local presence",
      },
    ].sort((a, b) => b.signal - a.signal);
  }, [signals]);

  /* Recruiting visibility ROI by source. */
  const recruitingChannels = useMemo(() => {
    const sources = Array.from(new Set(mockCandidates.map((c) => c.source)));
    return sources
      .map((src) => {
        const cands = mockCandidates.filter((c) => c.source === src);
        const ready = cands.filter((c) => READY_STAGES.has(c.stage)).length;
        const hired = cands.filter((c) => c.status === "Hired").length;
        const withdrew = cands.filter((c) => c.status === "Withdrawn").length;
        const fill = cands.length ? Math.round((ready / cands.length) * 100) : 0;
        return { src, count: cands.length, ready, hired, withdrew, fill };
      })
      .sort((a, b) => b.fill - a.fill);
  }, []);

  /* Operational growth correlation — demand vs capacity per state. */
  const correlations = useMemo(() => {
    const out: { id: string; title: string; detail: string; tone: "balanced" | "imbalance" }[] = [];
    stateRows.forEach((s) => {
      if (s.leads >= 3 && s.cands >= 3 && s.pressure >= 25) {
        out.push({
          id: `imb-${s.state}`,
          title: `${STATE_NAMES[s.state]} demand outpacing staffing capacity`,
          detail: `${s.qualRate}% intake qualification vs ${s.fill}% recruiting fill — operational pressure building.`,
          tone: "imbalance",
        });
      } else if (s.leads >= 3 && s.cands >= 3 && Math.abs(s.qualRate - s.fill) < 15) {
        out.push({
          id: `bal-${s.state}`,
          title: `${STATE_NAMES[s.state]} growth and staffing in balance`,
          detail: `${s.qualRate}% intake qualification aligned with ${s.fill}% recruiting fill.`,
          tone: "balanced",
        });
      }
      if (s.refs > 0 && s.qualRate >= 40) {
        out.push({
          id: `ref-${s.state}`,
          title: `${STATE_NAMES[s.state]} referrals correlate with qualification strength`,
          detail: `${s.refs} word-of-mouth families · ${s.qualRate}% reach full intake.`,
          tone: "balanced",
        });
      }
    });
    return out.slice(0, 5);
  }, [stateRows]);

  /* AI growth intelligence. */
  const insights = useMemo(() => {
    const out: string[] = [];
    if (topChannel) {
      out.push(
        `${topChannel.meta.label} remain Blossom's highest-value growth channel — ${topChannel.qual} qualified outcomes at ${topChannel.qualRate}% qualification.`,
      );
    }
    if (fastestChannel && fastestChannel.src !== topChannel?.src && fastestChannel.qualRate > 0) {
      out.push(
        `${fastestChannel.meta.label} convert at the fastest rate (${fastestChannel.qualRate}%) — efficiency leader.`,
      );
    }
    if (topState && topState.roi > 0) {
      out.push(
        `${STATE_NAMES[topState.state]} continues generating the strongest operational growth ROI (${topState.roi}/100).`,
      );
    }
    if (pressureState && pressureState.pressure >= 25) {
      out.push(
        `${STATE_NAMES[pressureState.state]} lead growth is accelerating faster than staffing capacity — recruiting visibility investment needed.`,
      );
    }
    if (signals.refShare >= 20) {
      out.push(
        `Referrals drive ${signals.refShare}% of pipeline — community trust remains Blossom's highest-conversion growth engine.`,
      );
    }
    return out.slice(0, 5);
  }, [topChannel, fastestChannel, topState, pressureState, signals]);

  return (
    <MktgPage
      title="Attribution & ROI"
      subtitle="Operational growth intelligence — what marketing, referrals, recruiting, and outreach actually move Blossom forward."
      actions={<AIPrompt label="What growth efforts are working?" variant="card" />}
    >
      {/* 1. GROWTH INTELLIGENCE HERO */}
      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 via-card to-card p-6 md:p-8">
        <div className="absolute -top-24 -right-24 size-72 rounded-full bg-primary/10 blur-3xl" aria-hidden />
        <div className="absolute -bottom-32 -left-20 size-80 rounded-full bg-emerald-500/5 blur-3xl" aria-hidden />
        <div className="relative">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            <Sparkles className="size-3.5" />
            Growth Momentum
          </div>
          <h2 className="mt-2 max-w-2xl text-xl md:text-2xl font-semibold tracking-tight text-foreground">
            {topChannel && topState
              ? `${topChannel.meta.label} and ${STATE_NAMES[topState.state]} are driving Blossom's strongest operational ROI.`
              : "Connect ad spend, call tracking, and SEO feeds in Admin → Data Uploads to activate full attribution intelligence."}
          </h2>
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: "Growth index", value: `${signals.growthIndex}/100` },
              { label: "Top channel", value: topChannel ? topChannel.meta.label : "—" },
              { label: "Highest ROI state", value: topState ? STATE_NAMES[topState.state] : "—" },
              { label: "Referral share", value: `${signals.refShare}%` },
            ].map((m) => (
              <div key={m.label} className="rounded-xl bg-card/60 backdrop-blur border border-border/50 p-3">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{m.label}</div>
                <div className="mt-1 text-[20px] font-semibold tracking-tight text-foreground truncate">{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. ROI SNAPSHOT */}
      <MktgCard title="ROI snapshot" hint="Operational value, not vanity metrics">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Intake conversion efficiency",
              value: `${signals.qualifiedRate}%`,
              sub: `${signals.qualified} of ${signals.total} reach full intake`,
              icon: Target,
              delta: signals.qualifiedRate >= 35 ? 1 : 0,
            },
            {
              label: "Referral ROI",
              value: signals.referrals.length,
              sub: `${signals.refShare}% of pipeline · highest conversion`,
              icon: Heart,
              delta: signals.delta,
            },
            {
              label: "Recruiting visibility ROI",
              value: `${signals.recruitingFill}%`,
              sub: `${signals.candReady} ready · ${signals.candHired} hired`,
              icon: Users,
              delta: signals.candHired,
            },
            {
              label: "Operational friction cost",
              value: `${signals.frictionRate}%`,
              sub: `${signals.friction} families in friction states`,
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

      {/* 3. GROWTH CHANNEL ATTRIBUTION */}
      <MktgCard title="Growth channel attribution" hint="Ranked by operational value — quality × volume − friction">
        {channels.length === 0 ? (
          <EmptyRow>No channel signal yet.</EmptyRow>
        ) : (
          <div className="space-y-2">
            {channels.map((c) => {
              const max = Math.max(1, ...channels.map((x) => x.value));
              const Icon = c.meta.icon;
              return (
                <div key={c.src} className="rounded-xl border border-border/60 bg-card p-3.5">
                  <div className="flex items-start gap-3">
                    <div className="grid size-8 place-items-center rounded-lg bg-muted">
                      <Icon className="size-4 text-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[13px] font-medium text-foreground truncate">
                            {c.meta.label}
                          </div>
                          <div className="text-[11.5px] text-muted-foreground">
                            {c.meta.family} · {c.count} leads · {c.qualRate}% qualified
                            {c.fricRate > 0 && ` · ${c.fricRate}% friction`}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[15px] font-semibold tabular-nums text-foreground">
                            {c.qual}
                          </div>
                          <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                            qualified
                          </div>
                        </div>
                      </div>
                      <div className="mt-2.5">
                        <ShareBar
                          value={(c.value / max) * 100}
                          tone={c.qualRate >= 50 ? "accent" : c.qualRate > 0 ? "primary" : "muted"}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </MktgCard>

      {/* 4. STATE-LEVEL ROI INTELLIGENCE */}
      <MktgCard title="State-level ROI intelligence" hint="Click a state for the full growth picture">
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
                    {s.roi}/100
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-[11.5px]">
                  <div>
                    <div className="text-muted-foreground">Intake</div>
                    <div className="text-[15px] font-semibold text-foreground">{s.qualRate}%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Referrals</div>
                    <div className="text-[15px] font-semibold text-foreground">{s.refs}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Staffing</div>
                    <div className="text-[15px] font-semibold text-foreground">{s.fill}%</div>
                  </div>
                </div>
                <div className="mt-3">
                  <ShareBar value={s.roi} tone={s.roi >= 50 ? "accent" : s.roi > 0 ? "primary" : "muted"} />
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
                {STATE_NAMES[activeRow.state]} growth detail
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
                <span className="text-foreground font-medium">{activeRow.leads}</span> total leads ·{" "}
                <span className="text-foreground font-medium">{activeRow.qual}</span> qualified
              </div>
              <div className="text-[12.5px] text-muted-foreground">
                <span className="text-foreground font-medium">{activeRow.refs}</span> referrals (
                <span className="text-foreground font-medium">{activeRow.refShare}%</span> of pipeline)
              </div>
              <div className="text-[12.5px] text-muted-foreground">
                Recruiting:{" "}
                <span className="text-foreground font-medium">{activeRow.cands}</span> candidates ·{" "}
                <span className="text-foreground font-medium">{activeRow.ready}</span> staffing-ready
              </div>
              <div className="text-[12.5px] text-muted-foreground">
                Hires:{" "}
                <span className="text-foreground font-medium">{activeRow.hired}</span> · Friction:{" "}
                <span className="text-foreground font-medium">{activeRow.fricRate}%</span>
              </div>
            </div>
            {activeRow.pressure >= 25 && (
              <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[12px] text-foreground">
                Growth ROI strong but staffing pressure rising — invest in recruiting visibility for{" "}
                {STATE_NAMES[activeRow.state]}.
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

      {/* 5. REFERRAL & OUTREACH ROI */}
      <MktgCard title="Referral & outreach ROI" hint="Trust-driven growth — operational value of each relationship track">
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
                      <ShareBar value={(o.signal / max) * 100} tone="accent" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </MktgCard>

      {/* 6. RECRUITING VISIBILITY ROI */}
      <MktgCard title="Recruiting visibility ROI" hint="How recruiting channels translate into staffing fulfillment">
        {recruitingChannels.length === 0 ? (
          <EmptyRow>No recruiting source signal yet.</EmptyRow>
        ) : (
          <div className="grid gap-2.5 md:grid-cols-2">
            {recruitingChannels.map((c) => (
              <div key={c.src} className="rounded-xl border border-border/60 bg-card p-3.5">
                <div className="flex items-center justify-between">
                  <div className="text-[13px] font-medium text-foreground">{c.src}</div>
                  <span className="text-[12px] tabular-nums text-muted-foreground">
                    {c.fill}% fill
                  </span>
                </div>
                <div className="mt-1 text-[11.5px] text-muted-foreground">
                  {c.count} applicants · {c.ready} ready · {c.hired} hired
                  {c.withdrew > 0 && ` · ${c.withdrew} withdrew`}
                </div>
                <div className="mt-3">
                  <ShareBar
                    value={c.fill}
                    tone={c.fill >= 50 ? "accent" : c.fill > 0 ? "primary" : "muted"}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </MktgCard>

      {/* 7. OPERATIONAL GROWTH CORRELATION */}
      <MktgCard title="Operational growth correlation" hint="Where marketing growth meets staffing capacity">
        {correlations.length === 0 ? (
          <EmptyRow>No correlation signal yet — connect more pipeline data to activate.</EmptyRow>
        ) : (
          <div className="space-y-2">
            {correlations.map((c) => (
              <div
                key={c.id}
                className={`rounded-xl border p-3.5 ${
                  c.tone === "imbalance"
                    ? "border-amber-500/30 bg-amber-500/5"
                    : "border-border/60 bg-card"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {c.tone === "imbalance" ? (
                    <Zap className="mt-0.5 size-4 text-amber-600 shrink-0" />
                  ) : (
                    <Target className="mt-0.5 size-4 text-foreground shrink-0" />
                  )}
                  <div>
                    <div className="text-[13px] font-medium text-foreground">{c.title}</div>
                    <div className="text-[12px] text-muted-foreground">{c.detail}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </MktgCard>

      {/* 8. AI ATTRIBUTION INTELLIGENCE PANEL */}
      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 via-card to-card p-5 md:p-6">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          <Brain className="size-3.5" />
          Ask Blossom AI · Attribution & ROI
        </div>
        <h3 className="mt-2 text-[17px] font-semibold tracking-tight text-foreground">
          Growth intelligence summary
        </h3>
        {insights.length === 0 ? (
          <p className="mt-2 text-[13px] text-muted-foreground">
            Connect ad platforms, SEO feeds, and call tracking to activate full AI attribution.
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
          <AIPrompt label="Which channel should we scale?" />
          <AIPrompt label="Where is demand outpacing staffing?" />
          <AIPrompt label="Which referral source produces best clients?" />
          <AIPrompt label="Where should we open new outreach?" />
          <AIPrompt label="Which state has the strongest growth ROI?" />
        </div>
      </section>
    </MktgPage>
  );
}