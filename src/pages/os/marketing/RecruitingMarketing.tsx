import { MktgPage, MktgCard, MetricTile, AIPrompt, EmptyRow, ShareBar } from "./_shared";
import { useMarketingIntelligence } from "@/hooks/useMarketingIntelligence";
import { mockCandidates } from "@/data/recruiting";
import { useMemo } from "react";

export default function RecruitingMarketing() {
  const mi = useMarketingIntelligence();

  const byState = useMemo(() => {
    const map = new Map<string, number>();
    mockCandidates.forEach((c) => {
      if (!c.state) return;
      map.set(c.state, (map.get(c.state) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count);
  }, []);

  const totalCandidates = mi.totals.candidates || 1;
  const topSource = mi.recruitingBySource[0];

  return (
    <MktgPage
      title="Recruiting Marketing"
      subtitle="Where applicants come from, and where recruiting visibility is growing."
      actions={<AIPrompt label="Which state needs more recruiting visibility?" variant="card" />}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricTile label="Candidates" value={mi.totals.candidates} tone={mi.totals.candidates > 0 ? "healthy" : "neutral"} />
        <MetricTile label="Sources active" value={mi.recruitingBySource.length} tone="neutral" />
        <MetricTile label="Top source" value={topSource ? topSource.source : "—"} hint={topSource ? `${topSource.count} candidates` : undefined} tone="neutral" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MktgCard title="Applicants by source">
          {mi.recruitingBySource.length === 0 ? (
            <EmptyRow>No recruiting source data yet.</EmptyRow>
          ) : (
            <div className="space-y-3">
              {mi.recruitingBySource.map((s) => (
                <div key={s.source} className="space-y-1.5">
                  <div className="flex items-baseline justify-between text-[13px]">
                    <span className="font-medium text-foreground">{s.source}</span>
                    <span className="text-muted-foreground tabular-nums">{s.count}</span>
                  </div>
                  <ShareBar value={Math.round((s.count / totalCandidates) * 100)} tone="primary" />
                </div>
              ))}
            </div>
          )}
        </MktgCard>

        <MktgCard title="Recruiting by state">
          {byState.length === 0 ? (
            <EmptyRow>No state-level recruiting data yet.</EmptyRow>
          ) : (
            <div className="divide-y divide-border/60">
              {byState.map((s) => (
                <div key={s.state} className="flex items-center justify-between py-2.5 text-[13px]">
                  <span className="font-medium text-foreground">{s.state}</span>
                  <span className="text-muted-foreground tabular-nums">{s.count} candidates</span>
                </div>
              ))}
            </div>
          )}
        </MktgCard>
      </div>

      <MktgCard title="AI suggestions">
        <div className="flex flex-wrap gap-1.5">
          <AIPrompt label="Where is recruiting visibility lowest?" />
          <AIPrompt label="Which source produces the best candidates?" />
        </div>
      </MktgCard>
    </MktgPage>
  );
}