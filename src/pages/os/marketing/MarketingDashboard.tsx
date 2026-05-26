import { MktgPage, MktgCard, MetricTile, AIPrompt, EmptyRow, ShareBar } from "./_shared";
import { useMarketingIntelligence } from "@/hooks/useMarketingIntelligence";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

export default function MarketingDashboard() {
  const mi = useMarketingIntelligence();

  const topSource = mi.bySource[0];
  const topState = mi.byState[0];

  return (
    <MktgPage
      title="Growth Pulse"
      subtitle="Where Blossom is being found, what's converting, and where attention is needed — at a glance."
      actions={<AIPrompt label="Summarize growth this week" prompt="Summarize Blossom's marketing and growth pulse for this week — lead sources, state momentum, call volume, recruiting visibility." variant="card" />}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="Leads · last 30d" value={mi.velocity.leadsLast30} hint={`${mi.velocity.leadsLast7} in the last 7`} tone={mi.velocity.leadsLast30 > 0 ? "healthy" : "neutral"} />
        <MetricTile label="Qualified rate" value={`${mi.velocity.qualifiedRate}%`} hint={`${mi.velocity.qualifiedLast30} qualified · 30d`} tone={mi.velocity.qualifiedRate >= 40 ? "healthy" : mi.velocity.qualifiedRate >= 20 ? "attention" : "risk"} />
        <MetricTile label="Inbound calls · 24h" value={mi.calls.last24h} hint={`${mi.calls.missed} need return`} tone={mi.calls.missed === 0 ? "healthy" : mi.calls.missed <= 2 ? "attention" : "risk"} />
        <MetricTile label="Active states" value={mi.byState.length} hint={topState ? `${topState.state} leading · ${topState.leads}` : "—"} tone="neutral" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <MktgCard title="Where leads come from" hint="Last 30 days · all states" className="lg:col-span-2">
          {mi.bySource.length === 0 ? (
            <EmptyRow>No lead source data yet.</EmptyRow>
          ) : (
            <div className="space-y-3">
              {mi.bySource.map((s) => (
                <div key={s.source} className="space-y-1.5">
                  <div className="flex items-baseline justify-between text-[13px]">
                    <span className="font-medium text-foreground">{s.source}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {s.count} leads · <span className="text-foreground/80">{s.qualifiedRate}% qualified</span>
                    </span>
                  </div>
                  <ShareBar value={s.share} tone="primary" />
                </div>
              ))}
            </div>
          )}
        </MktgCard>

        <MktgCard title="AI insights">
          <div className="space-y-2">
            {topSource && (
              <div className="rounded-xl border border-border/60 bg-muted/40 p-3 text-[12.5px] text-foreground/80">
                <span className="font-medium text-foreground">{topSource.source}</span> is your strongest source — {topSource.share}% of leads, {topSource.qualifiedRate}% qualified.
              </div>
            )}
            {topState && (
              <div className="rounded-xl border border-border/60 bg-muted/40 p-3 text-[12.5px] text-foreground/80">
                <span className="font-medium text-foreground">{topState.state}</span> is the most active state — {topState.leads} leads, {topState.candidates} candidates.
              </div>
            )}
            {mi.calls.missed > 0 && (
              <div className="rounded-xl border border-border/60 bg-muted/40 p-3 text-[12.5px] text-foreground/80">
                {mi.calls.missed} inbound calls awaiting return — a fast follow-up moves growth.
              </div>
            )}
            <div className="pt-1 flex flex-wrap gap-1.5">
              <AIPrompt label="Why is qualified rate moving?" />
              <AIPrompt label="Which source has the best ROI?" />
            </div>
          </div>
        </MktgCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MktgCard title="State momentum" hint="Leads · Calls · Candidates">
          {mi.byState.length === 0 ? (
            <EmptyRow>No state data yet.</EmptyRow>
          ) : (
            <div className="divide-y divide-border/60">
              {mi.byState.slice(0, 6).map((s) => (
                <Link
                  key={s.state}
                  to="/marketing/state-growth"
                  className="flex items-center justify-between py-2.5 text-[13px] transition hover:bg-muted/40 rounded-lg px-1.5 -mx-1.5"
                >
                  <span className="font-medium text-foreground">{s.state}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {s.leads} leads · {s.calls} calls · {s.candidates} candidates
                  </span>
                </Link>
              ))}
            </div>
          )}
        </MktgCard>

        <MktgCard title="Recruiting visibility" hint="Where applicants are coming from">
          {mi.recruitingBySource.length === 0 ? (
            <EmptyRow>No recruiting source data yet.</EmptyRow>
          ) : (
            <div className="space-y-3">
              {mi.recruitingBySource.slice(0, 5).map((s) => (
                <div key={s.source} className="flex items-center justify-between text-[13px]">
                  <span className="text-foreground">{s.source}</span>
                  <span className="text-muted-foreground tabular-nums">{s.count} candidates</span>
                </div>
              ))}
              <Link to="/marketing/recruiting" className="inline-flex items-center gap-1 text-[12.5px] text-primary/80 hover:text-primary pt-1">
                Open recruiting marketing <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </MktgCard>
      </div>
    </MktgPage>
  );
}