import * as React from "react";
import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useUrlState } from "@/hooks/useUrlState";

export type FilterOption = { value: string; label: string; count?: number };

export type FilterDef = {
  key: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: FilterOption[];
  /** The default value that represents "no filter". Defaults to "all". */
  defaultValue?: string;
  width?: number;
  /** Optional data source to compute the count shown on active filter chips. */
  countSource?: unknown[];
  /** Optional accessor to match a row against an active option value. */
  countValue?: (row: unknown) => string | string[] | null | undefined;
  /** When true, the filter supports multiple comma-separated values and shows per-group "Select all" / "Clear" actions. */
  multi?: boolean;
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
  // Fall back to a built-in reset that clears search + every filter to its
  // default, so every filter bar exposes a Clear-all control without callers
  // having to wire one up.
  const handleClearAll =
    onClear ??
    (() => {
      search?.onChange("");
      filters.forEach((f) => f.onChange(f.defaultValue ?? "all"));
    });
  const handleClearFilters = () => {
    filters.forEach((f) => f.onChange(f.defaultValue ?? "all"));
  };

  const [collapsedGroups, setCollapsedGroups] = useUrlState("fcg", "");
  const collapsedSet = React.useMemo(
    () =>
      new Set(
        collapsedGroups
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((s) => decodeURIComponent(s)),
      ),
    [collapsedGroups],
  );
  const toggleCollapsed = React.useCallback(
    (label: string) => {
      const next = new Set(collapsedSet);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      setCollapsedGroups(
        Array.from(next)
          .map((l) => encodeURIComponent(l))
          .join(","),
      );
    },
    [collapsedSet, setCollapsedGroups],
  );

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
              placeholder={search.placeholder ?? "Search..."}
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
                  "h-9 text-xs w-auto",
                  isActive && "border-primary/40 bg-primary/5 text-foreground",
                )}
                style={{ width: f.width ?? undefined, minWidth: f.width ? undefined : 140, maxWidth: 240 }}
              >
                <span className="text-muted-foreground mr-1 whitespace-nowrap">{f.label}:</span>
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
          {hasActive && (
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
              aria-label="Clear all filters"
            >
              <X className="size-3" /> Clear all
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
            <FilterChipGroup
              label="Search"
              values={[{ key: "search", label: search.value, onRemove: () => search.onChange("") }]}
              onClearGroup={() => search.onChange("")}
              collapsed={false}
            />
          )}
          {groupActiveFilters(activeFilters).map((group) => (
            <FilterChipGroup
              key={group.label}
              label={group.label}
              values={group.values}
              onClearGroup={group.onClearGroup}
              totalCount={group.totalCount}
              totalOptions={group.totalOptions}
              collapsed={collapsedSet.has(group.label)}
              onToggle={() => toggleCollapsed(group.label)}
              isMulti={group.isMulti}
              onSelectAll={group.onSelectAll}
              allSelected={group.allSelected}
            />
          ))}
          {activeFilters.length > 0 && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="ml-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
              aria-label="Clear all filter groups"
            >
              Clear all filter groups
            </button>
          )}
        </div>
      )}
    </div>
  );
}

type ChipValue = { key: string; label: string; count?: number; onRemove: () => void };

function countMatches(f: FilterDef, value: string): number | undefined {
  if (!f.countSource || !f.countValue) return undefined;
  let count = 0;
  for (const row of f.countSource) {
    const v = f.countValue(row);
    if (v == null) continue;
    if (Array.isArray(v)) {
      if (v.includes(value)) count++;
    } else if (v === value) {
      count++;
    }
  }
  return count;
}

function groupUnionCount(f: FilterDef, values: string[]): number | undefined {
  if (!f.countSource || !f.countValue) return undefined;
  let count = 0;
  for (const row of f.countSource) {
    const v = f.countValue(row);
    if (v == null) continue;
    if (Array.isArray(v)) {
      if (values.some((val) => v.includes(val))) count++;
    } else if (values.includes(v)) {
      count++;
    }
  }
  return count;
}

function groupActiveFilters(filters: FilterDef[]) {
  // Group by human label so multiple FilterDefs targeting the same field
  // (or a single multi-value filter using comma-separated values) collapse
  // into one chip group that can be cleared in a single click.
  type Bucket = {
    label: string;
    values: ChipValue[];
    clears: Array<() => void>;
    totals: (number | undefined)[];
    filterCount: number;
    isMulti: boolean;
    selectAllHandlers: Array<() => void>;
    multiFilterCount: number;
    allSelectedCount: number;
    totalOptions: number;
  };
  const groups = new Map<string, Bucket>();
  for (const f of filters) {
    const def = f.defaultValue ?? "all";
    const reset = () => f.onChange(def);
    const raw = String(f.value ?? "");
    const parts = raw.includes(",") ? raw.split(",").map((p) => p.trim()).filter(Boolean) : [raw];
    const isMulti = f.multi === true;
    const allSelectable = f.options.filter((o) => o.value !== def).map((o) => o.value);
    const allSelected = isMulti && allSelectable.length > 0 && allSelectable.every((v) => parts.includes(v));
    const onSelectAll = isMulti && allSelectable.length > 0 ? () => f.onChange(allSelectable.join(",")) : undefined;

    const bucket = groups.get(f.label) ?? {
      label: f.label,
      values: [],
      clears: [],
      totals: [],
      filterCount: 0,
      isMulti: false,
      selectAllHandlers: [],
      multiFilterCount: 0,
      allSelectedCount: 0,
      totalOptions: 0,
    };
    bucket.clears.push(reset);
    bucket.totals.push(groupUnionCount(f, parts));
    bucket.filterCount++;
    bucket.isMulti ||= isMulti;
    if (onSelectAll) bucket.selectAllHandlers.push(onSelectAll);
    bucket.multiFilterCount += isMulti ? 1 : 0;
    bucket.allSelectedCount += allSelected ? 1 : 0;
    bucket.totalOptions += allSelectable.length;
    parts.forEach((part, idx) => {
      const opt = f.options.find((o) => o.value === part);
      bucket.values.push({
        key: `${f.key}:${part}:${idx}`,
        label: opt?.label ?? part,
        count: countMatches(f, part),
        onRemove: () => {
          if (parts.length <= 1) {
            reset();
          } else {
            f.onChange(parts.filter((p) => p !== part).join(","));
          }
        },
      });
    });
    groups.set(f.label, bucket);
  }
  return Array.from(groups.values()).map((g) => {
    const totalCount =
      g.filterCount === 1 && g.totals[0] != null ? g.totals[0] : undefined;
    return {
      label: g.label,
      values: g.values,
      onClearGroup: () => g.clears.forEach((fn) => fn()),
      totalCount,
      isMulti: g.isMulti,
      onSelectAll: g.selectAllHandlers.length > 0 ? () => g.selectAllHandlers.forEach((fn) => fn()) : undefined,
      allSelected: g.multiFilterCount > 0 && g.allSelectedCount === g.multiFilterCount,
      totalOptions: g.totalOptions,
    };
  });
}


function FilterChipGroup({
  label,
  values,
  onClearGroup,
  totalCount,
  totalOptions = 0,
  collapsed: controlledCollapsed,
  onToggle,
  isMulti,
  onSelectAll,
  allSelected,
}: {
  label: string;
  values: ChipValue[];
  onClearGroup: () => void;
  totalCount?: number;
  totalOptions?: number;
  collapsed?: boolean;
  onToggle?: () => void;
  isMulti?: boolean;
  onSelectAll?: () => void;
  allSelected?: boolean;
}) {
  const [internalCollapsed, setInternalCollapsed] = React.useState(false);
  const collapsed = controlledCollapsed ?? internalCollapsed;
  const hasMultipleValues = values.length > 1;
  const canSelectAll = isMulti && onSelectAll && !allSelected && values.length > 0;
  const handleToggle = () => {
    if (onToggle) onToggle();
    else setInternalCollapsed((c) => !c);
  };

  const selectedCount = values.length;
  const showPartialCount = totalOptions > 0 && !allSelected && selectedCount !== totalOptions;

  return (
    <span
      className={cn(
        "inline-flex items-stretch overflow-hidden rounded-full border text-[11px]",
        allSelected
          ? "border-emerald-300/50 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:text-emerald-400"
          : "border-primary/20 bg-primary/5 text-primary",
      )}
    >
      <span className="inline-flex items-center gap-1 px-2 py-0.5 font-medium">
        {label}:
        {collapsed ? (
          <span className="inline-flex items-center gap-1 font-normal">
            {allSelected ? (
              <span>All selected</span>
            ) : showPartialCount ? (
              <span>{selectedCount} of {totalOptions} selected</span>
            ) : (
              <span>{selectedCount} selected</span>
            )}
            {totalCount != null && (
              <span
                className={cn(
                  "ml-0.5 inline-flex h-3.5 min-w-[1.1rem] items-center justify-center rounded-full px-1 text-[9px] font-semibold tabular-nums",
                  allSelected
                    ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                    : "bg-primary/20 text-primary/90",
                )}
              >
                {totalCount}
              </span>
            )}
          </span>
        ) : (
          values.map((v, i) => (
            <span key={v.key} className="inline-flex items-center gap-0.5 font-normal">
              {i > 0 && <span className={cn("", allSelected ? "text-emerald-400/60" : "text-primary/40")}>,</span>}
              <span>{v.label}</span>
              {v.count != null && (
                <span
                  className={cn(
                    "ml-0.5 inline-flex h-3.5 min-w-[1.1rem] items-center justify-center rounded-full px-1 text-[9px] font-semibold tabular-nums",
                    allSelected
                      ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                      : "bg-primary/20 text-primary/90",
                  )}
                >
                  {v.count}
                </span>
              )}
              {hasMultipleValues && (
                <button
                  type="button"
                  onClick={v.onRemove}
                  className={cn(
                    "rounded-full p-0.5",
                    allSelected ? "hover:bg-emerald-500/15" : "hover:bg-primary/15",
                  )}
                  aria-label={`Remove ${label}: ${v.label}`}
                >
                  <X className="size-2.5" />
                </button>
              )}
            </span>
          ))
        )}
      </span>
      {canSelectAll && (
        <button
          type="button"
          onClick={onSelectAll}
          className={cn(
            "inline-flex items-center border-l px-2 text-[11px] font-medium",
            allSelected
              ? "border-emerald-300/40 hover:bg-emerald-500/15"
              : "border-primary/20 hover:bg-primary/10",
          )}
          aria-label={`Select all ${label}`}
        >
          Select all
        </button>
      )}
      {hasMultipleValues && (
        <button
          type="button"
          onClick={handleToggle}
          className={cn(
            "inline-flex items-center border-l px-1.5",
            allSelected
              ? "border-emerald-300/40 hover:bg-emerald-500/15"
              : "border-primary/20 hover:bg-primary/10",
          )}
          aria-label={`${collapsed ? "Expand" : "Collapse"} ${label} filters`}
        >
          {collapsed ? <ChevronDown className="size-3" /> : <ChevronUp className="size-3" />}
        </button>
      )}
      <button
        type="button"
        onClick={onClearGroup}
        className={cn(
          "inline-flex items-center border-l px-2",
          allSelected
            ? "border-emerald-300/40 hover:bg-emerald-500/15"
            : "border-primary/20 hover:bg-primary/10",
        )}
        aria-label={`Clear ${label} filter`}
      >
        {isMulti ? (
          <span className="text-[11px] font-medium">Clear</span>
        ) : (
          <X className="size-3" />
        )}
      </button>
    </span>
  );
}
