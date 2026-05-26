import { MktgPage, MktgCard, MetricTile, AIPrompt, EmptyRow, ShareBar } from "./_shared";
import { useMarketingIntelligence } from "@/hooks/useMarketingIntelligence";

export default function LeadSources() {
  const mi = useMarketingIntelligence();
  const best = [...mi.bySource].sort((a, b) => b.qualifiedRate - a.qualifiedRate)[0];

  return (
    <MktgPage
      title="Lead Sources"
      subtitle="Where Blossom families actually find us, and which sources produce qualified leads."
      actions={<AIPrompt label="Which source has the best quality?" variant="card" />}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricTile label="Total leads" value={mi.totals.leads} tone="neutral" />
        <MetricTile label="Sources active" value={mi.bySource.length} tone="neutral" />
        <MetricTile label="Best quality" value={best ? `${best.source}` : "—"} hint={best ? `${best.qualifiedRate}% qualified` : undefined} tone={best && best.qualifiedRate >= 40 ? "healthy" : "neutral"} />
      </div>

      <MktgCard title="Source breakdown" hint="Volume + qualified rate">
        {mi.bySource.length === 0 ? (
          <EmptyRow>No source data yet.</EmptyRow>
        ) : (
          <div className="space-y-4">
            {mi.bySource.map((s) => (
              <div key={s.source} className="space-y-1.5">
                <div className="flex items-baseline justify-between text-[13px]">
                  <span className="font-medium text-foreground">{s.source}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {s.count} leads · {s.qualified} qualified · <span className="text-foreground/80">{s.qualifiedRate}%</span>
                  </span>
                </div>
                <ShareBar value={s.share} tone="primary" />
              </div>
            ))}
          </div>
        )}
      </MktgCard>

      <MktgCard title="AI insights">
        <div className="flex flex-wrap gap-1.5">
          <AIPrompt label="Why is Referral converting higher than Ads?" />
          <AIPrompt label="Where should we invest more?" />
          <AIPrompt label="What sources are losing momentum?" />
        </div>
      </MktgCard>
    </MktgPage>
  );
}