import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SettingsPanel } from "./SettingsPanel";
import { mockStates } from "@/data/settings";

export function StatesPanel() {
  return (
    <SettingsPanel
      title="States & Coverage"
      description="Activate states and assign per-state owners across every department"
      primaryAction={{ label: "Add State" }}
    >
      <div className="overflow-x-auto -m-5 px-5">
        <table className="w-full text-sm min-w-[840px]">
          <thead>
            <tr className="border-b border-border/60">
              {["Active", "State", "Intake", "Auth", "QA", "Scheduling", "Staffing"].map((h) => (
                <th key={h} className="text-left px-2 py-2 font-medium text-muted-foreground text-[11px] uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockStates.map((s) => (
              <tr key={s.code} className="border-b border-border/30 last:border-b-0">
                <td className="px-2 py-3"><Switch defaultChecked={s.active} /></td>
                <td className="px-2 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-foreground bg-muted px-1.5 py-0.5 rounded">{s.code}</span>
                    <span className="text-sm text-foreground">{s.name}</span>
                    {!s.active && <StatusBadge status="Inactive" variant="muted" />}
                  </div>
                </td>
                <td className="px-2 py-3 text-xs text-foreground">{s.intakeOwner}</td>
                <td className="px-2 py-3 text-xs text-foreground">{s.authOwner}</td>
                <td className="px-2 py-3 text-xs text-foreground">{s.qaOwner}</td>
                <td className="px-2 py-3 text-xs text-foreground">{s.schedulingOwner}</td>
                <td className="px-2 py-3 text-xs text-foreground">{s.staffingOwner}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SettingsPanel>
  );
}
