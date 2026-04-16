import { Switch } from "@/components/ui/switch";
import { Mail, MessageSquare } from "lucide-react";
import { SettingsPanel } from "./SettingsPanel";
import { mockTemplates } from "@/data/settings";
import { cn } from "@/lib/utils";

interface Props {
  channel: "Email" | "SMS";
}

export function TemplatesPanel({ channel }: Props) {
  const list = mockTemplates.filter((t) => t.channel === channel);
  const Icon = channel === "Email" ? Mail : MessageSquare;

  return (
    <SettingsPanel
      title={`${channel} Templates`}
      description={
        channel === "Email"
          ? "Auto-sent emails for onboarding, consent, and follow-ups"
          : "SMS reminders and confirmations sent to families"
      }
      primaryAction={{ label: `New ${channel} Template` }}
    >
      <div className="space-y-2">
        {list.map((t) => (
          <div key={t.id} className="rounded-lg border border-border/60 bg-secondary/20 p-3">
            <div className="flex items-start gap-3">
              <div className={cn(
                "h-8 w-8 rounded-md inline-flex items-center justify-center shrink-0",
                channel === "Email" ? "bg-info/10 text-info" : "bg-success/10 text-success",
              )}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-foreground truncate">{t.name}</h4>
                  <Switch defaultChecked={t.active} />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Trigger: <span className="text-foreground font-medium">{t.trigger}</span>
                </p>
                {t.subject && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Subject: <span className="text-foreground">{t.subject}</span>
                  </p>
                )}
                <p className="text-xs text-muted-foreground bg-card border border-border/40 rounded px-2 py-1.5 mt-2 line-clamp-2 font-mono">
                  {t.body}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SettingsPanel>
  );
}
