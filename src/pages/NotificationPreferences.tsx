import { Bell, ClipboardList, ShieldCheck, AlarmClock, Settings as SettingsIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMobileAlerts, type AlertCategory } from "@/hooks/useMobileAlerts";
import { useAlertCategoryPrefs, ALERT_CATEGORIES, ALERT_CATEGORY_META } from "@/lib/alerts/categoryPrefs";

const CATEGORY_ICON: Record<AlertCategory, typeof Bell> = {
  task: ClipboardList,
  approval: ShieldCheck,
  overdue: AlarmClock,
  compliance: ShieldCheck,
};

export default function NotificationPreferences() {
  const navigate = useNavigate();
  const { isEnabled, setCategory } = useAlertCategoryPrefs();
  const { counts } = useMobileAlerts();

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 px-1 py-2 md:py-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Bell className="h-4 w-4" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
              Notification preferences
            </h1>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose which alert categories appear in your header bell. Hidden categories are still tracked — you'll just stop seeing them in the dropdown and badge count.
          </p>
        </div>
      </header>

      <Card className="overflow-hidden border-border/60">
        <div className="divide-y divide-border/60">
          {ALERT_CATEGORIES.map((category) => {
            const meta = ALERT_CATEGORY_META[category];
            const Icon = CATEGORY_ICON[category];
            const enabled = isEnabled(category);
            const count = counts[category as keyof typeof counts] as number | undefined;
            return (
              <div
                key={category}
                className="flex items-start justify-between gap-4 px-4 py-4 md:px-5"
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{meta.label}</p>
                      {enabled && typeof count === "number" && count > 0 && (
                        <Badge variant="secondary" className="h-5 text-[10px]">
                          {count} active
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
