import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle, Bell, CheckCircle2, EyeOff, History, Loader2, RotateCcw, Send, Filter,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

type EventType = "generated" | "pushed" | "acknowledged" | "resolved" | "dismissed" | "reopened";

interface AuditRow {
  id: string;
  alert_id: string;
  event: EventType;
  actor_user_id: string | null;
  actor_name: string | null;
  actor_email: string | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  alert?: { title: string | null; category: string | null; deep_link: string | null } | null;
}

const EVENT_META: Record<EventType, { label: string; Icon: typeof Bell; tone: string }> = {
  generated:    { label: "Generated",    Icon: AlertCircle,   tone: "text-amber-600" },
  pushed:       { label: "Pushed",       Icon: Send,          tone: "text-primary" },
  acknowledged: { label: "Acknowledged", Icon: CheckCircle2,  tone: "text-emerald-600" },
  resolved:     { label: "Resolved",     Icon: CheckCircle2,  tone: "text-emerald-700" },
  dismissed:    { label: "Dismissed",    Icon: EyeOff,        tone: "text-muted-foreground" },
  reopened:     { label: "Reopened",     Icon: RotateCcw,     tone: "text-amber-700" },
};

export function AlertAuditLogPanel() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventFilter, setEventFilter] = useState<EventType | "all">("all");

  async function load() {
    setLoading(true);
    let query = supabase
      .from("critical_alert_audit")
      .select("id, alert_id, event, actor_user_id, actor_name, actor_email, notes, metadata, created_at, alert:critical_alerts(title, category, deep_link)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (eventFilter !== "all") query = query.eq("event", eventFilter);
    const { data, error } = await query;
    if (!error) setRows((data ?? []) as unknown as AuditRow[]);
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [eventFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length };
    rows.forEach((r) => { c[r.event] = (c[r.event] ?? 0) + 1; });
    return c;
  }, [rows]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2"><History className="h-4 w-4" /> Critical alert audit log</CardTitle>
          <CardDescription>
            Append-only record of when alerts were generated, pushed, acknowledged, dismissed, or resolved.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={eventFilter} onValueChange={(v) => setEventFilter(v as EventType | "all")}>
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All events ({counts.all ?? 0})</SelectItem>
              {(Object.keys(EVENT_META) as EventType[]).map((e) => (
                <SelectItem key={e} value={e}>{EVENT_META[e].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Refresh"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && rows.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center">No audit events yet.</div>
        ) : (
          <ScrollArea className="h-[480px] pr-2">
            <ul className="divide-y divide-border">
              {rows.map((row) => {
                const meta = EVENT_META[row.event];
                const Icon = meta.Icon;
                const actor = row.actor_name || row.actor_email || (row.actor_user_id ? "Unknown user" : "System");
                return (
                  <li key={row.id} className="py-3 flex items-start gap-3">
                    <div className={`mt-0.5 ${meta.tone}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wide">{meta.label}</Badge>
                        {row.alert?.category && (
                          <Badge variant="secondary" className="text-[10px] capitalize">{row.alert.category}</Badge>
                        )}
                        <span className="text-sm font-medium text-foreground truncate">
                          {row.alert?.title ?? "(deleted alert)"}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {actor} · {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
                        {row.notes ? ` · ${row.notes}` : ""}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}