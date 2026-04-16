import { Switch } from "@/components/ui/switch";
import { SettingsPanel } from "./SettingsPanel";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { mockTaskTemplates } from "@/data/settings";

const deptVariant = (d: string): "default" | "success" | "warning" | "destructive" | "info" | "muted" =>
  ({
    Intake: "info" as const,
    Auth: "warning" as const,
    QA: "default" as const,
    Scheduling: "success" as const,
    Staffing: "info" as const,
    Operations: "muted" as const,
  })[d] ?? "default";

const priorityVariant = (p: string): "default" | "success" | "warning" | "destructive" | "info" | "muted" =>
  ({
    High: "destructive" as const,
    Medium: "warning" as const,
    Low: "muted" as const,
  })[p] ?? "default";

export function TaskTemplatesPanel() {
  return (
    <SettingsPanel
      title="Task Templates"
      description="SOP-driven tasks the system auto-creates as records move through stages"
      primaryAction={{ label: "Add Template" }}
    >
      <div className="bg-secondary/20 rounded-lg border border-border/40 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60">
              {["Active", "Task Name", "Department", "Trigger Stage", "Priority", "SLA"].map((h) => (
                <th key={h} className="text-left px-3 py-2 font-medium text-muted-foreground text-[11px] uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockTaskTemplates.map((t) => (
              <tr key={t.id} className="border-b border-border/30 last:border-b-0 hover:bg-muted/20">
                <td className="px-3 py-2"><Switch defaultChecked={t.active} /></td>
                <td className="px-3 py-2 text-sm font-medium text-foreground">{t.name}</td>
                <td className="px-3 py-2"><StatusBadge status={t.department} variant={deptVariant(t.department)} /></td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{t.triggerStage}</td>
                <td className="px-3 py-2"><StatusBadge status={t.defaultPriority} variant={priorityVariant(t.defaultPriority)} /></td>
                <td className="px-3 py-2 text-xs font-semibold tabular-nums text-foreground">{t.slaHours}h</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SettingsPanel>
  );
}
