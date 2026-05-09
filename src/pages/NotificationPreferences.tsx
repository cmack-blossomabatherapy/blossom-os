import { Bell, ClipboardList, ShieldCheck, AlarmClock, Settings as SettingsIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useMobileAlerts, type AlertCategory } from "@/hooks/useMobileAlerts";
import { useAlertCategoryPrefs, ALERT_CATEGORY_META } from "@/lib/alerts/categoryPrefs";

// Mirror the bell popover ordering, icons and tones so this screen feels
// like the same system as the header chip/counts.
const CATEGORY_DISPLAY: Record<AlertCategory, { icon: typeof Bell; tone: string; chip: string }> = {
  overdue:    { icon: AlarmClock,    tone: "text-destructive", chip: "bg-destructive/10 text-destructive" },
  task:       { icon: ClipboardList, tone: "text-primary",     chip: "bg-primary/10 text-primary" },
  approval:   { icon: ShieldCheck,   tone: "text-primary",     chip: "bg-primary/10 text-primary" },
  compliance: { icon: ShieldCheck,   tone: "text-amber-600",   chip: "bg-amber-500/10 text-amber-600" },
};
const CATEGORY_ORDER: AlertCategory[] = ["overdue", "task", "approval", "compliance"];

export default function NotificationPreferences() {
  const navigate = useNavigate();
  const { isEnabled, setCategory } = useAlertCategoryPrefs();
  const { counts, mutedCategories } = useMobileAlerts();

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 px-1 py-2 md:py-4">
      <header className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Bell className="h-4 w-4" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
            Notification preferences
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Choose which alert categories appear in your header bell. Hidden categories are still tracked — you'll just stop seeing them in the dropdown and badge count.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="h-6 gap-1.5 px-2 text-[11px]">
            <Bell className="h-3 w-3 text-primary" />
            {counts.total} active
          </Badge>
          {counts.critical > 0 && (
            <Badge className="h-6 gap-1 px-2 text-[11px] bg-destructive/10 text-destructive hover:bg-destructive/15">
              {counts.critical} critical
            </Badge>
          )}
          {mutedCategories.length > 0 && (
            <Badge variant="outline" className="h-6 gap-1 px-2 text-[11px] text-muted-foreground">
              {mutedCategories.length} muted
            </Badge>
          )}
        </div>
      </header>

      <Card className="overflow-hidden border-border/60">
        <div className="divide-y divide-border/60">
          {CATEGORY_ORDER.map((category) => {
            const meta = ALERT_CATEGORY_META[category];
            const display = CATEGORY_DISPLAY[category];
            const Icon = display.icon;
            const enabled = isEnabled(category);
            const count = counts[category];
            return (
              <div
                key={category}
                className="flex items-start justify-between gap-4 px-4 py-4 md:px-5"
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div className={cn(
                    "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary",
                    display.tone,
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{meta.label}</p>
                      {enabled ? (
                        count > 0 && (
                          <span className={cn(
                            "inline-flex h-5 items-center rounded-full px-1.5 text-[10px] font-medium",
                            display.chip,
                          )}>
                            {count} active
                          </span>
                        )
                      ) : (
                        <Badge variant="outline" className="h-5 text-[10px] text-muted-foreground">
                          Muted
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                      {meta.description}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={enabled}
                  onCheckedChange={(v) => setCategory(category, v)}
                  aria-label={`Toggle ${meta.label} notifications`}
                />
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="flex items-start gap-3 border-border/60 bg-secondary/30 p-4">
        <SettingsIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="flex-1 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Need more control?</p>
          <p className="mt-0.5">
            Push delivery, quiet hours, and per-event email rules live in your team settings.
          </p>
          <Button
            variant="link"
            size="sm"
            className="mt-1 h-auto p-0 text-xs text-primary"
            onClick={() => navigate("/settings")}
          >
            Open team settings →
          </Button>
        </div>
      </Card>
    </div>
  );
}
