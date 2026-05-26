import { MktgPage, MktgCard, MetricTile, AIPrompt, EmptyRow, HealthPill } from "./_shared";
import { useMarketingIntelligence } from "@/hooks/useMarketingIntelligence";

export default function StateGrowth() {
  const mi = useMarketingIntelligence();

  const rows = mi.byState.map((s) => {
    const demandScore = s.leads + s.calls;
    const supplyScore = s.candidates;
    const alignment =
      demandScore === 0 && supplyScore === 0
        ? "quiet"
        : supplyScore >= demandScore * 0.5
        ? "aligned"
        : "supply-gap";
    return { ...s, demandScore, supplyScore, alignment };
  });

  return (
    <MktgPage
      title="State Growth"
      subtitle="Where Blossom is growing — combined marketing demand and operational staffing supply."
      actions={<AIPrompt label="Which state has the strongest growth?" variant="card" />}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricTile label="Active states" value={mi.byState.length} tone="neutral" />
        <MetricTile label="Demand signal" value={mi.totals.leads + mi.totals.calls} hint="Leads + calls" tone={(mi.totals.leads + mi.totals.calls) > 0 ? "healthy" : "neutral"} />
        <MetricTile label="Supply signal" value={mi.totals.candidates} hint="Candidates in pipeline" tone={mi.totals.candidates > 0 ? "healthy" : "neutral"} />
      </div>

      <MktgCard title="State-by-state growth" hint="Demand · supply · alignment">
        {rows.length === 0 ? (
          <EmptyRow>No state growth signal yet.</EmptyRow>
        ) : (
          <div className="divide-y divide-border/60">
            {rows.map((r) => (
              <div key={r.state} className="flex items-center justify-between py-3 text-[13px]">
                <div className="min-w-0">
                  <div className="font-medium text-foreground">{r.state}</div>
                  <div className="text-[11.5px] text-muted-foreground">
                    Demand {r.demandScore} · Supply {r.supplyScore} · {r.qualified} qualified
                  </div>
                </div>
                <HealthPill tone={r.alignment === "aligned" ? "healthy" : r.alignment === "supply-gap" ? "risk" : "neutral"}>
                  {r.alignment === "aligned" ? "Aligned" : r.alignment === "supply-gap" ? "Supply gap" : "Quiet"}
                </HealthPill>
              </div>
            ))}
          </div>
        )}
      </MktgCard>

      <MktgCard title="AI insights">
        <div className="flex flex-wrap gap-1.5">
          <AIPrompt label="Where is demand outpacing supply?" />
          <AIPrompt label="Which state should we expand into next?" />
          <AIPrompt label="Where is growth slowing?" />
        </div>
      </MktgCard>
    </MktgPage>
  );
}