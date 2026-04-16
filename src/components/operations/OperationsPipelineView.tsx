import { useNavigate } from "react-router-dom";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { opsLanes, getOpsItems, type OpsItem, type OpsLaneId } from "@/data/operations";

interface Props {
  searchQuery: string;
  highlightLane?: OpsLaneId | "blocked" | "all";
}

export function OperationsPipelineView({ searchQuery, highlightLane = "all" }: Props) {
  const navigate = useNavigate();
  const all = getOpsItems();
  const filtered = all.filter((i) => {
    if (searchQuery && !i.primaryName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (highlightLane === "blocked") return i.blockers.length > 0;
    return true;
  });

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-3 min-w-max">
        {opsLanes.map((lane) => {
          const items = filtered.filter((i) => i.laneId === lane.id);
          const isFocus =
            highlightLane === "all" || highlightLane === "blocked" || highlightLane === lane.id;
          return (
            <div
              key={lane.id}
              className={cn(
                "w-[280px] shrink-0 bg-secondary/30 rounded-xl border transition-all",
                isFocus ? "border-border/60" : "border-border/30 opacity-50",
              )}
            >
              <div className="px-3 py-2.5 border-b border-border/50 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">
                    {lane.title}
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{lane.description}</p>
                </div>
                <span className="text-[11px] font-medium text-muted-foreground bg-background border border-border/60 px-1.5 py-0.5 rounded">
                  {items.length}
                </span>
              </div>
              <div className="p-2 space-y-1.5 max-h-[calc(100vh-340px)] overflow-y-auto">
                {items.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground italic text-center py-4">Empty</p>
                ) : (
                  items.map((item) => <OpsCard key={`${item.kind}-${item.id}`} item={item} onClick={() => navigate(item.href)} />)
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OpsCard({ item, onClick }: { item: OpsItem; onClick: () => void }) {
  const aging = item.daysInStage > 7 ? "destructive" : item.daysInStage > 3 ? "warning" : "muted";
  const kindAccent = {
    lead: "border-l-info",
    client: "border-l-primary",
    qa: "border-l-warning",
  }[item.kind];

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-2.5 rounded-md bg-card border border-border/50 border-l-2 hover:border-primary/40 transition-colors group",
        kindAccent,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground truncate flex-1">{item.primaryName}</p>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </div>
      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{item.stage}</p>
      <div className="flex items-center justify-between mt-1.5 gap-2">
        <span className="text-[10px] text-muted-foreground truncate">{item.owner} · {item.state}</span>
        <span
          className={cn(
            "text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0",
            aging === "destructive" ? "bg-destructive/10 text-destructive" : aging === "warning" ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground",
          )}
        >
          {item.daysInStage}d
        </span>
      </div>
      {item.blockers.length > 0 && (
        <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-destructive">
          <AlertTriangle className="h-3 w-3" />
          {item.blockers[0]}
          {item.blockers.length > 1 && <span className="text-muted-foreground">+{item.blockers.length - 1}</span>}
        </div>
      )}
    </button>
  );
}
