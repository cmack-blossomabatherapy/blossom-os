import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCircle2, ClipboardList, ShieldCheck, AlarmClock, X, ChevronRight, Settings as SettingsIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useMobileAlerts, type AlertCategory, type MobileAlert } from "@/hooks/useMobileAlerts";
import { ALERT_CATEGORY_META } from "@/lib/alerts/categoryPrefs";
import { useAuth } from "@/contexts/AuthContext";

const SECTION_META: Record<AlertCategory, { label: string; icon: typeof Bell; tone: string }> = {
  task:       { label: "Tasks",       icon: ClipboardList, tone: "text-primary" },
  approval:   { label: "Approvals",   icon: ShieldCheck,   tone: "text-primary" },
  overdue:    { label: "Overdue",     icon: AlarmClock,    tone: "text-destructive" },
  compliance: { label: "Compliance",  icon: ShieldCheck,   tone: "text-amber-600" },
};
const SECTION_ORDER: AlertCategory[] = ["overdue", "task", "approval", "compliance"];

function severityStyles(sev: MobileAlert["severity"]) {
  switch (sev) {
    case "critical": return "border-destructive/40 bg-destructive/5";
    case "warning":  return "border-amber-500/30 bg-amber-500/5";
    default:         return "border-border/50 bg-background/40";
  }
}

function severityDot(sev: MobileAlert["severity"]) {
  switch (sev) {
    case "critical": return "bg-destructive";
    case "warning":  return "bg-amber-500";
    default:         return "bg-primary";
  }
}

/**
 * Desktop / tablet alerts panel. Mirrors the mobile sheet's tabs,
 * dismiss behavior, and severity styling, but renders as a popover
 * anchored in the top-bar utility area.
 */
export function AlertsPanel() {
  const { user } = useAuth();
  const { active, counts, mutedCategories, dismiss, reset } = useMobileAlerts();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  if (!user) return null;

  const openAlert = (a: MobileAlert) => {
    if (a.href) navigate(a.href);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          aria-label={counts.total > 0 ? `Open alerts, ${counts.total} unread` : "Open alerts"}
          className="relative h-9 w-9 inline-flex md:h-8 md:w-8"
        >
          <Bell className="h-[18px] w-[18px] md:h-4 md:w-4" />
          {counts.total > 0 && (
            <span
              className={cn(
                "absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold tabular-nums leading-none",
                "flex items-center justify-center ring-2 ring-card shadow-sm md:-top-0.5 md:-right-0.5 md:h-4 md:min-w-[16px] md:text-[9px] md:font-semibold md:ring-0 md:border md:border-card",
                counts.critical > 0
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-primary text-primary-foreground",
              )}
              aria-hidden
            >
              {counts.total > 99 ? "99+" : counts.total}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[min(94vw,420px)] p-0 overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-border/50">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Bell className="h-4 w-4 text-primary" /> Notifications
            {counts.total > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-medium">
                {counts.total}
              </Badge>
            )}
            {mutedCategories.length > 0 && (
              <button
                type="button"
                onClick={() => { setOpen(false); navigate("/notification-preferences"); }}
                title={`Muted: ${mutedCategories.map((c) => ALERT_CATEGORY_META[c].label).join(", ")}`}
                className="h-5 px-1.5 inline-flex items-center rounded-full text-[10px] font-medium bg-muted text-muted-foreground hover:bg-muted/80"
              >
                {mutedCategories.length} muted
              </button>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-9 w-9 md:h-7 md:w-7 px-0 text-muted-foreground hover:text-foreground"
              onClick={() => { setOpen(false); navigate("/notification-preferences"); }}
              aria-label="Notification preferences"
            >
              <SettingsIcon className="h-4 w-4 md:h-3.5 md:w-3.5" />
            </Button>
            {counts.total > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="h-9 md:h-7 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => reset()}
              >
                Clear all
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[70vh] max-h-[520px]">
          {counts.total === 0 ? (
            mutedCategories.length > 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-16 px-6 text-muted-foreground">
                <Bell className="h-10 w-10 text-muted-foreground/60 mb-3" />
                <div className="text-sm font-medium text-foreground">Nothing to show</div>
                <div className="text-xs mt-1">
                  {mutedCategories.length === 4
                    ? "All categories are muted."
                    : `${mutedCategories.length} ${mutedCategories.length === 1 ? "category is" : "categories are"} muted.`}
                </div>
                <button
                  type="button"
                  onClick={() => { setOpen(false); navigate("/notification-preferences"); }}
                  className="mt-3 text-xs font-medium text-primary hover:underline"
                >
                  Manage preferences
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-16 px-6 text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 text-primary mb-3" />
                <div className="text-sm font-medium text-foreground">You're all caught up</div>
                <div className="text-xs mt-1">No notifications right now.</div>
              </div>
            )
          ) : (
            <div className="py-1">
              {SECTION_ORDER.map((k) => {
                const items = active.filter((a) => a.category === k);
                if (items.length === 0) return null;
                const meta = SECTION_META[k];
                const Icon = meta.icon;
                return (
                  <section key={k} className="pb-1">
                    <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-1.5 bg-popover/95 backdrop-blur-sm border-b border-border/40">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        <Icon className={cn("h-3.5 w-3.5", meta.tone)} />
                        {meta.label}
                      </div>
                      <span className="text-[10px] text-muted-foreground tabular-nums">{items.length}</span>
                    </header>
                    <ul className="divide-y divide-border/40">
                      {items.map((a) => (
                        <li key={a.id} className={cn("relative", severityStyles(a.severity))}>
                          <button
                            type="button"
                            onClick={() => openAlert(a)}
                            disabled={!a.href}
                            className={cn(
                              "w-full text-left px-4 py-3 pr-12 min-h-[64px]",
                              "flex items-start gap-3",
                              "active:bg-muted/60 md:hover:bg-muted/40 transition-colors",
                              "disabled:cursor-default",
                            )}
                          >
                            <span
                              className={cn(
                                "mt-1.5 h-2 w-2 rounded-full shrink-0",
                                severityDot(a.severity),
                              )}
                              aria-hidden
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm leading-snug text-foreground">{a.title}</div>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.body}</p>
                              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground">
                                <Badge variant="outline" className="h-5 text-[10px] font-normal">
                                  {a.source}
                                </Badge>
                                {a.dueLabel && <span>· {a.dueLabel}</span>}
                              </div>
                            </div>
                            {a.href && (
                              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 self-center" aria-hidden />
                            )}
                          </button>
                          <button
                            aria-label="Dismiss notification"
                            onClick={(e) => { e.stopPropagation(); dismiss(a.id); }}
                            className="absolute top-1.5 right-1.5 h-9 w-9 md:h-7 md:w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted active:bg-muted/80"
                          >
                            <X className="h-4 w-4 md:h-3.5 md:w-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}