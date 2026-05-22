import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  activeView: string;
  onActiveViewChange: (v: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

const savedViews = [
  { id: "all", label: "All Operations" },
  { id: "intake", label: "Intake" },
  { id: "initial-auth", label: "Initial Auth" },
  { id: "assessment", label: "Assessment" },
  { id: "qa", label: "QA" },
  { id: "treatment-auth", label: "Treatment Auth" },
  { id: "staffing", label: "Staffing" },
  { id: "start", label: "Ready to Start" },
  { id: "blocked", label: "Blocked Items" },
  { id: "clinics", label: "Clinics" },
];

export function OperationsControlBar({ activeView, onActiveViewChange, searchQuery, onSearchChange }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="absolute z-10 left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search client, owner, payor..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Button variant="outline" size="sm" className="h-9">
          <Filter className="h-4 w-4 mr-1.5" /> Filters
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
