import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FilterCombobox } from "./FilterCombobox";
import { DateRangeFilter } from "./DateRangeFilter";
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
      className="space-y-3 rounded-2xl border border-border/60 bg-card p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Filter className="h-4 w-4 text-primary" /> Filters
          {count > 0 && (
            <Badge variant="secondary" className="rounded-full text-[10px]">
              {count} active
            </Badge>
          )}
        </span>
        {count > 0 && (
          <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={onReset}>
            <X className="h-3.5 w-3.5" /> Clear all
          </Button>
        )}
      </div>

      <DateRangeFilter
        from={filters.from}
        to={filters.to}
        onChange={({ from, to }) => onChange({ ...filters, from, to })}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {fields.map((f) => (
          <div key={f.key} className="min-w-0 space-y-1.5">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {f.label}
            </span>
            <FilterCombobox
              label={f.label}
              value={filters[f.key] || ""}
              options={f.options}
              onChange={(v) => set(f.key, v)}
              className="h-9 w-full"
            />
          </div>
        ))}
      </div>
    </section>
  );
}