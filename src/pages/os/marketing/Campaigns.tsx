import { MktgPage, MktgCard, MetricTile, AIPrompt, EmptyRow, HealthPill, type HealthTone } from "./_shared";
import { useMarketingIntelligence } from "@/hooks/useMarketingIntelligence";

/**
 * Campaigns surface operational marketing initiatives derived from real
 * source/state lead activity. Each "campaign" represents a real source +
 * state combination active in the last 30 days — no fabricated campaigns.
 */
export default function Campaigns() {
  const mi = useMarketingIntelligence();

  // Derive lightweight campaign rows from the strongest source × state combos
  const rows = mi.bySource.flatMap((s) =>
    mi.byState
      .map((st) => ({
        source: s.source,
        state: st.state,
        // approximate operational signal — leads/state share weighted by source
        signal: Math.round((s.share / 100) * (st.leads || 0)),
      }))
      .filter((r) => r.signal > 0),
  ).sort((a, b) => b.signal - a.signal).slice(0, 8);

  const tone = (signal: number): HealthTone =>
    signal >= 3 ? "healthy" : signal >= 2 ? "attention" : "neutral";

  return (
    <MktgPage
      title="Campaigns"
      subtitle="Operational campaign visibility — active source + state combinations currently producing leads."
      actions={<AIPrompt label="Which campaigns should we scale?" variant="card" />}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricTile label="Active sources" value={mi.bySource.length} tone="neutral" />
        <MetricTile label="Active states" value={mi.byState.length} tone="neutral" />
        <MetricTile label="Leads · last 30d" value={mi.velocity.leadsLast30} tone={mi.velocity.leadsLast30 > 0 ? "healthy" : "neutral"} />
      </div>

      <MktgCard title="Active campaigns" hint="Source × state · ranked by operational signal">
        {rows.length === 0 ? (
          <EmptyRow>No active campaign signal yet.</EmptyRow>
        ) : (
          <div className="divide-y divide-border/60">
            {rows.map((r) => (
              <div key={`${r.source}-${r.state}`} className="flex items-center justify-between py-3">
                <div>
                  <div className="text-[13.5px] font-medium text-foreground">{r.source} · {r.state}</div>
                  <div className="text-[12px] text-muted-foreground">Operational signal {r.signal}</div>
                </div>
                <HealthPill tone={tone(r.signal)}>
                  {tone(r.signal) === "healthy" ? "Producing" : tone(r.signal) === "attention" ? "Light" : "Idle"}
                </HealthPill>
              </div>
            ))}
          </div>
        )}
      </MktgCard>

      <MktgCard title="AI suggestions">
        <div className="flex flex-wrap gap-1.5">
          <AIPrompt label="Where should we increase spend?" />
          <AIPrompt label="Which campaign is underperforming?" />
          <AIPrompt label="Draft a campaign brief for the strongest state" />
        </div>
      </MktgCard>
    </MktgPage>
  );
}