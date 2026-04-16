import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiItem {
  label: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  detail?: string;
}

interface KpiStripProps {
  title: string;
  items: KpiItem[];
}

export function KpiStrip({ title, items }: KpiStripProps) {
  return (
    <div className="space-y-2">
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="kpi-card flex flex-col gap-1 cursor-pointer group"
          >
            <span className="text-[11px] font-medium text-muted-foreground leading-tight">{item.label}</span>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-foreground tracking-tight leading-none">{item.value}</span>
              {item.trend && (
                <span className={cn(
                  "flex items-center gap-0.5 text-[11px] font-semibold pb-0.5",
                  item.trend === "up" && "text-success",
                  item.trend === "down" && "text-destructive",
                  item.trend === "neutral" && "text-muted-foreground",
                )}>
                  {item.trend === "up" && <TrendingUp className="h-3 w-3" />}
                  {item.trend === "down" && <TrendingDown className="h-3 w-3" />}
                  {item.trend === "neutral" && <Minus className="h-3 w-3" />}
                  {item.change}
                </span>
              )}
            </div>
            {item.detail && (
              <span className="text-[10px] text-muted-foreground">{item.detail}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
