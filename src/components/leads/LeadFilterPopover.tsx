import { Filter, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
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
  const [open, setOpen] = useState(false);
  const totalActive = Object.values(filters).reduce((acc, arr) => acc + arr.length, 0);

  const toggle = (field: keyof LeadFilters, value: string) => {
    const current = filters[field];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    onChange({ ...filters, [field]: next });
  };

  const clearAll = () => onChange({ states: [], sources: [], owners: [], insurances: [], priorities: [] });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs relative">
          <Filter className="h-3 w-3" /> Filters
          {totalActive > 0 && (
            <Badge variant="secondary" className="h-4 px-1.5 ml-0.5 text-[10px]">{totalActive}</Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="max-h-[88dvh] rounded-t-2xl border-x-0 border-b-0 p-0"
      >
        <div className="mx-auto flex h-full max-w-3xl flex-col">
          <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/30" />
          <SheetHeader className="flex-row items-center justify-between space-y-0 px-5 pb-3 pt-3 text-left">
            <div>
              <SheetTitle className="text-base">Filter leads</SheetTitle>
              <p className="text-xs text-muted-foreground">
                {totalActive === 0 ? "No filters active" : `${totalActive} active filter${totalActive === 1 ? "" : "s"}`}
              </p>
            </div>
            {totalActive > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAll} className="h-8 gap-1 text-xs">
                <X className="h-3 w-3" /> Clear
              </Button>
            )}
          </SheetHeader>
          <div className="flex-1 space-y-4 overflow-y-auto border-t border-border/60 px-5 py-4">
            {(Object.keys(options) as (keyof LeadFilters)[]).map((field) => (
              <div key={field}>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {fieldLabels[field]}
                </p>
                <div className="flex flex-wrap gap-2">
                  {options[field].map((opt) => {
                    const active = filters[field].includes(opt);
                    return (
                      <button
                        key={opt}
                        onClick={() => toggle(field, opt)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-foreground hover:border-primary/40",
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
          <SheetFooter className="flex-row gap-2 border-t border-border/60 bg-background px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            <Button variant="outline" className="flex-1" onClick={clearAll} disabled={totalActive === 0}>
              Clear all
            </Button>
            <Button className="flex-1" onClick={() => setOpen(false)}>
              Apply{totalActive > 0 ? ` (${totalActive})` : ""}
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
