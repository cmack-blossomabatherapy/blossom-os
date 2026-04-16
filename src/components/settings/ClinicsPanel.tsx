import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Building2, Users, MapPin } from "lucide-react";
import { SettingsPanel } from "./SettingsPanel";
import { StatusBadge } from "@/components/shared/StatusBadge";

const clinics = [
  { name: "Peachtree Corners", address: "5550 Peachtree Pkwy, Norcross GA", manager: "Dr. Hannah Kim", capacity: 32, active: 24, status: "Active" },
  { name: "Riverdale", address: "180 Forest Pkwy, Riverdale GA", manager: "Dr. Daniel Lee", capacity: 24, active: 18, status: "Active" },
];

export function ClinicsPanel() {
  return (
    <SettingsPanel
      title="Clinics"
      description="Physical locations, capacity, and on-site managers"
      primaryAction={{ label: "Add Clinic" }}
    >
      <div className="space-y-3">
        {clinics.map((c) => {
          const utilPct = Math.round((c.active / c.capacity) * 100);
          return (
            <div key={c.name} className="rounded-lg border border-border/60 bg-secondary/20 p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary inline-flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-foreground">{c.name}</h4>
                      <StatusBadge status={c.status} variant="success" />
                    </div>
                    <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" /> {c.address}
                    </p>
                    <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1 mt-0.5">
                      <Users className="h-3 w-3" /> Manager: <span className="text-foreground font-medium">{c.manager}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Utilization</p>
                  <p className="text-sm font-semibold text-foreground tabular-nums">{c.active} / {c.capacity}</p>
                  <div className="w-32 h-1.5 rounded-full bg-muted/60 overflow-hidden mt-1">
                    <div
                      className={utilPct >= 90 ? "h-full bg-warning" : "h-full bg-success"}
                      style={{ width: `${utilPct}%` }}
                    />
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
