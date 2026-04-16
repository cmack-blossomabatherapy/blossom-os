import { Calendar, DollarSign } from "lucide-react";

interface ForecastItem {
  label: string;
  count: number;
  detail: string;
}

const forecastItems: ForecastItem[] = [
  { label: "Pending Start Date", count: 5, detail: "Ready to begin services" },
  { label: "Staffing Needed", count: 13, detail: "Awaiting RBT match" },
  { label: "Pending Treatment Auth", count: 7, detail: "Auth in progress" },
  { label: "In Assessment / QA", count: 15, detail: "Nearing readiness" },
];

const projected = forecastItems.reduce((s, i) => s + i.count, 0);

export function ForecastPanel() {
  return (
    <div className="bg-card rounded-xl border border-border/60 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-4 w-4 text-info" />
        <h3 className="text-sm font-semibold text-foreground">30-Day Forecast</h3>
      </div>
      <div className="space-y-2.5">
        {forecastItems.map((item) => (
          <div key={item.label} className="flex items-center justify-between py-1.5">
            <div>
              <p className="text-xs font-medium text-foreground">{item.label}</p>
              <p className="text-[10px] text-muted-foreground">{item.detail}</p>
            </div>
            <span className="text-lg font-bold text-foreground">{item.count}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <DollarSign className="h-3.5 w-3.5 text-success" />
          <span className="text-xs font-medium text-muted-foreground">Projected New Starts</span>
        </div>
        <span className="text-xl font-bold text-success">{projected}</span>
      </div>
    </div>
  );
}
