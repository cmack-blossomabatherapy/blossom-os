import { useMemo, useState } from "react";
import {
  Sparkles,
  Globe,
  Phone,
  Facebook,
  Heart,
  Megaphone,
  Users,
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { MktgPage, MktgCard, AIPrompt, EmptyRow, ShareBar } from "./_shared";
import { LeadSourceActions } from "@/components/marketing/LeadSourceActions";
import { useMarketingIntelligence } from "@/hooks/useMarketingIntelligence";

/* ────────────────────────────────────────────────────────────────────────── *
 * Lead Sources — operational intelligence on how families and staff find
 * Blossom. All derived from real lead, call, and recruiting data.
 * ────────────────────────────────────────────────────────────────────────── */

const STATE_NAMES: Record<string, string> = {
  GA: "Georgia",
  NC: "North Carolina",
  TN: "Tennessee",
  VA: "Virginia",
  MD: "Maryland",
};

const SOURCE_ICON: Record<LeadSource, typeof Globe> = {
  Website: Globe,
  Phone: Phone,
  Facebook: Facebook,
  Referral: Heart,
  Ads: Megaphone,
  Organic: Search,
  Digital: Globe,
  Insurance: Users,
};

function TrendIcon({ delta }: { delta: number }) {
  if (delta > 0) return <TrendingUp className="size-3.5 text-emerald-600" />;
  if (delta < 0) return <TrendingDown className="size-3.5 text-amber-600" />;
  return <Minus className="size-3.5 text-muted-foreground" />;
}

export default function LeadSources() {
  const mi = useMarketingIntelligence();
  const [activeSource, setActiveSource] = useState<LeadSource | null>(null);

  /* ── source momentum (7d vs prior 7d) ───────────────────────────────── */
  const sourceMomentum = useMemo(() => {
    const now = Date.now();
    const map = new Map<LeadSource, { recent: number; prior: number }>();
    marketingLeads.forEach((l) => {
      const age = (now - new Date(l.createdAt).getTime()) / 86_400_000;
      const m = map.get(l.source) ?? { recent: 0, prior: 0 };
      if (age <= 7) m.recent += 1;
      else if (age <= 14) m.prior += 1;
      map.set(l.source, m);
    });
    return mi.bySource.map((s) => {
      const m = map.get(s.source) ?? { recent: 0, prior: 0 };
      return { ...s, recent: m.recent, prior: m.prior, delta: m.recent - m.prior };
    });
  }, [mi.bySource]);

  const best = [...mi.bySource].sort((a, b) => b.qualifiedRate - a.qualifiedRate)[0];
  const topVolume = mi.bySource[0];
  const topState = mi.stateTrend[0];

  /* ── intake funnel (real pipeline stages) ───────────────────────────── */
  const funnel = useMemo(() => {
    const stageCount = new Map<string, number>();
    marketingLeads.forEach((l) => stageCount.set(l.status, (stageCount.get(l.status) ?? 0) + 1));
    return pipelineStages.map((s) => ({
      stage: s.name,
      count: stageCount.get(s.name) ?? 0,
    }));
  }, []);
  const funnelMax = Math.max(1, ...funnel.map((f) => f.count));

  /* ── recruiting sources (real candidate.source) ─────────────────────── */
  const recruiting = useMemo(() => {
    const map = new Map<string, { source: string; total: number; staged: number }>();
    marketingCandidates.forEach((c) => {
      const r = map.get(c.source) ?? { source: c.source, total: 0, staged: 0 };
      r.total += 1;
      if (["Offer Accepted", "Training", "Credentialing", "Ready for Staffing"].includes(c.stage)) {
        r.staged += 1;
      }
      map.set(c.source, r);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, []);
  const recruitingMax = Math.max(1, ...recruiting.map((r) => r.total));

  /* ── filter for source-state cross-section ─────────────────────────── */
  const filteredLeads = activeSource ? marketingLeads.filter((l) => l.source === activeSource) : marketingLeads;
  const filteredByState = useMemo(() => {
    const m = new Map<string, number>();
    filteredLeads.forEach((l) => m.set(l.state, (m.get(l.state) ?? 0) + 1));
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [filteredLeads]);

  return (
    <MktgPage
      title="Lead Sources"
      subtitle="How families and staff discover Blossom — and what happens after they do."
      actions={<AIPrompt label="What's our highest-quality source?" variant="card" />}
    >
      <LeadSourceActions sourceLabel="All Sources" sourceValue="Website" sourcePage="lead-sources" />
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 via-card to-card p-6 md:p-8">
        <div className="absolute -top-24 -right-24 size-72 rounded-full bg-primary/10 blur-3xl" aria-hidden />
        <div className="relative">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            <Sparkles className="size-3.5" />
            Lead Intelligence
          </div>
          <h2 className="mt-2 max-w-2xl text-xl md:text-2xl font-semibold tracking-tight text-foreground">
            {best
              ? `${best.source} is producing the highest-quality leads at ${best.qualifiedRate}% qualified.`
              : "Awaiting lead source signals."}
          </h2>
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: "Total leads", value: mi.totals.leads },
              { label: "Sources active", value: mi.bySource.length },
              { label: "Leads · 7d", value: mi.velocity.leadsLast7 },
              { label: "Qualified rate", value: `${mi.velocity.qualifiedRate}%` },
            ].map((m) => (
              <div key={m.label} className="rounded-xl bg-card/60 backdrop-blur border border-border/50 p-3">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{m.label}</div>
                <div className="mt-1 text-[22px] font-semibold tracking-tight text-foreground">{m.value}</div>
              </div>
            ))}
          </div>
          {topVolume && topState && (
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-muted-foreground">
              <span>Strongest volume · <span className="text-foreground">{topVolume.source}</span></span>
              <span>Fastest-growing state · <span className="text-foreground">{STATE_NAMES[topState.state] ?? topState.state}</span></span>
            </div>
          )}
        </div>
      </section>

      {/* ── SOURCE SNAPSHOT GRID ─────────────────────────────────────── */}
      <MktgCard title="Lead source snapshot" hint="Click a source to filter">
        {sourceMomentum.length === 0 ? (
          <EmptyRow>No source data yet.</EmptyRow>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {sourceMomentum.map((s) => {
              const Icon = SOURCE_ICON[s.source] ?? Globe;
              const isActive = activeSource === s.source;
              return (
                <button
                  key={s.source}
                  onClick={() => setActiveSource(isActive ? null : s.source)}
                  className={`text-left rounded-xl border p-4 transition hover:-translate-y-0.5 ${
                    isActive
                      ? "border-foreground/40 bg-muted/50"
                      : "border-border/60 bg-card hover:border-border"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="grid size-8 place-items-center rounded-lg bg-muted">
                      <Icon className="size-4 text-foreground" />
                    </div>
                    <TrendIcon delta={s.delta} />
                  </div>
                  <div className="mt-3 text-[13.5px] font-medium text-foreground">{s.source}</div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-[20px] font-semibold tabular-nums text-foreground">{s.count}</span>
                    <span className="text-[11.5px] text-muted-foreground">leads</span>
                  </div>
                  <div className="mt-2 text-[11.5px] text-muted-foreground">
                    {s.qualifiedRate}% qualified · {s.recent} this week
                  </div>
                  <div className="mt-2">
                    <ShareBar value={s.qualifiedRate} tone={s.qualifiedRate >= 50 ? "accent" : "primary"} />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </MktgCard>

      {/* ── FAMILY FUNNEL + STATE BREAKDOWN ──────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <MktgCard
            title="Intake funnel"
            hint={activeSource ? `${activeSource} leads only` : "All sources · real pipeline stages"}
          >
            <div className="space-y-2.5">
              {funnel.map((f) => {
                const count = activeSource
                  ? filteredLeads.filter((l) => l.status === f.stage).length
                  : f.count;
                const max = activeSource
                  ? Math.max(1, ...pipelineStages.map((s) => filteredLeads.filter((l) => l.status === s.name).length))
                  : funnelMax;
                return (
                  <div key={f.stage}>
                    <div className="flex items-baseline justify-between text-[12.5px]">
                      <span className="font-medium text-foreground">{f.stage}</span>
                      <span className="text-muted-foreground tabular-nums">{count}</span>
                    </div>
                    <div className="mt-1">
                      <ShareBar value={(count / max) * 100} tone="primary" />
                    </div>
                  </div>
                );
              })}
            </div>
            {mi.bottlenecks.length > 0 && (
              <div className="mt-5 rounded-xl border border-amber-200/60 bg-amber-50/60 p-3 text-[12px] text-amber-800">
                <span className="font-medium">Bottleneck:</span> {mi.bottlenecks[0].count} lead
                {mi.bottlenecks[0].count === 1 ? "" : "s"} stuck at{" "}
                <span className="font-medium">{mi.bottlenecks[0].stage}</span> for 7+ days.
              </div>
            )}
          </MktgCard>
        </div>

        <div className="lg:col-span-2">
          <MktgCard title="State visibility" hint={activeSource ? `${activeSource}` : "All sources"}>
            {filteredByState.length === 0 ? (
              <EmptyRow>No state activity for this filter.</EmptyRow>
            ) : (
              <div className="space-y-3">
                {filteredByState.map(([state, count]) => {
                  const max = filteredByState[0][1];
                  const trend = mi.stateTrend.find((s) => s.state === state);
                  return (
                    <div key={state}>
                      <div className="flex items-baseline justify-between text-[12.5px]">
                        <span className="font-medium text-foreground">{STATE_NAMES[state] ?? state}</span>
                        <span className="flex items-center gap-1 text-muted-foreground tabular-nums">
                          {count}
                          {trend && <TrendIcon delta={trend.delta} />}
                        </span>
                      </div>
                      <div className="mt-1">
                        <ShareBar value={(count / max) * 100} tone="primary" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </MktgCard>
        </div>
      </div>

      {/* ── RECRUITING + REFERRAL ────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <MktgCard title="Recruiting lead sources" hint="Applicant volume + progression">
          {recruiting.length === 0 ? (
            <EmptyRow>No recruiting source data yet.</EmptyRow>
          ) : (
            <div className="space-y-3">
              {recruiting.map((r) => {
                const conv = Math.round((r.staged / Math.max(1, r.total)) * 100);
                return (
                  <div key={r.source}>
                    <div className="flex items-baseline justify-between text-[12.5px]">
                      <span className="font-medium text-foreground">{r.source}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {r.total} applicants · {conv}% progressing
                      </span>
                    </div>
                    <div className="mt-1">
                      <ShareBar value={(r.total / recruitingMax) * 100} tone={conv >= 50 ? "accent" : "primary"} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </MktgCard>

        <MktgCard title="Referral & outreach" hint="Relationship-driven lead growth">
          {mi.referrals.byState.length === 0 ? (
            <EmptyRow>No referral activity yet.</EmptyRow>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl bg-muted/40 border border-border/50 p-3">
                <div className="text-[11.5px] uppercase tracking-wider text-muted-foreground">Referral leads</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-[22px] font-semibold tabular-nums text-foreground">{mi.referrals.total}</span>
                  <span className="text-[12px] text-muted-foreground">
                    {Math.round((mi.referrals.total / Math.max(1, mi.totals.leads)) * 100)}% of all leads
                  </span>
                </div>
              </div>
              <div className="divide-y divide-border/60">
                {mi.referrals.byState.map((r) => (
                  <div key={r.state} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2 text-[13px]">
                      <Heart className="size-3.5 text-muted-foreground" />
                      <span className="font-medium text-foreground">{STATE_NAMES[r.state] ?? r.state}</span>
                    </div>
                    <span className="text-[12px] text-muted-foreground tabular-nums">
                      {r.count} lead{r.count === 1 ? "" : "s"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </MktgCard>
      </div>

      {/* ── AI INTELLIGENCE PANEL ────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-primary/[0.04] p-5 md:p-6">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          <Sparkles className="size-3.5 text-primary" />
          Operational Insights
        </div>
        <h3 className="mt-2 text-[16px] font-semibold tracking-tight text-foreground">
          Lead source intelligence
        </h3>
        <div className="mt-3 grid gap-2 text-[13px] text-foreground/90 md:grid-cols-2">
          {best && (
            <div className="rounded-xl border border-border/50 bg-card/60 p-3">
              <div className="text-[11.5px] uppercase tracking-wider text-muted-foreground">Highest quality</div>
              <div className="mt-1">
                <span className="font-medium">{best.source}</span> leads convert at {best.qualifiedRate}% — strongest qualification across all sources.
              </div>
            </div>
          )}
          {topVolume && (
            <div className="rounded-xl border border-border/50 bg-card/60 p-3">
              <div className="text-[11.5px] uppercase tracking-wider text-muted-foreground">Largest volume</div>
              <div className="mt-1">
                {topVolume.source} produced {topVolume.count} leads ({topVolume.share}% of mix).
              </div>
            </div>
          )}
          {topState && (
            <div className="rounded-xl border border-border/50 bg-card/60 p-3">
              <div className="text-[11.5px] uppercase tracking-wider text-muted-foreground">State momentum</div>
              <div className="mt-1">
                {STATE_NAMES[topState.state] ?? topState.state} is{" "}
                {topState.delta > 0 ? "accelerating" : topState.delta < 0 ? "softening" : "steady"} this week
                {topState.delta !== 0 ? ` (${topState.delta > 0 ? "+" : ""}${topState.delta} vs prior week)` : ""}.
              </div>
            </div>
          )}
          {mi.bottlenecks[0] && (
            <div className="rounded-xl border border-border/50 bg-card/60 p-3">
              <div className="text-[11.5px] uppercase tracking-wider text-muted-foreground">Operational risk</div>
              <div className="mt-1">
                {mi.bottlenecks[0].count} lead{mi.bottlenecks[0].count === 1 ? "" : "s"} stalled at {mi.bottlenecks[0].stage} — intake follow-up needed.
              </div>
            </div>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          <AIPrompt label="Which source should we invest in?" />
          <AIPrompt label="Why are leads stalling at Form Received?" />
          <AIPrompt label="Where is recruiting visibility growing fastest?" />
        </div>
      </section>
    </MktgPage>
  );
}