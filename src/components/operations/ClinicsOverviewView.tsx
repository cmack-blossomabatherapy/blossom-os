import { useNavigate } from "react-router-dom";
import { Building2, MapPin, AlertTriangle, ArrowRight, Home } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import { getAllClinicMetrics, clinicStatusVariant } from "@/data/clinics";

export function ClinicsOverviewView({ searchQuery }: { searchQuery: string }) {
  const navigate = useNavigate();
  const all = getAllClinicMetrics().filter(
    (m) => !searchQuery || m.clinic.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
        {all.map((m) => {
          const Icon = m.clinic.isPhysical ? Building2 : Home;
          return (
            <button
              key={m.clinic.id}
              onClick={() => navigate(`/operations/clinics/${m.clinic.id}`)}
              className="text-left bg-card rounded-xl border border-border/60 p-4 hover:border-primary/40 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{m.clinic.name}</h3>
                    <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {m.clinic.state}
                    </p>
                  </div>
                </div>
                <StatusBadge status={m.clinic.status} variant={clinicStatusVariant(m.clinic.status)} />
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <Tile label="Active Clients" value={m.activeClients} />
                <Tile label="Pending Starts" value={m.pendingStarts} tone={m.pendingStarts >= 5 ? "warning" : "default"} />
                <Tile label="Staffing Needed" value={m.staffingNeeded} tone={m.staffingNeeded >= 5 ? "destructive" : m.staffingNeeded >= 3 ? "warning" : "default"} />
                <Tile label="Assessments / Wk" value={m.assessmentsThisWeek} />
              </div>

              {m.clinic.isPhysical && (
                <div className="mt-4 pt-3 border-t border-border/40">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
                    <span>Capacity</span>
                    <span className="tabular-nums">
                      {m.activeClients} / {m.clinic.capacity}
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        m.utilizationPct >= 95
                          ? "bg-destructive"
                          : m.utilizationPct >= 75
                            ? "bg-warning"
                            : "bg-success",
                      )}
                      style={{ width: `${Math.min(m.utilizationPct, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {m.alerts.length > 0 && (
                <div className="mt-3 space-y-1">
                  {m.alerts.slice(0, 2).map((a) => (
                    <div
                      key={a.message}
                      className={cn(
                        "flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-md",
                        a.level === "destructive"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-warning/10 text-warning",
                      )}
                    >
                      <AlertTriangle className="h-3 w-3" />
                      {a.message}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3 flex items-center justify-end text-[11px] text-muted-foreground group-hover:text-primary transition-colors">
                Open clinic <ArrowRight className="h-3 w-3 ml-1" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Tile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "warning" | "destructive";
}) {
  const toneClass =
    tone === "destructive" ? "text-destructive" : tone === "warning" ? "text-warning" : "text-foreground";
  return (
    <div className="bg-secondary/30 rounded-lg border border-border/40 p-2.5">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("text-xl font-semibold mt-0.5 tabular-nums", toneClass)}>{value}</p>
    </div>
  );
}
