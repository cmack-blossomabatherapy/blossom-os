import { Search, Filter, Plus, ListTodo, Calendar, Grid3x3, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SchedulingViewMode = "queue" | "calendar" | "grid" | "matching";

interface Props {
  viewMode: SchedulingViewMode;
  onViewModeChange: (m: SchedulingViewMode) => void;
  activeView: string;
  onActiveViewChange: (v: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

const savedViews = [
  { id: "ready", label: "Needs Scheduling" },
  { id: "pending-start", label: "Ready for Start" },
  { id: "starting-soon", label: "Starting Soon" },
  { id: "delayed", label: "Delayed" },
  { id: "week", label: "Schedule Created" },
  { id: "active", label: "Active" },
];

const viewModes: { id: SchedulingViewMode; label: string; icon: typeof ListTodo }[] = [
  { id: "queue", label: "Queue", icon: ListTodo },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "grid", label: "Weekly Grid", icon: Grid3x3 },
  { id: "matching", label: "Matching", icon: Sparkles },
];

export function SchedulingControlBar({
  viewMode, onViewModeChange, activeView, onActiveViewChange, searchQuery, onSearchChange,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search client, BCBA, or RBT..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Button variant="outline" size="sm" className="h-9">
          <Filter className="h-4 w-4 mr-1.5" /> Filters
        </Button>
        <div className="flex-1" />
        <div className="flex items-center gap-1 bg-muted rounded-md p-1">
          {viewModes.map((m) => (
            <button
              key={m.id}
              onClick={() => onViewModeChange(m.id)}
              className={cn(
                "px-2.5 h-7 text-xs font-medium rounded inline-flex items-center gap-1.5 transition-colors",
                viewMode === m.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <m.icon className="h-3.5 w-3.5" />
              {m.label}
            </button>
          ))}
        </div>
        <Button size="sm" className="h-9">
          <Plus className="h-4 w-4 mr-1.5" /> Schedule Assessment
        </Button>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => onActiveViewChange("all")}
          className={cn(
            "px-3 h-7 text-xs font-medium rounded-md border transition-colors",
            activeView === "all"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-border/80",
          )}
        >
          All
        </button>
        {savedViews.map((v) => (
          <button
            key={v.id}
            onClick={() => onActiveViewChange(v.id)}
            className={cn(
              "px-3 h-7 text-xs font-medium rounded-md border transition-colors",
              activeView === v.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-border/80",
            )}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
}
