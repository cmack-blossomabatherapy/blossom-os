import { Plug, RefreshCw, AlertOctagon, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SettingsPanel } from "./SettingsPanel";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { mockIntegrations, integrationStatusVariant, formatRelative } from "@/data/settings";
import { cn } from "@/lib/utils";

export function IntegrationsPanel() {
  return (
    <SettingsPanel
      title="Integrations"
      description="Connected systems that power forms, insurance, clinical data, and messaging"
      showSave={false}
      primaryAction={{ label: "Browse Integrations" }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {mockIntegrations.map((i) => {
          const Icon = i.status === "Error" ? AlertOctagon : i.status === "Connected" ? CheckCircle2 : Plug;
          return (
            <div
              key={i.id}
              className={cn(
                "rounded-lg border p-3",
                i.status === "Error" ? "border-destructive/30 bg-destructive/5" : "border-border/60 bg-secondary/20",
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "h-9 w-9 rounded-md inline-flex items-center justify-center shrink-0",
                  i.status === "Error" ? "bg-destructive/10 text-destructive"
                    : i.status === "Connected" ? "bg-success/10 text-success"
                    : "bg-muted text-muted-foreground",
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-foreground truncate">{i.name}</h4>
                    <StatusBadge status={i.status} variant={integrationStatusVariant(i.status)} />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{i.description}</p>
                  <div className="flex items-center justify-between gap-2 mt-2">
                    <span className="text-[10px] text-muted-foreground">
                      {i.lastSync ? `Last sync ${formatRelative(i.lastSync)}` : "Never synced"}
                    </span>
                    <Button variant="outline" size="sm" className="h-6 text-[11px] px-2">
                      <RefreshCw className="h-2.5 w-2.5 mr-1" />
                      {i.status === "Error" ? "Reconnect" : "Configure"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </SettingsPanel>
  );
}
