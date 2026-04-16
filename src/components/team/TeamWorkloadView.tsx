import { AlertTriangle, TrendingDown } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import {
  type TeamMember,
  departmentVariant,
  workloadVariant,
  capacityColor,
  capacityTextColor,
} from "@/data/team";

interface Props {
  members: TeamMember[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function TeamWorkloadView({ members, selectedId, onSelect }: Props) {
  const overloaded = members.filter((m) => m.workloadLevel === "Overloaded");
  const underutilized = members.filter((m) => m.workloadLevel === "Light" && m.status === "Active");

  // Sort by capacity descending
  const sorted = [...members].sort((a, b) => b.capacityPct - a.capacityPct);

  return (
    <div className="space-y-4">
      {/* Balancer alerts */}
      {(overloaded.length > 0 || underutilized.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {overloaded.length > 0 && (
            <BalancerCard
              tone="destructive"
              icon={AlertTriangle}
              title={`${overloaded.length} overloaded`}
              members={overloaded}
              hint="Reassign work to balance load"
              onSelect={onSelect}
            />
          )}
          {underutilized.length > 0 && (
            <BalancerCard
              tone="muted"
              icon={TrendingDown}
              title={`${underutilized.length} underutilized`}
              members={underutilized}
              hint="Available capacity for more work"
              onSelect={onSelect}
            />
          )}
        </div>
      )}

      {/* Workload bars */}
      <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
        <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Workload by Capacity</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Sorted by current load · click to view profile</p>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <Legend color="bg-muted-foreground/40" label="Light" />
            <Legend color="bg-success" label="Normal" />
            <Legend color="bg-warning" label="High" />
            <Legend color="bg-destructive" label="Overloaded" />
          </div>
        </div>
        <div className="divide-y divide-border/30">
          {sorted.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              className={cn(
                "w-full text-left px-4 py-3 hover:bg-muted/20 transition-colors flex items-center gap-4",
                selectedId === t.id && "bg-primary/5",
              )}
            >
              <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                {t.initials}
              </div>
              <div className="min-w-[180px] shrink-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-foreground truncate">{t.name}</p>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <StatusBadge status={t.department} variant={departmentVariant(t.department)} />
                  <span className="text-[10px] text-muted-foreground">{t.role}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <Stat label="Leads" value={t.workload.leads} />
                    <Stat label="Clients" value={t.workload.clients} />
                    <Stat label="Auths" value={t.workload.auths} />
                    <Stat label="QA" value={t.workload.qa} />
                    <Stat label="Tasks" value={t.workload.tasksOpen} />
                    {t.workload.tasksOverdue > 0 && (
                      <Stat label="Overdue" value={t.workload.tasksOverdue} tone="destructive" />
                    )}
                  </div>
                  <span className={cn("text-xs font-semibold tabular-nums", capacityTextColor(t.capacityPct))}>
                    {t.capacityPct}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", capacityColor(t.capacityPct))}
                    style={{ width: `${Math.min(t.capacityPct, 100)}%` }}
                  />
                </div>
              </div>
              <div className="shrink-0">
                <StatusBadge status={t.workloadLevel} variant={workloadVariant(t.workloadLevel)} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function BalancerCard({
  tone, icon: Icon, title, hint, members, onSelect,
}: {
  tone: "destructive" | "muted";
  icon: typeof AlertTriangle;
  title: string;
  hint: string;
  members: TeamMember[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className={cn(
      "rounded-xl border p-3",
      tone === "destructive" ? "border-destructive/30 bg-destructive/5" : "border-border/60 bg-secondary/30",
    )}>
      <div className="flex items-center gap-2 mb-2">
        <div className={cn(
          "h-6 w-6 rounded-md inline-flex items-center justify-center",
          tone === "destructive" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground",
        )}>
          <Icon className="h-3 w-3" />
        </div>
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      </div>
      <p className="text-[11px] text-muted-foreground mb-2">{hint}</p>
      <div className="flex flex-wrap gap-1.5">
        {members.map((m) => (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            className={cn(
              "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors",
              tone === "destructive"
                ? "bg-card border-destructive/30 text-destructive hover:bg-destructive/10"
                : "bg-card border-border/60 text-foreground hover:bg-muted/30",
            )}
          >
            <span className="h-4 w-4 rounded-full bg-muted text-muted-foreground inline-flex items-center justify-center text-[8px] font-bold">
              {m.initials}
            </span>
            {m.name.split(" ")[0]} <span className="opacity-70">{m.capacityPct}%</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Stat({
  label, value, tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "destructive";
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="opacity-70">{label}</span>
      <span className={cn(
        "font-semibold tabular-nums",
        tone === "destructive" ? "text-destructive" : "text-foreground",
      )}>{value}</span>
    </span>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn("h-2 w-2 rounded-sm", color)} />
      {label}
    </span>
  );
}
