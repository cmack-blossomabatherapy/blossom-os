import { MktgPage, MktgCard, MetricTile, AIPrompt, EmptyRow, ShareBar } from "./_shared";
import { useMarketingIntelligence } from "@/hooks/useMarketingIntelligence";

export default function WebAnalytics() {
  const mi = useMarketingIntelligence();
  const digital = mi.bySource.filter((s) =>
    ["Website", "Organic", "Digital", "Ads", "Facebook"].includes(s.source),
  );
  const digitalTotal = digital.reduce((sum, s) => sum + s.count, 0);

  return (
    <MktgPage
      title="Web Analytics"
      subtitle="Traffic and conversion movement — interpreted, not dumped."
      actions={<AIPrompt label="What changed in traffic this week?" variant="card" />}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricTile label="Digital leads" value={digitalTotal} hint="Website + Organic + Paid + Social" tone={digitalTotal > 0 ? "healthy" : "neutral"} />
        <MetricTile label="Digital share" value={`${Math.round((digitalTotal / (mi.totals.leads || 1)) * 100)}%`} tone="neutral" />
        <MetricTile label="Conversion · 30d" value={`${mi.velocity.qualifiedRate}%`} hint="Qualified / total" tone={mi.velocity.qualifiedRate >= 40 ? "healthy" : "attention"} />
      </div>

      <MktgCard title="Digital channels" hint="Volume and qualified conversion">
        {digital.length === 0 ? (
          <EmptyRow>No digital channel data yet.</EmptyRow>
        ) : (
          <div className="space-y-3">
            {digital.map((s) => (
              <div key={s.source} className="space-y-1.5">
                <div className="flex items-baseline justify-between text-[13px]">
                  <span className="font-medium text-foreground">{s.source}</span>
                  <span className="text-muted-foreground tabular-nums">{s.count} · {s.qualifiedRate}% qualified</span>
                </div>
                <ShareBar value={s.share} tone="primary" />
              </div>
            ))}
          </div>
        )}
      </MktgCard>

      <MktgCard title="Interpretation">
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Web analytics here surface the operational signal — leads, qualified conversion, and channel share — instead of raw page views.
          Detailed session, attribution, and UTM data from Google Analytics flows in through Admin → Data Uploads.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <AIPrompt label="What's the biggest conversion drop-off?" />
          <AIPrompt label="Which landing page should we test next?" />
        </div>
      </MktgCard>
    </MktgPage>
  );
}