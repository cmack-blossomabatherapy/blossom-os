import { useEffect, useState } from "react";
import { Activity, Phone, Mail, MessageSquare, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ActivityRow {
  id: string;
  lead_id: string;
  communication_type: "call" | "sms" | "email" | "note";
  direction: string;
  preview: string;
  logged_by_name: string | null;
  created_at: string;
  intake_leads?: { child_name: string | null } | null;
}

const ICONS = {
  call: Phone,
  sms: MessageSquare,
  email: Mail,
  note: FileText,
} as const;

/**
 * Phase F — live feed of recent lead activity from `intake_communications`.
 * Includes lead-create, stage-change, owner-change, tag, and call/email/sms logs.
 */
export function LiveActivityFeed({ limit = 8 }: { limit?: number }) {
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("intake_communications")
        .select("id, lead_id, communication_type, direction, preview, logged_by_name, created_at, intake_leads(child_name)")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (!cancelled) {
        setRows((data as unknown as ActivityRow[]) ?? []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [limit]);

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4">
      <div className="flex items-center gap-2">
        <Activity className="h-3.5 w-3.5 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Live activity</h3>
      </div>
      <p className="text-[11px] text-muted-foreground mt-0.5">
        Lead creates, stage moves, owner changes, calls, and notes — across every lead in Blossom OS.
      </p>
      <ul className="mt-3 space-y-2">
        {loading && <li className="text-[11.5px] text-muted-foreground">Loading…</li>}
        {!loading && rows.length === 0 && (
          <li className="text-[11.5px] text-muted-foreground">No activity yet — add a lead to start the feed.</li>
        )}
        {rows.map((r) => {
          const Icon = ICONS[r.communication_type] ?? FileText;
          const lead = r.intake_leads?.child_name ?? "Lead";
          return (
            <li key={r.id} className="flex items-start gap-2 rounded-lg border border-border/40 bg-secondary/30 p-2">
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-card text-muted-foreground">
                <Icon className="h-3 w-3" />
              </span>
              <div className="min-w-0">
                <div className="text-[12px] font-medium text-foreground truncate">{lead}</div>
                <div className="text-[11px] text-muted-foreground truncate">{r.preview}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {new Date(r.created_at).toLocaleString()} · {r.logged_by_name || "System"}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}