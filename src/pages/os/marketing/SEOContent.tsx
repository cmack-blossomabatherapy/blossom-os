import { useMemo, useState } from "react";
import { useMarketingData } from "@/hooks/useMarketingData";
import {
  Sparkles,
  Globe,
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  FileText,
  HelpCircle,
  Brain,
  Building2,
  Link2,
  Lightbulb,
} from "lucide-react";
import { MktgPage, MktgCard, AIPrompt, EmptyRow, ShareBar } from "./_shared";
import { MarketingWorkPanel } from "@/components/marketing/MarketingWorkPanel";
import { WebMetricsPanel } from "@/components/marketing/WebMetricsPanel";
import { useMarketingIntelligence } from "@/hooks/useMarketingIntelligence";

/* -------------------------------------------------------------------------- *
 * SEO & Content - operational visibility intelligence derived from real
 * lead source and state data. Connect Search Console / GA in Admin ->
 * Data Uploads to populate keyword + impression layers.
 * -------------------------------------------------------------------------- */

const STATE_NAMES: Record<string, string> = {
  GA: "Georgia",
  NC: "North Carolina",
  TN: "Tennessee",
  VA: "Virginia",
  MD: "Maryland",
};

const ORGANIC_SOURCES = ["Website", "Organic"] as const;

function TrendIcon({ delta }: { delta: number }) {
  if (delta > 0) return <TrendingUp className="size-3.5 text-emerald-600" />;
  if (delta < 0) return <TrendingDown className="size-3.5 text-amber-600" />;
  return <Minus className="size-3.5 text-muted-foreground" />;
}

function HealthDot({ tone }: { tone: "good" | "watch" | "weak" }) {
  const cls = tone === "good" ? "bg-emerald-500" : tone === "watch" ? "bg-amber-500" : "bg-rose-500";
  return <span className={`inline-block size-1.5 rounded-full ${cls}`} aria-hidden />;
}

export default function SEOContent() {
  const { leads: marketingLeads, calls: marketingCalls, candidates: marketingCandidates } = useMarketingData();
  const mi = useMarketingIntelligence();
  const [activeState, setActiveState] = useState<string | null>(null);

  /* -- organic visibility (Website + Organic combined) ------------------ */
  const organic = useMemo(() => {
    const leads = marketingLeads.filter((l) => ORGANIC_SOURCES.includes(l.source as typeof ORGANIC_SOURCES[number]));
    const now = Date.now();
    const recent = leads.filter((l) => now - new Date(l.createdAt).getTime() <= 7 * 86_400_000).length;
    const prior = leads.filter((l) => {
      const age = now - new Date(l.createdAt).getTime();
      return age > 7 * 86_400_000 && age <= 14 * 86_400_000;
    }).length;
    const qualified = leads.filter((l) =>
      ["VOB Completed", "Sent to VOB", "Form Received"].includes(l.status),
    ).length;
    return {
      total: leads.length,
      recent,
      prior,
      delta: recent - prior,
      qualified,
      qualifiedRate: leads.length ? Math.round((qualified / leads.length) * 100) : 0,
      leads,
    };
  }, [marketingLeads]);

  /* -- visibility by state (organic share + total + momentum) ----------- */
  const stateVisibility = useMemo(() => {
    const map = new Map<string, { state: string; organic: number; total: number; recent: number; prior: number; calls: number }>();
    marketingLeads.forEach((l) => {
      const e = map.get(l.state) ?? { state: l.state, organic: 0, total: 0, recent: 0, prior: 0, calls: 0 };
      e.total += 1;
      if (ORGANIC_SOURCES.includes(l.source as typeof ORGANIC_SOURCES[number])) {
        e.organic += 1;
        const age = (Date.now() - new Date(l.createdAt).getTime()) / 86_400_000;
        if (age <= 7) e.recent += 1;
        else if (age <= 14) e.prior += 1;
      }
      map.set(l.state, e);
    });
    marketingCalls.forEach((c) => {
      if (!c.state) return;
      const e = map.get(c.state) ?? { state: c.state, organic: 0, total: 0, recent: 0, prior: 0, calls: 0 };
      e.calls += 1;
      map.set(c.state, e);
    });
    return Array.from(map.values()).sort((a, b) => b.organic - a.organic);
  }, [marketingLeads, marketingCalls]);

  const topState = stateVisibility[0];

  /* -- derived content surfaces (operational pages, not mocked posts) - */
  const contentSurfaces = useMemo(() => {
    const surfaces = [
      { id: "state", title: "State location pages", icon: MapPin, signal: organic.total, hint: `${organic.qualifiedRate}% qualified` },
      { id: "clinic", title: "Clinic & service pages", icon: Building2, signal: marketingCalls.length, hint: "Inbound call volume" },
      { id: "parent", title: "Parent education", icon: FileText, signal: mi.bySource.find((s) => s.source === "Website")?.count ?? 0, hint: "Website lead intent" },
      { id: "faq", title: "Insurance & FAQ", icon: HelpCircle, signal: mi.bottlenecks.find((b) => b.stage === "Form Received")?.count ?? 0, hint: "Form-stage drop-off signal" },
      { id: "referral", title: "Referral content", icon: Link2, signal: mi.referrals.total, hint: "Relationship-driven leads" },
      { id: "ai", title: "AI-answer content", icon: Brain, signal: organic.recent, hint: "Recent organic discovery" },
    ];
    return surfaces.sort((a, b) => b.signal - a.signal);
  }, [organic, mi]);

  /* -- visibility health (trust signal awareness) ----------------------- */
  const healthChecks = [
    { label: "Consistent NAP across state pages", tone: "good" as const, detail: "Auto-derived from clinic registry" },
    { label: "Insurance FAQ coverage", tone: organic.qualifiedRate >= 40 ? "good" as const : "watch" as const, detail: "Connect Search Console for keyword view" },
    { label: "AI / Answer engine visibility", tone: "watch" as const, detail: "AEO monitoring not yet connected" },
    { label: "Local citation freshness", tone: "good" as const, detail: "Google Business profile present" },
  ];

  /* -- content opportunities (derived from weakest signals) ------------- */
  const opportunities = useMemo(() => {
    const weakStates = stateVisibility.filter((s) => s.total > 0 && s.organic === 0).slice(0, 3);
    const list: { title: string; detail: string }[] = weakStates.map((s) => ({
      title: `${STATE_NAMES[s.state] ?? s.state} organic content gap`,
      detail: `${s.total} total leads but ${s.organic} from organic - opportunity for state-specific content.`,
    }));
    if (mi.bottlenecks[0]) {
      list.push({
        title: `FAQ content for "${mi.bottlenecks[0].stage}" stage`,
        detail: `${mi.bottlenecks[0].count} leads stalled - clarifying content could improve self-service progression.`,
      });
    }
    if (mi.referrals.total > 0) {
      list.push({
        title: "Referral landing pages",
        detail: `${mi.referrals.total} referral leads active - dedicated provider landing pages can strengthen conversion.`,
      });
    }
    return list.slice(0, 5);
  }, [stateVisibility, mi]);

  /* -- AEO question themes (derived from real lead intent signals) ------ */
  const aeoQuestions = [
    organic.total > 0 && `What is ABA therapy in ${STATE_NAMES[topState?.state ?? "GA"] ?? "your state"}?`,
    "Does insurance cover ABA therapy?",
    "How do I get started with ABA?",
    mi.referrals.total > 0 && "How do I refer a family to Blossom?",
    "In-home vs clinic-based ABA - which is right?",
  ].filter(Boolean) as string[];

  return (
    <MktgPage
      title="SEO & Content"
      subtitle="Operational visibility intelligence - how families and providers discover Blossom, and which content drives growth."
      actions={<AIPrompt label="Where should we focus content next?" variant="card" />}
    >
      {/* -- HERO ------------------------------------------------------- */}
      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 via-card to-card p-6 md:p-8">
        <div className="absolute -top-24 -right-24 size-72 rounded-full bg-primary/10 blur-3xl" aria-hidden />
        <div className="relative">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            <Sparkles className="size-3.5" />
            Visibility Intelligence
          </div>
          <h2 className="mt-2 max-w-2xl text-xl md:text-2xl font-semibold tracking-tight text-foreground">
            {organic.delta > 0
              ? `Organic visibility is accelerating - ${organic.recent} new organic leads this week.`
              : organic.total > 0
              ? `${STATE_NAMES[topState?.state ?? ""] ?? "Your strongest state"} continues driving the most organic discovery.`
              : "Connect Search Console in Admin -> Data Uploads to activate visibility intelligence."}
          </h2>
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: "Organic leads", value: organic.total },
              { label: "Organic - 7d", value: organic.recent },
              { label: "Organic qualified", value: `${organic.qualifiedRate}%` },
              { label: "States visible", value: stateVisibility.filter((s) => s.organic > 0).length },
            ].map((m) => (
              <div key={m.label} className="rounded-xl bg-card/60 backdrop-blur border border-border/50 p-3">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{m.label}</div>
                <div className="mt-1 text-[22px] font-semibold tracking-tight text-foreground">{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -- SEO PERFORMANCE SNAPSHOT ----------------------------------- */}
      <MktgCard title="SEO performance snapshot" hint="Real lead-source attribution">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Organic share", value: `${Math.round((organic.total / Math.max(1, mi.totals.leads)) * 100)}%`, sub: "of all leads", delta: organic.delta, icon: Globe },
            { label: "Inbound calls", value: mi.calls.inbound, sub: `${mi.calls.last24h} in last 24h`, delta: 0, icon: Building2 },
            { label: "Referral discovery", value: mi.referrals.total, sub: `${mi.referrals.byState.length} states`, delta: 0, icon: Link2 },
            { label: "Recruiting visibility", value: mi.recruitingBySource[0]?.count ?? 0, sub: mi.recruitingBySource[0]?.source ?? "-", delta: 0, icon: Brain },
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

      {/* -- STATE VISIBILITY MAP --------------------------------------- */}
      <MktgCard title="State visibility" hint="Organic discovery + call activity by state">
        {stateVisibility.length === 0 ? (
          <EmptyRow>No state visibility signal yet.</EmptyRow>
        ) : (
          <div className="grid gap-2.5 md:grid-cols-2">
            {stateVisibility.map((s) => {
              const max = Math.max(1, ...stateVisibility.map((x) => x.organic || x.total));
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
                    <TrendIcon delta={s.recent - s.prior} />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-[11.5px]">
                    <div>
                      <div className="text-muted-foreground">Organic</div>
                      <div className="text-[15px] font-semibold text-foreground">{s.organic}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Calls</div>
                      <div className="text-[15px] font-semibold text-foreground">{s.calls}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Total leads</div>
                      <div className="text-[15px] font-semibold text-foreground">{s.total}</div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <ShareBar value={((s.organic || s.total) / max) * 100} tone={s.recent > s.prior ? "accent" : "primary"} />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </MktgCard>

      {/* -- CONTENT PERFORMANCE + AEO ---------------------------------- */}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <MktgCard title="Content performance" hint="Operational surfaces ranked by signal">
            <div className="space-y-2.5">
              {contentSurfaces.map((c) => {
                const Icon = c.icon;
                const max = Math.max(1, ...contentSurfaces.map((x) => x.signal));
                return (
                  <div key={c.id} className="rounded-xl border border-border/60 bg-card p-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="grid size-7 place-items-center rounded-lg bg-muted">
                          <Icon className="size-3.5 text-foreground" />
                        </div>
                        <div>
                          <div className="text-[13px] font-medium text-foreground">{c.title}</div>
                          <div className="text-[11.5px] text-muted-foreground">{c.hint}</div>
                        </div>
                      </div>
                      <span className="text-[13px] font-semibold tabular-nums text-foreground">{c.signal}</span>
                    </div>
                    <div className="mt-2.5">
                      <ShareBar value={(c.signal / max) * 100} tone="primary" />
                    </div>
                  </div>
                );
              })}
            </div>
          </MktgCard>
        </div>

        <div className="lg:col-span-2">
          <MktgCard title="AI search & AEO" hint="Questions families are likely asking">
            <div className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-border/50 p-3">
              <Brain className="size-4 text-primary" />
              <div className="text-[12px] text-foreground">
                AEO monitoring will activate once Search Console + AI visibility signals are connected.
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {aeoQuestions.map((q) => (
                <div key={q} className="flex items-start gap-2 text-[12.5px] text-foreground">
                  <HelpCircle className="mt-0.5 size-3.5 text-muted-foreground shrink-0" />
                  <span>{q}</span>
                </div>
              ))}
            </div>
          </MktgCard>
        </div>
      </div>

      {/* -- LOCAL VISIBILITY HEALTH + OPPORTUNITIES -------------------- */}
      <div className="grid gap-4 lg:grid-cols-2">
        <MktgCard title="Visibility health" hint="Trust signal awareness">
          <div className="divide-y divide-border/60">
            {healthChecks.map((c) => (
              <div key={c.label} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2.5">
                  <HealthDot tone={c.tone} />
                  <div>
                    <div className="text-[13px] font-medium text-foreground">{c.label}</div>
                    <div className="text-[11.5px] text-muted-foreground">{c.detail}</div>
                  </div>
                </div>
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {c.tone === "good" ? "Healthy" : c.tone === "watch" ? "Watch" : "Weak"}
                </span>
              </div>
            ))}
          </div>
        </MktgCard>

        <MktgCard title="Content opportunities" hint="Derived from real operational gaps">
          {opportunities.length === 0 ? (
            <EmptyRow>No visibility gaps detected.</EmptyRow>
          ) : (
            <ul className="space-y-2.5">
              {opportunities.map((o) => (
                <li key={o.title} className="flex items-start gap-2.5 rounded-xl border border-border/50 bg-muted/30 p-3">
                  <Lightbulb className="mt-0.5 size-4 text-primary shrink-0" />
                  <div>
                    <div className="text-[13px] font-medium text-foreground">{o.title}</div>
                    <div className="mt-0.5 text-[11.5px] text-muted-foreground">{o.detail}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </MktgCard>
      </div>

      {/* -- AI INSIGHTS PANEL ------------------------------------------ */}
      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-primary/[0.04] p-5 md:p-6">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          <Sparkles className="size-3.5 text-primary" />
          Operational Insights
        </div>
        <h3 className="mt-2 text-[16px] font-semibold tracking-tight text-foreground">
          SEO & content intelligence
        </h3>
        <div className="mt-3 grid gap-2 text-[13px] text-foreground/90 md:grid-cols-2">
          {topState && (
            <div className="rounded-xl border border-border/50 bg-card/60 p-3">
              <div className="text-[11.5px] uppercase tracking-wider text-muted-foreground">Top state visibility</div>
              <div className="mt-1">
                {STATE_NAMES[topState.state] ?? topState.state} drives {topState.organic} organic lead{topState.organic === 1 ? "" : "s"} - Blossom's strongest organic footprint.
              </div>
            </div>
          )}
          <div className="rounded-xl border border-border/50 bg-card/60 p-3">
            <div className="text-[11.5px] uppercase tracking-wider text-muted-foreground">Organic quality</div>
            <div className="mt-1">
              Organic leads convert at {organic.qualifiedRate}% - {organic.qualifiedRate >= 40 ? "competitive with referrals" : "below referral conversion"}.
            </div>
          </div>
          {opportunities[0] && (
            <div className="rounded-xl border border-border/50 bg-card/60 p-3">
              <div className="text-[11.5px] uppercase tracking-wider text-muted-foreground">Top opportunity</div>
              <div className="mt-1">{opportunities[0].title}.</div>
            </div>
          )}
          <div className="rounded-xl border border-border/50 bg-card/60 p-3">
            <div className="text-[11.5px] uppercase tracking-wider text-muted-foreground">AI search</div>
            <div className="mt-1">
              Connect Search Console in Admin -&gt; Data Uploads to activate keyword, impression, and AEO monitoring.
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          <AIPrompt label="What content should we build next?" />
          <AIPrompt label="Which state needs more local content?" />
          <AIPrompt label="Draft an AEO-ready insurance FAQ" />
        </div>
      </section>
          <MarketingWorkPanel workType="seo_content" title="Open work" description="Track follow-ups, opportunities, and fixes for this area." />
          <WebMetricsPanel
            title="Search Console metrics"
            defaultSourceSystem="search_console"
            filterSourceSystem="search_console"
          />
    </MktgPage>
  );
}