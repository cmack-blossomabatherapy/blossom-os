import { Calendar, Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DateRange } from "@/data/reports";

const dateRanges: { id: DateRange; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "quarter", label: "Quarter" },
  { id: "custom", label: "Custom" },
];

const savedViews = [
  { id: "executive", label: "Executive Overview" },
  { id: "intake", label: "Intake" },
  { id: "auth", label: "Authorization" },
  { id: "credentialing", label: "Credentialing" },
  { id: "qa", label: "QA" },
  { id: "scheduling", label: "Scheduling & Staffing" },
  { id: "lifecycle", label: "Client Lifecycle" },
  { id: "revenue", label: "Revenue Pipeline" },
  { id: "team", label: "Team Performance" },
  { id: "growth", label: "Growth Trends" },
];

interface Props {
  dateRange: DateRange;
  onDateRangeChange: (r: DateRange) => void;
  activeView: string;
  onActiveViewChange: (v: string) => void;
}

export function ReportsControlBar({ dateRange, onDateRangeChange, activeView, onActiveViewChange }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-0.5 bg-muted rounded-md p-1">
          {dateRanges.map((r) => (
            <button
              key={r.id}
              onClick={() => onDateRangeChange(r.id)}
              className={cn(
                "px-2.5 h-6 text-xs font-medium rounded inline-flex items-center gap-1.5 transition-colors",
                dateRange === r.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {r.id === "custom" && <Calendar className="h-3 w-3" />}
              {r.label}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" className="h-8 text-xs">
          <Filter className="h-3.5 w-3.5 mr-1.5" />
          State · Clinic · Payor · Owner
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <Download className="h-3.5 w-3.5 mr-1.5" /> Export
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
