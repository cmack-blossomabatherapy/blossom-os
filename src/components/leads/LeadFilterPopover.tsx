import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface LeadFilters {
  states: string[];
  sources: string[];
  owners: string[];
  insurances: string[];
  priorities: string[];
}

interface LeadFilterPopoverProps {
  filters: LeadFilters;
  onChange: (f: LeadFilters) => void;
  options: {
    states: string[];
    sources: string[];
    owners: string[];
    insurances: string[];
    priorities: string[];
  };
}

const fieldLabels: Record<keyof LeadFilters, string> = {
  states: "State",
  sources: "Source",
  owners: "Coordinator",
  insurances: "Insurance",
  priorities: "Priority",
};

export function LeadFilterPopover({ filters, onChange, options }: LeadFilterPopoverProps) {
  const totalActive = Object.values(filters).reduce((acc, arr) => acc + arr.length, 0);

  const toggle = (field: keyof LeadFilters, value: string) => {
    const current = filters[field];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    onChange({ ...filters, [field]: next });
  };

  const clearAll = () => onChange({ states: [], sources: [], owners: [], insurances: [], priorities: [] });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs relative">
          <Filter className="h-3 w-3" /> Filters
          {totalActive > 0 && (
            <Badge variant="secondary" className="h-4 px-1.5 ml-0.5 text-[10px]">{totalActive}</Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0" align="start">
        <div className="flex items-center justify-between px-4 py-2.5 border-b">
          <p className="text-sm font-semibold">Filter leads</p>
          {totalActive > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAll} className="h-7 text-xs gap-1">
              <X className="h-3 w-3" /> Clear all
            </Button>
          )}
        </div>
        <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
          {(Object.keys(options) as (keyof LeadFilters)[]).map((field) => (
            <div key={field}>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                {fieldLabels[field]}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {options[field].map((opt) => {
                  const active = filters[field].includes(opt);
                  return (
                    <button
                      key={opt}
                      onClick={() => toggle(field, opt)}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-xs border transition-colors",
                        active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-foreground border-border hover:border-primary/40",
                      )}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
