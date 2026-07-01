import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMarketingSources } from "@/hooks/useMarketingSources";
import { useMarketingSourceEvents } from "@/hooks/useMarketingSourceEvents";
import { expandSourceSlugAliases } from "@/lib/marketing/sourceEventMapper";
import {
  listIntegrationCatalog,
  listIntegrationConnections,
  listIntegrationSyncRuns,
  listIntegrationWebhookEvents,
  listNormalizedRecords,
  type IntegrationConnectionRow,
  type IntegrationCatalogRow,
  type IntegrationSyncRunRow,
  type IntegrationWebhookEventRow,
  type IntegrationNormalizedRecordRow,
} from "@/lib/os/integrations/backend";

export type MarketingIntegrationStatus =
  | "receiving"
  | "configured_no_events"
  | "needs_setup"
  | "error";

export interface MarketingIntegrationHealth {
  id: string;
  displayName: string;
  aliases: string[];
  targetTables: string[];
  status: MarketingIntegrationStatus;
  configured: boolean;
  connectionStatus: string | null;
  lastSyncAt: string | null;
  lastEventAt: string | null;
  lastWebhookAt: string | null;
  lastNormalizedAt: string | null;
  events24h: number;
  events7d: number;
  openEvents: number;
  nextAction: string;
  lastError: string | null;
}

interface Def {
  id: string;
  displayName: string;
  aliases: string[];
  targetTables: string[];
  nextAction: string;
  callTable?: boolean;
  emailTable?: boolean;
}

const DEFS: Def[] = [
  { id: "ctm", displayName: "CallTrackingMetrics", aliases: ["ctm", "calltrackingmetrics"], targetTables: ["marketing_call_events", "marketing_source_events"], nextAction: "Configure CTM webhook to POST call events.", callTable: true },
  { id: "jivetel", displayName: "Jive / Jivetel", aliases: ["jivetel", "jive", "jivetel_ai"], targetTables: ["marketing_call_events"], nextAction: "Enable CDR export to marketing_call_events.", callTable: true },
  { id: "retellai", displayName: "RetellAI", aliases: ["retell", "retellai", "retell_ai", "retell-ai"], targetTables: ["marketing_call_events", "marketing_source_events"], nextAction: "Point Retell webhook at ingest endpoint.", callTable: true },
  { id: "leadtrap", displayName: "LeadTrap", aliases: ["leadtrap"], targetTables: ["marketing_source_events"], nextAction: "Add LeadTrap webhook to source-event ingester." },
  { id: "google_ads", displayName: "Google Ads", aliases: ["google_ads", "google-ads", "google"], targetTables: ["marketing_source_events", "marketing_campaign_metrics"], nextAction: "Import Google Ads campaign metrics daily." },
  { id: "meta_ads", displayName: "Meta / Facebook Ads", aliases: ["meta_ads", "meta-ads", "facebook_ads", "facebook-ads", "facebook"], targetTables: ["marketing_source_events", "marketing_campaign_metrics"], nextAction: "Import Meta ad campaign metrics daily." },
  { id: "mailchimp", displayName: "Mailchimp", aliases: ["mailchimp", "mailchimp_email"], targetTables: ["marketing_email_events"], nextAction: "Enable Mailchimp webhook or bulk import.", emailTable: true },
  { id: "ms365", displayName: "Outlook / Microsoft 365", aliases: ["ms365", "microsoft_365", "microsoft365", "outlook", "office365", "office_365"], targetTables: ["marketing_email_events"], nextAction: "Authorize Outlook mailbox for outbound email attribution.", emailTable: true },
  { id: "centralreach", displayName: "CentralReach", aliases: ["centralreach", "central_reach"], targetTables: ["marketing_source_events"], nextAction: "Reconcile CentralReach client identifiers." },
  { id: "website", displayName: "Website / manual", aliases: ["website", "web", "manual", "manual_import"], targetTables: ["marketing_source_events"], nextAction: "Log or bulk-import inbound web submissions." },
  { id: "nava", displayName: "Go Integrate Nava", aliases: ["nava", "go_integrate_nava", "go-integrate-nava", "gointegrate_nava", "gointegratenava"], targetTables: ["marketing_source_events", "marketing_call_events"], nextAction: "Enable Go Integrate Nava webhook or scheduled export." },
];

function matchCatalog(def: Def, catalog: IntegrationCatalogRow[]): IntegrationCatalogRow | undefined {
  const aliases = new Set(def.aliases.map((a) => a.toLowerCase()));
  return catalog.find(
    (c) => aliases.has(c.id.toLowerCase()) || aliases.has(c.display_name.toLowerCase().replace(/\s+/g, "_")),
  );
}

export function useMarketingIntegrationHealth() {
  const { sources } = useMarketingSources();
  const { events } = useMarketingSourceEvents({ limit: 500 });
  const [catalog, setCatalog] = useState<IntegrationCatalogRow[]>([]);
  const [connections, setConnections] = useState<IntegrationConnectionRow[]>([]);
  const [syncRuns, setSyncRuns] = useState<IntegrationSyncRunRow[]>([]);
  const [webhookEvents, setWebhookEvents] = useState<IntegrationWebhookEventRow[]>([]);
  const [normalizedRecords, setNormalizedRecords] = useState<IntegrationNormalizedRecordRow[]>([]);
  const [callEvents, setCallEvents] = useState<Array<{ source_system: string | null; occurred_at: string }>>([]);
  const [emailEvents, setEmailEvents] = useState<Array<{ source_system: string | null; occurred_at: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const [cat, conns, runs, hooks, norms, calls, mails] = await Promise.all([
        listIntegrationCatalog().catch(() => []),
        listIntegrationConnections().catch(() => []),
        listIntegrationSyncRuns(undefined, 100).catch(() => []),
        listIntegrationWebhookEvents(undefined, 200).catch(() => [] as IntegrationWebhookEventRow[]),
        listNormalizedRecords(undefined, 200).catch(() => [] as IntegrationNormalizedRecordRow[]),
        (supabase as unknown as { from: (t: string) => { select: (c: string) => { order: (k: string, o: object) => { limit: (n: number) => Promise<{ data: unknown }> } } } })
          .from("marketing_call_events").select("source_system, occurred_at").order("occurred_at", { ascending: false }).limit(500).then((r) => (r.data as Array<{ source_system: string | null; occurred_at: string }>) ?? []).catch(() => []),
        (supabase as unknown as { from: (t: string) => { select: (c: string) => { order: (k: string, o: object) => { limit: (n: number) => Promise<{ data: unknown }> } } } })
          .from("marketing_email_events").select("source_system, occurred_at").order("occurred_at", { ascending: false }).limit(500).then((r) => (r.data as Array<{ source_system: string | null; occurred_at: string }>) ?? []).catch(() => []),
      ]);
      if (!alive) return;
      setCatalog(cat);
      setConnections(conns);
      setSyncRuns(runs);
      setWebhookEvents(hooks);
      setNormalizedRecords(norms);
      setCallEvents(calls);
      setEmailEvents(mails);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const activeMarketingSources = useMemo(() => {
    const s = new Set<string>();
    for (const src of sources) {
      if (src.is_active && src.source_system) {
        for (const a of expandSourceSlugAliases([src.source_system])) s.add(a);
      }
    }
    return s;
  }, [sources]);

  const rows: MarketingIntegrationHealth[] = useMemo(() => {
    const now = Date.now();
    const d24 = now - 24 * 3600 * 1000;
    const d7 = now - 7 * 24 * 3600 * 1000;
    return DEFS.map((def) => {
      const aliases = expandSourceSlugAliases(def.aliases);
      const aliasSet = new Set(aliases);

      // Marketing table event aggregates (source + call + email)
      let last: number | null = null;
      let c24 = 0;
      let c7 = 0;
      let open = 0;
      const tally = (list: Array<{ source_system?: string | null; source?: string | null; occurred_at?: string; receivedAt?: string; status?: string | null }>) => {
        for (const e of list) {
          const src = ((e.source_system ?? e.source) ?? "").toLowerCase();
          if (!aliasSet.has(src)) continue;
          const iso = e.occurred_at ?? e.receivedAt;
          if (!iso) continue;
          const t = Date.parse(iso);
          if (Number.isNaN(t)) continue;
          if (!last || t > last) last = t;
          if (t >= d24) c24++;
          if (t >= d7) c7++;
          const status = e.status ?? null;
          if (status === "new" || status === "needs_review" || status === "possible_duplicate") open++;
        }
      };
      tally(events as unknown as Array<{ source?: string | null; receivedAt?: string; status?: string | null }>);
      if (def.callTable) tally(callEvents);
      if (def.emailTable) tally(emailEvents);

      // Backend integration state
      const cat = matchCatalog(def, catalog);
      const conns = cat ? connections.filter((c) => c.integration_id === cat.id) : [];
      const activeConn = conns.find((c) => c.enabled && c.status !== "error") ?? conns[0];
      const errorConn = conns.find((c) => c.status === "error" || c.last_error);
      const runsFor = cat ? syncRuns.filter((r) => r.integration_id === cat.id) : [];
      const lastRun = runsFor[0];
      const lastSyncAt = lastRun?.completed_at ?? lastRun?.started_at ?? activeConn?.last_success_at ?? null;
      const runError = runsFor.find((r) => r.status === "error" || r.status === "failed");
      const hooksFor = cat ? webhookEvents.filter((h) => h.integration_id === cat.id) : [];
      const lastWebhookAt = hooksFor[0]?.received_at ?? null;
      const hookError = hooksFor.find((h) => h.processing_status === "error" || Boolean(h.error_message));
      const normsFor = cat ? normalizedRecords.filter((n) => n.integration_id === cat.id) : [];
      const lastNormalizedAt = normsFor[0]?.created_at ?? null;

      const marketingActive = def.aliases.some((a) => activeMarketingSources.has(a));
      const configured = Boolean(activeConn?.enabled) || marketingActive;
      const lastEventAt = last ? new Date(last).toISOString() : null;

      let status: MarketingIntegrationStatus;
      if (errorConn || runError || hookError) status = "error";
      else if (c7 > 0) status = "receiving";
      else if (configured) status = "configured_no_events";
      else status = "needs_setup";

      return {
        id: def.id,
        displayName: def.displayName,
        aliases,
        targetTables: def.targetTables,
        status,
        configured,
        connectionStatus: activeConn?.status ?? null,
        lastSyncAt,
        lastEventAt,
        lastWebhookAt,
        lastNormalizedAt,
        events24h: c24,
        events7d: c7,
        openEvents: open,
        nextAction: def.nextAction,
        lastError:
          errorConn?.last_error ??
          runError?.error_message ??
          hookError?.error_message ??
          null,
      };
    });
  }, [events, callEvents, emailEvents, catalog, connections, syncRuns, webhookEvents, normalizedRecords, activeMarketingSources]);

  return { rows, loading };
}

export const MARKETING_INTEGRATION_DEFS = DEFS;