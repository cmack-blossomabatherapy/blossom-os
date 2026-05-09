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
      <h4 className="hidden text-[11px] font-semibold uppercase tracking-wider text-muted-foreground md:block">{title}</h4>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-4 md:gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="kpi-card group flex cursor-pointer flex-col gap-1 active:scale-[0.99]"
          >
            <span className="text-xs font-medium leading-tight text-muted-foreground md:text-[11px]">{item.label}</span>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold leading-none tracking-tight text-foreground md:text-2xl">{item.value}</span>
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
              <span className="text-[11px] text-muted-foreground md:text-[10px]">{item.detail}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
