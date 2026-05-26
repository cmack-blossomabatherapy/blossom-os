import { MktgPage, MktgCard, MetricTile, AIPrompt, EmptyRow, HealthPill } from "./_shared";
import { useMarketingIntelligence } from "@/hooks/useMarketingIntelligence";

/**
 * Community Outreach surfaces state-by-state community presence — derived
 * from referral activity, candidate footprint, and lead density. Real event
 * and partnership data will flow in through Admin → Data Uploads.
 */
export default function CommunityOutreach() {
  const mi = useMarketingIntelligence();

  const presence = mi.byState.map((s) => {
    const referralCount = mi.referrals.byState.find((r) => r.state === s.state)?.count ?? 0;
    const score = referralCount * 2 + s.candidates;
    return { state: s.state, referrals: referralCount, candidates: s.candidates, score };
  });

  return (
    <MktgPage
      title="Community Outreach"
      subtitle="Local presence — partnerships, referrals, and community footprint across our states."
      actions={<AIPrompt label="Where should we invest in community outreach?" variant="card" />}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricTile label="Active states" value={mi.byState.length} tone="neutral" />
        <MetricTile label="Referral partners signal" value={mi.referrals.total} tone={mi.referrals.total > 0 ? "healthy" : "neutral"} />
        <MetricTile label="Community footprint" value={mi.totals.candidates + mi.referrals.total} tone="neutral" />
      </div>

      <MktgCard title="Community presence by state">
        {presence.length === 0 ? (
          <EmptyRow>No community signal yet.</EmptyRow>
        ) : (
          <div className="divide-y divide-border/60">
            {presence.map((p) => (
              <div key={p.state} className="flex items-center justify-between py-2.5 text-[13px]">
                <div>
                  <div className="font-medium text-foreground">{p.state}</div>
                  <div className="text-[11.5px] text-muted-foreground">
                    {p.referrals} referral signal · {p.candidates} candidate footprint
                  </div>
                </div>
                <HealthPill tone={p.score >= 4 ? "healthy" : p.score >= 2 ? "attention" : "neutral"}>
                  {p.score >= 4 ? "Strong" : p.score >= 2 ? "Building" : "Quiet"}
                </HealthPill>
              </div>
            ))}
          </div>
        )}
      </MktgCard>

      <MktgCard title="AI suggestions">
        <div className="flex flex-wrap gap-1.5">
          <AIPrompt label="Where should we host a community event next?" />
          <AIPrompt label="Which schools should we partner with?" />
          <AIPrompt label="Where is local presence weakest?" />
        </div>
      </MktgCard>
    </MktgPage>
  );
}