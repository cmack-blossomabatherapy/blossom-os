import { MktgPage, MktgCard, MetricTile, AIPrompt, EmptyRow } from "./_shared";
import { useMarketingIntelligence } from "@/hooks/useMarketingIntelligence";

/**
 * Reputation surfaces the operational signal Blossom OS currently has —
 * referral momentum + qualified rate as a proxy for sentiment. Real review
 * data (Google, Yelp, etc.) will flow in through Admin → Data Uploads.
 */
export default function Reputation() {
  const mi = useMarketingIntelligence();

  return (
    <MktgPage
      title="Reputation"
      subtitle="How families and partners experience Blossom — review momentum and sentiment signal."
      actions={<AIPrompt label="Where should we focus on review growth?" variant="card" />}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricTile label="Qualified rate · 30d" value={`${mi.velocity.qualifiedRate}%`} hint="Proxy for family experience" tone={mi.velocity.qualifiedRate >= 40 ? "healthy" : "attention"} />
        <MetricTile label="Referral signal" value={mi.referrals.total} hint="Word-of-mouth indicator" tone={mi.referrals.total > 0 ? "healthy" : "neutral"} />
        <MetricTile label="Active states" value={mi.byState.length} tone="neutral" />
      </div>

      <MktgCard title="Reputation by state" hint="Where families are referring others">
        {mi.referrals.byState.length === 0 ? (
          <EmptyRow>No reputation signal yet.</EmptyRow>
        ) : (
          <div className="divide-y divide-border/60">
            {mi.referrals.byState.map((s) => (
              <div key={s.state} className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="font-medium text-foreground">{s.state}</span>
                <span className="text-muted-foreground tabular-nums">{s.count} referral mentions</span>
              </div>
            ))}
          </div>
        )}
      </MktgCard>

      <MktgCard title="Review operations">
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Google, Yelp, and survey integrations (Admin → Data Uploads) will surface review counts, sentiment, and response status here when connected.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <AIPrompt label="Draft a review response template" />
          <AIPrompt label="Which families should we ask for reviews?" />
          <AIPrompt label="Summarize sentiment trends" />
        </div>
      </MktgCard>
    </MktgPage>
  );
}