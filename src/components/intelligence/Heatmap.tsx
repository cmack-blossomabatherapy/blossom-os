import { cn } from "@/lib/utils";

interface HeatmapProps {
  rows: { label: string; values: number[] }[];
  columns: string[];
  className?: string;
}

export function Heatmap({ rows, columns, className }: HeatmapProps) {
  const tone = (v: number) => {
    if (v >= 85) return "bg-success/80 text-white";
    if (v >= 70) return "bg-primary/70 text-white";
    if (v >= 55) return "bg-warning/70 text-warning-foreground";
    return "bg-destructive/70 text-white";
  };
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="text-left font-medium text-muted-foreground py-1.5 pr-3">Department</th>
            {columns.map((c) => (
              <th key={c} className="px-1 text-center font-medium text-muted-foreground py-1.5">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <td className="py-1 pr-3 font-medium text-foreground whitespace-nowrap">{r.label}</td>
              {r.values.map((v, i) => (
                <td key={i} className="px-0.5 py-0.5">
                  <div className={cn("flex h-9 items-center justify-center rounded-md text-[11px] font-medium", tone(v))}>{v}</div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
