import { Search, Filter, Plus, Layers, Table as TableIcon, Clock, ListChecks, MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type TaskViewMode = "queue" | "table" | "timeline" | "workflow";

const savedViews = [
  { id: "my-tasks", label: "My Tasks" },
  { id: "today", label: "Today" },
  { id: "overdue", label: "Overdue", critical: true },
  { id: "blockers", label: "Blockers", critical: true },
  { id: "intake", label: "Intake" },
  { id: "auth", label: "Auth" },
  { id: "qa", label: "QA" },
  { id: "scheduling", label: "Scheduling" },
  { id: "staffing", label: "Staffing" },
  { id: "all", label: "All Tasks" },
];

interface Props {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  activeView: string;
  onActiveViewChange: (v: string) => void;
  viewMode: TaskViewMode;
  onViewModeChange: (v: TaskViewMode) => void;
}

export function TaskControlBar({
  searchQuery, onSearchChange, activeView, onActiveViewChange, viewMode, onViewModeChange,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search className="absolute z-10 left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search task, client, lead, auth…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Button variant="outline" size="sm" className="h-8 text-xs">
          <Filter className="h-3.5 w-3.5 mr-1.5" />
          Filters
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-0.5 bg-muted rounded-md p-1">
            <ModeBtn current={viewMode} mode="queue" onClick={onViewModeChange} icon={ListChecks} label="Queue" />
            <ModeBtn current={viewMode} mode="table" onClick={onViewModeChange} icon={TableIcon} label="Table" />
            <ModeBtn current={viewMode} mode="timeline" onClick={onViewModeChange} icon={Clock} label="Timeline" />
            <ModeBtn current={viewMode} mode="workflow" onClick={onViewModeChange} icon={Layers} label="Workflow" />
          </div>
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <MoreHorizontal className="h-3.5 w-3.5 mr-1.5" /> Bulk
          </Button>
          <Button size="sm" className="h-8 text-xs">
            <Plus className="h-3.5 w-3.5 mr-1.5" /> New Task
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {savedViews.map((v) => (
          <button
            key={v.id}
            onClick={() => onActiveViewChange(v.id)}
            className={cn(
              "px-2.5 h-7 text-xs font-medium rounded-md whitespace-nowrap transition-colors border",
              activeView === v.id
                ? v.critical
                  ? "bg-destructive/10 text-destructive border-destructive/30"
                  : "bg-primary/10 text-primary border-primary/30"
                : v.critical
                  ? "bg-card text-destructive border-destructive/20 hover:border-destructive/40"
                  : "bg-card text-muted-foreground hover:text-foreground border-border/60",
            )}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ModeBtn({
  current, mode, onClick, icon: Icon, label,
}: {
  current: TaskViewMode;
  mode: TaskViewMode;
  onClick: (m: TaskViewMode) => void;
  icon: typeof TableIcon;
  label: string;
}) {
  return (
    <button
      onClick={() => onClick(mode)}
      className={cn(
        "px-2.5 h-6 text-xs font-medium rounded inline-flex items-center gap-1.5 transition-colors",
        current === mode ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}
