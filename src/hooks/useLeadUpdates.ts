import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LeadUpdate {
  id: string;
  author: string | null;
  posted_at: string | null;
  body: string | null;
  source?: "monday" | "intake_comm" | "journey_event";
  kind?: string | null;
  subject?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Fetch a merged activity timeline for a lead:
 *  - Monday updates (by lead name)
 *  - intake_communications (by lead id) — includes Reputation audit notes
 *  - journey_events (by metadata.lead_id) — includes reputation.marked_contacted
 *    and reputation.undo_marked_contacted automation events.
 */
export function useLeadUpdates(
  leadName: string | null | undefined,
  leadId?: string | null,
) {
  const [updates, setUpdates] = useState<LeadUpdate[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!leadName && !leadId) {
      setUpdates([]);
      return;
    }
    setLoading(true);
    (async () => {
      const mondayP = leadName
        ? supabase
            .from("monday_updates_raw")
            .select("id, author, posted_at, body")
            .eq("parent_board", "leads")
            .eq("parent_item_name", leadName)
            .order("posted_at", { ascending: false })
            .limit(200)
        : Promise.resolve({ data: [] as any[] });

      const commsP = leadId
        ? supabase
            .from("intake_communications")
            .select("id, communication_type, direction, subject, preview, logged_by_name, created_at")
            .eq("lead_id", leadId)
            .order("created_at", { ascending: false })
            .limit(200)
        : Promise.resolve({ data: [] as any[] });

      const journeyP = leadId
        ? supabase
            .from("journey_events")
            .select("id, event_type, path, metadata, created_at")
            .like("event_type", "reputation.%")
            .contains("metadata", { lead_id: leadId } as never)
            .order("created_at", { ascending: false })
            .limit(100)
        : Promise.resolve({ data: [] as any[] });

      const [monday, comms, journey] = await Promise.all([mondayP, commsP, journeyP]);
      if (cancelled) return;

      const rows: LeadUpdate[] = [];
      for (const m of (monday.data ?? []) as any[]) {
        rows.push({
          id: `m-${m.id}`,
          author: m.author,
          posted_at: m.posted_at,
          body: m.body,
          source: "monday",
          kind: "monday_update",
        });
      }
      for (const c of (comms.data ?? []) as any[]) {
        const body = [c.subject, c.preview].filter(Boolean).join(" — ");
        rows.push({
          id: `c-${c.id}`,
          author: c.logged_by_name ?? "System",
          posted_at: c.created_at,
          body: body || c.preview || c.subject || "",
          source: "intake_comm",
          kind: c.communication_type,
          subject: c.subject,
        });
      }
      for (const j of (journey.data ?? []) as any[]) {
        const meta = (j.metadata ?? {}) as Record<string, unknown>;
        const prev = meta.previous_last_contacted_at as string | null | undefined;
        const next = meta.next_last_contacted_at as string | null | undefined;
        const fmt = (v?: string | null) => (v ? new Date(v).toLocaleString() : "never");
        const label =
          j.event_type === "reputation.marked_contacted"
            ? `Reputation: last contacted set to ${fmt(next)} (was ${fmt(prev)})`
            : j.event_type === "reputation.undo_marked_contacted"
              ? `Reputation: last contacted reverted to ${fmt(next)} (was ${fmt(prev)})`
              : j.event_type;
        rows.push({
          id: `j-${j.id}`,
          author: "Automation",
          posted_at: j.created_at,
          body: label,
          source: "journey_event",
          kind: j.event_type,
          metadata: meta,
        });
      }

      rows.sort((a, b) => {
        const at = a.posted_at ? new Date(a.posted_at).getTime() : 0;
        const bt = b.posted_at ? new Date(b.posted_at).getTime() : 0;
        return bt - at;
      });

      setUpdates(rows);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [leadName, leadId]);

  return { updates, loading };
}