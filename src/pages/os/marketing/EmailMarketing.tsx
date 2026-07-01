import { useEffect, useMemo, useState } from "react";
import { Plug, Upload } from "lucide-react";
import { MktgPage, MktgCard, EmptyRow } from "./_shared";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { EmailEventLogDialog } from "@/components/marketing/EmailEventLogDialog";
import { BulkEmailEventImportDialog } from "@/components/marketing/BulkEmailEventImportDialog";
import { CampaignManagerCard } from "@/components/marketing/CampaignManagerCard";

type EmailEvent = {
  id: string;
  campaign_id: string | null;
  lead_id: string | null;
  event_type: string | null;
  occurred_at: string;
  recipient_email: string | null;
};

type Campaign = {
  id: string;
  name: string;
  status: string | null;
  channel: string | null;
};

/**
 * Email Marketing — reads live rows from marketing_email_events +
 * marketing_campaigns. When Mailchimp is not yet connected the tables are
 * simply empty; the page renders an honest empty state and lets marketing
 * hand-log an event via the shared source-event dialog.
 */
export default function EmailMarketing() {
  const [events, setEvents] = useState<EmailEvent[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [manualOpen, setManualOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [eRes, cRes] = await Promise.all([
        supabase
          .from("marketing_email_events")
          .select("id, campaign_id, lead_id, event_type, occurred_at, recipient_email")
          .order("occurred_at", { ascending: false })
          .limit(100),
        supabase
          .from("marketing_campaigns")
          .select("id, name, status, channel")
          .limit(200),
      ]);
      if (cancelled) return;
      setEvents((eRes.data ?? []) as EmailEvent[]);
      const allCampaigns = (cRes.data ?? []) as Campaign[];
      const emailish = allCampaigns.filter((c) => {
        const ch = (c.channel ?? "").toLowerCase();
        return ch.includes("email") || ch.includes("mailchimp");
      });
      setCampaigns(emailish);
    })();
    return () => { cancelled = true; };
  }, [reloadTick]);

  const buckets = useMemo(() => {
    const b = { sent: 0, open: 0, click: 0, bounce: 0, unsubscribe: 0 };
    events.forEach((e) => {
      const t = (e.event_type ?? "").toLowerCase();
      if (t.includes("sent")) b.sent += 1;
      else if (t.includes("open")) b.open += 1;
      else if (t.includes("click")) b.click += 1;
      else if (t.includes("bounce")) b.bounce += 1;
      else if (t.includes("unsub")) b.unsubscribe += 1;
    });
    return b;
  }, [events]);

  const rate = (n: number) => (buckets.sent > 0 ? Math.round((n / buckets.sent) * 100) : 0);

  const influencedLeads = useMemo(
    () => new Set(events.map((e) => e.lead_id).filter(Boolean)).size,
    [events],
  );

  return (
    <MktgPage
      title="Email Marketing"
      subtitle="Mailchimp-ready email pipeline. Writes to marketing_email_events; campaigns from marketing_campaigns."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setManualOpen(true)}>
            <Plug className="mr-1.5 h-4 w-4" /> Log Email Event
          </Button>
          <Button size="sm" variant="outline" onClick={() => setBulkOpen(true)}>
            <Upload className="mr-1.5 h-4 w-4" /> Bulk Import Events
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <MktgCard title="Integration">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Mailchimp</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
              {events.length ? "Live events" : "Not connected"}
            </span>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {events.length
              ? `${events.length} live email events captured across ${campaigns.length} email campaigns.`
              : "Connect Mailchimp — or use Log Email Event to hand-record activity while the connector is set up."}
          </p>
        </MktgCard>
        <MktgCard title="Email Campaigns">
          <div className="text-2xl font-semibold tracking-tight">{campaigns.length || "—"}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            {campaigns.length ? "Live campaigns in marketing_campaigns" : "No email campaigns yet."}
          </p>
        </MktgCard>
        <MktgCard title="Influenced Leads">
          <div className="text-2xl font-semibold tracking-tight">{influencedLeads || "—"}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Unique leads touched by any email event.
          </p>
        </MktgCard>
      </div>

      <MktgCard title="Deliverability">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {([
            ["Sent", buckets.sent, null],
            ["Opens", buckets.open, rate(buckets.open)],
            ["Clicks", buckets.click, rate(buckets.click)],
            ["Bounces", buckets.bounce, rate(buckets.bounce)],
            ["Unsubs", buckets.unsubscribe, rate(buckets.unsubscribe)],
          ] as const).map(([label, val, pct]) => (
            <div key={label} className="rounded-lg border border-border/60 bg-card/50 p-3">
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className="text-xl font-semibold">{val || "-"}</div>
              {pct !== null && val > 0 && (
                <div className="text-[11px] text-muted-foreground">{pct}% of sent</div>
              )}
            </div>
          ))}
        </div>
      </MktgCard>

      <CampaignManagerCard />

      <MktgCard title="Recent Email Events">
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Event</th>
                <th className="px-3 py-2">Recipient</th>
                <th className="px-3 py-2">Campaign</th>
                <th className="px-3 py-2">Lead</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6">
                    <EmptyRow>
                      No email events yet. Connect Mailchimp or use Log Email Event above.
                    </EmptyRow>
                  </td>
                </tr>
              ) : (
                events.map((e) => {
                  const camp = campaigns.find((c) => c.id === e.campaign_id);
                  return (
                    <tr key={e.id} className="border-t border-border/40">
                      <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                        {new Date(e.occurred_at).toLocaleString("en-US", { timeZone: "America/New_York" })}
                      </td>
                      <td className="px-3 py-2">{e.event_type ?? "—"}</td>
                      <td className="px-3 py-2">{e.recipient_email ?? "—"}</td>
                      <td className="px-3 py-2">{camp?.name ?? "—"}</td>
                      <td className="px-3 py-2">
                        {e.lead_id ? (
                          <a className="text-primary hover:underline" href={`/leads/${e.lead_id}`}>Open</a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </MktgCard>

      <EmailEventLogDialog
        open={manualOpen}
        onOpenChange={setManualOpen}
        onLogged={() => setReloadTick((n) => n + 1)}
      />
      <BulkEmailEventImportDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        defaultSourceSystem="mailchimp"
        onImported={() => setReloadTick((n) => n + 1)}
      />
    </MktgPage>
  );
}