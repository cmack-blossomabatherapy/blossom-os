import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCircle2, ClipboardList, ShieldCheck, AlarmClock, X, ArrowRight } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
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

export function MobileAlertsButton() {
  const { user } = useAuth();
  const { active, counts, dismiss } = useMobileAlerts();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<AlertCategory>("task");
  const navigate = useNavigate();

  if (!user) return null;

  const open_ = (a: MobileAlert) => {
    if (a.href) navigate(a.href);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label={`Open alerts, ${counts.total} active`}
          className={cn(
            "fixed z-40 right-3 bottom-[calc(56px+env(safe-area-inset-bottom)+12px)]",
            "md:bottom-6 md:right-6",
            "h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25",
            "flex items-center justify-center active:scale-95 transition-transform",
          )}
        >
          <Bell className="h-5 w-5" />
          {counts.total > 0 && (
            <span className={cn(
              "absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full text-[10px] font-semibold",
              "flex items-center justify-center border-2 border-card",
              counts.critical > 0 ? "bg-destructive text-destructive-foreground" : "bg-amber-500 text-white",
            )}>
              {counts.total > 99 ? "99+" : counts.total}
            </span>
          )}
        </button>
      </SheetTrigger>

      <SheetContent side="bottom" className="p-0 h-[85vh] rounded-t-2xl flex flex-col">
        <SheetHeader className="px-4 pt-4 pb-2 text-left">
          <SheetTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" /> Notifications
          </SheetTitle>
        </SheetHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as AlertCategory)} className="flex-1 flex flex-col min-h-0">
          <div className="px-3">
            <TabsList className="grid grid-cols-3 w-full h-11">
              {(Object.keys(TAB_META) as AlertCategory[]).map((k) => {
                const Icon = TAB_META[k].icon;
                const count = counts[k];
                return (
                  <TabsTrigger key={k} value={k} className="gap-1.5 text-xs">
                    <Icon className="h-3.5 w-3.5" />
                    {TAB_META[k].label}
                    {count > 0 && <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">{count}</Badge>}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {(Object.keys(TAB_META) as AlertCategory[]).map((k) => {
            const items = active.filter(a => a.category === k);
            return (
              <TabsContent key={k} value={k} className="flex-1 min-h-0 mt-2">
                <ScrollArea className="h-full px-3 pb-6">
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-12 text-muted-foreground">
                      <CheckCircle2 className="h-8 w-8 text-primary mb-2" />
                      <div className="text-sm font-medium text-foreground">You're all caught up</div>
                      <div className="text-xs">No {TAB_META[k].label.toLowerCase()} right now.</div>
                    </div>
                  ) : (
                    <ul className="space-y-2 pb-4">
                      {items.map(a => (
                        <li key={a.id} className={cn("rounded-xl border p-3", severityStyles(a.severity))}>
                          <div className="flex items-start gap-3">
                            <span className={cn("mt-1.5 h-2 w-2 rounded-full shrink-0", severityDot(a.severity))} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="font-medium text-sm leading-snug">{a.title}</div>
                                <button
                                  aria-label="Dismiss"
                                  onClick={(e) => { e.stopPropagation(); dismiss(a.id); }}
                                  className="-mt-1 -mr-1 h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{a.body}</p>
                              <div className="flex items-center justify-between gap-2 mt-2.5">
                                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                  <Badge variant="outline" className="h-5 text-[10px]">{a.source}</Badge>
                                  {a.dueLabel && <span>· {a.dueLabel}</span>}
                                </div>
                                {a.href && (
                                  <Button size="sm" variant="ghost" className="h-7 gap-1 text-primary -mr-2" onClick={() => open_(a)}>
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
      </SheetContent>
    </Sheet>
  );
}