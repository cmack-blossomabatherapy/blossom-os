import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PrimaryReportFilters } from "@/lib/os/reports/crPrimary/types";
import { activeFilterCount } from "@/lib/os/reports/crPrimary/filters";

export type FilterKey = keyof PrimaryReportFilters;

export interface FilterFieldConfig {
  key: Exclude<FilterKey, "from" | "to">;
  label: string;
  options: string[];
}

/**
 * Working filter bar for the primary reports. Every change is pushed to the
 * host page which recomputes KPIs, charts, tables, and drilldowns.
 */
export function PrimaryFilterBar({
  filters,
  fields,
  onChange,
  onReset,
}: {
  filters: PrimaryReportFilters;
  fields: FilterFieldConfig[];
  onChange: (next: PrimaryReportFilters) => void;
  onReset: () => void;
}) {
  const set = (key: FilterKey, value: string) => onChange({ ...filters, [key]: value });
  const count = activeFilterCount(filters);

  return (
    <section
      data-testid="report-filters"
      className="flex flex-wrap items-end gap-2 rounded-2xl border border-border/60 bg-card/60 p-3"
    >
      <div className="space-y-1">
        <label htmlFor="filter-from" className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          From
        </label>
        <Input
          id="filter-from"
          type="date"
          value={filters.from}
          onChange={(e) => set("from", e.target.value)}
          className="h-8 w-[145px] text-xs"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="filter-to" className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          To
        </label>
        <Input
          id="filter-to"
          type="date"
          value={filters.to}
          onChange={(e) => set("to", e.target.value)}
          className="h-8 w-[145px] text-xs"
        />
      </div>

      {fields.map((f) => (
        <div key={f.key} className="space-y-1">
          <span className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {f.label}
          </span>
          <Select
            value={filters[f.key] || "__all"}
            onValueChange={(v) => set(f.key, v === "__all" ? "" : v)}
          >
            <SelectTrigger className="h-8 w-[165px] text-xs" aria-label={f.label}>
              <SelectValue placeholder={`All ${f.label}`} />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="__all">All {f.label}</SelectItem>
              {f.options.slice(0, 400).map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}

      <div className="ml-auto flex items-center gap-2 pb-0.5">
        {count > 0 && (
          <Badge variant="secondary" className="text-[10px]">
            {count} active filter{count === 1 ? "" : "s"}
          </Badge>
        )}
        <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={onReset}>
          <X className="h-3.5 w-3.5" /> Clear filters
        </Button>
      </div>
    </section>
  );
}