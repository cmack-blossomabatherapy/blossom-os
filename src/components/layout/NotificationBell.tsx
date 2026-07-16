import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Clock, UserPlus, AlarmClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNowStrict } from "date-fns";

type NotifRow = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

const kindMeta: Record<string, { icon: typeof Bell; tone: string }> = {
  task_assigned: { icon: UserPlus, tone: "bg-primary/10 text-primary" },
  task_due_today: { icon: AlarmClock, tone: "bg-destructive/10 text-destructive" },
  task_due_tomorrow: { icon: Clock, tone: "bg-warning/10 text-warning" },
};

export function NotificationBell() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotifRow[]>([]);

  useEffect(() => {
    if (!user?.id) {
      setItems([]);
      return;
    }
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("user_notifications")
        .select("id,kind,title,body,link,read_at,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      if (!cancelled) setItems((data as NotifRow[]) ?? []);
    };
    load();
    const channel = supabase
      .channel(`notif:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_notifications", filter: `user_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const unread = items.filter((n) => !n.read_at).length;
  const total = items.length;

  const markRead = async (id: string) => {
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: now } : n)));
    await supabase.from("user_notifications").update({ read_at: now }).eq("id", id);
  };

  const markAllRead = async () => {
    if (!user?.id) return;
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: now })));
    await supabase
      .from("user_notifications")
      .update({ read_at: now })
      .eq("user_id", user.id)
      .is("read_at", null);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 relative"
          aria-label={`${unread} unread notifications`}
        >
          <Bell className="h-4 w-4 text-muted-foreground" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full text-[10px] font-bold inline-flex items-center justify-center text-white bg-destructive">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[380px] p-0 border-border/60">
        <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
            <p className="text-[11px] text-muted-foreground">
              {unread > 0 ? `${unread} unread` : "All caught up"}
            </p>
          </div>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="text-[11px] text-primary hover:underline inline-flex items-center gap-1"
            >
              <CheckCheck className="h-3 w-3" /> Mark all read
            </button>
          )}
        </div>
        <div className="max-h-[420px] overflow-y-auto divide-y divide-border/30">
          {total === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-muted-foreground italic">
              No notifications yet
            </p>
          ) : (
            items.map((n) => {
              const meta = kindMeta[n.kind] ?? { icon: Bell, tone: "bg-muted text-muted-foreground" };
              const Icon = meta.icon;
              return (
                <button
                  key={n.id}
                  onClick={() => {
                    markRead(n.id);
                    setOpen(false);
                    if (n.link) navigate(n.link);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-muted/30 transition-colors flex items-start gap-3",
                    !n.read_at && "bg-primary/[0.03]",
                  )}
                >
                  <div className={cn("h-7 w-7 rounded-md inline-flex items-center justify-center shrink-0", meta.tone)}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-foreground truncate">{n.title}</p>
                      <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                        {formatDistanceToNowStrict(new Date(n.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    {n.body && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                    )}
                  </div>
                  {!n.read_at && <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
