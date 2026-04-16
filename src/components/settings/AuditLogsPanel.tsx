import { User, Zap, Server } from "lucide-react";
import { SettingsPanel } from "./SettingsPanel";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { mockAuditLogs, formatRelative } from "@/data/settings";
import { cn } from "@/lib/utils";

export function AuditLogsPanel() {
  return (
    <SettingsPanel
      title="Audit Logs"
      description="Every change tracked — user, automation, or system. Critical for compliance and debugging."
      showSave={false}
      primaryAction={{ label: "Export CSV" }}
    >
      <div className="bg-secondary/20 rounded-lg border border-border/40 divide-y divide-border/30">
        {mockAuditLogs.map((l) => {
          const Icon = l.actorType === "Automation" ? Zap : l.actorType === "System" ? Server : User;
          return (
            <div key={l.id} className="px-3 py-2.5 flex items-start gap-3 hover:bg-muted/20 transition-colors">
              <div className={cn(
                "h-7 w-7 rounded-md inline-flex items-center justify-center shrink-0",
                l.actorType === "Automation" ? "bg-warning/10 text-warning"
                  : l.actorType === "System" ? "bg-muted text-muted-foreground"
                  : "bg-info/10 text-info",
              )}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-foreground">{l.actor}</span>
                  <StatusBadge status={l.actorType} variant={l.actorType === "Automation" ? "warning" : l.actorType === "System" ? "muted" : "info"} />
                  <span className="text-xs text-foreground">{l.action}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs font-medium text-primary">{l.target}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{l.detail}</p>
              </div>
              <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">{formatRelative(l.timestamp)}</span>
            </div>
          );
        })}
      </div>
    </SettingsPanel>
  );
}
