import { ReactNode, useMemo } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * One active filter criterion shown as a removable chip.
 * `onRemove` only clears this criterion — date range and saved view are
 * preserved by the host page (they live outside the chips array).
 */
export interface FilterCriterion {
  /** Stable id, e.g. `status:open` */
  id: string;
  /** Field label, e.g. "Status" */
  field?: string;
  /** Display value, e.g. "Open" */
  value: string;
  /** Removes just this criterion. */
  onRemove: () => void;
}

export interface FilterBarProps {
  /** Active criteria. The Filters-button badge count == criteria.length. */
  criteria: FilterCriterion[];
  /** Opens the filter sheet/popover (host-owned). */
  onOpenFilters: () => void;
  /** Clears every chip in one click. Date range / saved view stay intact. */
  onClearAll?: () => void;
  /** Optional slot for a date-range picker (rendered to the right). */
  dateRangeSlot?: ReactNode;
  /** Optional slot for a saved-view dropdown (rendered to the right). */
  savedViewSlot?: ReactNode;
  /** Extra trailing controls (export, refresh, etc.) */
  trailing?: ReactNode;
  className?: string;
  /** Override the Filters button label (default: "Filters"). */
  buttonLabel?: string;
}

/**
 * Reusable filter bar:
 *   [ Filters (3) ] [chip] [chip] [chip] [Clear all]    [date range] [saved view]
 *
 * The badge count is derived from `criteria.length`, so it updates instantly
 * the moment any chip is added or removed — no extra wiring required.
 */
export function FilterBar({
  criteria,
  onOpenFilters,
  onClearAll,
  dateRangeSlot,
  savedViewSlot,
  trailing,
  className,
  buttonLabel = "Filters",
}: FilterBarProps) {
  const count = criteria.length;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-card/60 p-2 shadow-sm",
        className,
      )}
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onOpenFilters}
        className="h-8 gap-1.5 text-xs"
        aria-label={`${buttonLabel}${count ? ` (${count} active)` : ""}`}
      >
        <Filter className="h-3.5 w-3.5" />
        {buttonLabel}
        {count > 0 && (
          <Badge
            variant="secondary"
            className="ml-1 h-5 min-w-[1.25rem] justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground"
            data-testid="filter-bar-count"
          >
            {count}
          </Badge>
        )}
      </Button>

      <ChipList criteria={criteria} />

      {count > 0 && onClearAll && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          Clear all
        </Button>
      )}

      {(dateRangeSlot || savedViewSlot || trailing) && (
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {dateRangeSlot}
          {savedViewSlot}
          {trailing}
        </div>
      )}
    </div>
  );
}

function ChipList({ criteria }: { criteria: FilterCriterion[] }) {
  // Memoize the rendered chips so adding/removing one criterion only re-renders
  // the chip list — sibling controls (date range, saved view) are untouched.
  const chips = useMemo(
    () =>
      criteria.map((c) => (
        <FilterChip key={c.id} criterion={c} />
      )),
    [criteria],
  );
  if (criteria.length === 0) return null;
  return <div className="flex flex-wrap items-center gap-1.5">{chips}</div>;
}

function FilterChip({ criterion }: { criterion: FilterCriterion }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-secondary/60 py-0.5 pl-2.5 pr-1 text-xs text-foreground">
      {criterion.field && (
        <span className="text-muted-foreground">{criterion.field}:</span>
      )}
      <span className="font-medium">{criterion.value}</span>
      <button
        type="button"
        onClick={criterion.onRemove}
        className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        aria-label={`Remove ${criterion.field ? `${criterion.field} ` : ""}${criterion.value}`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}