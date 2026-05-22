import { Search, Filter, Upload, FolderUp, Download, Table as TableIcon, Layers, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DocViewMode = "table" | "grouped" | "timeline";

const savedViews = [
  { id: "all", label: "All Documents" },
  { id: "missing", label: "Missing", critical: true },
  { id: "intake", label: "Intake" },
  { id: "consent", label: "Consent Forms" },
  { id: "insurance-vob", label: "Insurance / VOB" },
  { id: "treatment-plans", label: "Treatment Plans" },
  { id: "qa", label: "QA Documents" },
  { id: "recent", label: "Recently Uploaded" },
];

interface Props {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  activeView: string;
  onActiveViewChange: (v: string) => void;
  viewMode: DocViewMode;
  onViewModeChange: (v: DocViewMode) => void;
}

export function DocumentControlBar({
  searchQuery, onSearchChange, activeView, onActiveViewChange, viewMode, onViewModeChange,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search className="absolute z-10 left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search client, lead, file name…"
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
            <ModeBtn current={viewMode} mode="table" onClick={onViewModeChange} icon={TableIcon} label="Table" />
            <ModeBtn current={viewMode} mode="grouped" onClick={onViewModeChange} icon={Layers} label="Grouped" />
            <ModeBtn current={viewMode} mode="timeline" onClick={onViewModeChange} icon={Clock} label="Timeline" />
          </div>
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <Download className="h-3.5 w-3.5 mr-1.5" /> Export
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <FolderUp className="h-3.5 w-3.5 mr-1.5" /> Bulk Upload
          </Button>
          <Button size="sm" className="h-8 text-xs">
            <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload Document
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
  current: DocViewMode;
  mode: DocViewMode;
  onClick: (m: DocViewMode) => void;
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
