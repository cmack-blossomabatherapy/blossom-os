import * as React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type FilterOption = { value: string; label: string };

export type FilterDef = {
  key: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: FilterOption[];
  /** The default value that represents "no filter". Defaults to "all". */
  defaultValue?: string;
  width?: number;
};

interface TableFilterBarProps {
  search?: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
  };
  filters?: FilterDef[];
  resultCount?: number;
  totalCount?: number;
  onClear?: () => void;
  className?: string;
  extra?: React.ReactNode;
  sticky?: boolean;
}

/**
 * Shared filter bar for every table across the Marketing surfaces. Renders
 * a search input on the left, a chip row of Select filters in the middle,
 * and a result count + Clear affordance on the right.
 */
export function TableFilterBar({
  search,
  filters = [],
  resultCount,
  totalCount,
  onClear,
  className,
  extra,
  sticky,
}: TableFilterBarProps) {
  const activeFilters = filters.filter(
    (f) => f.value && f.value !== (f.defaultValue ?? "all"),
  );
  const hasActive = activeFilters.length > 0 || Boolean(search?.value);

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card/60 backdrop-blur-sm p-2.5 space-y-2",
        sticky && "sticky top-0 z-10",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        {search && (
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              placeholder={search.placeholder ?? "Search…"}
              className="pl-8 h-9 text-sm"
            />
          </div>
        )}
        {filters.map((f) => {
          const isActive = f.value && f.value !== (f.defaultValue ?? "all");
          return (
            <Select key={f.key} value={f.value} onValueChange={f.onChange}>
              <SelectTrigger
                className={cn(
                  "h-9 text-xs",
                  isActive && "border-primary/40 bg-primary/5 text-foreground",
                )}
                style={{ width: f.width ?? undefined, minWidth: f.width ? undefined : 130 }}
              >
                <span className="text-muted-foreground mr-1">{f.label}:</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {f.options.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        })}
        {extra}
        <div className="ml-auto flex items-center gap-2 text-[11px] text-muted-foreground">
          {typeof resultCount === "number" && (
            <span className="tabular-nums">
              {resultCount}
              {typeof totalCount === "number" && totalCount !== resultCount ? ` of ${totalCount}` : ""}
            </span>
          )}
          {hasActive && onClear && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="size-3" /> Clear
            </button>
          )}
        </div>
      </div>
      {hasActive && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mr-1">
            Active
          </span>
          {search?.value && (
            <button
              type="button"
              onClick={() => search.onChange("")}
              className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[11px] text-primary hover:bg-primary/10"
              aria-label="Clear search"
            >
              <span className="font-medium">Search:</span> {search.value}
              <X className="size-3" />
            </button>
          )}
          {activeFilters.map((f) => {
            const opt = f.options.find((o) => o.value === f.value);
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => f.onChange(f.defaultValue ?? "all")}
                className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[11px] text-primary hover:bg-primary/10"
                aria-label={`Remove ${f.label} filter`}
              >
                <span className="font-medium">{f.label}:</span> {opt?.label ?? f.value}
                <X className="size-3" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}