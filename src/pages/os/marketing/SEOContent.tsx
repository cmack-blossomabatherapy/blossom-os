import { MktgPage, MktgCard, MetricTile, AIPrompt, EmptyRow } from "./_shared";
import { useMarketingIntelligence } from "@/hooks/useMarketingIntelligence";

/**
 * SEO & Content surfaces organic-source signals (Organic, Website) by state.
 * Real connected SEO data (Search Console etc.) will replace these derived
 * signals when wired into Admin → Data Uploads.
 */
export default function SEOContent() {
  const mi = useMarketingIntelligence();

  const organic = mi.bySource.find((s) => s.source === "Organic");
  const website = mi.bySource.find((s) => s.source === "Website");
  const organicTotal = (organic?.count ?? 0) + (website?.count ?? 0);

  const organicByState = mi.byState
    .map((s) => ({
      state: s.state,
      organicLeads: 0, // placeholder until SEO source pivot is available
      total: s.leads,
    }))
    .filter((s) => s.total > 0)
    .slice(0, 6);

  return (
    <MktgPage
      title="SEO & Content"
      subtitle="Organic visibility — what families and providers find when they search for Blossom."
      actions={<AIPrompt label="Where should we focus content next?" variant="card" />}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricTile label="Organic leads" value={organicTotal} hint="Organic + direct website" tone={organicTotal > 0 ? "healthy" : "neutral"} />
        <MetricTile label="Organic share" value={`${Math.round(((organicTotal) / (mi.totals.leads || 1)) * 100)}%`} tone="neutral" />
        <MetricTile label="Qualified rate · organic" value={`${organic?.qualifiedRate ?? 0}%`} tone={(organic?.qualifiedRate ?? 0) >= 40 ? "healthy" : "neutral"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <MktgCard title="State pages · visibility" hint="Where organic interest is showing up" className="lg:col-span-2">
          {organicByState.length === 0 ? (
            <EmptyRow>No state-level organic signal yet.</EmptyRow>
          ) : (
            <div className="divide-y divide-border/60">
              {organicByState.map((s) => (
                <div key={s.state} className="flex items-center justify-between py-2.5 text-[13px]">
                  <span className="font-medium text-foreground">{s.state}</span>
                  <span className="text-muted-foreground tabular-nums">{s.total} total leads</span>
                </div>
              ))}
            </div>
          )}
          <p className="mt-4 text-[12px] text-muted-foreground">
            Search Console + Analytics integrations (Admin → Data Uploads) will surface keyword, impression, and ranking signal here when connected.
          </p>
        </MktgCard>

        <MktgCard title="Content ideas">
          <div className="space-y-2">
            <AIPrompt label="Generate state-page topic ideas" variant="subtle" />
            <AIPrompt label="What questions should our blog answer?" variant="subtle" />
            <AIPrompt label="Suggest AEO-ready content" variant="subtle" />
          </div>
        </MktgCard>
      </div>
    </MktgPage>
  );
}