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
  return (
    <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
      <div className="px-4 py-3 border-b border-border/40">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <table className="w-full text-sm">
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
