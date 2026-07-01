import { Badge } from "@/components/ui/badge";
import { useMarketingIntegrationHealth, type MarketingIntegrationStatus } from "@/hooks/useMarketingIntegrationHealth";

const STATE_STYLES: Record<MarketingIntegrationStatus, { label: string; tone: string }> = {
  receiving: { label: "Receiving events", tone: "bg-emerald-500/15 text-emerald-700" },
  configured_no_events: { label: "Configured - no recent events", tone: "bg-primary/15 text-primary" },
  needs_setup: { label: "Needs setup", tone: "bg-amber-500/15 text-amber-800" },
  error: { label: "Attention needed", tone: "bg-red-500/15 text-red-700" },
};

function fmt(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString();
}

/** Integration readiness / connector status panel, reusable across pages. */
export function IntegrationReadinessPanel() {
  const { rows, loading } = useMarketingIntegrationHealth();

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Integration readiness</div>
          <div className="text-[11.5px] text-muted-foreground">
            Connector status across Marketing source systems.
          </div>
        </div>
        {loading && <span className="text-[11px] text-muted-foreground">Loading...</span>}
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => {
          const state = STATE_STYLES[r.status];
          return (
            <div key={r.id} className="rounded-xl border border-border/50 bg-background p-3">
              <div className="flex items-center justify-between">
                <div className="font-medium text-[13px]">{r.displayName}</div>
                <Badge className={state.tone}>{state.label}</Badge>
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground space-y-0.5">
                <div>Slug: <code>{r.id}</code></div>
                <div className="truncate">Tables: {r.targetTables.join(", ")}</div>
                <div>Events 7d: {r.events7d} - 24h: {r.events24h} - open: {r.openEvents}</div>
                <div>Last event: {fmt(r.lastEventAt)}</div>
                <div>Last sync: {fmt(r.lastSyncAt)}{r.connectionStatus ? ` - ${r.connectionStatus}` : ""}</div>
                {r.lastError && <div className="text-red-600 truncate" title={r.lastError}>Error: {r.lastError}</div>}
              </div>
              <div className="mt-2 text-[11px]">
                <span className="text-muted-foreground">Next step: </span>
                <span>{r.nextAction}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
