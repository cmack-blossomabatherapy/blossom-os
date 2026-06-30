import { Search, Filter, RefreshCw, Plus, KanbanSquare, ListTodo, Table2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CandidateRole } from "@/data/recruiting";

export type RecruitingViewMode = "pipeline" | "queue" | "table";

interface Props {
  viewMode: RecruitingViewMode;
  onViewModeChange: (m: RecruitingViewMode) => void;
  role: CandidateRole;
  onRoleChange: (r: CandidateRole) => void;
  activeView: string;
  onActiveViewChange: (v: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSync: () => void;
  syncing?: boolean;
}

const savedViews = [
  { id: "all", label: "All" },
  { id: "new", label: "New from Apploi" },
  { id: "interviewing", label: "Interviewing" },
  { id: "offer", label: "Offer Stage" },
  { id: "onboarding", label: "Onboarding" },
  { id: "stuck", label: "Stuck > 10 days" },
  { id: "ready", label: "Ready for Staffing" },
  { id: "missing-data", label: "Missing Interview Data" },
];

const viewModes: { id: RecruitingViewMode; label: string; icon: typeof KanbanSquare }[] = [
  { id: "pipeline", label: "Pipeline", icon: KanbanSquare },
  { id: "queue", label: "Queue", icon: ListTodo },
  { id: "table", label: "Table", icon: Table2 },
];

export function RecruitingControlBar({
  viewMode, onViewModeChange, role, onRoleChange,
  activeView, onActiveViewChange, searchQuery, onSearchChange,
  onSync, syncing,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="absolute z-10 left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search candidate, recruiter, or job..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Button variant="outline" size="sm" className="h-9">
          <Filter className="h-4 w-4 mr-1.5" /> Filters
        </Button>
        <div className="flex items-center gap-1 bg-muted rounded-md p-1">
          {(["RBT", "BCBA"] as const).map((r) => (
            <button
              key={r}
              onClick={() => onRoleChange(r)}
              className={cn(
                "px-3 h-7 text-xs font-medium rounded transition-colors",
                role === r
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {r}
            </button>
          ))}
        </div>
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
        <Button variant="outline" size="sm" className="h-9" onClick={onSync} disabled={syncing}>
          <RefreshCw className={cn("h-4 w-4 mr-1.5", syncing && "animate-spin")} />
          Import from Apploi
        </Button>
        <Button size="sm" className="h-9">
          <Plus className="h-4 w-4 mr-1.5" /> Add Candidate
        </Button>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
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
