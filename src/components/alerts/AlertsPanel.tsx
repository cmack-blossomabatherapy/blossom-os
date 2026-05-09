import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCircle2, ClipboardList, ShieldCheck, AlarmClock, X, ArrowRight } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useMobileAlerts, type AlertCategory, type MobileAlert } from "@/hooks/useMobileAlerts";
import { useAuth } from "@/contexts/AuthContext";

const TAB_META: Record<AlertCategory, { label: string; icon: typeof Bell }> = {
  task: { label: "Tasks", icon: ClipboardList },
  approval: { label: "Approvals", icon: ShieldCheck },
  overdue: { label: "Overdue", icon: AlarmClock },
  compliance: { label: "Compliance", icon: ShieldCheck },
};

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
  const { active, counts, dismiss, reset } = useMobileAlerts();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<AlertCategory>("task");
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
        className="w-[min(92vw,420px)] p-0 overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Bell className="h-4 w-4 text-primary" /> Notifications
          </div>
          {counts.total > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => reset()}
            >
              Clear all
            </Button>
          )}
        </div>

        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as AlertCategory)}
          className="flex flex-col"
        >
          <div className="px-3">
            <TabsList className="grid grid-cols-3 w-full h-10">
              {(Object.keys(TAB_META) as AlertCategory[]).map((k) => {
                const Icon = TAB_META[k].icon;
                const count = counts[k];
                return (
                  <TabsTrigger key={k} value={k} className="gap-1.5 text-xs">
                    <Icon className="h-3.5 w-3.5" />
                    {TAB_META[k].label}
                    {count > 0 && (
                      <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                        {count}
                      </Badge>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {(Object.keys(TAB_META) as AlertCategory[]).map((k) => {
            const items = active.filter((a) => a.category === k);
            return (
              <TabsContent key={k} value={k} className="mt-2">
                <ScrollArea className="h-[420px] px-3 pb-3">
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-12 text-muted-foreground">
                      <CheckCircle2 className="h-8 w-8 text-primary mb-2" />
                      <div className="text-sm font-medium text-foreground">You're all caught up</div>
                      <div className="text-xs">No {TAB_META[k].label.toLowerCase()} right now.</div>
                    </div>
                  ) : (
                    <ul className="space-y-2 pb-2">
                      {items.map((a) => (
                        <li
                          key={a.id}
                          className={cn("rounded-xl border p-3", severityStyles(a.severity))}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={cn(
                                "mt-1.5 h-2 w-2 rounded-full shrink-0",
                                severityDot(a.severity),
                              )}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="font-medium text-sm leading-snug">{a.title}</div>
                                <button
                                  aria-label="Dismiss"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    dismiss(a.id);
                                  }}
                                  className="-mt-1 -mr-1 h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{a.body}</p>
                              <div className="flex items-center justify-between gap-2 mt-2.5">
                                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                  <Badge variant="outline" className="h-5 text-[10px]">
                                    {a.source}
                                  </Badge>
                                  {a.dueLabel && <span>· {a.dueLabel}</span>}
                                </div>
                                {a.href && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 gap-1 text-primary -mr-2"
                                    onClick={() => openAlert(a)}
                                  >
                                    Open <ArrowRight className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </ScrollArea>
              </TabsContent>
            );
          })}
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}