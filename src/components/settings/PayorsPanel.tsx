import { Switch } from "@/components/ui/switch";
import { SettingsPanel } from "./SettingsPanel";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { mockPayors } from "@/data/settings";

export function PayorsPanel() {
  return (
    <SettingsPanel
      title="Payors / Insurance"
      description="Per-payor auth rules, renewal cycles, and VOB requirements"
      primaryAction={{ label: "Add Payor" }}
    >
      <div className="space-y-2">
        {mockPayors.map((p) => (
          <div key={p.name} className="rounded-lg border border-border/60 bg-secondary/20 p-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-semibold text-foreground">{p.name}</h4>
                  <div className="flex items-center gap-1">
                    {p.states.map((s) => (
                      <span key={s} className="font-mono text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{s}</span>
                    ))}
                  </div>
                </div>
                {p.notes && <p className="text-[11px] text-muted-foreground mt-1">{p.notes}</p>}
              </div>
              <div className="flex items-center gap-4 text-[11px]">
                <Stat label="Validity" value={`${p.authValidityDays}d`} />
                <Stat label="Renewal lead" value={`${p.renewalLeadDays}d`} />
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">VOB</span>
                  <Switch defaultChecked={p.vobRequired} />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">QA</span>
                  <Switch defaultChecked={p.qaRequired} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SettingsPanel>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground tabular-nums">{value}</p>
    </div>
  );
}
