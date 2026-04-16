import { Switch } from "@/components/ui/switch";
import { SettingsPanel } from "./SettingsPanel";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { mockAssignmentRules } from "@/data/settings";

export function AssignmentRulesPanel() {
  return (
    <SettingsPanel
      title="Assignment Rules"
      description="Auto-route work to the right person based on state, payor, queue, or region"
      primaryAction={{ label: "Add Rule" }}
    >
      <div className="space-y-2">
        {mockAssignmentRules.map((r) => (
          <div key={r.id} className="rounded-lg border border-border/60 bg-secondary/20 p-3 flex items-center gap-3">
            <Switch defaultChecked={r.active} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={r.domain} variant="info" />
                <span className="text-[11px] text-muted-foreground">basis:</span>
                <StatusBadge status={r.basis} variant="muted" />
              </div>
              <p className="text-xs text-foreground mt-1">{r.description}</p>
            </div>
            <button className="text-[11px] text-primary hover:underline shrink-0">Edit</button>
          </div>
        ))}
      </div>
    </SettingsPanel>
  );
}
