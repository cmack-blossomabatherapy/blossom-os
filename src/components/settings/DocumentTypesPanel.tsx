import { SettingsPanel } from "./SettingsPanel";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { mockDocumentTypes } from "@/data/settings";
import { Switch } from "@/components/ui/switch";

const categoryVariant = (c: string): "default" | "success" | "warning" | "destructive" | "info" | "muted" =>
  ({
    Form: "info" as const,
    Consent: "success" as const,
    Insurance: "warning" as const,
    Clinical: "default" as const,
    Authorization: "warning" as const,
  })[c] ?? "default";

export function DocumentTypesPanel() {
  return (
    <SettingsPanel
      title="Document Types"
      description="Required documents per stage — missing docs auto-create chase tasks"
      primaryAction={{ label: "Add Document Type" }}
    >
      <div className="bg-secondary/20 rounded-lg border border-border/40 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60">
              {["Document", "Category", "Required at Stage", "Blocks Progress"].map((h) => (
                <th key={h} className="text-left px-3 py-2 font-medium text-muted-foreground text-[11px] uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockDocumentTypes.map((d) => (
              <tr key={d.id} className="border-b border-border/30 last:border-b-0 hover:bg-muted/20">
                <td className="px-3 py-2 text-sm font-medium text-foreground">{d.name}</td>
                <td className="px-3 py-2"><StatusBadge status={d.category} variant={categoryVariant(d.category)} /></td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{d.requiredAtStage}</td>
                <td className="px-3 py-2"><Switch defaultChecked={d.blocksProgress} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SettingsPanel>
  );
}
