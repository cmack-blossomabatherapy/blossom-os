import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PrimaryTableColumn<T> {
  key: string;
  label: string;
  align?: "left" | "right";
  render: (row: T) => ReactNode;
}

/**
 * Actionable operational table. Rows are not a data dump — each row is a
 * drilldown entry point into the underlying CentralReach source rows.
 */
export function PrimaryTable<T>({
  title,
  subtitle,
  columns,
  rows,
  rowKey,
  onRowClick,
  emptyLabel = "No rows match the current filters.",
  maxRows = 100,
  className,
  actions,
}: {
  title: string;
  subtitle?: string;
  columns: PrimaryTableColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  emptyLabel?: string;
  maxRows?: number;
  className?: string;
  /** Optional header controls, e.g. a "Log event" action. */
  actions?: React.ReactNode;
}) {
  const visible = rows.slice(0, maxRows);
  return (
    <article
      data-testid="report-table"
      className={cn("rounded-2xl border border-border/60 bg-card", className)}
    >
      <div className="flex items-baseline justify-between gap-2 border-b border-border/60 px-4 py-3">
        <div>
          <h3 className="text-[13px] font-semibold tracking-tight">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            {rows.length.toLocaleString("en-US")} rows
          </span>
          {actions}
        </div>
      </div>
      <div className="max-h-[620px] overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-20 bg-card shadow-[0_1px_0_0_hsl(var(--border))]">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    "whitespace-nowrap bg-card px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground",
                    c.align === "right" ? "text-right" : "text-left",
                  )}
                >
                  {c.label}
                </th>
              ))}
              {onRowClick && <th className="w-8 bg-card" />}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (onRowClick ? 1 : 0)}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              visible.map((row, i) => (
                <tr
                  key={rowKey(row, i)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "border-t border-border/50",
                    onRowClick && "cursor-pointer hover:bg-muted/40",
                  )}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        "whitespace-nowrap px-3 py-2",
                        c.align === "right" && "text-right tabular-nums",
                      )}
                    >
                      {c.render(row)}
                    </td>
                  ))}
                  {onRowClick && (
                    <td className="px-2 text-muted-foreground">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {rows.length > maxRows && (
        <p className="border-t border-border/60 px-4 py-2 text-[11px] text-muted-foreground">
          Showing the top {maxRows.toLocaleString("en-US")} of{" "}
          {rows.length.toLocaleString("en-US")} rows. Export the CSV for the full list.
        </p>
      )}
    </article>
  );
}