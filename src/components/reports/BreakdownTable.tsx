import { cn } from "@/lib/utils";

export interface BreakdownColumn {
  key: string;
  label: string;
  align?: "left" | "right";
  isBar?: boolean;
  barMax?: number;
  barTone?: "primary" | "success" | "destructive" | "warning";
  formatter?: (v: unknown) => string;
}

interface Props {
  title: string;
  subtitle?: string;
  columns: BreakdownColumn[];
  rows: Record<string, unknown>[];
}

export function BreakdownTable({ title, subtitle, columns, rows }: Props) {
  const primaryCol = columns[0];
  const secondaryCols = columns.slice(1);
  return (
    <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
      <div className="px-4 py-3 border-b border-border/40">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>

      {/* Mobile: stacked card list */}
      <ul className="md:hidden divide-y divide-border/40">
        {rows.map((row, i) => {
          const primaryVal = primaryCol ? row[primaryCol.key] : "";
          return (
            <li key={i} className="px-4 py-3 space-y-2">
              {primaryCol && (
                <p className="text-sm font-medium text-foreground truncate">
                  {primaryCol.formatter ? primaryCol.formatter(primaryVal) : String(primaryVal ?? "—")}
                </p>
              )}
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                {secondaryCols.map((c) => {
                  const val = row[c.key];
                  if (c.isBar && typeof val === "number") {
                    const max = c.barMax ?? Math.max(...rows.map((r) => Number(r[c.key]) || 0));
                    const pct = max > 0 ? (val / max) * 100 : 0;
                    const toneClass =
                      c.barTone === "destructive"
                        ? "bg-destructive/70"
                        : c.barTone === "success"
                          ? "bg-success/70"
                          : c.barTone === "warning"
                            ? "bg-warning/70"
                            : "bg-primary/70";
                    return (
                      <div key={c.key} className="col-span-2">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <dt>{c.label}</dt>
                          <dd className="text-foreground font-medium tabular-nums">
                            {c.formatter ? c.formatter(val) : String(val)}
                          </dd>
                        </div>
                        <div className="mt-1 h-1.5 bg-muted/40 rounded overflow-hidden">
                          <div className={cn("h-full rounded", toneClass)} style={{ width: `${Math.max(pct, 4)}%` }} />
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={c.key} className="flex items-center justify-between gap-2 text-[11px]">
                      <dt className="text-muted-foreground truncate">{c.label}</dt>
                      <dd className="text-foreground font-medium tabular-nums truncate">
                        {c.formatter ? c.formatter(val) : String(val ?? "—")}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </li>
          );
        })}
        {rows.length === 0 && (
          <li className="px-4 py-6 text-center text-xs text-muted-foreground italic">No data</li>
        )}
      </ul>

      <table className="hidden md:table w-full text-sm">
        <thead>
          <tr className="border-b border-border/40 bg-muted/20">
            {columns.map((c) => (
              <th
                key={c.key}
                className={cn(
                  "px-4 py-2 font-medium text-muted-foreground text-[11px] uppercase tracking-wide",
                  c.align === "right" ? "text-right" : "text-left",
                )}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/30 last:border-b-0 hover:bg-muted/10">
              {columns.map((c) => {
                const val = row[c.key];
                if (c.isBar && typeof val === "number") {
                  const max = c.barMax ?? Math.max(...rows.map((r) => Number(r[c.key]) || 0));
                  const pct = max > 0 ? (val / max) * 100 : 0;
                  const toneClass =
                    c.barTone === "destructive"
                      ? "bg-destructive/70"
                      : c.barTone === "success"
                        ? "bg-success/70"
                        : c.barTone === "warning"
                          ? "bg-warning/70"
                          : "bg-primary/70";
                  return (
                    <td key={c.key} className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-4 bg-muted/40 rounded overflow-hidden">
                          <div
                            className={cn("h-full rounded", toneClass)}
                            style={{ width: `${Math.max(pct, 4)}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-foreground tabular-nums w-10 text-right">
                          {c.formatter ? c.formatter(val) : val}
                        </span>
                      </div>
                    </td>
                  );
                }
                return (
                  <td
                    key={c.key}
                    className={cn(
                      "px-4 py-2 text-xs",
                      c.align === "right" ? "text-right tabular-nums" : "text-left",
                      typeof val === "number" || /^\d/.test(String(val))
                        ? "text-foreground font-medium"
                        : "text-muted-foreground",
                    )}
                  >
                    {c.formatter ? c.formatter(val) : String(val ?? "—")}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
