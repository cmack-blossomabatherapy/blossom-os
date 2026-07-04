import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Recent durable HR messages, backed by `hr_messages`.
 * Shows subject, body preview, channels, status, route status, timestamps.
 * Never claims a provider "sent" — only surfaces the route_status queue state.
 */

export interface HRMessageHistoryProps {
  employeeId?: string | null;
  caseId?: string | null;
  limit?: number;
  refreshKey?: unknown;
  className?: string;
  title?: string;
}

interface MessageRow {
  id: string;
  employee_id: string | null;
  case_id: string | null;
  subject: string | null;
  body: string;
  channels: string[] | null;
  status: string;
  route_status: Record<string, { status: string; reason?: string }> | null;
  scheduled_for: string | null;
  created_at: string;
  created_by: string | null;
}

function fmt(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function channelLabel(ch: string): string {
  switch (ch) {
    case "in_app": return "In-app";
    case "viventium": return "Viventium";
    case "stellar_checks": return "Stellar Checks";
    case "centralreach": return "CentralReach";
    case "email": return "Email";
    case "sms": return "SMS";
    default: return ch;
  }
}

/**
 * Human-readable label for a single route/channel status. Non-blocked
 * statuses must NOT be labeled "queued".
 */
export function channelRouteStatusLabel(status: string | undefined | null): string {
  switch ((status ?? "").toLowerCase()) {
    case "queued":  return "Queued";
    case "sent":    return "Sent";
    case "failed":  return "Failed";
    case "blocked": return "Blocked";
    case "":
    case "unknown": return "Unknown";
    default:        return "Unknown";
  }
}

function routeToneClass(status: string): string {
  switch (status) {
    case "sent":
      return "border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10";
    case "queued":
      return "border-primary/30 text-primary bg-primary/10";
    case "blocked":
      return "border-amber-500/30 text-amber-700 dark:text-amber-400 bg-amber-500/10";
    case "failed":
      return "border-destructive/30 text-destructive bg-destructive/10";
    default:
      return "border-border/70 text-muted-foreground bg-muted";
  }
}

export function HRMessageHistory({
  employeeId, caseId, limit = 10, refreshKey, className, title = "Message history",
}: HRMessageHistoryProps) {
  const [rows, setRows] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      let q: any = (supabase.from("hr_messages" as never) as any)
        .select("id,employee_id,case_id,subject,body,channels,status,route_status,scheduled_for,created_at,created_by")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (employeeId) q = q.eq("employee_id", employeeId);
      if (caseId) q = q.eq("case_id", caseId);
      const { data } = await q;
      if (!cancelled) {
        setRows((data ?? []) as MessageRow[]);
        setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [employeeId, caseId, limit, refreshKey]);

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        <MessageSquare className="h-3 w-3" /> {title}
      </p>
      <div className="rounded-xl border border-border/70 bg-background/50 divide-y divide-border/60">
        {loading ? (
          <p className="p-3 text-[12px] text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="p-3 text-[12px] text-muted-foreground">No HR messages recorded yet.</p>
        ) : rows.map((r) => {
          const rs = r.route_status ?? {};
          return (
            <div key={r.id} className="p-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[12.5px] font-medium tracking-tight truncate">
                  {r.subject || "HR message"}
                </p>
                <span className={cn(
                  "text-[10px] uppercase tracking-wider rounded-full border px-1.5 py-0.5",
                  r.status === "queued" ? "border-primary/30 text-primary bg-primary/10"
                  : r.status === "blocked" ? "border-amber-500/30 text-amber-700 dark:text-amber-400 bg-amber-500/10"
                  : r.status === "failed" ? "border-destructive/30 text-destructive bg-destructive/10"
                  : "border-border/70 text-muted-foreground bg-muted",
                )}>{r.status}</span>
              </div>
              <p className="text-[11.5px] text-muted-foreground mt-1 line-clamp-2">{r.body}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1">
                {(r.channels ?? []).map((ch) => {
                  const raw = (rs[ch]?.status ?? "").toLowerCase();
                  const known = ["queued","sent","failed","blocked"].includes(raw) ? raw : "unknown";
                  const reason = rs[ch]?.reason ?? "";
                  return (
                    <span
                      key={ch}
                      title={reason}
                      className={cn(
                        "text-[10.5px] rounded-full border px-1.5 py-0.5",
                        routeToneClass(known),
                      )}
                    >
                      {channelLabel(ch)} · {channelRouteStatusLabel(known)}
                      {(known === "blocked" || known === "failed") && reason
                        ? ` — ${reason.length > 60 ? reason.slice(0, 57) + "…" : reason}`
                        : ""}
                    </span>
                  );
                })}
              </div>
              <p className="text-[10.5px] text-muted-foreground mt-1">
                {fmt(r.created_at)}
                {r.scheduled_for ? ` · scheduled ${fmt(r.scheduled_for)}` : ""}
                {r.created_by ? ` · Created by user ID ${r.created_by.slice(0, 8)}…` : ""}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}