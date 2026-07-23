import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

interface TablePaginationProps {
  page: number;
  pageSize: number;
  totalRows: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  className?: string;
  pageSizes?: readonly number[];
}

/**
 * Shared pagination footer for Marketing tables. Page + pageSize are owned by
 * the parent (typically URL-persisted via useUrlState). Auto-clamps the current
 * page back into range whenever the row count shrinks.
 */
export function TablePagination({
  page,
  pageSize,
  totalRows,
  onPageChange,
  onPageSizeChange,
  className,
  pageSizes = PAGE_SIZE_OPTIONS,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const clamped = Math.min(Math.max(1, page), totalPages);

  React.useEffect(() => {
    if (clamped !== page) onPageChange(clamped);
  }, [clamped, page, onPageChange]);

  const start = totalRows === 0 ? 0 : (clamped - 1) * pageSize + 1;
  const end = Math.min(totalRows, clamped * pageSize);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-t bg-muted/20 px-3 py-2 text-xs text-muted-foreground",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <span>Rows per page</span>
        <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
          <SelectTrigger className="h-7 w-[70px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizes.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-3">
        <span className="tabular-nums">
          {totalRows === 0
            ? "0 rows"
            : `${start.toLocaleString()}-${end.toLocaleString()} of ${totalRows.toLocaleString()}`}
        </span>
        <span className="hidden sm:inline tabular-nums">
          Page {clamped} of {totalPages}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            disabled={clamped <= 1}
            onClick={() => onPageChange(clamped - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            disabled={clamped >= totalPages}
            onClick={() => onPageChange(clamped + 1)}
            aria-label="Next page"
          >
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}