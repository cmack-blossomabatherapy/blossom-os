import { Search, Filter, Plus, Settings2, Users, Activity, Network, BarChart3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { AddTeamMemberDialog } from "./AddTeamMemberDialog";

export type TeamViewMode = "directory" | "workload" | "org" | "performance";

const savedViews = [
  { id: "all", label: "All Team" },
  { id: "my-team", label: "My Team" },
  { id: "leadership", label: "Leadership" },
  { id: "intake", label: "Intake" },
  { id: "auth", label: "Auth" },
  { id: "qa", label: "QA" },
  { id: "scheduling", label: "Scheduling" },
  { id: "staffing", label: "Staffing" },
  { id: "clinics", label: "Clinics" },
];

interface Props {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  activeView: string;
  onActiveViewChange: (v: string) => void;
  viewMode: TeamViewMode;
  onViewModeChange: (m: TeamViewMode) => void;
}

export function TeamControlBar({
  searchQuery, onSearchChange, activeView, onActiveViewChange, viewMode, onViewModeChange,
}: Props) {
  const [inviteOpen, setInviteOpen] = useState(false);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search name, role, department…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Button variant="outline" size="sm" className="h-8 text-xs">
          <Filter className="h-3.5 w-3.5 mr-1.5" /> Filters
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-0.5 bg-muted rounded-md p-1">
            <ModeBtn current={viewMode} mode="directory" onClick={onViewModeChange} icon={Users} label="Directory" />
            <ModeBtn current={viewMode} mode="workload" onClick={onViewModeChange} icon={Activity} label="Workload" />
            <ModeBtn current={viewMode} mode="org" onClick={onViewModeChange} icon={Network} label="Org Chart" />
            <ModeBtn current={viewMode} mode="performance" onClick={onViewModeChange} icon={BarChart3} label="Performance" />
          </div>
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <Settings2 className="h-3.5 w-3.5 mr-1.5" /> Bulk Actions
          </Button>
          <Button size="sm" className="h-8 text-xs" onClick={() => setInviteOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Team Member
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
      <AddTeamMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  );
}

function ModeBtn({
  current, mode, onClick, icon: Icon, label,
}: {
  current: TeamViewMode;
  mode: TeamViewMode;
  onClick: (m: TeamViewMode) => void;
  icon: typeof Users;
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
