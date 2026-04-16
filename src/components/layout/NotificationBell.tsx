import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, AlertTriangle, AlertOctagon, Info, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  buildClinicNotifications,
  formatRelativeShort,
  type NotificationLevel,
} from "@/data/notifications";

const levelIcon: Record<NotificationLevel, typeof AlertTriangle> = {
  destructive: AlertOctagon,
  warning: AlertTriangle,
  info: Info,
};

const levelTone: Record<NotificationLevel, string> = {
  destructive: "bg-destructive/10 text-destructive",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
};

export function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const notifications = useMemo(() => buildClinicNotifications(), []);
  const critical = notifications.filter((n) => n.level === "destructive").length;
  const total = notifications.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 relative"
          aria-label={`${total} clinic alerts`}
        >
          <Bell className="h-4 w-4 text-muted-foreground" />
          {total > 0 && (
            <span
              className={cn(
                "absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full text-[10px] font-bold inline-flex items-center justify-center text-white",
                critical > 0 ? "bg-destructive" : "bg-warning",
              )}
            >
              {total}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[380px] p-0 border-border/60"
      >
        <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Clinic Alerts</h3>
            <p className="text-[11px] text-muted-foreground">
              {critical} critical · {total - critical} warnings
            </p>
          </div>
          <button
            onClick={() => {
              setOpen(false);
              navigate("/operations");
            }}
            className="text-[11px] text-primary hover:underline inline-flex items-center gap-1"
          >
            View all <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <div className="max-h-[420px] overflow-y-auto divide-y divide-border/30">
          {notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-muted-foreground italic">
              No active alerts — clinics running smoothly
            </p>
          ) : (
            notifications.map((n) => {
              const Icon = levelIcon[n.level];
              return (
                <button
                  key={n.id}
                  onClick={() => {
                    setOpen(false);
                    navigate(`/operations/clinics/${n.clinicId}`);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-muted/30 transition-colors flex items-start gap-3"
                >
                  <div
                    className={cn(
                      "h-7 w-7 rounded-md inline-flex items-center justify-center shrink-0",
                      levelTone[n.level],
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {n.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                        {formatRelativeShort(n.timestamp)}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                      {n.description}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1 uppercase tracking-wide">
                      {n.category}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
