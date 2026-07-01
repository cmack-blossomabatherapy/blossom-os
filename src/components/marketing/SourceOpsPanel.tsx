import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useMarketingSources } from "@/hooks/useMarketingSources";
import { useMarketingCampaigns } from "@/hooks/useMarketingCampaigns";
import { useMarketingCampaignMetrics } from "@/hooks/useMarketingCampaignMetrics";
import { useMarketingSourceEvents } from "@/hooks/useMarketingSourceEvents";
import { expandSourceSlugAliases, sourceSystemToSourceValue } from "@/lib/marketing/sourceEventMapper";

function fmt$(cents: number) {
  if (!cents) return "$0";
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

/**
 * Operating rollup shown on source-specific pages (LeadTrap / Google Ads /
 * Facebook Ads / etc.). Surfaces:
 *   - open events needing review
 *   - converted/attached events
 *   - linked campaigns + latest metrics
 *   - connector readiness pointer
 *   - next operational action
 */
export function SourceOpsPanel({
  sourceSlugs,
  showMetrics = true,
  nextActionCopy,
}: {
  sourceSlugs: string[];
  showMetrics?: boolean;
  nextActionCopy?: string;
}) {
  const { sources } = useMarketingSources();
  const { campaigns } = useMarketingCampaigns();
  const aliasSet = useMemo(() => {
    const expanded = expandSourceSlugAliases(sourceSlugs);
    return new Set(expanded.map((s) => s.toLowerCase()));
  }, [sourceSlugs]);
  const canonicalSourceValues = useMemo(() => {
    const set = new Set<string>();
    for (const s of sourceSlugs) {
      const v = sourceSystemToSourceValue(s);
      if (v) set.add(v.toLowerCase());
    }
    return set;
  }, [sourceSlugs]);
  const matchesAlias = (slug: string | null | undefined) => {
    if (!slug) return false;
    return aliasSet.has(slug.toLowerCase());
  };
  const linkedSources = useMemo(
    () => sources.filter((s) => matchesAlias(s.source_system)),
    [sources, aliasSet],
  );
  const linkedCampaigns = useMemo(
    () =>
      campaigns.filter(
        (c) =>
          (c.source_id && linkedSources.some((s) => s.id === c.source_id)) ||
          matchesAlias(c.source_system),
      ),
    [campaigns, linkedSources, aliasSet],
  );
  const { rollups } = useMarketingCampaignMetrics(linkedCampaigns.map((c) => c.id));
  const { events } = useMarketingSourceEvents({ limit: 500 });

  const filteredEvents = events.filter((e) => {
    const src = (e.source ?? "").toLowerCase();
    if (!src) return false;
    if (aliasSet.has(src)) return true;
    if (canonicalSourceValues.has(src)) return true;
    // Fall back to alias substring only against normalized alias tokens.
    for (const a of aliasSet) {
      if (src === a) return true;
    }
    return false;
  });
  const open = filteredEvents.filter((e) => e.status === "new" || e.status === "needs_review" || e.status === "possible_duplicate");
  const resolved = filteredEvents.filter((e) => e.status === "converted_to_lead" || e.status === "attached_to_existing_lead");

  return (
    <section className="grid gap-3 lg:grid-cols-3">
      <div className="rounded-2xl border border-border/60 bg-card p-4">
        <div className="text-xs font-semibold mb-2">Events</div>
        <div className="text-[12.5px] space-y-1">
          <div className="flex justify-between"><span className="text-muted-foreground">Open (needs review)</span><span className="tabular-nums">{open.length}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Converted / attached</span><span className="tabular-nums">{resolved.length}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Total (recent)</span><span className="tabular-nums">{filteredEvents.length}</span></div>
        </div>
        <Link to="/marketing/lead-source-inbox" className="mt-3 inline-flex items-center gap-1 text-[12px] text-primary hover:underline">
          Open Lead Source Inbox <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-4">
        <div className="text-xs font-semibold mb-2">Linked campaigns</div>
        {linkedCampaigns.length === 0 ? (
          <div className="text-[12px] text-muted-foreground">
            No campaigns linked yet. Create one under Marketing / Campaigns and set the source.
          </div>
        ) : (
          <ul className="space-y-1.5 text-[12.5px]">
            {linkedCampaigns.slice(0, 5).map((c) => {
              const r = showMetrics ? rollups.get(c.id) : undefined;
              return (
                <li key={c.id} className="flex items-center justify-between gap-2">
                  <span className="truncate">
                    {c.name} <Badge variant="outline" className="ml-1 text-[10px]">{c.status}</Badge>
                  </span>
                  {r && (
                    <span className="text-[11px] text-muted-foreground tabular-nums whitespace-nowrap">
                      {fmt$(r.spend_cents)} / {r.leads} leads
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-4">
        <div className="text-xs font-semibold mb-2">Connector readiness</div>
        <div className="text-[12.5px]">
          {linkedSources.length === 0 ? (
            <div className="text-muted-foreground">
              No source connector configured yet.
            </div>
          ) : (
            <ul className="space-y-1">
              {linkedSources.map((s) => (
                <li key={s.id} className="flex items-center justify-between">
                  <span className="truncate">{s.name}</span>
                  <Badge variant={s.is_active ? "default" : "outline"} className="text-[10px]">
                    {s.is_active ? "active" : "inactive"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
        {nextActionCopy && (
          <div className="mt-3 text-[11.5px] text-muted-foreground">
            <span className="font-medium text-foreground">Next action: </span>{nextActionCopy}
          </div>
        )}
      </div>

      {showMetrics && rollups.size > 0 && (
        <div className="lg:col-span-3 rounded-2xl border border-border/60 bg-card p-4">
          <div className="text-xs font-semibold mb-2">Campaign performance</div>
          <div className="overflow-auto">
            <table className="w-full text-[12px]">
              <thead className="text-muted-foreground">
                <tr className="text-left">
                  <th className="px-2 py-1 font-medium">Campaign</th>
                  <th className="px-2 py-1 font-medium text-right">Impressions</th>
                  <th className="px-2 py-1 font-medium text-right">Clicks</th>
                  <th className="px-2 py-1 font-medium text-right">Spend</th>
                  <th className="px-2 py-1 font-medium text-right">Leads</th>
                  <th className="px-2 py-1 font-medium text-right">CPL</th>
                  <th className="px-2 py-1 font-medium">Last metric</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(rollups.values()).map((r) => {
                  const camp = linkedCampaigns.find((c) => c.id === r.campaign_id);
                  return (
                    <tr key={r.campaign_id} className="border-t border-border/40">
                      <td className="px-2 py-1">{camp?.name ?? r.campaign_id}</td>
                      <td className="px-2 py-1 text-right tabular-nums">{r.impressions.toLocaleString()}</td>
                      <td className="px-2 py-1 text-right tabular-nums">{r.clicks.toLocaleString()}</td>
                      <td className="px-2 py-1 text-right tabular-nums">{fmt$(r.spend_cents)}</td>
                      <td className="px-2 py-1 text-right tabular-nums">{r.leads}</td>
                      <td className="px-2 py-1 text-right tabular-nums">{r.costPerLeadCents != null ? fmt$(r.costPerLeadCents) : "-"}</td>
                      <td className="px-2 py-1 text-muted-foreground">{r.lastMetricDate ?? "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}