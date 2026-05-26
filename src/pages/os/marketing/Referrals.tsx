import { MktgPage, MktgCard, MetricTile, AIPrompt, EmptyRow, HealthPill } from "./_shared";
import { useMarketingIntelligence } from "@/hooks/useMarketingIntelligence";

export default function Referrals() {
  const mi = useMarketingIntelligence();
  const referral = mi.bySource.find((s) => s.source === "Referral");

  return (
    <MktgPage
      title="Referrals"
      subtitle="Referral relationships — physicians, schools, community partners, and the leads they generate."
      actions={<AIPrompt label="Which states need more referral partners?" variant="card" />}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricTile label="Referral leads" value={mi.referrals.total} tone={mi.referrals.total > 0 ? "healthy" : "neutral"} />
        <MetricTile label="Referral share" value={`${referral?.share ?? 0}%`} tone="neutral" />
        <MetricTile label="Qualified rate" value={`${referral?.qualifiedRate ?? 0}%`} tone={(referral?.qualifiedRate ?? 0) >= 40 ? "healthy" : "attention"} />
      </div>

      <MktgCard title="Referral activity by state">
        {mi.referrals.byState.length === 0 ? (
          <EmptyRow>No referral activity yet.</EmptyRow>
        ) : (
          <div className="divide-y divide-border/60">
            {mi.referrals.byState.map((s) => (
              <div key={s.state} className="flex items-center justify-between py-2.5 text-[13px]">
                <div>
                  <div className="font-medium text-foreground">{s.state}</div>
                  <div className="text-[11.5px] text-muted-foreground">{s.count} referral leads</div>
                </div>
                <HealthPill tone={s.count >= 2 ? "healthy" : "attention"}>
                  {s.count >= 2 ? "Active" : "Light"}
                </HealthPill>
              </div>
            ))}
          </div>
        )}
      </MktgCard>

      <MktgCard title="AI suggestions">
        <div className="flex flex-wrap gap-1.5">
          <AIPrompt label="Which referral partners should we re-engage?" />
          <AIPrompt label="Draft an outreach email to local pediatricians" />
          <AIPrompt label="Where should we open new referral conversations?" />
        </div>
      </MktgCard>
    </MktgPage>
  );
}