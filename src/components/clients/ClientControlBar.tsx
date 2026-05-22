import { Search, Plus, Download, LayoutList, ListChecks, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ClientFilterPopover, ClientFilters } from "./ClientFilterPopover";

export type ClientViewMode = "table" | "queue";

interface SavedView { label: string; id: string }

const savedViews: SavedView[] = [
  { label: "All Clients", id: "all" },
  { label: "My Clients", id: "mine" },
  { label: "Needs Action", id: "action" },
  { label: "Pending Start", id: "pending-start" },
  { label: "Staffing Needed", id: "staffing" },
  { label: "QA Queue", id: "qa" },
  { label: "Pending Tx Auth", id: "tx-auth" },
  { label: "Active Clients", id: "active" },
];

interface Props {
  viewMode: ClientViewMode;
  onViewModeChange: (m: ClientViewMode) => void;
  activeView: string;
  onActiveViewChange: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filters: ClientFilters;
  onFiltersChange: (f: ClientFilters) => void;
  filterOptions: Parameters<typeof ClientFilterPopover>[0]["options"];
  onNewClient: () => void;
  onExport: () => void;
}

export function ClientControlBar({
  viewMode, onViewModeChange, activeView, onActiveViewChange,
  searchQuery, onSearchChange, filters, onFiltersChange, filterOptions,
  onNewClient, onExport,
}: Props) {
  return (
    <div className="space-y-3 sticky top-0 z-30 bg-background/85 backdrop-blur-xl pt-1 pb-3 -mx-1 px-1 border-b border-border/40">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute z-10 left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by client, parent, ID, BCBA, RBT..."
            className="pl-8 h-9 text-sm"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <ClientFilterPopover filters={filters} onChange={onFiltersChange} options={filterOptions} />

        <div className="flex-1" />

        <div className="flex items-center gap-1 border border-border rounded-lg p-0.5 bg-card">
          {([
            { mode: "table" as const, icon: LayoutList, label: "Table" },
            { mode: "queue" as const, icon: ListChecks, label: "Queue" },
          ]).map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => onViewModeChange(mode)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                viewMode === mode
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs" onClick={onExport}>
          <Download className="h-3 w-3" /> Export
        </Button>
        <Button size="sm" className="h-9 gap-1.5" onClick={onNewClient}>
          <Plus className="h-3.5 w-3.5" /> New Client
        </Button>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto">
        <Sparkles className="h-3 w-3 text-muted-foreground flex-shrink-0" />
        {savedViews.map((v) => (
          <button
            key={v.id}
            onClick={() => onActiveViewChange(v.id)}
            className={cn(
              "px-3 py-1 rounded-lg text-xs font-medium transition-colors flex-shrink-0",
              activeView === v.id
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent",
            )}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
}
