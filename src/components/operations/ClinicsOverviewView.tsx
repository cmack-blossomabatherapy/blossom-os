import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, MapPin, AlertTriangle, ArrowRight, Home } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import { getAllClinicMetrics, clinicStatusVariant, type ClinicMetrics } from "@/data/clinics";
import { mockClients } from "@/data/clients";

type LocationFilter = "all" | "physical" | "in-home";

export function ClinicsOverviewView({ searchQuery }: { searchQuery: string }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<LocationFilter>("all");

  const all = getAllClinicMetrics();

  const filtered = all.filter((m) => {
    if (filter === "physical" && !m.clinic.isPhysical) return false;
    if (filter === "in-home" && m.clinic.isPhysical) return false;
    if (searchQuery && !m.clinic.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const counts = {
    all: all.length,
    physical: all.filter((m) => m.clinic.isPhysical).length,
    "in-home": all.filter((m) => !m.clinic.isPhysical).length,
  };

  const showInHomeBreakdown = filter === "all" || filter === "in-home";

  return (
    <div className="space-y-4">
      {/* Multi-state filter */}
      <div className="flex items-center gap-1 bg-muted/40 rounded-md p-1 w-fit">
        <FilterBtn current={filter} value="all" onClick={setFilter} count={counts.all}>
          All Locations
        </FilterBtn>
        <FilterBtn current={filter} value="physical" onClick={setFilter} count={counts.physical}>
          Physical (GA)
        </FilterBtn>
        <FilterBtn current={filter} value="in-home" onClick={setFilter} count={counts["in-home"]}>
          In-Home (TX · AZ · GA)
        </FilterBtn>
      </div>

      {showInHomeBreakdown && <InHomeStateBreakdown />}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((m) => {
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

        {filtered.length === 0 && (
          <div className="col-span-full bg-card rounded-xl border border-dashed border-border/60 p-8 text-center">
            <p className="text-xs text-muted-foreground italic">
              No locations match the current filter
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterBtn({
  current,
  value,
  onClick,
  count,
  children,
}: {
  current: LocationFilter;
  value: LocationFilter;
  onClick: (v: LocationFilter) => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={() => onClick(value)}
      className={cn(
        "h-7 px-2.5 text-xs font-medium rounded inline-flex items-center gap-1.5 transition-colors",
        current === value
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
      <span
        className={cn(
          "text-[10px] tabular-nums px-1 rounded font-semibold",
          current === value ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
        )}
      >
        {count}
      </span>
    </button>
  );
}

function InHomeStateBreakdown() {
  // Group remote (in-home) clients by state, regardless of which "clinic" record holds them
  const breakdown = useMemo(() => {
    const remoteClients = mockClients.filter((c) => c.clinic === "Remote");
    const byState = new Map<
      string,
      { state: string; total: number; active: number; pending: number; staffing: number }
    >();
    remoteClients.forEach((c) => {
      const cur = byState.get(c.state) ?? {
        state: c.state,
        total: 0,
        active: 0,
        pending: 0,
        staffing: 0,
      };
      cur.total += 1;
      if (c.stage === "Active") cur.active += 1;
      if (c.stage === "Pending Start Date") cur.pending += 1;
      if (c.stage === "Staffing Needed" || c.stage === "Restaffing Needed") cur.staffing += 1;
      byState.set(c.state, cur);
    });
    return Array.from(byState.values()).sort((a, b) => b.total - a.total);
  }, []);

  if (breakdown.length === 0) return null;

  return (
    <div className="bg-card rounded-xl border border-border/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground inline-flex items-center gap-1.5">
            <Home className="h-3.5 w-3.5 text-primary" />
            In-Home Services · State Breakdown
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Multi-state coverage for remote / in-home delivery
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {breakdown.map((s) => (
          <div
            key={s.state}
            className="rounded-lg border border-border/40 bg-secondary/30 p-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-foreground bg-muted px-1.5 py-0.5 rounded">
                {s.state}
              </span>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {s.total} clients
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1 mt-2">
              <MiniStat label="Active" value={s.active} />
              <MiniStat label="Pending" value={s.pending} tone={s.pending >= 3 ? "warning" : "default"} />
              <MiniStat label="Staffing" value={s.staffing} tone={s.staffing >= 3 ? "destructive" : "default"} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniStat({
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
    <div className="text-center">
      <p className={cn("text-sm font-semibold tabular-nums", toneClass)}>{value}</p>
      <p className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</p>
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

// silence unused export warning
export type { ClinicMetrics };
