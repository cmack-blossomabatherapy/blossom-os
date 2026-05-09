import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Inbox, AlertOctagon, AlertTriangle, Check, CheckCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { sanitizeDeepLink } from "@/lib/push/sanitizeDeepLink";

interface Alert {
  id: string;
  title: string;
  message: string | null;
  category: string;
  severity: string;
  deep_link: string;
  pushed_at: string | null;
  created_at: string;
}

const sevTone: Record<string, string> = {
  critical: "bg-destructive/10 text-destructive",
  warning: "bg-warning/10 text-warning",
};

function relative(d: string): string {
  const ms = Date.now() - new Date(d).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function PushedAlertsCenter() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!user) return;
    let q = supabase
      .from("critical_alerts")
      .select("id, title, message, category, severity, deep_link, pushed_at, created_at")
      .not("pushed_at", "is", null)
      .order("pushed_at", { ascending: false })
      .limit(50);
    q = isAdmin ? q : q.eq("assignee_user_id", user.id);
    const { data: rows } = await q;
    setAlerts((rows ?? []) as Alert[]);

    const { data: reads } = await supabase
      .from("alert_reads")
      .select("alert_id")
      .eq("user_id", user.id);
    setReadIds(new Set((reads ?? []).map((r: any) => r.alert_id)));
  }, [user, isAdmin]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("pushed-alerts-center")
      .on("postgres_changes", { event: "*", schema: "public", table: "critical_alerts" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, load]);

  const unread = useMemo(
    () => alerts.filter((a) => !readIds.has(a.id)).length,
    [alerts, readIds],
  );

  async function markRead(ids: string[]) {
    if (!user || ids.length === 0) return;
    const next = new Set(readIds);
    ids.forEach((id) => next.add(id));
    setReadIds(next);
    await supabase
      .from("alert_reads")
      .upsert(
        ids.map((alert_id) => ({ user_id: user.id, alert_id })),
        { onConflict: "user_id,alert_id", ignoreDuplicates: true },
      );
  }

  function handleOpen(a: Alert) {
    markRead([a.id]);
    setOpen(false);
    navigate(sanitizeDeepLink(a.deep_link, a.category));
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 relative"
          aria-label={`${unread} unread notifications`}
        >
          <Inbox className="h-4 w-4 text-muted-foreground" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full text-[10px] font-bold inline-flex items-center justify-center bg-destructive text-destructive-foreground">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[400px] p-0 border-border/60">
        <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
            <p className="text-[11px] text-muted-foreground">
              {unread > 0 ? `${unread} unread · ${alerts.length} total` : `${alerts.length} pushed`}
            </p>
          </div>
          {unread > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-[11px]"
              onClick={() => markRead(alerts.filter((a) => !readIds.has(a.id)).map((a) => a.id))}
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" /> Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[420px]">
          {alerts.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              You're all caught up.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {alerts.map((a) => {
                const read = readIds.has(a.id);
                const Icon = a.severity === "critical" ? AlertOctagon : AlertTriangle;
                return (
                  <li
                    key={a.id}
                    className={cn(
                      "group flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/40",
                      !read && "bg-primary/[0.04]",
                    )}
                    onClick={() => handleOpen(a)}
                  >
                    <div className={cn("h-7 w-7 rounded-full shrink-0 inline-flex items-center justify-center", sevTone[a.severity] ?? "bg-muted text-muted-foreground")}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("text-sm leading-tight truncate", !read ? "font-semibold text-foreground" : "text-foreground/80")}>
                          {a.title}
                        </p>
                        {!read && <span className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" aria-label="unread" />}
                      </div>
                      {a.message && (
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{a.message}</p>
                      )}
                      <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <Badge variant="outline" className="h-4 px-1.5 text-[10px] capitalize">{a.category}</Badge>
                        <span>{relative(a.pushed_at ?? a.created_at)}</span>
                      </div>
                    </div>
                    {!read && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markRead([a.id]); }}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground self-center"
                        aria-label="Mark as read"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
        <div className="px-3 py-2 border-t border-border/60 text-right">
          <button
            onClick={() => { setOpen(false); navigate("/settings"); }}
            className="text-[11px] text-primary hover:underline inline-flex items-center gap-1"
          >
            Notification settings <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
