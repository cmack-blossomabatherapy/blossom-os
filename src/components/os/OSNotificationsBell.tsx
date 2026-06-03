import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";

type OSNotification = {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  read: boolean;
};

// Placeholder data source. When real notifications exist, populate from
// backend/role-aware feed. Empty array = no badge, friendly empty state.
const SEED: OSNotification[] = [];

export function OSNotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<OSNotification[]>(SEED);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const unread = items.filter((i) => !i.read).length;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={unread > 0 ? `${unread} unread notifications` : "Notifications"}
        className="os-glass-icon relative"
      >
        <Bell className="h-4 w-4 text-muted-foreground" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[hsl(265_85%_65%)] px-1 text-[9px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[360px] overflow-hidden rounded-2xl border border-border/60 bg-background/95 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
              <p className="text-[11px] text-muted-foreground">
                {unread > 0 ? `${unread} unread` : "You're all caught up"}
              </p>
            </div>
            {unread > 0 && (
              <button
                onClick={() => setItems((prev) => prev.map((i) => ({ ...i, read: true })))}
                className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
              >
                <CheckCheck className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-muted/60">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-[13px] font-medium text-foreground">No notifications yet</p>
                <p className="mt-1 text-[11.5px] text-muted-foreground">
                  Operational alerts and updates will appear here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border/40">
                {items.map((n) => (
                  <li
                    key={n.id}
                    onClick={() => setItems((prev) => prev.map((i) => i.id === n.id ? { ...i, read: true } : i))}
                    className={`cursor-pointer px-4 py-3 transition-colors hover:bg-muted/40 ${n.read ? "" : "bg-primary/[0.04]"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[13px] font-medium text-foreground">{n.title}</p>
                      <span className="shrink-0 text-[10px] text-muted-foreground">{n.timestamp}</span>
                    </div>
                    {n.description && (
                      <p className="mt-0.5 text-[11.5px] text-muted-foreground">{n.description}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}