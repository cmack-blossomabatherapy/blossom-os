import { useMemo, useState } from "react";
import { Play, Pause, CheckCircle2, Archive, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyRow } from "@/pages/os/marketing/_shared";
import {
  type CampaignStatus,
  type MarketingCampaignRow,
  useMarketingCampaigns,
} from "@/hooks/useMarketingCampaigns";
import { useMarketingCampaignMetrics } from "@/hooks/useMarketingCampaignMetrics";
import { useMarketingSources } from "@/hooks/useMarketingSources";
import { CampaignFormDialog } from "./CampaignFormDialog";

const STATUS_TONE: Record<string, string> = {
  draft: "bg-muted text-foreground",
  active: "bg-emerald-500/15 text-emerald-700",
  paused: "bg-amber-500/15 text-amber-800",
  completed: "bg-primary/15 text-primary",
  archived: "bg-muted text-muted-foreground",
};

function fmt$(cents: number) {
  if (!cents) return "$0";
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

/**
 * Persisted campaign manager. Reads `marketing_campaigns` + rollups from
 * `marketing_campaign_metrics`. Renders full CRUD workflow controls.
 */
export function CampaignManagerCard() {
  const { campaigns, loading, setStatus, archive } = useMarketingCampaigns();
  const { sources } = useMarketingSources();
  const campaignIds = useMemo(() => campaigns.map((c) => c.id), [campaigns]);
  const { rollups } = useMarketingCampaignMetrics(campaignIds);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MarketingCampaignRow | null>(null);

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (c: MarketingCampaignRow) => { setEditing(c); setFormOpen(true); };

  const sourceName = (id: string | null | undefined) =>
    id ? sources.find((s) => s.id === id)?.name ?? "-" : "-";

  return (
    <>
      <section className="rounded-2xl border border-border/60 bg-card p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Campaigns</div>
            <div className="text-[11.5px] text-muted-foreground">
              {loading ? "Loading..." : `${campaigns.length} total - from marketing_campaigns`}
            </div>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" /> Create Campaign
          </Button>
        </div>
        {!loading && campaigns.length === 0 ? (
          <EmptyRow>
            No campaigns yet.{" "}
            <button className="underline underline-offset-2" onClick={openCreate}>Create the first one</button>.
          </EmptyRow>
        ) : (
          <div className="overflow-auto -mx-2">
            <table className="w-full text-[12.5px]">
              <thead className="text-muted-foreground">
                <tr className="text-left">
                  <th className="px-2 py-2 font-medium">Campaign</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium">Channel</th>
                  <th className="px-2 py-2 font-medium">Source</th>
                  <th className="px-2 py-2 font-medium">Dates</th>
                  <th className="px-2 py-2 font-medium text-right">Budget</th>
                  <th className="px-2 py-2 font-medium text-right">Spend</th>
                  <th className="px-2 py-2 font-medium text-right">Leads</th>
                  <th className="px-2 py-2 font-medium text-right">CPL</th>
                  <th className="px-2 py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => {
                  const r = rollups.get(c.id);
                  const utm = [c.utm_source, c.utm_medium, c.utm_campaign].filter(Boolean).join(" - ");
                  return (
                    <tr key={c.id} className="border-t border-border/40 align-top">
                      <td className="px-2 py-2">
                        <div className="font-medium text-foreground">{c.name}</div>
                        {utm && <div className="text-[11px] text-muted-foreground truncate max-w-[240px]">{utm}</div>}
                      </td>
                      <td className="px-2 py-2">
                        <Badge className={STATUS_TONE[c.status] ?? "bg-muted"}>{c.status}</Badge>
                      </td>
                      <td className="px-2 py-2 text-muted-foreground">{c.channel ?? "-"}</td>
                      <td className="px-2 py-2 text-muted-foreground">{sourceName(c.source_id)}</td>
                      <td className="px-2 py-2 text-muted-foreground whitespace-nowrap">
                        {c.start_date ?? "-"} -&gt; {c.end_date ?? "-"}
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums">{c.budget_cents ? fmt$(c.budget_cents) : "-"}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{r ? fmt$(r.spend_cents) : "-"}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{r?.leads ?? 0}</td>
                      <td className="px-2 py-2 text-right tabular-nums">
                        {r?.costPerLeadCents != null ? fmt$(r.costPerLeadCents) : "-"}
                      </td>
                      <td className="px-2 py-2 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {c.status !== "active" && c.status !== "archived" && (
                            <Button variant="ghost" size="icon" title="Activate" onClick={() => setStatus(c.id, "active")}>
                              <Play className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {c.status === "active" && (
                            <Button variant="ghost" size="icon" title="Pause" onClick={() => setStatus(c.id, "paused")}>
                              <Pause className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {c.status !== "completed" && c.status !== "archived" && (
                            <Button variant="ghost" size="icon" title="Complete" onClick={() => setStatus(c.id, "completed" as CampaignStatus)}>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" title="Edit" onClick={() => openEdit(c)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {c.status !== "archived" && (
                            <Button variant="ghost" size="icon" title="Archive" onClick={() => archive(c.id)}>
                              <Archive className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <CampaignFormDialog open={formOpen} onOpenChange={setFormOpen} editing={editing} />
    </>
  );
}