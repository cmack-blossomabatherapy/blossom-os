import { MktgPage, MktgCard, MetricTile, AIPrompt, EmptyRow, HealthPill } from "./_shared";
import { useMarketingIntelligence } from "@/hooks/useMarketingIntelligence";

/**
 * Attribution & ROI — channel and state-level operational value, derived from
 * real lead quality (qualified rate) and recruiting footprint. Cost data flows
 * in once ad accounts are connected via Admin → Data Uploads.
 */
export default function AttributionROI() {
  const mi = useMarketingIntelligence();

  const channels = [...mi.bySource].sort((a, b) => b.qualified - a.qualified);
  const states = [...mi.byState].sort((a, b) => b.qualified - a.qualified);

  return (
    <MktgPage
      title="Attribution & ROI"
      subtitle="Where operational value comes from — channels and states producing qualified leads."
      actions={<AIPrompt label="Which channel has the best ROI?" variant="card" />}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricTile label="Qualified leads · 30d" value={mi.velocity.qualifiedLast30} tone={mi.velocity.qualifiedLast30 > 0 ? "healthy" : "neutral"} />
        <MetricTile label="Qualified rate" value={`${mi.velocity.qualifiedRate}%`} tone={mi.velocity.qualifiedRate >= 40 ? "healthy" : "attention"} />
        <MetricTile label="Top channel" value={channels[0]?.source ?? "—"} hint={channels[0] ? `${channels[0].qualified} qualified` : undefined} tone="neutral" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MktgCard title="Channel value" hint="Ranked by qualified leads">
          {channels.length === 0 ? (
            <EmptyRow>No channel data yet.</EmptyRow>
          ) : (
            <div className="divide-y divide-border/60">
              {channels.map((c) => (
                <div key={c.source} className="flex items-center justify-between py-2.5 text-[13px]">
                  <div>
                    <div className="font-medium text-foreground">{c.source}</div>
                    <div className="text-[11.5px] text-muted-foreground">{c.count} leads · {c.qualifiedRate}% qualified</div>
                  </div>
                  <HealthPill tone={c.qualifiedRate >= 50 ? "healthy" : c.qualifiedRate >= 25 ? "attention" : "neutral"}>
                    {c.qualified} qualified
                  </HealthPill>
                </div>
              ))}
            </div>
          )}
        </MktgCard>

        <MktgCard title="State value" hint="Ranked by qualified leads">
          {states.length === 0 ? (
            <EmptyRow>No state data yet.</EmptyRow>
          ) : (
            <div className="divide-y divide-border/60">
              {states.map((s) => (
                <div key={s.state} className="flex items-center justify-between py-2.5 text-[13px]">
                  <div>
                    <div className="font-medium text-foreground">{s.state}</div>
                    <div className="text-[11.5px] text-muted-foreground">{s.leads} leads · {s.candidates} candidates</div>
                  </div>
                  <HealthPill tone={s.qualified >= 2 ? "healthy" : s.qualified >= 1 ? "attention" : "neutral"}>
                    {s.qualified} qualified
                  </HealthPill>
                </div>
              ))}
            </div>
          )}
        </MktgCard>
      </div>

      <MktgCard title="Cost & ROI">
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          When ad spend and platform cost data are connected through Admin → Data Uploads, Blossom OS will calculate cost-per-qualified-lead and ROAS per channel and state here.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <AIPrompt label="Which channel should we scale?" />
          <AIPrompt label="Where is spend not producing quality?" />
        </div>
      </MktgCard>
    </MktgPage>
  );
}