import { Search, Filter, Plus, Upload, Power, List, Workflow, AlertOctagon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type AutomationViewMode = "list" | "flow" | "logs";

const savedViews = [
  { id: "all", label: "All Automations" },
  { id: "high-impact", label: "High Impact" },
  { id: "failed", label: "Failed", critical: true },
  { id: "paused", label: "Paused" },
  { id: "intake", label: "Intake" },
  { id: "client", label: "Client" },
  { id: "auth", label: "Auth" },
  { id: "qa", label: "QA" },
  { id: "scheduling", label: "Scheduling & Staffing" },
];

interface Props {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  activeView: string;
  onActiveViewChange: (v: string) => void;
  viewMode: AutomationViewMode;
  onViewModeChange: (v: AutomationViewMode) => void;
}

export function AutomationControlBar({
  searchQuery, onSearchChange, activeView, onActiveViewChange, viewMode, onViewModeChange,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search name, trigger, action…"
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
            <ModeBtn current={viewMode} mode="list" onClick={onViewModeChange} icon={List} label="List" />
            <ModeBtn current={viewMode} mode="flow" onClick={onViewModeChange} icon={Workflow} label="Flow" />
            <ModeBtn current={viewMode} mode="logs" onClick={onViewModeChange} icon={AlertOctagon} label="Logs" />
          </div>
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <Upload className="h-3.5 w-3.5 mr-1.5" /> Import
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <Power className="h-3.5 w-3.5 mr-1.5" /> Bulk Toggle
          </Button>
          <Button size="sm" className="h-8 text-xs">
            <Plus className="h-3.5 w-3.5 mr-1.5" /> New Automation
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
  current: AutomationViewMode;
  mode: AutomationViewMode;
  onClick: (m: AutomationViewMode) => void;
  icon: typeof List;
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
