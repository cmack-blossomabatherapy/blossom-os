import { ExternalLink, Power, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SettingsPanel } from "./SettingsPanel";

export function AutomationRulesPanel() {
  return (
    <SettingsPanel
      title="Automation Rules"
      description="Global controls for the automation engine — full editing happens on the Automations page"
      showSave={false}
      primaryAction={{ label: "Open Automations Page" }}
    >
      <div className="space-y-3">
        <div className="rounded-lg border border-border/60 bg-secondary/20 p-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-success/10 text-success inline-flex items-center justify-center shrink-0">
            <Power className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-foreground">Engine status</h4>
            <p className="text-[11px] text-muted-foreground">19 active automations · 2 in error · 1 paused</p>
          </div>
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <ExternalLink className="h-3 w-3 mr-1.5" /> Manage
          </Button>
        </div>

        <div className="rounded-lg border border-border/60 bg-secondary/20 p-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-warning/10 text-warning inline-flex items-center justify-center shrink-0">
            <Shield className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-foreground">Safety</h4>
            <p className="text-[11px] text-muted-foreground">
              Conflict detection enabled · Require confirmation for destructive actions
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-info/30 bg-info/5 p-3 text-xs text-foreground">
          <p>
            For full trigger / condition / action editing, jump to the{" "}
            <span className="font-semibold text-info">Automations</span> page. This panel is intentionally read-only to
            prevent accidental breakage.
          </p>
        </div>
      </div>
    </SettingsPanel>
  );
}
