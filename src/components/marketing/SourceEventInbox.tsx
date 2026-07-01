import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { expandSourceSlugAliases } from "@/lib/marketing/sourceEventMapper";

interface SourceEventInboxProps {
  /** Source system slugs to include (e.g. ["leadtrap"], ["facebook_ads","meta_ads"]). */
  sourceSystems: string[];
  limit?: number;
}

type EventRow = {
  id: string;
  occurred_at: string;
  event_type: string | null;
  source_system: string;
  status: string;
  state: string | null;
  caller_name: string | null;
  caller_email: string | null;
  caller_phone: string | null;
  payload_summary: string | null;
  lead_id: string | null;
};

/**
 * Shared read-only inbox for a specific set of marketing source systems.
 * Backed 100% by marketing_source_events. Empty when the connector hasn't
 * captured anything yet - no fabricated rows.
 */
export function SourceEventInbox({ sourceSystems, limit = 25 }: SourceEventInboxProps) {
  const [rows, setRows] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const expanded = expandSourceSlugAliases(sourceSystems);
      const { data } = await supabase
        .from("marketing_source_events")
        .select("id, occurred_at, event_type, source_system, status, state, caller_name, caller_email, caller_phone, payload_summary, lead_id")
        .in("source_system", expanded)
        .order("occurred_at", { ascending: false })
        .limit(limit);
      if (!cancelled) {
        setRows((data ?? []) as EventRow[]);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceSystems.join("|"), limit]);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/40 p-8 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading events...
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/40 p-8 text-center text-sm text-muted-foreground">
        <Inbox className="mb-2 h-5 w-5" />
        No events captured yet for this source. Use <span className="mx-1 font-medium text-foreground">Log Event</span> above to create one manually while the connector is being wired.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/70">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-3 py-2">When</th>
            <th className="px-3 py-2">Event</th>
            <th className="px-3 py-2">Contact</th>
            <th className="px-3 py-2">State</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Lead</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-border/40">
              <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                {new Date(r.occurred_at).toLocaleString("en-US", { timeZone: "America/New_York" })}
              </td>
              <td className="px-3 py-2">
                <div className="font-medium">{r.event_type ?? "event"}</div>
                {r.payload_summary && (
                  <div className="line-clamp-1 text-xs text-muted-foreground">{r.payload_summary}</div>
                )}
              </td>
              <td className="px-3 py-2">
                <div>{r.caller_name ?? "-"}</div>
                <div className="text-xs text-muted-foreground">
                  {r.caller_phone ?? r.caller_email ?? ""}
                </div>
              </td>
              <td className="px-3 py-2">{r.state ?? "-"}</td>
              <td className="px-3 py-2">
                <Badge variant={r.status === "new" ? "default" : "outline"}>{r.status}</Badge>
              </td>
              <td className="px-3 py-2 text-xs">
                {r.lead_id ? (
                  <a className="text-primary hover:underline" href={`/leads/${r.lead_id}`}>Open lead</a>
                ) : (
                  <span className="text-muted-foreground">Unlinked</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}