import { Search, Filter, Plus, Table as TableIcon, ListTodo, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CallViewMode = "table" | "queue" | "timeline";

const savedViews = [
  { id: "all", label: "All Calls" },
  { id: "new", label: "New Calls" },
  { id: "needs-followup", label: "Needs Follow-Up" },
  { id: "unlinked", label: "Unlinked" },
  { id: "connected", label: "Connected" },
  { id: "lead", label: "Lead Calls" },
  { id: "client", label: "Client Calls" },
];

interface Props {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  activeView: string;
  onActiveViewChange: (v: string) => void;
  viewMode: CallViewMode;
  onViewModeChange: (v: CallViewMode) => void;
}

export function CallControlBar({
  searchQuery,
  onSearchChange,
  activeView,
  onActiveViewChange,
  viewMode,
  onViewModeChange,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-0 sm:min-w-[240px] max-w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search phone, name, lead, client…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Button variant="outline" size="sm" className="h-8 text-xs shrink-0">
          <Filter className="h-3.5 w-3.5 mr-1.5" />
          Filters
        </Button>
        <div className="ml-auto flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-0.5 bg-muted rounded-md p-1">
            <ModeBtn current={viewMode} mode="table" onClick={onViewModeChange} icon={TableIcon} label="Table" />
            <ModeBtn current={viewMode} mode="queue" onClick={onViewModeChange} icon={ListTodo} label="Queue" />
            <ModeBtn current={viewMode} mode="timeline" onClick={onViewModeChange} icon={Clock} label="Timeline" />
          </div>
          <Button size="sm" className="h-8 text-xs shrink-0">
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Log Call
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
                ? "bg-primary/10 text-primary border-primary/30"
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
  current: CallViewMode;
  mode: CallViewMode;
  onClick: (m: CallViewMode) => void;
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
