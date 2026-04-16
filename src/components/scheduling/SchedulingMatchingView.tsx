import { useState } from "react";
import { Sparkles, MapPin, Clock, Award, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { mockRBTs, suggestMatches, type SchedulingClientStatus } from "@/data/scheduling";

interface Props {
  items: SchedulingClientStatus[];
  onSelect: (clientId: string) => void;
}

export function SchedulingMatchingView({ items, onSelect }: Props) {
  const needStaffing = items.filter(
    (i) => !i.client.rbt && (i.client.stage === "Staffing Needed" || i.client.stage === "Pending Start Date" || i.client.stage === "Restaffing Needed"),
  );
  const [selectedId, setSelectedId] = useState<string | null>(needStaffing[0]?.client.id ?? null);
  const selected = needStaffing.find((i) => i.client.id === selectedId);
  const suggestions = selected ? suggestMatches(selected.client) : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Left: Client needs */}
      <div className="lg:col-span-4 bg-card rounded-xl border border-border/60 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Client Needs</h3>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{needStaffing.length}</span>
        </div>
        <div className="space-y-1.5">
          {needStaffing.length === 0 && (
            <p className="text-xs text-muted-foreground italic">No clients awaiting staffing</p>
          )}
          {needStaffing.map((i) => (
            <button
              key={i.client.id}
              onClick={() => setSelectedId(i.client.id)}
              className={cn(
                "w-full text-left p-3 rounded-lg border transition-colors",
                selectedId === i.client.id
                  ? "bg-primary/10 border-primary/40"
                  : "bg-secondary/30 border-border/40 hover:border-primary/30",
              )}
            >
              <p className="text-sm font-medium text-foreground">{i.client.childName}</p>
              <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {i.client.state} · {i.client.clinic}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  20 hrs/wk
                </span>
                <span className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] font-medium",
                  i.client.daysInStage > 5 ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground",
                )}>
                  {i.client.daysInStage}d waiting
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Middle: Suggested matches */}
      <div className="lg:col-span-4 bg-card rounded-xl border border-border/60 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Suggested Matches
        </h3>
        {!selected && <p className="text-xs text-muted-foreground italic">Select a client</p>}
        {selected && suggestions.length === 0 && (
          <p className="text-xs text-muted-foreground italic">No RBTs available in {selected.client.state}</p>
        )}
        {selected &&
          suggestions.map((rbt, idx) => (
            <div
              key={rbt.id}
              className="p-3 rounded-lg bg-gradient-to-br from-primary/5 to-transparent border border-primary/20 space-y-2"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{rbt.name}</p>
                    {idx === 0 && (
                      <span className="text-[10px] font-semibold uppercase bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                        Top match
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {rbt.clinic} · {rbt.experience}
                  </p>
                </div>
                <span className="text-[11px] font-medium text-success">
                  {rbt.capacityHours - rbt.assignedHours}h available
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" className="h-7 text-xs flex-1">
                  Assign <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs">
                  Tentative
                </Button>
              </div>
            </div>
          ))}
      </div>

      {/* Right: All RBT supply */}
      <div className="lg:col-span-4 bg-card rounded-xl border border-border/60 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">RBT Supply</h3>
        <div className="space-y-1.5 max-h-[600px] overflow-y-auto">
          {mockRBTs.map((rbt) => {
            const utilization = (rbt.assignedHours / rbt.capacityHours) * 100;
            return (
              <div key={rbt.id} className="p-2.5 rounded-lg bg-secondary/30 border border-border/40">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{rbt.name}</p>
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Award className="h-3 w-3" /> {rbt.experience}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {rbt.state} · {rbt.clinic}
                </p>
                <div className="mt-1.5 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{rbt.assignedHours}h / {rbt.capacityHours}h</span>
                    <span>{Math.round(utilization)}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        utilization >= 95 ? "bg-destructive" : utilization >= 75 ? "bg-warning" : "bg-success",
                      )}
                      style={{ width: `${Math.min(utilization, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-1.5">
                  {rbt.availability.map((a) => (
                    <span key={a} className="text-[9px] uppercase bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
