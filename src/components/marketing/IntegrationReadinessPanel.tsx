import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { useMarketingSources } from "@/hooks/useMarketingSources";
import { useMarketingSourceEvents } from "@/hooks/useMarketingSourceEvents";
import { expandSourceSlugAliases } from "@/lib/marketing/sourceEventMapper";

interface Integration {
  slug: string;
  label: string;
  table: string;
  nextStep: string;
}

const INTEGRATIONS: Integration[] = [
  { slug: "ctm",          label: "CallTrackingMetrics", table: "marketing_call_events / marketing_source_events", nextStep: "Configure CTM webhook to POST call events." },
  { slug: "jivetel",      label: "Jive / Jivetel",       table: "marketing_call_events", nextStep: "Enable CDR export to marketing_call_events." },
  { slug: "retellai",     label: "RetellAI",             table: "marketing_call_events / marketing_source_events", nextStep: "Point Retell webhook at ingest endpoint." },
  { slug: "leadtrap",     label: "LeadTrap",             table: "marketing_source_events", nextStep: "Add LeadTrap webhook to source-event ingester." },
  { slug: "google_ads",   label: "Google Ads",           table: "marketing_source_events / marketing_campaign_metrics", nextStep: "Import Google Ads campaign metrics daily." },
  { slug: "meta_ads",     label: "Meta / Facebook Ads",  table: "marketing_source_events / marketing_campaign_metrics", nextStep: "Import Meta ad campaign metrics daily." },
  { slug: "mailchimp",    label: "Mailchimp",            table: "marketing_email_events", nextStep: "Enable Mailchimp webhook or bulk import." },
  { slug: "ms365",        label: "Outlook / Microsoft 365", table: "marketing_email_events", nextStep: "Authorize Outlook mailbox for outbound email attribution." },
  { slug: "centralreach", label: "CentralReach",         table: "marketing_source_events", nextStep: "Reconcile CentralReach client identifiers." },
  { slug: "website",      label: "Website / manual",     table: "marketing_source_events", nextStep: "Log or bulk-import inbound web submissions." },
  { slug: "nava",         label: "Go Integrate Nava",    table: "marketing_source_events / marketing_call_events", nextStep: "Enable Go Integrate Nava webhook or scheduled export." },
];

/** Integration readiness / connector status panel, reusable across pages. */
export function IntegrationReadinessPanel() {
  const { sources } = useMarketingSources();
  const { events } = useMarketingSourceEvents({ limit: 500 });

  const eventsBySystem = useMemo(() => {
    const m = new Map<string, { total: number; open: number; last: string | null }>();
    for (const e of events) {
      const key = (e.source ?? "").toLowerCase();
      const cur = m.get(key) ?? { total: 0, open: 0, last: null };
      cur.total++;
      if (e.status === "new" || e.status === "needs_review" || e.status === "possible_duplicate") cur.open++;
      if (!cur.last || e.receivedAt > cur.last) cur.last = e.receivedAt;
      m.set(key, cur);
    }
    return m;
  }, [events]);

  const activeSources = useMemo(() => {
    const s = new Set<string>();
    for (const src of sources) {
      if (src.is_active && src.source_system) {
        for (const a of expandSourceSlugAliases([src.source_system])) s.add(a);
      }
    }
    return s;
  }, [sources]);

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="mb-3">
        <div className="text-sm font-semibold">Integration readiness</div>
        <div className="text-[11.5px] text-muted-foreground">
          Connector status across Marketing source systems.
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {INTEGRATIONS.map((i) => {
          const aliases = expandSourceSlugAliases([i.slug]);
          const roll = aliases.reduce<{ total: number; open: number; last: string | null }>(
            (acc, a) => {
              const v = eventsBySystem.get(a);
              if (!v) return acc;
              acc.total += v.total;
              acc.open += v.open;
              if (v.last && (!acc.last || v.last > acc.last)) acc.last = v.last;
              return acc;
            },
            { total: 0, open: 0, last: null },
          );
          const hasSource = aliases.some((a) => activeSources.has(a));
          const state: { label: string; tone: string } =
            roll.total > 0
              ? { label: "Receiving events", tone: "bg-emerald-500/15 text-emerald-700" }
              : hasSource
                ? { label: "Ready for connector", tone: "bg-primary/15 text-primary" }
                : { label: "Needs setup", tone: "bg-amber-500/15 text-amber-800" };
          return (
            <div key={i.slug} className="rounded-xl border border-border/50 bg-background p-3">
              <div className="flex items-center justify-between">
                <div className="font-medium text-[13px]">{i.label}</div>
                <Badge className={state.tone}>{state.label}</Badge>
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                <div>Slug: <code>{i.slug}</code></div>
                <div className="truncate">Tables: {i.table}</div>
                <div>Events: {roll.total} - open {roll.open}</div>
                <div>Last event: {roll.last ? new Date(roll.last).toLocaleDateString() : "-"}</div>
              </div>
              <div className="mt-2 text-[11px]">
                <span className="text-muted-foreground">Next step: </span>
                <span>{i.nextStep}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}