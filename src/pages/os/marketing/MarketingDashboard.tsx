import { MktgPage, MktgCard, AIPrompt, EmptyRow, ShareBar } from "./_shared";
import { useMarketingIntelligence } from "@/hooks/useMarketingIntelligence";
import { Link } from "react-router-dom";
import { ArrowUpRight, TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react";

// ---------- helpers -----------------------------------------------------------

function TrendBadge({ delta, pct }: { delta: number; pct: number }) {
  const tone =
    delta > 0
      ? "text-emerald-600 bg-emerald-500/10"
      : delta < 0
      ? "text-rose-600 bg-rose-500/10"
      : "text-muted-foreground bg-muted";
  const Icon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${tone}`}>
      <Icon className="h-3 w-3" />
      {delta > 0 ? "+" : ""}
      {pct}%
    </span>
  );
}

function PulseTile({
  label,
  value,
  hint,
  trend,
}: {
  label: string;
  value: string | number;
  hint?: string;
  trend?: { delta: number; pct: number };
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/80 p-4 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-border">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        {trend && <TrendBadge {...trend} />}
      </div>
      <div className="mt-2 text-[26px] font-semibold tracking-tight text-foreground tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-[12px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

// ---------- page --------------------------------------------------------------

export default function MarketingDashboard() {
  const mi = useMarketingIntelligence();

  const topSource = mi.bySource[0];
  const topState = mi.byState[0];
  const acceleratingState = mi.stateTrend.filter((s) => s.delta > 0).sort((a, b) => b.pct - a.pct)[0];
  const slowingState = mi.stateTrend.filter((s) => s.delta < 0).sort((a, b) => a.pct - b.pct)[0];
  const topBottleneck = mi.bottlenecks[0];

  const weekDelta = mi.velocity.leadsLast30
    ? Math.round((mi.velocity.leadsLast7 / (mi.velocity.leadsLast30 / 4) - 1) * 100)
    : 0;

  // Pipeline visualization — only stages with movement
  const livePipeline = mi.pipeline.filter((p) => p.count > 0);
  const maxStage = Math.max(1, ...livePipeline.map((p) => p.count));

  return (
    <MktgPage
      title="Growth Pulse"
      subtitle="The growth heartbeat of Blossom — leads, states, recruiting and outreach in one calm view."
      actions={
        <AIPrompt
          label="Summarize this week"
          prompt="Summarize Blossom's marketing and growth pulse for this week — lead sources, state momentum, call volume, recruiting visibility, bottlenecks and where to focus."
          variant="card"
        />
      }
    >
      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-primary/10 via-background to-background p-6 md:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />

        <div className="relative grid gap-6 md:grid-cols-3 md:items-end">
          <div className="md:col-span-2 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-2.5 py-1 text-[11px] text-muted-foreground backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live · operational growth signal
            </div>
            <h2 className="text-2xl md:text-[34px] font-semibold tracking-tight text-foreground leading-[1.15]">
              {acceleratingState ? (
                <>
                  <span className="text-primary">{acceleratingState.state}</span> lead growth is up{" "}
                  <span className="text-primary">{acceleratingState.pct}%</span> week over week.
                </>
              ) : topState ? (
                <>
                  <span className="text-primary">{topState.state}</span> is leading lead volume with {topState.leads} active leads.
                </>
              ) : (
                <>Blossom is online and listening for growth signals.</>
              )}
            </h2>
            <p className="text-[14px] text-muted-foreground max-w-xl">
              {topSource
                ? `${topSource.source} is the strongest channel — ${topSource.share}% of leads at ${topSource.qualifiedRate}% qualified. `
                : ""}
              {slowingState
                ? `${slowingState.state} momentum has cooled ${Math.abs(slowingState.pct)}% — worth a closer look.`
                : topBottleneck
                ? `${topBottleneck.count} leads are stuck in "${topBottleneck.stage}" — clearing them moves the funnel.`
                : "No operational concerns detected right now."}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 md:gap-2 text-center">
            <div className="rounded-2xl border border-border/60 bg-card/70 p-3 backdrop-blur">
              <div className="text-[11px] text-muted-foreground">Leads · 7d</div>
              <div className="mt-1 text-xl font-semibold tabular-nums">{mi.velocity.leadsLast7}</div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/70 p-3 backdrop-blur">
              <div className="text-[11px] text-muted-foreground">Qualified</div>
              <div className="mt-1 text-xl font-semibold tabular-nums">{mi.velocity.qualifiedRate}%</div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/70 p-3 backdrop-blur">
              <div className="text-[11px] text-muted-foreground">States</div>
              <div className="mt-1 text-xl font-semibold tabular-nums">{mi.byState.length}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- SNAPSHOT ---------------- */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <PulseTile
          label="New Leads · 30d"
          value={mi.velocity.leadsLast30}
          hint={`${mi.velocity.leadsLast7} in last 7 days`}
          trend={{ delta: weekDelta, pct: weekDelta }}
        />
        <PulseTile
          label="Qualified Leads"
          value={mi.velocity.qualifiedLast30}
          hint={`${mi.velocity.qualifiedRate}% qualified rate`}
        />
        <PulseTile
          label="Inbound Calls · 24h"
          value={mi.calls.last24h}
          hint={mi.calls.missed > 0 ? `${mi.calls.missed} need return` : "All returned"}
        />
        <PulseTile
          label="Referral Leads"
          value={mi.referrals.total}
          hint={mi.referrals.byState[0] ? `${mi.referrals.byState[0].state} leading` : "—"}
        />
        <PulseTile
          label="Recruiting Applicants"
          value={mi.totals.candidates}
          hint={mi.recruitingBySource[0] ? `${mi.recruitingBySource[0].source} top source` : "—"}
        />
        <PulseTile
          label="Active States"
          value={mi.byState.length}
          hint={topState ? `${topState.state} leading` : "—"}
        />
        <PulseTile
          label="Top Source Share"
          value={topSource ? `${topSource.share}%` : "—"}
          hint={topSource?.source}
        />
        <PulseTile
          label="Bottlenecks"
          value={mi.bottlenecks.reduce((s, b) => s + b.count, 0)}
          hint={topBottleneck ? `${topBottleneck.stage}` : "Funnel flowing"}
        />
      </section>

      {/* ---------------- LEAD INTELLIGENCE ---------------- */}
      <section className="grid gap-4 lg:grid-cols-3">
        <MktgCard title="Lead pipeline" hint="Real intake stages · live counts" className="lg:col-span-2">
          {livePipeline.length === 0 ? (
            <EmptyRow>No active leads in the pipeline yet.</EmptyRow>
          ) : (
            <div className="space-y-3">
              {livePipeline.map((p) => {
                const pct = Math.round((p.count / maxStage) * 100);
                const stuckHere = mi.bottlenecks.find((b) => b.stage === p.stage)?.count ?? 0;
                return (
                  <div key={p.stage} className="space-y-1.5">
                    <div className="flex items-baseline justify-between text-[13px]">
                      <span className="font-medium text-foreground">{p.stage}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {p.count}
                        {stuckHere > 0 && (
                          <span className="ml-2 text-amber-600">{stuckHere} stuck ≥7d</span>
                        )}
                      </span>
                    </div>
                    <ShareBar value={pct} tone={stuckHere > 0 ? "muted" : "primary"} />
                  </div>
                );
              })}
            </div>
          )}
        </MktgCard>

        <MktgCard title="Top performing lead sources" hint="Volume · qualified rate">
          {mi.bySource.length === 0 ? (
            <EmptyRow>No lead source data yet.</EmptyRow>
          ) : (
            <div className="space-y-3">
              {mi.bySource.slice(0, 6).map((s) => (
                <div key={s.source} className="space-y-1">
                  <div className="flex items-baseline justify-between text-[13px]">
                    <span className="font-medium text-foreground">{s.source}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {s.count} · {s.qualifiedRate}%
                    </span>
                  </div>
                  <ShareBar value={s.share} tone="primary" />
                </div>
              ))}
              <Link
                to="/marketing/lead-sources"
                className="inline-flex items-center gap-1 pt-1 text-[12.5px] text-primary/80 hover:text-primary"
              >
                Open lead sources <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </MktgCard>
      </section>

      {/* ---------------- STATE GROWTH ---------------- */}
      <section>
        <MktgCard
          title="State growth"
          hint="Lead volume · 7d momentum · recruiting alignment"
        >
          {mi.stateTrend.length === 0 ? (
            <EmptyRow>No state data yet.</EmptyRow>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {mi.stateTrend.map((s) => (
                <Link
                  key={s.state}
                  to="/marketing/state-growth"
                  className="group rounded-2xl border border-border/60 bg-muted/30 p-4 transition hover:-translate-y-0.5 hover:border-border hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[13px] font-semibold tracking-tight text-foreground">{s.state}</div>
                      <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                        {s.leads} leads · {s.candidates} candidates
                      </div>
                    </div>
                    <TrendBadge delta={s.delta} pct={s.pct} />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-1.5 text-center text-[11px] text-muted-foreground">
                    <div className="rounded-lg bg-background/60 py-1">
                      <div className="font-semibold text-foreground tabular-nums">{s.recent}</div>
                      <div>7d</div>
                    </div>
                    <div className="rounded-lg bg-background/60 py-1">
                      <div className="font-semibold text-foreground tabular-nums">{s.calls}</div>
                      <div>calls</div>
                    </div>
                    <div className="rounded-lg bg-background/60 py-1">
                      <div className="font-semibold text-foreground tabular-nums">{s.qualified}</div>
                      <div>qual.</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <div className="pt-3">
            <Link
              to="/marketing/state-growth"
              className="inline-flex items-center gap-1 text-[12.5px] text-primary/80 hover:text-primary"
            >
              Open state growth <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </MktgCard>
      </section>

      {/* ---------------- RECRUITING + REPUTATION/OUTREACH ---------------- */}
      <section className="grid gap-4 lg:grid-cols-2">
        <MktgCard
          title="Recruiting visibility"
          hint="Is marketing helping staffing growth?"
        >
          {mi.recruitingBySource.length === 0 ? (
            <EmptyRow>No recruiting source data yet.</EmptyRow>
          ) : (
            <div className="space-y-3">
              {mi.recruitingBySource.slice(0, 5).map((s) => {
                const share = Math.round((s.count / mi.totals.candidates) * 100);
                return (
                  <div key={s.source} className="space-y-1">
                    <div className="flex items-baseline justify-between text-[13px]">
                      <span className="font-medium text-foreground">{s.source}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {s.count} candidates · {share}%
                      </span>
                    </div>
                    <ShareBar value={share} tone="accent" />
                  </div>
                );
              })}
            </div>
          )}
          <div className="pt-3">
            <Link to="/marketing/recruiting" className="inline-flex items-center gap-1 text-[12.5px] text-primary/80 hover:text-primary">
              Open recruiting marketing <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </MktgCard>

        <MktgCard
          title="Referral & community pulse"
          hint="Where relationships are driving growth"
        >
          {mi.referrals.total === 0 ? (
            <EmptyRow>No referral leads logged yet.</EmptyRow>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border border-border/60 bg-muted/40 p-3 text-[12.5px] text-foreground/80">
                <span className="font-medium text-foreground">{mi.referrals.total} referral leads</span> active across {mi.referrals.byState.length} states.
              </div>
              <div className="divide-y divide-border/60">
                {mi.referrals.byState.slice(0, 5).map((r) => (
                  <div key={r.state} className="flex items-center justify-between py-2 text-[13px]">
                    <span className="text-foreground">{r.state}</span>
                    <span className="text-muted-foreground tabular-nums">{r.count} referrals</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="pt-3">
            <Link to="/marketing/referrals" className="inline-flex items-center gap-1 text-[12.5px] text-primary/80 hover:text-primary">
              Open referrals <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </MktgCard>
      </section>

      {/* ---------------- AI GROWTH INSIGHTS ---------------- */}
      <section>
        <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-background via-background to-primary/5 p-6">
          <div className="pointer-events-none absolute -right-16 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-primary/80">
                <Sparkles className="h-3 w-3" /> Operational Insights
              </div>
              <h3 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
                Growth intelligence, in plain language.
              </h3>
              <div className="space-y-1.5 text-[13px] text-foreground/80">
                {acceleratingState && (
                  <p>
                    • {acceleratingState.state} lead growth is accelerating ({acceleratingState.recent} in last 7d vs {acceleratingState.prior} prior) — recruiting capacity worth checking.
                  </p>
                )}
                {topSource && (
                  <p>
                    • {topSource.source} continues to drive {topSource.share}% of all leads at {topSource.qualifiedRate}% qualified — the strongest signal in the funnel.
                  </p>
                )}
                {topBottleneck && (
                  <p>
                    • {topBottleneck.count} leads are stuck in "{topBottleneck.stage}" ≥7 days — clearing this stage will move conversion the most.
                  </p>
                )}
                {mi.calls.missed > 0 && (
                  <p>
                    • {mi.calls.missed} inbound calls are awaiting return — a fast follow-up consistently outperforms paid acquisition.
                  </p>
                )}
                {!acceleratingState && !topSource && !topBottleneck && mi.calls.missed === 0 && (
                  <p>• No operational growth concerns right now. Pipeline is healthy.</p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <AIPrompt label="What should marketing focus on this week?" variant="card" />
              <AIPrompt label="Where is growth out of sync with staffing?" variant="card" />
              <AIPrompt label="Which channels deserve more investment?" variant="card" />
            </div>
          </div>
        </div>
      </section>
    </MktgPage>
  );
}